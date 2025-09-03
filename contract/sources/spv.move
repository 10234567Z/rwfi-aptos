module spv_addr::spv {

    use aptos_std::signer;
    use stablecoin::invoice_coin;
    use aptos_framework::account;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_account;
    use aptos_framework::timestamp;
    use std::vector;

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

    fun init_module(admin: &signer) {
        assert!(signer::address_of(admin) == @admin_addr, E_INVALID_ADMIN_SIGNER);
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

    public entry fun record_investment(investor: &signer, amount: u64) acquires InvestorRegistry, InvestmentPool {
        // Transfer the equivalent amount of USD/APT to this contract
        let investor_address = signer::address_of(investor);
        aptos_account::transfer(investor, @spv_addr, amount);

        // Update investment pool
        let pool = borrow_global_mut<InvestmentPool>(@admin_addr);
        pool.remaining_tokens = pool.remaining_tokens + amount;

        // Making record entry to the global table
        let investors = borrow_global_mut<InvestorRegistry>(@admin_addr);
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
        assert!(signer::address_of(admin) == @admin_addr, E_INVALID_ADMIN_SIGNER);
        let investor_registery = borrow_global<InvestorRegistry>(@admin_addr);
        // Fetch each and every investor's data from the chain through iteration
        let i = 1;
        while ( i < investor_registery.processing_count){
            let investor = *table::borrow(&investor_registery.processing_investors, i);
            invoice_coin::transfer_from(admin, signer::address_of(admin), investor.address, investor.amount);
        }
    }

    public entry fun fund_invoice_when_target_reached(admin: &signer, invoice_id: u64, required_amount: u64, supplier_addr: address) 
        acquires InvestmentPool, ProcessingInvoiceRegistery {
        assert!(signer::address_of(admin) == @admin_addr, E_INVALID_ADMIN_SIGNER);
        
        // Get investment pool
        let pool = borrow_global_mut<InvestmentPool>(@admin_addr);
        
        // Check if we have enough funds to cover the invoice
        assert!(pool.remaining_tokens >= required_amount, E_INSUFFICIENT_FUNDS);
        
        // Validate that the invoice is in pending state
        let processing_registry = borrow_global<ProcessingInvoiceRegistery>(@admin_addr);
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
        
        // Transfer funds to supplier for the invoice
        aptos_account::transfer(admin, supplier_addr, required_amount);
        
        // Update pool balances
        pool.remaining_tokens = pool.remaining_tokens - required_amount;
        pool.funded_tokens = pool.funded_tokens + required_amount;
    }

    public entry fun transfer_buyer_payback_to_investor(supplier: &signer, invoice_id: u64, amount_in_usd: u64) 
        acquires InvestorRegistry, InvestmentPool, ProcessingInvoiceRegistery {
        let supplier_addr = signer::address_of(supplier);
        
        // Validate that the invoice exists and is funded by this SPV
        let processing_registry = borrow_global<ProcessingInvoiceRegistery>(@admin_addr);
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
        
        // Get investment pool to check funded amount
        let pool = borrow_global_mut<InvestmentPool>(@admin_addr);
        assert!(pool.funded_tokens >= amount_in_usd, E_INSUFFICIENT_FUNDS);
        
        // Get investor registry to distribute proportionally
        let investor_registry = borrow_global<InvestorRegistry>(@admin_addr);
        
        // Calculate total investment to determine proportions
        let total_investment = pool.funded_tokens;
        
        // Distribute payback proportionally to all investors
        let j = 1;
        while (j <= investor_registry.investors_count) {
            if (table::contains(&investor_registry.processing_investors, j)) {
                let processing_investor = table::borrow(&investor_registry.processing_investors, j);
                
                // Calculate proportional share
                let investor_share = (processing_investor.amount * amount_in_usd) / total_investment;
                
                if (investor_share > 0) {
                    // Transfer the proportional amount to investor
                    // Using APT transfer for payback
                    aptos_account::transfer(supplier, processing_investor.address, investor_share);
                };
            };
            j = j + 1;
        };
        
        // Update pool to reflect the payback
        pool.funded_tokens = pool.funded_tokens - amount_in_usd;
    }

    public entry fun record_invoice_pending(invoice_id: u64, supplier: &signer) acquires ProcessingInvoiceRegistery {
        // Fetch the invoice from the invoice id and supplier addr and then record it as the pending
        let supplier_addr = signer::address_of(supplier);
        
        // Check if ProcessingInvoiceRegistery exists, if not create it
        if (!exists<ProcessingInvoiceRegistery>(@admin_addr)) {
            let processing_registry = ProcessingInvoiceRegistery {
                invoices: table::new(),
                invoice_count: 0,
            };
            move_to(supplier, processing_registry);
        };
        
        let processing_registry = borrow_global_mut<ProcessingInvoiceRegistery>(@admin_addr);
        
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
        *borrow_global<InvestmentPool>(@admin_addr)
    }

    #[view]
    public fun get_investor_info(investor_addr: address): Investor acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@admin_addr);
        *table::borrow(&registry.investors, investor_addr)
    }

    #[view]
    public fun get_processing_info(processing_id: u64): Processing acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@admin_addr);
        *table::borrow(&registry.processing_investors, processing_id)
    }

    #[view]
    public fun get_investor_count(): u64 acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@admin_addr);
        registry.investors_count
    }

    #[view]
    public fun get_processing_count(): u64 acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@admin_addr);
        registry.processing_count
    }

    #[view]
    public fun investor_exists(investor_addr: address): bool acquires InvestorRegistry {
        let registry = borrow_global<InvestorRegistry>(@admin_addr);
        table::contains(&registry.investors, investor_addr)
    }

    #[view]
    public fun get_processing_invoice_count(): u64 acquires ProcessingInvoiceRegistery {
        if (!exists<ProcessingInvoiceRegistery>(@admin_addr)) {
            return 0
        };
        let registry = borrow_global<ProcessingInvoiceRegistery>(@admin_addr);
        registry.invoice_count
    }

    #[view]
    public fun get_processing_invoice(processing_id: u64): ProcessingInvoice acquires ProcessingInvoiceRegistery {
        let registry = borrow_global<ProcessingInvoiceRegistery>(@admin_addr);
        *table::borrow(&registry.invoices, processing_id)
    }

    // ===== TEST CASES =====

    #[test(admin = @admin_addr, aptos_framework = @0x1)]
    /// Test the initialization of the SPV module
    public entry fun test_init_module(admin: signer, aptos_framework: signer) acquires InvestmentPool, InvestorRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create admin account
        account::create_account_for_test(signer::address_of(&admin));
        
        // Initialize the module
        init_module(&admin);
        
        // Verify InvestmentPool was created correctly
        let pool = get_investment_pool();
        assert!(pool.remaining_tokens == 0, 1);
        assert!(pool.funded_tokens == 0, 2);
        assert!(pool.admin == @admin_addr, 3);
        
        // Verify InvestorRegistry was created correctly
        assert!(get_investor_count() == 0, 4);
        assert!(get_processing_count() == 0, 5);
    }

    #[test(wrong_admin = @0x999, aptos_framework = @0x1)]
    #[expected_failure(abort_code = 0, location = Self)]
    /// Test that only the correct admin can initialize the module
    public entry fun test_init_module_wrong_admin_failure(wrong_admin: signer, aptos_framework: signer) {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create wrong admin account
        account::create_account_for_test(signer::address_of(&wrong_admin));
        
        // Try to initialize with wrong admin - should fail
        init_module(&wrong_admin);
    }

    // Simplified test version that bypasses APT transfer for testing core logic
    #[test_only]
    public entry fun record_investment_test_only(investor: &signer, amount: u64) acquires InvestorRegistry, InvestmentPool {
        // Making record entry to the global table (bypassing APT transfer for tests)
        let investor_address = signer::address_of(investor);

        // Update investment pool
        let pool = borrow_global_mut<InvestmentPool>(@admin_addr);
        pool.remaining_tokens = pool.remaining_tokens + amount;

        let investors = borrow_global_mut<InvestorRegistry>(@admin_addr);
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

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test recording a single investment (simplified without APT transfer)
    public entry fun test_record_investment_single_simplified(admin: signer, investor: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Record investment using test-only function
        record_investment_test_only(&investor, 500);
        
        // Verify investor was recorded
        assert!(investor_exists(signer::address_of(&investor)), 1);
        let investor_info = get_investor_info(signer::address_of(&investor));
        assert!(investor_info.amount_tokens == 500, 2);
        
        // Verify processing entry was created
        assert!(get_processing_count() == 1, 3);
        let processing_info = get_processing_info(1);
        assert!(processing_info.address == signer::address_of(&investor), 4);
        assert!(processing_info.amount == 500, 5);
        
        // Verify counts
        assert!(get_investor_count() == 1, 6);
    }

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test recording multiple investments from the same investor (simplified)
    public entry fun test_record_investment_multiple_same_investor_simplified(admin: signer, investor: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Record first investment
        record_investment_test_only(&investor, 300);
        
        // Record second investment from same investor
        record_investment_test_only(&investor, 200);
        
        // Verify investor info (should be cumulative)
        let investor_info = get_investor_info(signer::address_of(&investor));
        assert!(investor_info.amount_tokens == 500, 1);
        
        // Verify processing entries (should be separate)
        assert!(get_processing_count() == 2, 2);
        let processing1 = get_processing_info(1);
        let processing2 = get_processing_info(2);
        assert!(processing1.amount == 300, 3);
        assert!(processing2.amount == 200, 4);
        
        // Verify investor count (should still be 1 unique investor)
        assert!(get_investor_count() == 1, 5);
    }

    #[test(admin = @admin_addr, investor1 = @0x123, investor2 = @0x456, aptos_framework = @0x1)]
    /// Test recording investments from multiple different investors (simplified)
    public entry fun test_record_investment_multiple_investors_simplified(admin: signer, investor1: signer, investor2: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor1));
        account::create_account_for_test(signer::address_of(&investor2));
        
        // Initialize the module
        init_module(&admin);
        
        // Record investments from different investors
        record_investment_test_only(&investor1, 400);
        record_investment_test_only(&investor2, 600);
        
        // Verify both investors exist
        assert!(investor_exists(signer::address_of(&investor1)), 1);
        assert!(investor_exists(signer::address_of(&investor2)), 2);
        
        // Verify individual investor amounts
        let investor1_info = get_investor_info(signer::address_of(&investor1));
        let investor2_info = get_investor_info(signer::address_of(&investor2));
        assert!(investor1_info.amount_tokens == 400, 3);
        assert!(investor2_info.amount_tokens == 600, 4);
        
        // Verify processing entries
        assert!(get_processing_count() == 2, 5);
        
        // Verify investor count
        assert!(get_investor_count() == 2, 6);
    }

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test zero amount investment (edge case)
    public entry fun test_record_investment_zero_amount_simplified(admin: signer, investor: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Record zero investment
        record_investment_test_only(&investor, 0);
        
        // Verify investor was still recorded
        assert!(investor_exists(signer::address_of(&investor)), 1);
        let investor_info = get_investor_info(signer::address_of(&investor));
        assert!(investor_info.amount_tokens == 0, 2);
        
        // Verify processing entry was created
        assert!(get_processing_count() == 1, 3);
        let processing_info = get_processing_info(1);
        assert!(processing_info.amount == 0, 4);
    }

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test large amount investment
    public entry fun test_record_investment_large_amount_simplified(admin: signer, investor: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Record large investment
        let large_amount = 500000000; // 500 million
        record_investment_test_only(&investor, large_amount);
        
        // Verify investment was recorded correctly
        let investor_info = get_investor_info(signer::address_of(&investor));
        assert!(investor_info.amount_tokens == large_amount, 1);
        
        let processing_info = get_processing_info(1);
        assert!(processing_info.amount == large_amount, 2);
    }

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test complex scenario with multiple investments and different amounts
    public entry fun test_complex_investment_scenario_simplified(admin: signer, investor: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Record multiple investments with different amounts
        let amounts = vector[100, 250, 50, 1000, 25];
        let total_expected = 0;
        let i = 0;
        while (i < vector::length(&amounts)) {
            let amount = *vector::borrow(&amounts, i);
            record_investment_test_only(&investor, amount);
            total_expected = total_expected + amount;
            i = i + 1;
        };
        
        // Verify cumulative amount
        let investor_info = get_investor_info(signer::address_of(&investor));
        assert!(investor_info.amount_tokens == total_expected, 1);
        
        // Verify all processing entries were created
        assert!(get_processing_count() == 5, 2);
        
        // Verify investor count is still 1
        assert!(get_investor_count() == 1, 3);
        
        // Verify each processing entry has correct amount
        i = 0;
        while (i < vector::length(&amounts)) {
            let expected_amount = *vector::borrow(&amounts, i);
            let processing_info = get_processing_info(i + 1);
            assert!(processing_info.amount == expected_amount, 4);
            assert!(processing_info.address == signer::address_of(&investor), 5);
            i = i + 1;
        };
    }

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test investment data integrity and state consistency
    public entry fun test_investment_data_integrity_simplified(admin: signer, investor: signer, aptos_framework: signer) acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Record initial investment
        record_investment_test_only(&investor, 1000);
        
        // Verify initial state
        let initial_investor_info = get_investor_info(signer::address_of(&investor));
        let initial_processing_info = get_processing_info(1);
        
        assert!(initial_investor_info.amount_tokens == 1000, 1);
        assert!(initial_processing_info.amount == 1000, 2);
        assert!(initial_processing_info.address == signer::address_of(&investor), 3);
        
        // Record additional investment
        record_investment_test_only(&investor, 500);
        
        // Verify updated state
        let updated_investor_info = get_investor_info(signer::address_of(&investor));
        let second_processing_info = get_processing_info(2);
        
        // Investor amount should be cumulative
        assert!(updated_investor_info.amount_tokens == 1500, 4);
        
        // Processing entries should be separate
        assert!(second_processing_info.amount == 500, 5);
        assert!(second_processing_info.address == signer::address_of(&investor), 6);
        
        // First processing entry should remain unchanged
        let unchanged_processing_info = get_processing_info(1);
        assert!(unchanged_processing_info.amount == 1000, 7);
        assert!(unchanged_processing_info.address == signer::address_of(&investor), 8);
        
        // Counts should be correct
        assert!(get_investor_count() == 1, 9);
        assert!(get_processing_count() == 2, 10);
    }

    #[test(admin = @admin_addr, supplier = @0x789, aptos_framework = @0x1)]
    /// Test recording invoice pending functionality
    public entry fun test_record_invoice_pending(admin: signer, supplier: signer, aptos_framework: signer) acquires ProcessingInvoiceRegistery {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Initialize the module
        init_module(&admin);
        
        // Record invoice pending
        record_invoice_pending(12345, &supplier);
        
        // Verify invoice was recorded
        assert!(get_processing_invoice_count() == 1, 1);
        
        let processing_invoice = get_processing_invoice(1);
        assert!(processing_invoice.invoice_id == 12345, 2);
        assert!(processing_invoice.supplier_addr == signer::address_of(&supplier), 3);
    }

    #[test(admin = @admin_addr, investor = @0x123, aptos_framework = @0x1)]
    /// Test investment pool updates correctly
    public entry fun test_investment_pool_updates(admin: signer, investor: signer, aptos_framework: signer) 
        acquires InvestorRegistry, InvestmentPool {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create accounts
        account::create_account_for_test(signer::address_of(&admin));
        account::create_account_for_test(signer::address_of(&investor));
        
        // Initialize the module
        init_module(&admin);
        
        // Check initial pool state
        let initial_pool = get_investment_pool();
        assert!(initial_pool.remaining_tokens == 0, 1);
        assert!(initial_pool.funded_tokens == 0, 2);
        
        // Record investment
        record_investment_test_only(&investor, 1000);
        
        // Check pool state after investment
        let updated_pool = get_investment_pool();
        assert!(updated_pool.remaining_tokens == 1000, 3);
        assert!(updated_pool.funded_tokens == 0, 4);
        
        // Record another investment
        record_investment_test_only(&investor, 500);
        
        // Check final pool state
        let final_pool = get_investment_pool();
        assert!(final_pool.remaining_tokens == 1500, 5);
        assert!(final_pool.funded_tokens == 0, 6);
    }
}
