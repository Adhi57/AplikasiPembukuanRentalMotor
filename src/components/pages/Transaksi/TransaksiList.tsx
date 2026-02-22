import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Plus, Search, Image, X, Tag, FileSpreadsheet, FileText, CheckCircle, FolderOpen } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { Transaksi } from "../../../types/transaksi.type";
import { Motor } from "@/types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService } from "../../../services/penyewa.service";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

const STATUS_OPTIONS = [
    { value: "semua", label: "Semua" },
    { value: "dipinjam", label: "Dipinjam" },
    { value: "kembali", label: "Kembali" },
    { value: "terlambat", label: "Terlambat" },
];

export default function TransaksiList() {
    const [transaksi, setTransaksi] = useState<Transaksi[]>([]);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("semua");
    const [loading, setLoading] = useState(true);
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [diskonInfo, setDiskonInfo] = useState<{ aktif: boolean; persen: number; mulai: string; berakhir: string } | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string; filePath: string; folderPath: string }>({
        show: false,
        message: "",
        filePath: "",
        folderPath: "",
    });

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast((t) => ({ ...t, show: false })), 8000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tResult, mResult, pResult] = await Promise.all([
                invoke<Transaksi[]>("get_all_transaksi"),
                getMotor(),
                PenyewaService.getAll()
            ]);
            setTransaksi(tResult.sort((a, b) => b.transaksi_id - a.transaksi_id));
            setMotors(mResult);
            setPenyewas(pResult);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }

        // Fetch discount settings
        try {
            const [dPersen, dMulai, dBerakhir, dAktif] = await Promise.all([
                invoke<string>("get_pengaturan", { key: "diskon_persen" }).catch(() => "0"),
                invoke<string>("get_pengaturan", { key: "diskon_tanggal_mulai" }).catch(() => ""),
                invoke<string>("get_pengaturan", { key: "diskon_tanggal_berakhir" }).catch(() => ""),
                invoke<string>("get_pengaturan", { key: "diskon_aktif" }).catch(() => "0"),
            ]);
            setDiskonInfo({
                aktif: dAktif === "1",
                persen: Number(dPersen) || 0,
                mulai: dMulai || "",
                berakhir: dBerakhir || "",
            });
        } catch (err) {
            console.error("Failed to fetch discount info:", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        try {
            await invoke("delete_transaksi", { id });
            fetchData();
        } catch (err) {
            console.error("Failed to delete transaksi:", err);
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
            const fileName = `Daftar_Transaksi_${ts}.xlsx`;
            const rows: any[][] = [];
            rows.push(["Laporan Daftar Transaksi"]);
            rows.push([]);
            rows.push(["No", "ID", "Penyewa", "Motor", "Tgl Sewa", "Rencana Kembali", "Kembali Aktual", "Terlambat", "Total Bayar", "Diskon", "Denda", "Status"]);

            filteredTransaksi.forEach((t, idx) => {
                rows.push([
                    idx + 1,
                    t.transaksi_id,
                    getPenyewaName(t.penyewa_id),
                    getMotorName(t.motor_id),
                    t.tanggal_sewa,
                    t.tanggal_kembali_rencana,
                    t.tanggal_kembali_aktual || "-",
                    t.hari_terlambat || 0,
                    t.total_bayar,
                    t.diskon || 0,
                    t.denda || 0,
                    t.status
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws["!cols"] = [{ wch: 5 }, { wch: 5 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

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
            const fileName = `Daftar_Transaksi_${ts}.pdf`;
            const doc = new jsPDF({ orientation: "landscape" });

            doc.setFontSize(16);
            doc.text("Laporan Daftar Transaksi", 14, 20);
            doc.setFontSize(10);
            doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);

            const tableRows = filteredTransaksi.map((t, idx) => [
                idx + 1,
                t.transaksi_id,
                getPenyewaName(t.penyewa_id),
                getMotorName(t.motor_id),
                t.tanggal_sewa,
                t.tanggal_kembali_rencana,
                t.tanggal_kembali_aktual || "-",
                t.total_bayar ? t.total_bayar.toLocaleString("id-ID") : "0",
                t.diskon ? t.diskon.toLocaleString("id-ID") : "0",
                t.status
            ]);

            autoTable(doc, {
                startY: 32,
                head: [["No", "ID", "Penyewa", "Motor", "Tgl Sewa", "Rencana", "Aktual", "Total", "Diskon", "Status"]],
                body: tableRows,
                styles: { fontSize: 8 },
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

    const getMotorName = (id: number) => {
        const motor = motors.find(m => m.motor_id === id);
        return motor ? `${motor.nama} (${motor.plat})` : `ID: ${id}`;
    };

    const getPenyewaName = (id: number) => {
        const penyewa = penyewas.find(p => p.penyewa_id === id);
        return penyewa ? penyewa.nama : `ID: ${id}`;
    };

    const statusBadge = (status: string) => {
        const base = "px-2 py-1 rounded text-xs font-semibold";
        const map: Record<string, string> = {
            dipinjam: "bg-blue-900 text-blue-200",
            terlambat: "bg-red-900 text-red-200",
            kembali: "bg-green-900 text-green-200",
        };

        return (
            <span className={`${base} ${map[status] ?? "bg-slate-700 text-slate-200"}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount == null) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Filter by status + search
    const filteredTransaksi = transaksi.filter((t) => {
        // Status filter
        if (statusFilter !== "semua" && t.status !== statusFilter) return false;

        // Search filter
        const motorName = getMotorName(t.motor_id).toLowerCase();
        const penyewaName = getPenyewaName(t.penyewa_id).toLowerCase();
        const search = searchTerm.toLowerCase();

        return motorName.includes(search) ||
            penyewaName.includes(search) ||
            t.status.toLowerCase().includes(search) ||
            t.tanggal_sewa.includes(search);
    });

    // Count per status for filter badges
    const statusCounts = {
        semua: transaksi.length,
        dipinjam: transaksi.filter(t => t.status === "dipinjam").length,
        kembali: transaksi.filter(t => t.status === "kembali").length,
        terlambat: transaksi.filter(t => t.status === "terlambat").length,
    };

    const columns = [
        {
            header: "ID",
            accessor: "transaksi_id" as const,
            width: "50px",
        },
        {
            header: "Penyewa",
            accessor: "penyewa_id" as const,
            render: (value: number) => getPenyewaName(value),
        },
        {
            header: "Motor",
            accessor: "motor_id" as const,
            render: (value: number) => getMotorName(value),
        },
        {
            header: "Tgl Sewa",
            accessor: "tanggal_sewa" as const,
        },
        {
            header: "Rencana Kembali",
            accessor: "tanggal_kembali_rencana" as const,
        },
        {
            header: "Kembali Aktual",
            accessor: "tanggal_kembali_aktual" as const,
            render: (value: string | null) => value || "-",
        },
        {
            header: "Terlambat",
            accessor: "hari_terlambat" as const,
            render: (value: number | null) => value != null && value > 0 ? (
                <span className="text-red-400 font-semibold">{value} Hari</span>
            ) : "-",
        },
        {
            header: "Total Bayar",
            accessor: "total_bayar" as const,
            render: (value: number | null) => formatCurrency(value),
        },
        {
            header: "Diskon",
            accessor: "diskon" as const,
            render: (value: number | null) => value != null && value > 0 ? (
                <span className="text-purple-400 font-semibold">{formatCurrency(value)}</span>
            ) : "-",
        },
        {
            header: "Denda",
            accessor: "denda" as const,
            render: (value: number | null) => value != null && value > 0 ? (
                <span className="text-red-400 font-semibold">{formatCurrency(value)}</span>
            ) : "-",
        },
        {
            header: "Status",
            accessor: "status" as const,
            render: (value: string) => statusBadge(value),
        },
        {
            header: "Aksi",
            accessor: "transaksi_id" as const,
            align: "center" as const,
            width: "180px",
            render: (_: any, row: Transaksi) => (
                <div className="flex justify-center gap-2">
                    {row.foto_bukti && (
                        <button
                            onClick={() => setModalImage(convertFileSrc(row.foto_bukti!))}
                            className="px-2 py-1 text-xs rounded hover:bg-purple-900 text-purple-300 border border-purple-800 flex items-center gap-1"
                            title="Lihat Bukti"
                        >
                            <Image size={12} /> Bukti
                        </button>
                    )}
                    <Button
                        label="Edit"
                        href={`/transaksi/edit/${row.transaksi_id}`}
                        className="px-2 py-1 text-xs rounded hover:bg-blue-900 text-blue-300 border border-blue-800"
                    />
                    <Button
                        label="Hapus"
                        onClick={() => handleDelete(row.transaksi_id)}
                        className="bg-red-800 px-2 py-1 text-xs rounded hover:bg-red-900 text-red-300 border border-red-800"
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-100">
                        Daftar Transaksi
                    </h2>
                    <p className="text-sm text-slate-400">
                        Total {transaksi.length} transaksi
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                            type="text"
                            placeholder="Cari penyewa, motor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
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
                        </div>
                        <Button
                            label="Tambah"
                            icon={<Plus size={16} />}
                            href="/transaksi/tambah"
                        />
                    </div>
                </div>
            </div>

            {/* Discount Info Banner */}
            {diskonInfo && diskonInfo.aktif && diskonInfo.persen > 0 && diskonInfo.mulai && diskonInfo.berakhir && (() => {
                const info = diskonInfo; // Local copy for type narrowing
                const today = new Date().toISOString().split('T')[0];
                const isActive = today >= info.mulai && today <= info.berakhir;
                if (!isActive) return null;
                return (
                    <div className="mx-5 mb-3 flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Tag size={18} className="text-purple-400" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-purple-300">
                                Diskon {info.persen}% Sedang Berlaku!
                            </p>
                            <p className="text-xs text-purple-400/70">
                                Periode: {info.mulai} s/d {info.berakhir}
                            </p>
                        </div>
                        <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold rounded-full">
                            AKTIF
                        </span>
                    </div>
                );
            })()}

            {/* Status Filter Tabs */}
            <div className="px-5 pb-3 flex gap-2 flex-wrap">
                {STATUS_OPTIONS.map((opt) => {
                    const count = statusCounts[opt.value as keyof typeof statusCounts];
                    const isActive = statusFilter === opt.value;
                    return (
                        <button
                            key={opt.value}
                            onClick={() => setStatusFilter(opt.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${isActive
                                ? opt.value === "terlambat"
                                    ? "bg-red-500/20 text-red-300 border border-red-500/50"
                                    : opt.value === "dipinjam"
                                        ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                                        : opt.value === "kembali"
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                                            : "bg-slate-600 text-slate-200 border border-slate-500"
                                : "bg-slate-700/50 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-slate-200"
                                }`}
                        >
                            {opt.label}
                            <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/10" : "bg-slate-600"
                                }`}>
                                {count}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="overflow-x-auto">
                <Table
                    data={filteredTransaksi}
                    columns={columns}
                    loading={loading}
                    emptyMessage="Data transaksi tidak ditemukan."
                />
            </div>

            {/* Image Modal */}
            {
                modalImage && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                        onClick={() => setModalImage(null)}
                    >
                        <div
                            className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-700">
                                <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                                    <Image size={18} className="text-purple-400" /> Bukti Peminjaman
                                </h3>
                                <button
                                    onClick={() => setModalImage(null)}
                                    className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 flex items-center justify-center">
                                <img
                                    src={modalImage}
                                    alt="Bukti Peminjaman"
                                    className="max-w-full max-h-[70vh] object-contain rounded-lg"
                                />
                            </div>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
}
