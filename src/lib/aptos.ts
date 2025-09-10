import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";
import { NETWORK, APTOS_API_KEY } from "@/constants";

// Convert string network to Network enum
const getNetwork = (): Network => {
  switch (NETWORK.toLowerCase()) {
    case "mainnet":
      return Network.MAINNET;
    case "testnet":
      return Network.TESTNET;
    case "devnet":
      return Network.DEVNET;
    default:
      return Network.DEVNET;
  }
};

const config = new AptosConfig({
  network: getNetwork(),
  clientConfig: APTOS_API_KEY ? { API_KEY: APTOS_API_KEY } : undefined,
});

export const aptos = new Aptos(config);
