# RWFI Aptos Testing Workflow

## Fresh Setup Summary
**Deployment Date**: September 6, 2025
**Contract Object Address**: `0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195`
**Admin Address**: `0x2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101`

## Role-Based Test Accounts

### Admin Profile
- **Profile**: `admin`
- **Address**: `0x2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101`
- **Role**: Contract deployment, token minting authority, system administration
- **Balance**: 100M Octas (1000 APT)

### Investor Profiles
- **Investor 1**:
  - Profile: `investor1`
  - Address: `0xd66c299aa599d93e4784219cb3eb99e6410f6df2f34609bc5d6828887aa6029a`
  - Role: Primary investor for testing investment flows
  - Balance: 100M Octas (1000 APT)

- **Investor 2**:
  - Profile: `investor2`
  - Address: `0x28c496cd918e522f05a785d93b6909ef0d6ad84ad723d68b2e2ee00496f23652`
  - Role: Secondary investor for multi-investor scenarios
  - Balance: 100M Octas (1000 APT)

### Supplier Profiles
- **Supplier 1**:
  - Profile: `supplier1`
  - Address: `0x8f9387d678d14120a0eeb7a87ee2517a55651701b480f6b2e1913e06759000b7`
  - Role: Primary supplier for invoice creation and funding
  - Balance: 100M Octas (1000 APT)

- **Supplier 2**:
  - Profile: `supplier2`
  - Address: `0x2923dfb55fae18541eeff79858616271e7245a8ec95bfcb35901fd16eb2292cc`
  - Role: Secondary supplier for multi-supplier scenarios
  - Balance: 100M Octas (1000 APT)

## Smart Contracts Overview

### 1. SPV Contract (`spv.move`)
- **Module**: `2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101::spv`
- **Functions**: 1019 lines with complete investment pooling logic
- **Key Features**:
  - Investment recording and token distribution
  - Invoice funding when target reached
  - Multi-version payback distribution (v1, v2, v3)
  - Real APT transfers between accounts

### 2. Invoice Coin Contract (`invoice_coin.move`)
- **Module**: `2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101::invoice_coin`
- **Functions**: 329 lines with full fungible asset implementation
- **Key Features**:
  - INV token minting and burning
  - Pause/unpause functionality
  - Denylist management
  - Minter role management

### 3. Invoice Registry Contract (`invoice_registery.move`)
- **Module**: `2d6d08a9578aee880cdc191ee29c74ca93fed3ace483b6bc5bf456fbe0d76101::invoice_registery_simple`
- **Functions**: 74 lines with simple invoice management
- **Key Features**:
  - Simple invoice creation without authorization issues
  - Clean invoice tracking system

## 6-Phase Testing Workflow

### Phase 1: System Initialization
```bash
# Contracts are auto-initialized on deployment via init_module
# Check if SPV is initialized
aptos move view --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::get_investment_pool" --max-gas 10000
```

### Phase 2: Invoice Creation
```bash
# Supplier1 creates an invoice
aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::invoice_registery_simple::create_invoice_simple" --args u64:500000000 string:"Invoice #001 - Q4 2025 Hardware Supply" --profile supplier1 --max-gas 10000
```

### Phase 3: Investment Collection
```bash
# Investor1 invests 200 APT (20B Octas)
aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::record_investment" --args u64:1 u64:20000000000 --profile investor1 --max-gas 10000

# Investor2 invests 300 APT (30B Octas) 
aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::record_investment" --args u64:1 u64:30000000000 --profile investor2 --max-gas 10000
```

### Phase 4: Token Distribution
```bash
# Admin mints and distributes INV tokens based on investments
aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::transfer_corresponding_invtokens" --args address:"0xd66c299aa599d93e4784219cb3eb99e6410f6df2f34609bc5d6828887aa6029a" u64:1 --profile admin

aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::transfer_corresponding_invtokens" --args address:"0x28c496cd918e522f05a785d93b6909ef0d6ad84ad723d68b2e2ee00496f23652" u64:1 --profile admin
```

### Phase 5: Invoice Funding
```bash
# Fund the invoice when target is reached
aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::fund_invoice_when_target_reached" --args u64:1 address:"0x8f9387d678d14120a0eeb7a87ee2517a55651701b480f6b2e1913e06759000b7" --profile admin
```

### Phase 6: Revenue Distribution
```bash
# Distribute invoice payback to investors (using v3 - most recent version)
aptos move run --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::distribute_invoice_payback_to_investors_v3" --args u64:1 u64:55000000000 --profile supplier1
```

## Balance Verification Commands

### Check APT Balances
```bash
# Check admin balance
aptos account balance --profile admin

# Check investor balances
aptos account balance --profile investor1
aptos account balance --profile investor2

# Check supplier balances  
aptos account balance --profile supplier1
aptos account balance --profile supplier2
```

### Check INV Token Balances
```bash
# Check INV token balance for investors
aptos move view --function-id "0x1::primary_fungible_store::balance" --args address:"0xd66c299aa599d93e4784219cb3eb99e6410f6df2f34609bc5d6828887aa6029a" object:"0x[INV_TOKEN_OBJECT_ADDRESS]"
```

## Expected Outcomes

### Phase 1: System Initialization ✅
- SPV resource created under admin account
- Invoice coin metadata established
- Minting capability assigned to admin

### Phase 2: Invoice Creation ✅
- Invoice #1 created with 500 APT target
- Invoice stored in supplier1's account
- Invoice status: PENDING

### Phase 3: Investment Collection ✅
- Total investment: 500 APT (50B Octas)
- Investor1: 200 APT (40% ownership)
- Investor2: 300 APT (60% ownership)
- **CRITICAL**: Real APT transfers from investor accounts to SPV pool

### Phase 4: Token Distribution ✅
- INV tokens minted proportional to investments
- Investor1 receives 40% of total INV tokens
- Investor2 receives 60% of total INV tokens

### Phase 5: Invoice Funding ✅
- **CRITICAL**: 500 APT transferred from SPV pool to supplier1
- Invoice status updated to FUNDED
- Supplier receives actual APT for business operations

### Phase 6: Revenue Distribution ✅
- **CRITICAL**: 550 APT revenue (10% return) distributed to investors
- Investor1 receives 220 APT (40% of 550 APT)
- Investor2 receives 330 APT (60% of 550 APT)
- **PROFIT**: Each investor gains 10% return on investment

## Key Success Metrics

1. **Real Money Movement**: Actual APT transfers at each phase
2. **Proportional Distribution**: Correct percentage-based token and revenue allocation
3. **Profit Generation**: 10% return demonstrating successful invoice factoring
4. **Role Separation**: Different accounts handling different workflow phases
5. **System Integrity**: All balances reconcile throughout the process

## Troubleshooting Commands

### View SPV State
```bash
aptos move view --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::spv::get_total_investment" --args u64:1
```

### View Invoice Details
```bash
aptos move view --function-id "0x9e000050508f78c9c7167ab3039579d9deeac48bab40c4381431603de4f75195::invoice_registery_simple::get_invoice" --args address:"0x8f9387d678d14120a0eeb7a87ee2517a55651701b480f6b2e1913e06759000b7" u64:1
```

This workflow demonstrates a complete Real-World Asset tokenization system with verifiable APT transfers and profitable returns for all participants.
