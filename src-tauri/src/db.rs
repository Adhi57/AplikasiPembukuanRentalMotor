use once_cell::sync::Lazy;
use parking_lot::Mutex;
use rusqlite::{Connection, Result};
use std::fs;
use std::path::PathBuf;

// Fungsi untuk mendapatkan path database
fn get_db_path() -> PathBuf {
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
    let mut stmt = conn.prepare("SELECT transaksi_id, motor_id, penyewa_id, tanggal_sewa, tanggal_kembali_rencana, tanggal_kembali_aktual, hari_terlambat, total_bayar, status, denda FROM transaksi")?;
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
        })
    })?;

    let mut result = Vec::new();
    for t in transaksi_iter {
        result.push(t?);
    }
    Ok(result)
}

pub fn create_transaksi(conn: &Connection, data: crate::models::Transaksi) -> Result<()> {
    conn.execute(
        "INSERT INTO transaksi (motor_id, penyewa_id, tanggal_sewa, tanggal_kembali_rencana, tanggal_kembali_aktual, hari_terlambat, total_bayar, status, denda) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        (data.motor_id, data.penyewa_id, data.tanggal_sewa, data.tanggal_kembali_rencana, data.tanggal_kembali_aktual, data.hari_terlambat, data.total_bayar, data.status, data.denda),
    )?;
    Ok(())
}

pub fn get_transaksi_by_id(conn: &Connection, id: i32) -> Result<crate::models::Transaksi> {
    let mut stmt = conn.prepare("SELECT transaksi_id, motor_id, penyewa_id, tanggal_sewa, tanggal_kembali_rencana, tanggal_kembali_aktual, hari_terlambat, total_bayar, status, denda FROM transaksi WHERE transaksi_id = ?1")?;
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
        })
    } else {
        Err(rusqlite::Error::QueryReturnedNoRows)
    }
}

pub fn update_transaksi(conn: &Connection, id: i32, data: crate::models::Transaksi) -> Result<()> {
    conn.execute("UPDATE transaksi SET motor_id = ?1, penyewa_id = ?2, tanggal_sewa = ?3, tanggal_kembali_rencana = ?4, tanggal_kembali_aktual = ?5, hari_terlambat = ?6, total_bayar = ?7, status = ?8, denda = ?9 WHERE transaksi_id = ?10", (data.motor_id, data.penyewa_id, data.tanggal_sewa, data.tanggal_kembali_rencana, data.tanggal_kembali_aktual, data.hari_terlambat, data.total_bayar, data.status, data.denda, id))?;
    Ok(())
}

pub fn delete_transaksi(conn: &Connection, id: i32) -> Result<()> {
    conn.execute("DELETE FROM transaksi WHERE transaksi_id = ?1", (id,))?;
    Ok(())
}
