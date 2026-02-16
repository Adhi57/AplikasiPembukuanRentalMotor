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
            handlers::motor::get_all_motor,
            handlers::motor::create_motor,
            handlers::motor::update_motor,
            handlers::motor::delete_motor,
            handlers::motor::get_motor_by_id,
            handlers::motor::save_motor_image,
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
            handlers::bukti_pelunasan::get_all_bukti_pelunasan,
            handlers::bukti_pelunasan::create_bukti_pelunasan,
            handlers::bukti_pelunasan::get_bukti_pelunasan_by_id,
            handlers::bukti_pelunasan::update_bukti_pelunasan,
            handlers::bukti_pelunasan::delete_bukti_pelunasan,
            handlers::bukti_pelunasan::save_bukti_pelunasan_image,
            handlers::pengeluaran_rental::get_all_pengeluaran_rental,
            handlers::pengeluaran_rental::create_pengeluaran_rental,
            handlers::pengeluaran_rental::get_pengeluaran_rental_by_id,
            handlers::pengeluaran_rental::update_pengeluaran_rental,
            handlers::pengeluaran_rental::delete_pengeluaran_rental,
            commands::open_folder,
            commands::save_file,
            commands::get_downloads_path,
        ])
        .run(tauri::generate_context!())
        .expect("error running tauri app");
}
