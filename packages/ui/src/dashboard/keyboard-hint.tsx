import { cn } from "../lib/utils";

export interface KeyboardHintProps {
  /** The key combination, e.g. "⌘K" or "Ctrl+Shift+P". */
  combo: string;
  /** Label shown next to the combo. */
  label?: string;
  className?: string;
}

export function KeyboardHint({ combo, label, className }: KeyboardHintProps) {
  return (
    <span className={cn("ms-dash-kbd-hint", className)}>
      {label && <span className="ms-dash-kbd-hint-label">{label}</span>}
      <kbd className="ms-dash-kbd">{combo}</kbd>
    </span>
  );
}

export function CommandPaletteHint({ className }: { className?: string }) {
  return (
    <button type="button" className={cn("ms-dash-cp-hint", className)} aria-label="Open command palette (⌘K)">
      <span className="ms-dash-cp-hint-text">Quick switch</span>
      <kbd className="ms-dash-kbd">⌘K</kbd>
    </button>
  );
}
