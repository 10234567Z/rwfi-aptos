module rwfi_addr::invoice_registery_simple {
    use aptos_std::table::{Self, Table};
    use aptos_std::signer;
    use std::vector;

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
        invoice_count: u64,
        funded_invoice_count: u64
    }

    public entry fun create_invoice_simple(supplier_addr: &signer, amount: u64, due_date: u64, buyer_data_info: vector<u8>) acquires InvoiceRegistry {
        if(!exists<InvoiceRegistry>(signer::address_of(supplier_addr))){
            move_to(supplier_addr, InvoiceRegistry {
                invoices: table::new(),
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
        // No event emission to avoid authorization issues
    }

    #[view]
    public fun get_invoice_simple(id: u64, supplier_addr: address): Invoice acquires InvoiceRegistry {
        assert!(exists<InvoiceRegistry>(supplier_addr), E_INVOICE_REGISTRY_NOT_EXISTS);
        let supplier_inv_reg = borrow_global<InvoiceRegistry>(supplier_addr);
        assert!(table::contains(&supplier_inv_reg.invoices, id), E_INVOICE_NOT_EXISTS);
        let invoice = table::borrow(&supplier_inv_reg.invoices, id);
        *invoice
    }

    #[view]
    public fun get_invoices_simple(supplier_addr: address): vector<Invoice> acquires InvoiceRegistry {
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
}
