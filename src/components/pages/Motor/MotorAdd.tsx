import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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
            // Prepare payload
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
            <div className="flex items-center gap-4">
                <Link
                    to="/motor"
                    className="p-2 hover:bg-slate-800 rounded-lg transition text-slate-400 hover:text-slate-100"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-100">Tambah Armada</h1>
                    <p className="text-slate-500 text-sm">Daftarkan motor baru ke sistem inventaris</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <MotorEntryForm onSubmit={handleSubmit} isLoading={loading} />
            </div>
        </div>
    );
}
