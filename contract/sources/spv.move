module spv_addr::spv {


    use aptos_std::signer;
    use stablecoin::invoice_coin;
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::table::{Self, Table};

    struct InvestmentPool {
        remaining_tokens: u64,
        funded_tokens: u64,
    }

    struct Investor {
        addr: address,
        amount_tokens: u64,
    }

    struct InvestorRegistry {
        investors: Table<u64, Investor>,
        investors_count: u64,
    }

    fun init_module(admin: &signer) {
        let admin_address = signer::address_of(admin);
        let pool = InvestmentPool {
            remaining_tokens: 0,
            funded_tokens: 0,
        };
        // Store the pool in a resource
        move_to(admin_address, pool)
    }

    public entry fun transfer_tokens_to_investor(investor: &signer, amount: u64){
        // Transfer the equivalent amount of USD/APT to this contract
        // Transfer the tokens from current primary store to the investor
        // Call update inv pool
    }

    public entry fun transfer_buyer_payback_to_investor(admin: &signer, amount_in_usd: u64){
        // Transfer the equivalent amount of USD to this contract
        // Call update inv pool
    }

    public entry fun transfer_to_supplier(admin: &signer, invoice_id: u64) {
        // Just transfer the received amount to the supplier
    }

    fun update_inv_pool(admin: &signer, new_remaining: u64, new_funded: u64) {
        let admin_address = signer::address_of(admin);
        let pool = borrow_global_mut<InvestmentPool>(admin_address);
        pool.remaining_tokens = new_remaining;
        pool.funded_tokens = new_funded;
    }
}