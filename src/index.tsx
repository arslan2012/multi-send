import { hydrate, prerender as ssr } from 'preact-iso';
import { useState } from 'preact/hooks';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from './config/wagmi';
import { WalletConnect } from './components/WalletConnect';
import { ChainSelector } from './components/ChainSelector';
import { TokenSelector, type Token } from './components/TokenSelector';
import { AddressInput, type Recipient } from './components/AddressInput';
import { MultiSend } from './components/MultiSend';

import './style.css';

const queryClient = new QueryClient();

function MultiSendApp() {
	const [recipients, setRecipients] = useState<Recipient[]>([]);
	const [selectedToken, setSelectedToken] = useState<Token | null>(null);
	const [isNativeMode, setIsNativeMode] = useState(true);

	return (
		<div class="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 transition-colors">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="text-center mb-8">
					<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Multi-Send DApp</h1>
					<p class="text-gray-600 dark:text-gray-400">
						Send tokens or native currency to multiple addresses in a single transaction
					</p>
				</div>

				<div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
					{/* Left Column - Wallet & Chain */}
					<div class="space-y-6">
						<WalletConnect />
						<ChainSelector />
					</div>

					{/* Middle Column - Token & Recipients */}
					<div class="space-y-6">
						<TokenSelector
							selectedToken={selectedToken}
							onTokenSelect={setSelectedToken}
							isNativeMode={isNativeMode}
							onModeChange={setIsNativeMode}
						/>
						<AddressInput
							recipients={recipients}
							onRecipientsChange={setRecipients}
						/>
					</div>

					{/* Right Column - Multi-Send */}
					<div class="xl:col-span-1">
						<MultiSend
							recipients={recipients}
							selectedToken={selectedToken}
							isNativeMode={isNativeMode}
						/>
					</div>
				</div>

				<div class="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
					<p>
						Built with Preact, TailwindCSS, and Viem •
						<a
							href="https://github.com"
							target="_blank"
							rel="noopener noreferrer"
							class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1 transition-colors"
						>
							View Source
						</a>
					</p>
				</div>
			</div>
		</div>
	);
}

export function App() {
	return (
		<WagmiProvider config={config}>
			<QueryClientProvider client={queryClient}>
				<MultiSendApp />
			</QueryClientProvider>
		</WagmiProvider>
	);
}

if (typeof window !== 'undefined') {
	hydrate(<App />, document.getElementById('app'));
}

export async function prerender(data) {
	return await ssr(<App {...data} />);
}
