import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    Calendar,
    TrendingUp,
    TrendingDown,
    DollarSign,
    FileText,
    FileSpreadsheet,
    CheckCircle,
    FolderOpen,
    X,
} from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { PengeluaranRental } from "../../../types/pengeluaran_rental";
import { Transaksi } from "../../../types/transaksi.type";
import { TransaksiService } from "../../../services/penyewa.service";

import Button from "@/components/ui/Button";

export default function LaporanBulanan() {
    const [loading, setLoading] = useState(true);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

    // Data states
    const [buktiList, setBuktiList] = useState<BuktiPelunasan[]>([]);
    const [pengeluaranList, setPengeluaranList] = useState<PengeluaranRental[]>([]);
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);

    // Toast state
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
            const [b, p, t] = await Promise.all([
                invoke<BuktiPelunasan[]>("get_all_bukti_pelunasan"),
                invoke<PengeluaranRental[]>("get_all_pengeluaran_rental"),
                TransaksiService.getAll(),
            ]);
            setBuktiList(b);
            setPengeluaranList(p);
            setTransaksiList(t);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    // Helper functions
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(val);
    };

    const formatPlainCurrency = (val: number) => {
        return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val);
    };

    const getMonthLabel = (ym: string) => {
        if (!ym) return "Semua Bulan";
        const [y, m] = ym.split("-");
        const date = new Date(parseInt(y), parseInt(m) - 1, 1);
        return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    };

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

    // Check if month matches
    const isSameMonth = (dateStr: string, filterYM: string) => {
        return dateStr.startsWith(filterYM);
    };

    // Calculate Data for Selected Month
    const filteredBukti = buktiList.filter(b => isSameMonth(b.tanggal_bayar, selectedMonth));
    const filteredPengeluaran = pengeluaranList.filter(p => isSameMonth(p.tanggal, selectedMonth));

    // Calculate Totals
    const totalMasuk = filteredBukti.reduce((sum, b) => {
        const trx = transaksiList.find(t => t.transaksi_id === b.transaksi_id);
        const denda = trx?.denda || 0;
        return sum + b.jumlah_bayar + denda;
    }, 0);

    const totalKeluar = filteredPengeluaran.reduce((sum, p) => sum + p.nominal, 0);
    const labaBersih = totalMasuk - totalKeluar;

    // Daily Breakdown
    const getDailyData = () => {
        const days = new Map<string, { masuk: number; keluar: number }>();

        // Process Income
        filteredBukti.forEach(b => {
            const date = b.tanggal_bayar;
            if (!days.has(date)) days.set(date, { masuk: 0, keluar: 0 });

            const trx = transaksiList.find(t => t.transaksi_id === b.transaksi_id);
            const amount = b.jumlah_bayar + (trx?.denda || 0);

            const current = days.get(date)!;
            current.masuk += amount;
        });

        // Process Expense
        filteredPengeluaran.forEach(p => {
            const date = p.tanggal;
            if (!days.has(date)) days.set(date, { masuk: 0, keluar: 0 });

            const current = days.get(date)!;
            current.keluar += p.nominal;
        });

        // Sort by date
        return Array.from(days.entries())
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([date, val]) => ({
                date,
                masuk: val.masuk,
                keluar: val.keluar,
                net: val.masuk - val.keluar
            }));
    };

    const dailyData = getDailyData();

    // Export Logic
    const handleExportExcel = async () => {
        try {
            const fileName = `Laporan_Bulanan_${selectedMonth}_${getTimestamp()}.xlsx`;
            const rows: any[][] = [];

            rows.push(["LAPORAN KEUANGAN BULANAN"]);
            rows.push([`Periode: ${getMonthLabel(selectedMonth)}`]);
            rows.push([]);

            // Summary
            rows.push(["RINGKASAN"]);
            rows.push(["Total Pemasukan", totalMasuk]);
            rows.push(["Total Pengeluaran", totalKeluar]);
            rows.push(["Laba Bersih", labaBersih]);
            rows.push([]);

            // Header Daily
            rows.push(["Tanggal", "Pemasukan", "Pengeluaran", "Selisih"]);

            // Data
            dailyData.forEach(d => {
                rows.push([
                    d.date,
                    d.masuk,
                    d.keluar,
                    d.net
                ]);
            });

            // Footer
            rows.push(["TOTAL", totalMasuk, totalKeluar, labaBersih]);

            const ws = XLSX.utils.aoa_to_sheet(rows);
            // Column widths
            ws["!cols"] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }];

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan");

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

    const handleExportPDF = async () => {
        try {
            const fileName = `Laporan_Bulanan_${selectedMonth}_${getTimestamp()}.pdf`;
            const doc = new jsPDF();

            // Header
            doc.setFontSize(18);
            doc.text("LAPORAN KEUANGAN BULANAN", 105, 15, { align: "center" });

            doc.setFontSize(11);
            doc.setTextColor(100);
            doc.text(`Periode: ${getMonthLabel(selectedMonth)}`, 105, 22, { align: "center" });

            // Stats Box
            doc.setDrawColor(200);
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(14, 30, 182, 25, 3, 3, "FD");

            doc.setFontSize(10);
            const startY = 38;

            // Pemasukan
            doc.setTextColor(34, 197, 94); // Green
            doc.text("Total Pemasukan", 40, startY, { align: "center" });
            doc.setFont("helvetica", "bold");
            doc.text(`Rp ${formatPlainCurrency(totalMasuk)}`, 40, startY + 7, { align: "center" });

            // Pengeluaran
            doc.setTextColor(239, 68, 68); // Red
            doc.setFont("helvetica", "normal");
            doc.text("Total Pengeluaran", 105, startY, { align: "center" });
            doc.setFont("helvetica", "bold");
            doc.text(`Rp ${formatPlainCurrency(totalKeluar)}`, 105, startY + 7, { align: "center" });

            // Net
            doc.setTextColor(59, 130, 246); // Blue
            doc.setFont("helvetica", "normal");
            doc.text("Laba Bersih", 170, startY, { align: "center" });
            doc.setFont("helvetica", "bold");
            doc.text(`Rp ${formatPlainCurrency(labaBersih)}`, 170, startY + 7, { align: "center" });

            // Reset font
            doc.setTextColor(0);
            doc.setFont("helvetica", "normal");

            // Table
            const tableBody = dailyData.map(d => [
                d.date,
                formatPlainCurrency(d.masuk),
                formatPlainCurrency(d.keluar),
                formatPlainCurrency(d.net)
            ]);

            // Add total row
            tableBody.push([
                "TOTAL",
                formatPlainCurrency(totalMasuk),
                formatPlainCurrency(totalKeluar),
                formatPlainCurrency(labaBersih)
            ]);

            autoTable(doc, {
                startY: 65,
                head: [["Tanggal", "Pemasukan", "Pengeluaran", "Selisih"]],
                body: tableBody,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 3 },
                headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
                columnStyles: {
                    1: { halign: 'right', textColor: [34, 197, 94] },
                    2: { halign: 'right', textColor: [239, 68, 68] },
                    3: { halign: 'right', fontStyle: 'bold' }
                },
                didParseCell: (data) => {
                    // Style footer row
                    if (data.row.index === tableBody.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [240, 240, 240];
                    }
                }
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
                <div className="text-slate-400 animate-pulse">Memuat data laporan...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50" style={{ animation: "slideUp 0.3s ease-out" }}>
                    <div className="bg-slate-800 border border-green-600/50 rounded-xl shadow-2xl shadow-green-900/20 p-4 flex items-start gap-3 max-w-sm">
                        <div className="p-1.5 bg-green-500/20 rounded-lg shrink-0 mt-0.5">
                            <CheckCircle size={18} className="text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200">Laporan tersimpan!</p>
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

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Laporan Bulanan</h1>
                    <p className="text-slate-400">Ringkasan kinerja keuangan rental</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Month Picker */}
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="month"
                            className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    {/* Exports */}
                    <div className="flex gap-2">
                        <Button
                            label="Excel"
                            icon={<FileSpreadsheet size={16} />}
                            className="bg-green-600 hover:bg-green-700 text-white border-none"
                            onClick={handleExportExcel}
                        />
                        <Button
                            label="PDF"
                            icon={<FileText size={16} />}
                            className="bg-red-600 hover:bg-red-700 text-white border-none"
                            onClick={handleExportPDF}
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Pemasukan */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition pointer-events-none">
                        <TrendingUp size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-500/20 rounded-lg">
                                <TrendingUp size={20} className="text-green-400" />
                            </div>
                            <span className="text-slate-400 text-sm font-medium">Total Pemasukan</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-100 mt-2">
                            {formatCurrency(totalMasuk)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Dari {filteredBukti.length} transaksi pembayaran
                        </p>
                    </div>
                </div>

                {/* Pengeluaran */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition pointer-events-none">
                        <TrendingDown size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-500/20 rounded-lg">
                                <TrendingDown size={20} className="text-red-400" />
                            </div>
                            <span className="text-slate-400 text-sm font-medium">Total Pengeluaran</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-100 mt-2">
                            {formatCurrency(totalKeluar)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Dari {filteredPengeluaran.length} item pengeluaran
                        </p>
                    </div>
                </div>

                {/* Laba Bersih */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-6 opacity-5 group-hover:opacity-10 transition pointer-events-none">
                        <DollarSign size={100} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-2 rounded-lg ${labaBersih >= 0 ? "bg-blue-500/20" : "bg-amber-500/20"}`}>
                                <DollarSign size={20} className={labaBersih >= 0 ? "text-blue-400" : "text-amber-400"} />
                            </div>
                            <span className="text-slate-400 text-sm font-medium">Laba Bersih</span>
                        </div>
                        <h3 className={`text-2xl font-bold mt-2 ${labaBersih >= 0 ? "text-blue-400" : "text-amber-400"}`}>
                            {formatCurrency(labaBersih)}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                            {labaBersih >= 0 ? "Keuntungan periode ini" : "Kerugian periode ini"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <h3 className="font-semibold text-slate-200">Rincian Harian</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-slate-900/50 border-b border-slate-700 text-left">
                                <th className="px-5 py-3 font-medium text-slate-400">Tanggal</th>
                                <th className="px-5 py-3 font-medium text-slate-400 text-right">Pemasukan</th>
                                <th className="px-5 py-3 font-medium text-slate-400 text-right">Pengeluaran</th>
                                <th className="px-5 py-3 font-medium text-slate-400 text-right">Selisih</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700/50">
                            {dailyData.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                                        Tidak ada data transaksi untuk bulan ini
                                    </td>
                                </tr>
                            ) : (
                                dailyData.map((d) => (
                                    <tr key={d.date} className="hover:bg-slate-700/30 transition">
                                        <td className="px-5 py-3 text-slate-300">
                                            {new Date(d.date).toLocaleDateString("id-ID", {
                                                day: "numeric", month: "long", weekday: "long"
                                            })}
                                        </td>
                                        <td className="px-5 py-3 text-right text-emerald-400">
                                            {d.masuk > 0 ? formatPlainCurrency(d.masuk) : "-"}
                                        </td>
                                        <td className="px-5 py-3 text-right text-red-400">
                                            {d.keluar > 0 ? formatPlainCurrency(d.keluar) : "-"}
                                        </td>
                                        <td className={`px-5 py-3 text-right font-medium ${d.net > 0 ? "text-blue-400" : d.net < 0 ? "text-amber-400" : "text-slate-500"
                                            }`}>
                                            {formatPlainCurrency(d.net)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {dailyData.length > 0 && (
                            <tfoot className="bg-slate-900/80 font-bold border-t border-slate-600">
                                <tr>
                                    <td className="px-5 py-4 text-slate-200">TOTAL</td>
                                    <td className="px-5 py-4 text-right text-emerald-400">{formatPlainCurrency(totalMasuk)}</td>
                                    <td className="px-5 py-4 text-right text-red-400">{formatPlainCurrency(totalKeluar)}</td>
                                    <td className={`px-5 py-4 text-right ${labaBersih >= 0 ? "text-blue-400" : "text-amber-400"}`}>
                                        {formatPlainCurrency(labaBersih)}
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
