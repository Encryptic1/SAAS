/**
 * Minimal 5-field cron expression validator + human-readable describer.
 *
 * Supports standard syntax: `* , - /` and `L`/`W` are accepted but not
 * deeply parsed (kept lenient so Vercel Cron / GitHub Actions expressions
 * pass through). Returns null when valid, or an error string.
 */

const FIELDS: Array<{ name: string; min: number; max: number }> = [
  { name: "minute", min: 0, max: 59 },
  { name: "hour", min: 0, max: 23 },
  { name: "day-of-month", min: 1, max: 31 },
  { name: "month", min: 1, max: 12 },
  { name: "day-of-week", min: 0, max: 6 },
];

const MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const DOW_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export function validateCron(expr: string): string | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) {
    return "Cron expressions must have exactly 5 fields: minute hour day-of-month month day-of-week";
  }
  for (let i = 0; i < 5; i++) {
    const def = FIELDS[i];
    if (!def) continue;
    const err = validateField(parts[i] ?? "", def);
    if (err) return err;
  }
  return null;
}

function validateField(field: string, def: { name: string; min: number; max: number }): string | null {
  if (field === "*" || field === "?") return null;
  // Named tokens for month / dow
  const upper = field.toUpperCase();
  if (def.name === "month" && MONTH_NAMES.some((m) => upper.includes(m))) return null;
  if (def.name === "day-of-week" && DOW_NAMES.some((d) => upper.includes(d))) return null;
  // L / W modifiers (day-of-month)
  if (def.name === "day-of-month" && /[LW]/i.test(field)) return null;
  if (def.name === "day-of-week" && /[L#]/i.test(field)) return null;

  for (const token of field.split(",")) {
    const stepMatch = token.match(/^(.+?)\/(\d+)$/);
    const base = stepMatch ? (stepMatch[1] ?? token) : token;
    const rangeMatch = base.match(/^(\d+)-(\d+)$/);
    if (base === "*") {
      if (stepMatch) {
        const step = Number(stepMatch[2]);
        if (step < 1 || step > def.max) return `${def.name}: step out of range in "${token}"`;
      }
      continue;
    }
    if (rangeMatch) {
      const lo = Number(rangeMatch[1]);
      const hi = Number(rangeMatch[2]);
      if (lo < def.min || hi > def.max || lo > hi) {
        return `${def.name}: range ${lo}-${hi} out of bounds (${def.min}-${def.max})`;
      }
      if (stepMatch) {
        const step = Number(stepMatch[2]);
        if (step < 1) return `${def.name}: step must be >= 1 in "${token}"`;
      }
      continue;
    }
    const n = Number(base);
    if (Number.isNaN(n) || n < def.min || n > def.max) {
      return `${def.name}: "${base}" is not a valid value (${def.min}-${def.max})`;
    }
  }
  return null;
}

export function describeCron(expr: string): string {
  const err = validateCron(expr);
  if (err) return err;
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return err ?? "Invalid cron expression";
  const [min, hour, dom, month, dow] = parts as [string, string, string, string, string];
  const everyMin = min === "*";
  const everyHour = hour === "*";
  const everyDom = dom === "*" || dom === "?";
  const everyMonth = month === "*";
  const everyDow = dow === "*" || dow === "?";

  if (everyMin && everyHour && everyDom && everyMonth && everyDow) return "Every minute";
  if (min.startsWith("*/") && everyHour && everyDom && everyMonth && everyDow) {
    return `Every ${min.slice(2)} minutes`;
  }
  if (hour.startsWith("*/") && min === "0" && everyDom && everyMonth && everyDow) {
    return `Every ${hour.slice(2)} hours`;
  }
  if (min === "0" && everyHour && everyDom && everyMonth && everyDow) return "Every hour at :00";
  if (min === "0" && hour === "0" && everyDom && everyMonth && everyDow) return "Daily at midnight";
  if (min === "0" && hour === "9" && everyDom && everyMonth && everyDow) return "Daily at 09:00";
  if (min === "0" && hour === "0" && dom === "1" && everyMonth && everyDow) return "Monthly on the 1st at midnight";
  if (min === "0" && hour === "0" && everyDom && everyMonth && (dow === "0" || dow === "6")) {
    return dow === "0" ? "Every Sunday at midnight" : "Every Saturday at midnight";
  }
  if (min === "0" && hour === "0" && everyDom && everyMonth && dow === "1-5") return "Weekdays at midnight";
  if (min === "0" && hour === "9" && everyDom && everyMonth && dow === "1-5") return "Weekdays at 09:00";

  const dowLabel = everyDow ? "" : ` on ${dow}`;
  const domLabel = everyDom ? "" : ` on day ${dom}`;
  const monthLabel = everyMonth ? "" : ` in month ${month}`;
  return `At ${hour.padStart(2, "0")}:${min.padStart(2, "0")}${domLabel}${monthLabel}${dowLabel}`;
}
