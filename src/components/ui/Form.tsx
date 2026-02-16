import { ComponentProps, ReactNode, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

// Wrapper untuk Form Container agar senada dengan Table
export function FormCard({ children, title, description, className = "" }: { children: ReactNode; title?: string; description?: string; className?: string }) {
    return (
        <div className={`bg-slate-800 backdrop-blur-sm rounded-xl shadow-xl border border-slate-700 overflow-hidden ${className}`}>
            {(title || description) && (
                <div className="p-6 border-b border-slate-700">
                    {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
                    {description && <p className="text-sm text-slate-400 mt-1">{description}</p>}
                </div>
            )}
            <div className="p-6 text-slate-200">{children}</div>
        </div>
    );
}

// Wrapper untuk setiap field agar rapi
export function FormGroup({ children, className = "" }: { children: ReactNode; className?: string }) {
    return <div className={`space-y-1.5 ${className}`}>{children}</div>;
}

// Label dengan styling dark mode
export function Label({ children, className = "", required = false, ...props }: ComponentProps<"label"> & { required?: boolean }) {
    return (
        <label className={`block text-sm font-medium text-slate-400 mb-1 ${className}`} {...props}>
            {children}
            {required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );
}

// Base styles for inputs
const inputBaseStyles = `
    w-full bg-slate-800 border rounded-lg px-4 text-slate-100 
    placeholder-slate-500 focus:outline-none focus:ring-2 transition-all
    disabled:opacity-50 disabled:cursor-not-allowed
    scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent
`;

const getStatusStyles = (error?: string) =>
    error
        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
        : "border-slate-700 focus:border-blue-500 focus:ring-blue-500";

// Input text biasa
export const Input = forwardRef<HTMLInputElement, ComponentProps<"input"> & { error?: string }>(
    ({ className = "", error, ...props }, ref) => {
        return (
            <div className="relative group">
                <input
                    ref={ref}
                    className={`
                        ${inputBaseStyles}
                        py-2.5
                        ${getStatusStyles(error)}
                        ${className}
                        // Styling for date picker
                        [&::-webkit-calendar-picker-indicator]:invert
                        [&::-webkit-calendar-picker-indicator]:opacity-50
                        [&::-webkit-calendar-picker-indicator]:hover:opacity-100
                        [&::-webkit-calendar-picker-indicator]:cursor-pointer
                    `}
                    {...props}
                />
                {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
            </div>
        );
    }
);
Input.displayName = "Input";

// Textarea
export const Textarea = forwardRef<HTMLTextAreaElement, ComponentProps<"textarea"> & { error?: string }>(
    ({ className = "", error, ...props }, ref) => {
        return (
            <div className="relative group">
                <textarea
                    ref={ref}
                    className={`
                        ${inputBaseStyles}
                        py-3 min-h-[100px] resize-y
                        ${getStatusStyles(error)}
                        ${className}
                    `}
                    {...props}
                />
                {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
            </div>
        );
    }
);
Textarea.displayName = "Textarea";

// Select
export const Select = forwardRef<HTMLSelectElement, ComponentProps<"select"> & { error?: string }>(
    ({ className = "", children, error, ...props }, ref) => {
        return (
            <div className="relative group">
                <div className="relative">
                    <select
                        ref={ref}
                        className={`
                            ${inputBaseStyles}
                            py-2.5 appearance-none
                            ${getStatusStyles(error)}
                            ${className}
                        `}
                        {...props}
                    >
                        {children}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                        <ChevronDown size={18} />
                    </div>
                </div>
                {error && <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>}
            </div>
        );
    }
);
Select.displayName = "Select";
