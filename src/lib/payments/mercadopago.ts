import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

/**
 * Mercado Pago adapter — placeholder.
 *
 * Quando ativar MP real:
 *  1. Adicionar secret MP_ACCESS_TOKEN.
 *  2. createServerFn `createMpPayment({ orderId, amount, method, payer })` chamando
 *     `https://api.mercadopago.com/v1/payments` no servidor.
 *  3. Para PIX usar `payment_method_id: "pix"` e devolver `qr_code` + `qr_code_base64`.
 *  4. Webhook em `/api/public/webhooks/mercadopago` validando `x-signature`.
 */
export const MercadoPagoProvider: PaymentProvider = {
  id: "mercadopago",
  label: "Mercado Pago",
  supports: ["pix", "credit_card", "debit_card"],
  async create(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    const { MockProvider } = await import("./mock");
    const r = await MockProvider.create(input);
    return { ...r, providerId: "mercadopago", message: "[Mercado Pago sandbox via mock]" };
  },
};