use crate::db;
use base64::{engine::general_purpose, Engine as _};
use rusqlite::params;
use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;
use uuid::Uuid;

// Added Serialize so Frontend can read this
#[derive(Serialize, Debug)]
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

// Added Serialize here too!
#[derive(Serialize, Debug)]
pub struct Penyewa {
    pub penyewa_id: i32,
    pub nama: String,
    pub no_hp: String,
    pub no_ktp: String,
    pub alamat: String,
}

#[derive(Deserialize, Debug)]
pub struct MotorPayload {
    pub nama: String,
    pub plat: String,
    pub tipe_motor: String,
    pub tahun: String,
    pub harga_harian: i32,
    pub foto: String,
}

#[tauri::command]
pub fn get_motor() -> Result<Vec<Motor>, String> {
    println!("🔍 Getting motors...");

    db::with_connection(|conn| {
        let mut stmt = conn.prepare(
            "SELECT motor_id, nama, plat, tipe_motor, tahun, harga_harian, foto, status 
             FROM motor",
        )?;

        let motor_iter = stmt.query_map([], |row| {
            Ok(Motor {
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

        let motors: Result<Vec<_>, _> = motor_iter.collect();
        motors
    })
    .map_err(|e| {
        eprintln!("❌ Error get_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub fn add_motor(payload: MotorPayload) -> Result<(), String> {
    println!("➕ Adding motor: {:?}", payload);

    db::with_connection(|conn| {
        conn.execute(
            "INSERT INTO motor (nama, plat, tipe_motor, tahun, harga_harian, foto, status)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'tersedia')",
            params![
                &payload.nama,
                &payload.plat,
                &payload.tipe_motor,
                &payload.tahun,
                &payload.harga_harian,
                &payload.foto
            ],
        )?;

        println!("✅ Motor added successfully");
        Ok(())
    })
    .map_err(|e| {
        eprintln!("❌ Error add_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub fn update_motor(motor_id: i32, payload: MotorPayload) -> Result<(), String> {
    println!("📝 Updating motor ID {}: {:?}", motor_id, payload);

    db::with_connection(|conn| {
        let affected = conn.execute(
            "UPDATE motor 
             SET nama = ?1, plat = ?2, tipe_motor = ?3, tahun = ?4, harga_harian = ?5, foto = ?6 
             WHERE motor_id = ?7",
            params![
                &payload.nama,
                &payload.plat,
                &payload.tipe_motor,
                &payload.tahun,
                &payload.harga_harian,
                &payload.foto,
                motor_id
            ],
        )?;

        if affected == 0 {
            return Err(rusqlite::Error::QueryReturnedNoRows);
        }

        println!("✅ Motor updated successfully");
        Ok(())
    })
    .map_err(|e| {
        eprintln!("❌ Error update_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub fn delete_motor(motor_id: i32) -> Result<(), String> {
    println!("🗑️ Deleting motor ID {}", motor_id);

    db::with_connection(|conn| {
        conn.execute("DELETE FROM motor WHERE motor_id = ?1", params![motor_id])?;

        println!("✅ Motor deleted successfully");
        Ok(())
    })
    .map_err(|e| {
        eprintln!("❌ Error delete_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub fn save_motor_image(app: tauri::AppHandle, base64: String) -> Result<String, String> {
    println!("💾 Saving motor image...");

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("motor");

    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create directory: {}", e))?;

    let filename = format!("{}.png", Uuid::new_v4());
    let filepath = dir.join(&filename);

    let base64_data = base64.split(',').nth(1).ok_or("Invalid base64 format")?;

    let bytes = general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    fs::write(&filepath, bytes).map_err(|e| format!("Failed to write file: {}", e))?;

    let path_string = filepath.to_string_lossy().to_string();
    println!("✅ Image saved at: {}", path_string);

    Ok(path_string)
}
