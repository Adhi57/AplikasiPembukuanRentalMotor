use crate::db;
use crate::models::Transaksi;
use base64::{engine::general_purpose, Engine as _};
use std::fs;
use tauri::AppHandle;
use tauri::Manager;
use uuid::Uuid;

#[tauri::command]
pub async fn get_all_transaksi() -> Result<Vec<Transaksi>, String> {
    println!("🔍 Getting Transaksi...");

    db::with_connection(|conn| db::get_all_transaksi(conn)).map_err(|e| {
        eprintln!("❌ Error get_all_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn create_transaksi(data: Transaksi) -> Result<(), String> {
    println!("💾 Creating Transaksi...");

    db::with_connection(|conn| db::create_transaksi(conn, data)).map_err(|e| {
        eprintln!("❌ Error create_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn get_transaksi_by_id(id: i32) -> Result<Transaksi, String> {
    println!("🔍 Getting Transaksi by ID: {}", id);

    db::with_connection(|conn| db::get_transaksi_by_id(conn, id)).map_err(|e| {
        eprintln!("❌ Error get_transaksi_by_id: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn update_transaksi(id: i32, data: Transaksi) -> Result<(), String> {
    println!("💾 Updating Transaksi ID: {}", id);

    db::with_connection(|conn| db::update_transaksi(conn, id, data)).map_err(|e| {
        eprintln!("❌ Error update_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn delete_transaksi(id: i32) -> Result<(), String> {
    println!("🗑️ Deleting Transaksi ID: {}", id);

    db::with_connection(|conn| db::delete_transaksi(conn, id)).map_err(|e| {
        eprintln!("❌ Error delete_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn save_transaksi_image(app: AppHandle, base64: String) -> Result<String, String> {
    println!("💾 Saving Transaksi Image...");

    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("transaksi");

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
