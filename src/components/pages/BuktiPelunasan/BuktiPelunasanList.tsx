import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";
import { Plus, Search, Calendar, User, Receipt, FileSpreadsheet, FileText, CheckCircle, FolderOpen, X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { Transaksi } from "../../../types/transaksi.type";
import { Penyewa } from "../../../types/penyewa.type";
import { PenyewaService, TransaksiService } from "../../../services/penyewa.service";

import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

const METODE_OPTIONS = [
    { value: "semua", label: "Semua Metode" },
    { value: "tunai", label: "Tunai" },
    { value: "transfer", label: "Transfer" },
    { value: "ewallet", label: "E-Wallet" },
];

export default function BuktiPelunasanList() {
    const [buktiList, setBuktiList] = useState<BuktiPelunasan[]>([]);
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
    const [penyewaList, setPenyewaList] = useState<Penyewa[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [metodeFilter, setMetodeFilter] = useState("semua");
    const [bulanFilter, setBulanFilter] = useState("");
    const [loading, setLoading] = useState(true);
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
            const [b, t, p] = await Promise.all([
                invoke<BuktiPelunasan[]>("get_all_bukti_pelunasan"),
                TransaksiService.getAll(),
                PenyewaService.getAll(),
            ]);
            setBuktiList(b.sort((a, b) => b.bukti_id - a.bukti_id));
            setTransaksiList(t);
            setPenyewaList(p);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getTransaksi = (transaksiId: number) => {
        return transaksiList.find((t) => t.transaksi_id === transaksiId) || null;
    };

    const getPenyewaName = (transaksiId: number) => {
        const trx = getTransaksi(transaksiId);
        if (!trx) return "-";
        const penyewa = penyewaList.find((p) => p.penyewa_id === trx.penyewa_id);
        return penyewa ? penyewa.nama : `Penyewa #${trx.penyewa_id}`;
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;

        try {
            await invoke("delete_bukti_pelunasan", { id });
            fetchData();
        } catch (err) {
            console.error("Failed to delete bukti_pelunasan:", err);
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
            const fileName = `Bukti_Pelunasan_${ts}.xlsx`;
            const rows: any[][] = [];
            rows.push(["Laporan Bukti Pelunasan"]);
            rows.push([]);
            rows.push(["No", "ID", "Trx ID", "Penyewa", "Tgl Bayar", "Wajib Bayar", "Jumlah Bayar", "Kurang", "Metode"]);

            filteredBukti.forEach((b, idx) => {
                const wajib = getTotalBayarWajib(b.transaksi_id);
                const kurang = getKurang(b);
                rows.push([
                    idx + 1,
                    b.bukti_id,
                    b.transaksi_id,
                    getPenyewaName(b.transaksi_id),
                    b.tanggal_bayar,
                    wajib,
                    b.jumlah_bayar,
                    kurang > 0 ? kurang : 0,
                    b.metode_bayar
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws["!cols"] = [{ wch: 5 }, { wch: 5 }, { wch: 8 }, { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "BuktiPelunasan");

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
            const fileName = `Bukti_Pelunasan_${ts}.pdf`;
            const doc = new jsPDF({ orientation: "landscape" });

            doc.setFontSize(16);
            doc.text("Laporan Bukti Pelunasan", 14, 20);
            doc.setFontSize(10);
            doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);

            const tableRows = filteredBukti.map((b, idx) => {
                const wajib = getTotalBayarWajib(b.transaksi_id);
                const kurang = getKurang(b);
                return [
                    idx + 1,
                    b.bukti_id,
                    b.transaksi_id,
                    getPenyewaName(b.transaksi_id),
                    b.tanggal_bayar,
                    wajib.toLocaleString("id-ID"),
                    b.jumlah_bayar.toLocaleString("id-ID"),
                    (kurang > 0 ? kurang : 0).toLocaleString("id-ID"),
                    b.metode_bayar
                ];
            });

            autoTable(doc, {
                startY: 32,
                head: [["No", "ID", "Trx ID", "Penyewa", "Tgl Bayar", "Wajib", "Bayar", "Kurang", "Metode"]],
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

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount == null) return "-";
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const metodeBadge = (metode: string) => {
        const base = "px-2 py-1 rounded text-xs font-semibold";
        const map: Record<string, string> = {
            tunai: "bg-green-900 text-green-200",
            transfer: "bg-blue-900 text-blue-200",
            ewallet: "bg-purple-900 text-purple-200",
            qris: "bg-purple-900 text-purple-200",
        };

        return (
            <span className={`${base} ${map[metode.toLowerCase()] ?? "bg-slate-700 text-slate-200"}`}>
                {metode.charAt(0).toUpperCase() + metode.slice(1)}
            </span>
        );
    };


    const getTotalBayarWajib = (transaksiId: number) => {
        const trx = getTransaksi(transaksiId);
        return (trx?.total_bayar ?? 0) + (trx?.denda ?? 0);
    };

    const getKurang = (bukti: BuktiPelunasan) => {
        const totalWajib = getTotalBayarWajib(bukti.transaksi_id);
        return totalWajib - bukti.jumlah_bayar;
    };

    const statusLunasBadge = (bukti: BuktiPelunasan) => {
        const kurang = getKurang(bukti);
        if (kurang <= 0) {
            return (
                <span className="px-2 py-1 rounded text-xs font-semibold bg-green-900 text-green-200">
                    Lunas
                </span>
            );
        }
        return (
            <span className="px-2 py-1 rounded text-xs font-semibold bg-red-900 text-red-200">
                Belum Lunas
            </span>
        );
    };

    // Filter logic
    const filteredBukti = buktiList.filter((b) => {
        // Metode filter
        if (metodeFilter !== "semua") {
            const method = b.metode_bayar.toLowerCase();
            if (metodeFilter === "ewallet") {
                if (method !== "ewallet" && method !== "qris") return false;
            } else if (method !== metodeFilter) {
                return false;
            }
        }

        // Bulan filter (format: "YYYY-MM")
        if (bulanFilter && !b.tanggal_bayar.startsWith(bulanFilter)) return false;

        // Search
        const search = searchTerm.toLowerCase();
        if (search) {
            const penyewaName = getPenyewaName(b.transaksi_id).toLowerCase();
            return (
                b.tanggal_bayar.includes(search) ||
                b.metode_bayar.toLowerCase().includes(search) ||
                String(b.transaksi_id).includes(search) ||
                String(b.jumlah_bayar).includes(search) ||
                penyewaName.includes(search)
            );
        }

        return true;
    });

    // Counts for metode tabs
    const metodeCounts = {
        semua: buktiList.length,
        tunai: buktiList.filter(b => b.metode_bayar.toLowerCase() === "tunai").length,
        transfer: buktiList.filter(b => b.metode_bayar.toLowerCase() === "transfer").length,
        ewallet: buktiList.filter(b => {
            const method = b.metode_bayar.toLowerCase();
            return method === "ewallet" || method === "qris";
        }).length,
    };

    // Total jumlah for filtered results
    const totalFiltered = filteredBukti.reduce((sum, b) => sum + b.jumlah_bayar, 0);

    const columns = [
        {
            header: "ID",
            accessor: "bukti_id" as const,
            width: "50px",
        },
        {
            header: "Transaksi ID",
            accessor: "transaksi_id" as const,
            render: (value: number) => (
                <div className="flex items-center gap-1.5 text-slate-400">
                    <Receipt size={14} />
                    <span>#{value}</span>
                </div>
            )
        },
        {
            header: "Penyewa",
            accessor: "transaksi_id" as const, // We use transaksi_id to lookup penyewa
            render: (transaksiId: number) => {
                const name = getPenyewaName(transaksiId);
                return (
                    <div className="flex items-center gap-2 font-medium text-slate-200">
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-400">
                            <User size={12} />
                        </div>
                        {name}
                    </div>
                );
            }
        },
        {
            header: "Tanggal Bayar",
            accessor: "tanggal_bayar" as const,
        },
        {
            header: "Total Bayar",
            accessor: "transaksi_id" as const,
            render: (transaksiId: number) => (
                <span className="text-amber-400 font-medium">{formatCurrency(getTotalBayarWajib(transaksiId))}</span>
            ),
        },
        {
            header: "Jumlah Bayar",
            accessor: "jumlah_bayar" as const,
            render: (value: number) => (
                <span className="text-emerald-400 font-medium">{formatCurrency(value)}</span>
            ),
        },
        {
            header: "Kurang",
            accessor: "bukti_id" as const,
            render: (_: any, row: BuktiPelunasan) => {
                const kurang = getKurang(row);
                return (
                    <span className={`font-medium ${kurang > 0 ? "text-red-400" : "text-green-400"}`}>
                        {formatCurrency(kurang > 0 ? kurang : 0)}
                    </span>
                );
            },
        },
        {
            header: "Metode Bayar",
            accessor: "metode_bayar" as const,
            render: (value: string) => metodeBadge(value),
        },
        {
            header: "Status",
            accessor: "bukti_id" as const,
            render: (_: any, row: BuktiPelunasan) => statusLunasBadge(row),
        },
        {
            header: "Detail",
            accessor: "bukti_id" as const,
            render: (_: any, row: BuktiPelunasan) => (
                <Link
                    to={`/bukti_pelunasan/lihat/${row.bukti_id}`}
                    className="text-blue-400 hover:underline text-xs"
                >
                    Lihat
                </Link>
            ),
        },
        {
            header: "Aksi",
            accessor: "bukti_id" as const,
            align: "center" as const,
            width: "120px",
            render: (_: any, row: BuktiPelunasan) => (
                <div className="flex justify-center gap-2">
                    <Button
                        label="Edit"
                        href={`/bukti_pelunasan/edit/${row.bukti_id}`}
                        className="px-2 py-1 text-xs rounded hover:bg-blue-900 text-blue-300 border border-blue-800"
                    />
                    <Button
                        label="Hapus"
                        onClick={() => handleDelete(row.bukti_id)}
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
                        Daftar Bukti Pelunasan
                    </h2>
                    <p className="text-sm text-slate-400">
                        Total {buktiList.length} bukti pelunasan
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
                            placeholder="Cari tanggal, metode, ID..."
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
                            href="/bukti_pelunasan/tambah"
                        />
                    </div>
                </div>
            </div>

            {/* Filter Row */}
            <div className="px-5 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Metode Filter Tabs */}
                <div className="flex gap-2 flex-wrap">
                    {METODE_OPTIONS.map((opt) => {
                        const count = metodeCounts[opt.value as keyof typeof metodeCounts];
                        const isActive = metodeFilter === opt.value;
                        return (
                            <button
                                key={opt.value}
                                onClick={() => setMetodeFilter(opt.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${isActive
                                    ? opt.value === "tunai"
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50"
                                        : opt.value === "transfer"
                                            ? "bg-blue-500/20 text-blue-300 border border-blue-500/50"
                                            : opt.value === "ewallet"
                                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
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

                {/* Month Filter + Summary */}
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="month"
                            value={bulanFilter}
                            onChange={(e) => setBulanFilter(e.target.value)}
                            className="pl-10 pr-4 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {bulanFilter && (
                        <button
                            onClick={() => setBulanFilter("")}
                            className="text-xs text-slate-400 hover:text-slate-200 underline"
                        >
                            Reset
                        </button>
                    )}
                    <div className="text-sm text-slate-400">
                        Ditampilkan: <span className="text-emerald-400 font-semibold">{filteredBukti.length}</span> data
                        — Total: <span className="text-emerald-400 font-semibold">{formatCurrency(totalFiltered)}</span>
                    </div>
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="p-8 text-center text-slate-400">Memuat data...</div>
            ) : (
                <Table data={filteredBukti} columns={columns} />
            )}

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
