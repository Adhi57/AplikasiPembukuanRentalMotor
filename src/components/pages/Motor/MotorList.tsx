import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import MotorCard from "./MotorCard"
import { getMotor, deleteMotor } from "@/services/motor.service"
import { Motor } from "@/types/motor.type"
import Button from "@/components/ui/Button"
import { Plus } from "lucide-react"

export default function MotorList() {
  const navigate = useNavigate()
  const [motors, setMotors] = useState<Motor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMotor()
  }, [])

  const fetchMotor = async () => {
    try {
      setLoading(true)
      const data = await getMotor()
      setMotors(data)
    } catch (err) {
      console.error("Gagal ambil data motor", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (motor: Motor) => {
    navigate(`/motor/edit/${motor.motor_id}`)
  }

  const handleDelete = async (motor: Motor) => {
    if (confirm(`Apakah Anda yakin ingin menghapus motor ${motor.nama}?`)) {
      try {
        await deleteMotor(motor.motor_id)
        fetchMotor()
      } catch (err) {
        console.error("Gagal hapus motor", err)
        alert("Gagal menghapus motor")
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <p className="ml-3 text-slate-400">Memuat data motor...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 italic tracking-tight">Katalog <span className="text-blue-500">Motor</span></h1>
          <p className="text-sm text-slate-400">Total {motors.length} armada tersedia</p>
        </div>

        <Button
          label="Tambah Motor"
          icon={<Plus size={16} />}
          href="/motor/tambah"
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {motors.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
            <p className="text-slate-400">Belum ada data motor yang terdaftar.</p>
          </div>
        ) : (
          motors.map((motor) => (
            <MotorCard
              key={motor.motor_id}
              motor={motor}
              onEdit={handleEdit}
              onDelete={() => handleDelete(motor)}
            />
          ))
        )}
      </div>
    </div>
  )
}