import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/core";

import { BrowserRouter, Routes, Route } from "react-router-dom"

import PageWrapper from "./components/layout/PageWrapper"
import Dashboard from "./components/pages/Dashboard/Dashboard"
import MotorList from "./components/pages/Motor/MotorList"
import PenyewaList from "./components/pages/Penyewa/PenyewaList";
import PenyewaAdd from "./components/pages/Penyewa/PenyewaAdd";
import PenyewaEdit from "./components/pages/Penyewa/PenyewaEdit";
import TransaksiList from "./components/pages/Transaksi/TransaksiList";
import TransaksiAdd from "./components/pages/Transaksi/TransaksiAdd";
import TransaksiEdit from "./components/pages/Transaksi/TransaksiEdit";

export default function App() {
  return (
    <BrowserRouter>
      <PageWrapper>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/motor" element={<MotorList />} />
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

