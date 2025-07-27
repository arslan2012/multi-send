import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { hydrate, prerender as ssr } from "preact-iso";
import { WagmiProvider } from "wagmi";
import { AddressInput } from "./components/AddressInput";
import { ChainSelector } from "./components/ChainSelector";
import { MultiSend } from "./components/MultiSend";
import { TokenSelector } from "./components/TokenSelector";
import { WalletConnect } from "./components/WalletConnect";
import { config } from "./config/wagmi";

import "./style.css";

const queryClient = new QueryClient();

function MultiSendApp() {
	return (
		<div class="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
			<div class="flex h-screen flex-col lg:flex-row max-lg:overflow-y-auto">
				{/* Sidebar */}
				<div class="w-full p-4 lg:p-6 lg:w-105 bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 lg:overflow-y-auto lg:h-screen">
					<div class="flex flex-col gap-4 lg:gap-6">
						<WalletConnect />
						<ChainSelector />
						<TokenSelector />
						<MultiSend />
					</div>

					<div class="mt-6 lg:mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
						<p>
							Built with Preact, TailwindCSS, and Viem •
							<a
								href="https://github.com/arslan2012/multi-send"
								target="_blank"
								rel="noopener noreferrer"
								class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 ml-1 transition-colors"
							>
								View Source
							</a>
						</p>
					</div>
				</div>

				{/* Main Content Area */}
				<div class="flex-1 lg:overflow-hidden">
					<div class="h-full lg:overflow-y-auto">
						<div class="p-4 lg:p-6">
							<div class="mb-4 lg:mb-6">
								<h2 class="text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
									Multi-Send DApp
								</h2>
								<p class="text-sm lg:text-base text-gray-600 dark:text-gray-400">
									Send tokens to multiple addresses
								</p>
							</div>
							<AddressInput />
						</div>
					</div>
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

if (typeof window !== "undefined") {
	hydrate(<App />, document.getElementById("app"));
}

export async function prerender(data) {
	return await ssr(<App {...data} />);
}
