import { signal } from "@preact/signals";

export interface Recipient {
	address: string;
	amount: string;
	id: string; // Add unique ID for better key management
}

export interface Token {
	name: string;
	symbol: string;
	address: string;
	decimals: number;
}

export const recipients = signal<Recipient[]>([]);
export const selectedToken = signal<Token | null>(null);
export const isNativeMode = signal(true);
