import { useState } from 'preact/hooks';
import { useChainId } from 'wagmi';
import { chainConfig } from '../config/chains';

export interface Token {
    name: string;
    symbol: string;
    address: string;
    decimals: number;
}

interface TokenSelectorProps {
    selectedToken: Token | null;
    onTokenSelect: (token: Token | null) => void;
    isNativeMode: boolean;
    onModeChange: (isNative: boolean) => void;
}

export function TokenSelector({
    selectedToken,
    onTokenSelect,
    isNativeMode,
    onModeChange
}: TokenSelectorProps) {
    const [customTokenAddress, setCustomTokenAddress] = useState('');
    const chainId = useChainId();

    const currentChainConfig = chainConfig[chainId as keyof typeof chainConfig];
    const availableTokens = currentChainConfig?.tokens || [];

    const handleCustomTokenAdd = () => {
        if (customTokenAddress.trim()) {
            // In a real app, you'd fetch token metadata from the blockchain
            const customToken: Token = {
                name: 'Custom Token',
                symbol: 'CUSTOM',
                address: customTokenAddress.trim(),
                decimals: 18, // Default, should be fetched
            };
            onTokenSelect(customToken);
            setCustomTokenAddress('');
        }
    };

    return (
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Select Token Type</h3>

            {/* Mode Selection */}
            <div class="mb-4 space-y-2">
                <label class="flex items-center">
                    <input
                        type="radio"
                        name="token-mode"
                        checked={isNativeMode}
                        onChange={() => onModeChange(true)}
                        class="mr-2 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">Native Token (BNB/INIT)</span>
                </label>
                <label class="flex items-center">
                    <input
                        type="radio"
                        name="token-mode"
                        checked={!isNativeMode}
                        onChange={() => onModeChange(false)}
                        class="mr-2 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">ERC-20 Token</span>
                </label>
            </div>

            {/* Token Selection (only show if not native mode) */}
            {!isNativeMode && (
                <div class="space-y-3">
                    {/* Predefined Tokens */}
                    {availableTokens.length > 0 && (
                        <div>
                            <h4 class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Available Tokens
                            </h4>
                            <div class="space-y-2">
                                {availableTokens.map((token) => (
                                    <button
                                        key={token.address}
                                        type="button"
                                        onClick={() => onTokenSelect(token)}
                                        class={`w-full p-3 text-left border rounded transition-colors ${selectedToken?.address === token.address
                                                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
                                            }`}
                                    >
                                        <div class="font-medium text-sm text-gray-900 dark:text-gray-100">{token.name} ({token.symbol})</div>
                                        <div class="text-xs text-gray-500 dark:text-gray-400 font-mono">{token.address}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Token Input */}
                    <div>
                        <label htmlFor="custom-token" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Custom Token Address
                        </label>
                        <div class="flex gap-2">
                            <input
                                id="custom-token"
                                type="text"
                                placeholder="0x..."
                                value={customTokenAddress}
                                onChange={(e) => setCustomTokenAddress((e.target as HTMLInputElement).value)}
                                class="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                            />
                            <button
                                type="button"
                                onClick={handleCustomTokenAdd}
                                disabled={!customTokenAddress.trim()}
                                class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Add
                            </button>
                        </div>
                    </div>

                    {/* Selected Token Display */}
                    {selectedToken && (
                        <div class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
                            <div class="text-sm font-medium text-green-800 dark:text-green-200">Selected Token</div>
                            <div class="text-sm text-green-700 dark:text-green-300">{selectedToken.name} ({selectedToken.symbol})</div>
                            <div class="text-xs text-green-600 dark:text-green-400 font-mono">{selectedToken.address}</div>
                        </div>
                    )}
                </div>
            )}

            {isNativeMode && (
                <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                    <div class="text-sm font-medium text-blue-800 dark:text-blue-200">Native Token Mode</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">Will send the chain's native currency</div>
                </div>
            )}
        </div>
    );
} 