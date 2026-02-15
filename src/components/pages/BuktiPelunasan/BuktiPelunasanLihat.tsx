import { useEffect, useState } from "react";
import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Receipt, User, Bike, Calendar, DollarSign, CreditCard, FileImage } from "lucide-react";

import { Transaksi } from "../../../types/transaksi.type";
import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService, TransaksiService } from "../../../services/penyewa.service";

import Button from "../../ui/Button";

export default function BuktiPelunasanLihat() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bukti, setBukti] = useState<BuktiPelunasan | null>(null);
    const [transaksi, setTransaksi] = useState<Transaksi | null>(null);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isImageOpen, setIsImageOpen] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [buktiResult, m, p] = await Promise.all([
                invoke<BuktiPelunasan>("get_bukti_pelunasan_by_id", { id: parseInt(id!) }),
                getMotor(),
                PenyewaService.getAll(),
            ]);
            setBukti(buktiResult);
            setMotors(m);
            setPenyewas(p);

            // Fetch the linked transaksi
            if (buktiResult.transaksi_id) {
                const t = await TransaksiService.getById(buktiResult.transaksi_id);
                setTransaksi(t);
            }
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setError("Gagal memuat data");
        } finally {
            setLoading(false);
        }
    };

    const getMotorName = (motorId: number) => {
        const motor = motors.find((m) => m.motor_id === motorId);
        return motor ? `${motor.nama} (${motor.plat})` : `Motor #${motorId}`;
    };

    const getPenyewaName = (penyewaId: number) => {
        const penyewa = penyewas.find((p) => p.penyewa_id === penyewaId);
        return penyewa ? penyewa.nama : `Penyewa #${penyewaId}`;
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
        const map: Record<string, string> = {
            tunai: "bg-green-900/50 text-green-300 border-green-800",
            transfer: "bg-blue-900/50 text-blue-300 border-blue-800",
            ewallet: "bg-purple-900/50 text-purple-300 border-purple-800",
            qris: "bg-amber-900/50 text-amber-300 border-amber-800",
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${map[metode.toLowerCase()] ?? "bg-slate-700 text-slate-300 border-slate-600"}`}>
                {metode.charAt(0).toUpperCase() + metode.slice(1)}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">Memuat data...</div>
            </div>
        );
    }

    if (error) return <div className="text-red-400 p-6">{error}</div>;
    if (!bukti) return <div className="text-red-400 p-6">Data tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        to="/bukti_pelunasan"
                        className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-200">
                            Bukti Pelunasan #{bukti.bukti_id}
                        </h1>
                        <p className="text-slate-500">Detail pembayaran transaksi</p>
                    </div>
                </div>
                <Button
                    label="Edit"
                    href={`/bukti_pelunasan/edit/${bukti.bukti_id}`}
                    className="px-4 py-2 text-sm"
                />
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bukti Detail */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                        Informasi Pembayaran
                    </h3>

                    <div className="space-y-5">
                        <div className="flex items-start gap-3">
                            <Calendar size={16} className="text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500">Tanggal Bayar</p>
                                <p className="text-sm text-slate-200 font-medium">{bukti.tanggal_bayar}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <DollarSign size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500">Jumlah Bayar</p>
                                <p className="text-xl text-emerald-400 font-bold">
                                    {formatCurrency(bukti.jumlah_bayar)}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <CreditCard size={16} className="text-amber-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500">Metode Bayar</p>
                                <div className="mt-1">{metodeBadge(bukti.metode_bayar)}</div>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <FileImage size={16} className="text-purple-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-xs text-slate-500">Foto Bukti</p>
                                {bukti.foto_bukti ? (
                                    <img
                                        src={convertFileSrc(bukti.foto_bukti)}
                                        alt="Bukti Pelunasan"
                                        className="w-full h-auto rounded-lg mt-2 cursor-pointer hover:opacity-90 transition"
                                        onClick={() => setIsImageOpen(true)}
                                    />
                                ) : (
                                    <p className="text-sm text-slate-500 italic">Tidak ada foto</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Transaksi Detail */}
                <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5">
                        Detail Transaksi Terkait
                    </h3>

                    {transaksi ? (
                        <div className="space-y-5">
                            <div className="flex items-start gap-3">
                                <Receipt size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500">ID Transaksi</p>
                                    <p className="text-sm text-slate-200 font-medium">#{transaksi.transaksi_id}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <User size={16} className="text-green-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500">Penyewa</p>
                                    <p className="text-sm text-slate-200 font-medium">
                                        {getPenyewaName(transaksi.penyewa_id)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Bike size={16} className="text-purple-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500">Motor</p>
                                    <p className="text-sm text-slate-200 font-medium">
                                        {getMotorName(transaksi.motor_id)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <Calendar size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500">Periode Sewa</p>
                                    <p className="text-sm text-slate-200">{transaksi.tanggal_sewa}</p>
                                    <p className="text-xs text-slate-400">s/d {transaksi.tanggal_kembali_rencana}</p>
                                </div>
                            </div>

                            <hr className="border-slate-700" />

                            <div className="flex items-start gap-3">
                                <DollarSign size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-xs text-slate-500">Total Bayar Transaksi</p>
                                    <p className="text-lg text-emerald-400 font-bold">
                                        {formatCurrency(transaksi.total_bayar)}
                                    </p>
                                </div>
                            </div>

                            {transaksi.denda != null && transaksi.denda > 0 && (
                                <div className="flex items-start gap-3">
                                    <DollarSign size={16} className="text-red-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Denda</p>
                                        <p className="text-sm text-red-400 font-semibold">
                                            {formatCurrency(transaksi.denda)}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div>
                                <span
                                    className={`px-2 py-1 rounded text-xs font-semibold ${transaksi.status === "kembali"
                                        ? "bg-green-900 text-green-200"
                                        : transaksi.status === "terlambat"
                                            ? "bg-red-900 text-red-200"
                                            : "bg-blue-900 text-blue-200"
                                        }`}
                                >
                                    {transaksi.status.charAt(0).toUpperCase() + transaksi.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Receipt size={32} className="mx-auto text-slate-600 mb-2" />
                            <p className="text-sm text-slate-500">Data transaksi tidak ditemukan</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Back Button */}
            <div className="max-w-4xl mx-auto">
                <Button
                    label="Kembali ke Daftar"
                    variant="secondary"
                    onClick={() => navigate("/bukti_pelunasan")}
                />
            </div>

            {/* Image Modal */}
            {isImageOpen && bukti?.foto_bukti && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onClick={() => setIsImageOpen(false)}
                >
                    <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
                        <button
                            onClick={() => setIsImageOpen(false)}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                        <img
                            src={convertFileSrc(bukti.foto_bukti)}
                            alt="Bukti Pelunasan Full"
                            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}