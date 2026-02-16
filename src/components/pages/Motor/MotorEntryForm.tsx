import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { invoke } from '@tauri-apps/api/core';
import { MotorFormData } from '@/types/motor.type';
import { FormCard, FormGroup, Label, Input } from '@/components/ui/Form';
import Button from '@/components/ui/Button';
import { Save, Upload } from 'lucide-react';

interface MotorFormProps {
  initialData?: MotorFormData;
  onSubmit: (data: MotorFormData) => void;
  isLoading?: boolean;
}

const MotorEntryForm: React.FC<MotorFormProps> = ({ initialData, onSubmit, isLoading }) => {
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MotorFormData>({
    defaultValues: initialData || {
      status: 'tersedia',
      tahun: new Date().getFullYear().toString(),
      harga_harian: 0,
      foto: '',
    },
  });

  const fotoPath = watch('foto');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    }
  }, [initialData, reset]);

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
          const path = await invoke<string>("save_motor_image", { base64 });
          setValue('foto', path);
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

  return (
    <FormCard
      title={initialData ? 'Edit Motor' : 'Tambah Motor Baru'}
      description="Lengkapi data motor dengan benar."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <Label required>Nama Motor</Label>
            <Input
              placeholder="Contoh: Yamaha NMAX"
              {...register('nama', { required: 'Nama motor wajib diisi' })}
              error={errors.nama?.message}
            />
          </FormGroup>

          <FormGroup>
            <Label required>Plat Nomor</Label>
            <Input
              placeholder="Contoh: B 1234 ABC"
              {...register('plat', { required: 'Plat nomor wajib diisi' })}
              error={errors.plat?.message}
            />
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <Label required>Tipe Motor</Label>
            <Input
              placeholder="Contoh: Matic"
              {...register('tipe_motor', { required: 'Tipe motor wajib diisi' })}
              error={errors.tipe_motor?.message}
            />
          </FormGroup>

          <FormGroup>
            <Label required>Tahun Motor</Label>
            <Input
              type="number"
              placeholder="Contoh: 2022"
              {...register('tahun', { required: 'Tahun motor wajib diisi' })}
              error={errors.tahun?.message}
            />
          </FormGroup>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup>
            <Label required>Harga Harian</Label>
            <Input
              type="number"
              placeholder="Contoh: 100000"
              {...register('harga_harian', { required: 'Harga harian wajib diisi', valueAsNumber: true })}
              error={errors.harga_harian?.message}
            />
          </FormGroup>

          <FormGroup>
            <Label required>Status</Label>
            <select
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('status', { required: 'Status wajib diisi' })}
            >
              <option value="tersedia">Tersedia</option>
              <option value="disewa">Disewa</option>
              <option value="perbaikan">Perbaikan</option>
            </select>
            {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status.message}</p>}
          </FormGroup>
        </div>

        <FormGroup>
          <Label required>Foto Motor</Label>
          <div className="flex flex-col gap-4">
            {preview && (
              <div className="relative w-48 h-48 rounded-lg overflow-hidden border border-slate-600">
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer transition text-sm">
                <Upload size={18} />
                {fotoPath ? 'Ganti Foto' : 'Pilih Foto'}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {fotoPath && <span className="text-xs text-slate-400 truncate max-w-[200px]">{fotoPath}</span>}
            </div>
          </div>
          <input type="hidden" {...register('foto', { required: 'Foto motor wajib diunggah' })} />
          {errors.foto && <p className="text-red-500 text-xs mt-1">{errors.foto.message}</p>}
        </FormGroup>

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            loading={isLoading || uploadingImage}
            label={initialData ? 'Simpan Perubahan' : 'Simpan Data'}
            icon={<Save size={18} />}
            className="w-full md:w-auto"
          />
        </div>
      </form>
    </FormCard>
  );
};

export default MotorEntryForm;
