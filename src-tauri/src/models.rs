use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Motor {
    pub motor_id: i32,
    pub nama: String,
    pub plat: String,
    pub tipe_motor: String,
    pub tahun: String,
    pub harga_harian: i32,
    pub foto: String,
    pub status: String,
}

#[derive(Serialize, Deserialize)]
pub struct Penyewa {
    pub penyewa_id: i32,
    pub nama: String,
    pub no_hp: String,
    pub no_ktp: String,
    pub alamat: String,
}

#[derive(Serialize, Deserialize)]
pub struct Transaksi {
    pub transaksi_id: i32,
    pub motor_id: i32,
    pub penyewa_id: i32,
    pub tanggal_sewa: String,
    pub tanggal_kembali_rencana: String,
    pub tanggal_kembali_aktual: Option<String>,
    pub hari_terlambat: Option<i32>,
    pub total_bayar: Option<i64>,
    pub status: String,
    pub denda: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct BuktiPelunasan {
    pub bukti_id: i32,
    pub transaksi_id: i32,
    pub tanggal_bayar: String,
    pub jumlah_bayar: i64,
    pub metode_bayar: String,
    pub foto_bukti: String,
}
