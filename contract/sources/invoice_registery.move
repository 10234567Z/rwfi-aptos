module invreg_addr::invoice_registery {

    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_framework::aptos_account;
    use aptos_std::table::{Self, Table};
    use aptos_std::signer;
    use std::vector;
    use std::option;
    use std::string::{Self, utf8};
    use aptos_token::token;
    use aptos_token::token::TokenDataId;
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;

    // Error constants
    const E_INVOICE_REGISTRY_NOT_EXISTS: u64 = 393221;
    const E_INVOICE_NOT_EXISTS: u64 = 393217;

    struct BuyerData has key, copy, store, drop {
        info: vector<u8>
    }

    struct Invoice has store, drop, copy {
        supplier_addr: address,
        amount: u64,
        due_date: u64,
        buyer_data: BuyerData,
        funded_amount: u64,
    }


    struct InvoiceRegistry has key {
        invoices: Table<u64, Invoice>,
        insert_invoice: event::EventHandle<Invoice>,
        invoice_count: u64,
        funded_invoice_count: u64
    }

    public entry fun create_invoice(supplier_addr: &signer, amount: u64, due_date: u64, buyer_data_info: vector<u8>) acquires InvoiceRegistry {
        if(!exists<InvoiceRegistry>(signer::address_of(supplier_addr))){
            move_to(supplier_addr, InvoiceRegistry {
                invoices: table::new(),
                insert_invoice: account::new_event_handle<Invoice>(supplier_addr),
                funded_invoice_count: 0,
                invoice_count: 0
            });
        };

        let invoice = Invoice{
            supplier_addr: signer::address_of(supplier_addr),
            amount,
            due_date: due_date,
            buyer_data: BuyerData { info: buyer_data_info},
            funded_amount: 0
        };

        let signer_inv_reg = borrow_global_mut<InvoiceRegistry>(signer::address_of(supplier_addr));
        table::upsert(&mut signer_inv_reg.invoices, signer_inv_reg.invoice_count + 1 , invoice);
        signer_inv_reg.invoice_count += 1;
        event::emit_event<Invoice>(
            &mut borrow_global_mut<InvoiceRegistry>(signer::address_of(supplier_addr)).insert_invoice,
            invoice
        );
    }

    #[view]
    public fun get_invoice(id: u64, supplier_addr: address): Invoice acquires InvoiceRegistry {
        assert!(exists<InvoiceRegistry>(supplier_addr), E_INVOICE_REGISTRY_NOT_EXISTS);
        let supplier_inv_reg = borrow_global<InvoiceRegistry>(supplier_addr);
        assert!(table::contains(&supplier_inv_reg.invoices, id), E_INVOICE_NOT_EXISTS);
        let invoice = table::borrow(&supplier_inv_reg.invoices, id);
        *invoice
    }

    public entry fun update_invoice(id: u64, supplier_addr: &signer, amount: u64, due_date: u64, buyer_data_info: vector<u8>) acquires InvoiceRegistry {
        let signer_addr = signer::address_of(supplier_addr);
        assert!(exists<InvoiceRegistry>(signer_addr), E_INVOICE_REGISTRY_NOT_EXISTS);
        let signer_inv_reg = borrow_global_mut<InvoiceRegistry>(signer_addr);
        assert!(table::contains(&signer_inv_reg.invoices, id), E_INVOICE_NOT_EXISTS);
        let invoice = table::borrow_mut(&mut signer_inv_reg.invoices, id);
        invoice.supplier_addr = signer_addr;
        invoice.amount = amount;
        invoice.due_date = due_date;
        invoice.buyer_data = BuyerData { info: buyer_data_info };
    }

    #[view]
    public fun get_invoices(supplier_addr: address): vector<Invoice> acquires InvoiceRegistry {
        assert!(exists<InvoiceRegistry>(supplier_addr), E_INVOICE_REGISTRY_NOT_EXISTS);
        let supplier_inv_reg = borrow_global<InvoiceRegistry>(supplier_addr);
        let invoices = vector::empty<Invoice>();
        let i = 1;
        while (i <= supplier_inv_reg.invoice_count) {
            let invoice = *table::borrow(&supplier_inv_reg.invoices, i);
            vector::push_back(&mut invoices, invoice);
            i = i + 1;
        };
        invoices
    }

    public entry fun test(sig: &signer,amount: u64) {
        aptos_account::transfer(sig, @invreg_addr, 100);
    }

    // ===== TEST CASES =====

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test creating a single invoice
    public entry fun test_create_invoice(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create invoice
        create_invoice(&supplier, 1000, 4500, b"Test Buyer Data");
        
        // Verify invoice was created
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.supplier_addr == signer::address_of(&supplier), 1);
        assert!(invoice.amount == 1000, 2);
        assert!(invoice.due_date == 4500, 3);
        assert!(invoice.funded_amount == 0, 4);
        assert!(invoice.buyer_data.info == b"Test Buyer Data", 5);
        
        // Verify registry state
        let registry = borrow_global<InvoiceRegistry>(signer::address_of(&supplier));
        assert!(registry.invoice_count == 1, 6);
        assert!(registry.funded_invoice_count == 0, 7);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test creating multiple invoices
    public entry fun test_create_multiple_invoices(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create multiple invoices
        create_invoice(&supplier, 1000, 4500, b"Buyer 1");
        create_invoice(&supplier, 2000, 5000, b"Buyer 2");
        create_invoice(&supplier, 1500, 4800, b"Buyer 3");
        
        // Verify all invoices were created
        let invoices = get_invoices(signer::address_of(&supplier));
        assert!(vector::length(&invoices) == 3, 1);
        
        // Verify individual invoices
        let invoice1 = get_invoice(1, signer::address_of(&supplier));
        let invoice2 = get_invoice(2, signer::address_of(&supplier));
        let invoice3 = get_invoice(3, signer::address_of(&supplier));
        
        assert!(invoice1.amount == 1000, 2);
        assert!(invoice2.amount == 2000, 3);
        assert!(invoice3.amount == 1500, 4);
        
        // Verify registry count
        let registry = borrow_global<InvoiceRegistry>(signer::address_of(&supplier));
        assert!(registry.invoice_count == 3, 5);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test updating an existing invoice
    public entry fun test_update_invoice(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create initial invoice
        create_invoice(&supplier, 1000, 4500, b"Original Buyer");
        
        // Update the invoice
        update_invoice(1, &supplier, 2000, 5500, b"Updated Buyer");
        
        // Verify invoice was updated
        let updated_invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(updated_invoice.amount == 2000, 1);
        assert!(updated_invoice.due_date == 5500, 2);
        assert!(updated_invoice.buyer_data.info == b"Updated Buyer", 3);
        assert!(updated_invoice.supplier_addr == signer::address_of(&supplier), 4);
        
        // Verify count remains the same
        let registry = borrow_global<InvoiceRegistry>(signer::address_of(&supplier));
        assert!(registry.invoice_count == 1, 5);
    }

    #[test(supplier1=@0x123, supplier2=@0x456, aptos_framework=@0x1)]
    /// Test multiple suppliers with separate registries
    public entry fun test_multiple_suppliers(supplier1: signer, supplier2: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier1));
        account::create_account_for_test(signer::address_of(&supplier2));
        
        // Create invoices for different suppliers
        create_invoice(&supplier1, 1000, 4500, b"Supplier1 Buyer");
        create_invoice(&supplier2, 2000, 5000, b"Supplier2 Buyer");
        create_invoice(&supplier1, 1500, 4800, b"Supplier1 Buyer2");
        
        // Verify separate registries
        let supplier1_invoices = get_invoices(signer::address_of(&supplier1));
        let supplier2_invoices = get_invoices(signer::address_of(&supplier2));
        
        assert!(vector::length(&supplier1_invoices) == 2, 1);
        assert!(vector::length(&supplier2_invoices) == 1, 2);
        
        // Verify invoice data
        let s1_invoice1 = get_invoice(1, signer::address_of(&supplier1));
        let s2_invoice1 = get_invoice(1, signer::address_of(&supplier2));
        
        assert!(s1_invoice1.amount == 1000, 3);
        assert!(s2_invoice1.amount == 2000, 4);
        assert!(s1_invoice1.supplier_addr == signer::address_of(&supplier1), 5);
        assert!(s2_invoice1.supplier_addr == signer::address_of(&supplier2), 6);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test edge cases with zero amounts and empty buyer data
    public entry fun test_edge_cases(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create invoice with zero amount
        create_invoice(&supplier, 0, 1000, b"Zero Amount");
        
        // Create invoice with empty buyer data
        create_invoice(&supplier, 500, 2000, b"");
        
        // Create invoice with large amount
        create_invoice(&supplier, 18446744073709551615, 3000, b"Max Amount"); // Max u64
        
        // Verify all invoices
        let invoices = get_invoices(signer::address_of(&supplier));
        assert!(vector::length(&invoices) == 3, 1);
        
        let zero_invoice = get_invoice(1, signer::address_of(&supplier));
        let empty_data_invoice = get_invoice(2, signer::address_of(&supplier));
        let max_invoice = get_invoice(3, signer::address_of(&supplier));
        
        assert!(zero_invoice.amount == 0, 2);
        assert!(empty_data_invoice.buyer_data.info == b"", 3);
        assert!(max_invoice.amount == 18446744073709551615, 4);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    #[expected_failure(abort_code = 393217, location = Self)]
    /// Test accessing non-existent invoice - should fail
    public entry fun test_get_nonexistent_invoice_failure(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create one invoice
        create_invoice(&supplier, 1000, 4500, b"Test Buyer");
        
        // Try to access non-existent invoice (should fail)
        get_invoice(999, signer::address_of(&supplier));
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    #[expected_failure(abort_code = 393217, location = Self)]
    /// Test updating non-existent invoice - should fail
    public entry fun test_update_nonexistent_invoice_failure(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create one invoice
        create_invoice(&supplier, 1000, 4500, b"Test Buyer");
        
        // Try to update non-existent invoice (should fail)
        update_invoice(999, &supplier, 2000, 5500, b"Updated");
    }

    #[test(supplier=@0x456, aptos_framework=@0x1)]
    #[expected_failure(abort_code = 0x60005, location = Self)]
    /// Test accessing invoices from non-existent registry - should fail
    public entry fun test_get_invoices_no_registry_failure(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test account but don't create any invoices
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Try to get invoices from non-existent registry (should fail)
        get_invoices(signer::address_of(&supplier));
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test invoice data integrity over multiple operations
    public entry fun test_invoice_data_integrity(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create invoices with specific data
        let buyer_data_1 = b"Company ABC - Order #12345";
        let buyer_data_2 = b"Individual John Doe - Service Contract";
        
        create_invoice(&supplier, 1500, 1693526400, buyer_data_1); // timestamp for Aug 31, 2023
        create_invoice(&supplier, 2500, 1696204800, buyer_data_2); // timestamp for Oct 1, 2023
        
        // Verify data integrity
        let invoice1 = get_invoice(1, signer::address_of(&supplier));
        let invoice2 = get_invoice(2, signer::address_of(&supplier));
        
        // Check all fields are preserved correctly
        assert!(invoice1.supplier_addr == signer::address_of(&supplier), 1);
        assert!(invoice1.amount == 1500, 2);
        assert!(invoice1.due_date == 1693526400, 3);
        assert!(invoice1.buyer_data.info == buyer_data_1, 4);
        assert!(invoice1.funded_amount == 0, 5);
        
        assert!(invoice2.supplier_addr == signer::address_of(&supplier), 6);
        assert!(invoice2.amount == 2500, 7);
        assert!(invoice2.due_date == 1696204800, 8);
        assert!(invoice2.buyer_data.info == buyer_data_2, 9);
        assert!(invoice2.funded_amount == 0, 10);
        
        // Update first invoice and verify second remains unchanged
        update_invoice(1, &supplier, 3000, 1695321600, b"Updated Company ABC");
        
        let updated_invoice1 = get_invoice(1, signer::address_of(&supplier));
        let unchanged_invoice2 = get_invoice(2, signer::address_of(&supplier));
        
        // Verify update worked
        assert!(updated_invoice1.amount == 3000, 11);
        assert!(updated_invoice1.buyer_data.info == b"Updated Company ABC", 12);
        
        // Verify second invoice unchanged
        assert!(unchanged_invoice2.amount == 2500, 13);
        assert!(unchanged_invoice2.buyer_data.info == buyer_data_2, 14);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test sequential invoice ID generation
    public entry fun test_sequential_invoice_ids(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create invoices sequentially
        create_invoice(&supplier, 1000, 4500, b"Invoice 1");
        create_invoice(&supplier, 2000, 5500, b"Invoice 2");
        create_invoice(&supplier, 3000, 6500, b"Invoice 3");
        
        // Verify sequential IDs
        let invoice1 = get_invoice(1, signer::address_of(&supplier));
        let invoice2 = get_invoice(2, signer::address_of(&supplier));
        let invoice3 = get_invoice(3, signer::address_of(&supplier));
        
        assert!(invoice1.buyer_data.info == b"Invoice 1", 1);
        assert!(invoice2.buyer_data.info == b"Invoice 2", 2);
        assert!(invoice3.buyer_data.info == b"Invoice 3", 3);
        
        // Verify registry count
        let registry = borrow_global<InvoiceRegistry>(signer::address_of(&supplier));
        assert!(registry.invoice_count == 3, 4);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test invoice with complex buyer data
    public entry fun test_complex_buyer_data(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create invoice with complex buyer data (JSON-like structure)
        let complex_data = b"{\"company\":\"TechCorp Ltd\",\"contact\":\"John Smith\",\"email\":\"john@techcorp.com\",\"orderRef\":\"ORD-2023-001\",\"items\":[{\"name\":\"Software License\",\"qty\":5}]}";
        create_invoice(&supplier, 50000, 1700000000, complex_data);
        
        // Verify complex data is preserved
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.buyer_data.info == complex_data, 1);
        assert!(invoice.amount == 50000, 2);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test invoice with very long buyer data
    public entry fun test_long_buyer_data(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create a long string (over 1000 characters)
        let long_data = b"This is a very long buyer data string that contains extensive information about the buyer, their company, contact details, shipping address, billing address, special instructions, product specifications, quality requirements, delivery terms, payment terms, warranty information, service level agreements, compliance requirements, regulatory information, tax details, currency preferences, language preferences, communication preferences, emergency contacts, escalation procedures, and much more detailed information that might be relevant for invoice processing and management in a complex business environment with multiple stakeholders and detailed requirements.";
        
        create_invoice(&supplier, 75000, 1710000000, long_data);
        
        // Verify long data is preserved
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.buyer_data.info == long_data, 1);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test invoice updates with different data types and lengths
    public entry fun test_comprehensive_invoice_updates(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create initial invoice
        create_invoice(&supplier, 1000, 4500, b"Initial Data");
        
        // Update with different amounts
        update_invoice(1, &supplier, 0, 4500, b"Zero Amount Update");
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.amount == 0, 1);
        
        // Update with maximum amount
        update_invoice(1, &supplier, 18446744073709551615, 4500, b"Max Amount Update");
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.amount == 18446744073709551615, 2);
        
        // Update with empty buyer data
        update_invoice(1, &supplier, 5000, 4500, b"");
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.buyer_data.info == b"", 3);
        
        // Update with normal data again
        update_invoice(1, &supplier, 2500, 6000, b"Final Update");
        let invoice = get_invoice(1, signer::address_of(&supplier));
        assert!(invoice.amount == 2500, 4);
        assert!(invoice.due_date == 6000, 5);
        assert!(invoice.buyer_data.info == b"Final Update", 6);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test get_invoices with large number of invoices
    public entry fun test_large_invoice_list(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create 10 invoices with different data
        let i = 0;
        while (i < 10) {
            let amount = (i + 1) * 1000;
            let due_date = 4500 + (i * 100);
            let buyer_data = vector::empty<u8>();
            vector::append(&mut buyer_data, b"Buyer ");
            // Simple way to add number to string
            if (i == 0) vector::append(&mut buyer_data, b"1");
            if (i == 1) vector::append(&mut buyer_data, b"2");
            if (i == 2) vector::append(&mut buyer_data, b"3");
            if (i == 3) vector::append(&mut buyer_data, b"4");
            if (i == 4) vector::append(&mut buyer_data, b"5");
            if (i == 5) vector::append(&mut buyer_data, b"6");
            if (i == 6) vector::append(&mut buyer_data, b"7");
            if (i == 7) vector::append(&mut buyer_data, b"8");
            if (i == 8) vector::append(&mut buyer_data, b"9");
            if (i == 9) vector::append(&mut buyer_data, b"10");
            
            create_invoice(&supplier, amount, due_date, buyer_data);
            i = i + 1;
        };
        
        // Verify all invoices exist
        let all_invoices = get_invoices(signer::address_of(&supplier));
        assert!(vector::length(&all_invoices) == 10, 1);
        
        // Verify specific invoices
        let first_invoice = get_invoice(1, signer::address_of(&supplier));
        let last_invoice = get_invoice(10, signer::address_of(&supplier));
        
        assert!(first_invoice.amount == 1000, 2);
        assert!(last_invoice.amount == 10000, 3);
        
        // Verify registry count
        let registry = borrow_global<InvoiceRegistry>(signer::address_of(&supplier));
        assert!(registry.invoice_count == 10, 4);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test mixed operations - create, update, create more
    public entry fun test_mixed_operations(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Create initial invoices
        create_invoice(&supplier, 1000, 4500, b"First Invoice");
        create_invoice(&supplier, 2000, 5500, b"Second Invoice");
        
        // Update first invoice
        update_invoice(1, &supplier, 1500, 4800, b"Updated First");
        
        // Create more invoices
        create_invoice(&supplier, 3000, 6500, b"Third Invoice");
        create_invoice(&supplier, 4000, 7500, b"Fourth Invoice");
        
        // Update third invoice
        update_invoice(3, &supplier, 3500, 6800, b"Updated Third");
        
        // Verify final state
        let invoice1 = get_invoice(1, signer::address_of(&supplier));
        let invoice2 = get_invoice(2, signer::address_of(&supplier));
        let invoice3 = get_invoice(3, signer::address_of(&supplier));
        let invoice4 = get_invoice(4, signer::address_of(&supplier));
        
        assert!(invoice1.amount == 1500, 1);
        assert!(invoice1.buyer_data.info == b"Updated First", 2);
        assert!(invoice2.amount == 2000, 3);
        assert!(invoice2.buyer_data.info == b"Second Invoice", 4);
        assert!(invoice3.amount == 3500, 5);
        assert!(invoice3.buyer_data.info == b"Updated Third", 6);
        assert!(invoice4.amount == 4000, 7);
        assert!(invoice4.buyer_data.info == b"Fourth Invoice", 8);
        
        // Verify total count
        let registry = borrow_global<InvoiceRegistry>(signer::address_of(&supplier));
        assert!(registry.invoice_count == 4, 9);
    }

    #[test(supplier=@0x123, aptos_framework=@0x1)]
    /// Test date edge cases with timestamps
    public entry fun test_date_edge_cases(supplier: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier));
        
        // Test with minimum timestamp (0)
        create_invoice(&supplier, 1000, 0, b"Zero Timestamp");
        
        // Test with maximum timestamp (max u64)
        create_invoice(&supplier, 2000, 18446744073709551615, b"Max Timestamp");
        
        // Test with current-ish timestamp (Unix timestamp for year 2025)
        create_invoice(&supplier, 3000, 1735689600, b"Year 2025"); // Jan 1, 2025
        
        // Verify all timestamps are preserved
        let invoice1 = get_invoice(1, signer::address_of(&supplier));
        let invoice2 = get_invoice(2, signer::address_of(&supplier));
        let invoice3 = get_invoice(3, signer::address_of(&supplier));
        
        assert!(invoice1.due_date == 0, 1);
        assert!(invoice2.due_date == 18446744073709551615, 2);
        assert!(invoice3.due_date == 1735689600, 3);
    }

    #[test(supplier1=@0x123, supplier2=@0x456, supplier3=@0x789, aptos_framework=@0x1)]
    /// Test concurrent operations across multiple suppliers
    public entry fun test_concurrent_suppliers(supplier1: signer, supplier2: signer, supplier3: signer, aptos_framework: signer) acquires InvoiceRegistry {
        // Initialize timestamp for testing
        timestamp::set_time_has_started_for_testing(&aptos_framework);
        
        // Create test accounts
        account::create_account_for_test(signer::address_of(&supplier1));
        account::create_account_for_test(signer::address_of(&supplier2));
        account::create_account_for_test(signer::address_of(&supplier3));
        
        // Interleaved operations across suppliers
        create_invoice(&supplier1, 1000, 4500, b"S1-Invoice1");
        create_invoice(&supplier2, 2000, 5500, b"S2-Invoice1");
        create_invoice(&supplier3, 3000, 6500, b"S3-Invoice1");
        
        create_invoice(&supplier1, 1100, 4600, b"S1-Invoice2");
        create_invoice(&supplier2, 2100, 5600, b"S2-Invoice2");
        
        update_invoice(1, &supplier1, 1050, 4550, b"S1-Updated");
        update_invoice(1, &supplier3, 3100, 6600, b"S3-Updated");
        
        create_invoice(&supplier3, 3200, 6700, b"S3-Invoice2");
        
        // Verify each supplier's state independently
        let s1_invoices = get_invoices(signer::address_of(&supplier1));
        let s2_invoices = get_invoices(signer::address_of(&supplier2));
        let s3_invoices = get_invoices(signer::address_of(&supplier3));
        
        assert!(vector::length(&s1_invoices) == 2, 1);
        assert!(vector::length(&s2_invoices) == 2, 2);
        assert!(vector::length(&s3_invoices) == 2, 3);
        
        // Verify specific invoice data
        let s1_invoice1 = get_invoice(1, signer::address_of(&supplier1));
        let s3_invoice1 = get_invoice(1, signer::address_of(&supplier3));
        
        assert!(s1_invoice1.amount == 1050, 4); // Updated
        assert!(s1_invoice1.buyer_data.info == b"S1-Updated", 5);
        assert!(s3_invoice1.amount == 3100, 6); // Updated
        assert!(s3_invoice1.buyer_data.info == b"S3-Updated", 7);
    }

}