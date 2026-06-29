import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  code: z.string().trim().min(1).max(40),
  subtotal: z.number().nonnegative(),
});

export type ValidateCouponResult =
  | { ok: true; id: string; code: string; discount: number; min_order: number }
  | { ok: false; error: string };

export const validateCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ValidateCouponResult> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const code = data.code.toUpperCase();
    const { data: coupon } = await supabaseAdmin
      .from("coupons")
      .select("id,code,discount_percent,discount_value,min_order,active,expires_at")
      .eq("code", code)
      .eq("active", true)
      .maybeSingle();
    if (!coupon) return { ok: false, error: "Cupom inválido" };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { ok: false, error: "Cupom expirado" };
    }
    const minOrder = Number(coupon.min_order ?? 0);
    if (data.subtotal < minOrder) {
      return { ok: false, error: `Pedido mínimo R$ ${minOrder.toFixed(2)}` };
    }
    const discount = coupon.discount_percent
      ? (data.subtotal * Number(coupon.discount_percent)) / 100
      : Number(coupon.discount_value ?? 0);
    return { ok: true, id: coupon.id, code: coupon.code, discount, min_order: minOrder };
  });