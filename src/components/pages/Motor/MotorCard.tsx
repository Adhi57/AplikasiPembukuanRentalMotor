import { Bike, Pencil, Eye } from "lucide-react"
import { Motor } from "@/types/motor.types"
import { convertFileSrc } from "@tauri-apps/api/core"

interface MotorCardProps {
  motor: Motor
  onEdit?: (motor: Motor) => void
}

export default function MotorCard({ motor, onEdit }: MotorCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-600 p-5 hover:shadow-md transition">

      {/* Foto Motor */}
      <div className="mb-3">
        <img
          src={convertFileSrc(motor.foto)}
          alt={motor.nama}
          className="h-72 w-72 object-cover mx-auto rounded-lg"
        />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-slate-200">
            {motor.nama}
          </h3>
        </div>

        <span
          className={`text-xs px-3 py-1 rounded-full font-medium
            ${motor.status === "tersedia"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {motor.status === "tersedia" ? "Tersedia" : "Disewa"}
        </span>
      </div>

      {/* Body */}
      <div className="text-sm text-slate-200 space-y-1">
        <p>
          Plat Nomor:{" "}
          <span className="font-medium text-slate-200">
            {motor.plat}
          </span>
        </p>
        <p>
          Harga / Hari:{" "}
          <span className="font-medium text-slate-200">
            Rp {Number(motor.harga_harian).toLocaleString("id-ID")}
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 mt-4">
        <button className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-slate-300 hover:bg-slate-600 transition">
          <Eye size={14} />
          Detail
        </button>

        <button
          onClick={() => onEdit?.(motor)}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          <Pencil size={14} />
          Edit
        </button>
      </div>
    </div>
  )
}