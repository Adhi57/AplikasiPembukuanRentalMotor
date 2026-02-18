import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Receipt, User, Bike, Calendar, DollarSign } from "lucide-react";

import { Transaksi } from "../../../types/transaksi.type";
import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService, TransaksiService } from "../../../services/penyewa.service";

import Button from "../../ui/Button";
import Input from "../../ui/Input";
import Select from "../../ui/Select";
import FileInput from "../../ui/FileInput";

export default function BuktiPelunasanEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [bukti, setBukti] = useState<BuktiPelunasan | null>(null);
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [buktiResult, t, m, p] = await Promise.all([
                invoke<BuktiPelunasan>("get_bukti_pelunasan_by_id", { id: parseInt(id!) }),
                TransaksiService.getAll(),
                getMotor(),
                PenyewaService.getAll(),
            ]);
            setBukti(buktiResult);
            setTransaksiList(t);
            setMotors(m);
            setPenyewas(p);
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

    const selectedTransaksi = transaksiList.find(
        (t) => t.transaksi_id === bukti?.transaksi_id
    );

    const handleTransaksiChange = (transaksiId: number) => {
        if (!bukti) return;
        const transaksi = transaksiList.find((t) => t.transaksi_id === transaksiId);
        setBukti({
            ...bukti,
            transaksi_id: transaksiId,
            jumlah_bayar: (transaksi?.total_bayar ?? 0) + (transaksi?.denda ?? 0),
        });
    };

    const transaksiOptions = transaksiList.map((t) => ({
        value: String(t.transaksi_id),
        label: `#${t.transaksi_id} — ${getPenyewaName(t.penyewa_id)} — ${getMotorName(t.motor_id)}`,
    }));

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bukti) return;
        setError("");

        try {
            setSubmitting(true);

            let fotoPath = bukti.foto_bukti;

            if (selectedFile) {
                const base64 = await fileToBase64(selectedFile);
                fotoPath = await invoke<string>("save_bukti_pelunasan_image", { base64 });
            }

            await invoke("update_bukti_pelunasan", {
                id: parseInt(id!),
                data: { ...bukti, foto_bukti: fotoPath },
            });
            navigate("/bukti_pelunasan");
        } catch (err) {
            console.error("Failed to update data:", err);
            setError("Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">Memuat data...</div>
            </div>
        );
    }

    if (error && !bukti) return <div className="text-red-400 p-6">{error}</div>;
    if (!bukti) return <div className="text-red-400 p-6">Data tidak ditemukan</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/bukti_pelunasan"
                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Edit Bukti Pelunasan #{id}</h1>
                    <p className="text-slate-500">Ubah data pembayaran transaksi rental</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Select
                            label="Pilih Transaksi"
                            value={String(bukti.transaksi_id || "")}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                handleTransaksiChange(parseInt(e.target.value) || 0)
                            }
                            options={transaksiOptions}
                            required
                        />

                        <Input
                            label="Tanggal Bayar"
                            type="date"
                            value={bukti.tanggal_bayar}
                            onChange={(e) => setBukti({ ...bukti, tanggal_bayar: e.target.value })}
                            required
                        />

                        <Input
                            label="Jumlah Bayar (Rp)"
                            type="number"
                            value={bukti.jumlah_bayar || ""}
                            onChange={(e) =>
                                setBukti({ ...bukti, jumlah_bayar: parseInt(e.target.value) || 0 })
                            }
                            required
                        />

                        <Select
                            label="Metode Bayar"
                            value={bukti.metode_bayar}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                setBukti({ ...bukti, metode_bayar: e.target.value })
                            }
                            options={[
                                { value: "tunai", label: "Tunai" },
                                { value: "transfer", label: "Transfer Bank" },
                                { value: "ewallet", label: "E-Wallet" },
                                { value: "qris", label: "QRIS" },
                            ]}
                            required
                        />

                        <FileInput
                            label="Foto Bukti Pembayaran"
                            accept="image/*"
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setSelectedFile(file);
                                    setBukti({ ...bukti, foto_bukti: file.name });
                                }
                            }}
                        />
                        {bukti.foto_bukti && (
                            <p className="text-xs text-slate-400">File saat ini: {bukti.foto_bukti}</p>
                        )}

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                label={submitting ? "Menyimpan..." : "Simpan Perubahan"}
                                disabled={submitting}
                            />
                            <Button
                                label="Batal"
                                variant="secondary"
                                onClick={() => navigate("/bukti_pelunasan")}
                            />
                        </div>
                    </form>
                </div>

                {/* Info Panel */}
                <div className="lg:col-span-1">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
                            Detail Transaksi
                        </h3>

                        {selectedTransaksi ? (
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Receipt size={16} className="text-blue-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">ID Transaksi</p>
                                        <p className="text-sm text-slate-200 font-medium">#{selectedTransaksi.transaksi_id}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User size={16} className="text-green-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Penyewa</p>
                                        <p className="text-sm text-slate-200 font-medium">{getPenyewaName(selectedTransaksi.penyewa_id)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Bike size={16} className="text-purple-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Motor</p>
                                        <p className="text-sm text-slate-200 font-medium">{getMotorName(selectedTransaksi.motor_id)}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Periode Sewa</p>
                                        <p className="text-sm text-slate-200">{selectedTransaksi.tanggal_sewa}</p>
                                        <p className="text-xs text-slate-400">s/d {selectedTransaksi.tanggal_kembali_rencana}</p>
                                    </div>
                                </div>
                                <hr className="border-slate-700" />
                                <div className="flex items-start gap-3">
                                    <DollarSign size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Total Bayar</p>
                                        <p className="text-lg text-emerald-400 font-bold">{formatCurrency(selectedTransaksi.total_bayar)}</p>
                                    </div>
                                </div>
                                {selectedTransaksi.denda != null && selectedTransaksi.denda > 0 && (
                                    <div className="flex items-start gap-3">
                                        <DollarSign size={16} className="text-red-400 mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-slate-500">Denda</p>
                                            <p className="text-sm text-red-400 font-semibold">
                                                {formatCurrency(selectedTransaksi.denda)}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Receipt size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500">Pilih transaksi untuk melihat detail</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}