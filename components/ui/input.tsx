import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={inputId} className="sn-label">
          {label}
        </label>
      )}
      <input id={inputId} className={cn("sn-input", className)} {...props} />
      {hint && <p className="text-xs text-[rgba(12,45,74,0.5)]">{hint}</p>}
    </div>
  );
}
