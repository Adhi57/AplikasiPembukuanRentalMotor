import { SelectHTMLAttributes } from "react"
import clsx from "clsx"

interface SelectOption {
    value: string
    label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string
    error?: string
    options: SelectOption[]
}

export default function Select({
    label,
    error,
    options,
    className,
    ...props
}: SelectProps) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-300">
                    {label}
                </label>
            )}

            <select
                {...props}
                className={clsx(
                    "w-full rounded-lg border px-3 py-2 text-sm",
                    "bg-slate-800 text-slate-100",
                    "border-slate-700",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    "transition",
                    error && "border-red-500 focus:ring-red-500",
                    className
                )}
            >
                <option value="">-- Pilih --</option>
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {error && (
                <p className="text-xs text-red-400">
                    {error}
                </p>
            )}
        </div>
    )
}
