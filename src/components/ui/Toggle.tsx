export default function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer select-none">
      <button type="button" className="toggle" data-on={on} onClick={() => onChange(!on)} aria-pressed={on}>
        <span className="toggle-dot" />
      </button>
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </label>
  );
}
