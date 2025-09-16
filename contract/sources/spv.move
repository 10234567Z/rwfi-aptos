module rwfi_addr::spv {
    use aptos_std::signer;
    use rwfi_addr::invoice_coin;
    use rwfi_addr::accrued_income_registry;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_account;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use aptos_framework::resource_account;

    // Error codes
    /// Invalid admin signer
    const E_INVALID_ADMIN_SIGNER: u64 = 1;
    /// Income not found
    const E_INCOME_NOT_FOUND: u64 = 2;
    /// Insufficient funds in investment pool
    const E_INSUFFICIENT_FUNDS: u64 = 3;
    /// Income already funded
    const E_INCOME_ALREADY_FUNDED: u64 = 4;
    /// Invalid funding percentage
    const E_INVALID_FUNDING_PERCENTAGE: u64 = 5;
    /// Invalid withdrawal amount
    const E_INVALID_WITHDRAWAL_AMOUNT: u64 = 6;
    /// No INV tokens to withdraw against
    const E_NO_INV_TOKENS: u64 = 7;
    /// No returns available for withdrawal
    const E_NO_RETURNS_AVAILABLE: u64 = 8;
    /// Resource account not initialized
    const E_RESOURCE_ACCOUNT_NOT_INITIALIZED: u64 = 9;

    // Constants
    const FUNDING_PERCENTAGE: u64 = 90; // Fund 90% of income amount

    struct InvestmentPool has key {
        total_apt_invested: u64, // Total APT invested by all investors
        total_collections: u64, // Total APT collected from income payments
        available_for_funding: u64, // APT available to fund new incomes
        admin: address,
        total_funded_incomes: u64, // Count of funded incomes
        treasury_cap: account::SignerCapability, // Capability to sign for the treasury account
    }

    struct Investor has store, copy, drop {
        total_invested: u64, // Total APT invested
        total_withdrawn: u64, // Total returns withdrawn
        inv_tokens: u64, // INV tokens held (for withdrawal calculation)
        last_withdrawal: u64, // Timestamp of last withdrawal
    }

    struct FundedIncome has store, copy, drop {
        supplier_addr: address,
        income_id: u64,
        funded_amount: u64, // APT amount funded (90% of income)
        expected_collection: u64, // Full income amount expected
        funded_at: u64,
        collected: bool,
        collected_at: u64,
        collected_amount: u64,
    }

    struct InvestorRegistry has key {
        investors: Table<address, Investor>,
        total_investors: u64,
    }

    struct FundedIncomeRegistry has key {
        funded_incomes: Table<u64, FundedIncome>,
        funded_count: u64,
    }

    // Initialize the SPV system
    fun init_module(admin: &signer) {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        let admin_address = signer::address_of(admin);
        
        // Create resource account for treasury operations
        let (treasury_signer, treasury_cap) = account::create_resource_account(admin, b"SPV_TREASURY");
        
        let pool = InvestmentPool {
            total_apt_invested: 0,
            total_collections: 0,
            available_for_funding: 0,
            admin: admin_address,
            total_funded_incomes: 0,
            treasury_cap,
        };

        let investor_registry = InvestorRegistry {
            investors: table::new(),
            total_investors: 0,
        };

        let funded_registry = FundedIncomeRegistry {
            funded_incomes: table::new(),
            funded_count: 0,
        };

        move_to(admin, pool);
        move_to(admin, investor_registry);
        move_to(admin, funded_registry);
    }

    // Investors invest APT and get INV tokens
    public entry fun invest_apt(
        investor: &signer,
        amount: u64
    ) acquires InvestmentPool, InvestorRegistry {
        let investor_addr = signer::address_of(investor);
        
        // Get treasury address from the capability
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        let treasury_signer = account::create_signer_with_capability(&pool.treasury_cap);
        let treasury_addr = signer::address_of(&treasury_signer);
        
        // Transfer APT from investor to treasury account
        aptos_account::transfer(investor, treasury_addr, amount);
        
        // Update investment pool
        let pool_mut = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        pool_mut.total_apt_invested = pool_mut.total_apt_invested + amount;
        pool_mut.available_for_funding = pool_mut.available_for_funding + amount;
        
        // Update investor registry
        let registry = borrow_global_mut<InvestorRegistry>(@rwfi_addr);
        if (table::contains(&registry.investors, investor_addr)) {
            let investor_data = table::borrow_mut(&mut registry.investors, investor_addr);
            investor_data.total_invested = investor_data.total_invested + amount;
        } else {
            table::upsert(&mut registry.investors, investor_addr, Investor {
                total_invested: amount,
                total_withdrawn: 0,
                inv_tokens: 0,
                last_withdrawal: 0,
            });
            registry.total_investors = registry.total_investors + 1;
        };
        
        // Mint INV tokens to investor (1:1 ratio with APT for now)
        invoice_coin::mint_to_primary_store(@rwfi_addr, investor_addr, amount);
        
        // Update investor's INV token count
        let investor_data = table::borrow_mut(&mut registry.investors, investor_addr);
        investor_data.inv_tokens = investor_data.inv_tokens + amount;
    }

    // Admin funds an accrued income (90% of amount)
    public entry fun fund_accrued_income(
        admin: &signer,
        supplier_addr: address,
        income_id: u64
    ) acquires InvestmentPool, FundedIncomeRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        // Get income details
        let income = accrued_income_registry::get_income(supplier_addr, income_id);
        let funding_amount = (accrued_income_registry::get_income_amount(&income) * FUNDING_PERCENTAGE) / 100;
        
        // Check if we have enough funds
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        assert!(pool.available_for_funding >= funding_amount, E_INSUFFICIENT_FUNDS);
        
        // Transfer APT to supplier from treasury account
        let treasury_signer = account::create_signer_with_capability(&pool.treasury_cap);
        aptos_account::transfer(&treasury_signer, supplier_addr, funding_amount);
        
        // Update pool
        pool.available_for_funding = pool.available_for_funding - funding_amount;
        pool.total_funded_incomes = pool.total_funded_incomes + 1;
        
        // Record funded income
        let funded_registry = borrow_global_mut<FundedIncomeRegistry>(@rwfi_addr);
        funded_registry.funded_count = funded_registry.funded_count + 1;
        
        let funded_income = FundedIncome {
            supplier_addr,
            income_id,
            funded_amount: funding_amount,
            expected_collection: accrued_income_registry::get_income_amount(&income),
            funded_at: timestamp::now_seconds(),
            collected: false,
            collected_at: 0,
            collected_amount: 0,
        };
        
        table::upsert(&mut funded_registry.funded_incomes, funded_registry.funded_count, funded_income);
        
        // Mark income as funded in registry
        accrued_income_registry::mark_income_funded(supplier_addr, income_id, funding_amount);
    }

    // Record income collection when payment comes in
    public entry fun record_income_collection(
        admin: &signer,
        funded_income_id: u64,
        collected_amount: u64
    ) acquires InvestmentPool, FundedIncomeRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        let funded_registry = borrow_global_mut<FundedIncomeRegistry>(@rwfi_addr);
        assert!(table::contains(&funded_registry.funded_incomes, funded_income_id), E_INCOME_NOT_FOUND);
        
        let funded_income = table::borrow_mut(&mut funded_registry.funded_incomes, funded_income_id);
        assert!(!funded_income.collected, E_INCOME_ALREADY_FUNDED);
        
        // Update funded income record
        funded_income.collected = true;
        funded_income.collected_at = timestamp::now_seconds();
        funded_income.collected_amount = collected_amount;
        
        // Update investment pool with collections
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        pool.total_collections = pool.total_collections + collected_amount;
        
        // Mark as collected in income registry
        accrued_income_registry::mark_income_collected(funded_income.supplier_addr, funded_income.income_id);
    }

    // Investors withdraw their share of returns
    public entry fun withdraw_returns(
        investor: &signer,
        inv_tokens_to_redeem: u64
    ) acquires InvestmentPool, InvestorRegistry {
        let investor_addr = signer::address_of(investor);
        
        let registry = borrow_global_mut<InvestorRegistry>(@rwfi_addr);
        assert!(table::contains(&registry.investors, investor_addr), E_NO_INV_TOKENS);
        
        let investor_data = table::borrow_mut(&mut registry.investors, investor_addr);
        assert!(investor_data.inv_tokens >= inv_tokens_to_redeem, E_INVALID_WITHDRAWAL_AMOUNT);
        
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        assert!(pool.total_collections > 0, E_NO_RETURNS_AVAILABLE);
        
        // Calculate withdrawal amount based on INV tokens
        // Formula: (inv_tokens_to_redeem / total_inv_supply) * total_collections
        let total_inv_supply = invoice_coin::get_total_supply();
        let withdrawal_amount = (inv_tokens_to_redeem * pool.total_collections) / total_inv_supply;
        
        assert!(withdrawal_amount > 0, E_INVALID_WITHDRAWAL_AMOUNT);
        
        // Burn INV tokens
        invoice_coin::burn_from_primary_store(@rwfi_addr, investor_addr, inv_tokens_to_redeem);
        
        // Transfer APT to investor from treasury account
        let treasury_signer = account::create_signer_with_capability(&pool.treasury_cap);
        aptos_account::transfer(&treasury_signer, investor_addr, withdrawal_amount);
        
        // Update pool to reflect withdrawal
        let pool_mut = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        assert!(pool_mut.total_collections >= withdrawal_amount, E_INSUFFICIENT_FUNDS);
        pool_mut.total_collections = pool_mut.total_collections - withdrawal_amount;
        
        // Update investor data
        investor_data.inv_tokens = investor_data.inv_tokens - inv_tokens_to_redeem;
        investor_data.total_withdrawn = investor_data.total_withdrawn + withdrawal_amount;
        investor_data.last_withdrawal = timestamp::now_seconds();
    }

    // Helper function to get treasury address
    #[view]
    public fun get_treasury_address(): address acquires InvestmentPool {
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        let treasury_signer = account::create_signer_with_capability(&pool.treasury_cap);
        signer::address_of(&treasury_signer)
    }

    // View functions
    #[view]
    public fun get_pool_stats(): (u64, u64, u64, u64, u64) acquires InvestmentPool {
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        (
            pool.total_apt_invested,
            pool.total_collections,
            pool.available_for_funding,
            pool.total_funded_incomes,
            0 // Reserved for future use
        )
    }

    #[view]
    public fun get_investor_info(investor_addr: address): (bool, u64, u64, u64, u64) acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        if (table::contains(&registry.investors, investor_addr)) {
            let investor = table::borrow(&registry.investors, investor_addr);
            (true, investor.total_invested, investor.total_withdrawn, investor.inv_tokens, investor.last_withdrawal)
        } else {
            (false, 0, 0, 0, 0)
        }
    }

    #[view]
    public fun get_funded_income(funded_income_id: u64): FundedIncome acquires FundedIncomeRegistry {
        let registry = borrow_global<FundedIncomeRegistry>(@rwfi_addr);
        assert!(table::contains(&registry.funded_incomes, funded_income_id), E_INCOME_NOT_FOUND);
        *table::borrow(&registry.funded_incomes, funded_income_id)
    }

    #[view]
    public fun calculate_withdrawal_amount(investor_addr: address, inv_tokens: u64): u64 acquires InvestmentPool, InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        if (!table::contains(&registry.investors, investor_addr)) {
            return 0
        };
        
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        if (pool.total_collections == 0) {
            return 0
        };
        
        let total_inv_supply = invoice_coin::get_total_supply();
        if (total_inv_supply == 0) {
            return 0
        };
        
        (inv_tokens * pool.total_collections) / total_inv_supply
    }
}
