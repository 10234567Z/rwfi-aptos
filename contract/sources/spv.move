module rwfi_addr::spv {
    use aptos_std::signer;
    use rwfi_addr::invoice_coin;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_account;
    use aptos_framework::timestamp;
    use aptos_framework::account;
    use std::vector;
    use std::string;

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
    /// KYC not submitted
    const E_KYC_NOT_SUBMITTED: u64 = 17;
    /// KYC not approved
    const E_KYC_NOT_APPROVED: u64 = 18;
    /// Invalid document hash
    const E_INVALID_DOCUMENT_HASH: u64 = 19;
    /// KYC already submitted
    const E_KYC_ALREADY_SUBMITTED: u64 = 20;
    /// Supplier not found
    const ERROR_SUPPLIER_NOT_FOUND: u64 = 21;
    /// Default not found
    const E_DEFAULT_NOT_FOUND: u64 = 22;
    /// Registry not found for supplier
    const E_REGISTRY_NOT_EXISTS: u64 = 23;
    /// Income entry not found
    const E_INCOME_NOT_EXISTS: u64 = 24;
    /// Not authorized to access this income
    const E_NOT_AUTHORIZED: u64 = 25;
    /// Invalid income amount
    const E_INVALID_AMOUNT: u64 = 26;

    // Income types for better categorization
    const INCOME_TYPE_SALARY: u64 = 1;
    const INCOME_TYPE_SUBSCRIPTION: u64 = 2;
    const INCOME_TYPE_FREELANCE: u64 = 3;
    const INCOME_TYPE_BUSINESS_INVOICE: u64 = 4;
    const INCOME_TYPE_OTHER: u64 = 5;

    // Income status
    const STATUS_PENDING: u64 = 1;
    const STATUS_FUNDED: u64 = 2;
    const STATUS_COLLECTED: u64 = 3;
    const STATUS_CANCELLED: u64 = 4;

    struct PayerData has store, copy, drop {
        info: vector<u8>, // JSON string with payer details
        contact: vector<u8>, // Contact information
    }

    struct AccruedIncome has store, copy, drop {
        supplier_addr: address,
        amount: u64, // Total expected income
        funded_amount: u64, // Amount funded by SPV (90%)
        due_date: u64, // When income is expected
        income_type: u64, // Type of income (salary, subscription, etc.)
        payer_data: PayerData, // Who will pay this income
        description: vector<u8>, // Description of the income
        status: u64, // Current status
        created_at: u64, // Timestamp when created
        funded_at: u64, // Timestamp when funded (0 if not funded)
        spv_owned: bool, // Whether SPV owns this income
    }

    struct IncomeRegistry has key {
        incomes: Table<u64, AccruedIncome>,
        income_count: u64,
        total_funded: u64,
        total_collected: u64,
    }

    struct SupplierRegistery has key {
        suppliers: Table<address, Supplier>,
        supplier_count: u64, 
    supplier_list: vector<address>,
    }

    struct Supplier has key, store, copy, drop {
        supplier_addr: address,
        KYC_APPROVED: bool,
        proof_hash: vector<vector<u8>>,
        invoice_id: vector<u64>,
    }


    // Constants
    const FUNDING_PERCENTAGE: u64 = 90; // Fund 90% of income amount
    
    // Time constants
    const SECONDS_PER_DAY: u64 = 86400;
    const GRACE_PERIOD_DAYS: u64 = 30;
    const DEFAULT_THRESHOLD_DAYS: u64 = 60;
    
    // KYC Constants
    const KYC_STATUS_NONE: u8 = 0;
    const KYC_STATUS_PENDING: u8 = 1;
    const KYC_STATUS_APPROVED: u8 = 2;
    const KYC_STATUS_REJECTED: u8 = 3;
    const KYC_LEVEL_BASIC: u8 = 1;
    const KYC_LEVEL_ENHANCED: u8 = 2;

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
        investment_timestamp: u64, // Timestamp when they first invested
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

    // Epoch-based withdrawal system structs - now tracks funding time
    struct CollectionEpoch has store, copy, drop {
        epoch_id: u64,
        collections_amount: u64,
        total_inv_supply_at_epoch: u64,
        timestamp: u64,
        funded_timestamp: u64, // When the underlying invoice was funded
        funded_income_id: u64, // Reference to the funded income
    }

    struct EpochRegistry has key {
        epochs: Table<u64, CollectionEpoch>,
        current_epoch: u64,
        total_epochs: u64,
    }

    // Data structures for KYC admin interface  
    struct SupplierKYCInfo has copy, drop {
        supplier_address: address,
        business_name: string::String,
        business_license: string::String,
        tax_id: string::String,
        status: u8,
        submitted_at: u64,
        reviewed_at: u64,
        reviewed_by: address
    }

    // Initialize the SPV system
    fun init_module(admin: &signer) {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        let admin_address = signer::address_of(admin);
        
        // Create resource account for treasury operations
        let (_treasury_signer, treasury_cap) = account::create_resource_account(admin, b"SPV_TREASURY");
        
        let income_reg = IncomeRegistry {
            incomes: table::new(),
            income_count: 0,
            total_funded: 0,
            total_collected: 0,
        };

        let supplier_reg = SupplierRegistery {
            suppliers: table::new(),
            supplier_count: 0,
            supplier_list: vector::empty<address>(),
        };

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

        // Initialize Epoch Registry for time-based withdrawal system
        let epoch_registry = EpochRegistry {
            epochs: table::new(),
            current_epoch: 0,
            total_epochs: 0,
        };

        move_to(admin, pool);
        move_to(admin, investor_registry);
        move_to(admin, funded_registry);
        move_to(admin, default_management);
        move_to(admin, default_registry);
        move_to(admin, epoch_registry);
        move_to(admin, supplier_reg);
        move_to(admin, income_reg);
    }

    public entry fun create_accrued_income(
        supplier: &signer,
        amount: u64,
        due_date: u64,
        income_type: u64,
        payer_info: vector<u8>,
        payer_contact: vector<u8>,
        description: vector<u8>
    ) acquires IncomeRegistry, SupplierRegistery {
        assert!(amount > 0, E_INVALID_AMOUNT);
        let supplier_addr = signer::address_of(supplier);
        let supplier_reg = borrow_global_mut<SupplierRegistery>(@rwfi_addr);
        assert!(table::contains(&supplier_reg.suppliers, supplier_addr), E_REGISTRY_NOT_EXISTS);

        let supplier_table = table::borrow_mut(&mut supplier_reg.suppliers, supplier_addr);

        let registry = borrow_global_mut<IncomeRegistry>(@rwfi_addr);


        // Create income object first
        let income = AccruedIncome {
            supplier_addr,
            amount,
            funded_amount: 0,
            due_date,
            income_type,
            payer_data: PayerData {
                info: payer_info,
                contact: payer_contact,
            },
            description,
            status: STATUS_PENDING,
            created_at: timestamp::now_seconds(),
            funded_at: 0,
            spv_owned: false,
        };


        // Update existing registry
        let next_income_id = registry.income_count + 1;
        registry.income_count = next_income_id;
        table::add(&mut registry.incomes, next_income_id, income);
        supplier_table.invoice_id.push_back(next_income_id);
    }

    public fun mark_income_funded(
        supplier_addr: address,
        income_id: u64,
        funded_amount: u64
    ) acquires IncomeRegistry {       
        let registry = borrow_global_mut<IncomeRegistry>(@rwfi_addr);
        let income = table::borrow_mut(&mut registry.incomes, income_id);
        assert!(income.status == STATUS_PENDING, E_INCOME_ALREADY_FUNDED);
        
        income.funded_amount = funded_amount;
        income.status = STATUS_FUNDED;
        income.funded_at = timestamp::now_seconds();
        income.spv_owned = true;
        
        registry.total_funded = registry.total_funded + funded_amount;
    }

    public(friend) fun mark_income_collected(
        supplier_addr: address,
        income_id: u64
    ) acquires IncomeRegistry {
        let registry = borrow_global_mut<IncomeRegistry>(@rwfi_addr);
        assert!(table::contains(&registry.incomes, income_id), E_INCOME_NOT_EXISTS);
        
        let income = table::borrow_mut(&mut registry.incomes, income_id);
        assert!(income.status == STATUS_FUNDED, E_NOT_AUTHORIZED);
        
        income.status = STATUS_COLLECTED;
        registry.total_collected = registry.total_collected + income.amount;
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
        let investment_time = timestamp::now_seconds();
        
        if (table::contains(&registry.investors, investor_addr)) {
            let investor_data = table::borrow_mut(&mut registry.investors, investor_addr);
            investor_data.total_invested = investor_data.total_invested + amount;
            // Don't update investment_timestamp for existing investors - keep original timestamp
        } else {
            table::upsert(&mut registry.investors, investor_addr, Investor {
                total_invested: amount,
                total_withdrawn: 0,
                inv_tokens: 0,
                investment_timestamp: investment_time, // When they invested
            });
            registry.total_investors = registry.total_investors + 1;
        };
        
        // Mint INV tokens to investor (1:1 ratio with APT for now)
        invoice_coin::mint_to_primary_store(@rwfi_addr, investor_addr, amount);
        
        // Update investor's INV token count
        let investor_data = table::borrow_mut(&mut registry.investors, investor_addr);
        investor_data.inv_tokens = investor_data.inv_tokens + amount;
    }

    // Submit KYC documents (supplier uploads document hashes)
    public entry fun submit_kyc_documents(
        supplier: &signer,
        document_hashes: vector<vector<u8>>,
        kyc_level: bool
    ) acquires SupplierRegistery{
        let supplier_addr = signer::address_of(supplier);
        let supplier_reg = borrow_global_mut<SupplierRegistery>(@rwfi_addr);
        if(!table::contains(&supplier_reg.suppliers, supplier_addr)){
            let new_supplier = Supplier {
                supplier_addr,
                KYC_APPROVED: false,
                proof_hash: vector::empty<vector<u8>>(),
                invoice_id: vector::empty<u64>(),
            };
            table::upsert(&mut supplier_reg.suppliers, supplier_addr, new_supplier);
            supplier_reg.supplier_count = supplier_reg.supplier_count + 1;
            // Keep a separate list to enable iteration in view functions
            vector::push_back(&mut supplier_reg.supplier_list, supplier_addr);
        };
        let profile = table::borrow_mut(&mut supplier_reg.suppliers, supplier_addr);
        
        // Update KYC information
        profile.KYC_APPROVED = false;
        profile.proof_hash = document_hashes;
    }

    // Allow a supplier to register themselves. Minimal safe upsert.
    public entry fun register_supplier(
        supplier: &signer
    ) acquires SupplierRegistery {
        let supplier_addr = signer::address_of(supplier);
        let registry = borrow_global_mut<SupplierRegistery>(@rwfi_addr);

        // If supplier already exists, do nothing
        if (!table::contains(&registry.suppliers, supplier_addr)) {
            let new_supplier = Supplier {
                supplier_addr,
                KYC_APPROVED: false,
                proof_hash: vector::empty<vector<u8>>(),
                invoice_id: vector::empty<u64>(),
            };
            table::upsert(&mut registry.suppliers, supplier_addr, new_supplier);
            registry.supplier_count = registry.supplier_count + 1;
            // Keep a separate list to enable iteration in view functions
            vector::push_back(&mut registry.supplier_list, supplier_addr);
        };
    }

    // Admin approves or rejects KYC
    public entry fun process_kyc_application(
        admin: &signer,
        supplier_addr: address,
        approve: bool
    ) acquires SupplierRegistery {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        let registry = borrow_global_mut<SupplierRegistery>(@rwfi_addr);
        assert!(table::contains(&registry.suppliers, supplier_addr), ERROR_SUPPLIER_NOT_FOUND);
        
        let profile = table::borrow_mut(&mut registry.suppliers, supplier_addr);
        
        // Update KYC status
        profile.KYC_APPROVED = approve;
    }

    // Admin funds an accrued income (90% of amount)
    public entry fun fund_accrued_income(
        admin: &signer,
        supplier_addr: address,
        income_id: u64
    ) acquires InvestmentPool, FundedIncomeRegistry, IncomeRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        // Get income details
        let income = get_income(supplier_addr, income_id);
        let funding_amount = (income.amount * FUNDING_PERCENTAGE) / 100;
        
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
            expected_collection: income.amount,
            funded_at: timestamp::now_seconds(),
            collected: false,
            collected_at: 0,
            collected_amount: 0,
        };
        
        table::upsert(&mut funded_registry.funded_incomes, funded_registry.funded_count, funded_income);
        
        // Mark income as funded in registry
        mark_income_funded(supplier_addr, income_id, funding_amount);
    }

    // Record income collection when payment comes in
    public entry fun record_income_collection(
        admin: &signer,
        funded_income_id: u64,
        collected_amount: u64
    ) acquires InvestmentPool, FundedIncomeRegistry, EpochRegistry, IncomeRegistry {
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
        
        // Create new epoch when collections happen - now with funding timestamp
        create_new_epoch_internal(collected_amount, funded_income.funded_at, funded_income_id);
        
        // Mark as collected in income registry
        mark_income_collected(funded_income.supplier_addr, funded_income.income_id);
    }

    // Internal function to create new epoch when collections happen - now tracks funding time
    fun create_new_epoch_internal(collected_amount: u64, funded_timestamp: u64, funded_income_id: u64) acquires EpochRegistry {
        let epoch_registry = borrow_global_mut<EpochRegistry>(@rwfi_addr);
        
        // Get current total INV supply at this moment
        let total_inv_supply = invoice_coin::get_total_supply();
        
        // Create new epoch
        epoch_registry.current_epoch = epoch_registry.current_epoch + 1;
        epoch_registry.total_epochs = epoch_registry.total_epochs + 1;
        
        let new_epoch = CollectionEpoch {
            epoch_id: epoch_registry.current_epoch,
            collections_amount: collected_amount,
            total_inv_supply_at_epoch: total_inv_supply,
            timestamp: timestamp::now_seconds(), // When collection happened
            funded_timestamp, // When the invoice was originally funded
            funded_income_id, // Reference to the funded income
        };
        
        table::upsert(&mut epoch_registry.epochs, epoch_registry.current_epoch, new_epoch);
    }

    // Check for overdue payments and mark defaults (anyone can call this)
    public entry fun check_and_mark_defaults(
        _caller: &signer  // Anyone can call this public service
    ) acquires FundedIncomeRegistry, DefaultManagement, DefaultRegistry, IncomeRegistry{
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
                    let income = get_income(funded_income.supplier_addr, funded_income.income_id);
                    let due_date = income.due_date;
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

    // --------------------------------------------

    // Internal function to mark an income as defaulted
    fun mark_income_as_defaulted_internal(
        funded_income_id: u64,
        funded_income: &FundedIncome
    ) acquires DefaultRegistry, DefaultManagement {
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

    // -------------------------------------------------

    // Timestamp-based withdrawal system - only returns from invoices funded AFTER investment
    public entry fun withdraw_returns_timestamp_based(
        investor: &signer,
        inv_tokens_to_redeem: u64
    ) acquires InvestmentPool, InvestorRegistry, EpochRegistry {
        let investor_addr = signer::address_of(investor);
        
        let registry = borrow_global_mut<InvestorRegistry>(@rwfi_addr);
        assert!(table::contains(&registry.investors, investor_addr), E_NO_INV_TOKENS);
        
        let investor_data = table::borrow_mut(&mut registry.investors, investor_addr);
        assert!(investor_data.inv_tokens >= inv_tokens_to_redeem, E_INVALID_WITHDRAWAL_AMOUNT);
        
        // Get investor's investment timestamp
        let investment_timestamp = investor_data.investment_timestamp;
        let current_epoch = {
            let epoch_registry = borrow_global<EpochRegistry>(@rwfi_addr);
            epoch_registry.current_epoch
        };
        
        // Calculate returns only from invoices funded AFTER investment
        let withdrawal_amount = calculate_timestamp_based_returns(
            inv_tokens_to_redeem,
            investment_timestamp
        );
        
        // If no returns available, return original APT (0% returns case)
        let final_withdrawal_amount = if (withdrawal_amount == 0) {
            // Calculate proportional share of original investment to return
            let total_inv_supply = invoice_coin::get_total_supply();
            let pool = borrow_global<InvestmentPool>(@rwfi_addr);
            
            // Return proportional share of total invested (not collections)
            (inv_tokens_to_redeem * pool.total_apt_invested) / total_inv_supply
        } else {
            withdrawal_amount
        };
        
        assert!(final_withdrawal_amount > 0, E_INVALID_WITHDRAWAL_AMOUNT);
        
        // Burn INV tokens
        invoice_coin::burn_from_primary_store(@rwfi_addr, investor_addr, inv_tokens_to_redeem);
        
        // Transfer APT to investor from treasury account
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        let treasury_signer = account::create_signer_with_capability(&pool.treasury_cap);
        aptos_account::transfer(&treasury_signer, investor_addr, final_withdrawal_amount);
        
        // Update pool accounting
        let pool_mut = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        if (final_withdrawal_amount <= pool_mut.total_collections) {
            // Withdrawing from returns
            pool_mut.total_collections = pool_mut.total_collections - final_withdrawal_amount;
        } else {
            // Returning original investment (0% returns case)
            let excess = final_withdrawal_amount - pool_mut.total_collections;
            pool_mut.total_collections = 0;
            pool_mut.total_apt_invested = pool_mut.total_apt_invested - excess;
            pool_mut.available_for_funding = pool_mut.available_for_funding - excess;
        };
        
        // Update investor data
        investor_data.inv_tokens = investor_data.inv_tokens - inv_tokens_to_redeem;
        investor_data.total_withdrawn = investor_data.total_withdrawn + final_withdrawal_amount;
    }

    // Calculate returns based on timestamp - only from invoices funded AFTER investment
    fun calculate_timestamp_based_returns(
        inv_tokens_to_redeem: u64,
        investment_timestamp: u64
    ): u64 acquires EpochRegistry {
        let epoch_registry = borrow_global<EpochRegistry>(@rwfi_addr);
        let total_returns = 0u64;
        
        // Iterate through all epochs
        let i = 1u64;
        while (i <= epoch_registry.current_epoch) {
            if (table::contains(&epoch_registry.epochs, i)) {
                let epoch = table::borrow(&epoch_registry.epochs, i);
                
                // Only include epochs where the invoice was funded AFTER investor's investment
                if (epoch.funded_timestamp > investment_timestamp && 
                    epoch.collections_amount > 0 && 
                    epoch.total_inv_supply_at_epoch > 0) {
                    
                    // Calculate proportional share of this epoch's collections
                    let investor_share = (inv_tokens_to_redeem * epoch.collections_amount) / epoch.total_inv_supply_at_epoch;
                    total_returns = total_returns + investor_share;
                };
            };
            i = i + 1;
        };
        
        total_returns
    }

    // Helper function to get treasury address

    #[view]
    public fun get_income(supplier_addr: address, income_id: u64): AccruedIncome acquires IncomeRegistry {
        assert!(exists<IncomeRegistry>(@rwfi_addr), E_REGISTRY_NOT_EXISTS);
        let registry = borrow_global<IncomeRegistry>(@rwfi_addr);
        assert!(table::contains(&registry.incomes, income_id), E_INCOME_NOT_EXISTS);
        *table::borrow(&registry.incomes, income_id)
    }

    // Return all incomes for a supplier by reading the supplier's invoice_id vector
    #[view]
    public fun get_all_incomes(supplier_addr: address): vector<AccruedIncome> acquires SupplierRegistery, IncomeRegistry {
        let registry = borrow_global<SupplierRegistery>(@rwfi_addr);
        assert!(table::contains(&registry.suppliers, supplier_addr), ERROR_SUPPLIER_NOT_FOUND);
        let profile = table::borrow(&registry.suppliers, supplier_addr);

        let res = vector::empty<AccruedIncome>();
        let len = vector::length(&profile.invoice_id);
        let i = 0u64;
        while (i < len) {
            let income_id = *vector::borrow(&profile.invoice_id, i);
            let income = *table::borrow(&borrow_global<IncomeRegistry>(@rwfi_addr).incomes, income_id);
            vector::push_back(&mut res, income);
            i = i + 1;
        };

        res
    }

    #[view]
    public fun get_document_hashes(supplier_addr: address): vector<vector<u8>> acquires SupplierRegistery {
        let reg = borrow_global<SupplierRegistery>(@rwfi_addr);
        let supplier_profile = *table::borrow(&reg.suppliers, supplier_addr);
        supplier_profile.proof_hash
    }

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
            (true, investor.total_invested, investor.total_withdrawn, investor.inv_tokens, investor.investment_timestamp)
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

    // KYC View Functions TODO
    #[view]
    public fun get_all_pending_kyc_suppliers(): vector<Supplier> acquires SupplierRegistery {
        let registry = borrow_global<SupplierRegistery>(@rwfi_addr);
        let pending_suppliers = vector::empty<Supplier>();

        // Iterate the maintained supplier_list and collect suppliers who have
        // submitted documents but are not yet approved (pending).
        let i = 0u64;
        let len = vector::length(&registry.supplier_list);
        while (i < len) {
            let addr = *vector::borrow(&registry.supplier_list, i);
            if (table::contains(&registry.suppliers, addr)) {
                let profile = *table::borrow(&registry.suppliers, addr);
                // Consider pending if documents were submitted (proof_hash non-empty)
                // and not yet approved
                if (!profile.KYC_APPROVED && vector::length(&profile.proof_hash) > 0) {
                    vector::push_back(&mut pending_suppliers, profile);
                };
            };
            i = i + 1u64;
        };

        pending_suppliers
    }

    #[view]
    public fun get_supplier_kyc_details(supplier_addr: address): vector<vector<u8>> acquires SupplierRegistery {
        let registry = borrow_global<SupplierRegistery>(@rwfi_addr);
        assert!(table::contains(&registry.suppliers, supplier_addr), ERROR_SUPPLIER_NOT_FOUND);
        
        let profile = table::borrow(&registry.suppliers, supplier_addr);
        profile.proof_hash
    }


    #[view]
    public fun get_kyc_status(supplier_addr: address): bool acquires SupplierRegistery {
        let registry = borrow_global<SupplierRegistery>(@rwfi_addr);
        if (table::contains(&registry.suppliers, supplier_addr)) {
            let profile = table::borrow(&registry.suppliers, supplier_addr);
            profile.KYC_APPROVED
        } else {
            false
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
        let _default_registry = borrow_global<DefaultRegistry>(@rwfi_addr);
        let overdue_list = vector::empty<u64>();
        
        // Iterate through overdue tracking
        // Note: This is a simplified version. In practice, you might want to
        // implement a more efficient way to track and retrieve overdue items
        
        overdue_list
    }

    // View functions for timestamp-based system
    #[view]
    public fun get_epoch_info(epoch_id: u64): (bool, u64, u64, u64, u64, u64, u64) acquires EpochRegistry {
        let epoch_registry = borrow_global<EpochRegistry>(@rwfi_addr);
        
        if (table::contains(&epoch_registry.epochs, epoch_id)) {
            let epoch = table::borrow(&epoch_registry.epochs, epoch_id);
            (true, epoch.epoch_id, epoch.collections_amount, epoch.total_inv_supply_at_epoch, epoch.timestamp, epoch.funded_timestamp, epoch.funded_income_id)
        } else {
            (false, 0, 0, 0, 0, 0, 0)
        }
    }

    #[view]
    public fun get_current_epoch(): u64 acquires EpochRegistry {
        let epoch_registry = borrow_global<EpochRegistry>(@rwfi_addr);
        epoch_registry.current_epoch
    }

    #[view]
    public fun calculate_available_returns_for_investor(investor_addr: address): u64 acquires InvestorRegistry, EpochRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        
        if (!table::contains(&registry.investors, investor_addr)) {
            return 0
        };
        
        let investor_data = table::borrow(&registry.investors, investor_addr);
        calculate_timestamp_based_returns(
            investor_data.inv_tokens,
            investor_data.investment_timestamp
        )
    }

    #[view]
    public fun calculate_withdrawal_amount_timestamp_based(investor_addr: address, inv_tokens: u64): (u64, u64) acquires InvestmentPool, InvestorRegistry, EpochRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        if (!table::contains(&registry.investors, investor_addr)) {
            return (0, 0)
        };
        
        let investor_data = table::borrow(&registry.investors, investor_addr);
        let returns_amount = calculate_timestamp_based_returns(inv_tokens, investor_data.investment_timestamp);
        
        // Calculate total withdrawable amount (returns + original if no returns)
        let total_withdrawable = if (returns_amount == 0) {
            // Return original investment (0% returns case)
            let pool = borrow_global<InvestmentPool>(@rwfi_addr);
            let total_inv_supply = invoice_coin::get_total_supply();
            if (total_inv_supply > 0) {
                (inv_tokens * pool.total_apt_invested) / total_inv_supply
            } else {
                0
            }
        } else {
            returns_amount
        };
        
        (total_withdrawable, returns_amount)
    }
}