import { useState } from "react"
import { invoke } from "@tauri-apps/api/core"
import Button from "@/components/ui/Button"
import { X, Save } from "lucide-react"

interface MotorFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export default function MotorForm({ onSuccess, onCancel }: MotorFormProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [form, setForm] = useState({
    nama: "",
    plat: "",
    tipe_motor: "",
    tahun: "",
    harga_harian: "",
    foto: "",
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

    reader.onerror = () => {
      setError("Gagal membaca file")
    }

    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validasi foto harus ada
      if (!form.foto) {
        throw new Error("Foto motor harus diupload")
      }

      console.log("=== DEBUG START ===")
      console.log("Form data:", {
        ...form,
        foto: form.foto.substring(0, 50) + "..." // Tampilkan sebagian saja
      })

      // 1️⃣ Simpan file dulu
      console.log("Saving image...")
      const imagePath = await invoke<string>("save_motor_image", {
        base64: form.foto,
      })
      console.log("Image saved at:", imagePath)

      // 2️⃣ Simpan data motor
      const payload = {
        nama: form.nama,
        plat: form.plat,
        tipe_motor: form.tipe_motor,
        tahun: form.tahun,
        harga_harian: Number(form.harga_harian),
        foto: imagePath,
      }
      
      console.log("Payload:", payload)
      
      await invoke("add_motor", { payload })
      
      console.log("Motor saved successfully!")
      console.log("=== DEBUG END ===")

      alert("Motor berhasil ditambahkan!")
      
      // Reset form
      setForm({
        nama: "",
        plat: "",
        tipe_motor: "",
        tahun: "",
        harga_harian: "",
        foto: "",
      })
      setPreview(null)
      
      onSuccess?.()
    } catch (err) {
      console.error("Error detail:", err)
      const errorMessage = err instanceof Error ? err.message : String(err)
      setError(errorMessage)
      alert(`Gagal menyimpan motor: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-gray-200">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Nama */}
      <div>
        <label className="text-sm">Nama Motor</label>
        <input
          name="nama"
          value={form.nama}
          onChange={handleChange}
          required
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
      </div>

      {/* Plat */}
      <div>
        <label className="text-sm">Plat Nomor</label>
        <input
          name="plat"
          value={form.plat}
          onChange={handleChange}
          required
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      {/* Tipe */}
      <div>
        <label className="text-sm">Tipe Motor</label>
        <input
          name="tipe_motor"
          value={form.tipe_motor}
          onChange={handleChange}
          required
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      {/* Tahun */}
      <div>
        <label className="text-sm">Tahun</label>
        <input
          name="tahun"
          value={form.tahun}
          onChange={handleChange}
          required
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      {/* Harga */}
      <div>
        <label className="text-sm">Harga / Hari</label>
        <input
          type="number"
          name="harga_harian"
          value={form.harga_harian}
          onChange={handleChange}
          required
          min="0"
          className="w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2"
        />
      </div>

      {/* Foto */}
      <div>
        <label className="text-sm">Foto Motor *</label>
        <label
          htmlFor="dropzone-file"
          className="relative flex flex-col items-center justify-center w-full h-64 mt-2
                     bg-gray-800 border border-dashed border-gray-600 rounded-lg
                     cursor-pointer hover:bg-gray-700 transition overflow-hidden"
        >
          {preview ? (
            <>
              <img
                src={preview}
                alt="Preview Motor"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                ✓ Foto dipilih
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-400">
              <svg
                className="w-8 h-8 mb-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h3a3 3 0 000-6h-.025A5.56 5.56 0 0018 10.5
                     5.5 5.5 0 007.207 9.021 4 4 0 107 17h2.167M12 19v-9m0 0-2 2m2-2 2 2"
                />
              </svg>
              <p className="text-sm font-semibold">Click to upload</p>
              <p className="text-xs text-gray-500">PNG, JPG, WEBP</p>
            </div>
          )}

          <input
            id="dropzone-file"
            type="file"
            accept="image/*"
            onChange={handleFile}
            required
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
          label={loading ? "Menyimpan..." : "Simpan"}
          disabled={loading}
        />
      </div>
    </form>
  )
}