import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";

import Button from "../../ui/Button";
import Input from "../../ui/Input";

export default function PengeluaranRentalAdd() {
    const navigate = useNavigate();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        tanggal: new Date().toISOString().slice(0, 10),
        jenis: "",
        nominal: "",
        keterangan: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            setSubmitting(true);

            await invoke("create_pengeluaran_rental", {
                data: {
                    pengeluaran_id: 0,
                    tanggal: formData.tanggal,
                    jenis: formData.jenis,
                    nominal: parseFloat(formData.nominal),
                    keterangan: formData.keterangan,
                },
            });

            navigate("/pengeluaran_rental");
        } catch (err) {
            console.error("Failed to create data:", err);
            setError("Gagal menyimpan data");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    to="/pengeluaran_rental"
                    className="p-2 hover:bg-slate-700 rounded-lg transition text-slate-400"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-200">Tambah Pengeluaran Rental</h1>
                    <p className="text-slate-500">Input pengeluaran baru</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Tanggal Pengeluaran"
                            type="date"
                            name="tanggal"
                            value={formData.tanggal}
                            onChange={handleChange}
                            required
                        />

                        <Input
                            label="Jenis Pengeluaran"
                            name="jenis"
                            value={formData.jenis}
                            onChange={handleChange}
                            placeholder="Contoh: Bensin, Parkir, Cuci Motor"
                            required
                        />

                        <Input
                            label="Nominal (Rp)"
                            type="number"
                            name="nominal"
                            value={formData.nominal}
                            onChange={handleChange}
                            placeholder="Contoh: 50000"
                            required
                        />

                        <Input
                            label="Keterangan"
                            name="keterangan"
                            value={formData.keterangan}
                            onChange={handleChange}
                            placeholder="Deskripsi singkat pengeluaran"
                        />

                        {error && <p className="text-red-400 text-sm">{error}</p>}

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                label={submitting ? "Menyimpan..." : "Simpan Pengeluaran"}
                                variant="primary"
                                disabled={submitting}
                                loading={submitting}
                            />
                            <Button
                                type="button"
                                label="Batal"
                                variant="secondary"
                                onClick={() => navigate("/pengeluaran_rental")}
                            />
                        </div>
                    </form>
                </div>

                {/* Info Panel */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                        <h3 className="text-slate-300 font-semibold mb-3">Informasi</h3>
                        <div className="space-y-2 text-sm text-slate-400">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>Tanggal: Hari ini otomatis</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign size={14} />
                                <span>Nominal: Masukkan jumlah</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
