# Invera - Invoice Financing Platform on Aptos

**Invera** is a decentralized invoice financing platform built on Aptos blockchain that connects suppliers, investors, and buyers in a transparent ecosystem for real-world asset (RWA) financing.

## 🌟 Overview

Invera revolutionizes traditional invoice financing by providing:
- **Instant liquidity** for suppliers waiting on invoice payments
- **Stable 10% returns** for investors funding working capital
- **Transparent operations** through blockchain verification
- **Reduced counterparty risk** via automated smart contracts

## 🎯 How It Works

### For Suppliers 📦
1. **Submit KYC documents** and get verified
2. **Create invoices** for pending payments from buyers
3. **Receive 90% funding** immediately upon approval
4. **Keep 10%** reserved for investor returns

### For Investors 💰
1. **Invest APT** into the liquidity pool
2. **Earn 10% returns** when invoices are collected
3. **Withdraw anytime** (partial or full based on collections)
4. **Track performance** through real-time dashboard

### For Admins 👨‍💼
1. **Manage KYC approvals** for supplier onboarding
2. **Fund approved invoices** from investor pool
3. **Record collections** when buyers pay invoices
4. **Monitor platform** health and treasury

## 🏗️ Architecture

### Smart Contract (Move)
- **SPV Module** (`spv.move`) - Core Special Purpose Vehicle logic
- **Invoice Coin** (`invoice_coin.move`) - INV tokens for investor shares
- **Resource Accounts** - Secure treasury management
- **C-Flexible-V2** - Advanced withdrawal system with partial/full options

### Frontend (Next.js)
- **Investor Dashboard** - Portfolio management and withdrawals
- **Supplier Portal** - Invoice creation and KYC submission
- **Admin Panel** - Platform management and approvals
- **Real-time Stats** - Live pool and withdrawal gate status

## 🛠️ Technology Stack

- **Blockchain**: Aptos (Move language)
- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Web3**: Aptos Wallet Adapter, Aptos TS SDK
- **State**: React hooks with real-time contract integration
- **PWA**: Next-PWA for mobile experience

## 🚀 Key Features

### Advanced Withdrawal System
- **Withdrawal Gate** - Opens when collections ≥ funded amount
- **Partial Withdrawals** - Access 10% unfunded portion anytime
- **Full Withdrawals** - Principal + profit when gate opens
- **Proportional Burning** - Fair token economics

### Real-World Integration
- **KYC Verification** - Document-based supplier onboarding  
- **Invoice Management** - Structured invoice creation and tracking
- **Collection Recording** - Off-chain payment integration
- **Risk Assessment** - Supplier creditworthiness evaluation

### Transparency & Monitoring
- **Live Pool Statistics** - Total invested, funded, collected
- **Individual Tracking** - Personal investment and return history
- **Treasury Visibility** - Public treasury address and balances
- **Audit Trail** - Complete transaction and state history

## 📊 Financial Model

```
Investment Flow:
└── Investor deposits 100 APT
    ├── 90 APT → Deployed to supplier (funded_amount)
    └── 10 APT → Reserved in pool (unfunded_amount)

Collection Flow:
└── Buyer pays 100 APT invoice
    ├── Supplier already received 90 APT
    └── 10 APT profit → Distributed to investors

Return Calculation:
└── Total Return = Principal + (Collections - Funded)
    └── Example: 100 APT + (100 - 90) = 110 APT (10% profit)
```

## 🎮 User Journeys

### Supplier Journey
```mermaid
graph LR
    A[Submit KYC] --> B[Admin Approval]
    B --> C[Create Invoice]
    C --> D[Admin Funds Invoice]
    D --> E[Receive 90% APT]
    E --> F[Buyer Pays Invoice]
    F --> G[Admin Records Collection]
```

### Investor Journey  
```mermaid
graph LR
    A[Connect Wallet] --> B[Invest APT]
    B --> C[Earn INV Tokens]
    C --> D[Monitor Pool Stats]
    D --> E[Withdrawal Gate Opens]
    E --> F[Withdraw Principal + 10%]
```

## 🗂️ Project Structure

```
├── contract/                 # Move smart contracts
│   ├── sources/
│   │   ├── spv.move         # Core SPV logic
│   │   └── invoice_coin.move # INV token implementation
│   └── Move.toml            # Contract configuration
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── investors/       # Investor dashboard
│   │   ├── suppliers/       # Supplier portal  
│   │   └── admin/           # Admin panel
│   ├── components/          # React components
│   ├── hooks/               # Custom hooks (useContract, etc.)
│   └── utils/               # Aptos client and helpers
├── public/                  # Static assets
└── docs/                    # Documentation
```

## 📱 User Interfaces

### Investor Dashboard (`/investors`)
- **Portfolio Overview** - Investment summary and returns
- **Pool Statistics** - Platform-wide metrics and performance
- **Withdrawal Interface** - Flexible withdrawal with gate status
- **Transaction History** - Personal investment and withdrawal log

### Supplier Portal (`/suppliers`) 
- **KYC Upload** - Document submission and verification status
- **Invoice Creation** - Structured invoice generation
- **Dashboard** - Invoice status tracking and funding history
- **Document Management** - IPFS-based document storage

### Admin Panel (`/admin`)
- **KYC Management** - Approve/reject supplier applications
- **Funding Operations** - Deploy capital to approved invoices
- **Collection Recording** - Log buyer payments and unlock withdrawals
- **Platform Monitoring** - Treasury, pool stats, and system health

## 🔒 Security Features

- **Resource Account Treasury** - Secure fund management without admin control
- **Multi-signature Support** - Optional admin multi-sig for production
- **KYC Verification** - Document-based supplier validation
- **Withdrawal Gates** - Controlled access to investor funds
- **Audit Trail** - Complete transaction history and state tracking

## 📈 Economics

### Revenue Model
- **Platform Fee** - Optional fee on successful collections (configurable)
- **Yield Spread** - Difference between funding cost and collection returns
- **Risk Premium** - Additional returns for higher-risk supplier segments

### Token Economics (INV)
- **Minted** when investors deposit APT
- **Burned** when investors withdraw (proportional or full)
- **Supply** tracks total invested capital
- **Value** represents claim on pool assets and future returns

## 🌐 Deployment

### Mainnet Considerations
- Multi-signature admin setup
- Security audit completion
- Regulatory compliance review
- Liquidity bootstrapping plan
- Risk management protocols

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Roadmap

- **Phase 1** ✅ - Core SPV and investment functionality
- **Phase 2** ✅ - KYC system and supplier onboarding  
- **Phase 3** ✅ - Advanced withdrawal system (C-Flexible-V2)
- **Phase 4** 🚧 - Multi-currency support and cross-chain integration
- **Phase 5** 📋 - Automated underwriting and risk scoring
- **Phase 6** 📋 - Institutional investor features and compliance tools

---

**Built with ❤️ on Aptos by the Invera Team**
