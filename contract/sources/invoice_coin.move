/// Example of a managed stablecoin with mint, burn, freeze and pause functionalities.
module rwfi_addr::invoice_coin {
    use aptos_framework::dispatchable_fungible_asset;
    use aptos_framework::event;
    use aptos_framework::function_info;
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata, FungibleAsset, FungibleStore};
    use aptos_framework::object::{Self, Object, ExtendRef};
    use aptos_framework::primary_fungible_store;
    use std::option;
    use std::signer;
    use std::string::{Self, utf8};
    use std::vector;

    /// Caller is not authorized to make this call
    const EUNAUTHORIZED: u64 = 1;
    /// No operations are allowed when contract is paused
    const EPAUSED: u64 = 2;
    /// The account is already a minter
    const EALREADY_MINTER: u64 = 3;
    /// The account is not a minter
    const ENOT_MINTER: u64 = 4;
    /// The account is denylisted
    const EDENYLISTED: u64 = 5;

    const ASSET_SYMBOL: vector<u8> = b"INV";

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Roles has key {
        master_minter: address,
        minters: vector<address>,
        pauser: address,
        denylister: address,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct Management has key {
        extend_ref: ExtendRef,
        mint_ref: MintRef,
        burn_ref: BurnRef,
        transfer_ref: TransferRef,
    }

    #[resource_group_member(group = aptos_framework::object::ObjectGroup)]
    struct State has key {
        paused: bool,
    }

    struct Approval has drop {
        owner: address,
        to: address,
        nonce: u64,
        chain_id: u8,
        spender: address,
        amount: u64,
    }

    #[event]
    struct Mint has drop, store {
        minter: address,
        to: address,
        amount: u64,
    }

    #[event]
    struct Burn has drop, store {
        minter: address,
        from: address,
        store: Object<FungibleStore>,
        amount: u64,
    }

    #[event]
    struct Pause has drop, store {
        pauser: address,
        is_paused: bool,
    }

    #[event]
    struct Denylist has drop, store {
        denylister: address,
        account: address,
    }

    #[view]
    public fun inv_address(): address {
        // Return the address where the INV fungible asset object was created
        // This matches what create_named_object creates in init_module
        object::create_object_address(&@rwfi_addr, ASSET_SYMBOL)
    }

    #[view]
    public fun metadata(): Object<Metadata> {
        object::address_to_object(inv_address())
    }

    /// Called as part of deployment to initialize the stablecoin.
    /// Note: The signer has to be the account where the module is published.
    /// Create a stablecoin token (a new Fungible Asset)
    /// Ensure any stores for the stablecoin are untransferable.
    /// Store Roles, Management and State resources in the Metadata object.
    /// Override deposit and withdraw functions of the newly created asset/token to add custom denylist logic.
    fun init_module(inv_signer: &signer) {
        // Create the stablecoin with primary store support.
        let constructor_ref = &object::create_named_object(inv_signer, ASSET_SYMBOL);
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),
            utf8(ASSET_SYMBOL), /* name */
            utf8(ASSET_SYMBOL), /* symbol */
            0, /* decimals */
            utf8(b"http://example.com/favicon.ico"), /* icon */
            utf8(b"http://example.com"), /* project */
        );

        // Set ALL stores for the fungible asset to untransferable.
        fungible_asset::set_untransferable(constructor_ref);

        // All resources created will be kept in the asset metadata object.
        let metadata_object_signer = &object::generate_signer(constructor_ref);
        move_to(metadata_object_signer, Roles {
            master_minter: signer::address_of(inv_signer),
            minters: vector[],
            pauser: signer::address_of(inv_signer),
            denylister: signer::address_of(inv_signer),
        });

        // Create mint/burn/transfer refs to allow creator to manage the stablecoin.
        move_to(metadata_object_signer, Management {
            extend_ref: object::generate_extend_ref(constructor_ref),
            mint_ref: fungible_asset::generate_mint_ref(constructor_ref),
            burn_ref: fungible_asset::generate_burn_ref(constructor_ref),
            transfer_ref: fungible_asset::generate_transfer_ref(constructor_ref),
        });

        move_to(metadata_object_signer, State {
            paused: false,
        });

        // Override the deposit and withdraw functions which mean overriding transfer.
        // This ensures all transfer will call withdraw and deposit functions in this module and perform the necessary
        // checks.
        let deposit = function_info::new_function_info(
            inv_signer,
            string::utf8(b"invoice_coin"),
            string::utf8(b"deposit"),
        );
        let withdraw = function_info::new_function_info(
            inv_signer,
            string::utf8(b"invoice_coin"),
            string::utf8(b"withdraw"),
        );
        dispatchable_fungible_asset::register_dispatch_functions(
            constructor_ref,
            option::some(withdraw),
            option::some(deposit),
            option::none(),
        );
    }

    /// Allow a spender to transfer tokens from the owner's account given their signed approval.
    /// Caller needs to provide the from account's scheme and public key which can be gotten via the Aptos SDK.
    public fun transfer_from(
        spender: &signer,
        from: address,
        to: address,
        amount: u64,
    ) acquires Management, State {
        assert_not_paused();
        assert_not_denylisted(from);
        assert_not_denylisted(to);

        let transfer_ref = &borrow_global<Management>(inv_address()).transfer_ref;
        // Only use with_ref API for primary_fungible_store (PFS) transfers in this module.
        primary_fungible_store::transfer_with_ref(transfer_ref, from, to, amount);
    }

    /// Deposit function override to ensure that the account is not denylisted and the stablecoin is not paused.
    public fun deposit<T: key>(
        store: Object<T>,
        fa: FungibleAsset,
        transfer_ref: &TransferRef,
    ) acquires State {
        assert_not_paused();
        assert_not_denylisted(object::owner(store));
        fungible_asset::deposit_with_ref(transfer_ref, store, fa);
    }

    /// Withdraw function override to ensure that the account is not denylisted and the stablecoin is not paused.
    public fun withdraw<T: key>(
        store: Object<T>,
        amount: u64,
        transfer_ref: &TransferRef,
    ): FungibleAsset acquires State {
        assert_not_paused();
        assert_not_denylisted(object::owner(store));
        fungible_asset::withdraw_with_ref(transfer_ref, store, amount)
    }

    /// Mint new tokens to the specified account. This checks that the caller is a minter, the stablecoin is not paused,
    /// and the account is not denylisted.
    public entry fun mint(minter: &signer, to: address, amount: u64) acquires Management, Roles, State {
        assert_not_paused();
        assert_is_minter(minter);
        assert_not_denylisted(to);
        if (amount == 0) { return };

        let management = borrow_global<Management>(inv_address());
        let tokens = fungible_asset::mint(&management.mint_ref, amount);
        // Ensure not to call pfs::deposit or dfa::deposit directly in the module.
        deposit(primary_fungible_store::ensure_primary_store_exists(to, metadata()), tokens, &management.transfer_ref);

        event::emit(Mint {
            minter: signer::address_of(minter),
            to,
            amount,
        });
    }

    /// Burn tokens from the specified account. This checks that the caller is a minter and the stablecoin is not paused.
    public entry fun burn(minter: &signer, from: address, amount: u64) acquires Management, Roles, State {
        burn_from(minter, primary_fungible_store::ensure_primary_store_exists(from, metadata()), amount);
    }

    /// Burn tokens from the specified account's store. This checks that the caller is a minter and the stablecoin is
    /// not paused.
    public entry fun burn_from(
        minter: &signer,
        store: Object<FungibleStore>,
        amount: u64,
    ) acquires Management, Roles, State {
        assert_not_paused();
        assert_is_minter(minter);
        if (amount == 0) { return };

        let management = borrow_global<Management>(inv_address());
        let tokens = fungible_asset::withdraw_with_ref(
            &management.transfer_ref,
            store,
            amount,
        );
        fungible_asset::burn(&management.burn_ref, tokens);

        event::emit(Burn {
            minter: signer::address_of(minter),
            from: object::owner(store),
            store,
            amount,
        });
    }

    /// Pause or unpause the stablecoin. This checks that the caller is the pauser.
    public entry fun set_pause(pauser: &signer, paused: bool) acquires Roles, State {
        let roles = borrow_global<Roles>(inv_address());
        assert!(signer::address_of(pauser) == roles.pauser, EUNAUTHORIZED);
        let state = borrow_global_mut<State>(inv_address());
        if (state.paused == paused) { return };
        state.paused = paused;

        event::emit(Pause {
            pauser: signer::address_of(pauser),
            is_paused: paused,
        });
    }

    /// Add an account to the denylist. This checks that the caller is the denylister.
    public entry fun denylist(denylister: &signer, account: address) acquires Management, Roles, State {
        assert_not_paused();
        let roles = borrow_global<Roles>(inv_address());
        assert!(signer::address_of(denylister) == roles.denylister, EUNAUTHORIZED);

        let freeze_ref = &borrow_global<Management>(inv_address()).transfer_ref;
        primary_fungible_store::set_frozen_flag(freeze_ref, account, true);

        event::emit(Denylist {
            denylister: signer::address_of(denylister),
            account,
        });
    }

    /// Remove an account from the denylist. This checks that the caller is the denylister.
    public entry fun undenylist(denylister: &signer, account: address) acquires Management, Roles, State {
        assert_not_paused();
        let roles = borrow_global<Roles>(inv_address());
        assert!(signer::address_of(denylister) == roles.denylister, EUNAUTHORIZED);

        let freeze_ref = &borrow_global<Management>(inv_address()).transfer_ref;
        primary_fungible_store::set_frozen_flag(freeze_ref, account, false);

        event::emit(Denylist {
            denylister: signer::address_of(denylister),
            account,
        });
    }

    /// Add a new minter. This checks that the caller is the master minter and the account is not already a minter.
    public entry fun add_minter(admin: &signer, minter: address) acquires Roles, State {
        assert_not_paused();
        let roles = borrow_global_mut<Roles>(inv_address());
        assert!(signer::address_of(admin) == roles.master_minter, EUNAUTHORIZED);
        assert!(!vector::contains(&roles.minters, &minter), EALREADY_MINTER);
        vector::push_back(&mut roles.minters, minter);
    }

    /// Transfer master minter role - used for admin takeover
    public entry fun transfer_master_minter(current_master: &signer, new_master: address) acquires Roles, State {
        assert_not_paused();
        let roles = borrow_global_mut<Roles>(inv_address());
        assert!(signer::address_of(current_master) == roles.master_minter, EUNAUTHORIZED);
        roles.master_minter = new_master;
    }

    /// Mint tokens to primary store - used by SPV
    public fun mint_to_primary_store(minter: address, to: address, amount: u64) acquires Roles, Management, State {
        assert_not_paused();
        let roles = borrow_global<Roles>(inv_address());
        assert!(minter == roles.master_minter || vector::contains(&roles.minters, &minter), EUNAUTHORIZED);
        assert_not_denylisted(to);
        
        let management = borrow_global<Management>(inv_address());
        let fa = fungible_asset::mint(&management.mint_ref, amount);
        // Use our custom deposit function with the transfer_ref to work with dispatch system
        deposit(primary_fungible_store::ensure_primary_store_exists(to, metadata()), fa, &management.transfer_ref);
    }

    /// Burn tokens from primary store - used by SPV
    public fun burn_from_primary_store(minter: address, from: address, amount: u64) acquires Roles, Management, State {
        assert_not_paused();
        let roles = borrow_global<Roles>(inv_address());
        assert!(minter == roles.master_minter || vector::contains(&roles.minters, &minter), EUNAUTHORIZED);
        assert_not_denylisted(from);
        
        let management = borrow_global<Management>(inv_address());
        let store = primary_fungible_store::primary_store(from, metadata());
        let fa = fungible_asset::withdraw_with_ref(&management.transfer_ref, store, amount);
        fungible_asset::burn(&management.burn_ref, fa);
    }

    #[view]
    public fun get_total_supply(): u64 {
        let metadata = metadata();
        (option::extract(&mut fungible_asset::supply(metadata)) as u64)
    }

    #[view]
    public fun get_balance(account_addr: address): u64 {
        primary_fungible_store::balance(account_addr, metadata())
    }

    #[view]
    public fun get_master_minter(): address acquires Roles {
        let roles = borrow_global<Roles>(inv_address());
        roles.master_minter
    }

    fun assert_is_minter(minter: &signer) acquires Roles {
        let roles = borrow_global<Roles>(inv_address());
        let minter_addr = signer::address_of(minter);
        assert!(minter_addr == roles.master_minter || vector::contains(&roles.minters, &minter_addr), EUNAUTHORIZED);
    }

    fun assert_not_paused() acquires State {
        let state = borrow_global<State>(inv_address());
        assert!(!state.paused, EPAUSED);
    }

    // Check that the account is not denylisted by checking the frozen flag on the primary store
    fun assert_not_denylisted(account: address) {
        let metadata = metadata();
        // CANNOT call into pfs::store_exists in our withdraw/deposit hooks as it creates possibility of a circular dependency.
        // Instead, we will call the inlined version of the function.
        if (primary_fungible_store::primary_store_exists_inlined(account, metadata)) {
            assert!(!fungible_asset::is_frozen(primary_fungible_store::primary_store_inlined(account, metadata)), EDENYLISTED);
        }
    }

    #[test_only]
    public fun init_for_test(inv_signer: &signer) {
        init_module(inv_signer);
    }
}