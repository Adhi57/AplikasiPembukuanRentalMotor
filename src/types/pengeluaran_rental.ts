export interface PengeluaranRental {
    pengeluaran_id: number;
    tanggal: string;
    jenis: string;
    nominal: number;
    keterangan: string;
    sumber_dana?: string;
}
