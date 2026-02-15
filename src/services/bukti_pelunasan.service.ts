import { invoke } from "@tauri-apps/api/core";
import { BuktiPelunasan } from "../types/bukti_pelunasan.type";

export async function getAllBuktiPelunasan(): Promise<BuktiPelunasan[]> {
    return invoke("get_all_bukti_pelunasan");
}

export async function createBuktiPelunasan(data: BuktiPelunasan): Promise<void> {
    return invoke("create_bukti_pelunasan", { data });
}

export async function getBuktiPelunasanById(id: number): Promise<BuktiPelunasan> {
    return invoke("get_bukti_pelunasan_by_id", { id });
}

export async function updateBuktiPelunasan(id: number, data: BuktiPelunasan): Promise<void> {
    return invoke("update_bukti_pelunasan", { id, data });
}

export async function deleteBuktiPelunasan(id: number): Promise<void> {
    return invoke("delete_bukti_pelunasan", { id });
}