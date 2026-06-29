import type { CreatePaymentInput, CreatePaymentResult, PaymentProvider } from "./types";

function fakeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function fakePixCode(orderId: string, amount: number) {
  const a = amount.toFixed(2).replace(".", "");
  return `00020126360014BR.GOV.BCB.PIX0114${orderId.slice(0, 14)}520400005303986540${a}5802BR5909EASYFOOD6009SAOPAULO62070503***6304ABCD`;
}

export const MockProvider: PaymentProvider = {
  id: "mock",
  label: "EasyFood Pay (sandbox)",
  supports: ["pix", "credit_card", "debit_card", "meal_voucher"],
  async create(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    // emulate a small processing latency
    await new Promise((r) => setTimeout(r, 600));
    if (input.method === "pix") {
      return {
        providerId: "mock",
        status: "pending",
        externalId: fakeId("pix"),
        pixCode: fakePixCode(input.orderId, input.amount),
        message: "PIX gerado. Pague em até 30 minutos.",
      };
    }
    // cards / vouchers approve in sandbox
    return {
      providerId: "mock",
      status: "approved",
      externalId: fakeId(input.method),
      message: "Pagamento aprovado (sandbox).",
    };
  },
};