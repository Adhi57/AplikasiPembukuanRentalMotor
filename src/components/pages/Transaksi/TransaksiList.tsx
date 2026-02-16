import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { convertFileSrc } from "@tauri-apps/api/core";
import { Plus, Search, Image, X } from "lucide-react";

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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [tResult, mResult, pResult] = await Promise.all([
                invoke<Transaksi[]>("get_all_transaksi"),
                getMotor(),
                PenyewaService.getAll()
            ]);
            setTransaksi(tResult);
            setMotors(mResult);
            setPenyewas(pResult);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setLoading(false);
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

                    <Button
                        label="Tambah Transaksi"
                        icon={<Plus size={16} />}
                        href="/transaksi/tambah"
                    />
                </div>
            </div>

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
            {modalImage && (
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
                                <Image size={18} className="text-purple-400" /> Bukti Transaksi
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
                                alt="Bukti Transaksi"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
