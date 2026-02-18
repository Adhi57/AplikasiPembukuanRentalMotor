use std::path::PathBuf;
use std::process::Command;

#[tauri::command]
pub async fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn save_file(file_name: String, data: Vec<u8>) -> Result<String, String> {
    let downloads = dirs::download_dir().unwrap_or_else(|| PathBuf::from("."));

    let file_path = downloads.join(&file_name);

    std::fs::write(&file_path, &data).map_err(|e| format!("Gagal menyimpan file: {}", e))?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_downloads_path() -> Result<String, String> {
    let downloads = dirs::download_dir().unwrap_or_else(|| PathBuf::from("."));
    Ok(downloads.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_db_path_string() -> Result<String, String> {
    let db_path = crate::db::get_db_path();
    Ok(db_path.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn backup_database(dest_path: String) -> Result<String, String> {
    let src = crate::db::get_db_path();

    if !src.exists() {
        return Err("Database file not found".to_string());
    }

    let dest = PathBuf::from(&dest_path);

    // Ensure destination directory exists
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent).map_err(|e| format!("Gagal membuat folder: {}", e))?;
    }

    // Perform WAL checkpoint before backup to ensure all data is in main db file
    crate::db::with_connection(|conn| {
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").ok();
        Ok(())
    })
    .map_err(|e| format!("Gagal checkpoint database: {}", e))?;

    // Copy the main database file
    std::fs::copy(&src, &dest).map_err(|e| format!("Gagal menyalin database: {}", e))?;

    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn import_database(src_path: String) -> Result<(), String> {
    let src = PathBuf::from(&src_path);

    if !src.exists() {
        return Err("File database tidak ditemukan".to_string());
    }

    // Validate it's a valid SQLite file by checking the magic header
    let header = std::fs::read(&src).map_err(|e| format!("Gagal membaca file: {}", e))?;

    if header.len() < 16 || &header[0..16] != b"SQLite format 3\0" {
        return Err("File yang dipilih bukan file database SQLite yang valid".to_string());
    }

    let dest = crate::db::get_db_path();

    // Close the WAL and SHM first
    crate::db::with_connection(|conn| {
        conn.execute_batch("PRAGMA wal_checkpoint(TRUNCATE);").ok();
        Ok(())
    })
    .map_err(|e| format!("Gagal checkpoint: {}", e))?;

    // Copy the imported file to the database location
    std::fs::copy(&src, &dest).map_err(|e| format!("Gagal mengimpor database: {}", e))?;

    // Remove WAL and SHM files if they exist (they belong to the old DB)
    let wal_path = dest.with_extension("sqlite-wal");
    let shm_path = dest.with_extension("sqlite-shm");
    if wal_path.exists() {
        std::fs::remove_file(&wal_path).ok();
    }
    if shm_path.exists() {
        std::fs::remove_file(&shm_path).ok();
    }

    Ok(())
}
