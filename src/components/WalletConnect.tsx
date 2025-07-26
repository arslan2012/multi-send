import { useAccount, useConnect, useDisconnect } from 'wagmi';

export function WalletConnect() {
    const { address, isConnected } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();

    if (isConnected) {
        return (
            <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-sm font-medium text-green-800 dark:text-green-200">Connected Wallet</p>
                        <p class="text-xs text-green-600 dark:text-green-400 font-mono break-all">{address}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => disconnect()}
                        class="flex-shrink-0 px-3 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-700"
                    >
                        Disconnect
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">Connect Your Wallet</h3>
            <div class="space-y-2">
                {connectors.map((connector) => (
                    <button
                        key={connector.uid}
                        type="button"
                        onClick={() => connect({ connector })}
                        disabled={isPending}
                        class="w-full px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isPending ? 'Connecting...' : `Connect ${connector.name}`}
                    </button>
                ))}
            </div>
        </div>
    );
} 