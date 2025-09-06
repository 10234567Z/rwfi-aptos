import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULES, RWFI_ADDRESS } from "@/constants";

export type MintInvoiceCoinArguments = {
  to: string;
  amount: number;
};

export const mintInvoiceCoin = (args: MintInvoiceCoinArguments): InputTransactionData => {
  const { to, amount } = args;
  return {
    data: {
      function: `${MODULES.INVOICE_COIN}::mint`,
      functionArguments: [to, amount],
    },
  };
};

export type BurnInvoiceCoinArguments = {
  from: string;
  amount: number;
};

export const burnInvoiceCoin = (args: BurnInvoiceCoinArguments): InputTransactionData => {
  const { from, amount } = args;
  return {
    data: {
      function: `${MODULES.INVOICE_COIN}::burn`,
      functionArguments: [from, amount],
    },
  };
};

export type MintToSPVArguments = {
  amount: number;
};

export const mintInvoiceCoinToSPV = (args: MintToSPVArguments): InputTransactionData => {
  const { amount } = args;
  return {
    data: {
      function: `${MODULES.INVOICE_COIN}::mint`,
      functionArguments: [RWFI_ADDRESS, amount], // Mint to the contract address (SPV)
    },
  };
};
