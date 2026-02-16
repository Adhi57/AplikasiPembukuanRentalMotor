import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
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
                jumlah: b.jumlah_bayar,
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

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">Memuat data kas...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
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
