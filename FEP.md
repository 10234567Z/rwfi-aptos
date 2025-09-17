# RWAFI - Real World Asset Finance Initiative on Aptos

A decentralized invoice factoring platform that connects suppliers with investors through blockchain technology.

## 🏗️ Project Overview

RWAFI enables suppliers to get immediate funding for their invoices while allowing investors to earn returns from real-world asset-backed investments. Built on Aptos blockchain with sophisticated risk management and epoch-based fair return distribution.

## 📋 Development Progress

### ✅ PHASE 1: SMART CONTRACTS (COMPLETED)

#### Core Infrastructure ✅
- [x] SPV (Special Purpose Vehicle) contract
- [x] Invoice Registry contract  
- [x] Invoice Coin (INV token) contract
- [x] Resource account treasury management

#### Investment System ✅
- [x] APT → INV token conversion (1:1 ratio)
- [x] Multi-investor support
- [x] Treasury automation via resource accounts
- [x] Investment tracking and accounting

#### Invoice Processing ✅
- [x] Invoice creation and registration
- [x] 90% funding ratio implementation
- [x] Invoice status management (Pending → Funded → Collected)
- [x] Payer information and metadata storage

#### Risk Management ✅
- [x] Credit scoring system (300-850 scale)
- [x] Risk assessment algorithm
- [x] Funding limits and exposure controls
- [x] Industry concentration limits
- [x] Supplier risk profiling

#### Default Handling ✅
- [x] Automatic default detection
- [x] Grace period management
- [x] Recovery tracking system
- [x] Write-off capabilities
- [x] Default statistics monitoring

#### **🚀 INNOVATION: Epoch-Based Withdrawal System ✅**
- [x] Time-fair return distribution
- [x] Prevents "late investor advantage"
- [x] Proportional sharing based on investment timing
- [x] Epoch tracking and management
- [x] Backward compatible with legacy system

#### Testing & Deployment ✅
- [x] Contract compilation and deployment
- [x] Multi-account testing (investors, suppliers, admin)
- [x] Risk assessment workflow testing
- [x] Epoch-based withdrawal validation
- [x] Default detection and recovery testing

---

### 🚧 PHASE 2: FRONTEND DEVELOPMENT (IN PROGRESS)

#### 🔌 Core Infrastructure (Priority 1) 
- [ ] **Wallet Integration**
  - [ ] Petra Wallet connection
  - [ ] Account state management
  - [ ] Network validation (devnet)
  - [ ] APT balance display
- [ ] **Contract Integration**
  - [ ] Aptos SDK setup
  - [ ] Contract address configuration
  - [ ] Transaction handling with error states
  - [ ] Loading states for blockchain operations

#### 📊 Dashboard Enhancement (Priority 2)
- [ ] **Real-time Pool Statistics**
  - [ ] Total APT invested display
  - [ ] Total collections tracking
  - [ ] Available funding amount
  - [ ] Pool performance metrics
- [ ] **User Statistics**
  - [ ] Personal investment amount
  - [ ] INV token balance
  - [ ] Available returns calculation
  - [ ] ROI calculator
- [ ] **Epoch Information Display**
  - [ ] Current epoch number
  - [ ] User join epoch
  - [ ] Epoch-based return breakdown

#### 💰 Investment Pool Implementation (Priority 3)
- [ ] **Investment Interface**
  - [ ] APT investment form
  - [ ] Amount validation and limits
  - [ ] Transaction confirmation
  - [ ] INV token minting display
- [ ] **Withdrawal System**
  - [ ] Available returns calculation
  - [ ] Legacy withdrawal option
  - [ ] **Epoch-based withdrawal** (recommended)
  - [ ] Return breakdown by epoch
  - [ ] Withdrawal confirmation flow
- [ ] **Investment History**
  - [ ] Transaction history table
  - [ ] Status tracking
  - [ ] Return calculations

#### 📄 Create Invoice Implementation (Priority 4)
- [ ] **Risk Assessment Form**
  - [ ] Credit score input (300-850)
  - [ ] Business age and revenue inputs
  - [ ] Industry selection dropdown
  - [ ] Real-time risk score calculation
- [ ] **Invoice Creation Form**
  - [ ] Invoice amount and due date
  - [ ] Payer information fields
  - [ ] Invoice description
  - [ ] Invoice type selection
- [ ] **Submission Flow**
  - [ ] Risk assessment submission
  - [ ] Invoice creation transaction
  - [ ] Status confirmation

#### 📋 Invoice List Enhancement (Priority 5)
- [ ] **Supplier View**
  - [ ] Personal invoice list
  - [ ] Status indicators (Pending, Funded, Collected)
  - [ ] Funding status display
  - [ ] Risk score visualization
- [ ] **Investor View**
  - [ ] Funded invoices display
  - [ ] Collection status tracking
  - [ ] Return attribution by invoice
- [ ] **Admin View**
  - [ ] All pending invoices
  - [ ] Risk assessment results
  - [ ] Funding decision interface
  - [ ] Default management tools

#### 🔧 Admin Panel Implementation (Priority 6)
- [ ] **Risk Management Interface**
  - [ ] Risk parameter configuration
  - [ ] Supplier risk profile management
  - [ ] Industry exposure monitoring
  - [ ] Credit threshold settings
- [ ] **Default Management Dashboard**
  - [ ] Overdue invoice detection
  - [ ] Recovery tracking interface
  - [ ] Write-off management
  - [ ] Default statistics display
- [ ] **Pool Management Tools**
  - [ ] Funding decision workflow
  - [ ] Collection recording interface
  - [ ] Pool analytics dashboard

---

### 🎨 PHASE 3: ADVANCED FEATURES (HACKATHON POLISH)

#### 📈 Analytics & Visualization
- [ ] **Epoch-Based Analytics**
  - [ ] Epoch timeline visualization
  - [ ] Return distribution charts
  - [ ] Investor join timeline
  - [ ] Performance by epoch analysis
- [ ] **Risk Visualization**
  - [ ] Risk score charts
  - [ ] Industry concentration pie charts
  - [ ] Default rate tracking
  - [ ] Portfolio health indicators

#### 🎯 UX/UI Enhancements
- [ ] **Real-time Updates**
  - [ ] Transaction status notifications
  - [ ] Balance updates after transactions
  - [ ] Epoch change notifications
  - [ ] Auto-refresh on block changes
- [ ] **Data Visualization**
  - [ ] Chart.js/Recharts integration
  - [ ] Progress bars for funding status
  - [ ] Status badges for invoice states
  - [ ] Interactive dashboards

#### 📱 Mobile & Responsive Design
- [ ] **Mobile Optimization**
  - [ ] Responsive layouts
  - [ ] Touch-friendly interfaces
  - [ ] Mobile wallet integration
- [ ] **Accessibility**
  - [ ] ARIA labels and roles
  - [ ] Keyboard navigation
  - [ ] Screen reader compatibility

---

### 🚀 PHASE 4: HACKATHON PREPARATION

#### 🎬 Demo Preparation
- [ ] **Demo Script Creation**
  - [ ] User journey walkthroughs
  - [ ] Feature demonstration flow
  - [ ] Edge case handling examples
- [ ] **Test Data Setup**
  - [ ] Mock invoices and investors
  - [ ] Demo scenarios preparation
  - [ ] Performance testing

#### 📝 Documentation & Presentation
- [ ] **Technical Documentation**
  - [ ] Architecture diagrams
  - [ ] Contract interaction flows
  - [ ] API documentation
- [ ] **Pitch Deck Creation**
  - [ ] Problem statement
  - [ ] Solution architecture
  - [ ] Unique selling points
  - [ ] Market opportunity

---

## 🏆 Unique Selling Points for CTRL+MOVE Hackathon

### 🎯 **Innovation Highlights:**
1. **First RWA Invoice Factoring on Aptos** - Pioneer in real-world asset tokenization
2. **Epoch-Based Fair Returns** - Solves DeFi's "late investor advantage" problem
3. **Real-World Credit Scoring** - Integration of traditional finance metrics
4. **Automated Default Detection** - Smart contract risk management
5. **Multi-Role Platform** - Serves suppliers, investors, and administrators

### 🔧 **Technical Excellence:**
- Modern Aptos Fungible Asset standard
- Resource account treasury automation
- Parallel execution optimization
- Comprehensive error handling
- Time-based economic fairness

### 💼 **Real-World Impact:**
- $3+ trillion global invoice factoring market
- Immediate cash flow for businesses
- Democratized access to asset-backed investments
- Transparent, blockchain-based operations

---

## 🛠️ Technical Stack

### Backend (Smart Contracts)
- **Language**: Move
- **Network**: Aptos Devnet
- **Standards**: Fungible Asset (FA) standard
- **Architecture**: Modular contract design

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **Wallet**: @aptos-labs/wallet-adapter-react
- **SDK**: @aptos-labs/ts-sdk
- **Charts**: Recharts for data visualization
- **State**: React hooks + Context API

### Infrastructure
- **Network**: Aptos Devnet
- **Node**: Aptos Labs node with API key
- **Storage**: On-chain state management
- **IPFS**: Document hash storage (future)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Petra Wallet extension
- Aptos CLI (for contract interaction)

### Installation
```bash
# Clone repository
git clone https://github.com/your-repo/rwfi-aptos
cd rwfi-aptos

# Install dependencies
npm install

# Start development server
npm run dev
```

### Contract Deployment
```bash
# Navigate to contract directory
cd contract

# Compile contracts
aptos move compile

# Deploy to devnet
aptos move publish --profile admin
```

---

## 📞 Contact & Demo

- **Demo URL**: [Coming Soon]
- **Contract Address**: `0xb6740db2d85d59d4d750e4d6e7660244c426059bc56783dca99ae1d9ab26b4ac`
- **Network**: Aptos Devnet
- **Hackathon**: CTRL+MOVE 2024

---

**Built for CTRL+MOVE Hackathon - Redefining Real World Asset Finance on Aptos** 🚀