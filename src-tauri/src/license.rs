use hmac::{Hmac, Mac};
use machine_uid;
use sha2::Sha256;
use std::fs;
use std::path::PathBuf;
use tauri::command;

// KUNCI RAHASIA (Ganti dengan string acak yang panjang dan aman di produksi)
// Ini digunakan untuk men-generate dan memverifikasi license key.
const SECRET_KEY: &str = "rent_motor_secret_key_v1_secure_8823";

type HmacSha256 = Hmac<Sha256>;

fn get_license_file_path() -> PathBuf {
    let mut path = PathBuf::from(std::env::var("APPDATA").expect("APPDATA not found"));
    path.push("AplikasiPembukuan");
    fs::create_dir_all(&path).ok();
    path.push("license.dat");
    path
}

#[command]
pub fn get_machine_id() -> Result<String, String> {
    machine_uid::get().map_err(|e| e.to_string())
}

fn generate_expected_key(machine_id: &str) -> String {
    let mut mac = HmacSha256::new_from_slice(SECRET_KEY.as_bytes())
        .expect("HMAC can take key of any size");
    mac.update(machine_id.as_bytes());
    let result = mac.finalize();
    hex::encode(result.into_bytes())
}

#[command]
pub fn verify_license(key: String) -> Result<bool, String> {
    let machine_id = get_machine_id()?;
    let expected = generate_expected_key(&machine_id);
    
    // Simple comparison
    Ok(key.trim() == expected)
}

#[command]
pub fn activate_license(key: String) -> Result<bool, String> {
    if verify_license(key.clone())? {
        let path = get_license_file_path();
        fs::write(path, key).map_err(|e| e.to_string())?;
        Ok(true)
    } else {
        Ok(false)
    }
}

#[command]
pub fn check_license_status() -> Result<bool, String> {
    let path = get_license_file_path();
    if !path.exists() {
        return Ok(false);
    }

    let saved_key = fs::read_to_string(path).map_err(|e| e.to_string())?;
    verify_license(saved_key)
}
