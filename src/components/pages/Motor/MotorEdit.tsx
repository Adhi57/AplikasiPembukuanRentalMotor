import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft } from "lucide-react";
import MotorEntryForm from "./MotorEntryForm";
import { MotorFormData, Motor } from "@/types/motor.type";
import { updateMotor } from "@/services/motor.service";

export default function MotorEdit() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [motor, setMotor] = useState<MotorFormData | null>(null);

    useEffect(() => {
        const fetchMotorData = async () => {
            try {
                const data = await invoke<MotorFormData>("get_motor_by_id", { id: parseInt(id!) });
                setMotor(data);
            } catch (error) {
                console.error("Failed to fetch motor:", error);
                alert("Gagal mengambil data motor");
            } finally {
                setFetching(false);
            }
        };
        fetchMotorData();
    }, [id]);

    const handleSubmit = async (data: MotorFormData) => {
        setLoading(true);
        try {
            await updateMotor(parseInt(id!), data as Motor);
            navigate("/motor");
        } catch (error) {
            console.error("Failed to save motor:", error);
            alert("Gagal memperbarui data motor");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-slate-400">Memuat data motor...</p>
            </div>
        );
    }

    if (!motor) return <div className="p-8 text-center text-rose-500 font-bold">Data motor tidak ditemukan</div>;

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
                    <h1 className="text-2xl font-bold text-slate-100">Edit Armada</h1>
                    <p className="text-slate-500 text-sm">Perbarui informasi kendaraan</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <MotorEntryForm initialData={motor} onSubmit={handleSubmit} isLoading={loading} />
            </div>
        </div>
    );
}