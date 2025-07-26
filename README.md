# Multi-Send DApp

A modern decentralized application for sending tokens or native currency to multiple recipients in a single transaction. Built with Preact, TailwindCSS, and Viem.

## Features

- **Multi-Chain Support**: Supports BSC and InfinityG mainnet chains
- **Dual Token Types**: Send either native tokens (BNB/INIT) or ERC-20 tokens
- **Bulk Import**: Import recipients via CSV format or add them individually
- **Auto Approval**: Automatically handles token approvals for ERC-20 transfers
- **Real-time Balance Checking**: Shows current balances and validates sufficient funds
- **Transaction Tracking**: Monitor transaction status and confirmations
- **Modern UI**: Clean, responsive interface built with TailwindCSS

## Supported Networks

### BSC (Binance Smart Chain)
- **Chain ID**: 56
- **Multi-send Contract**: `0x83cC30e1E5f814883B260CE32A2a13D3493E5439`
- **Supported Tokens**: AIN Token and custom ERC-20 tokens

### InfinityG Mainnet
- **Chain ID**: 2780922216980457
- **Multi-send Contract**: `0x3e6e1cd2b77e80a4488f74b07d94f523f29a090e`
- **Native Currency**: INIT

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- A compatible wallet (MetaMask, WalletConnect-supported wallets)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd multi-send
```

2. Install dependencies:
```bash
pnpm install
```

3. Start the development server:
```bash
pnpm dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

### Connecting Your Wallet

1. Click on any "Connect" button in the wallet section
2. Choose your preferred wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection in your wallet

### Selecting a Network

1. Use the chain selector to switch between BSC and InfinityG mainnet
2. Your wallet will prompt you to add/switch to the selected network if not already added

### Choosing Token Type

1. **Native Token Mode**: Send the chain's native currency (BNB on BSC, INIT on InfinityG)
2. **ERC-20 Mode**: Send specific tokens
   - Choose from pre-configured tokens
   - Or add a custom token by entering its contract address

### Adding Recipients

#### Individual Entry
1. Click "Add Recipient" to add recipients one by one
2. Enter the recipient's wallet address and amount
3. Use the "✕" button to remove recipients

#### Bulk Import via CSV
1. Use the CSV import section
2. Format: `address,amount` (one per line)
3. Example:
   ```
   0x123...,100
   0x456...,250
   0x789...,75
   ```
4. Click "Parse CSV" to import all recipients

### Sending Tokens

1. Review the transaction summary showing:
   - Number of recipients
   - Total amount to send
   - Current token balance (for ERC-20)

2. For ERC-20 tokens:
   - If approval is needed, click "Approve Tokens" first
   - Wait for the approval transaction to confirm

3. Click "Send to X Recipients" to execute the multi-send
4. Confirm the transaction in your wallet
5. Monitor the transaction status in real-time

## Technical Architecture

### Key Components

- **WalletConnect**: Handles wallet connection and management
- **ChainSelector**: Network switching functionality
- **TokenSelector**: Token type and selection interface
- **AddressInput**: Recipient management with CSV support
- **MultiSend**: Transaction execution and monitoring

### Smart Contract Integration

The app uses the following contract ABIs:
- **MultiSend Contract**: Handles batch transfers
- **ERC-20 Contract**: For token approvals and balance checks

### State Management

- **Wagmi**: Web3 state management and wallet integration
- **TanStack Query**: Caching and data synchronization
- **Preact Hooks**: Local component state

## Configuration

### Adding New Chains

Edit `src/config/chains.ts`:

```typescript
export const newChain = defineChain({
  id: YOUR_CHAIN_ID,
  name: 'Your Chain Name',
  nativeCurrency: {
    decimals: 18,
    name: 'Native Token',
    symbol: 'TOKEN',
  },
  rpcUrls: {
    default: {
      http: ['https://your-rpc-url'],
    },
  },
  // ... other config
});

// Add to chainConfig
export const chainConfig = {
  [newChain.id]: {
    multisendContract: '0x...',
    tokens: [/* your tokens */],
  },
  // ... existing chains
};
```

### Adding New Tokens

Update the `tokens` array in `chainConfig` for the respective chain:

```typescript
tokens: [
  {
    name: 'Your Token',
    symbol: 'YTK',
    address: '0x...',
    decimals: 18,
  },
]
```

## Security Considerations

1. **Contract Verification**: Ensure multi-send contracts are verified on block explorers
2. **Token Approvals**: The app requests exact approval amounts, not unlimited
3. **Balance Validation**: Always check balances before attempting transfers
4. **Address Validation**: Validate recipient addresses are properly formatted

## Troubleshooting

### Common Issues

**Wallet Connection Failed**
- Ensure your wallet extension is installed and unlocked
- Try refreshing the page and reconnecting

**Chain Not Supported**
- Make sure the selected chain is configured in your wallet
- Check if the chain RPC is accessible

**Transaction Failed**
- Verify sufficient balance for tokens and gas fees
- Ensure all recipient addresses are valid
- Check if token approvals are needed

**Approval Required Repeatedly**
- Clear wallet cache and reload the page
- Ensure the approval transaction was confirmed

## Development

### Project Structure

```
src/
├── components/          # React components
│   ├── WalletConnect.tsx
│   ├── ChainSelector.tsx
│   ├── TokenSelector.tsx
│   ├── AddressInput.tsx
│   └── MultiSend.tsx
├── config/             # Configuration files
│   ├── chains.ts       # Chain and contract config
│   └── wagmi.ts        # Wagmi setup
├── index.tsx           # Main app entry
└── style.css          # Global styles
```

### Building for Production

```bash
pnpm build
```

The built files will be in the `dist/` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
