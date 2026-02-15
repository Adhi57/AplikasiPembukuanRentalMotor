import { InputHTMLAttributes } from "react"
import clsx from "clsx"

interface FileInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
    label?: string
    error?: string
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

export default function FileInput({
    label,
    error,
    className,
    onChange,
    ...props
}: FileInputProps) {
    return (
        <div className="space-y-1">
            {label && (
                <label className="block text-sm font-medium text-slate-300">
                    {label}
                </label>
            )}

            <input
                type="file"
                onChange={onChange}
                {...props}
                className={clsx(
                    "w-full rounded-lg border px-3 py-2 text-sm",
                    "bg-slate-800 text-slate-100",
                    "border-slate-700",
                    "file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0",
                    "file:text-sm file:font-medium file:bg-blue-600 file:text-white",
                    "file:cursor-pointer hover:file:bg-blue-700",
                    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                    "transition",
                    error && "border-red-500 focus:ring-red-500",
                    className
                )}
            />

            {error && (
                <p className="text-xs text-red-400">
                    {error}
                </p>
            )}
        </div>
    )
}
