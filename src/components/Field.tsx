import type { InputHTMLAttributes, SelectHTMLAttributes } from "react";

type BaseProps = {
  label: string;
  hint?: string;
};

type FieldProps = BaseProps & InputHTMLAttributes<HTMLInputElement>;

export function Field({ label, hint, className = "", ...props }: FieldProps) {
  return (
    <label className={`field-shell ${className}`}>
      <span className="field-label">{label}</span>
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
