import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FormCard, FormGroup, Label, Input, Select } from '../../ui/Form';
import Button from '../../ui/Button';
import { Save, Upload, AlertTriangle, Camera, Tag } from 'lucide-react';
import { Transaksi } from '../../../types/transaksi.type';
import { Motor } from '../../../types/motor.type';
import { Penyewa } from '../../../types/penyewa.type';
import { invoke } from '@tauri-apps/api/core';
import { convertFileSrc } from '@tauri-apps/api/core';

export type TransaksiFormData = Omit<Transaksi, 'transaksi_id'>;

interface DiskonInfo {
    aktif: boolean;
    persen: number;
    mulai: string;
    berakhir: string;
}

interface TransaksiFormProps {
    initialData?: TransaksiFormData;
    onSubmit: (data: TransaksiFormData) => void;
    isLoading?: boolean;
    motors: Motor[];
    penyewas: Penyewa[];
    dendaPerHari: number;
    diskonInfo?: DiskonInfo;
}

const TransaksiForm: React.FC<TransaksiFormProps> = ({ initialData, onSubmit, isLoading, motors, penyewas, dendaPerHari, diskonInfo }) => {
    const [preview, setPreview] = useState<string | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [hargaNormal, setHargaNormal] = useState<number>(0);
    const [isDiskonApplied, setIsDiskonApplied] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { errors },
    } = useForm<TransaksiFormData>({
        defaultValues: initialData || {
            status: 'dipinjam',
            tanggal_sewa: new Date().toISOString().split('T')[0],
            total_bayar: 0,
            hari_terlambat: 0,
            denda: 0,
            foto_bukti: '',
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
            if (initialData.foto_bukti) {
                setPreview(convertFileSrc(initialData.foto_bukti));
            }
        }
    }, [initialData, reset]);

    const motorId = watch('motor_id');
    const tanggalSewa = watch('tanggal_sewa');
    const tanggalKembaliRencana = watch('tanggal_kembali_rencana');
    const tanggalKembaliAktual = watch('tanggal_kembali_aktual');
    const fotoBuktiPath = watch('foto_bukti');

    // Auto-calculate total_bayar with discount
    useEffect(() => {
        if (motorId && tanggalSewa && tanggalKembaliRencana) {
            const start = new Date(tanggalSewa);
            const end = new Date(tanggalKembaliRencana);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

            const motor = motors.find(m => m.motor_id === motorId);
            if (motor) {
                const normal = diffDays * motor.harga_harian;
                setHargaNormal(normal);

                let discountApplied = false;
                if (diskonInfo && diskonInfo.aktif && diskonInfo.persen > 0 && diskonInfo.mulai && diskonInfo.berakhir) {
                    if (tanggalSewa >= diskonInfo.mulai && tanggalSewa <= diskonInfo.berakhir) {
                        discountApplied = true;
                    }
                }

                setIsDiskonApplied(discountApplied);
                if (discountApplied && diskonInfo) {
                    const discountNominal = Math.round(normal * diskonInfo.persen / 100);
                    const discounted = normal - discountNominal;
                    setValue('total_bayar', discounted);
                    setValue('diskon', discountNominal);
                } else {
                    setValue('total_bayar', normal);
                    setValue('diskon', 0);
                }
            }
        }
    }, [motorId, tanggalSewa, tanggalKembaliRencana, motors, setValue, diskonInfo]);

    // Auto-calculate denda
    useEffect(() => {
        if (tanggalKembaliAktual && tanggalKembaliRencana) {
            const rencana = new Date(tanggalKembaliRencana);
            const aktual = new Date(tanggalKembaliAktual);
            const diffTime = aktual.getTime() - rencana.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                setValue('hari_terlambat', diffDays);
                setValue('denda', diffDays * dendaPerHari);
                setValue('status', 'terlambat');
            } else {
                setValue('hari_terlambat', 0);
                setValue('denda', 0);
                setValue('status', 'kembali');
            }
        }
    }, [tanggalKembaliAktual, tanggalKembaliRencana, dendaPerHari, setValue]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const reader = new FileReader();
            reader.onload = async () => {
                const base64 = reader.result as string;
                setPreview(base64);
                try {
                    const path = await invoke<string>("save_transaksi_image", { base64 });
                    setValue('foto_bukti', path);
                } catch (err) {
                    console.error("Failed to save image:", err);
                    alert("Gagal mengunggah gambar");
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            console.error("File reading error:", err);
        } finally {
            setUploadingImage(false);
        }
    };

    const hariTerlambat = watch('hari_terlambat');
    const dendaValue = watch('denda');

    return (
        <FormCard
            title={initialData ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            description="Lengkapi data transaksi dengan benar."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup>
                        <Label required>Motor</Label>
                        <Select
                            {...register('motor_id', { required: 'Motor wajib dipilih', valueAsNumber: true })}
                            error={errors.motor_id?.message}
                        >
                            <option value="">Pilih Motor</option>
                            {motors.map((m) => (
                                <option key={m.motor_id} value={m.motor_id}>
                                    {m.nama} - {m.plat}
                                </option>
                            ))}
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label required>Penyewa</Label>
                        <Select
                            {...register('penyewa_id', { required: 'Penyewa wajib dipilih', valueAsNumber: true })}
                            error={errors.penyewa_id?.message}
                        >
                            <option value="">Pilih Penyewa</option>
                            {penyewas.map((p) => (
                                <option key={p.penyewa_id} value={p.penyewa_id}>
                                    {p.nama}
                                </option>
                            ))}
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label required>Tanggal Sewa</Label>
                        <Input
                            type="date"
                            {...register('tanggal_sewa', { required: 'Tanggal Sewa wajib diisi' })}
                            error={errors.tanggal_sewa?.message}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label required>Rencana Kembali</Label>
                        <Input
                            type="date"
                            {...register('tanggal_kembali_rencana', { required: 'Rencana Kembali wajib diisi' })}
                            error={errors.tanggal_kembali_rencana?.message}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label required>Status</Label>
                        <Select
                            {...register('status', { required: 'Status wajib diisi' })}
                            error={errors.status?.message}
                        >
                            <option value="dipinjam">Dipinjam</option>
                            <option value="kembali">Kembali</option>
                            <option value="terlambat">Terlambat</option>
                        </Select>
                    </FormGroup>

                    <FormGroup>
                        <Label>Total Bayar</Label>
                        <Input
                            type="number"
                            {...register('total_bayar', { valueAsNumber: true })}
                            error={errors.total_bayar?.message}
                        />
                        {isDiskonApplied && diskonInfo && hargaNormal > 0 && (
                            <div className="mt-2 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                <div className="flex items-center gap-2 mb-1">
                                    <Tag size={14} className="text-purple-400" />
                                    <span className="text-xs font-semibold text-purple-400">DISKON {diskonInfo.persen}%</span>
                                </div>
                                <p className="text-xs text-slate-400">
                                    <span className="line-through text-slate-500">Rp {hargaNormal.toLocaleString('id-ID')}</span>
                                    {' → '}
                                    <span className="text-green-400 font-semibold">Rp {Math.round(hargaNormal * (100 - diskonInfo.persen) / 100).toLocaleString('id-ID')}</span>
                                    <span className="text-slate-500 ml-1">(hemat Rp {Math.round(hargaNormal * diskonInfo.persen / 100).toLocaleString('id-ID')})</span>
                                </p>
                            </div>
                        )}
                    </FormGroup>
                </div>

                {/* Pengembalian & Denda Section */}
                <div className="border border-slate-700 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-400" />
                        Pengembalian & Denda
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormGroup>
                            <Label>Tanggal Kembali Aktual</Label>
                            <Input
                                type="date"
                                {...register('tanggal_kembali_aktual')}
                                error={errors.tanggal_kembali_aktual?.message}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Hari Terlambat</Label>
                            <Input
                                type="number"
                                {...register('hari_terlambat', { valueAsNumber: true })}
                                readOnly
                                className="bg-slate-900/50 cursor-not-allowed"
                            />
                            {typeof hariTerlambat === 'number' && hariTerlambat > 0 && (
                                <p className="text-xs text-amber-400 mt-1">
                                    Terlambat {hariTerlambat} hari × Rp {dendaPerHari.toLocaleString('id-ID')}/hari
                                </p>
                            )}
                        </FormGroup>

                        <FormGroup>
                            <Label>Denda</Label>
                            <Input
                                type="number"
                                {...register('denda', { valueAsNumber: true })}
                                readOnly
                                className="bg-slate-900/50 cursor-not-allowed"
                            />
                            {typeof dendaValue === 'number' && dendaValue > 0 && (
                                <p className="text-xs text-red-400 mt-1 font-semibold">
                                    Total Denda: Rp {dendaValue.toLocaleString('id-ID')}
                                </p>
                            )}
                        </FormGroup>
                    </div>
                </div>

                {/* Foto Bukti Section */}
                <div className="border border-slate-700 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                        <Camera size={16} className="text-blue-400" />
                        Foto Bukti Transaksi
                    </h3>
                    <div className="flex flex-col gap-4">
                        {preview && (
                            <div className="relative w-64 h-48 rounded-lg overflow-hidden border border-slate-600">
                                <img src={preview} alt="Preview Bukti" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition text-sm">
                                <Upload size={18} />
                                {fotoBuktiPath ? 'Ganti Foto' : 'Pilih Foto'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />
                            </label>
                            {fotoBuktiPath && <span className="text-xs text-slate-400 truncate max-w-[250px]">{fotoBuktiPath}</span>}
                        </div>
                    </div>
                    <input type="hidden" {...register('foto_bukti')} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="submit"
                        loading={isLoading || uploadingImage}
                        icon={<Save size={18} />}
                        label={initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                    />
                </div>
            </form>
        </FormCard>
    );
};

export default TransaksiForm;
