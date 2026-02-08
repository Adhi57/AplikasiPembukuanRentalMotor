import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FormCard, FormGroup, Label, Input, Textarea } from '../../ui/Form';
import Button from '../../ui/Button';
import { Save } from 'lucide-react';

export interface PenyewaFormData {
    nama: string;
    no_hp: string;
    no_ktp: string;
    alamat: string;
}

interface PenyewaFormProps {
    initialData?: PenyewaFormData;
    onSubmit: (data: PenyewaFormData) => void;
    isLoading?: boolean;
}

const PenyewaForm: React.FC<PenyewaFormProps> = ({ initialData, onSubmit, isLoading }) => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PenyewaFormData>({
        defaultValues: initialData,
    });

    useEffect(() => {
        if (initialData) {
            reset(initialData);
        }
    }, [initialData, reset]);

    return (
        <FormCard
            title={initialData ? 'Edit Penyewa' : 'Tambah Penyewa Baru'}
            description="Lengkapi data diri penyewa dengan benar."
        >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup>
                        <Label required>Nama Lengkap</Label>
                        <Input
                            placeholder="Contoh: Budi Santoso"
                            {...register('nama', { required: 'Nama wajib diisi' })}
                            error={errors.nama?.message}
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label required>NIK / KTP</Label>
                        <Input
                            placeholder="16 digit angka"
                            {...register('no_ktp', {
                                required: 'No. KTP wajib diisi',
                                pattern: { value: /^\d{16}$/, message: 'No. KTP harus 16 digit angka' }
                            })}
                            error={errors.no_ktp?.message}
                        />
                    </FormGroup>
                </div>

                <FormGroup>
                    <Label required>Nomor Telepon</Label>
                    <Input
                        type="tel"
                        placeholder="Contoh: 08123456789"
                        {...register('no_hp', { required: 'Nomor HP wajib diisi' })}
                        error={errors.no_hp?.message}
                    />
                </FormGroup>

                <FormGroup>
                    <Label required>Alamat Lengkap</Label>
                    <Textarea
                        rows={3}
                        placeholder="Masukkan alamat lengkap sesuai KTP..."
                        {...register('alamat', { required: 'Alamat wajib diisi' })}
                        error={errors.alamat?.message}
                    />
                </FormGroup>

                <div className="pt-4 flex justify-end">
                    <Button
                        type="submit"
                        loading={isLoading}
                        label={initialData ? 'Simpan Perubahan' : 'Simpan Data'}
                        icon={<Save size={18} />}
                        className="w-full md:w-auto"
                    />
                </div>
            </form>
        </FormCard>
    );
};

export default PenyewaForm;
