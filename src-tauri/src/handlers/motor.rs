use crate::models::Motor;
use crate::db;
use tauri::AppHandle;
use tauri::Manager;
use std::fs;
use uuid::Uuid;
use base64::{engine::general_purpose, Engine as _};

#[tauri::command]
pub async fn get_all_motor() -> Result<Vec<Motor>, String> {
    println!("🔍 Getting Motor...");
    
    db::with_connection(|conn| {
        db::get_all_motor(conn)
    })
    .map_err(|e| {
        eprintln!("❌ Error get_all_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn create_motor(data: Motor) -> Result<(), String> {
    println!("💾 Creating Motor...");
    
    db::with_connection(|conn| {
        db::create_motor(conn, data)
    })
    .map_err(|e| {
        eprintln!("❌ Error create_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn update_motor(id: i32, data: Motor) -> Result<(), String> {
    println!("💾 Updating Motor ID: {}", id);
    
    db::with_connection(|conn| {
        db::update_motor(conn, id, data)
    })
    .map_err(|e| {
        eprintln!("❌ Error update_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn delete_motor(id: i32) -> Result<(), String> {
    println!("🗑️ Deleting Motor ID: {}", id);
    
    db::with_connection(|conn| {
        db::delete_motor(conn, id)
    })
    .map_err(|e| {
        eprintln!("❌ Error delete_motor: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn get_motor_by_id(id: i32) -> Result<Motor, String> {
    println!("🔍 Getting Motor by ID: {}", id);
    
    db::with_connection(|conn| {
        db::get_motor_by_id(conn, id)
    })
    .map_err(|e| {
        eprintln!("❌ Error get_motor_by_id: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn save_motor_image(app: AppHandle, base64: String) -> Result<String, String> {
    println!("💾 Saving Motor Image...");
    
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