import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import { ArrowLeft } from "lucide-react";
import PenyewaForm, { PenyewaFormData } from "./PenyewaForm";

interface Penyewa {
    penyewa_id: number;
    nama: string;
    no_hp: string;
    no_ktp: string;
    alamat: string;
}




export default function PenyewaEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [initialData, setInitialData] = useState<PenyewaFormData | undefined>(undefined);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetchPenyewa();
    }, [id]);

    const fetchPenyewa = async () => {
        setFetching(true);
        try {
            const result = await invoke<Penyewa>("get_penyewa_by_id", { id: Number(id) });

            // Map result to form data format
            const formData: PenyewaFormData = {
                nama: result.nama,
                no_ktp: result.no_ktp,
                no_hp: result.no_hp,
                alamat: result.alamat,
            };
            setInitialData(formData);

        } catch (error) {
            console.error("Failed to fetch penyewa:", error);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (data: PenyewaFormData) => {
        setLoading(true);
        try {
            // Re-map form data to backend model if needed
            const payload = {
                penyewa_id: Number(id),
                nama: data.nama,
                no_hp: data.no_hp,
                no_ktp: data.no_ktp,
                alamat: data.alamat,
            };

            await invoke("update_penyewa", { id: Number(id), data: payload });

            navigate("/penyewa");
        } catch (error) {
            console.error("Failed to update penyewa:", error);
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
                    to="/penyewa"
                    className="p-2 hover:bg-slate-100 rounded-lg transition text-slate-600"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Edit Penyewa</h1>
                    <p className="text-slate-500">Perbarui data penyewa</p>
                </div>
            </div>

            <PenyewaForm
                initialData={initialData}
                onSubmit={handleSubmit}
                isLoading={loading}
            />
        </div>
    );
}
