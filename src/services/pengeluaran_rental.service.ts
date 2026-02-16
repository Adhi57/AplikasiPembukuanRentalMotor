import { invoke } from "@tauri-apps/api/core";
import { PengeluaranRental } from "../types/pengeluaran_rental";

export async function getAllPengeluaranRental(): Promise<PengeluaranRental[]> {
    return invoke("get_all_pengeluaran_rental");
}

export async function createPengeluaranRental(data: PengeluaranRental): Promise<void> {
    return invoke("create_pengeluaran_rental", { data });
}

export async function getPengeluaranRentalById(id: number): Promise<PengeluaranRental> {
    return invoke("get_pengeluaran_rental_by_id", { id });
}

export async function updatePengeluaranRental(id: number, data: PengeluaranRental): Promise<void> {
    return invoke("update_pengeluaran_rental", { id, data });
}

export async function deletePengeluaranRental(id: number): Promise<void> {
    return invoke("delete_pengeluaran_rental", { id });
}