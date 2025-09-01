module spv_addr::spv {


    use aptos_std::signer;
    use stablecoin::invoice_coin;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};
    use aptos_framework::aptos_account;

    const E_INVALID_ADMIN_SIGNER: u64 = 0;

    struct InvestmentPool has key {
        remaining_tokens: u64,
        funded_tokens: u64,
        admin: address,
    }

    struct Investor has store, drop{
        amount_tokens: u64,
    }

    struct InvestorRegistry has key {
        investors: Table<address, Investor>,
        investors_count: u64,
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
            investors_count: 0,
        };
        // Store the pool with admin's resources
        move_to(admin, pool);
        move_to(admin, investor_reg);
    }

    public entry fun record_investment(investor: &signer, amount: u64) acquires InvestorRegistry {
        // Transfer the equivalent amount of USD/APT to this contract
        let investor_address = signer::address_of(investor);
        aptos_account::transfer(investor, @spv_addr, amount);

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
        }
    }

    public entry fun transfer_corresponding_invtokens(admin: &signer) {
        assert!(signer::address_of(admin) == @admin_addr, E_INVALID_ADMIN_SIGNER);
        
    }

    // public entry fun transfer_buyer_payback_to_investor(admin: &signer, amount_in_usd: u64){
    //     // Transfer the equivalent amount of USD to this contract
    //     // Call update inv pool
    // }

    // public entry fun transfer_to_supplier(admin: &signer, invoice_id: u64) {
    //     // Just transfer the received amount to the supplier
    // }

    fun update_inv_pool(admin: &signer, new_remaining: u64, new_funded: u64) acquires InvestmentPool {
        let admin_address = signer::address_of(admin);
        let pool = borrow_global_mut<InvestmentPool>(admin_address);
        pool.remaining_tokens = new_remaining;
        pool.funded_tokens = new_funded;
    }
}