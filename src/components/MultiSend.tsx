import { useSignal } from "@preact/signals";
import { formatUnits, parseUnits } from "viem";
import { useAccount, useChainId, useConfig, useReadContract } from "wagmi";
import { waitForTransactionReceipt, writeContract } from "wagmi/actions";
import {
	chainConfig,
	erc20Abi,
	multisendAbi,
	supportedChains,
} from "../config/chains";
import {
	isNativeMode,
	type Recipient,
	recipients,
	selectedToken,
} from "../globalSignal";

interface ChunkProgress {
	chunkIndex: number;
	status: "pending" | "success" | "error";
	hash?: `0x${string}`;
	error?: string;
}

const MAX_RECIPIENTS_PER_CHUNK = 255;

export function MultiSend() {
	const approveStatus = useSignal<"idle" | "pending" | "success" | "error">(
		"idle",
	);
	const sendStatus = useSignal<"idle" | "pending" | "success" | "error">(
		"idle",
	);
	const chunkProgress = useSignal<ChunkProgress[]>([]);
	const currentChunk = useSignal<number>(0);

	const { address } = useAccount();
	const chainId = useChainId();
	const chain = supportedChains.find((c) => c.id === chainId);
	const config = useConfig();

	const currentChainConfig = chainConfig[chainId as keyof typeof chainConfig];

	const multisendContract = currentChainConfig?.multisendContract;

	// Filter valid recipients
	const validRecipients = recipients.value.filter(
		(r) => r.address && r.amount && parseFloat(r.amount) > 0,
	);

	// Split recipients into chunks
	const recipientChunks = [];
	for (let i = 0; i < validRecipients.length; i += MAX_RECIPIENTS_PER_CHUNK) {
		recipientChunks.push(
			validRecipients.slice(i, i + MAX_RECIPIENTS_PER_CHUNK),
		);
	}

	// Calculate totals
	const totalAmount = validRecipients.reduce((sum, recipient) => {
		const decimals = isNativeMode.value
			? 18
			: selectedToken.value?.decimals || 18;
		return sum + parseUnits(recipient.amount, decimals);
	}, 0n);

	// Get balance
	const { data: tokenBalance } = useReadContract({
		address: selectedToken.value?.address as `0x${string}`,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [address as `0x${string}`],
		query: {
			enabled:
				!isNativeMode.value && !!selectedToken.value?.address && !!address,
		},
	});

	// Get allowance
	const { data: allowance } = useReadContract({
		address: selectedToken.value?.address as `0x${string}`,
		abi: erc20Abi,
		functionName: "allowance",
		args: [address as `0x${string}`, multisendContract as `0x${string}`],
		query: {
			enabled:
				!isNativeMode.value &&
				!!selectedToken.value?.address &&
				!!address &&
				!!multisendContract,
		},
	});

	const needsApproval =
		!isNativeMode.value &&
		selectedToken.value &&
		allowance !== undefined &&
		allowance < totalAmount;

	const handleApprove = async () => {
		if (!selectedToken.value || !multisendContract) return;

		approveStatus.value = "pending";
		try {
			const approvalHash = await writeContract(config, {
				address: selectedToken.value.address as `0x${string}`,
				abi: erc20Abi,
				functionName: "approve",
				args: [multisendContract as `0x${string}`, totalAmount],
				chain,
				account: address as `0x${string}`,
			});
			await waitForTransactionReceipt(config, {
				hash: approvalHash,
			});
			approveStatus.value = "success";
		} catch (error) {
			console.error("Approval failed:", error);
			approveStatus.value = "error";
		}
	};

	const sendChunk = async (
		chunkIndex: number,
		chunkRecipients: Recipient[],
	) => {
		if (!multisendContract) return;

		const addresses = chunkRecipients.map((r) => r.address as `0x${string}`);
		const decimals = isNativeMode.value
			? 18
			: selectedToken.value?.decimals || 18;
		const amounts = chunkRecipients.map((r) => parseUnits(r.amount, decimals));
		const chunkAmount = amounts.reduce((sum, amount) => sum + amount, 0n);

		try {
			let hash: `0x${string}`;

			if (isNativeMode.value) {
				hash = await writeContract(config, {
					address: multisendContract as `0x${string}`,
					abi: multisendAbi,
					functionName: "ethSendDifferentValue",
					args: [addresses, amounts],
					value: chunkAmount,
					chain,
					account: address as `0x${string}`,
				});
			} else {
				hash = await writeContract(config, {
					address: multisendContract as `0x${string}`,
					abi: multisendAbi,
					functionName: "sendDifferentValue",
					args: [
						selectedToken.value!.address as `0x${string}`,
						addresses,
						amounts,
					],
					chain,
					account: address as `0x${string}`,
				});
			}

			// Update progress with hash
			chunkProgress.value = chunkProgress.value.map((p) =>
				p.chunkIndex === chunkIndex ? { ...p, hash, status: "pending" } : p,
			);

			await waitForTransactionReceipt(config, { hash });

			// Update progress to success
			chunkProgress.value = chunkProgress.value.map((p) =>
				p.chunkIndex === chunkIndex ? { ...p, status: "success" } : p,
			);
		} catch (error) {
			console.error(`Chunk ${chunkIndex + 1} failed:`, error);

			// Update progress to error
			chunkProgress.value = chunkProgress.value.map((p) =>
				p.chunkIndex === chunkIndex
					? {
							...p,
							status: "error",
							error: error instanceof Error ? error.message : "Unknown error",
						}
					: p,
			);

			throw error;
		}
	};

	const handleSend = async () => {
		if (!multisendContract || validRecipients.length === 0) return;

		sendStatus.value = "pending";
		currentChunk.value = 0;

		// Initialize chunk progress
		chunkProgress.value = recipientChunks.map((_, index) => ({
			chunkIndex: index,
			status: "pending" as const,
		}));

		try {
			// Send each chunk sequentially
			for (let i = 0; i < recipientChunks.length; i++) {
				currentChunk.value = i;
				await sendChunk(i, recipientChunks[i]);
			}

			sendStatus.value = "success";
		} catch (error) {
			console.error("Multi-send failed:", error);
			sendStatus.value = "error";
		}
	};

	const canSend =
		validRecipients.length > 0 &&
		(isNativeMode.value ||
			(selectedToken.value &&
				(!needsApproval || approveStatus.value === "success")));

	const completedChunks = chunkProgress.value.filter(
		(p) => p.status === "success",
	).length;
	const failedChunks = chunkProgress.value.filter(
		(p) => p.status === "error",
	).length;

	if (!address) {
		return (
			<div class="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
				<p class="text-gray-600 dark:text-gray-400">
					Please connect your wallet to continue
				</p>
			</div>
		);
	}

	if (!multisendContract) {
		return (
			<div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
				<p class="text-red-800 dark:text-red-200">
					Multisend contract not configured for this chain
				</p>
			</div>
		);
	}

	const decimals = isNativeMode.value
		? 18
		: selectedToken.value?.decimals || 18;
	const symbol = isNativeMode.value
		? "Native Token"
		: selectedToken.value?.symbol || "Token";

	return (
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
			<h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
				Multi-Send Transaction
			</h3>

			{/* Transaction Summary */}
			<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-4 mb-4">
				<h4 class="font-medium text-blue-900 dark:text-blue-200 mb-2">
					Transaction Summary
				</h4>
				<div class="text-sm text-blue-800 dark:text-blue-300 space-y-1">
					<p>
						<strong>Recipients:</strong> {validRecipients.length}
					</p>
					<p>
						<strong>Total Amount:</strong> {formatUnits(totalAmount, decimals)}{" "}
						{symbol}
					</p>
					<p>
						<strong>Mode:</strong>{" "}
						{isNativeMode.value ? "Native Token" : "ERC-20 Token"}
					</p>
					{recipientChunks.length > 1 && (
						<p>
							<strong>Chunks:</strong> {recipientChunks.length} (max{" "}
							{MAX_RECIPIENTS_PER_CHUNK} recipients each)
						</p>
					)}
					{!isNativeMode.value && selectedToken.value && (
						<p>
							<strong>Token:</strong> {selectedToken.value.name} (
							{selectedToken.value.symbol})
						</p>
					)}
				</div>
			</div>

			{/* Chunking Warning */}
			{recipientChunks.length > 1 && (
				<div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded p-4 mb-4">
					<h4 class="font-medium text-amber-900 dark:text-amber-200 mb-2">
						⚠️ Multiple Transactions Required
					</h4>
					<p class="text-sm text-amber-800 dark:text-amber-300">
						Your {validRecipients.length} recipients will be sent in{" "}
						{recipientChunks.length} separate transactions due to the 255
						recipient limit per transaction. Each transaction will require gas
						fees and wallet confirmation.
					</p>
				</div>
			)}

			{/* Balance Check */}
			{!isNativeMode.value && tokenBalance !== undefined && (
				<div
					class={`p-3 rounded mb-4 ${
						tokenBalance >= totalAmount
							? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-800 dark:text-green-200"
							: "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200"
					}`}
				>
					<p class="text-sm">
						<strong>Token Balance:</strong>{" "}
						{formatUnits(tokenBalance, decimals)} {selectedToken.value?.symbol}
						{tokenBalance < totalAmount && " (Insufficient balance!)"}
					</p>
				</div>
			)}

			{/* Approval Section */}
			{!isNativeMode.value &&
				needsApproval &&
				["idle", "pending"].includes(approveStatus.value) && (
					<div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded p-4 mb-4">
						<h4 class="font-medium text-yellow-900 dark:text-yellow-200 mb-2">
							Approval Required
						</h4>
						<p class="text-sm text-yellow-800 dark:text-yellow-300 mb-3">
							You need to approve the multisend contract to spend your tokens.
							{recipientChunks.length > 1 &&
								" This approval covers all chunks."}
						</p>
						<button
							type="button"
							onClick={handleApprove}
							disabled={approveStatus.value === "pending"}
							class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							{approveStatus.value === "pending"
								? "Approving..."
								: "Approve Tokens"}
						</button>
					</div>
				)}

			{/* Chunk Progress */}
			{sendStatus.value === "pending" && chunkProgress.value.length > 0 && (
				<div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded p-4 mb-4">
					<h4 class="font-medium text-blue-900 dark:text-blue-200 mb-3">
						Transaction Progress ({completedChunks}/{recipientChunks.length}{" "}
						chunks completed)
					</h4>
					<div class="space-y-2">
						{chunkProgress.value.map((progress) => (
							<div
								key={`chunk-${progress.chunkIndex}`}
								class="flex items-center justify-between text-sm"
							>
								<span class="text-blue-800 dark:text-blue-300">
									Chunk {progress.chunkIndex + 1} (
									{recipientChunks[progress.chunkIndex].length} recipients)
								</span>
								<div class="flex items-center space-x-2">
									{progress.status === "pending" && !progress.hash && (
										<span class="text-gray-600 dark:text-gray-400">
											{progress.chunkIndex === currentChunk.value
												? "Sending..."
												: "Waiting..."}
										</span>
									)}
									{progress.status === "pending" && progress.hash && (
										<span class="text-blue-600 dark:text-blue-400">
											Confirming...
										</span>
									)}
									{progress.status === "success" && (
										<span class="text-green-600 dark:text-green-400">
											✅ Success
										</span>
									)}
									{progress.status === "error" && (
										<span class="text-red-600 dark:text-red-400">
											❌ Failed
										</span>
									)}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Send Button */}
			<div class="space-y-3">
				<button
					type="button"
					onClick={handleSend}
					disabled={!canSend || sendStatus.value === "pending"}
					class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
				>
					{sendStatus.value === "pending"
						? `Sending Chunk ${currentChunk.value + 1}/${recipientChunks.length}...`
						: recipientChunks.length > 1
							? `Send ${recipientChunks.length} Transactions (${validRecipients.length} Recipients)`
							: `Send to ${validRecipients.length} Recipients`}
				</button>

				{validRecipients.length === 0 && (
					<p class="text-sm text-gray-500 dark:text-gray-400 text-center">
						Add valid recipients to enable sending
					</p>
				)}
			</div>

			{/* Final Status */}
			{sendStatus.value === "success" && chunkProgress.value.length > 0 && (
				<div class="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded">
					<h4 class="font-medium text-green-900 dark:text-green-200 mb-2">
						✅ All Transactions Completed
					</h4>
					<div class="space-y-2 text-sm">
						{chunkProgress.value.map((progress) => (
							<div
								key={`success-chunk-${progress.chunkIndex}`}
								class="text-green-800 dark:text-green-300"
							>
								<strong>Chunk {progress.chunkIndex + 1}:</strong>
								<span class="ml-1 font-mono text-xs break-all">
									{progress.hash}
								</span>
							</div>
						))}
					</div>
				</div>
			)}

			{/* Error Status */}
			{sendStatus.value === "error" && failedChunks > 0 && (
				<div class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded">
					<h4 class="font-medium text-red-900 dark:text-red-200 mb-2">
						❌ Transaction Failed ({completedChunks} of {recipientChunks.length}{" "}
						chunks completed)
					</h4>
					<div class="space-y-2 text-sm">
						{chunkProgress.value.map((progress) => (
							<div
								key={`error-chunk-${progress.chunkIndex}`}
								class={
									progress.status === "error"
										? "text-red-800 dark:text-red-300"
										: "text-green-800 dark:text-green-300"
								}
							>
								<strong>Chunk {progress.chunkIndex + 1}:</strong>
								{progress.status === "success" && (
									<span class="ml-1">
										✅ Success -{" "}
										<span class="font-mono text-xs">{progress.hash}</span>
									</span>
								)}
								{progress.status === "error" && (
									<span class="ml-1">❌ Failed - {progress.error}</span>
								)}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
