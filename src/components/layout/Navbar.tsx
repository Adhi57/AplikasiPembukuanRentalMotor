import { Bell, UserCircle } from "lucide-react"
import Breadcrumbs from "./Breadcrumb"

export default function Navbar() {
  return (
    <header
      className="
        fixed
        top-4
        left-[17rem]
        right-4
        h-16
        bg-slate-800
        rounded-xl
        shadow-lg
        flex
        items-center
        justify-between
        px-6
        z-40
      "
    >
      
      {/* Left */}
      <Breadcrumbs />

      {/* Right */}
      <div className="flex items-center gap-4">
        
        <button className="relative p-2 rounded-full hover:bg-slate-700 transition">
          <Bell size={20} className="text-slate-200" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 px-3 py-1 rounded-lg transition">
          <UserCircle size={28} className="text-slate-200" />
          <div className="text-sm leading-tight">
            <p className="font-medium text-slate-100">Admin</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>

      </div>
    </header>
  )
}
