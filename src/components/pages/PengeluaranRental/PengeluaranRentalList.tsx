import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Search, Calendar, ChevronDown, ChevronRight, DollarSign, FileSpreadsheet, FileText, CheckCircle, FolderOpen, X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { PengeluaranRental } from "../../../types/pengeluaran_rental";
import Button from "@/components/ui/Button";

export default function PengeluaranRentalList() {
    const [pengeluaranList, setPengeluaranList] = useState<PengeluaranRental[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [loading, setLoading] = useState(true);
    const [collapsedDates, setCollapsedDates] = useState<Set<string>>(new Set());
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
            const result = await invoke<PengeluaranRental[]>("get_all_pengeluaran_rental");
            setPengeluaranList(result);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Apakah Anda yakin ingin menghapus data ini?")) return;
        try {
            await invoke("delete_pengeluaran_rental", { id });
            fetchData();
        } catch (err) {
            console.error("Failed to delete pengeluaran_rental:", err);
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

    const formatCurrencyPlain = (amount: number) => {
        return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        } catch {
            return dateStr;
        }
    };

    // Filter by month first
    const monthFiltered = pengeluaranList.filter((p) => {
        if (!selectedMonth) return true; // "Semua Bulan"
        return p.tanggal?.slice(0, 7) === selectedMonth;
    });

    const totalPengeluaran = monthFiltered.reduce((sum, p) => sum + (p.nominal || 0), 0);

    const filteredPengeluaran = monthFiltered.filter((p) => {
        const search = searchTerm.toLowerCase();
        return (
            p.tanggal?.toLowerCase().includes(search) ||
            p.jenis?.toLowerCase().includes(search) ||
            p.keterangan?.toLowerCase().includes(search)
        );
    });

    const grouped = filteredPengeluaran.reduce<Record<string, PengeluaranRental[]>>((acc, p) => {
        const date = p.tanggal?.slice(0, 10) || "Tanpa Tanggal";
        if (!acc[date]) acc[date] = [];
        acc[date].push(p);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    // Get unique months for the dropdown
    const availableMonths = [...new Set(pengeluaranList.map((p) => p.tanggal?.slice(0, 7)).filter(Boolean))].sort((a, b) => b.localeCompare(a));

    const getMonthLabel = (ym: string) => {
        try {
            const [y, m] = ym.split("-");
            const date = new Date(parseInt(y), parseInt(m) - 1);
            return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        } catch {
            return ym;
        }
    };

    const toggleDate = (date: string) => {
        setCollapsedDates((prev) => {
            const next = new Set(prev);
            if (next.has(date)) {
                next.delete(date);
            } else {
                next.add(date);
            }
            return next;
        });
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
            const fileName = `Pengeluaran_Rental_${ts}.xlsx`;
            const rows: any[][] = [];
            rows.push(["Laporan Pengeluaran Rental"]);
            rows.push([]);
            rows.push(["No", "Tanggal", "Jenis", "Nominal (Rp)", "Keterangan"]);

            let no = 1;
            sortedDates.forEach((date) => {
                const items = grouped[date];
                items.forEach((p) => {
                    rows.push([no++, p.tanggal?.slice(0, 10) || "", p.jenis, p.nominal, p.keterangan || ""]);
                });
                const subtotal = items.reduce((sum, p) => sum + (p.nominal || 0), 0);
                rows.push(["", "", "Subtotal " + formatDate(date), subtotal, ""]);
            });
            rows.push([]);
            rows.push(["", "", "TOTAL PENGELUARAN", totalPengeluaran, ""]);

            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws["!cols"] = [
                { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 18 }, { wch: 30 },
            ];
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Pengeluaran Rental");

            // Write to array buffer, then save via Rust
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
            alert("Gagal menyimpan file Excel: " + err);
        }
    };

    // ======== EXPORT PDF ========
    const exportPDF = async () => {
        try {
            const now = new Date();
            const ts = `${now.toISOString().slice(0, 10)}_${now.getHours().toString().padStart(2, "0")}${now.getMinutes().toString().padStart(2, "0")}${now.getSeconds().toString().padStart(2, "0")}`;
            const fileName = `Pengeluaran_Rental_${ts}.pdf`;
            const doc = new jsPDF();

            doc.setFontSize(16);
            doc.text("Laporan Pengeluaran Rental", 14, 20);
            doc.setFontSize(10);
            doc.text(`Dicetak: ${new Date().toLocaleDateString("id-ID")}`, 14, 27);

            const tableRows: any[][] = [];
            let no = 1;

            sortedDates.forEach((date) => {
                const items = grouped[date];
                items.forEach((p) => {
                    tableRows.push([
                        no++,
                        p.tanggal?.slice(0, 10) || "",
                        p.jenis,
                        formatCurrencyPlain(p.nominal),
                        p.keterangan || "",
                    ]);
                });
                const subtotal = items.reduce((sum, p) => sum + (p.nominal || 0), 0);
                tableRows.push(["", "", "Subtotal", formatCurrencyPlain(subtotal), ""]);
            });
            tableRows.push(["", "", "TOTAL", formatCurrencyPlain(totalPengeluaran), ""]);

            autoTable(doc, {
                startY: 32,
                head: [["No", "Tanggal", "Jenis", "Nominal (Rp)", "Keterangan"]],
                body: tableRows,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [30, 41, 59] },
                didParseCell: (data: any) => {
                    const row = data.row.index;
                    const isSubtotal = tableRows[row] && tableRows[row][2]?.toString().startsWith("Subtotal");
                    const isTotal = tableRows[row] && tableRows[row][2] === "TOTAL";
                    if (isSubtotal || isTotal) {
                        data.cell.styles.fontStyle = "bold";
                        if (isTotal) {
                            data.cell.styles.fillColor = [241, 245, 249];
                        }
                    }
                },
            });

            // Get PDF as array buffer, then save via Rust
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
            alert("Gagal menyimpan file PDF: " + err);
        }
    };

    return (
        <>
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

            {/* Month Filter & Total */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-5 mb-4 space-y-4">
                {/* Month Selector */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-700/40 rounded-lg">
                        <Calendar size={16} className="text-blue-400" />
                        <span className="text-sm font-medium text-blue-300">Pilih Bulan</span>
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

                {/* Total + Export */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-500/10 rounded-lg">
                            <DollarSign size={20} className="text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Total Pengeluaran {selectedMonth ? getMonthLabel(selectedMonth) : ""}</p>
                            <p className="text-xl font-bold text-red-400">{formatCurrency(totalPengeluaran)}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <p className="text-sm text-slate-400 mr-2">{monthFiltered.length} transaksi</p>
                        <button
                            onClick={exportExcel}
                            className="flex items-center gap-1.5 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-700 rounded-lg text-sm transition"
                            title="Export Excel"
                        >
                            <FileSpreadsheet size={16} />
                            <span>Excel</span>
                        </button>
                        <button
                            onClick={exportPDF}
                            className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-700 rounded-lg text-sm transition"
                            title="Export PDF"
                        >
                            <FileText size={16} />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">
                            Daftar Pengeluaran Rental
                        </h2>
                        <p className="text-sm text-slate-300">
                            Dikelompokkan berdasarkan tanggal
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
                                placeholder="Cari tanggal, jenis, atau keterangan..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <Button
                            label="Tambah Pengeluaran"
                            icon={<Plus size={16} />}
                            href="/pengeluaran_rental/tambah"
                        />
                    </div>
                </div>

                {/* Grouped Content */}
                {loading ? (
                    <div className="p-8 text-center text-slate-400">Memuat data...</div>
                ) : sortedDates.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">Tidak ada data pengeluaran</div>
                ) : (
                    <div className="divide-y divide-slate-700">
                        {sortedDates.map((date) => {
                            const items = grouped[date];
                            const subtotal = items.reduce((sum, p) => sum + (p.nominal || 0), 0);
                            const isCollapsed = collapsedDates.has(date);

                            return (
                                <div key={date}>
                                    <button
                                        onClick={() => toggleDate(date)}
                                        className="w-full flex items-center justify-between px-5 py-3 bg-slate-750 hover:bg-slate-700/50 transition cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? (
                                                <ChevronRight size={16} className="text-slate-400" />
                                            ) : (
                                                <ChevronDown size={16} className="text-slate-400" />
                                            )}
                                            <Calendar size={16} className="text-blue-400" />
                                            <span className="font-semibold text-slate-200">
                                                {formatDate(date)}
                                            </span>
                                            <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
                                                {items.length} item
                                            </span>
                                        </div>
                                        <span className="font-semibold text-red-400 text-sm">
                                            {formatCurrency(subtotal)}
                                        </span>
                                    </button>

                                    {!isCollapsed && (
                                        <div className="divide-y divide-slate-700/50">
                                            {items.map((p) => (
                                                <div
                                                    key={p.pengeluaran_id}
                                                    className="flex items-center justify-between px-5 py-3 pl-14 hover:bg-slate-700/30  transition"
                                                >
                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 p-3 gap-1 border bg-gray-800 border-slate-700 rounded-lg md:gap-4">
                                                        <div>
                                                            <span className="text-sm font-medium text-slate-200">
                                                                {p.jenis}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm text-slate-400">
                                                                {p.keterangan || "-"}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-semibold text-red-400">
                                                                {formatCurrency(p.nominal)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-4">
                                                        <Button
                                                            label="Edit"
                                                            href={`/pengeluaran_rental/edit/${p.pengeluaran_id}`}
                                                            className="px-2 py-1 text-xs rounded hover:bg-blue-900 text-blue-300 border border-blue-800"
                                                        />
                                                        <Button
                                                            label="Hapus"
                                                            onClick={() => handleDelete(p.pengeluaran_id)}
                                                            className="bg-red-800 px-2 py-1 text-xs rounded hover:bg-red-900 text-red-300 border border-red-800"
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </>
    );
}
