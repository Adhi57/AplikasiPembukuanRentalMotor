use crate::db;
use crate::models::PengeluaranRental;

#[tauri::command]
pub async fn get_all_pengeluaran_rental() -> Result<Vec<PengeluaranRental>, String> {
    println!("🔍 Getting Pengeluaran Rental...");

    db::with_connection(|conn| db::get_all_pengeluaran_rental(conn)).map_err(|e| {
        eprintln!("❌ Error get_all_pengeluaran_rental: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn create_pengeluaran_rental(data: PengeluaranRental) -> Result<(), String> {
    println!("💾 Creating Pengeluaran Rental...");

    db::with_connection(|conn| db::create_pengeluaran_rental(conn, data)).map_err(|e| {
        eprintln!("❌ Error create_pengeluaran_rental: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn get_pengeluaran_rental_by_id(id: i32) -> Result<PengeluaranRental, String> {
    println!("🔍 Getting Pengeluaran Rental by ID: {}", id);

    db::with_connection(|conn| db::get_pengeluaran_rental_by_id(conn, id)).map_err(|e| {
        eprintln!("❌ Error get_pengeluaran_rental_by_id: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn update_pengeluaran_rental(id: i32, data: PengeluaranRental) -> Result<(), String> {
    println!("💾 Updating Pengeluaran Rental ID: {}", id);

    db::with_connection(|conn| db::update_pengeluaran_rental(conn, id, data)).map_err(|e| {
        eprintln!("❌ Error update_pengeluaran_rental: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn delete_pengeluaran_rental(id: i32) -> Result<(), String> {
    println!("🗑️ Deleting Pengeluaran Rental ID: {}", id);

    db::with_connection(|conn| db::delete_pengeluaran_rental(conn, id)).map_err(|e| {
        eprintln!("❌ Error delete_pengeluaran_rental: {}", e);
        e.to_string()
    })
}
