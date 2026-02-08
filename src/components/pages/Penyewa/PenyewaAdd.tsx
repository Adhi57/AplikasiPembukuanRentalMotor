import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import PenyewaForm, { PenyewaFormData } from "./PenyewaForm";

export default function PenyewaAdd() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (data: PenyewaFormData) => {
        setLoading(true);
        try {

            // Backend expects 'penyewa_id' in the struct, even if ignored by DB for insert
            const payload = { ...data, penyewa_id: 0 };
            await invoke("create_penyewa", { data: payload });
            console.log("Submitting data:", data);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            navigate("/penyewa");
        } catch (error) {
            console.error("Failed to save penyewa:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className=" space-y-6">
            <div className="flex items-center gap-4">
                <Link
                    to="/penyewa"
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Tambah Penyewa Baru</h1>
                    <p className="text-slate-500">Isi form di bawah ini untuk mendaftarkan penyewa baru</p>
                </div>
            </div>
            <div className="max-w-4xl mx-auto">
                <PenyewaForm onSubmit={handleSubmit} isLoading={loading} />
            </div>
        </div>
    );
}
