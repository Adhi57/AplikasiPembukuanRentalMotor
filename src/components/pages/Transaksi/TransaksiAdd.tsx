import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import TransaksiForm, { TransaksiFormData } from "./TransaksiForm";
import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService } from "../../../services/penyewa.service";

export default function TransaksiAdd() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [motors, setMotors] = useState<Motor[]>([]);
    const [penyewas, setPenyewas] = useState<Penyewa[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [m, p] = await Promise.all([
                    getMotor(),
                    PenyewaService.getAll()
                ]);
                setMotors(m);
                setPenyewas(p);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (data: TransaksiFormData) => {
        setLoading(true);
        try {
            await invoke("create_transaksi", { data: { ...data, transaksi_id: 0 } });
            navigate("/transaksi");
        } catch (error) {
            console.error("Failed to save transaksi:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className=" space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    to="/transaksi"
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Tambah Transaksi Baru</h1>
                    <p className="text-slate-500">Isi form di bawah ini untuk mendaftarkan transaksi baru</p>
                </div>
            </div>
            <div className="max-w-4xl mx-auto">
                <TransaksiForm
                    onSubmit={handleSubmit}
                    isLoading={loading}
                    motors={motors}
                    penyewas={penyewas}
                />
            </div>
        </div>
    );
}
