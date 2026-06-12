/**
 * Format centavos as Argentine Peso string.
 * Amounts are stored as integers in centavos.
 * Display format: $45.000,50
 */
export function formatARS(centavos: number): string {
  const pesos = centavos / 100;
  const isNegative = pesos < 0;
  const abs = Math.abs(pesos);

  const intPart = Math.floor(abs);
  const decPart = Math.round((abs - intPart) * 100);

  // Format integer part with dots as thousands separator (AR convention)
  const intFormatted = intPart.toLocaleString('es-AR').replace(/,/g, '.');

  let result: string;
  if (decPart === 0) {
    result = `$${intFormatted}`;
  } else {
    const decStr = decPart.toString().padStart(2, '0');
    result = `$${intFormatted},${decStr}`;
  }

  return isNegative ? `-${result}` : result;
}

/**
 * Format centavos as compact string for small spaces.
 * e.g. 1500000 → $15.000
 */
export function formatARSCompact(centavos: number): string {
  const pesos = centavos / 100;
  const abs = Math.abs(pesos);
  const isNegative = pesos < 0;

  let formatted: string;
  if (abs >= 1_000_000) {
    formatted = `$${(abs / 1_000_000).toFixed(1).replace('.', ',')}M`;
  } else if (abs >= 1_000) {
    const k = abs / 1_000;
    formatted = `$${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1).replace('.', ',')}.000`.replace(
      /\.\d{3}\.000$/,
      '.000',
    );
    // Fallback to simple format
    formatted = `$${Math.round(abs).toLocaleString('es-AR').replace(/,/g, '.')}`;
  } else {
    formatted = `$${Math.round(abs)}`;
  }

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Parse ARS string back to centavos.
 * Accepts "$45.000" or "45000" or "450,50"
 */
export function parseARSToCentavos(input: string): number {
  const cleaned = input.replace(/\$/g, '').replace(/\./g, '').replace(',', '.');
  const value = parseFloat(cleaned);
  if (isNaN(value)) return 0;
  return Math.round(value * 100);
}

/**
 * Format a YYYY-MM string to a human-readable month.
 * e.g. "2026-06" → "Junio 2026"
 */
export function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

/**
 * Returns current month as YYYY-MM string.
 */
export function currentMonth(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Format ISO date string to locale date.
 * e.g. "2026-06-07T..." → "7 jun."
 */
export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const date = new Date(iso);
  return date.toLocaleDateString('es-AR', opts ?? { day: 'numeric', month: 'short' });
}

/**
 * Format ISO date string to relative text.
 * "Hoy", "Ayer", or "7 jun."
 */
export function formatDateRelative(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return formatDate(iso);
}
