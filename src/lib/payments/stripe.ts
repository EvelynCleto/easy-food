import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

/**
 * Stripe adapter — placeholder.
 *
 * Quando ativar Stripe real:
 *  1. Habilitar Lovable Payments com `enable_stripe_payments`.
 *  2. Criar um createServerFn `createStripeCheckoutSession({ orderId, amount, method })`
 *     que chame a Stripe SDK no servidor com STRIPE_SECRET_KEY.
 *  3. Substituir `create()` por uma chamada `useServerFn(createStripeCheckoutSession)`.
 *  4. Tratar webhook em `/api/public/webhooks/stripe` (assinatura HMAC).
 */
export const StripeProvider: PaymentProvider = {
  id: "stripe",
  label: "Stripe",
  supports: ["credit_card", "debit_card"],
  async create(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // Fallback transparente para o mock enquanto a integração não está ativada.
    const { MockProvider } = await import("./mock");
    const r = await MockProvider.create(input);
    return { ...r, providerId: "stripe", message: "[Stripe sandbox via mock]" };
  },
};