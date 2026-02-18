import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar,
    ChevronDown,
    ArrowUpCircle,
    ArrowDownCircle,
    Settings,
    AlertTriangle,
    Filter,
    FileSpreadsheet,
    FileText,
    CheckCircle,
    FolderOpen,
    X,
} from "lucide-react";

import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { PengeluaranRental } from "../../../types/pengeluaran_rental";
import { Transaksi } from "../../../types/transaksi.type";
import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService, TransaksiService } from "../../../services/penyewa.service";

interface KasEntry {
    id: number;
    tanggal: string;
    noRef: string;       // No transaksi / referensi
    customer: string;    // Nama penyewa
    motor: string;       // Nama motor
    metode: string;      // Metode bayar
    keterangan: string;
    tipe: "masuk" | "keluar";
    jumlah: number;
}

export default function KasList() {
    const [buktiList, setBuktiList] = useState<BuktiPelunasan[]>([]);
    const [pengeluaranList, setPengeluaranList] = useState<PengeluaranRental[]>([]);
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState<string>("");
    const [selectedAkun, setSelectedAkun] = useState<string>(""); // filter akun
    const [toast, setToast] = useState<{ show: boolean; message: string; filePath: string; folderPath: string }>({
        show: false,
        message: "",
        filePath: "",
        folderPath: "",
    });

    // Saldo Awal
    const [saldoAwal, setSaldoAwal] = useState<number>(0);

    const navigate = useNavigate();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [b, p, t, m, py, saldo] = await Promise.all([
                invoke<BuktiPelunasan[]>("get_all_bukti_pelunasan"),
                invoke<PengeluaranRental[]>("get_all_pengeluaran_rental"),
                TransaksiService.getAll(),
                getMotor(),
                PenyewaService.getAll(),
                invoke<string>("get_pengaturan", { key: "saldo_awal" }),
            ]);
            setBuktiList(b);
            setPengeluaranList(p);
            setTransaksiList(t);
            setMotors(m);
            setPenyewas(py);
            setSaldoAwal(saldo ? parseInt(saldo) || 0 : 0);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const getMotorName = (id: number) => {
        const motor = motors.find((m) => m.motor_id === id);
        return motor ? `${motor.nama} (${motor.plat})` : `Motor #${id}`;
    };

    const getPenyewaName = (id: number) => {
        const penyewa = penyewas.find((p) => p.penyewa_id === id);
        return penyewa ? penyewa.nama : `Penyewa #${id}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const getMonthLabel = (ym: string) => {
        try {
            const [y, m] = ym.split("-");
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        } catch {
            return ym;
        }
    };

    // Normalize metode to akun category
    const getAkunCategory = (metode: string): string => {
        const m = metode?.toLowerCase() || "";
        if (m.includes("transfer") || m.includes("bank")) return "Bank";
        if (m.includes("ewallet") || m.includes("e-wallet") || m.includes("dana") || m.includes("ovo") || m.includes("gopay") || m.includes("shopeepay")) return "E-Wallet";
        return "Kas";
    };

    // Build unified kas entries with full reference info
    const allEntries: KasEntry[] = [
        ...buktiList.map((b) => {
            const trx = transaksiList.find((t) => t.transaksi_id === b.transaksi_id);
            return {
                id: b.bukti_id,
                tanggal: b.tanggal_bayar,
                noRef: `TRX-${String(b.transaksi_id).padStart(4, "0")}`,
                customer: trx ? getPenyewaName(trx.penyewa_id) : "-",
                motor: trx ? getMotorName(trx.motor_id) : "-",
                metode: b.metode_bayar || "Kas",
                keterangan: `Pelunasan Transaksi #${b.transaksi_id}`,
                tipe: "masuk" as const,
                jumlah: b.jumlah_bayar + (trx && trx.denda ? trx.denda : 0),
            };
        }),
        ...pengeluaranList.map((p) => ({
            id: p.pengeluaran_id + 100000,
            tanggal: p.tanggal,
            noRef: `PGL-${String(p.pengeluaran_id).padStart(4, "0")}`,
            customer: "-",
            motor: "-",
            metode: "Kas",
            keterangan: `${p.jenis}${p.keterangan ? " — " + p.keterangan : ""}`,
            tipe: "keluar" as const,
            jumlah: p.nominal,
        })),
    ];

    // Filter by month
    const monthFiltered = allEntries.filter((e) => {
        if (!selectedMonth) return true;
        return e.tanggal?.slice(0, 7) === selectedMonth;
    });

    // Filter by akun
    const filtered = monthFiltered.filter((e) => {
        if (!selectedAkun) return true;
        return getAkunCategory(e.metode) === selectedAkun;
    });

    // Sort descending (newest first) — this is the display order
    const sorted = [...filtered].sort((a, b) => b.tanggal.localeCompare(a.tanggal));

    // Calculate totals
    const totalMasuk = filtered.filter((e) => e.tipe === "masuk").reduce((s, e) => s + e.jumlah, 0);
    const totalKeluar = filtered.filter((e) => e.tipe === "keluar").reduce((s, e) => s + e.jumlah, 0);
    const saldoAkhir = saldoAwal + totalMasuk - totalKeluar;

    // Check for saldo minus
    const hasSaldoMinus = saldoAkhir < 0;

    // Available months
    const availableMonths = [
        ...new Set(allEntries.map((e) => e.tanggal?.slice(0, 7)).filter(Boolean)),
    ].sort((a, b) => b.localeCompare(a));

    // Running balance — calculated in DESCENDING order so it reads correctly top-to-bottom
    // Top row = newest = final saldo, each row below = saldo before that transaction
    const entriesWithBalance = (() => {
        // Calculate running saldo descending:
        // Start from saldoAkhir (top), and work backwards
        let runSaldo = saldoAkhir;
        return sorted.map((e) => {
            const currentSaldo = runSaldo;
            // Reverse the effect: going backwards means we undo each entry
            runSaldo -= e.tipe === "masuk" ? e.jumlah : -e.jumlah;
            return { ...e, saldo: currentSaldo };
        });
    })();

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast((t) => ({ ...t, show: false })), 8000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const handleOpenFolder = async () => {
        try {
            await invoke("open_folder", { path: toast.folderPath });
        } catch (err) {
            console.error("Failed to open folder:", err);
        }
    };

    const getTimestamp = () => {
        const now = new Date();
        return `${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
    };

    const formatPlainCurrency = (amount: number) => {
        return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount);
    };

    const getFilterLabel = () => {
        const parts: string[] = [];
        if (selectedMonth) parts.push(getMonthLabel(selectedMonth));
        if (selectedAkun) parts.push(`Akun: ${selectedAkun}`);
        return parts.length > 0 ? parts.join(" | ") : "Semua Data";
    };

    // ======== EXPORT EXCEL ========
    const handleExportExcel = async () => {
        try {
            const fileName = `Buku_Kas_${getTimestamp()}.xlsx`;
            const rows: any[][] = [];

            // Title & Filter Info
            rows.push(["LAPORAN BUKU KAS"]);
            rows.push([`Filter: ${getFilterLabel()}`]);
            rows.push([]);

            // Summary Info
            rows.push(["Saldo Awal", saldoAwal]);
            rows.push(["Total Masuk", totalMasuk]);
            rows.push(["Total Keluar", totalKeluar]);
            rows.push(["Saldo Akhir", saldoAkhir]);
            rows.push([]);

            // Header
            rows.push(["Tanggal", "No. Ref", "Customer", "Motor", "Keterangan", "Metode", "Tipe", "Masuk", "Keluar", "Saldo"]);

            // Data
            entriesWithBalance.forEach((e) => {
                rows.push([
                    e.tanggal?.slice(0, 10) || "-",
                    e.noRef,
                    e.customer,
                    e.motor,
                    e.keterangan,
                    e.metode,
                    e.tipe === "masuk" ? "Masuk" : "Keluar",
                    e.tipe === "masuk" ? e.jumlah : 0,
                    e.tipe === "keluar" ? e.jumlah : 0,
                    e.saldo,
                ]);
            });

            // Add Init Row at bottom if applies
            if (saldoAwal > 0) {
                rows.push(["-", "INIT", "-", "-", "Saldo Awal", "-", "Saldo", saldoAwal, 0, saldoAwal]);
            }

            // Total Row
            rows.push(["", "", "", "", "", "", "TOTAL", totalMasuk, totalKeluar, saldoAkhir]);

            const ws = XLSX.utils.aoa_to_sheet(rows);

            // Set column widths
            ws["!cols"] = [
                { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 30 },
                { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
            ];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Buku Kas");

            const wbOut = XLSX.write(wb, { bookType: "xlsx", type: "array" });
            const data = Array.from(new Uint8Array(wbOut));

            const savedPath: string = await invoke("save_file", { fileName, data });
            const folderPath = savedPath.substring(0, savedPath.lastIndexOf("\\"));

            setToast({
                show: true,
                message: fileName,
                filePath: savedPath,
                folderPath,
            });
        } catch (err) {
            console.error("Export Excel failed:", err);
            alert(`Gagal export Excel: ${err}`);
        }
    };

    // ======== EXPORT PDF ========
    const handleExportPDF = async () => {
        try {
            const fileName = `Buku_Kas_${getTimestamp()}.pdf`;
            const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

            // Title
            doc.setFontSize(16);
            doc.text("LAPORAN BUKU KAS", 14, 15);

            // Subtitle
            doc.setFontSize(9);
            doc.setTextColor(100);
            doc.text(`Filter: ${getFilterLabel()}`, 14, 22);
            doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`, 14, 27);

            // Summary Block
            doc.setFontSize(10);
            doc.setTextColor(0);
            const summaryY = 35;
            doc.text(`Saldo Awal: Rp ${formatPlainCurrency(saldoAwal)}`, 14, summaryY);
            doc.text(`Total Masuk: Rp ${formatPlainCurrency(totalMasuk)}`, 80, summaryY);
            doc.text(`Total Keluar: Rp ${formatPlainCurrency(totalKeluar)}`, 150, summaryY);
            doc.text(`Saldo Akhir: Rp ${formatPlainCurrency(saldoAkhir)}`, 220, summaryY);

            // Table Data
            const tableData = entriesWithBalance.map((e) => [
                e.tanggal?.slice(0, 10) || "-",
                e.noRef,
                e.customer,
                e.motor,
                e.keterangan,
                e.metode,
                e.tipe === "masuk" ? "Masuk" : "Keluar",
                e.tipe === "masuk" ? formatPlainCurrency(e.jumlah) : "-",
                e.tipe === "keluar" ? formatPlainCurrency(e.jumlah) : "-",
                formatPlainCurrency(e.saldo),
            ]);

            // Add saldo awal row
            if (saldoAwal > 0) {
                tableData.push([
                    "-", "INIT", "-", "-", "Saldo Awal", "-", "Saldo",
                    formatPlainCurrency(saldoAwal), "-",
                    formatPlainCurrency(saldoAwal),
                ]);
            }

            // Total Row
            tableData.push([
                "", "", "", "", "", "", "TOTAL",
                formatPlainCurrency(totalMasuk),
                formatPlainCurrency(totalKeluar),
                formatPlainCurrency(saldoAkhir),
            ]);

            autoTable(doc, {
                startY: 42,
                head: [[
                    "Tanggal", "No. Ref", "Customer", "Motor",
                    "Keterangan", "Metode", "Tipe", "Masuk", "Keluar", "Saldo",
                ]],
                body: tableData,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
                columnStyles: {
                    7: { halign: "right" },
                    8: { halign: "right" },
                    9: { halign: "right", fontStyle: "bold" },
                },
                didParseCell: (data) => {
                    const row = data.row.index;
                    // Check if last row (Total)
                    if (row === tableData.length - 1) {
                        data.cell.styles.fontStyle = "bold";
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                },
            });

            const pdfOutput = doc.output("arraybuffer");
            const data = Array.from(new Uint8Array(pdfOutput));

            const savedPath: string = await invoke("save_file", { fileName, data });
            const folderPath = savedPath.substring(0, savedPath.lastIndexOf("\\"));

            setToast({
                show: true,
                message: fileName,
                filePath: savedPath,
                folderPath,
            });
        } catch (err) {
            console.error("Export PDF failed:", err);
            alert(`Gagal export PDF: ${err}`);
        }
    };
    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">Memuat data kas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50" style={{ animation: "slideUp 0.3s ease-out" }}>
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

            {/* Saldo Minus Warning */}
            {hasSaldoMinus && (
                <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
                    <AlertTriangle size={20} className="text-red-400 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-red-300">Peringatan: Saldo Minus!</p>
                        <p className="text-xs text-red-400">Total pengeluaran melebihi pemasukan + saldo awal. Pastikan data sudah benar.</p>
                    </div>
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Saldo Awal */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-500/10 rounded-lg">
                                <Settings size={22} className="text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-400">Saldo Awal</p>
                                <p className="text-xl font-bold text-blue-400">{formatCurrency(saldoAwal)}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate("/pengaturan")}
                            className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-blue-400"
                            title="Edit di Pengaturan"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                </div>

                {/* Pemasukan */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                            <TrendingUp size={22} className="text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Pemasukan</p>
                            <p className="text-xl font-bold text-emerald-400">{formatCurrency(totalMasuk)}</p>
                        </div>
                    </div>
                </div>

                {/* Pengeluaran */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-red-500/10 rounded-lg">
                            <TrendingDown size={22} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Pengeluaran</p>
                            <p className="text-xl font-bold text-red-400">{formatCurrency(totalKeluar)}</p>
                        </div>
                    </div>
                </div>

                {/* Saldo Akhir */}
                <div className={`bg-slate-800 rounded-xl border p-5 ${saldoAkhir >= 0 ? "border-emerald-700/50" : "border-red-700/50"}`}>
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg ${saldoAkhir >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
                            <Wallet size={22} className={saldoAkhir >= 0 ? "text-emerald-400" : "text-red-400"} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Saldo Akhir</p>
                            <p className={`text-xl font-bold ${saldoAkhir >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {formatCurrency(saldoAkhir)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table Card */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">Buku Kas</h2>
                        <p className="text-sm text-slate-400">
                            Riwayat pemasukan dan pengeluaran
                        </p>
                    </div>

                    {/* Filters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Export Buttons */}
                        <div className="flex items-center gap-2 mr-2">
                            <button
                                onClick={handleExportExcel}
                                className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-700 rounded-lg text-sm transition"
                                title="Export Excel"
                            >
                                <FileSpreadsheet size={16} />
                                <span>Excel</span>
                            </button>
                            <button
                                onClick={handleExportPDF}
                                className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-700 rounded-lg text-sm transition"
                                title="Export PDF"
                            >
                                <FileText size={16} />
                                <span>PDF</span>
                            </button>
                        </div>

                        {/* Akun Filter */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-700/40 rounded-lg">
                            <Filter size={16} className="text-purple-400" />
                            <span className="text-sm font-medium text-purple-300">Akun</span>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedAkun}
                                onChange={(e) => setSelectedAkun(e.target.value)}
                                className="appearance-none bg-slate-800 border border-slate-600 hover:border-purple-500/50 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition cursor-pointer"
                            >
                                <option value="">Semua Akun</option>
                                <option value="Kas">💵 Kas (Tunai)</option>
                                <option value="Bank">🏦 Bank (Transfer)</option>
                                <option value="E-Wallet">📱 E-Wallet</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>

                        {/* Month Filter */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-700/40 rounded-lg">
                            <Calendar size={16} className="text-blue-400" />
                            <span className="text-sm font-medium text-blue-300">Bulan</span>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                className="appearance-none bg-slate-800 border border-slate-600 hover:border-blue-500/50 rounded-lg pl-4 pr-10 py-2.5 text-sm font-medium text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition cursor-pointer"
                            >
                                <option value="">📅  Semua Bulan</option>
                                {availableMonths.map((m) => (
                                    <option key={m} value={m}>{getMonthLabel(m)}</option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ChevronDown size={16} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-t border-b border-slate-700 bg-slate-900/50">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">No. Ref</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Motor</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Keterangan</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Metode</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Masuk</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Keluar</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Saldo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {entriesWithBalance.length === 0 && saldoAwal === 0 ? (
                                <tr>
                                    <td colSpan={10} className="px-5 py-8 text-center text-slate-500">
                                        Tidak ada data kas untuk periode ini
                                    </td>
                                </tr>
                            ) : (
                                <>
                                    {entriesWithBalance.map((entry, idx) => {
                                        const isLast = idx === entriesWithBalance.length - 1;
                                        const isSaldoMinus = entry.saldo < 0;
                                        return (
                                            <tr
                                                key={`${entry.tipe}-${entry.id}`}
                                                className={`hover:bg-slate-700/30 transition ${isSaldoMinus ? "bg-red-900/5" : ""}`}
                                            >
                                                <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                                                    {entry.tanggal?.slice(0, 10)}
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                                                    {entry.noRef}
                                                </td>
                                                <td className="px-4 py-3 text-slate-200 whitespace-nowrap">
                                                    {entry.customer !== "-" ? entry.customer : <span className="text-slate-600">-</span>}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300 whitespace-nowrap max-w-[160px] truncate">
                                                    {entry.motor !== "-" ? entry.motor : <span className="text-slate-600">-</span>}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300 max-w-[200px] truncate">
                                                    {entry.keterangan}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-xs font-medium px-2 py-1 rounded ${getAkunCategory(entry.metode) === "Bank"
                                                        ? "bg-sky-900/40 text-sky-300"
                                                        : getAkunCategory(entry.metode) === "E-Wallet"
                                                            ? "bg-violet-900/40 text-violet-300"
                                                            : "bg-slate-700/50 text-slate-300"
                                                        }`}>
                                                        {entry.metode}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {entry.tipe === "masuk" ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                                                            <ArrowUpCircle size={12} /> Masuk
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-red-900/50 text-red-300 border border-red-700/50">
                                                            <ArrowDownCircle size={12} /> Keluar
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-emerald-400">
                                                    {entry.tipe === "masuk" ? formatCurrency(entry.jumlah) : "-"}
                                                </td>
                                                <td className="px-4 py-3 text-right font-medium text-red-400">
                                                    {entry.tipe === "keluar" ? formatCurrency(entry.jumlah) : "-"}
                                                </td>
                                                <td className={`px-4 py-3 text-right font-medium ${isSaldoMinus
                                                    ? "text-red-400 font-bold"
                                                    : isLast
                                                        ? "text-slate-300"
                                                        : "text-slate-400"
                                                    }`}>
                                                    {formatCurrency(entry.saldo)}
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Saldo Awal row at the bottom (oldest) */}
                                    {saldoAwal > 0 && (
                                        <tr className="bg-blue-900/10">
                                            <td className="px-4 py-3 text-slate-500">—</td>
                                            <td className="px-4 py-3 text-blue-400 font-mono text-xs">INIT</td>
                                            <td className="px-4 py-3 text-slate-500">-</td>
                                            <td className="px-4 py-3 text-slate-500">-</td>
                                            <td className="px-4 py-3 text-blue-300 font-medium">Saldo Awal</td>
                                            <td className="px-4 py-3 text-slate-500">-</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-blue-900/50 text-blue-300 border border-blue-700/50">
                                                    <Wallet size={12} /> Saldo
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium text-blue-400">{formatCurrency(saldoAwal)}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">-</td>
                                            <td className="px-4 py-3 text-right font-medium text-blue-400">{formatCurrency(saldoAwal)}</td>
                                        </tr>
                                    )}
                                </>
                            )}
                        </tbody>
                        {(entriesWithBalance.length > 0 || saldoAwal > 0) && (
                            <tfoot>
                                <tr className="border-t-2 border-slate-600 bg-slate-900/50">
                                    <td colSpan={7} className="px-4 py-3 text-sm font-bold text-slate-200">
                                        TOTAL
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                                        {formatCurrency(totalMasuk)}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold text-red-400">
                                        {formatCurrency(totalKeluar)}
                                    </td>
                                    <td className={`px-4 py-3 text-right font-bold ${saldoAkhir >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                        {formatCurrency(saldoAkhir)}
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
