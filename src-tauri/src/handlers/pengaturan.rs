use crate::db::with_connection;

#[tauri::command]
pub fn get_pengaturan(key: String) -> Result<String, String> {
    with_connection(|conn| {
        let result = conn.query_row(
            "SELECT value FROM pengaturan WHERE key = ?1",
            [&key],
            |row| row.get::<_, String>(0),
        );
        match result {
            Ok(val) => Ok(val),
            Err(_) => Ok(String::new()),
        }
    })
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_pengaturan(
    key: String,
    value: String,
    keterangan: Option<String>,
) -> Result<(), String> {
    with_connection(|conn| {
        conn.execute(
            "INSERT INTO pengaturan (key, value, keterangan) VALUES (?1, ?2, ?3)
             ON CONFLICT(key) DO UPDATE SET value = ?2, keterangan = ?3",
            rusqlite::params![key, value, keterangan.unwrap_or_default()],
        )?;
        Ok(())
    })
    .map_err(|e| e.to_string())
}
