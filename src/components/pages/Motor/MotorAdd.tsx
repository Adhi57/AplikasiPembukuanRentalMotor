import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Bike, Info, Camera } from "lucide-react";
import { Link } from "react-router-dom";
import MotorEntryForm from "./MotorEntryForm";
import { MotorFormData, Motor } from "@/types/motor.type";
import { createMotor } from "@/services/motor.service";

export default function MotorAdd() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: MotorFormData) => {
        setLoading(true);
        try {
            const payload = { ...data, motor_id: 0 };
            await createMotor(payload as Motor);
            navigate("/motor");
        } catch (error) {
            console.error("Failed to save motor:", error);
            alert("Gagal menambahkan motor: " + error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/motor"
                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400 hover:text-slate-100"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Tambah Armada</h1>
                    <p className="text-slate-500 text-sm">Daftarkan motor baru ke sistem inventaris</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                    <MotorEntryForm onSubmit={handleSubmit} isLoading={loading} />
                </div>

                {/* Info Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                        <h3 className="text-slate-200 font-semibold mb-3 flex items-center gap-2">
                            <Info size={16} className="text-blue-400" />
                            Panduan Pengisian
                        </h3>
                        <div className="space-y-3 text-sm text-slate-400">
                            <div className="flex items-start gap-2">
                                <Bike size={14} className="mt-0.5 shrink-0 text-slate-500" />
                                <span>Masukkan nama motor lengkap beserta merek, contoh: <span className="text-slate-300">Yamaha NMAX 155</span></span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
                                <span>Plat nomor harus sesuai STNK yang berlaku</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <Camera size={14} className="mt-0.5 shrink-0 text-slate-500" />
                                <span>Upload foto motor untuk identifikasi visual</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                        <h3 className="text-slate-200 font-semibold mb-3">Status Motor</h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                                <span className="text-slate-400"><span className="text-slate-300">Tersedia</span> — siap disewakan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                <span className="text-slate-400"><span className="text-slate-300">Disewa</span> — sedang digunakan</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                <span className="text-slate-400"><span className="text-slate-300">Perbaikan</span> — dalam perawatan</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
