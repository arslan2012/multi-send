import { useState } from 'preact/hooks';
import {
    useAccount,
    useWriteContract,
    useWaitForTransactionReceipt,
    useReadContract,
    useChainId
} from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import type { Recipient } from './AddressInput';
import type { Token } from './TokenSelector';
import { chainConfig, multisendAbi, erc20Abi, supportedChains } from '../config/chains';

interface MultiSendProps {
    recipients: Recipient[];
    selectedToken: Token | null;
    isNativeMode: boolean;
}

export function MultiSend({ recipients, selectedToken, isNativeMode }: MultiSendProps) {
    const [isApproving, setIsApproving] = useState(false);

    const { address } = useAccount();
    const chainId = useChainId();
    const chain = supportedChains.find(c => c.id === chainId);
    const { writeContract, isPending: isSending, data: sendHash } = useWriteContract();
    const { writeContract: writeApprove, isPending: isApprovePending, data: approvalHash } = useWriteContract();

    const currentChainConfig = chainConfig[chainId as keyof typeof chainConfig];

    const multisendContract = currentChainConfig?.multisendContract;

    // Filter valid recipients
    const validRecipients = recipients.filter(r => r.address && r.amount && parseFloat(r.amount) > 0);

    // Calculate totals
    const totalAmount = validRecipients.reduce((sum, recipient) => {
        const decimals = isNativeMode ? 18 : selectedToken?.decimals || 18;
        return sum + parseUnits(recipient.amount, decimals);
    }, 0n);

    // Get balance
    const { data: tokenBalance } = useReadContract({
        address: selectedToken?.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
        query: {
            enabled: !isNativeMode && !!selectedToken?.address && !!address,
        },
    });

    // Get allowance
    const { data: allowance } = useReadContract({
        address: selectedToken?.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [address as `0x${string}`, multisendContract as `0x${string}`],
        query: {
            enabled: !isNativeMode && !!selectedToken?.address && !!address && !!multisendContract,
        },
    });

    // Wait for approval transaction
    const { isSuccess: isApprovalSuccess } = useWaitForTransactionReceipt({
        hash: approvalHash as `0x${string}`,
        query: {
            enabled: !!approvalHash,
        },
    });

    // Wait for send transaction
    const { isSuccess: isSendSuccess, isLoading: isSendLoading } = useWaitForTransactionReceipt({
        hash: sendHash,
        query: {
            enabled: !!sendHash,
        },
    });

    const needsApproval = !isNativeMode && selectedToken && allowance !== undefined && allowance < totalAmount;

    const handleApprove = async () => {
        if (!selectedToken || !multisendContract) return;

        setIsApproving(true);
        try {
            writeApprove({
                address: selectedToken.address as `0x${string}`,
                abi: erc20Abi,
                functionName: 'approve',
                args: [multisendContract as `0x${string}`, totalAmount],
                chain,
                account: address as `0x${string}`,
            });
        } catch (error) {
            console.error('Approval failed:', error);
        } finally {
            setIsApproving(false);
        }
    };

    const handleSend = async () => {
        if (!multisendContract || validRecipients.length === 0) return;

        const addresses = validRecipients.map(r => r.address as `0x${string}`);
        const decimals = isNativeMode ? 18 : selectedToken?.decimals || 18;
        const amounts = validRecipients.map(r => parseUnits(r.amount, decimals));

        try {
            if (isNativeMode) {
                writeContract({
                    address: multisendContract as `0x${string}`,
                    abi: multisendAbi,
                    functionName: 'ethSendDifferentValue',
                    args: [addresses, amounts],
                    value: totalAmount,
                    chain,
                    account: address as `0x${string}`,
                });
            } else {
                writeContract({
                    address: multisendContract as `0x${string}`,
                    abi: multisendAbi,
                    functionName: 'sendDifferentValue',
                    args: [selectedToken!.address as `0x${string}`, addresses, amounts],
                    chain,
                    account: address as `0x${string}`,
                });
            }
        } catch (error) {
            console.error('Send failed:', error);
        }
    };

    const canSend = validRecipients.length > 0 &&
        (isNativeMode || (selectedToken && (!needsApproval || isApprovalSuccess)));

    if (!address) {
        return (
            <div class="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
                <p class="text-gray-600 dark:text-gray-400">Please connect your wallet to continue</p>
            </div>
        );
    }

    if (!multisendContract) {
        return (
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                <p class="text-red-800 dark:text-red-200">Multisend contract not configured for this chain</p>
            </div>
        );
    }

    const decimals = isNativeMode ? 18 : selectedToken?.decimals || 18;
    const symbol = isNativeMode ? 'Native Token' : selectedToken?.symbol || 'Token';

    return (
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Multi-Send Transaction</h3>

            {/* Transaction Summary */}
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-4 mb-4">
                <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">Transaction Summary</h4>
                <div class="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                    <p><strong>Recipients:</strong> {validRecipients.length}</p>
                    <p><strong>Total Amount:</strong> {formatUnits(totalAmount, decimals)} {symbol}</p>
                    <p><strong>Mode:</strong> {isNativeMode ? 'Native Token' : 'ERC-20 Token'}</p>
                    {!isNativeMode && selectedToken && (
                        <p><strong>Token:</strong> {selectedToken.name} ({selectedToken.symbol})</p>
                    )}
                </div>
            </div>

            {/* Balance Check */}
            {!isNativeMode && tokenBalance !== undefined && (
                <div class={`p-3 rounded mb-4 ${tokenBalance >= totalAmount
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200'
                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                    }`}>
                    <p class="text-sm">
                        <strong>Token Balance:</strong> {formatUnits(tokenBalance, decimals)} {selectedToken?.symbol}
                        {tokenBalance < totalAmount && ' (Insufficient balance!)'}
                    </p>
                </div>
            )}

            {/* Approval Section */}
            {!isNativeMode && needsApproval && !isApprovalSuccess && (
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-4 mb-4">
                    <h4 class="font-medium text-yellow-900 dark:text-yellow-200 mb-2">Approval Required</h4>
                    <p class="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
                        You need to approve the multisend contract to spend your tokens.
                    </p>
                    <button
                        type="button"
                        onClick={handleApprove}
                        disabled={isApproving || isApprovePending}
                        class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isApproving || isApprovePending ? 'Approving...' : 'Approve Tokens'}
                    </button>
                </div>
            )}

            {/* Send Button */}
            <div class="space-y-3">
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!canSend || isSending}
                    class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                    {isSending ? 'Sending...' : `Send to ${validRecipients.length} Recipients`}
                </button>

                {validRecipients.length === 0 && (
                    <p class="text-sm text-gray-500 dark:text-gray-400 text-center">
                        Add valid recipients to enable sending
                    </p>
                )}
            </div>

            {/* Transaction Status */}
            {sendHash && (
                <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded">
                    <h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">Transaction Submitted</h4>
                    <p class="text-sm text-blue-800 dark:text-blue-300 break-all">Hash: {sendHash}</p>
                    {isSendLoading && <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">Waiting for confirmation...</p>}
                    {isSendSuccess && <p class="text-sm text-green-600 dark:text-green-400 mt-1">✅ Transaction confirmed!</p>}
                </div>
            )}
        </div>
    );
} 