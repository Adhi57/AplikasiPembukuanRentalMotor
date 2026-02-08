import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Bike,
  Users,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
} from "lucide-react"

interface MenuItem {
  name: string
  path: string
  icon: React.ReactNode
}

interface MenuGroup {
  title: string
  items: MenuItem[]
}

const menuGroups: MenuGroup[] = [
  {
    title: "MASTER DATA",
    items: [
      {
        name: "Data Motor",
        path: "/motor",
        icon: <Bike size={18} />,
      },
      {
        name: "Data Penyewa",
        path: "/penyewa",
        icon: <Users size={18} />,
      },
    ],
  },
  {
    title: "OPERASIONAL",
    items: [
      {
        name: "Transaksi",
        path: "/transaksi",
        icon: <Receipt size={18} />,
      },
    ],
  },
  {
    title: "KEUANGAN",
    items: [
      {
        name: "Pembukuan",
        path: "/pembukuan",
        icon: <Wallet size={18} />,
      },
      {
        name: "Laporan",
        path: "/laporan",
        icon: <BarChart3 size={18} />,
      },
    ],
  },
  {
    title: "PENGATURAN",
    items: [
      {
        name: "Pengaturan Denda",
        path: "/pengaturan/denda",
        icon: <Settings size={18} />,
      },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 border-r-2 border-zinc-600 text-slate-100 shadow-xl">
      {/* Logo */}
      <div className="h-16 flex items-center gap-2 px-6 text-lg font-bold">
          Aplikasi Rental Motor
      </div>

      <nav className="p-4 space-y-4">
        {/* Dashboard */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center my-7 gap-3 px-4 py-3 rounded-md text-sm font-medium transition
            ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            }`
          }
        >
          <LayoutDashboard size={18} />
          Dashboard
        </NavLink>

        {/* Grouped Menus */}
        {menuGroups.map((group) => (
          <div key={group.title}>
            <p className="px-4 mt-4 mb-2 text-xs font-semibold text-slate-400 tracking-wider">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition
                    ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`
                  }
                >
                  <div className=" border border-indigo-900 rounded-md p-2 border-spacing-4">
                  {item.icon}
                  </div>
                  {item.name}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}
