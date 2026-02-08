import { Pencil, Trash2, Bike } from "lucide-react"
import { convertFileSrc } from "@tauri-apps/api/core"
import { Motor } from "@/types/motor.type"

interface MotorCardProps {
  motor: Motor
  onEdit?: (motor: Motor) => void
  onDelete?: () => void
}

export default function MotorCard({ motor, onEdit, onDelete }: MotorCardProps) {
  const isTersedia = motor.status === "tersedia";

  return (
    <div className="group bg-slate-800/50 rounded-2xl shadow-xl border border-slate-700/50 overflow-hidden hover:border-blue-500/50 transition-all duration-300">

      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-slate-900">
        {motor.foto ? (
          <img
            src={convertFileSrc(motor.foto)}
            alt={motor.nama}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-700">
            <Bike size={64} />
          </div>
        )}

        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg backdrop-blur-xl ${isTersedia
            ? "bg-emerald-500/80 text-emerald-800 border border-emerald-500/30"
            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}>
            {motor.status}
          </span>
        </div>

        {/* Action Overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-slate-900 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex justify-end gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(motor); }}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete?.(); }}
            className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg shadow-lg transition"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
            {motor.nama}
          </h3>
          <p className="text-xs text-slate-400 font-mono uppercase">{motor.plat}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="text-xs text-slate-500 uppercase font-semibold tracking-tighter">Harga Harian</div>
          <div className="text-lg font-black text-blue-400">
            <span className="text-xs font-normal text-slate-500 mr-1">Rp</span>
            {Number(motor.harga_harian).toLocaleString("id-ID")}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-widest text-slate-500">
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 text-center">
            {motor.tipe_motor}
          </div>
          <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-700/50 text-center">
            {motor.tahun}
          </div>
        </div>
      </div>
    </div>
  )
}