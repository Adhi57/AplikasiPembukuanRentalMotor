import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Lock, Key, CheckCircle, Copy, AlertCircle, RefreshCw } from "lucide-react";
import { relaunch } from "@tauri-apps/plugin-process";

export default function Activation() {
    const [machineId, setMachineId] = useState<string>("");
    const [licenseKey, setLicenseKey] = useState("");
    const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
    const [message, setMessage] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchMachineId();
    }, []);

    const fetchMachineId = async () => {
        try {
            const id = await invoke<string>("get_machine_id");
            setMachineId(id);
        } catch (err) {
            console.error("Failed to get machine ID:", err);
            setMessage("Gagal mengambil Machine ID. Pastikan aplikasi berjalan dengan izin yang cukup.");
        }
    };

    const handleActivate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!licenseKey.trim()) return;

        setStatus("verifying");
        setMessage("");

        try {
            const isValid = await invoke<boolean>("activate_license", { key: licenseKey });

            if (isValid) {
                setStatus("success");
                setMessage("Lisensi valid! Aplikasi akan dimuat ulang...");
                setTimeout(() => {
                    relaunch();
                }, 2000);
            } else {
                setStatus("error");
                setMessage("Kunci lisensi tidak valid untuk mesin ini.");
            }
        } catch (err) {
            console.error("Activation failed:", err);
            setStatus("error");
            setMessage("Terjadi kesalahan saat verifikasi.");
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(machineId);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-slate-900/50 p-6 text-center border-b border-slate-700">
                    <div className="mx-auto w-16 h-16 bg-blue-600/20 rounded-full flex items-center justify-center mb-4">
                        <Lock size={32} className="text-blue-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Aktivasi Aplikasi</h1>
                    <p className="text-slate-400 text-sm">
                        Masukkan kunci lisensi untuk menggunakan aplikasi ini di komputer Anda.
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Machine ID Display */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Machine ID Anda
                        </label>
                        <div className="flex gap-2">
                            <code className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-3 text-emerald-400 font-mono text-sm break-all">
                                {machineId || "Memuat ID..."}
                            </code>
                            <button
                                onClick={copyToClipboard}
                                className="bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 rounded-lg px-3 transition"
                                title="Salin ID"
                            >
                                {copied ? <CheckCircle size={18} className="text-emerald-400" /> : <Copy size={18} />}
                            </button>
                        </div>
                        <p className="text-xs text-slate-500">
                            Kirim ID ini ke admin untuk mendapatkan kunci lisensi.
                        </p>
                    </div>

                    {/* Activation Form */}
                    <form onSubmit={handleActivate} className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="license" className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Masukkan License Key
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Key size={18} />
                                </span>
                                <input
                                    id="license"
                                    type="text"
                                    value={licenseKey}
                                    onChange={(e) => setLicenseKey(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="Tempel kunci lisensi di sini..."
                                    disabled={status === "verifying" || status === "success"}
                                />
                            </div>
                        </div>

                        {/* Status Messages */}
                        {status === "error" && (
                            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 p-3 rounded-lg border border-red-900/50">
                                <AlertCircle size={16} />
                                {message}
                            </div>
                        )}
                        {status === "success" && (
                            <div className="flex items-center gap-2 text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded-lg border border-emerald-900/50">
                                <CheckCircle size={16} />
                                {message}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={status === "verifying" || status === "success" || !licenseKey}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            {status === "verifying" ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin" /> Memverifikasi...
                                </>
                            ) : (
                                "Aktifkan Aplikasi"
                            )}
                        </button>
                    </form>
                </div>

                <div className="bg-slate-900/50 p-4 border-t border-slate-700 text-center">
                    <p className="text-xs text-slate-500">
                        &copy; {new Date().getFullYear()} Aplikasi Rental Motor. Protected System.
                    </p>
                </div>
            </div>
        </div>
    );
}
