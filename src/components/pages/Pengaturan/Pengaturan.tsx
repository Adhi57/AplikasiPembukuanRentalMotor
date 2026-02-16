import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Settings, Save, CheckCircle, Wallet, AlertTriangle } from "lucide-react";

export default function Pengaturan() {
    const [dendaPerHari, setDendaPerHari] = useState<string>("0");
    const [saldoAwal, setSaldoAwal] = useState<string>("0");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: "" });

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        if (toast.show) {
            const timer = setTimeout(() => setToast({ show: false, message: "" }), 3000);
            return () => clearTimeout(timer);
        }
    }, [toast.show]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const [denda, saldo] = await Promise.all([
                invoke<string>("get_pengaturan", { key: "denda_per_hari" }),
                invoke<string>("get_pengaturan", { key: "saldo_awal" }),
            ]);
            setDendaPerHari(denda || "0");
            setSaldoAwal(saldo || "0");
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

    const saveSetting = async (key: string, value: string, keterangan: string) => {
        try {
            setSaving(key);
            const cleanValue = (parseInt(value.replace(/\D/g, "")) || 0).toString();
            await invoke("set_pengaturan", { key, value: cleanValue, keterangan });
            setToast({ show: true, message: `${keterangan} berhasil disimpan` });
        } catch (err) {
            console.error("Failed to save setting:", err);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-slate-400 animate-pulse">Memuat pengaturan...</div>
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
                    <h1 className="text-2xl font-bold text-slate-100">Pengaturan</h1>
                    <p className="text-sm text-slate-400">Kelola konfigurasi aplikasi</p>
                </div>
            </div>

            {/* Saldo Awal */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <Wallet size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">Saldo Awal Kas</h2>
                            <p className="text-sm text-slate-400">
                                Nilai awal saldo kas sebelum transaksi dicatat
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Saldo Awal (Rp)</label>
                        <div className="relative max-w-sm">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                            <input
                                type="text"
                                value={formatInputCurrency(saldoAwal)}
                                onChange={(e) => setSaldoAwal(e.target.value.replace(/\D/g, ""))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Saldo ini akan ditambahkan sebagai nilai awal pada Buku Kas.</p>
                    </div>
                    <button
                        onClick={() => saveSetting("saldo_awal", saldoAwal, "Saldo Awal")}
                        disabled={saving === "saldo_awal"}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving === "saldo_awal" ? "Menyimpan..." : "Simpan Saldo Awal"}
                    </button>
                </div>
            </div>

            {/* Pengaturan Denda */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 rounded-lg">
                            <AlertTriangle size={20} className="text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-100">Pengaturan Denda</h2>
                            <p className="text-sm text-slate-400">
                                Tarif denda keterlambatan pengembalian motor
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Denda per Hari (Rp)</label>
                        <div className="relative max-w-sm">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Rp</span>
                            <input
                                type="text"
                                value={formatInputCurrency(dendaPerHari)}
                                onChange={(e) => setDendaPerHari(e.target.value.replace(/\D/g, ""))}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-lg font-semibold text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition"
                                placeholder="0"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Denda ini akan dikenakan per hari keterlambatan pengembalian motor.</p>
                    </div>
                    <button
                        onClick={() => saveSetting("denda_per_hari", dendaPerHari, "Denda per Hari")}
                        disabled={saving === "denda_per_hari"}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving === "denda_per_hari" ? "Menyimpan..." : "Simpan Denda"}
                    </button>
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50" style={{ animation: "slideUp 0.3s ease-out" }}>
                    <div className="bg-slate-800 border border-green-600/50 rounded-xl shadow-2xl p-4 flex items-center gap-3">
                        <div className="p-1.5 bg-green-500/20 rounded-lg">
                            <CheckCircle size={18} className="text-green-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-200">{toast.message}</p>
                    </div>
                </div>
            )}
        </div>
    );
}
