use once_cell::sync::Lazy;
use parking_lot::Mutex;
use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;

// Fungsi untuk mendapatkan path database
pub fn get_db_path() -> PathBuf {
    let mut path = PathBuf::from(std::env::var("APPDATA").expect("APPDATA not found"));

    path.push("AplikasiPembukuan");
    fs::create_dir_all(&path).ok();

    path.push("rental_motor.sqlite");

    println!("DB PATH => {:?}", path);

    path
}

// Global database connection dengan Mutex
static DB: Lazy<Mutex<Connection>> = Lazy::new(|| {
    let db_path = get_db_path();

    let conn = Connection::open(&db_path).expect("Failed to open database");

    // Set PRAGMA untuk menghindari lock
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA busy_timeout = 30000;
         PRAGMA temp_store = MEMORY;
         PRAGMA cache_size = -64000;",
    )
    .expect("Failed to set PRAGMA");

    Mutex::new(conn)
});

// Helper function untuk akses database
pub fn with_connection<F, R>(f: F) -> Result<R>
where
    F: FnOnce(&Connection) -> Result<R>,
{
    let conn = DB.lock();
    f(&conn)
}

// Backward compatibility - jika ada kode lain yang masih pakai get_connection
pub fn get_connection() -> Result<Connection> {
    // Untuk migration saja, buat connection baru
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA busy_timeout = 30000;",
    )?;

    Ok(conn)
}

pub fn get_all_motor(conn: &Connection) -> Result<Vec<crate::models::Motor>> {
    let mut stmt = conn.prepare(
        "SELECT motor_id, nama, plat, tipe_motor, tahun, harga_harian, foto, status FROM motor",
    )?;
    let motor_iter = stmt.query_map([], |row| {
        Ok(crate::models::Motor {
            motor_id: row.get(0)?,
            nama: row.get(1)?,
            plat: row.get(2)?,
            tipe_motor: row.get(3)?,
            tahun: row.get(4)?,
            harga_harian: row.get(5)?,
            foto: row.get(6)?,
            status: row.get(7)?,
        })
    })?;

    let mut result = Vec::new();
    for m in motor_iter {
        result.push(m?);
    }
    Ok(result)
}

pub fn create_motor(conn: &Connection, data: crate::models::Motor) -> Result<()> {
    conn.execute(
        "INSERT INTO motor (nama, plat, tipe_motor, tahun, harga_harian, foto, status) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (data.nama, data.plat, data.tipe_motor, data.tahun, data.harga_harian, data.foto, data.status),
    )?;
    Ok(())
}

pub fn get_motor_by_id(conn: &Connection, id: i32) -> Result<crate::models::Motor> {
    let mut stmt = conn.prepare("SELECT motor_id, nama, plat, tipe_motor, tahun, harga_harian, foto, status FROM motor WHERE motor_id = ?1")?;
    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(crate::models::Motor {
            motor_id: row.get(0)?,
            nama: row.get(1)?,
            plat: row.get(2)?,
            tipe_motor: row.get(3)?,
            tahun: row.get(4)?,
            harga_harian: row.get(5)?,
            foto: row.get(6)?,
            status: row.get(7)?,
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_motor(conn: &Connection, id: i32, data: crate::models::Motor) -> Result<()> {
    conn.execute(
        "UPDATE motor SET nama = ?1, plat = ?2, tipe_motor = ?3, tahun = ?4, harga_harian = ?5, foto = ?6, status = ?7 WHERE motor_id = ?8",
        (data.nama, data.plat, data.tipe_motor, data.tahun, data.harga_harian, data.foto, data.status, id),
    )?;
    Ok(())
}

pub fn delete_motor(conn: &Connection, id: i32) -> Result<()> {
    conn.execute("DELETE FROM motor WHERE motor_id = ?1", (id,))?;
    Ok(())
}

pub fn get_all_penyewa(conn: &Connection) -> Result<Vec<crate::models::Penyewa>> {
    let mut stmt = conn.prepare("SELECT penyewa_id, nama, no_hp, no_ktp, alamat FROM penyewa")?;
    let penyewa_iter = stmt.query_map([], |row| {
        Ok(crate::models::Penyewa {
            penyewa_id: row.get(0)?,
            nama: row.get(1)?,
            no_hp: row.get(2)?,
            no_ktp: row.get(3)?,
            alamat: row.get(4)?,
        })
    })?;

    let mut result = Vec::new();
    for p in penyewa_iter {
        result.push(p?);
    }
    Ok(result)
}

pub fn create_penyewa(conn: &Connection, data: crate::models::Penyewa) -> Result<()> {
    conn.execute(
        "INSERT INTO penyewa (nama, no_hp, no_ktp, alamat) VALUES (?1, ?2, ?3, ?4)",
        (data.nama, data.no_hp, data.no_ktp, data.alamat),
    )?;
    Ok(())
}

pub fn get_penyewa_by_id(conn: &Connection, id: i32) -> Result<crate::models::Penyewa> {
    let mut stmt = conn.prepare(
        "SELECT penyewa_id, nama, no_hp, no_ktp, alamat FROM penyewa WHERE penyewa_id = ?1",
    )?;
    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(crate::models::Penyewa {
            penyewa_id: row.get(0)?,
            nama: row.get(1)?,
            no_hp: row.get(2)?,
            no_ktp: row.get(3)?,
            alamat: row.get(4)?,
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_penyewa(conn: &Connection, id: i32, data: crate::models::Penyewa) -> Result<()> {
    conn.execute(
        "UPDATE penyewa SET nama = ?1, no_hp = ?2, no_ktp = ?3, alamat = ?4 WHERE penyewa_id = ?5",
        (data.nama, data.no_hp, data.no_ktp, data.alamat, id),
    )?;
    Ok(())
}

pub fn delete_penyewa(conn: &Connection, id: i32) -> Result<()> {
    conn.execute("DELETE FROM penyewa WHERE penyewa_id = ?1", (id,))?;
    Ok(())
}

pub fn get_all_transaksi(conn: &Connection) -> Result<Vec<crate::models::Transaksi>> {
    let mut stmt = conn.prepare("SELECT transaksi_id, motor_id, penyewa_id, tanggal_sewa, tanggal_kembali_rencana, tanggal_kembali_aktual, hari_terlambat, total_bayar, status, denda, foto_bukti, diskon FROM transaksi")?;
    let transaksi_iter = stmt.query_map([], |row| {
        Ok(crate::models::Transaksi {
            transaksi_id: row.get(0)?,
            motor_id: row.get(1)?,
            penyewa_id: row.get(2)?,
            tanggal_sewa: row.get(3)?,
            tanggal_kembali_rencana: row.get(4)?,
            tanggal_kembali_aktual: row.get(5)?,
            hari_terlambat: row.get(6)?,
            total_bayar: row.get(7)?,
            status: row.get(8)?,
            denda: row.get(9)?,
            foto_bukti: row.get(10)?,
            diskon: row.get(11)?,
        })
    })?;

    let mut result = Vec::new();
    for t in transaksi_iter {
        result.push(t?);
    }
    Ok(result)
}

pub fn create_transaksi(conn: &Connection, data: crate::models::Transaksi) -> Result<()> {
    let motor_id = data.motor_id;

    conn.execute(
        "INSERT INTO transaksi (motor_id, penyewa_id, tanggal_sewa, tanggal_kembali_rencana, tanggal_kembali_aktual, hari_terlambat, total_bayar, status, denda, foto_bukti, diskon) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
        (data.motor_id, data.penyewa_id, data.tanggal_sewa, data.tanggal_kembali_rencana, data.tanggal_kembali_aktual, data.hari_terlambat, data.total_bayar, data.status, data.denda, data.foto_bukti, data.diskon),
    )?;

    // Update motor status to dipinjam
    conn.execute(
        "UPDATE motor SET status = 'dipinjam' WHERE motor_id = ?1",
        (motor_id,),
    )?;

    Ok(())
}

pub fn get_transaksi_by_id(conn: &Connection, id: i32) -> Result<crate::models::Transaksi> {
    let mut stmt = conn.prepare("SELECT transaksi_id, motor_id, penyewa_id, tanggal_sewa, tanggal_kembali_rencana, tanggal_kembali_aktual, hari_terlambat, total_bayar, status, denda, foto_bukti, diskon FROM transaksi WHERE transaksi_id = ?1")?;
    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(crate::models::Transaksi {
            transaksi_id: row.get(0)?,
            motor_id: row.get(1)?,
            penyewa_id: row.get(2)?,
            tanggal_sewa: row.get(3)?,
            tanggal_kembali_rencana: row.get(4)?,
            tanggal_kembali_aktual: row.get(5)?,
            hari_terlambat: row.get(6)?,
            total_bayar: row.get(7)?,
            status: row.get(8)?,
            denda: row.get(9)?,
            foto_bukti: row.get(10)?,
            diskon: row.get(11)?,
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_transaksi(conn: &Connection, id: i32, data: crate::models::Transaksi) -> Result<()> {
    // Get old motor_id before updating
    let old_transaksi = get_transaksi_by_id(conn, id)?;
    let old_motor_id = old_transaksi.motor_id;

    // Extract values we need after the move
    let new_motor_id = data.motor_id;
    let is_kembali = data.status == "kembali";

    conn.execute("UPDATE transaksi SET motor_id = ?1, penyewa_id = ?2, tanggal_sewa = ?3, tanggal_kembali_rencana = ?4, tanggal_kembali_aktual = ?5, hari_terlambat = ?6, total_bayar = ?7, status = ?8, denda = ?9, foto_bukti = ?10, diskon = ?11 WHERE transaksi_id = ?12", (data.motor_id, data.penyewa_id, data.tanggal_sewa, data.tanggal_kembali_rencana, data.tanggal_kembali_aktual, data.hari_terlambat, data.total_bayar, data.status, data.denda, data.foto_bukti, data.diskon, id))?;

    // If motor changed, reset old motor status
    if old_motor_id != new_motor_id {
        conn.execute(
            "UPDATE motor SET status = 'tersedia' WHERE motor_id = ?1",
            (old_motor_id,),
        )?;
    }

    // Update current motor status based on transaction status
    let motor_status = if is_kembali { "tersedia" } else { "dipinjam" };

    conn.execute(
        "UPDATE motor SET status = ?1 WHERE motor_id = ?2",
        (motor_status, new_motor_id),
    )?;

    Ok(())
}

pub fn delete_transaksi(conn: &Connection, id: i32) -> Result<()> {
    // Get motor_id before deleting transaction
    if let Ok(transaksi) = get_transaksi_by_id(conn, id) {
        conn.execute(
            "UPDATE motor SET status = 'tersedia' WHERE motor_id = ?1",
            (transaksi.motor_id,),
        )?;
    }

    conn.execute("DELETE FROM transaksi WHERE transaksi_id = ?1", (id,))?;
    Ok(())
}

pub fn get_all_bukti_pelunasan(conn: &Connection) -> Result<Vec<crate::models::BuktiPelunasan>> {
    let mut stmt = conn.prepare("SELECT bukti_id, transaksi_id, tanggal_bayar, jumlah_bayar, metode_bayar, foto_bukti FROM bukti_pelunasan")?;
    let bukti_iter = stmt.query_map([], |row| {
        Ok(crate::models::BuktiPelunasan {
            bukti_id: row.get(0)?,
            transaksi_id: row.get(1)?,
            tanggal_bayar: row.get(2)?,
            jumlah_bayar: row.get(3)?,
            metode_bayar: row.get(4)?,
            foto_bukti: row.get(5)?,
        })
    })?;

    let mut result = Vec::new();
    for b in bukti_iter {
        result.push(b?);
    }
    Ok(result)
}

pub fn create_bukti_pelunasan(
    conn: &Connection,
    data: crate::models::BuktiPelunasan,
) -> Result<()> {
    conn.execute("INSERT INTO bukti_pelunasan (transaksi_id, tanggal_bayar, jumlah_bayar, metode_bayar, foto_bukti) VALUES (?1, ?2, ?3, ?4, ?5)", (data.transaksi_id, data.tanggal_bayar, data.jumlah_bayar, data.metode_bayar, data.foto_bukti))?;
    Ok(())
}

pub fn get_bukti_pelunasan_by_id(
    conn: &Connection,
    id: i32,
) -> Result<crate::models::BuktiPelunasan> {
    let mut stmt = conn.prepare("SELECT bukti_id, transaksi_id, tanggal_bayar, jumlah_bayar, metode_bayar, foto_bukti FROM bukti_pelunasan WHERE bukti_id = ?1")?;
    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(crate::models::BuktiPelunasan {
            bukti_id: row.get(0)?,
            transaksi_id: row.get(1)?,
            tanggal_bayar: row.get(2)?,
            jumlah_bayar: row.get(3)?,
            metode_bayar: row.get(4)?,
            foto_bukti: row.get(5)?,
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_bukti_pelunasan(
    conn: &Connection,
    id: i32,
    data: crate::models::BuktiPelunasan,
) -> Result<()> {
    conn.execute("UPDATE bukti_pelunasan SET transaksi_id = ?1, tanggal_bayar = ?2, jumlah_bayar = ?3, metode_bayar = ?4, foto_bukti = ?5 WHERE bukti_id = ?6", (data.transaksi_id, data.tanggal_bayar, data.jumlah_bayar, data.metode_bayar, data.foto_bukti, id))?;
    Ok(())
}

pub fn delete_bukti_pelunasan(conn: &Connection, id: i32) -> Result<()> {
    conn.execute("DELETE FROM bukti_pelunasan WHERE bukti_id = ?1", (id,))?;
    Ok(())
}

use base64::prelude::*;
use uuid::Uuid;

pub fn save_bukti_pelunasan_image(base64_data: String) -> Result<String, String> {
    let mut path = get_db_path();
    path.pop(); // Remove rental_motor.sqlite
    path.push("uploads");

    if !path.exists() {
        fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }

    let filename = format!("{}.jpg", Uuid::new_v4());
    path.push(filename);

    // Handle data URI scheme if present (e.g. "data:image/jpeg;base64,...")
    let b64_string = if let Some(index) = base64_data.find(',') {
        &base64_data[index + 1..]
    } else {
        &base64_data
    };

    // Fix: Remove any whitespace (newlines) that might be in the base64 string
    let clean_b64: String = b64_string.chars().filter(|c| !c.is_whitespace()).collect();

    let decoded = BASE64_STANDARD
        .decode(clean_b64)
        .map_err(|e| e.to_string())?;
    fs::write(&path, decoded).map_err(|e| e.to_string())?;

    // Return connection asset protocol URL for frontend display
    // Windows path needs to be converted for convertFileSrc in frontend,
    // but here we just return absolute path and let frontend handle conversion
    Ok(path.to_string_lossy().to_string())
}

pub fn get_all_pengeluaran_rental(
    conn: &Connection,
) -> Result<Vec<crate::models::PengeluaranRental>> {
    let mut stmt = conn.prepare(
        "SELECT pengeluaran_id, tanggal, jenis, nominal, keterangan, sumber_dana FROM pengeluaran_rental",
    )?;
    let pengeluaran_iter = stmt.query_map([], |row| {
        Ok(crate::models::PengeluaranRental {
            pengeluaran_id: row.get(0)?,
            tanggal: row.get(1)?,
            jenis: row.get(2)?,
            nominal: row.get(3)?,
            keterangan: row.get(4)?,
            sumber_dana: row.get(5)?,
        })
    })?;

    let mut result = Vec::new();
    for p in pengeluaran_iter {
        result.push(p?);
    }
    Ok(result)
}

pub fn create_pengeluaran_rental(
    conn: &Connection,
    data: crate::models::PengeluaranRental,
) -> Result<()> {
    conn.execute("INSERT INTO pengeluaran_rental (tanggal, jenis, nominal, keterangan, sumber_dana) VALUES (?1, ?2, ?3, ?4, ?5)", (data.tanggal, data.jenis, data.nominal, data.keterangan, data.sumber_dana.unwrap_or("Kas".to_string())))?;
    Ok(())
}

pub fn get_pengeluaran_rental_by_id(
    conn: &Connection,
    id: i32,
) -> Result<crate::models::PengeluaranRental> {
    let mut stmt = conn.prepare("SELECT pengeluaran_id, tanggal, jenis, nominal, keterangan, sumber_dana FROM pengeluaran_rental WHERE pengeluaran_id = ?1")?;
    let mut rows = stmt.query([id])?;

    if let Some(row) = rows.next()? {
        Ok(crate::models::PengeluaranRental {
            pengeluaran_id: row.get(0)?,
            tanggal: row.get(1)?,
            jenis: row.get(2)?,
            nominal: row.get(3)?,
            keterangan: row.get(4)?,
            sumber_dana: row.get(5)?,
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_pengeluaran_rental(
    conn: &Connection,
    id: i32,
    data: crate::models::PengeluaranRental,
) -> Result<()> {
    conn.execute("UPDATE pengeluaran_rental SET tanggal = ?1, jenis = ?2, nominal = ?3, keterangan = ?4, sumber_dana = ?5 WHERE pengeluaran_id = ?6", (data.tanggal, data.jenis, data.nominal, data.keterangan, data.sumber_dana.unwrap_or("Kas".to_string()), id))?;
    Ok(())
}

pub fn delete_pengeluaran_rental(conn: &Connection, id: i32) -> Result<()> {
    conn.execute(
        "DELETE FROM pengeluaran_rental WHERE pengeluaran_id = ?1",
        (id,),
    )?;
    Ok(())
}
