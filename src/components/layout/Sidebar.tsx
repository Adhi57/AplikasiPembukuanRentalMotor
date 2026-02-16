import { NavLink } from "react-router-dom"
import {
  LayoutDashboard,
  Bike,
  Users,
  Receipt,
  Wallet,
  BarChart3,
  Settings,
  Banknote,
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
      {
        name: "Bukti Pelunasan",
        path: "/bukti_Pelunasan",
        icon: <Wallet size={18} />,
      },
    ],
  },
  {
    title: "KEUANGAN",
    items: [
      {
        name: "Pengeluaran Rental",
        path: "/pengeluaran_rental",
        icon: <Wallet size={18} />,
      },
      {
        name: "Buku Kas",
        path: "/kas",
        icon: <Banknote size={18} />,
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
        name: "Pengaturan",
        path: "/pengaturan",
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
            ${isActive
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
                    ${isActive
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

      {/* Footer */}
      <div className="absolute bottom-0 left-0 w-full px-6 py-4 border-t border-slate-700">
        <p className="text-xs text-slate-500 text-center">Developed by <a href="https://www.instagram.com/hawkware.smg/" target="_blank" rel="noopener noreferrer" className="text-slate-400 font-medium hover:text-blue-400 transition">@hawkware.smg</a></p>
      </div>
    </aside>
  )
}
