import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import MotorCard from "./MotorCard"
import { getMotor, deleteMotor } from "@/services/motor.service"
import { Motor } from "@/types/motor.type"
import Button from "@/components/ui/Button"
import { Plus, FileSpreadsheet, FileText, CheckCircle, FolderOpen, X } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

export default function MotorList() {
  const navigate = useNavigate()
  const [motors, setMotors] = useState<Motor[]>([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ show: boolean; message: string; filePath: string; folderPath: string }>({
    show: false,
    message: "",
    filePath: "",
    folderPath: "",
  });

  useEffect(() => {
    fetchMotor()
  }, [])

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((t) => ({ ...t, show: false })), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

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

  const handleOpenFolder = async () => {
    try {
      await invoke("open_folder", { path: toast.folderPath });
    } catch (err) {
      console.error("Failed to open folder:", err);
    }
  };

  // ======== EXPORT EXCEL ========
  const exportExcel = async () => {
    try {
      const now = new Date();
      const ts = `${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
      const fileName = `Data_Motor_${ts}.xlsx`;
      const rows: any[][] = [];
      rows.push(["Data Katalog Motor"]);
      rows.push([]);
      rows.push(["No", "Nama Motor", "Plat Nomor", "Tipe", "Tahun", "Harga Harian (Rp)", "Status"]);

      motors.forEach((m, idx) => {
        rows.push([idx + 1, m.nama, m.plat, m.tipe_motor, m.tahun, m.harga_harian, m.status]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 18 }, { wch: 15 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Motor");

      const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const data = Array.from(new Uint8Array(wbOut));
      const savedPath: string = await invoke("save_file", { fileName, data });
      const folderPath = savedPath.substring(0, savedPath.lastIndexOf("\\"));

      setToast({ show: true, message: fileName, filePath: savedPath, folderPath });
    } catch (err) {
      console.error("Export Excel failed:", err);
      alert("Gagal mengekspor Excel");
    }
  };

  // ======== EXPORT PDF ========
  const exportPDF = async () => {
    try {
      const now = new Date();
      const ts = `${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
      const fileName = `Data_Motor_${ts}.pdf`;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Data Katalog Motor", 14, 20);
      doc.setFontSize(10);
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);

      const tableRows = motors.map((m, idx) => [
        idx + 1,
        m.nama,
        m.plat,
        m.tipe_motor,
        m.tahun,
        m.harga_harian.toLocaleString("id-ID"),
        m.status,
      ]);

      autoTable(doc, {
        startY: 32,
        head: [["No", "Nama Motor", "Plat Nomor", "Tipe", "Tahun", "Harga Harian (Rp)", "Status"]],
        body: tableRows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] },
      });

      const pdfOutput = doc.output("arraybuffer");
      const data = Array.from(new Uint8Array(pdfOutput));
      const savedPath: string = await invoke("save_file", { fileName, data });
      const folderPath = savedPath.substring(0, savedPath.lastIndexOf("\\"));

      setToast({ show: true, message: fileName, filePath: savedPath, folderPath });
    } catch (err) {
      console.error("Export PDF failed:", err);
      alert("Gagal mengekspor PDF");
    }
  };

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

        <div className="flex items-center gap-2">
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-700 rounded-lg text-sm transition"
            title="Export Excel"
          >
            <FileSpreadsheet size={16} />
            <span className="hidden sm:inline">Excel</span>
          </button>
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-700 rounded-lg text-sm transition"
            title="Export PDF"
          >
            <FileText size={16} />
            <span className="hidden sm:inline">PDF</span>
          </button>
          <Button
            label="Tambah"
            icon={<Plus size={16} />}
            href="/motor/tambah"
          />
        </div>
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

      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-slate-800 border border-green-600/50 rounded-xl shadow-2xl shadow-green-900/20 p-4 flex items-start gap-3 max-w-sm">
            <div className="p-1.5 bg-green-500/20 rounded-lg shrink-0 mt-0.5">
              <CheckCircle size={18} className="text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-200">File berhasil disimpan!</p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{toast.message}</p>
              <button
                onClick={handleOpenFolder}
                className="flex items-center gap-1.5 mt-2 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-700/50 rounded-lg text-xs transition"
              >
                <FolderOpen size={14} />
                <span>Buka Folder</span>
              </button>
            </div>
            <button
              onClick={() => setToast((t) => ({ ...t, show: false }))}
              className="text-slate-500 hover:text-slate-300 transition shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}