import { Aptos, AptosConfig } from "@aptos-labs/ts-sdk";
import { NETWORK, APTOS_API_KEY } from "@/constants";

// Create Aptos client instance following MCP pattern
const config = new AptosConfig({
  network: NETWORK,
  clientConfig: { API_KEY: APTOS_API_KEY },
});

export const aptos = new Aptos(config);
