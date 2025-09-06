import { InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { MODULES } from "@/constants";

export type CreateInvoiceArguments = {
  amount: number;
  due_date: number; 
  buyer_data_info: string;
};

export const createInvoice = (args: CreateInvoiceArguments): InputTransactionData => {
  const { amount, due_date, buyer_data_info } = args;
  return {
    data: {
      function: `${MODULES.INVOICE_REGISTRY}::create_invoice`,
      functionArguments: [amount, due_date, buyer_data_info],
    },
  };
};

export type UpdateInvoiceArguments = {
  id: number;
  amount: number;
  due_date: number;
  buyer_data_info: string;
};

export const updateInvoice = (args: UpdateInvoiceArguments): InputTransactionData => {
  const { id, amount, due_date, buyer_data_info } = args;
  return {
    data: {
      function: `${MODULES.INVOICE_REGISTRY}::update_invoice`,
      functionArguments: [id, amount, due_date, buyer_data_info],
    },
  };
};
