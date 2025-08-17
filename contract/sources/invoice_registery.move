module invreg_addr::invoice_registery {

    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;
    use aptos_std::table::{Self, Table};
    use aptos_std::signer;
    use std::vector;

    struct Invoice has store, drop, copy {
        supplier_addr: address,
        amount: u64,
        funded_amount: u64,
        due_date: u64,
        ipfs_hash: vector<u8>,
    }


    struct InvoiceRegistry has key {
        invoices: Table<u64, Invoice>,
        insert_invoice: event::EventHandle<Invoice>,
        invoice_count: u64,
    }



    public entry fun create_invoice(supplier_addr: &signer, amount: u64, funded_amount: u64, due_date: u64, ipfs_hash: vector<u8>) acquires InvoiceRegistry {
        if(!exists<InvoiceRegistry>(signer::address_of(supplier_addr))){
            move_to(supplier_addr, InvoiceRegistry {
                invoices: table::new(),
                insert_invoice: account::new_event_handle<Invoice>(supplier_addr),
                invoice_count: 0
            });
        };

        let invoice = Invoice{
            supplier_addr: signer::address_of(supplier_addr),
            amount,
            funded_amount,
            due_date: timestamp::now_seconds() + due_date,
            ipfs_hash
        };

        let signer_inv_reg = borrow_global_mut<InvoiceRegistry>(signer::address_of(supplier_addr));

        table::upsert(&mut signer_inv_reg.invoices, signer_inv_reg.invoice_count + 1 , invoice);
        signer_inv_reg.invoice_count += 1;
        event::emit_event<Invoice>(
            &mut borrow_global_mut<InvoiceRegistry>(signer::address_of(supplier_addr)).insert_invoice,
            invoice
        );

        // Create a Pool for Invoice
    }

    #[view]
    public fun get_invoice(id: u64, supplier_addr: address): Invoice acquires InvoiceRegistry {
        let supplier_inv_reg = borrow_global<InvoiceRegistry>(supplier_addr);
        let invoice = table::borrow(&supplier_inv_reg.invoices, id);
        *invoice
    }

    public entry fun update_invoice(id: u64, supplier_addr: &signer, amount: u64, funded_amount: u64, due_date: u64, ipfs_hash: vector<u8>) acquires InvoiceRegistry {
        let signer_inv_reg = borrow_global_mut<InvoiceRegistry>(signer::address_of(supplier_addr));
        let invoice = table::borrow_mut(&mut signer_inv_reg.invoices, id);
        invoice.supplier_addr = signer::address_of(supplier_addr);
        invoice.amount = amount;
        invoice.funded_amount = funded_amount;
        invoice.due_date = due_date;
        invoice.ipfs_hash = ipfs_hash;
    }

    #[view]
    public fun get_invoices(supplier_addr: address): vector<Invoice> acquires InvoiceRegistry {
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

    fun create_pool(invoice_id: u64, supplier_addr: address) {}
    public entry fun close_pool() {}
    public entry fun fund_pool() {}
    public entry fun refund_pool() {}
    public entry fun liquidate_invoice() {}
    fun claim_return() {}

}