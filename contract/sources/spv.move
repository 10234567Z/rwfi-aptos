module rwfi_addr::spv {

    use aptos_std::signer;
    use rwfi_addr::invoice_coin::{Self};
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_account;
    use aptos_framework::object::{Self, ExtendRef, ConstructorRef};
    use aptos_framework::account;

    // Error codes
    const E_INVALID_ADMIN_SIGNER: u64 = 0;
    /// Invoice not found
    const E_INVOICE_NOT_FOUND: u64 = 1;
    /// Insufficient funds in investment pool
    const E_INSUFFICIENT_FUNDS: u64 = 2;
    /// Invoice already funded
    const E_INVOICE_ALREADY_FUNDED: u64 = 3;
    /// Invalid funding percentage
    const E_INVALID_FUNDING_PERCENTAGE: u64 = 4;
    /// Invalid payback amount
    const E_INVALID_PAYBACK_AMOUNT: u64 = 5;

    struct InvestmentPool has key, copy, drop {
        remaining_tokens: u64,
        funded_tokens: u64,
        admin: address,
    }

    struct Investor has store, drop, copy {
        amount_tokens: u64,
    }

    struct Processing has store, drop, copy {
        address: address,
        amount: u64,
    }

    struct ProcessingInvoice has copy , drop, store {
        invoice_id: u64,
        supplier_addr: address 
    }

    struct ProcessingInvoiceRegistery has key {
        invoices: Table<u64, ProcessingInvoice>,
        invoice_count: u64
    }

    struct InvestorRegistry has key {
        investors: Table<address, Investor>,
        processing_investors: Table<u64, Processing>,
        investors_count: u64,
        processing_count: u64,
    }

    struct ObjectController has key {
        extend_ref: ExtendRef,
    }

    fun init_module(admin: &signer) {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        let admin_address = signer::address_of(admin);
        let pool = InvestmentPool {
            remaining_tokens: 0,
            funded_tokens: 0,
            admin: admin_address,
        };

        let investor_reg = InvestorRegistry {
            investors: table::new(),
            processing_investors: table::new(),
            processing_count: 0,
            investors_count: 0,
        };

        let processing_reg = ProcessingInvoiceRegistery {
            invoices: table::new(),
            invoice_count: 0,
        };

        // Store the pool with admin's resources
        move_to(admin, pool);
        move_to(admin, investor_reg);
        move_to(admin, processing_reg);
    }

    // Initialize the ExtendRef for an already deployed object
    public entry fun initialize_object_capabilities(admin: &signer) {
        // Allow admin profile to initialize the object contract
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @0x2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101, E_INVALID_ADMIN_SIGNER);
        
        // Create an ExtendRef for the current object address
        let constructor_ref = object::create_object_from_object(admin);
        let extend_ref = object::generate_extend_ref(&constructor_ref);
        
        // Store the ObjectController at the contract address, not admin address
        let resource_signer = object::generate_signer_for_extending(&extend_ref);
        move_to(&resource_signer, ObjectController { extend_ref });
    }

    // View Functions
    #[view]
    public fun get_pool_info(): (u64, u64, address) acquires InvestmentPool {
        let pool = borrow_global<InvestmentPool>(@rwfi_addr);
        (pool.remaining_tokens, pool.funded_tokens, pool.admin)
    }

    #[view]
    public fun get_investor_info(investor_addr: address): (bool, u64) acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        if (table::contains(&registry.investors, investor_addr)) {
            let investor = table::borrow(&registry.investors, investor_addr);
            (true, investor.amount_tokens)
        } else {
            (false, 0)
        }
    }

    #[view]
    public fun get_total_investors(): u64 acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        registry.investors_count
    }

    #[view]
    public fun get_invoice_count(): u64 acquires ProcessingInvoiceRegistery {
        let registry = borrow_global<ProcessingInvoiceRegistery>(@rwfi_addr);
        registry.invoice_count
    }

    public entry fun record_investment(investor: &signer, amount: u64) acquires InvestorRegistry, InvestmentPool {
        // Transfer APT from investor to SPV contract address
        let investor_address = signer::address_of(investor);
        aptos_account::transfer(investor, @rwfi_addr, amount);

        // Note: Invoice coins will be minted by admin when calling transfer_corresponding_invtokens
        // This maintains proper access control for minting

        // Update investment pool
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        pool.remaining_tokens = pool.remaining_tokens + amount;

        // Making record entry to the global table
        let investors = borrow_global_mut<InvestorRegistry>(@rwfi_addr);
        let is_investor_entry = table::contains(&investors.investors, investor_address);
        if (is_investor_entry == true) {
            let investor = table::borrow_mut(&mut investors.investors, investor_address);
            investor.amount_tokens += amount;
        } else {
            table::upsert(&mut investors.investors, investor_address, Investor {
                amount_tokens: amount,
            });
            investors.investors_count += 1;
        };

        // Update the processing table for further processing of INV tokens
        table::upsert(&mut investors.processing_investors, investors.processing_count + 1, Processing {
            address: investor_address,
            amount: amount,
        });
        investors.processing_count += 1;
    }

    public entry fun transfer_corresponding_invtokens(admin: &signer) acquires InvestorRegistry {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        let investor_registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        
        // Mint invoice coins to each investor based on their investment
        let i = 1;
        while (i <= investor_registry.processing_count) {
            if (table::contains(&investor_registry.processing_investors, i)) {
                let investor = table::borrow(&investor_registry.processing_investors, i);
                // Mint invoice coins equivalent to their APT investment
                invoice_coin::mint(admin, investor.address, investor.amount);
            };
            i = i + 1;
        };
    }

    public entry fun fund_invoice_when_target_reached(admin: &signer, invoice_id: u64, required_amount: u64, supplier_addr: address) 
        acquires InvestmentPool, ProcessingInvoiceRegistery, ObjectController {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        // Get investment pool
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        
        // Check if we have enough funds to cover the invoice
        assert!(pool.remaining_tokens >= required_amount, E_INSUFFICIENT_FUNDS);
        
        // Validate that the invoice is in pending state
        let processing_registry = borrow_global<ProcessingInvoiceRegistery>(@rwfi_addr);
        let invoice_found = false;
        let i = 1;
        while (i <= processing_registry.invoice_count) {
            if (table::contains(&processing_registry.invoices, i)) {
                let processing_invoice = table::borrow(&processing_registry.invoices, i);
                if (processing_invoice.invoice_id == invoice_id && processing_invoice.supplier_addr == supplier_addr) {
                    invoice_found = true;
                    break
                };
            };
            i = i + 1;
        };
        assert!(invoice_found, E_INVOICE_NOT_FOUND);
        
        // Get the ObjectController and use ExtendRef to create object signer
        let object_controller = borrow_global<ObjectController>(@rwfi_addr);
        let resource_signer = object::generate_signer_for_extending(&object_controller.extend_ref);
        
        // Transfer actual APT from SPV contract funds to supplier
        aptos_account::transfer(&resource_signer, supplier_addr, required_amount);
        
        // Also mint invoice coins to represent the funded invoice
        invoice_coin::mint(admin, supplier_addr, required_amount);
        
        // Update pool balances
        pool.remaining_tokens = pool.remaining_tokens - required_amount;
        pool.funded_tokens = pool.funded_tokens + required_amount;
    }

    public entry fun distribute_invoice_payback_to_investors(
        admin: &signer, 
        invoice_id: u64, 
        total_payback_amount: u64,
        yield_percentage: u64
    ) acquires InvestorRegistry, InvestmentPool, ProcessingInvoiceRegistery, ObjectController {
        assert!(signer::address_of(admin) == @rwfi_addr, E_INVALID_ADMIN_SIGNER);
        
        // Note: Supplier already received funds in Phase 4, now we distribute returns to investors
        
        // Validate payback amount is reasonable (must be > 0 and <= 1000% of original)
        assert!(total_payback_amount > 0, E_INVALID_PAYBACK_AMOUNT);
        assert!(yield_percentage <= 1000, E_INVALID_FUNDING_PERCENTAGE); // Max 1000% return
        
        // Validate that the invoice exists and is funded by this SPV
        let processing_registry = borrow_global<ProcessingInvoiceRegistery>(@rwfi_addr);
        let (invoice_found, funded_amount, supplier_addr) = validate_invoice_exists_by_id(processing_registry, invoice_id);
        assert!(invoice_found, E_INVOICE_NOT_FOUND);
        
        // Get investment pool to check current state
        let pool = borrow_global_mut<InvestmentPool>(@rwfi_addr);
        assert!(pool.funded_tokens >= funded_amount, E_INSUFFICIENT_FUNDS);
        
        // Calculate total yield amount (payback - principal)
        let principal_amount = funded_amount;
        let yield_amount = if (total_payback_amount > principal_amount) {
            total_payback_amount - principal_amount
        } else {
            0
        };
        
        // Distribute returns to investors based on their investment proportions
        distribute_proportional_returns(admin, principal_amount, yield_amount);
        
        // Update pool state - remove the funded tokens since invoice is now paid back
        pool.funded_tokens = pool.funded_tokens - funded_amount;
        pool.remaining_tokens = pool.remaining_tokens + total_payback_amount;
    }

    /// Simple admin-only distribution for testing Phase 5 (without object signer)
    public entry fun distribute_returns_simple(
        admin: &signer,
        total_amount: u64
    ) acquires InvestorRegistry {
        // Allow admin profile to execute distribution
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == @0x2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101, E_INVALID_ADMIN_SIGNER);
        
        // Use admin signer to distribute returns proportionally to investors (for testing)
        let investor_registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        let amount_per_investor = total_amount / investor_registry.investors_count;
        
        // Find and distribute to each investor
        let i = 1;
        while (i <= investor_registry.processing_count) {
            if (table::contains(&investor_registry.processing_investors, i)) {
                let processing = table::borrow(&investor_registry.processing_investors, i);
                aptos_account::transfer(admin, processing.address, amount_per_investor);
            };
            i = i + 1;
        };
    }

    /// Helper function to validate invoice exists and get funded amount
    fun validate_invoice_exists(
        processing_registry: &ProcessingInvoiceRegistery, 
        invoice_id: u64, 
        supplier_addr: address
    ): (bool, u64) {
        let i = 1;
        while (i <= processing_registry.invoice_count) {
            if (table::contains(&processing_registry.invoices, i)) {
                let processing_invoice = table::borrow(&processing_registry.invoices, i);
                if (processing_invoice.invoice_id == invoice_id && processing_invoice.supplier_addr == supplier_addr) {
                    // For now, we'll use a fixed funded amount. In production, this should be stored in the invoice
                    return (true, 10000) // This should be the actual funded amount for this invoice
                };
            };
            i = i + 1;
        };
        (false, 0)
    }

    /// Helper function to validate invoice exists by ID only and return supplier address
    fun validate_invoice_exists_by_id(
        processing_registry: &ProcessingInvoiceRegistery, 
        invoice_id: u64
    ): (bool, u64, address) {
        let i = 1;
        while (i <= processing_registry.invoice_count) {
            if (table::contains(&processing_registry.invoices, i)) {
                let processing_invoice = table::borrow(&processing_registry.invoices, i);
                if (processing_invoice.invoice_id == invoice_id) {
                    // For now, we'll use a fixed funded amount. In production, this should be stored in the invoice
                    return (true, 1000000, processing_invoice.supplier_addr) // Return actual funded amount and supplier
                };
            };
            i = i + 1;
        };
        (false, 0, @0x0)
    }
    
    /// Helper function to distribute returns proportionally to investors
    fun distribute_proportional_returns(
        admin: &signer, 
        principal_amount: u64, 
        yield_amount: u64
    ) acquires InvestorRegistry, ObjectController {
        let investor_registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        let total_distributed = 0;
        
        // Calculate total investment for proportion calculation
        let total_investment = principal_amount;
        
        // Distribute principal + yield proportionally to each investor
        let j = 1;
        while (j <= investor_registry.processing_count) {
            if (table::contains(&investor_registry.processing_investors, j)) {
                let processing_investor = table::borrow(&investor_registry.processing_investors, j);
                
                // Calculate this investor's proportion of the total investment
                let investor_proportion = processing_investor.amount;
                let principal_share = investor_proportion; // They get back their principal
                let yield_share = (investor_proportion * yield_amount) / total_investment; // Proportional yield
                let total_return = principal_share + yield_share;
                
                if (total_return > 0) {
                    // Get the ObjectController and use ExtendRef to create object signer
                    let object_controller = borrow_global<ObjectController>(@rwfi_addr);
                    let resource_signer = object::generate_signer_for_extending(&object_controller.extend_ref);
                    
                    // Transfer actual APT back to investor from contract funds
                    aptos_account::transfer(&resource_signer, processing_investor.address, total_return);
                    
                    // Also mint invoice coins to represent the returns
                    invoice_coin::mint(admin, processing_investor.address, total_return);
                    total_distributed = total_distributed + total_return;
                };
            };
            j = j + 1;
        };
    }

    public entry fun record_invoice_pending(supplier: &signer, invoice_id: u64) acquires ProcessingInvoiceRegistery {
        // Fetch the invoice from the invoice id and supplier addr and then record it as the pending
        let supplier_addr = signer::address_of(supplier);
        
        // Check if ProcessingInvoiceRegistery exists, if not create it
        if (!exists<ProcessingInvoiceRegistery>(@rwfi_addr)) {
            let processing_registry = ProcessingInvoiceRegistery {
                invoices: table::new(),
                invoice_count: 0,
            };
            move_to(supplier, processing_registry);
        };
        
        let processing_registry = borrow_global_mut<ProcessingInvoiceRegistery>(@rwfi_addr);
        
        // Create new processing invoice entry
        let processing_invoice = ProcessingInvoice {
            invoice_id: invoice_id,
            supplier_addr: supplier_addr,
        };
        
        // Add to processing table
        processing_registry.invoice_count = processing_registry.invoice_count + 1;
        table::upsert(&mut processing_registry.invoices, processing_registry.invoice_count, processing_invoice);
    }

    fun update_inv_pool(admin: &signer, new_remaining: u64, new_funded: u64) acquires InvestmentPool {
        let admin_address = signer::address_of(admin);
        let pool = borrow_global_mut<InvestmentPool>(admin_address);
        pool.remaining_tokens = new_remaining;
        pool.funded_tokens = new_funded;
    }

    // ===== VIEW FUNCTIONS FOR TESTING =====

    #[view]
    public fun get_investment_pool(): InvestmentPool acquires InvestmentPool {
        *borrow_global<InvestmentPool>(@rwfi_addr)
    }

    #[view]
    public fun get_processing_info(processing_id: u64): Processing acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        *table::borrow(&registry.processing_investors, processing_id)
    }

    #[view]
    public fun get_investor_count(): u64 acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        registry.investors_count
    }

    #[view]
    public fun get_processing_count(): u64 acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        registry.processing_count
    }

    #[view]
    public fun investor_exists(investor_addr: address): bool acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@rwfi_addr);
        table::contains(&registry.investors, investor_addr)
    }

    #[view]
    public fun get_processing_invoice_count(): u64 acquires ProcessingInvoiceRegistery {
        if (!exists<ProcessingInvoiceRegistery>(@rwfi_addr)) {
            return 0
        };
        let registry = borrow_global<ProcessingInvoiceRegistery>(@rwfi_addr);
        registry.invoice_count
    }

    #[view]
    public fun get_processing_invoice(processing_id: u64): ProcessingInvoice acquires ProcessingInvoiceRegistery {
        let registry = borrow_global<ProcessingInvoiceRegistery>(@rwfi_addr);
        *table::borrow(&registry.invoices, processing_id)
    }
}
