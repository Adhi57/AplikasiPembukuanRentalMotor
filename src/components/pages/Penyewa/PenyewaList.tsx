import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Phone, CreditCard, MapPin, Plus, Search, FileSpreadsheet, FileText, CheckCircle, FolderOpen, X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Table from "../../ui/Table";
import Button from "../../ui/Button";

interface Penyewa {
  penyewa_id: number;
  nama: string;
  no_hp: string;
  no_ktp: string;
  alamat: string;
}

export default function PenyewaList() {
  const [penyewa, setPenyewa] = useState<Penyewa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ show: boolean; message: string; filePath: string; folderPath: string }>({
    show: false,
    message: "",
    filePath: "",
    folderPath: "",
  });

  useEffect(() => {
    fetchPenyewa();
  }, []);

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast((t) => ({ ...t, show: false })), 8000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  const fetchPenyewa = async () => {
    setLoading(true);
    try {
      const result = await invoke<Penyewa[]>("get_all_penyewa");
      setPenyewa(result);
    } catch (error) {
      console.error("Failed to fetch penyewa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await invoke("delete_penyewa", { id });
        fetchPenyewa();
      } catch (error) {
        console.error("Failed to delete penyewa:", error);
      }
    }
  };

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
      const fileName = `Data_Penyewa_${ts}.xlsx`;
      const rows: any[][] = [];
      rows.push(["Data Penyewa Rental Motor"]);
      rows.push([]);
      rows.push(["No", "Nama", "No. HP", "No. KTP", "Alamat"]);

      filteredPenyewa.forEach((p, idx) => {
        rows.push([idx + 1, p.nama, p.no_hp, p.no_ktp, p.alamat]);
      });

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 5 }, { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 40 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Penyewa");

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
      const fileName = `Data_Penyewa_${ts}.pdf`;
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Data Penyewa Rental Motor", 14, 20);
      doc.setFontSize(10);
      doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);

      const tableRows = filteredPenyewa.map((p, idx) => [
        idx + 1,
        p.nama,
        p.no_hp,
        p.no_ktp,
        p.alamat,
      ]);

      autoTable(doc, {
        startY: 32,
        head: [["No", "Nama", "No. HP", "No. KTP", "Alamat"]],
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

  const filteredPenyewa = penyewa.filter((p) =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.no_ktp.includes(searchTerm)
  );

  const columns = [
    {
      header: "Nama Penyewa",
      accessor: "nama" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-200">{value}</span>
        </div>
      ),
    },
    {
      header: "Kontak",
      accessor: "no_hp" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <Phone size={14} className="text-slate-200" />
          {value}
        </div>
      ),
    },
    {
      header: "No. KTP",
      accessor: "no_ktp" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <CreditCard size={14} className="text-slate-200" />
          {value}
        </div>
      ),
    },
    {
      header: "Alamat",
      accessor: "alamat" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-slate-200 max-w-xs truncate">
          <MapPin size={14} className="text-slate-200 flex-shrink-0" />
          <span className="truncate" title={value}>{value}</span>
        </div>
      ),
    },
    {
      header: "Aksi",
      accessor: "penyewa_id" as keyof Penyewa,
      align: "center" as const,
      width: "80px",
      render: (_value: any, row: Penyewa) => (
        <div className="flex justify-center gap-2">
          <Button
            label="Edit"
            href={`/penyewa/edit/${row.penyewa_id}`}
            className="px-2 py-1 text-xs rounded hover:bg-blue-900 text-blue-300 border border-blue-800"
            title="Edit"
          />
          <Button
            label="Hapus"
            onClick={() => handleDelete(row.penyewa_id)}
            className="bg-red-800 px-2 py-1 text-xs rounded hover:bg-red-900 text-red-300 border border-red-800"
            title="Hapus"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-700 overflow-hidden">
      {/* Header & Search */}
      <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Daftar Penyewa</h2>
          <p className="text-sm text-slate-400">Total {penyewa.length} pelanggan terdaftar</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau KTP..."
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
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
              href="/penyewa/tambah"
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <Table
        data={filteredPenyewa}
        columns={columns}
        loading={loading}
        emptyMessage="Data penyewa tidak ditemukan."
      />

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
  );
}