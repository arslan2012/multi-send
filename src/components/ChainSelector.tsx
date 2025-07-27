import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { supportedChains } from "../config/chains";
import { useEffect } from "preact/hooks";

export function ChainSelector() {
	const chainId = useChainId();
	const { isConnected } = useAccount();
	const { switchChain, isPending } = useSwitchChain();

	useEffect(() => {
		if (isConnected) {
			switchChain({ chainId: supportedChains[0].id });
		}
	}, [isConnected]);

	return (
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
			<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
				Select Network
			</h3>
			<div class="flex gap-2">
				{supportedChains.map((chain) => (
					<button
						key={chain.id}
						type="button"
						onClick={() => switchChain({ chainId: chain.id })}
						disabled={isPending || chainId === chain.id}
						class={`w-full px-4 py-2 text-sm rounded transition-colors border ${chainId === chain.id
							? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700"
							: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600"
							} disabled:opacity-50 disabled:cursor-not-allowed`}
					>
						{isPending ? "Switching..." : chain.name}
						<span class="block text-xs opacity-75">
							{chain.nativeCurrency.symbol}
						</span>
					</button>
				))}
			</div>
		</div>
	);
}
