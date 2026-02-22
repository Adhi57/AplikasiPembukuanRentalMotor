import { BrowserRouter, Routes, Route } from "react-router-dom"
import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import Activation from "./components/pages/Activation/Activation";
import { Lock } from "lucide-react";

import PageWrapper from "./components/layout/PageWrapper"
import Dashboard from "./components/pages/Dashboard/Dashboard"
import MotorList from "./components/pages/Motor/MotorList"
import MotorAdd from "./components/pages/Motor/MotorAdd"
import MotorEdit from "./components/pages/Motor/MotorEdit"
import PenyewaList from "./components/pages/Penyewa/PenyewaList";
import PenyewaAdd from "./components/pages/Penyewa/PenyewaAdd";
import PenyewaEdit from "./components/pages/Penyewa/PenyewaEdit";
import TransaksiList from "./components/pages/Transaksi/TransaksiList";
import TransaksiAdd from "./components/pages/Transaksi/TransaksiAdd";
import TransaksiEdit from "@/components/pages/Transaksi/TransaksiEdit";
import BuktiPelunasanList from "./components/pages/BuktiPelunasan/BuktiPelunasanList";
import BuktiPelunasanAdd from "./components/pages/BuktiPelunasan/BuktiPelunasanAdd";
import BuktiPelunasanEdit from "./components/pages/BuktiPelunasan/BuktiPelunasanEdit";
import BuktiPelunasanLihat from "./components/pages/BuktiPelunasan/BuktiPelunasanLihat";
import PengeluaranRentalList from "./components/pages/PengeluaranRental/PengeluaranRentalList";
import PengeluaranRentalAdd from "./components/pages/PengeluaranRental/PengeluaranRentalAdd";
import PengeluaranRentalEdit from "./components/pages/PengeluaranRental/PengeluaranRentalEdit";
import KasList from "./components/pages/Kas/KasList";
import LaporanBulanan from "./components/pages/Laporan/LaporanBulanan";
import Pengaturan from "./components/pages/Pengaturan/Pengaturan";

export default function App() {
  const [isLicensed, setIsLicensed] = useState<boolean | null>(null);

  useEffect(() => {
    checkLicense();
  }, []);

  const checkLicense = async () => {
    try {
      const valid = await invoke<boolean>("check_license_status");
      setIsLicensed(valid);
      // setIsLicensed(true); // Uncomment for debugging without backend
    } catch (err) {
      console.error("Failed to check license:", err);
      setIsLicensed(false);
    }
  };

  if (isLicensed === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center">
            <Lock className="text-slate-600" />
          </div>
          <p className="text-slate-500 text-sm">Memeriksa Lisensi...</p>
        </div>
      </div>
    );
  }

  if (isLicensed === false) {
    return <Activation />;
  }

  return (
    <BrowserRouter>
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/motor" element={<MotorList />} />
          <Route path="/motor/tambah" element={<MotorAdd />} />
          <Route path="/motor/edit/:id" element={<MotorEdit />} />
          <Route path="/penyewa" element={<PenyewaList />} />
          <Route path="/penyewa/tambah" element={<PenyewaAdd />} />
          <Route path="/penyewa/edit/:id" element={<PenyewaEdit />} />
          <Route path="/transaksi" element={<TransaksiList />} />
          <Route path="/transaksi/tambah" element={<TransaksiAdd />} />
          <Route path="/transaksi/edit/:id" element={<TransaksiEdit />} />
          <Route path="/bukti_pelunasan" element={<BuktiPelunasanList />} />
          <Route path="/bukti_pelunasan/tambah" element={<BuktiPelunasanAdd />} />
          <Route path="/bukti_pelunasan/edit/:id" element={<BuktiPelunasanEdit />} />
          <Route path="/bukti_pelunasan/lihat/:id" element={<BuktiPelunasanLihat />} />
          <Route path="/pengeluaran_rental" element={<PengeluaranRentalList />} />
          <Route path="/pengeluaran_rental/tambah" element={<PengeluaranRentalAdd />} />
          <Route path="/pengeluaran_rental/edit/:id" element={<PengeluaranRentalEdit />} />
          <Route path="/kas" element={<KasList />} />
          <Route path="/laporan" element={<LaporanBulanan />} />
          <Route path="/pengaturan" element={<Pengaturan />} />
        </Routes>
      </PageWrapper>
    </BrowserRouter>
  )
}

