/**
 * currency.ts
 *
 * Single source of truth for currency handling across the entire workspace.
 *
 * The workspace stores a human-readable currency symbol (e.g. "₹", "$", "€")
 * as `workspace.currency`.  Intl.NumberFormat requires a valid ISO 4217 code
 * (e.g. "INR", "USD", "EUR") — passing the raw symbol throws a RangeError.
 *
 * This module provides:
 *   - CURRENCY_OPTIONS   — the dropdown options shown in the UI
 *   - symbolToIso()      — maps a stored symbol → ISO code (safe fallback)
 *   - formatCurrency()   — formats a number with the correct symbol/locale
 *   - getCurrencySymbol()— returns the printable symbol for PDF templates
 */

export type CurrencyOption = {
  /** The value stored in workspace.currency */
  symbol: string;
  /** Human-readable label for the dropdown */
  label: string;
  /** ISO 4217 code for Intl.NumberFormat */
  iso: string;
  /** BCP 47 locale that formats numbers naturally for this currency */
  locale: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { symbol: "₹", label: "₹  Indian Rupee (INR)", iso: "INR", locale: "en-IN" },
  { symbol: "$", label: "$  US Dollar (USD)", iso: "USD", locale: "en-US" },
  { symbol: "€", label: "€  Euro (EUR)", iso: "EUR", locale: "de-DE" },
  { symbol: "£", label: "£  British Pound (GBP)", iso: "GBP", locale: "en-GB" },
  {
    symbol: "AED",
    label: "AED  UAE Dirham",
    iso: "AED",
    locale: "ar-AE",
  },
];

/** Legacy stored values used "  ₹" (with a leading space). Normalise them. */
function normaliseSymbol(raw: string | null | undefined): string {
  return (raw ?? "₹").trim();
}

function findOption(symbol: string | null | undefined): CurrencyOption {
  const s = normaliseSymbol(symbol);
  return (
    CURRENCY_OPTIONS.find((o) => o.symbol === s) ??
    // Default to INR so the app never crashes on unknown values
    CURRENCY_OPTIONS[0]
  );
}

/**
 * Maps a stored symbol (or legacy " ₹") to its ISO 4217 code.
 * Also handles ISO codes passed in directly (returns them unchanged).
 */
export function symbolToIso(symbol: string | null | undefined): string {
  const s = normaliseSymbol(symbol);
  // If it's already an ISO code, return it directly
  const byIso = CURRENCY_OPTIONS.find((o) => o.iso === s.toUpperCase());
  if (byIso) return byIso.iso;
  // Otherwise look up by symbol
  return findOption(symbol).iso;
}

/**
 * Formats a number as a currency string using the symbol stored in the workspace.
 * Safe for any value stored in `workspace.currency` — never throws.
 *
 * @param value   The numeric amount to format
 * @param symbol  The workspace.currency value (e.g. "₹", "$", " ₹")
 * @returns       A formatted string like "₹10,000" or "$1,500"
 */
export function formatCurrency(
  value: number | null | undefined,
  symbol: string | null | undefined,
): string {
  if (value == null) return "—";
  const opt = findOption(symbol);
  try {
    return new Intl.NumberFormat(opt.locale, {
      style: "currency",
      currency: opt.iso,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    // Absolute fallback: symbol + plain number (should never happen with the
    // static CURRENCY_OPTIONS table, but guards against runtime edge cases)
    return `${opt.symbol}${value.toLocaleString()}`;
  }
}

/**
 * Returns the printable symbol string for PDF templates.
 *
 * Handles three stored formats robustly:
 *   "₹"   — clean symbol (current format)          → "₹"
 *   " ₹"  — legacy with leading space              → "₹"
 *   "INR" — ISO code (if ever stored that way)     → "₹"
 *   "USD" — ISO code                               → "$"
 *
 * @param symbol  The workspace.currency value
 * @returns       A clean symbol string like "₹", "$", "€", or "AED "
 */
export function getCurrencySymbol(symbol: string | null | undefined): string {
  const s = normaliseSymbol(symbol);
  // Try direct symbol match first (fast path for all normal records)
  const bySymbol = CURRENCY_OPTIONS.find((o) => o.symbol === s);
  if (bySymbol) {
    return bySymbol.symbol === "AED" ? "AED " : bySymbol.symbol;
  }
  // Try ISO code reverse-lookup (handles records where ISO code was stored)
  const byIso = CURRENCY_OPTIONS.find(
    (o) => o.iso === s.toUpperCase(),
  );
  if (byIso) {
    return byIso.symbol === "AED" ? "AED " : byIso.symbol;
  }
  // Unknown value — return as-is (safe fallback)
  return s;
}

/**
 * The canonical display options array for the currency <SelectInput>.
 * Returns an array of symbol strings so SelectInput<string> works unchanged.
 */
export const CURRENCY_SYMBOLS = CURRENCY_OPTIONS.map((o) => o.symbol) as [
  string,
  ...string[],
];
