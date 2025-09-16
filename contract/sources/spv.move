module rwfi_addr::spv {
    use aptos_std::signer;
    use rwfi_addr::invoice_coin;
    use rwfi_addr::accrued_income_registry;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_account;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use std::vector;

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
    /// Risk score too low for funding
    const E_RISK_SCORE_TOO_LOW: u64 = 10;
    /// Supplier exposure limit exceeded
    const E_SUPPLIER_EXPOSURE_EXCEEDED: u64 = 11;
    /// Industry concentration limit exceeded
    const E_INDUSTRY_CONCENTRATION_EXCEEDED: u64 = 12;
    /// Supplier not risk assessed
    const E_SUPPLIER_NOT_RISK_ASSESSED: u64 = 13;
    /// Default not found
    const E_DEFAULT_NOT_FOUND: u64 = 14;
    /// Income not overdue
    const E_INCOME_NOT_OVERDUE: u64 = 15;

    // Constants
    const FUNDING_PERCENTAGE: u64 = 90; // Fund 90% of income amount
    
    // Risk Management Constants
    const MIN_CREDIT_SCORE: u64 = 600; // Minimum credit score for funding
    const MAX_RISK_SCORE: u64 = 100; // Maximum risk score (higher = riskier)
    const GRACE_PERIOD_DAYS: u64 = 7; // Days grace period before default
    const DEFAULT_THRESHOLD_DAYS: u64 = 30; // Days overdue before marking default
    const SECONDS_PER_DAY: u64 = 86400; // Seconds in a day

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

    // Risk Management Structs
    struct RiskManagement has key {
        min_credit_score: u64,           // Minimum credit score (300-850 scale)
        max_single_funding: u64,         // Max APT for single invoice
        max_supplier_exposure: u64,      // Max total APT per supplier
        max_industry_concentration: u64, // Max % in single industry (out of 100)
        risk_reserves: u64,              // APT set aside for defaults
        enabled: bool,                   // Risk management enabled flag
    }

    struct SupplierRiskProfile has store, copy, drop {
        supplier_addr: address,
        credit_score: u64,               // 300-850 credit score
        total_funded: u64,               // Total APT funded to this supplier
        successful_payments: u64,        // Count of successful collections
        defaults: u64,                   // Count of defaulted payments
        risk_score: u64,                 // Calculated risk score 0-100
        business_age_months: u64,        // Age of business in months
        annual_revenue: u64,             // Annual revenue
        industry_type: u64,              // Industry category
        last_updated: u64,               // Last risk assessment timestamp
        approved_for_funding: bool,      // Whether approved for funding
    }

    struct RiskRegistry has key {
        supplier_profiles: Table<address, SupplierRiskProfile>,
        industry_exposure: Table<u64, u64>, // industry_type -> total_apt_funded
        total_risk_assessed: u64,
    }

    // Default Management Structs
    struct DefaultManagement has key {
        grace_period_days: u64,          // Days after due date before default
        default_threshold_days: u64,     // Days overdue before marking default
        recovery_rate_target: u64,       // Target recovery percentage (out of 100)
        total_defaults: u64,             // Count of defaulted incomes
        total_recovered: u64,            // Total APT recovered from defaults
        enabled: bool,                   // Default tracking enabled flag
    }

    struct DefaultedIncome has store, copy, drop {
        funded_income_id: u64,
        supplier_addr: address,
        original_amount: u64,
        funded_amount: u64,
        default_date: u64,
        recovery_attempts: u64,
        recovered_amount: u64,
        written_off: bool,
        recovery_status: u64,            // 1=In Progress, 2=Partially Recovered, 3=Fully Recovered, 4=Written Off
    }

    struct DefaultRegistry has key {
        defaulted_incomes: Table<u64, DefaultedIncome>,
        default_count: u64,
        overdue_tracking: Table<u64, u64>, // funded_income_id -> days_overdue
    }

    struct OverdueItem has store, drop {
        funded_income_id: u64,
        days_overdue: u64,
    }

    // Initialize the SPV system
    fun init_module(admin: &signer) {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        let admin_address = signer::address_of(admin);
        
        // Create resource account for treasury operations
        let (_treasury_signer, treasury_cap) = account::create_resource_account(admin, b"SPV_TREASURY");
        
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

        // Initialize Risk Management
        let risk_management = RiskManagement {
            min_credit_score: MIN_CREDIT_SCORE,
            max_single_funding: 1000000,     // 1M APT max single funding
            max_supplier_exposure: 5000000,  // 5M APT max per supplier
            max_industry_concentration: 25,  // 25% max in single industry
            risk_reserves: 0,
            enabled: true,
        };

        let risk_registry = RiskRegistry {
            supplier_profiles: table::new(),
            industry_exposure: table::new(),
            total_risk_assessed: 0,
        };

        // Initialize Default Management
        let default_management = DefaultManagement {
            grace_period_days: GRACE_PERIOD_DAYS,
            default_threshold_days: DEFAULT_THRESHOLD_DAYS,
            recovery_rate_target: 70,       // Target 70% recovery rate
            total_defaults: 0,
            total_recovered: 0,
            enabled: true,
        };

        let default_registry = DefaultRegistry {
            defaulted_incomes: table::new(),
            default_count: 0,
            overdue_tracking: table::new(),
        };

        move_to(admin, pool);
        move_to(admin, investor_registry);
        move_to(admin, funded_registry);
        move_to(admin, risk_management);
        move_to(admin, risk_registry);
        move_to(admin, default_management);
        move_to(admin, default_registry);
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

    // Submit supplier for risk assessment
    public entry fun submit_risk_assessment(
        supplier: &signer,
        credit_score: u64,
        business_age_months: u64,
        annual_revenue: u64,
        industry_type: u64
    ) acquires RiskRegistry, RiskManagement {
        let supplier_addr = signer::address_of(supplier);
        
        // Validate inputs
        assert!(credit_score >= 300 && credit_score <= 850, E_INVALID_WITHDRAWAL_AMOUNT); // Reusing error for validation
        assert!(business_age_months > 0, E_INVALID_WITHDRAWAL_AMOUNT);
        assert!(annual_revenue > 0, E_INVALID_WITHDRAWAL_AMOUNT);
        assert!(industry_type >= 1 && industry_type <= 5, E_INVALID_WITHDRAWAL_AMOUNT); // Match invoice registry types
        
        let risk_mgmt = borrow_global<RiskManagement>(@rwfi_addr);
        assert!(risk_mgmt.enabled, E_INVALID_WITHDRAWAL_AMOUNT);
        
        // Calculate risk score (simple algorithm for demo)
        let risk_score = calculate_risk_score_internal(credit_score, business_age_months, annual_revenue);
        let approved = credit_score >= risk_mgmt.min_credit_score && risk_score <= 70; // Risk score <= 70 is acceptable
        
        // Create or update supplier risk profile
        let registry = borrow_global_mut<RiskRegistry>(@rwfi_addr);
        let profile = SupplierRiskProfile {
            supplier_addr,
            credit_score,
            total_funded: 0, // Will be updated when funding occurs
            successful_payments: 0,
            defaults: 0,
            risk_score,
            business_age_months,
            annual_revenue,
            industry_type,
            last_updated: timestamp::now_seconds(),
            approved_for_funding: approved,
        };
        
        if (table::contains(&registry.supplier_profiles, supplier_addr)) {
            // Update existing profile but preserve funding history
            let existing = table::borrow_mut(&mut registry.supplier_profiles, supplier_addr);
            existing.credit_score = credit_score;
            existing.risk_score = risk_score;
            existing.business_age_months = business_age_months;
            existing.annual_revenue = annual_revenue;
            existing.industry_type = industry_type;
            existing.last_updated = timestamp::now_seconds();
            existing.approved_for_funding = approved;
        } else {
            table::upsert(&mut registry.supplier_profiles, supplier_addr, profile);
            registry.total_risk_assessed = registry.total_risk_assessed + 1;
        };
    }

    // Calculate risk score based on credit score, business age, and revenue
    fun calculate_risk_score_internal(credit_score: u64, business_age_months: u64, annual_revenue: u64): u64 {
        let score = 0;
        
        // Credit score component (0-40 points, lower credit = higher risk)
        if (credit_score >= 750) {
            score = score + 10; // Low risk
        } else if (credit_score >= 700) {
            score = score + 20;
        } else if (credit_score >= 650) {
            score = score + 30;
        } else {
            score = score + 40; // High risk
        };
        
        // Business age component (0-30 points)
        if (business_age_months >= 60) { // 5+ years
            score = score + 5;
        } else if (business_age_months >= 36) { // 3+ years
            score = score + 15;
        } else if (business_age_months >= 12) { // 1+ year
            score = score + 25;
        } else {
            score = score + 30; // Less than 1 year = high risk
        };
        
        // Revenue component (0-30 points)
        if (annual_revenue >= 1000000) { // 1M+ revenue
            score = score + 5;
        } else if (annual_revenue >= 500000) {
            score = score + 15;
        } else if (annual_revenue >= 100000) {
            score = score + 25;
        } else {
            score = score + 30; // Low revenue = high risk
        };
        
        score
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

    // Enhanced funding with risk assessment checks
    public entry fun fund_accrued_income_with_risk_check(
        admin: &signer,
        supplier_addr: address,
        income_id: u64
    ) acquires InvestmentPool, FundedIncomeRegistry, RiskManagement, RiskRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        let risk_mgmt = borrow_global<RiskManagement>(@rwfi_addr);
        assert!(risk_mgmt.enabled, E_INVALID_WITHDRAWAL_AMOUNT);
        
        // Check if supplier has been risk assessed
        let risk_registry = borrow_global<RiskRegistry>(@rwfi_addr);
        assert!(table::contains(&risk_registry.supplier_profiles, supplier_addr), E_SUPPLIER_NOT_RISK_ASSESSED);
        
        let supplier_profile = table::borrow(&risk_registry.supplier_profiles, supplier_addr);
        assert!(supplier_profile.approved_for_funding, E_RISK_SCORE_TOO_LOW);
        
        // Get income details
        let income = accrued_income_registry::get_income(supplier_addr, income_id);
        let funding_amount = (accrued_income_registry::get_income_amount(&income) * FUNDING_PERCENTAGE) / 100;
        
        // Risk checks
        assert!(funding_amount <= risk_mgmt.max_single_funding, E_INVALID_WITHDRAWAL_AMOUNT);
        assert!(supplier_profile.total_funded + funding_amount <= risk_mgmt.max_supplier_exposure, E_SUPPLIER_EXPOSURE_EXCEEDED);
        
        // Check industry concentration
        let industry_type = accrued_income_registry::get_income_type(&income);
        let current_industry_exposure = if (table::contains(&risk_registry.industry_exposure, industry_type)) {
            *table::borrow(&risk_registry.industry_exposure, industry_type)
        } else {
            0
        };
        
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        let total_pool = pool.total_apt_invested;
        if (total_pool > 0) {
            let new_exposure_pct = ((current_industry_exposure + funding_amount) * 100) / total_pool;
            assert!(new_exposure_pct <= risk_mgmt.max_industry_concentration, E_INDUSTRY_CONCENTRATION_EXCEEDED);
        };
        
        // All risk checks passed, proceed with funding using original logic
        assert!(pool.available_for_funding >= funding_amount, E_INSUFFICIENT_FUNDS);
        
        // Transfer APT to supplier from treasury account
        let pool_mut = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        let treasury_signer = account::create_signer_with_capability(&pool_mut.treasury_cap);
        aptos_account::transfer(&treasury_signer, supplier_addr, funding_amount);
        
        // Update pool
        pool_mut.available_for_funding = pool_mut.available_for_funding - funding_amount;
        pool_mut.total_funded_incomes = pool_mut.total_funded_incomes + 1;
        
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
        
        // Update risk tracking
        let risk_registry_mut = borrow_global_mut<RiskRegistry>(@rwfi_addr);
        let supplier_profile_mut = table::borrow_mut(&mut risk_registry_mut.supplier_profiles, supplier_addr);
        supplier_profile_mut.total_funded = supplier_profile_mut.total_funded + funding_amount;
        
        // Update industry exposure
        if (table::contains(&risk_registry_mut.industry_exposure, industry_type)) {
            let current = table::borrow_mut(&mut risk_registry_mut.industry_exposure, industry_type);
            *current = *current + funding_amount;
        } else {
            table::upsert(&mut risk_registry_mut.industry_exposure, industry_type, funding_amount);
        };
        
        // Mark income as funded in registry
        accrued_income_registry::mark_income_funded(supplier_addr, income_id, funding_amount);
    }

    // Record income collection when payment comes in
    public entry fun record_income_collection(
        admin: &signer,
        funded_income_id: u64,
        collected_amount: u64
    ) acquires InvestmentPool, FundedIncomeRegistry, RiskRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        let funded_registry = borrow_global_mut<FundedIncomeRegistry>(@rwfi_addr);
        assert!(table::contains(&funded_registry.funded_incomes, funded_income_id), E_INCOME_NOT_FOUND);
        
        let funded_income = table::borrow_mut(&mut funded_registry.funded_incomes, funded_income_id);
        assert!(!funded_income.collected, E_INCOME_ALREADY_FUNDED);
        
        let supplier_addr = funded_income.supplier_addr;
        
        // Update funded income record
        funded_income.collected = true;
        funded_income.collected_at = timestamp::now_seconds();
        funded_income.collected_amount = collected_amount;
        
        // Update investment pool with collections
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        pool.total_collections = pool.total_collections + collected_amount;
        
        // Update supplier risk profile on successful payment
        let risk_registry = borrow_global_mut<RiskRegistry>(@rwfi_addr);
        if (table::contains(&risk_registry.supplier_profiles, supplier_addr)) {
            let supplier_profile = table::borrow_mut(&mut risk_registry.supplier_profiles, supplier_addr);
            supplier_profile.successful_payments = supplier_profile.successful_payments + 1;
            supplier_profile.last_updated = timestamp::now_seconds();
        };
        
        // Mark as collected in income registry
        accrued_income_registry::mark_income_collected(funded_income.supplier_addr, funded_income.income_id);
    }

    // Check for overdue payments and mark defaults (anyone can call this)
    public entry fun check_and_mark_defaults(
        _caller: &signer  // Anyone can call this public service
    ) acquires FundedIncomeRegistry, DefaultManagement, DefaultRegistry, RiskRegistry {
        let default_mgmt = borrow_global<DefaultManagement>(@rwfi_addr);
        assert!(default_mgmt.enabled, E_INVALID_WITHDRAWAL_AMOUNT);
        
        let funded_registry = borrow_global<FundedIncomeRegistry>(@rwfi_addr);
        let current_time = timestamp::now_seconds();
        
        // Collect items to process to avoid borrow conflicts
        let defaulted_items = vector::empty<u64>();
        let overdue_items = vector::empty<OverdueItem>();
        
        let i = 1;
        while (i <= funded_registry.funded_count) {
            if (table::contains(&funded_registry.funded_incomes, i)) {
                let funded_income = table::borrow(&funded_registry.funded_incomes, i);
                
                // Only check uncollected incomes
                if (!funded_income.collected) {
                    // Get the original income to check due date
                    let income = accrued_income_registry::get_income(funded_income.supplier_addr, funded_income.income_id);
                    let due_date = accrued_income_registry::get_income_due_date(&income);
                    let grace_period_seconds = default_mgmt.grace_period_days * SECONDS_PER_DAY;
                    let default_threshold_seconds = default_mgmt.default_threshold_days * SECONDS_PER_DAY;
                    
                    // Check if past grace period + default threshold
                    if (current_time > due_date + grace_period_seconds + default_threshold_seconds) {
                        vector::push_back(&mut defaulted_items, i);
                    } else if (current_time > due_date + grace_period_seconds) {
                        // Track as overdue but not yet defaulted
                        let days_overdue = (current_time - due_date - grace_period_seconds) / SECONDS_PER_DAY;
                        vector::push_back(&mut overdue_items, OverdueItem {
                            funded_income_id: i,
                            days_overdue,
                        });
                    };
                };
            };
            i = i + 1;
        };
        
        // Process defaulted items
        let j = 0;
        while (j < vector::length(&defaulted_items)) {
            let item_id = *vector::borrow(&defaulted_items, j);
            let funded_income = *table::borrow(&funded_registry.funded_incomes, item_id);
            
            // Inline the defaulting logic to avoid nested acquires
            let default_registry = borrow_global_mut<DefaultRegistry>(@rwfi_addr);
            
            // Check if already defaulted
            if (!table::contains(&default_registry.defaulted_incomes, item_id)) {
                default_registry.default_count = default_registry.default_count + 1;
                
                let defaulted_income = DefaultedIncome {
                    funded_income_id: item_id,
                    supplier_addr: funded_income.supplier_addr,
                    original_amount: funded_income.expected_collection,
                    funded_amount: funded_income.funded_amount,
                    default_date: timestamp::now_seconds(),
                    recovery_attempts: 0,
                    recovered_amount: 0,
                    written_off: false,
                    recovery_status: 1, // In Progress
                };
                
                table::upsert(&mut default_registry.defaulted_incomes, item_id, defaulted_income);
                
                // Update default management stats
                let default_mgmt = borrow_global_mut<DefaultManagement>(@rwfi_addr);
                default_mgmt.total_defaults = default_mgmt.total_defaults + 1;
                
                // Update supplier risk profile
                let risk_registry = borrow_global_mut<RiskRegistry>(@rwfi_addr);
                if (table::contains(&risk_registry.supplier_profiles, funded_income.supplier_addr)) {
                    let supplier_profile = table::borrow_mut(&mut risk_registry.supplier_profiles, funded_income.supplier_addr);
                    supplier_profile.defaults = supplier_profile.defaults + 1;
                    supplier_profile.approved_for_funding = false; // Disable funding after default
                    supplier_profile.last_updated = timestamp::now_seconds();
                };
            };
            
            j = j + 1;
        };
        
        // Process overdue items
        j = 0;
        while (j < vector::length(&overdue_items)) {
            let overdue_item = vector::borrow(&overdue_items, j);
            update_overdue_tracking_internal(overdue_item.funded_income_id, overdue_item.days_overdue);
            j = j + 1;
        };
    }

    // Internal function to mark an income as defaulted
    fun mark_income_as_defaulted_internal(
        funded_income_id: u64,
        funded_income: &FundedIncome
    ) acquires DefaultRegistry, DefaultManagement, RiskRegistry {
        let default_registry = borrow_global_mut<DefaultRegistry>(@rwfi_addr);
        
        // Check if already defaulted
        if (table::contains(&default_registry.defaulted_incomes, funded_income_id)) {
            return
        };
        
        default_registry.default_count = default_registry.default_count + 1;
        
        let defaulted_income = DefaultedIncome {
            funded_income_id,
            supplier_addr: funded_income.supplier_addr,
            original_amount: funded_income.expected_collection,
            funded_amount: funded_income.funded_amount,
            default_date: timestamp::now_seconds(),
            recovery_attempts: 0,
            recovered_amount: 0,
            written_off: false,
            recovery_status: 1, // In Progress
        };
        
        table::upsert(&mut default_registry.defaulted_incomes, funded_income_id, defaulted_income);
        
        // Update default management stats
        let default_mgmt = borrow_global_mut<DefaultManagement>(@rwfi_addr);
        default_mgmt.total_defaults = default_mgmt.total_defaults + 1;
        
        // Update supplier risk profile
        let risk_registry = borrow_global_mut<RiskRegistry>(@rwfi_addr);
        if (table::contains(&risk_registry.supplier_profiles, funded_income.supplier_addr)) {
            let supplier_profile = table::borrow_mut(&mut risk_registry.supplier_profiles, funded_income.supplier_addr);
            supplier_profile.defaults = supplier_profile.defaults + 1;
            supplier_profile.approved_for_funding = false; // Disable funding after default
            supplier_profile.last_updated = timestamp::now_seconds();
        };
        
        // Note: In a full implementation, you might want to adjust pool accounting for the loss
        // For now, we'll just track it in the default registry
    }

    // Internal function to update overdue tracking
    fun update_overdue_tracking_internal(
        funded_income_id: u64,
        days_overdue: u64
    ) acquires DefaultRegistry {
        let default_registry = borrow_global_mut<DefaultRegistry>(@rwfi_addr);
        table::upsert(&mut default_registry.overdue_tracking, funded_income_id, days_overdue);
    }

    // Record recovery from a defaulted income
    public entry fun record_recovery(
        admin: &signer,
        funded_income_id: u64,
        recovered_amount: u64
    ) acquires DefaultRegistry, DefaultManagement, InvestmentPool {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        let default_registry = borrow_global_mut<DefaultRegistry>(@rwfi_addr);
        assert!(table::contains(&default_registry.defaulted_incomes, funded_income_id), E_DEFAULT_NOT_FOUND);
        
        let defaulted_income = table::borrow_mut(&mut default_registry.defaulted_incomes, funded_income_id);
        assert!(!defaulted_income.written_off, E_INVALID_WITHDRAWAL_AMOUNT);
        
        // Update recovery information
        defaulted_income.recovered_amount = defaulted_income.recovered_amount + recovered_amount;
        defaulted_income.recovery_attempts = defaulted_income.recovery_attempts + 1;
        
        // Determine recovery status
        if (defaulted_income.recovered_amount >= defaulted_income.funded_amount) {
            defaulted_income.recovery_status = 3; // Fully Recovered
        } else if (defaulted_income.recovered_amount > 0) {
            defaulted_income.recovery_status = 2; // Partially Recovered
        };
        
        // Update default management stats
        let default_mgmt = borrow_global_mut<DefaultManagement>(@rwfi_addr);
        default_mgmt.total_recovered = default_mgmt.total_recovered + recovered_amount;
        
        // Add recovered funds back to the investment pool
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        pool.total_collections = pool.total_collections + recovered_amount;
    }

    // Write off a defaulted income as unrecoverable
    public entry fun write_off_defaulted_income(
        admin: &signer,
        funded_income_id: u64
    ) acquires DefaultRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        let default_registry = borrow_global_mut<DefaultRegistry>(@rwfi_addr);
        assert!(table::contains(&default_registry.defaulted_incomes, funded_income_id), E_DEFAULT_NOT_FOUND);
        
        let defaulted_income = table::borrow_mut(&mut default_registry.defaulted_incomes, funded_income_id);
        defaulted_income.written_off = true;
        defaulted_income.recovery_status = 4; // Written Off
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

    // Risk Management View Functions
    #[view]
    public fun get_supplier_risk_profile(supplier_addr: address): (bool, SupplierRiskProfile) acquires RiskRegistry {
        let registry = borrow_global<RiskRegistry>(@rwfi_addr);
        if (table::contains(&registry.supplier_profiles, supplier_addr)) {
            (true, *table::borrow(&registry.supplier_profiles, supplier_addr))
        } else {
            (false, SupplierRiskProfile {
                supplier_addr,
                credit_score: 0,
                total_funded: 0,
                successful_payments: 0,
                defaults: 0,
                risk_score: 0,
                business_age_months: 0,
                annual_revenue: 0,
                industry_type: 0,
                last_updated: 0,
                approved_for_funding: false,
            })
        }
    }

    #[view]
    public fun calculate_risk_score(credit_score: u64, business_age_months: u64, annual_revenue: u64): u64 {
        calculate_risk_score_internal(credit_score, business_age_months, annual_revenue)
    }

    #[view]
    public fun get_risk_management_config(): (u64, u64, u64, u64, bool) acquires RiskManagement {
        let risk_mgmt = borrow_global<RiskManagement>(@rwfi_addr);
        (
            risk_mgmt.min_credit_score,
            risk_mgmt.max_single_funding,
            risk_mgmt.max_supplier_exposure,
            risk_mgmt.max_industry_concentration,
            risk_mgmt.enabled
        )
    }

    #[view]
    public fun get_industry_exposure(industry_type: u64): u64 acquires RiskRegistry {
        let registry = borrow_global<RiskRegistry>(@rwfi_addr);
        if (table::contains(&registry.industry_exposure, industry_type)) {
            *table::borrow(&registry.industry_exposure, industry_type)
        } else {
            0
        }
    }

    // Default Management View Functions
    #[view]
    public fun get_default_stats(): (u64, u64, u64, u64) acquires DefaultManagement {
        let default_mgmt = borrow_global<DefaultManagement>(@rwfi_addr);
        let recovery_rate = if (default_mgmt.total_defaults > 0) {
            (default_mgmt.total_recovered * 100) / (default_mgmt.total_defaults * 100) // Simplified calculation
        } else {
            0
        };
        (
            default_mgmt.total_defaults,
            default_mgmt.total_recovered,
            recovery_rate,
            default_mgmt.recovery_rate_target
        )
    }

    #[view]
    public fun get_defaulted_income(funded_income_id: u64): (bool, DefaultedIncome) acquires DefaultRegistry {
        let registry = borrow_global<DefaultRegistry>(@rwfi_addr);
        if (table::contains(&registry.defaulted_incomes, funded_income_id)) {
            (true, *table::borrow(&registry.defaulted_incomes, funded_income_id))
        } else {
            (false, DefaultedIncome {
                funded_income_id: 0,
                supplier_addr: @0x0,
                original_amount: 0,
                funded_amount: 0,
                default_date: 0,
                recovery_attempts: 0,
                recovered_amount: 0,
                written_off: false,
                recovery_status: 0,
            })
        }
    }

    #[view]
    public fun get_overdue_incomes(): vector<u64> acquires DefaultRegistry {
        let registry = borrow_global<DefaultRegistry>(@rwfi_addr);
        let overdue_list = vector::empty<u64>();
        
        // Note: In a full implementation, you'd want to iterate through the table more efficiently
        // For demo purposes, this simplified approach works
        let i = 1;
        while (i <= 100) { // Limit to first 100 for performance
            if (table::contains(&registry.overdue_tracking, i)) {
                vector::push_back(&mut overdue_list, i);
            };
            i = i + 1;
        };
        
        overdue_list
    }

    #[view]
    public fun is_supplier_approved_for_funding(supplier_addr: address): bool acquires RiskRegistry {
        let registry = borrow_global<RiskRegistry>(@rwfi_addr);
        if (table::contains(&registry.supplier_profiles, supplier_addr)) {
            let profile = table::borrow(&registry.supplier_profiles, supplier_addr);
            profile.approved_for_funding
        } else {
            false
        }
    }

    #[view]
    public fun get_risk_registry_stats(): (u64, u64) acquires RiskRegistry {
        let registry = borrow_global<RiskRegistry>(@rwfi_addr);
        (registry.total_risk_assessed, 0) // Second value reserved for future use
    }
}
