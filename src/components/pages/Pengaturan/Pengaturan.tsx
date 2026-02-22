import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { save, open } from "@tauri-apps/plugin-dialog";
import { relaunch } from "@tauri-apps/plugin-process";
import {
    Settings,
    Save,
    CheckCircle,
    Wallet,
    AlertTriangle,
    Download,
    Upload,
    Database,
    XCircle,
    Info,
    Tag,
    Percent,
    Calendar,
} from "lucide-react";

export default function Pengaturan() {
    const [dendaPerHari, setDendaPerHari] = useState<string>("0");
    const [saldoAwalKas, setSaldoAwalKas] = useState<string>("0");
    const [saldoAwalBank, setSaldoAwalBank] = useState<string>("0");
    const [saldoAwalEwallet, setSaldoAwalEwallet] = useState<string>("0");
    const [diskonAktif, setDiskonAktif] = useState(false);
    const [diskonPersen, setDiskonPersen] = useState<string>("0");
    const [diskonMulai, setDiskonMulai] = useState<string>("");
    const [diskonBerakhir, setDiskonBerakhir] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: "success" | "error";
    }>({ show: false, message: "", type: "success" });
    const [backingUp, setBackingUp] = useState(false);
    const [importing, setImporting] = useState(false);
    const [showImportConfirm, setShowImportConfirm] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(
                () => setToast({ show: false, message: "", type: "success" }),
                3000
            );
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const [denda, kas, bank, ewallet, dPersen, dMulai, dBerakhir, dAktif] = await Promise.all([
                invoke<string>("get_pengaturan", { key: "denda_per_hari" }),
                invoke<string>("get_pengaturan", { key: "saldo_awal_kas" }),
                invoke<string>("get_pengaturan", { key: "saldo_awal_bank" }),
                invoke<string>("get_pengaturan", { key: "saldo_awal_ewallet" }),
                invoke<string>("get_pengaturan", { key: "diskon_persen" }),
                invoke<string>("get_pengaturan", { key: "diskon_tanggal_mulai" }),
                invoke<string>("get_pengaturan", { key: "diskon_tanggal_berakhir" }),
                invoke<string>("get_pengaturan", { key: "diskon_aktif" }),
            ]);
            setDendaPerHari(denda || "0");
            setSaldoAwalKas(kas || "0");
            setSaldoAwalBank(bank || "0");
            setSaldoAwalEwallet(ewallet || "0");
            setDiskonPersen(dPersen || "0");
            setDiskonMulai(dMulai || "");
            setDiskonBerakhir(dBerakhir || "");
            setDiskonAktif(dAktif === "1");
        } catch (err) {
            console.error("Failed to fetch settings:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatInputCurrency = (val: string) => {
        const num = parseInt(val.replace(/\D/g, "")) || 0;
        return new Intl.NumberFormat("id-ID").format(num);
    };

    const saveSetting = async (
        key: string,
        value: string,
        keterangan: string
    ) => {
        try {
            setSaving(key);
            const cleanValue = (
                parseInt(value.replace(/\D/g, "")) || 0
            ).toString();
            await invoke("set_pengaturan", { key, value: cleanValue, keterangan });
            setToast({
                show: true,
                message: `${keterangan} berhasil disimpan`,
                type: "success",
            });
        } catch (err) {
            console.error("Failed to save setting:", err);
        } finally {
            setSaving(null);
        }
    };

    const saveDiskon = async () => {
        try {
            setSaving("diskon");
            await Promise.all([
                invoke("set_pengaturan", {
                    key: "diskon_persen",
                    value: (parseInt(diskonPersen.replace(/\D/g, "")) || 0).toString(),
                    keterangan: "Persentase Diskon",
                }),
                invoke("set_pengaturan", {
                    key: "diskon_tanggal_mulai",
                    value: diskonMulai,
                    keterangan: "Tanggal Mulai Diskon",
                }),
                invoke("set_pengaturan", {
                    key: "diskon_tanggal_berakhir",
                    value: diskonBerakhir,
                    keterangan: "Tanggal Berakhir Diskon",
                }),
                invoke("set_pengaturan", {
                    key: "diskon_aktif",
                    value: diskonAktif ? "1" : "0",
                    keterangan: "Status Diskon Aktif",
                }),
            ]);
            setToast({
                show: true,
                message: "Pengaturan diskon berhasil disimpan",
                type: "success",
            });
        } catch (err) {
            console.error("Failed to save diskon:", err);
            setToast({
                show: true,
                message: `Gagal menyimpan diskon: ${err}`,
                type: "error",
            });
        } finally {
            setSaving(null);
        }
    };

    // Check if discount is currently active based on today's date
    const isDiskonBerlaku = (() => {
        if (!diskonAktif || !diskonMulai || !diskonBerakhir) return false;
        const today = new Date().toISOString().split("T")[0];
        return today >= diskonMulai && today <= diskonBerakhir;
    })();

    const handleBackup = async () => {
        try {
            setBackingUp(true);

            // Generate default filename with timestamp
            const now = new Date();
            const timestamp = now
                .toISOString()
                .replace(/[:.]/g, "-")
                .slice(0, 19);
            const defaultName = `backup_rental_motor_${timestamp}.sqlite`;

            const destPath = await save({
                title: "Simpan Backup Database",
                defaultPath: defaultName,
                filters: [
                    {
                        name: "SQLite Database",
                        extensions: ["sqlite"],
                    },
                ],
            });

            if (!destPath) {
                // User cancelled
                return;
            }

            const result = await invoke<string>("backup_database", {
                destPath,
            });
            setToast({
                show: true,
                message: `Backup berhasil disimpan ke: ${result}`,
                type: "success",
            });
        } catch (err) {
            console.error("Backup failed:", err);
            setToast({
                show: true,
                message: `Gagal backup database: ${err}`,
                type: "error",
            });
        } finally {
            setBackingUp(false);
        }
    };

    const handleImport = async () => {
        try {
            setImporting(true);
            setShowImportConfirm(false);

            const selectedPath = await open({
                title: "Pilih File Database untuk Import",
                filters: [
                    {
                        name: "SQLite Database",
                        extensions: ["sqlite", "db"],
                    },
                ],
                multiple: false,
                directory: false,
            });

            if (!selectedPath) {
                // User cancelled
                return;
            }

            await invoke("import_database", { srcPath: selectedPath });

            setToast({
                show: true,
                message:
                    "Database berhasil diimpor! Aplikasi akan restart...",
                type: "success",
            });

            // Restart app after a short delay so user can see the toast
            setTimeout(async () => {
                await relaunch();
            }, 1500);
        } catch (err) {
            console.error("Import failed:", err);
            setToast({
                show: true,
                message: `Gagal import database: ${err}`,
                type: "error",
            });
        } finally {
            setImporting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">
                    Memuat pengaturan...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-lg">
                    <Settings size={24} className="text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">
                        Pengaturan
                    </h1>
                    <p className="text-sm text-slate-400">
                        Kelola konfigurasi aplikasi
                    </p>
                </div>
            </div>

            {/* Saldo Awal */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Wallet
                                size={20}
                                className="text-emerald-400"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">
                                Saldo Awal Kas
                            </h2>
                            <p className="text-sm text-slate-400">
                                Nilai awal saldo kas sebelum transaksi dicatat
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Kas */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Saldo Awal KAS
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={formatInputCurrency(saldoAwalKas)}
                                    onChange={(e) =>
                                        setSaldoAwalKas(
                                            e.target.value.replace(/\D/g, "")
                                        )
                                    }
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* Bank */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Saldo Awal BANK
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={formatInputCurrency(saldoAwalBank)}
                                    onChange={(e) =>
                                        setSaldoAwalBank(
                                            e.target.value.replace(/\D/g, "")
                                        )
                                    }
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        {/* E-Wallet */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Saldo Awal E-WALLET
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                                    Rp
                                </span>
                                <input
                                    type="text"
                                    value={formatInputCurrency(saldoAwalEwallet)}
                                    onChange={(e) =>
                                        setSaldoAwalEwallet(
                                            e.target.value.replace(/\D/g, "")
                                        )
                                    }
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                    </div>

                    <p className="text-xs text-slate-500">
                        Saldo ini akan ditambahkan sebagai nilai awal pada perhitungan masing-masing akun.
                    </p>

                    <button
                        onClick={async () => {
                            await saveSetting("saldo_awal_kas", saldoAwalKas, "Saldo Awal Kas");
                            await saveSetting("saldo_awal_bank", saldoAwalBank, "Saldo Awal Bank");
                            await saveSetting("saldo_awal_ewallet", saldoAwalEwallet, "Saldo Awal E-Wallet");
                        }}
                        disabled={saving?.startsWith("saldo_awal")}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving && saving.startsWith("saldo_awal")
                            ? "Menyimpan..."
                            : "Simpan Semua Saldo"}
                    </button>
                </div>
            </div>

            {/* Pengaturan Denda */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <AlertTriangle
                                size={20}
                                className="text-amber-400"
                            />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">
                                Pengaturan Denda
                            </h2>
                            <p className="text-sm text-slate-400">
                                Tarif denda keterlambatan pengembalian motor
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Denda per Hari (Rp)
                        </label>
                        <div className="relative max-w-sm">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                                Rp
                            </span>
                            <input
                                type="text"
                                value={formatInputCurrency(dendaPerHari)}
                                onChange={(e) =>
                                    setDendaPerHari(
                                        e.target.value.replace(/\D/g, "")
                                    )
                                }
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                            Denda ini akan dikenakan per hari keterlambatan
                            pengembalian motor.
                        </p>
                    </div>
                    <button
                        onClick={() =>
                            saveSetting(
                                "denda_per_hari",
                                dendaPerHari,
                                "Denda per Hari"
                            )
                        }
                        disabled={saving === "denda_per_hari"}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving === "denda_per_hari"
                            ? "Menyimpan..."
                            : "Simpan Denda"}
                    </button>
                </div>
            </div>

            {/* Pengaturan Diskon */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Tag size={20} className="text-purple-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-100">
                                    Pengaturan Diskon
                                </h2>
                                <p className="text-sm text-slate-400">
                                    Atur diskon harga sewa dengan rentang waktu tertentu
                                </p>
                            </div>
                        </div>
                        {/* Status Badge */}
                        {diskonAktif && (
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${isDiskonBerlaku
                                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                    }`}
                            >
                                {isDiskonBerlaku ? "● Sedang Berlaku" : "● Belum/Sudah Berakhir"}
                            </span>
                        )}
                    </div>
                </div>
                <div className="p-5 space-y-5">
                    {/* Toggle Aktif */}
                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-1.5 rounded-lg ${diskonAktif ? 'bg-purple-500/20' : 'bg-slate-700/50'}`}>
                                <Percent size={16} className={diskonAktif ? 'text-purple-400' : 'text-slate-500'} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-200">Aktifkan Diskon</p>
                                <p className="text-xs text-slate-500">Diskon akan diterapkan otomatis pada transaksi baru</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDiskonAktif(!diskonAktif)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${diskonAktif ? 'bg-purple-600' : 'bg-slate-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 ${diskonAktif ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Diskon Fields */}
                    <div className={`space-y-4 transition-opacity duration-200 ${diskonAktif ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                        {/* Persentase Diskon */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Persentase Diskon
                            </label>
                            <div className="relative max-w-xs">
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={diskonPersen}
                                    onChange={(e) => {
                                        const val = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                                        setDiskonPersen(val.toString());
                                    }}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-4 pr-12 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                                    placeholder="0"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
                                    %
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Masukkan persentase potongan harga (1-100%)
                            </p>
                        </div>

                        {/* Rentang Waktu */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-purple-400" />
                                        Tanggal Mulai
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={diskonMulai}
                                    onChange={(e) => setDiskonMulai(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <span className="flex items-center gap-1.5">
                                        <Calendar size={14} className="text-purple-400" />
                                        Tanggal Berakhir
                                    </span>
                                </label>
                                <input
                                    type="date"
                                    value={diskonBerakhir}
                                    onChange={(e) => setDiskonBerakhir(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:outline-none transition"
                                />
                            </div>
                        </div>

                        {/* Preview diskon */}
                        {diskonAktif && parseInt(diskonPersen) > 0 && diskonMulai && diskonBerakhir && (
                            <div className="p-3.5 bg-purple-500/5 border border-purple-600/30 rounded-lg">
                                <p className="text-sm text-purple-200/90 leading-relaxed">
                                    <strong>Ringkasan:</strong> Diskon <strong>{diskonPersen}%</strong> berlaku dari{" "}
                                    <strong>{new Date(diskonMulai).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
                                    {" "}s/d{" "}
                                    <strong>{new Date(diskonBerakhir).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</strong>
                                </p>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={saveDiskon}
                        disabled={saving === "diskon"}
                        className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-purple-500/10"
                    >
                        <Save size={16} />
                        {saving === "diskon" ? "Menyimpan..." : "Simpan Diskon"}
                    </button>
                </div>
            </div>

            {/* Backup & Restore */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg">
                            <Database size={20} className="text-cyan-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">
                                Backup & Restore Database
                            </h2>
                            <p className="text-sm text-slate-400">
                                Ekspor atau impor file database SQLite
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-5">
                    {/* Info */}
                    <div className="flex items-start gap-3 p-3.5 bg-slate-900/60 rounded-lg border border-slate-700/50">
                        <Info
                            size={18}
                            className="text-slate-400 mt-0.5 shrink-0"
                        />
                        <p className="text-xs text-slate-400 leading-relaxed">
                            <strong className="text-slate-300">Backup</strong>{" "}
                            akan menyimpan salinan database ke lokasi yang Anda
                            pilih.{" "}
                            <strong className="text-slate-300">Import</strong>{" "}
                            akan menggantikan seluruh data saat ini dengan file
                            yang dipilih — aplikasi akan restart otomatis.
                        </p>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3">
                        {/* Backup Button */}
                        <button
                            onClick={handleBackup}
                            disabled={backingUp}
                            className="flex items-center gap-2.5 px-5 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-cyan-500/10"
                        >
                            {backingUp ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Download size={16} />
                            )}
                            {backingUp
                                ? "Membuat Backup..."
                                : "Backup Database"}
                        </button>

                        {/* Import Button */}
                        <button
                            onClick={() => setShowImportConfirm(true)}
                            disabled={importing}
                            className="flex items-center gap-2.5 px-5 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 shadow-lg shadow-amber-500/10"
                        >
                            {importing ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Upload size={16} />
                            )}
                            {importing
                                ? "Mengimpor..."
                                : "Import Database"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Import Confirmation Modal */}
            {showImportConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div
                        className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl max-w-md w-full overflow-hidden"
                        style={{ animation: "slideUp 0.25s ease-out" }}
                    >
                        <div className="p-6 space-y-4">
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div className="p-3 bg-amber-500/10 rounded-full">
                                    <AlertTriangle
                                        size={32}
                                        className="text-amber-400"
                                    />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-slate-100 text-center">
                                Import Database?
                            </h3>

                            {/* Warning Message */}
                            <div className="p-3.5 bg-amber-500/5 border border-amber-600/30 rounded-lg">
                                <p className="text-sm text-amber-200/90 text-center leading-relaxed">
                                    <strong>Perhatian:</strong> Seluruh data
                                    yang ada saat ini akan{" "}
                                    <strong>digantikan</strong> dengan data dari
                                    file yang diimpor. Proses ini tidak dapat
                                    dibatalkan.
                                </p>
                            </div>

                            <p className="text-xs text-slate-400 text-center">
                                Pastikan Anda sudah membuat backup terlebih
                                dahulu sebelum melanjutkan.
                            </p>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 p-5 pt-0">
                            <button
                                onClick={() => setShowImportConfirm(false)}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleImport}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm font-medium transition shadow-lg shadow-amber-500/20"
                            >
                                <Upload size={16} />
                                Ya, Import
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast.show && (
                <div
                    className="fixed bottom-6 right-6 z-50"
                    style={{ animation: "slideUp 0.3s ease-out" }}
                >
                    <div
                        className={`rounded-xl shadow-2xl p-4 flex items-center gap-3 max-w-md ${toast.type === "success"
                            ? "bg-slate-800 border border-green-600/50"
                            : "bg-slate-800 border border-red-600/50"
                            }`}
                    >
                        <div
                            className={`p-1.5 rounded-lg ${toast.type === "success"
                                ? "bg-green-500/20"
                                : "bg-red-500/20"
                                }`}
                        >
                            {toast.type === "success" ? (
                                <CheckCircle
                                    size={18}
                                    className="text-green-400"
                                />
                            ) : (
                                <XCircle
                                    size={18}
                                    className="text-red-400"
                                />
                            )}
                        </div>
                        <p className="text-sm font-medium text-slate-200">
                            {toast.message}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
