
import { BrowserRouter, Routes, Route } from "react-router-dom"

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

export default function App() {
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
        </Routes>
      </PageWrapper>
    </BrowserRouter>
  )
}

