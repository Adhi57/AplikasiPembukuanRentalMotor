use crate::db;
use crate::models::BuktiPelunasan;

#[tauri::command]
pub async fn get_all_bukti_pelunasan() -> Result<Vec<BuktiPelunasan>, String> {
    println!("🔍 Getting Bukti Pelunasan...");

    db::with_connection(|conn| db::get_all_bukti_pelunasan(conn)).map_err(|e| {
        eprintln!("❌ Error get_all_bukti_pelunasan: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn create_bukti_pelunasan(data: BuktiPelunasan) -> Result<(), String> {
    println!("💾 Creating Bukti Pelunasan...");

    db::with_connection(|conn| db::create_bukti_pelunasan(conn, data)).map_err(|e| {
        eprintln!("❌ Error create_bukti_pelunasan: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn get_bukti_pelunasan_by_id(id: i32) -> Result<BuktiPelunasan, String> {
    println!("🔍 Getting Bukti Pelunasan by ID: {}", id);

    db::with_connection(|conn| db::get_bukti_pelunasan_by_id(conn, id)).map_err(|e| {
        eprintln!("❌ Error get_bukti_pelunasan_by_id: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn update_bukti_pelunasan(id: i32, data: BuktiPelunasan) -> Result<(), String> {
    println!("💾 Updating Bukti Pelunasan ID: {}", id);

    db::with_connection(|conn| db::update_bukti_pelunasan(conn, id, data)).map_err(|e| {
        eprintln!("❌ Error update_bukti_pelunasan: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn delete_bukti_pelunasan(id: i32) -> Result<(), String> {
    println!("🗑️ Deleting Bukti Pelunasan ID: {}", id);

    db::with_connection(|conn| db::delete_bukti_pelunasan(conn, id)).map_err(|e| {
        eprintln!("❌ Error delete_bukti_pelunasan: {}", e);
        e.to_string()
    })
}

#[tauri::command]
pub async fn save_bukti_pelunasan_image(base64: String) -> Result<String, String> {
    println!("💾 Saving Bukti Pelunasan Image...");

    let path = db::save_bukti_pelunasan_image(base64).map_err(|e| {
        eprintln!("❌ Error save_bukti_pelunasan_image: {}", e);
        e.to_string()
    })?;

    Ok(path)
}
