import { aptosClient } from "@/utils/aptosClient";
import { MODULES } from "@/constants";

export interface Invoice {
  id: number;
  supplier_addr: string;
  amount: number;
  due_date: number;
  buyer_data_info: string;
  status: number;
}

export const getInvoice = async (invoiceId: number): Promise<Invoice | null> => {
  try {
    const response = await aptosClient().view({
      payload: {
        function: `${MODULES.INVOICE_REGISTRY}::get_invoice`,
        functionArguments: [invoiceId],
      },
    });

    if (response && response.length > 0) {
      const invoiceData = response[0] as any;
      return {
        id: Number(invoiceData.id),
        supplier_addr: invoiceData.supplier_addr,
        amount: Number(invoiceData.amount),
        due_date: Number(invoiceData.due_date),
        buyer_data_info: invoiceData.buyer_data_info,
        status: Number(invoiceData.status),
      };
    }
    return null;
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return null;
  }
};

export const getInvoiceCount = async (): Promise<number> => {
  try {
    const response = await aptosClient().view({
      payload: {
        function: `${MODULES.INVOICE_REGISTRY}::get_invoice_count`,
        functionArguments: [],
      },
    });

    return response && response.length > 0 ? Number(response[0]) : 0;
  } catch (error) {
    console.error("Error fetching invoice count:", error);
    return 0;
  }
};
