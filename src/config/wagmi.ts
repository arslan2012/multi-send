import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { supportedChains } from "./chains";

export const config = createConfig({
	chains: supportedChains,
	connectors: [injected()],
	transports: {
		[supportedChains[0].id]: http(),
		[supportedChains[1].id]: http(),
	},
	ssr: true,
});
