use crate::models::Penyewa;
use crate::db;

#[tauri::command]
pub async fn get_all_penyewa() -> Result<Vec<Penyewa>, String> {
    println!("🔍 Getting Penyewa...");
    
    db::with_connection(|conn| {
        db::get_all_penyewa(conn)
    })
    .map_err(|e| {
        eprintln!("❌ Error get_all_penyewa: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn create_penyewa(data: Penyewa) -> Result<(), String> {
    println!("💾 Creating Penyewa...");
    
    db::with_connection(|conn| {
        db::create_penyewa(conn, data)
    })
    .map_err(|e| {
        eprintln!("❌ Error create_penyewa: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn get_penyewa_by_id(id: i32) -> Result<Penyewa, String> {
    println!("🔍 Getting Penyewa by ID: {}", id);
    
    db::with_connection(|conn| {
        db::get_penyewa_by_id(conn, id)
    })
    .map_err(|e| {
        eprintln!("❌ Error get_penyewa_by_id: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn update_penyewa(id: i32, data: Penyewa) -> Result<(), String> {
    println!("💾 Updating Penyewa ID: {}", id);
    
    db::with_connection(|conn| {
        db::update_penyewa(conn, id, data)
    })
    .map_err(|e| {
        eprintln!("❌ Error update_penyewa: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn delete_penyewa(id: i32) -> Result<(), String> {
    println!("🗑️ Deleting Penyewa ID: {}", id);
    
    db::with_connection(|conn| {
        db::delete_penyewa(conn, id)
    })
    .map_err(|e| {
        eprintln!("❌ Error delete_penyewa: {}", e);
        e.to_string()
    })
}

