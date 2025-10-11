# ☕ Coffee Change

An automated micro-investment app that tracks Solana wallet transactions and rounds up each outgoing transaction to the nearest USD value. The rounded-up difference is accumulated off-chain and later transferred on-chain to a pooled investment contract.

## 🎯 Features

- **Wallet Integration**: Connect with Phantom, Solflare, or Backpack wallets
- **Transaction Tracking**: Real-time monitoring of Solana wallet transactions
- **Round-up Calculation**: Automatic calculation of round-up amounts
- **Investment Pool**: Transfer round-ups to a pooled investment contract
- **Portfolio Tracking**: View your investment position and performance

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- A Solana wallet (Phantom, Solflare, or Backpack)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd coffee-change
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗️ Project Structure

```
src/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── transactions/scan/ # Transaction scanning
│   │   ├── prices/            # Price oracle data
│   │   └── pool/position/     # Pool position data
│   ├── globals.css            # Global styles with coffee theme
│   ├── layout.tsx             # Root layout with Solana provider
│   └── page.tsx               # Main app entry point
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── app-navigation.tsx     # Main navigation component
│   ├── dashboard.tsx        # Dashboard with wallet info
│   ├── roundup-review.tsx     # Round-up review and transfer
│   ├── investment-position.tsx # Investment portfolio view
│   ├── solana-provider.tsx    # Solana wallet context
│   └── wallet-connect-button.tsx # Wallet connection UI
└── lib/
    └── utils.ts               # Utility functions
```

## 🎨 Design System

The app uses a coffee-themed design system with:

- **Primary Colors**:
  - Dark Coffee Bean (#2D2016) - Primary text and backgrounds
  - Mocha Brown (#735557) - Buttons and accents
  - Creamy Foam (#D9D9D9) - Card backgrounds and surfaces

- **Typography**: Clean, modern sans-serif fonts (Inter, Sora, Roboto)
- **Layout**: Card-based design with rounded corners and subtle shadows

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Key Components

1. **Dashboard**: Main screen showing wallet info, transaction tracking, and round-up balance
2. **Round-up Review**: Screen for reviewing and confirming round-up transfers
3. **Investment Position**: Portfolio view showing user's position in the investment pool

### API Endpoints

- `GET /api/transactions/scan` - Get latest transaction scan results
- `POST /api/transactions/scan` - Trigger new transaction scan
- `GET /api/prices` - Get current SOL/USD and USDC/USD prices
- `GET /api/pool/position?wallet=<address>` - Get user's pool position

## 🌐 Network

Currently configured for **Solana Devnet** for development and testing.

## 📱 Wallet Support

- Phantom
- Solflare  
- Backpack
- Any wallet supporting the Wallet Standard

## 🚧 Development Status

This is a development version with mock data. In production, you would need to:

1. Implement real transaction scanning
2. Connect to actual price oracles
3. Deploy smart contracts for the investment pool
4. Add real wallet balance fetching
5. Implement actual Solana transactions

## 📄 License

This project is for development purposes.