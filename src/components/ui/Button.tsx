import { ComponentProps, ReactNode } from "react"
import { Loader2 } from "lucide-react"
import { Link, LinkProps } from "react-router-dom"

type BaseButtonProps = ComponentProps<"button"> & {
  label: string
  href?: never
  icon?: ReactNode
  loading?: boolean
  variant?: "primary" | "secondary" | "danger"
}

type LinkButtonProps = Omit<LinkProps, "to"> & {
  label: string
  href: string
  icon?: ReactNode
  loading?: boolean
  variant?: "primary" | "secondary" | "danger"
  className?: string
}

type ButtonProps = BaseButtonProps | LinkButtonProps

export default function Button({
  label,
  icon,
  loading = false,
  variant = "primary",
  className = "",
  href,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-600 text-white hover:bg-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700",
  }

  const classes = `${base} ${variants[variant]} ${className}`

  if (href) {
    return (
      <Link to={href} className={classes} {...(props as Omit<LinkProps, "to">)}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <button className={classes} disabled={loading} {...(props as ComponentProps<"button">)}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      <span>{label}</span>
    </button>
  )
}

