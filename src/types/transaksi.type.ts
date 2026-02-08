export interface Transaksi {
    transaksi_id: number;
    motor_id: number;
    penyewa_id: number;
    tanggal_sewa: string;
    tanggal_kembali_rencana: string;
    tanggal_kembali_aktual?: string | null;
    hari_terlambat?: number | null;
    total_bayar?: number | null;
    status: string;
    denda?: number | null;
}