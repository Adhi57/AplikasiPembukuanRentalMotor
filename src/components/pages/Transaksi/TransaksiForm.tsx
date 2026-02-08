import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormCard, FormGroup, Label, Input, Select } from '../../ui/Form';
import Button from '../../ui/Button';
import { Save } from 'lucide-react';
import { Transaksi } from '../../../types/transaksi.type';
import { Motor } from '../../../types/motor.type';
import { Penyewa } from '../../../types/penyewa.type';

export type TransaksiFormData = Omit<Transaksi, 'transaksi_id'>;

interface TransaksiFormProps {
    initialData?: TransaksiFormData;
    onSubmit: (data: TransaksiFormData) => void;
    isLoading?: boolean;
    motors: Motor[];
    penyewas: Penyewa[];
}

const TransaksiForm: React.FC<TransaksiFormProps> = ({ initialData, onSubmit, isLoading, motors, penyewas }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TransaksiFormData>({
        defaultValues: initialData || {
            status: 'dipinjam',
            tanggal_sewa: new Date().toISOString().split('T')[0],
            total_bayar: 0,
            hari_terlambat: 0,
            denda: 0
        },
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

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
                    </FormGroup>

                    {initialData && (
                        <>
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
                                    error={errors.hari_terlambat?.message}
                                />
                            </FormGroup>

                            <FormGroup>
                                <Label>Denda</Label>
                                <Input
                                    type="number"
                                    {...register('denda', { valueAsNumber: true })}
                                    error={errors.denda?.message}
                                />
                            </FormGroup>
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        type="submit"
                        loading={isLoading}
                        icon={<Save size={18} />}
                        label={initialData ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                    />
                </div>
            </form>
        </FormCard>
    );
};

export default TransaksiForm;
