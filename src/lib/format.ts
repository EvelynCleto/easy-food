export const brl = (v: number | string | null | undefined) => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
};

export const km = (meters: number) =>
  meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`;

export const cn = (...xs: Array<string | false | null | undefined>) =>
  xs.filter(Boolean).join(" ");

export const num = (v: number | string | null | undefined, digits = 1) => {
  const n = typeof v === "string" ? Number(v) : (v ?? 0);
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(n);
};