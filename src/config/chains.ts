import { defineChain } from "viem";
import { bsc } from "viem/chains";

export const infinitygMainnetChain = defineChain({
	id: 2_780_922_216_980_457,
	caipNetworkId: "eip155:2780922216980457",
	chainNamespace: "eip155",
	name: "IngNetwork",
	nativeCurrency: {
		decimals: 18,
		name: "INIT",
		symbol: "INIT",
	},
	rpcUrls: {
		default: {
			http: ["https://jsonrpc-ingnetwork-1.anvil.asia-southeast.initia.xyz"],
			webSocket: [
				"wss://jsonrpc-ws-ingnetwork-1.anvil.asia-southeast.initia.xyz",
			],
		},
	},
	blockExplorers: {
		default: {
			name: "Initia Explorer",
			url: "https://scan.initia.xyz/ingnetwork-1",
		},
	},
	contracts: {},
});

export const supportedChains = [bsc, infinitygMainnetChain] as const;

export const chainConfig = {
	[bsc.id]: {
		multisendContract: "0x83cC30e1E5f814883B260CE32A2a13D3493E5439",
		tokens: [
			{
				name: "AIN Token",
				symbol: "AIN",
				address: "0x9558a9254890B2A8B057a789F413631B9084f4a3",
				decimals: 18,
			},
			// Add more tokens as needed
		],
	},
	[infinitygMainnetChain.id]: {
		multisendContract: "0x3e6e1cd2b77e80a4488f74b07d94f523f29a090e",
		tokens: [
			// Add tokens for InfinityG mainnet
		],
	},
} as const;

export const multisendAbi = [
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "token",
				type: "address",
			},
			{
				indexed: false,
				internalType: "address",
				name: "from",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "total",
				type: "uint256",
			},
		],
		name: "LogTokenBulkSent",
		type: "event",
	},
	{
		anonymous: false,
		inputs: [
			{
				indexed: false,
				internalType: "address",
				name: "from",
				type: "address",
			},
			{
				indexed: false,
				internalType: "uint256",
				name: "total",
				type: "uint256",
			},
		],
		name: "LogTokenBulkSentETH",
		type: "event",
	},
	{
		inputs: [
			{ internalType: "address[]", name: "_to", type: "address[]" },
			{ internalType: "uint256[]", name: "_value", type: "uint256[]" },
		],
		name: "ethSendDifferentValue",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address[]", name: "_to", type: "address[]" },
			{ internalType: "uint256", name: "_value", type: "uint256" },
		],
		name: "ethSendSameValue",
		outputs: [],
		stateMutability: "payable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "_tokenAddress", type: "address" },
			{ internalType: "address[]", name: "_to", type: "address[]" },
			{ internalType: "uint256[]", name: "_value", type: "uint256[]" },
		],
		name: "sendDifferentValue",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ internalType: "address", name: "_tokenAddress", type: "address" },
			{ internalType: "address[]", name: "_to", type: "address[]" },
			{ internalType: "uint256", name: "_value", type: "uint256" },
		],
		name: "sendSameValue",
		outputs: [],
		stateMutability: "nonpayable",
		type: "function",
	},
] as const;

export const erc20Abi = [
	{
		inputs: [{ name: "account", type: "address" }],
		name: "balanceOf",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
	{
		inputs: [
			{ name: "spender", type: "address" },
			{ name: "amount", type: "uint256" },
		],
		name: "approve",
		outputs: [{ name: "", type: "bool" }],
		stateMutability: "nonpayable",
		type: "function",
	},
	{
		inputs: [
			{ name: "owner", type: "address" },
			{ name: "spender", type: "address" },
		],
		name: "allowance",
		outputs: [{ name: "", type: "uint256" }],
		stateMutability: "view",
		type: "function",
	},
] as const;
