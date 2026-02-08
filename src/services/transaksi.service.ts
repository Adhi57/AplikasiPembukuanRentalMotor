import { invoke } from "@tauri-apps/api/core";
import { Transaksi } from "../types/transaksi.type";

export const TransaksiService = {
    getAll: async (): Promise<Transaksi[]> => {
        return await invoke("get_all_transaksi");
    },
    getById: async (id: number): Promise<Transaksi> => {
        return await invoke("get_transaksi_by_id", { id });
    },
    create: async (data: Transaksi): Promise<Transaksi> => {
        return await invoke("create_transaksi", { data });
    },
    update: async (id: number, data: Transaksi): Promise<Transaksi> => {
        return await invoke("update_transaksi", { id, data });
    },
    delete: async (id: number): Promise<void> => {
        await invoke("delete_transaksi", { id });
    },
};