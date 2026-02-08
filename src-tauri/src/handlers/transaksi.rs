use crate::models::Transaksi;
use crate::db;

#[tauri::command]
pub async fn get_all_transaksi() -> Result<Vec<Transaksi>, String> {
    println!("🔍 Getting Transaksi...");
    
    db::with_connection(|conn| {
        db::get_all_transaksi(conn)
    })
    .map_err(|e| {
        eprintln!("❌ Error get_all_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn create_transaksi(data: Transaksi) -> Result<(), String> {
    println!("💾 Creating Transaksi...");
    
    db::with_connection(|conn| {
        db::create_transaksi(conn, data)
    })
    .map_err(|e| {
        eprintln!("❌ Error create_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn get_transaksi_by_id(id: i32) -> Result<Transaksi, String> {
    println!("🔍 Getting Transaksi by ID: {}", id);
    
    db::with_connection(|conn| {
        db::get_transaksi_by_id(conn, id)
    })
    .map_err(|e| {
        eprintln!("❌ Error get_transaksi_by_id: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn update_transaksi(id: i32, data: Transaksi) -> Result<(), String> {
    println!("💾 Updating Transaksi ID: {}", id);
    
    db::with_connection(|conn| {
        db::update_transaksi(conn, id, data)
    })
    .map_err(|e| {
        eprintln!("❌ Error update_transaksi: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn delete_transaksi(id: i32) -> Result<(), String> {
    println!("🗑️ Deleting Transaksi ID: {}", id);
    
    db::with_connection(|conn| {
        db::delete_transaksi(conn, id)
    })
    .map_err(|e| {
        eprintln!("❌ Error delete_transaksi: {}", e);
        e.to_string()
    })
}
