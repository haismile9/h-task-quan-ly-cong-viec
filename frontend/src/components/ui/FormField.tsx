import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Lỗi validation của trường (mảng thông báo từ Laravel). */
  errors?: string[];
}

/** Ô nhập có nhãn và lỗi validation, dùng cho các form xác thực. */
const FormField = ({ label, errors, className = "", ...inputProps }: FormFieldProps) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="font-semibold">{label}</span>
    <input
      {...inputProps}
      className={`input input-bordered w-full ${errors?.length ? "input-error" : ""} ${className}`}
      aria-invalid={!!errors?.length}
    />
    {errors?.map((msg) => (
      <span key={msg} className="text-error text-xs">
        {msg}
      </span>
    ))}
  </label>
);

export default FormField;
