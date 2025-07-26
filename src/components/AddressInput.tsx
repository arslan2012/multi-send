import { useSignal } from "@preact/signals";
import { For } from "@preact/signals/utils";
import type { TargetedEvent } from "preact/compat";
import { type Recipient, recipients } from "../globalSignal";

export function AddressInput() {
	const csvInput = useSignal("");

	const addRecipient = () => {
		const newRecipient: Recipient = {
			address: "",
			amount: "",
			id: `recipient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
		};
		const newRecipients = [...recipients.value, newRecipient];
		recipients.value = newRecipients;
	};

	const removeRecipient = (id: string) => {
		const newRecipients = recipients.value.filter((r) => r.id !== id);
		recipients.value = newRecipients;
	};

	const updateRecipient = (
		id: string,
		field: keyof Omit<Recipient, "id">,
		value: string,
	) => {
		const newRecipients = recipients.value.map((r) =>
			r.id === id ? { ...r, [field]: value } : r,
		);
		recipients.value = newRecipients;
	};

	const parseCsv = () => {
		const lines = csvInput.value.trim().split("\n");
		const parsedRecipients: Recipient[] = [];

		lines.forEach((line, index) => {
			let parts = line.trim().split(",");
			if (parts.length === 1) {
				parts = line.trim().split(" ");
			}
			if (parts.length >= 2) {
				const address = parts[0].trim();
				const amount = parts[1].trim();
				if (address && amount) {
					parsedRecipients.push({
						address,
						amount,
						id: `csv-${Date.now()}-${index}`,
					});
				}
			}
		});

		recipients.value = parsedRecipients;
		csvInput.value = "";
	};

	const exportCsv = () => {
		const csv = recipients.value
			.filter((r) => r.address && r.amount)
			.map((r) => `${r.address},${r.amount}`)
			.join("\n");

		const blob = new Blob([csv], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "recipients.csv";
		a.click();
		URL.revokeObjectURL(url);
	};

	const handleCsvInputChange = (
		e: TargetedEvent<HTMLTextAreaElement, Event>,
	) => {
		csvInput.value = (e.target as HTMLTextAreaElement).value;
	};

	return (
		<div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
				<h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">
					Recipients
				</h3>
				<div class="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={addRecipient}
						class="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
					>
						Add Recipient
					</button>
					<button
						type="button"
						onClick={exportCsv}
						disabled={recipients.value.length === 0}
						class="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						Export CSV
					</button>
				</div>
			</div>

			{/* CSV Input Section */}
			<div class="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded">
				<label
					htmlFor="csv-input"
					class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
				>
					Bulk Import (CSV Format: address,amount)
				</label>
				<textarea
					id="csv-input"
					value={csvInput}
					onChange={handleCsvInputChange}
					placeholder="0x123...,100&#10;0x456...,200"
					class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm h-20 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
				/>
				<button
					type="button"
					onClick={parseCsv}
					disabled={!csvInput.value.trim()}
					class="mt-2 px-3 py-1.5 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
				>
					Parse CSV
				</button>
			</div>

			{/* Individual Recipients */}
			<div class="space-y-3">
				<For each={recipients}>
					{(recipient) => (
						<div
							key={recipient.id}
							class="flex flex-col sm:flex-row gap-3 items-start sm:items-center"
						>
							<div class="flex-1 w-full sm:w-auto">
								<input
									type="text"
									placeholder="0x..."
									value={recipient.address}
									onChange={(e) =>
										updateRecipient(
											recipient.id,
											"address",
											(e.target as HTMLInputElement).value,
										)
									}
									class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
								/>
							</div>
							<div class="w-full sm:w-32">
								<input
									type="number"
									placeholder="Amount"
									value={recipient.amount}
									onChange={(e) =>
										updateRecipient(
											recipient.id,
											"amount",
											(e.target as HTMLInputElement).value,
										)
									}
									class="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
									step="any"
									min="0"
								/>
							</div>
							<button
								type="button"
								onClick={() => removeRecipient(recipient.id)}
								class="flex-shrink-0 px-2 py-1.5 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors border border-red-200 dark:border-red-700"
							>
								✕
							</button>
						</div>
					)}
				</For>
			</div>

			{recipients.value.length === 0 && (
				<div class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
					No recipients added yet. Click "Add Recipient" or use CSV import.
				</div>
			)}

			<div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
				<strong>Total Recipients:</strong>{" "}
				{recipients.value.filter((r) => r.address && r.amount).length}
			</div>
		</div>
	);
}
