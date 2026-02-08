import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"

export default function Breadcrumbs() {
  const location = useLocation()

  const pathnames = location.pathname
    .split("/")
    .filter(Boolean)

  return (
    <nav className="flex items-center text-sm text-slate-500">
      <Link
        to="/"
        className="hover:text-slate-700 font-medium"
      >
        Dashboard
      </Link>

      {pathnames.map((value, index) => {
        const to = "/" + pathnames.slice(0, index + 1).join("/")
        const isLast = index === pathnames.length - 1

        const label =
          value.charAt(0).toUpperCase() + value.slice(1)

        return (
          <div key={to} className="flex items-center">
            <ChevronRight size={16} className="mx-2" />

            {isLast ? (
              <span className="font-semibold text-slate-700">
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-slate-700"
              >
                {label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
