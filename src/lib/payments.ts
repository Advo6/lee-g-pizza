export type PaymentMethod = "apple_pay" | "google_pay" | "eft";



export interface PaymentMethodOption {

  id: PaymentMethod;

  label: string;

  description: string;

}



export const PAYMENT_METHODS: PaymentMethodOption[] = [

  {

    id: "apple_pay",

    label: "Apple Pay",

    description: "Pay instantly with Apple Pay",

  },

  {

    id: "google_pay",

    label: "Google Pay",

    description: "Pay instantly with Google Pay",

  },

  {

    id: "eft",

    label: "EFT",

    description: "Electronic Funds Transfer to our bank account",

  },

];



export const EFT_BANK_DETAILS = {

  bank: "FNB",

  accountName: "Lee-G's Pizza",

  accountNumber: "62XXXXXXXXX",

  branchCode: "250655",

  accountType: "Cheque",

};



export function getEftReference(orderNumber: string): string {

  return orderNumber;

}



export interface PaymentResult {

  success: boolean;

  transactionId?: string;

  error?: string;

}



/**

 * Mock payment processor — replace with Stripe, PayFast, etc. when keys are configured.

 */

export async function processPayment(

  method: PaymentMethod,

  amount: number,

  orderNumber: string

): Promise<PaymentResult> {

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  const payfastId = process.env.PAYFAST_MERCHANT_ID;



  if (stripeKey || payfastId) {

    // Real provider integration hook — not configured yet

    console.log(

      `[Payment] Provider keys detected but integration pending — simulating ${method} for ${orderNumber}`

    );

  }



  await new Promise((resolve) => setTimeout(resolve, 800));



  if (method === "eft") {

    return {

      success: true,

      transactionId: `EFT-PENDING-${orderNumber}`,

    };

  }



  return {

    success: true,

    transactionId: `MOCK-${method.toUpperCase()}-${Date.now()}`,

  };

}



export function isOnlinePaymentPaid(method: PaymentMethod): boolean {

  return method === "apple_pay" || method === "google_pay";

}


