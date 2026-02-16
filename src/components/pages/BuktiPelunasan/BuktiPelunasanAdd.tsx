import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Receipt, User, Bike, Calendar, DollarSign, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

import { Transaksi } from "../../../types/transaksi.type";
import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService, TransaksiService } from "../../../services/penyewa.service";

import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "../../ui/Select";
import FileInput from "../../ui/FileInput";

export default function BuktiPelunasanAdd() {
    const navigate = useNavigate();
    const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);
    const [existingBukti, setExistingBukti] = useState<BuktiPelunasan[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showConfirm, setShowConfirm] = useState(false);

    const [bukti, setBukti] = useState({
        bukti_id: 0,
        transaksi_id: 0,
        tanggal_bayar: new Date().toISOString().split("T")[0],
        jumlah_bayar: 0,
        metode_bayar: "tunai",
        foto_bukti: "",
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    useEffect(() => {
        fetchReferenceData();
    }, []);

    const fetchReferenceData = async () => {
        try {
            setLoadingData(true);
            const [t, m, p, b] = await Promise.all([
                TransaksiService.getAll(),
                getMotor(),
                PenyewaService.getAll(),
                invoke<BuktiPelunasan[]>("get_all_bukti_pelunasan"),
            ]);
            setTransaksiList(t);
            setMotors(m);
            setPenyewas(p);
            setExistingBukti(b);
        } catch (err) {
            console.error("Failed to fetch reference data:", err);
            setError("Gagal memuat data referensi");
        } finally {
            setLoadingData(false);
        }
    };

    // Get transaksi_id yang sudah lunas (sudah punya bukti pelunasan)
    const paidTransaksiIds = new Set(existingBukti.map((b) => b.transaksi_id));

    // Filter: hanya tampilkan transaksi yang BELUM ada bukti pelunasannya
    const availableTransaksi = transaksiList.filter(
        (t) => !paidTransaksiIds.has(t.transaksi_id)
    );

    const getMotorName = (id: number) => {
        const motor = motors.find((m) => m.motor_id === id);
        return motor ? `${motor.nama} (${motor.plat})` : `Motor #${id}`;
    };

    const getPenyewaName = (id: number) => {
        const penyewa = penyewas.find((p) => p.penyewa_id === id);
        return penyewa ? penyewa.nama : `Penyewa #${id}`;
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
        (t) => t.transaksi_id === bukti.transaksi_id
    );

    const handleTransaksiChange = (transaksiId: number) => {
        const transaksi = transaksiList.find((t) => t.transaksi_id === transaksiId);
        setBukti({
            ...bukti,
            transaksi_id: transaksiId,
            jumlah_bayar: transaksi?.total_bayar ?? 0,
        });
    };

    const transaksiOptions = availableTransaksi.map((t) => ({
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

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (bukti.transaksi_id === 0) {
            setError("Pilih transaksi terlebih dahulu");
            return;
        }

        // Show confirmation dialog
        setShowConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        setShowConfirm(false);

        try {
            setSubmitting(true);

            let fotoPath = bukti.foto_bukti;

            if (selectedFile) {
                const base64 = await fileToBase64(selectedFile);
                fotoPath = await invoke<string>("save_bukti_pelunasan_image", { base64 });
            }

            await invoke("create_bukti_pelunasan", {
                data: { ...bukti, foto_bukti: fotoPath }
            });

            navigate("/bukti_pelunasan");
        } catch (err) {
            console.error("Failed to create data:", err);
            setError("Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingData) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">Memuat data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-500/20 rounded-lg">
                                <AlertTriangle size={20} className="text-amber-400" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-100">Konfirmasi Pelunasan</h3>
                        </div>

                        <div className="space-y-3 mb-6">
                            <p className="text-sm text-slate-300">
                                Apakah Anda yakin ingin mencatat pelunasan untuk transaksi ini?
                            </p>

                            {selectedTransaksi && (
                                <div className="bg-slate-900 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Transaksi</span>
                                        <span className="text-slate-200 font-medium">#{selectedTransaksi.transaksi_id}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Penyewa</span>
                                        <span className="text-slate-200">{getPenyewaName(selectedTransaksi.penyewa_id)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Motor</span>
                                        <span className="text-slate-200">{getMotorName(selectedTransaksi.motor_id)}</span>
                                    </div>
                                    <hr className="border-slate-700" />
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Jumlah Bayar</span>
                                        <span className="text-emerald-400 font-bold">{formatCurrency(bukti.jumlah_bayar)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-400">Metode</span>
                                        <span className="text-slate-200 capitalize">{bukti.metode_bayar}</span>
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-amber-400/80">
                                Setelah dicatat, transaksi ini akan ditandai sebagai lunas dan tidak bisa dipilih lagi.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <Button
                                label="Batal"
                                variant="secondary"
                                onClick={() => setShowConfirm(false)}
                            />
                            <Button
                                label="Ya, Simpan Pelunasan"
                                onClick={handleConfirmSubmit}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/bukti_pelunasan"
                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Tambah Bukti Pelunasan</h1>
                    <p className="text-slate-500">Catat pembayaran untuk transaksi rental</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        {/* Transaksi Select */}
                        <Select
                            label="Pilih Transaksi"
                            value={String(bukti.transaksi_id || "")}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                                handleTransaksiChange(parseInt(e.target.value) || 0)
                            }
                            options={transaksiOptions}
                            required
                        />

                        {availableTransaksi.length === 0 && (
                            <div className="p-3 bg-amber-900/20 border border-amber-800/50 rounded-lg">
                                <p className="text-amber-400 text-sm">Semua transaksi sudah memiliki bukti pelunasan.</p>
                            </div>
                        )}

                        {/* Tanggal Bayar */}
                        <Input
                            label="Tanggal Bayar"
                            type="date"
                            value={bukti.tanggal_bayar}
                            onChange={(e) => setBukti({ ...bukti, tanggal_bayar: e.target.value })}
                            required
                        />

                        {/* Jumlah Bayar */}
                        <Input
                            label="Jumlah Bayar (Rp)"
                            type="number"
                            value={bukti.jumlah_bayar || ""}
                            onChange={(e) =>
                                setBukti({ ...bukti, jumlah_bayar: parseInt(e.target.value) || 0 })
                            }
                            required
                        />

                        {/* Metode Bayar */}
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

                        {/* Foto Bukti */}
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

                        {error && (
                            <div className="p-3 bg-red-900/30 border border-red-800 rounded-lg">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                label={submitting ? "Menyimpan..." : "Simpan Bukti"}
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
                <div className="lg:col-span-1 space-y-4">
                    {/* Detail Transaksi */}
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
                                        <p className="text-sm text-slate-200 font-medium">
                                            #{selectedTransaksi.transaksi_id}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <User size={16} className="text-green-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Penyewa</p>
                                        <p className="text-sm text-slate-200 font-medium">
                                            {getPenyewaName(selectedTransaksi.penyewa_id)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Bike size={16} className="text-purple-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Motor</p>
                                        <p className="text-sm text-slate-200 font-medium">
                                            {getMotorName(selectedTransaksi.motor_id)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar size={16} className="text-amber-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Periode Sewa</p>
                                        <p className="text-sm text-slate-200">
                                            {selectedTransaksi.tanggal_sewa}
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            s/d {selectedTransaksi.tanggal_kembali_rencana}
                                        </p>
                                    </div>
                                </div>

                                <hr className="border-slate-700" />

                                <div className="flex items-start gap-3">
                                    <DollarSign size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs text-slate-500">Total Bayar</p>
                                        <p className="text-lg text-emerald-400 font-bold">
                                            {formatCurrency(selectedTransaksi.total_bayar)}
                                        </p>
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

                                <div className="mt-2">
                                    <span
                                        className={`px-2 py-1 rounded text-xs font-semibold ${selectedTransaksi.status === "kembali"
                                            ? "bg-green-900 text-green-200"
                                            : selectedTransaksi.status === "terlambat"
                                                ? "bg-red-900 text-red-200"
                                                : "bg-blue-900 text-blue-200"
                                            }`}
                                    >
                                        {selectedTransaksi.status.charAt(0).toUpperCase() +
                                            selectedTransaksi.status.slice(1)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <Receipt size={32} className="mx-auto text-slate-600 mb-2" />
                                <p className="text-sm text-slate-500">
                                    Pilih transaksi untuk melihat detail
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}