import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";

import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";

export default function BuktiPelunasanList() {
    const [buktiList, setBuktiList] = useState<BuktiPelunasan[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
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

    const filteredBukti = buktiList.filter((b) => {
        const search = searchTerm.toLowerCase();
        return (
            b.tanggal_bayar.includes(search) ||
            b.metode_bayar.toLowerCase().includes(search) ||
            String(b.transaksi_id).includes(search)
        );
    });

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
            render: (value: number) => formatCurrency(value),
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
                    <p className="text-sm text-slate-300">
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
                            placeholder="Cari tanggal, metode, atau transaksi ID..."
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

            {/* Table */}
            {loading ? (
                <div className="p-8 text-center text-slate-400">Memuat data...</div>
            ) : (
                <Table data={filteredBukti} columns={columns} />
            )}
        </div>
    );
}
