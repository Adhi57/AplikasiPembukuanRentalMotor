use crate::db::get_connection;
use rusqlite::Result;

pub fn init_db() -> Result<()> {
    let conn = get_connection()?;

    conn.execute_batch(
        "
        CREATE TABLE IF NOT EXISTS motor (
            motor_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            foto TEXT NOT NULL,
            plat TEXT NOT NULL,
            tipe_motor TEXT NOT NULL,
            tahun TEXT NOT NULL,
            harga_harian INTEGER NOT NULL,
            status TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS penyewa (
            penyewa_id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            no_hp TEXT NOT NULL,
            no_ktp TEXT NOT NULL,
            alamat TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS transaksi (
            transaksi_id INTEGER PRIMARY KEY AUTOINCREMENT,
            motor_id INTEGER,
            penyewa_id INTEGER,
            tanggal_sewa TEXT,
            tanggal_kembali_rencana TEXT,
            tanggal_kembali_aktual TEXT,
            hari_terlambat INTEGER,
            total_bayar INTEGER,
            status TEXT,
            denda INTEGER DEFAULT 0
        );

        CREATE TABLE IF NOT EXISTS pembukuan (
            pembukuan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id,
            tanggal TEXT,
            jenis TEXT,
            nominal INTEGER,
            keterangan TEXT
        );

        CREATE TABLE IF NOT EXISTS user (
            user_id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            nama TEXT NOT NULL,
            role TEXT NOT NULL DEFAULT 'admin',
            created_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS pengaturan (
            pengaturan_id INTEGER PRIMARY KEY AUTOINCREMENT,
            key TEXT NOT NULL UNIQUE,
            value TEXT NOT NULL,
            keterangan TEXT
        );

        CREATE TABLE IF NOT EXISTS bukti_pelunasan (
            bukti_id INTEGER PRIMARY KEY AUTOINCREMENT,
            transaksi_id INTEGER,
            tanggal_bayar TEXT,
            jumlah_bayar INTEGER,
            metode_bayar TEXT,
            foto_bukti TEXT
        );

        CREATE TABLE IF NOT EXISTS pengeluaran_rental (
            pengeluaran_id INTEGER PRIMARY KEY AUTOINCREMENT,
            tanggal TEXT,
            jenis TEXT,
            nominal INTEGER,
            keterangan TEXT
        );

        ",
    )?;

    // Migration: add foto_bukti column if not exists
    let _ = conn.execute(
        "ALTER TABLE transaksi ADD COLUMN foto_bukti TEXT DEFAULT ''",
        [],
    );

    // Migration: add sumber_dana to pengeluaran_rental
    let _ = conn.execute(
        "ALTER TABLE pengeluaran_rental ADD COLUMN sumber_dana TEXT DEFAULT 'Kas'",
        [],
    );

    // Migration: add keterangan to transaksi
    let _ = conn.execute(
        "ALTER TABLE transaksi ADD COLUMN keterangan TEXT DEFAULT ''",
        [],
    );

    // Migration: add diskon to transaksi
    let _ = conn.execute(
        "ALTER TABLE transaksi ADD COLUMN diskon INTEGER DEFAULT 0",
        [],
    );

    Ok(())
}
