import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";
import { Plus, Search, Calendar } from "lucide-react";

import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

const METODE_OPTIONS = [
    { value: "semua", label: "Semua Metode" },
    { value: "tunai", label: "Tunai" },
    { value: "transfer", label: "Transfer" },
];

export default function BuktiPelunasanList() {
    const [buktiList, setBuktiList] = useState<BuktiPelunasan[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [metodeFilter, setMetodeFilter] = useState("semua");
    const [bulanFilter, setBulanFilter] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const result = await invoke<BuktiPelunasan[]>("get_all_bukti_pelunasan");
            setBuktiList(result);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
        }
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
        };

        return (
            <span className={`${base} ${map[metode.toLowerCase()] ?? "bg-slate-700 text-slate-200"}`}>
                {metode.charAt(0).toUpperCase() + metode.slice(1)}
            </span>
        );
    };

    // Filter logic
    const filteredBukti = buktiList.filter((b) => {
        // Metode filter
        if (metodeFilter !== "semua" && b.metode_bayar.toLowerCase() !== metodeFilter) return false;

        // Bulan filter (format: "YYYY-MM")
        if (bulanFilter && !b.tanggal_bayar.startsWith(bulanFilter)) return false;

        // Search
        const search = searchTerm.toLowerCase();
        if (search) {
            return (
                b.tanggal_bayar.includes(search) ||
                b.metode_bayar.toLowerCase().includes(search) ||
                String(b.transaksi_id).includes(search) ||
                String(b.jumlah_bayar).includes(search)
            );
        }

        return true;
    });

    // Counts for metode tabs
    const metodeCounts = {
        semua: buktiList.length,
        tunai: buktiList.filter(b => b.metode_bayar.toLowerCase() === "tunai").length,
        transfer: buktiList.filter(b => b.metode_bayar.toLowerCase() === "transfer").length,
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
        },
        {
            header: "Tanggal Bayar",
            accessor: "tanggal_bayar" as const,
        },
        {
            header: "Jumlah Bayar",
            accessor: "jumlah_bayar" as const,
            render: (value: number) => (
                <span className="text-emerald-400 font-medium">{formatCurrency(value)}</span>
            ),
        },
        {
            header: "Metode Bayar",
            accessor: "metode_bayar" as const,
            render: (value: string) => metodeBadge(value),
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

                    <Button
                        label="Tambah Bukti Pelunasan"
                        icon={<Plus size={16} />}
                        href="/bukti_pelunasan/tambah"
                    />
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
        </div>
    );
}
