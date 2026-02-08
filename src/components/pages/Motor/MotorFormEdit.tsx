import { useState } from "react"
import { invoke, convertFileSrc } from "@tauri-apps/api/core"
import Button from "@/components/ui/Button"
import { X, Save } from "lucide-react"

interface Motor {
  motor_id: number
  nama: string
  plat: string
  tipe_motor: string
  tahun: string
  harga_harian: number
  foto: string
  status?: string // tambahkan ini jika ada
}

interface MotorFormEditProps {
  motor: Motor
  onSuccess?: () => void
  onCancel?: () => void
}

export default function MotorFormEdit({
  motor,
  onSuccess,
  onCancel,
}: MotorFormEditProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [preview, setPreview] = useState<string | null>(
    motor.foto ? convertFileSrc(motor.foto) : null
  )

  const [form, setForm] = useState({
    nama: motor.nama,
    plat: motor.plat,
    tipe_motor: motor.tipe_motor,
    tahun: motor.tahun,
    harga_harian: String(motor.harga_harian),
    foto: motor.foto,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      const base64 = reader.result as string
      setForm((prev) => ({ ...prev, foto: base64 }))
      setPreview(base64)
    }

    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let fotoPath = form.foto

      console.log("Form data:", form) // Debug log

      // Jika user ganti foto (foto berupa base64)
      if (form.foto.startsWith("data:image")) {
        console.log("Saving new image...") // Debug log
        fotoPath = await invoke<string>("save_motor_image", {
          base64: form.foto,
        })
        console.log("New image path:", fotoPath) // Debug log
      }

      const payload = {
        nama: form.nama,
        plat: form.plat,
        tipe_motor: form.tipe_motor,
        tahun: form.tahun,
        harga_harian: Number(form.harga_harian),
        foto: fotoPath,
      }

      console.log("Updating motor with payload:", payload) // Debug log
      console.log("Motor ID:", motor.motor_id) // Debug log

      await invoke("update_motor", {
        motorId: motor.motor_id,
        payload: payload,
      })

      console.log("Update successful!") // Debug log
      alert("Motor berhasil diupdate!")
      onSuccess?.()
    } catch (err) {
      console.error("Error detail:", err) // Debug log
      setError(err instanceof Error ? err.message : String(err))
      alert(`Gagal update motor: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-200">
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Nama */}
      <Input label="Nama Motor" name="nama" value={form.nama} onChange={handleChange} required />

      {/* Plat */}
      <Input label="Plat Nomor" name="plat" value={form.plat} onChange={handleChange} required />

      {/* Tipe */}
      <Input label="Tipe Motor" name="tipe_motor" value={form.tipe_motor} onChange={handleChange} required />

      {/* Tahun */}
      <Input label="Tahun" name="tahun" value={form.tahun} onChange={handleChange} required />

      {/* Harga */}
      <div>
        <label className="text-sm">Harga / Hari</label>
        <input
          type="number"
          name="harga_harian"
          value={form.harga_harian}
          onChange={handleChange}
          required
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      {/* Foto */}
      <div>
        <label className="text-sm">Foto Motor</label>
        <label
          htmlFor="dropzone-file-edit"
          className="relative flex items-center justify-center w-full h-64 mt-2
                     bg-gray-800 border border-dashed border-gray-600 rounded-lg
                     cursor-pointer overflow-hidden hover:border-gray-500 transition"
        >
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400">Click to upload</span>
          )}

          <input
            id="dropzone-file-edit"
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>
      </div>

      {/* Action */}
      <div className="flex justify-end gap-2 pt-2">
        <Button
          type="button"
          icon={<X size={16} />}
          label="Batal"
          onClick={onCancel}
          className="bg-gray-600 hover:bg-gray-500"
        />
        <Button
          type="submit"
          icon={<Save size={16} />}
          label={loading ? "Menyimpan..." : "Simpan Perubahan"}
          disabled={loading}
        />
      </div>
    </form>
  )
}

function Input({ label, ...props }: any) {
  return (
    <div>
      <label className="text-sm">{label}</label>
      <input
        {...props}
        className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
      />
    </div>
  )
}