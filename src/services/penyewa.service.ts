import { invoke } from "@tauri-apps/api/core";
import { Penyewa } from "../types/penyewa.type";
import { Transaksi } from "../types/transaksi.type";

export const TransaksiService = {
  getAll: () => invoke<Transaksi[]>("get_all_transaksi"),
  getById: (id: number) => invoke<Transaksi>("get_transaksi_by_id", { id }),
  create: (data: Transaksi) => invoke("create_transaksi", { data }),
  update: (data: Transaksi) => invoke("update_transaksi", { data }),
  delete: (id: number) => invoke("delete_transaksi", { id }),
};

export const PenyewaService = {
  getAll: () => invoke<Penyewa[]>("get_all_penyewa"),
  create: (data: Penyewa) => invoke("create_penyewa", { data }),
  update: (data: Penyewa) => invoke("update_penyewa", { data }),
  delete: (id: number) => invoke("delete_penyewa", { id }),
};

