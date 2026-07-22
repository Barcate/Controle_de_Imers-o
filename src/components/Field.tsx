import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  hint?: string;
};

type FieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, hint, className = "", title, ...props }: FieldProps) {
  const tooltipText = title || label;
  return (
    <label className={`field-shell ${className}`} title={tooltipText}>
      <span className="field-label" title={tooltipText}>{label}</span>
      <input className="control-input" {...props} />
      {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

type SelectFieldProps = BaseProps & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ label, hint, className = "", children, ...props }: SelectFieldProps) {
  return (
    <label className={`field-shell ${className}`}>
      <span className="field-label">{label}</span>
      <select className="control-select" {...props}>
        {children}
      </select>
      {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
    </label>
  );
}

type ToggleFieldProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function ToggleField({ label, hint, className = "", title, ...props }: ToggleFieldProps) {
  const tooltipText = title || label;
  return (
    <label className={`toggle-shell ${className}`} title={tooltipText}>
      <div className="flex w-full items-start justify-between gap-2">
        <span>
          <span className="field-label" title={tooltipText}>{label}</span>
          {hint ? <span className="toggle-hint" title={hint}>{hint}</span> : null}
        </span>
        <div className="flex items-center justify-end flex-shrink-0">
          <input className="toggle-input" type="checkbox" {...props} />
          <span className="toggle-track" aria-hidden="true">
            <span className="toggle-thumb" />
          </span>
        </div>
      </div>
    </label>
  );
}
