import { useEffect, useState } from "react"
import MotorCard from "./MotorCard"
import { getMotor } from "@/services/motor.service"
import { Motor } from "@/types/motor.type"
import Button from "@/components/ui/Button"
import Modal from "@/components/ui/Modal"
import MotorForm from "./MotorForm"
import MotorFormEdit from "./MotorFormEdit"
import { Plus } from "lucide-react"

export default function MotorList() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedMotor, setSelectedMotor] = useState<Motor | null>(null)
  const [motors, setMotors] = useState<Motor[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMotor()
  }, [])

  const fetchMotor = async () => {
    try {
      const data = await getMotor()
      setMotors(data)
    } catch (err) {
      console.error("Gagal ambil data motor", err)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (motor: Motor) => {
    setSelectedMotor(motor)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedMotor(null)
  }

  if (loading) {
    return <p className="text-gray-400">Loading...</p>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-200">
          Data Motor
        </h1>

        <Button
          label="Tambah Motor"
          icon={<Plus size={16} />}
          onClick={() => setIsAddModalOpen(true)}
        />
      </div>

      {/* List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {motors.length === 0 ? (
          <p className="text-gray-400">Belum ada data motor</p>
        ) : (
          motors.map((motor) => (
            <MotorCard 
              key={motor.motor_id} 
              motor={motor}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      {/* Modal Tambah Motor */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Motor"
      >
        <MotorForm
          onCancel={() => setIsAddModalOpen(false)}
          onSuccess={() => {
            setIsAddModalOpen(false)
            fetchMotor()
          }}
        />
      </Modal>

      {/* Modal Edit Motor */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        title="Edit Motor"
      >
        {selectedMotor && (
          <MotorFormEdit
            motor={selectedMotor}
            onCancel={handleCloseEditModal}
            onSuccess={() => {
              handleCloseEditModal()
              fetchMotor()
            }}
          />
        )}
      </Modal>
    </div>
  )
}