export type PaymentMethod = "pix" | "credit_card" | "debit_card" | "meal_voucher";

export type PaymentProviderId = "mock" | "stripe" | "mercadopago";

export type CreatePaymentInput = {
  orderId: string;
  userId: string;
  amount: number; // BRL
  method: PaymentMethod;
  description?: string;
  card?: {
    holder: string;
    number: string;
    expiry: string; // MM/YY
    cvv: string;
  };
};

export type CreatePaymentResult = {
  providerId: PaymentProviderId;
  status: "approved" | "pending" | "failed";
  externalId: string;
  pixCode?: string;
  pixQrImage?: string;
  message?: string;
};

export interface PaymentProvider {
  id: PaymentProviderId;
  label: string;
  supports: PaymentMethod[];
  create(input: CreatePaymentInput): Promise<CreatePaymentResult>;
}