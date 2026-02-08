// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod db;
mod handlers;
mod migrations;
mod models;

fn main() {
    migrations::init_db().expect("init db gagal");

    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::get_motor,
            commands::add_motor,
            commands::update_motor,
            commands::delete_motor,
            commands::save_motor_image,
            handlers::penyewa::get_all_penyewa,
            handlers::penyewa::create_penyewa,
            handlers::penyewa::get_penyewa_by_id,
            handlers::penyewa::update_penyewa,
            handlers::penyewa::delete_penyewa,
            handlers::transaksi::get_all_transaksi,
            handlers::transaksi::create_transaksi,
            handlers::transaksi::get_transaksi_by_id,
            handlers::transaksi::update_transaksi,
            handlers::transaksi::delete_transaksi,
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
