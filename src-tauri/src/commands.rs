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
