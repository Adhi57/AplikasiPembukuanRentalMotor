export interface BuktiPelunasan {
    bukti_id: number;
    transaksi_id: number;
    tanggal_bayar: string;
    jumlah_bayar: number;
    metode_bayar: string;
    foto_bukti: string;
}

export interface BuktiPelunasanFormData {
    bukti_id?: number;
    transaksi_id: number;
    tanggal_bayar: string;
    jumlah_bayar: number;
    metode_bayar: string;
    foto_bukti: string;
}