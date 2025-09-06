import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULES } from "@/constants";

export type RecordInvestmentArguments = {
  amount: number;
};

export const recordInvestment = (args: RecordInvestmentArguments): InputTransactionData => {
  const { amount } = args;
  return {
    data: {
      function: `${MODULES.SPV}::record_investment`,
      functionArguments: [amount],
    },
  };
};

export type RecordInvoicePendingArguments = {
  invoice_id: number;
};

export const recordInvoicePending = (args: RecordInvoicePendingArguments): InputTransactionData => {
  const { invoice_id } = args;
  return {
    data: {
      function: `${MODULES.SPV}::record_invoice_pending`,
      functionArguments: [invoice_id],
    },
  };
};

export type FundInvoiceArguments = {
  invoice_id: number;
  required_amount: number;
  supplier_addr: string;
};

export const fundInvoice = (args: FundInvoiceArguments): InputTransactionData => {
  const { invoice_id, required_amount, supplier_addr } = args;
  return {
    data: {
      function: `${MODULES.SPV}::fund_invoice_when_target_reached`,
      functionArguments: [invoice_id, required_amount, supplier_addr],
    },
  };
};

export type DistributeYieldArguments = {
  invoice_id: number;
  total_payback_amount: number;
  yield_percentage: number;
};

export const distributeYield = (args: DistributeYieldArguments): InputTransactionData => {
  const { invoice_id, total_payback_amount, yield_percentage } = args;
  return {
    data: {
      function: `${MODULES.SPV}::distribute_invoice_payback_to_investors`,
      functionArguments: [invoice_id, total_payback_amount, yield_percentage],
    },
  };
};
