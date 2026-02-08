import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft } from "lucide-react";
import TransaksiForm, { TransaksiFormData } from "./TransaksiForm";
import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { Transaksi } from "../../../types/transaksi.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService } from "../../../services/penyewa.service";

export default function TransaksiEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<TransaksiFormData | undefined>(undefined);
    const [fetching, setFetching] = useState(true);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setFetching(true);
        try {
            const [m, p, result] = await Promise.all([
                getMotor(),
                PenyewaService.getAll(),
                invoke<Transaksi>("get_transaksi_by_id", { id: Number(id) })
            ]);

            setMotors(m);
            setPenyewas(p);

            // Map result to form data format
            const { transaksi_id, ...formData } = result;
            setInitialData(formData);

        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (data: TransaksiFormData) => {
        setLoading(true);
        try {
            const payload = {
                ...data,
                transaksi_id: Number(id),
            };

            await invoke("update_transaksi", { id: Number(id), data: payload });
            navigate("/transaksi");
        } catch (error) {
            console.error("Failed to update transaksi:", error);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    to="/transaksi"
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Edit Transaksi</h1>
                    <p className="text-slate-500">Perbarui data transaksi</p>
                </div>
            </div>

            <TransaksiForm
                initialData={initialData}
                onSubmit={handleSubmit}
                isLoading={loading}
                motors={motors}
                penyewas={penyewas}
            />
        </div>
    );
}
