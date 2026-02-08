import { invoke } from "@tauri-apps/api/core";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Phone, CreditCard, MapPin, Plus, Search } from "lucide-react";
import Table from "../../ui/Table";
import Button from "../../ui/Button";

interface Penyewa {
  penyewa_id: number;
  nama: string;
  no_hp: string;
  no_ktp: string;
  alamat: string;
}

export default function PenyewaList() {
  const [penyewa, setPenyewa] = useState<Penyewa[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPenyewa();
  }, []);

  const fetchPenyewa = async () => {
    setLoading(true);
    try {
      const result = await invoke<Penyewa[]>("get_all_penyewa");
      setPenyewa(result);
    } catch (error) {
      console.error("Failed to fetch penyewa:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await invoke("delete_penyewa", { id });
        fetchPenyewa();
      } catch (error) {
        console.error("Failed to delete penyewa:", error);
      }
    }
  };

  const filteredPenyewa = penyewa.filter((p) =>
    p.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.no_ktp.includes(searchTerm)
  );

  const columns = [
    {
      header: "Nama Penyewa",
      accessor: "nama" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-200">{value}</span>
        </div>
      ),
    },
    {
      header: "Kontak",
      accessor: "no_hp" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <Phone size={14} className="text-slate-200" />
          {value}
        </div>
      ),
    },
    {
      header: "No. KTP",
      accessor: "no_ktp" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-slate-200">
          <CreditCard size={14} className="text-slate-200" />
          {value}
        </div>
      ),
    },
    {
      header: "Alamat",
      accessor: "alamat" as keyof Penyewa,
      render: (value: string) => (
        <div className="flex items-center gap-2 text-sm text-slate-200 max-w-xs truncate">
          <MapPin size={14} className="text-slate-200 flex-shrink-0" />
          <span className="truncate" title={value}>{value}</span>
        </div>
      ),
    },
    {
      header: "Aksi",
      accessor: "penyewa_id" as keyof Penyewa,
      align: "center" as const,
      width: "80px",
      render: (_value: any, row: Penyewa) => (
        <div className="flex justify-center gap-2">
          <Link
            to={`/penyewa/edit/${row.penyewa_id}`}
            className="p-2 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition text-slate-200 hover:text-blue-600"
            title="Edit"
          >
            <span>Edit</span>
          </Link>
          <button
            onClick={() => handleDelete(row.penyewa_id)}
            className="p-2 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition text-slate-200 hover:text-red-600"
            title="Hapus"
          >
            <span>Hapus</span>
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="bg-slate-800 rounded-xl shadow-sm border border-slate-800 overflow-hidden">
      {/* Header & Search */}
      <div className="bg-slate-800 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Daftar Penyewa</h2>
          <p className="text-sm text-slate-200">Total {penyewa.length} pelanggan terdaftar</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-200" size={18} />
            <input
              type="text"
              placeholder="Cari nama atau KTP..."
              className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-00 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <Button
              label="Tambah Penyewa"
              icon={<Plus size={16} />}
              href="/penyewa/tambah"
            />
          </div>
        </div>
      </div>

      {/* Table Area */}
      <Table
        data={filteredPenyewa}
        columns={columns}
        loading={loading}
        emptyMessage="Data penyewa tidak ditemukan."
      />
    </div>
  );
}