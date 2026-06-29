import { MockProvider } from "./mock";
import { StripeProvider } from "./stripe";
import { MercadoPagoProvider } from "./mercadopago";
import type { PaymentMethod, PaymentProvider, PaymentProviderId } from "./types";

export * from "./types";

const REGISTRY: Record<PaymentProviderId, PaymentProvider> = {
  mock: MockProvider,
  stripe: StripeProvider,
  mercadopago: MercadoPagoProvider,
};

/**
 * Provider ativo. Trocar para "stripe" ou "mercadopago" quando os
 * adapters reais estiverem implementados (ver os arquivos correspondentes).
 */
export const ACTIVE_PROVIDER: PaymentProviderId = "mock";

export function getPaymentProvider(id: PaymentProviderId = ACTIVE_PROVIDER): PaymentProvider {
  return REGISTRY[id];
}

export function getProviderForMethod(method: PaymentMethod): PaymentProvider {
  const active = getPaymentProvider();
  if (active.supports.includes(method)) return active;
  // fallback to mock for unsupported methods (e.g. PIX in Stripe)
  return MockProvider;
}