module rwfi_addr::accrued_income_registry {
    use aptos_std::table::{Self, Table};
    use aptos_std::signer;
    use std::vector;
    use aptos_framework::timestamp;

    // Friend modules that can call non-public functions
    friend rwfi_addr::spv;

    // Error codes
    /// Registry not found for supplier
    const E_REGISTRY_NOT_EXISTS: u64 = 1;
    /// Income entry not found
    const E_INCOME_NOT_EXISTS: u64 = 2;
    /// Income already funded
    const E_INCOME_ALREADY_FUNDED: u64 = 3;
    /// Not authorized to access this income
    const E_NOT_AUTHORIZED: u64 = 4;
    /// Invalid income amount
    const E_INVALID_AMOUNT: u64 = 5;

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

    // Create new accrued income entry
    public entry fun create_accrued_income(
        supplier: &signer,
        amount: u64,
        due_date: u64,
        income_type: u64,
        payer_info: vector<u8>,
        payer_contact: vector<u8>,
        description: vector<u8>
    ) acquires IncomeRegistry {
        assert!(amount > 0, E_INVALID_AMOUNT);
        let supplier_addr = signer::address_of(supplier);

        // Check if registry exists and get next income ID
        let (next_income_id, registry_exists) = if (exists<IncomeRegistry>(supplier_addr)) {
            let existing_registry = borrow_global<IncomeRegistry>(supplier_addr);
            (existing_registry.income_count + 1, true)
        } else {
            (1, false)
        };

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

        // Handle registry creation or update separately
        if (!registry_exists) {
            // Create new registry with the income
            let new_table = table::new();
            table::add(&mut new_table, next_income_id, income);
            move_to(supplier, IncomeRegistry {
                incomes: new_table,
                income_count: next_income_id,
                total_funded: 0,
                total_collected: 0,
            });
        } else {
            // Update existing registry
            let registry = borrow_global_mut<IncomeRegistry>(supplier_addr);
            registry.income_count = next_income_id;
            table::add(&mut registry.incomes, next_income_id, income);
        };
    }

    // Mark income as funded by SPV
    public(friend) fun mark_income_funded(
        supplier_addr: address,
        income_id: u64,
        funded_amount: u64
    ) acquires IncomeRegistry {
        assert!(exists<IncomeRegistry>(supplier_addr), E_REGISTRY_NOT_EXISTS);
        let registry = borrow_global_mut<IncomeRegistry>(supplier_addr);
        assert!(table::contains(&registry.incomes, income_id), E_INCOME_NOT_EXISTS);
        
        let income = table::borrow_mut(&mut registry.incomes, income_id);
        assert!(income.status == STATUS_PENDING, E_INCOME_ALREADY_FUNDED);
        
        income.funded_amount = funded_amount;
        income.status = STATUS_FUNDED;
        income.funded_at = timestamp::now_seconds();
        income.spv_owned = true;
        
        registry.total_funded = registry.total_funded + funded_amount;
    }

    // Mark income as collected when payment comes in
    public(friend) fun mark_income_collected(
        supplier_addr: address,
        income_id: u64
    ) acquires IncomeRegistry {
        assert!(exists<IncomeRegistry>(supplier_addr), E_REGISTRY_NOT_EXISTS);
        let registry = borrow_global_mut<IncomeRegistry>(supplier_addr);
        assert!(table::contains(&registry.incomes, income_id), E_INCOME_NOT_EXISTS);
        
        let income = table::borrow_mut(&mut registry.incomes, income_id);
        assert!(income.status == STATUS_FUNDED, E_NOT_AUTHORIZED);
        
        income.status = STATUS_COLLECTED;
        registry.total_collected = registry.total_collected + income.amount;
    }

    // View functions
    #[view]
    public fun get_income(supplier_addr: address, income_id: u64): AccruedIncome acquires IncomeRegistry {
        assert!(exists<IncomeRegistry>(supplier_addr), E_REGISTRY_NOT_EXISTS);
        let registry = borrow_global<IncomeRegistry>(supplier_addr);
        assert!(table::contains(&registry.incomes, income_id), E_INCOME_NOT_EXISTS);
        *table::borrow(&registry.incomes, income_id)
    }

    #[view]
    public fun get_all_incomes(supplier_addr: address): vector<AccruedIncome> acquires IncomeRegistry {
        assert!(exists<IncomeRegistry>(supplier_addr), E_REGISTRY_NOT_EXISTS);
        let registry = borrow_global<IncomeRegistry>(supplier_addr);
        let incomes = vector::empty<AccruedIncome>();
        let i = 1;
        
        while (i <= registry.income_count) {
            if (table::contains(&registry.incomes, i)) {
                let income = *table::borrow(&registry.incomes, i);
                vector::push_back(&mut incomes, income);
            };
            i = i + 1;
        };
        incomes
    }

    #[view]
    public fun get_pending_incomes(supplier_addr: address): vector<AccruedIncome> acquires IncomeRegistry {
        assert!(exists<IncomeRegistry>(supplier_addr), E_REGISTRY_NOT_EXISTS);
        let registry = borrow_global<IncomeRegistry>(supplier_addr);
        let incomes = vector::empty<AccruedIncome>();
        let i = 1;
        
        while (i <= registry.income_count) {
            if (table::contains(&registry.incomes, i)) {
                let income = *table::borrow(&registry.incomes, i);
                if (income.status == STATUS_PENDING) {
                    vector::push_back(&mut incomes, income);
                };
            };
            i = i + 1;
        };
        incomes
    }

    #[view]
    public fun get_registry_stats(supplier_addr: address): (u64, u64, u64, u64) acquires IncomeRegistry {
        if (!exists<IncomeRegistry>(supplier_addr)) {
            return (0, 0, 0, 0)
        };
        let registry = borrow_global<IncomeRegistry>(supplier_addr);
        (registry.income_count, registry.total_funded, registry.total_collected, 0)
    }

    // Helper view functions for income types
    #[view]
    public fun get_income_type_name(income_type: u64): vector<u8> {
        if (income_type == INCOME_TYPE_SALARY) {
            b"Salary"
        } else if (income_type == INCOME_TYPE_SUBSCRIPTION) {
            b"Subscription Revenue"
        } else if (income_type == INCOME_TYPE_FREELANCE) {
            b"Freelance Payment"
        } else if (income_type == INCOME_TYPE_BUSINESS_INVOICE) {
            b"Business Invoice"
        } else {
            b"Other"
        }
    }

    // Helper functions for SPV to access income fields
    public fun get_income_amount(income: &AccruedIncome): u64 {
        income.amount
    }

    public fun get_income_supplier_addr(income: &AccruedIncome): address {
        income.supplier_addr
    }

    public fun get_income_status(income: &AccruedIncome): u64 {
        income.status
    }

    public fun get_income_type(income: &AccruedIncome): u64 {
        income.income_type
    }

    public fun get_income_due_date(income: &AccruedIncome): u64 {
        income.due_date
    }
}
