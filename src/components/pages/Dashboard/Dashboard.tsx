import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import {
  Bike,
  Users,
  ClipboardList,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  Calendar,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Ban,
  Tag,
} from "lucide-react";

import { Motor } from "../../../types/motor.type";
import { Penyewa } from "../../../types/penyewa.type";
import { Transaksi } from "../../../types/transaksi.type";
import { BuktiPelunasan } from "../../../types/bukti_pelunasan.type";
import { PengeluaranRental } from "../../../types/pengeluaran_rental";
import { getMotor } from "../../../services/motor.service";
import { PenyewaService, TransaksiService } from "../../../services/penyewa.service";

export default function Dashboard() {
  const navigate = useNavigate();
  const [motors, setMotors] = useState<Motor[]>([]);
  const [penyewas, setPenyewas] = useState<Penyewa[]>([]);
  const [transaksiList, setTransaksiList] = useState<Transaksi[]>([]);
  const [buktiList, setBuktiList] = useState<BuktiPelunasan[]>([]);
  const [pengeluaranList, setPengeluaranList] = useState<PengeluaranRental[]>([]);
  const [saldoAwalKas, setSaldoAwalKas] = useState<number>(0);
  const [saldoAwalBank, setSaldoAwalBank] = useState<number>(0);
  const [saldoAwalEwallet, setSaldoAwalEwallet] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [diskonInfo, setDiskonInfo] = useState<{ aktif: boolean; persen: number; mulai: string; berakhir: string } | null>(null);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [m, p, t, b, pg, kas, bank, ewallet] = await Promise.all([
        getMotor(),
        PenyewaService.getAll(),
        TransaksiService.getAll(),
        invoke<BuktiPelunasan[]>("get_all_bukti_pelunasan"),
        invoke<PengeluaranRental[]>("get_all_pengeluaran_rental"),
        invoke<string>("get_pengaturan", { key: "saldo_awal_kas" }),
        invoke<string>("get_pengaturan", { key: "saldo_awal_bank" }),
        invoke<string>("get_pengaturan", { key: "saldo_awal_ewallet" }),
      ]);
      setMotors(m);
      setPenyewas(p);
      setTransaksiList(t);
      setBuktiList(b);
      setPengeluaranList(pg);
      setSaldoAwalKas(kas ? parseInt(kas) || 0 : 0);
      setSaldoAwalBank(bank ? parseInt(bank) || 0 : 0);
      setSaldoAwalEwallet(ewallet ? parseInt(ewallet) || 0 : 0);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }

    // Fetch discount settings
    try {
      const [dPersen, dMulai, dBerakhir, dAktif] = await Promise.all([
        invoke<string>("get_pengaturan", { key: "diskon_persen" }).catch(() => "0"),
        invoke<string>("get_pengaturan", { key: "diskon_tanggal_mulai" }).catch(() => ""),
        invoke<string>("get_pengaturan", { key: "diskon_tanggal_berakhir" }).catch(() => ""),
        invoke<string>("get_pengaturan", { key: "diskon_aktif" }).catch(() => "0"),
      ]);
      setDiskonInfo({
        aktif: dAktif === "1",
        persen: Number(dPersen) || 0,
        mulai: dMulai || "",
        berakhir: dBerakhir || "",
      });
    } catch (err) {
      console.error("Failed to fetch discount info:", err);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);

  const getMotorName = (id: number) => {
    const motor = motors.find((m) => m.motor_id === id);
    return motor ? `${motor.nama} (${motor.plat})` : `Motor #${id}`;
  };

  const getPenyewaName = (id: number) => {
    const penyewa = penyewas.find((p) => p.penyewa_id === id);
    return penyewa ? penyewa.nama : `Penyewa #${id}`;
  };

  // Computed stats
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Motor stats
  const motorTersedia = motors.filter((m) => m.status === "tersedia").length;
  const motorDisewa = motors.filter((m) => m.status === "dipinjam").length;

  // Transaksi stats
  const transaksiAktif = transaksiList.filter((t) => t.status === "dipinjam").length;
  const transaksiTerlambat = transaksiList.filter((t) => t.status === "terlambat").length;
  const transaksiSelesai = transaksiList.filter((t) => t.status === "kembali").length;

  // Financial stats — this month
  const bulanIniBukti = buktiList.filter((b) => b.tanggal_bayar?.slice(0, 7) === currentMonth);
  const bulanIniPengeluaran = pengeluaranList.filter((p) => p.tanggal?.slice(0, 7) === currentMonth);
  const pemasukanBulanIni = bulanIniBukti.reduce((s, b) => s + b.jumlah_bayar, 0);
  const pengeluaranBulanIni = bulanIniPengeluaran.reduce((s, p) => s + (p.nominal || 0), 0);

  // Financial stats — all time
  // Financial stats — all time breakdown
  // Calculate balances per account
  // 1. Kas
  const masukKas = buktiList.filter(b => b.metode_bayar === "tunai").reduce((s, b) => s + b.jumlah_bayar, 0);
  const keluarKas = pengeluaranList.filter(p => !p.sumber_dana || p.sumber_dana === "Kas").reduce((s, p) => s + p.nominal, 0);
  const saldoKas = saldoAwalKas + masukKas - keluarKas;

  // 2. Bank
  const masukBank = buktiList.filter(b => b.metode_bayar === "transfer").reduce((s, b) => s + b.jumlah_bayar, 0);
  const keluarBank = pengeluaranList.filter(p => p.sumber_dana === "Bank").reduce((s, p) => s + p.nominal, 0);
  const saldoBank = saldoAwalBank + masukBank - keluarBank;

  // 3. E-Wallet
  const masukEwallet = buktiList.filter(b => ["ewallet", "qris"].includes(b.metode_bayar)).reduce((s, b) => s + b.jumlah_bayar, 0);
  const keluarEwallet = pengeluaranList.filter(p => p.sumber_dana === "E-Wallet").reduce((s, p) => s + p.nominal, 0);
  const saldoEwallet = saldoAwalEwallet + masukEwallet - keluarEwallet;

  // Recent transactions (combined income + expenses, last 8)
  const recentEntries = [
    ...buktiList.map((b) => {
      const trx = transaksiList.find((t) => t.transaksi_id === b.transaksi_id);
      return {
        id: `masuk-${b.bukti_id}`,
        tanggal: b.tanggal_bayar,
        keterangan: trx
          ? `${getPenyewaName(trx.penyewa_id)} — ${getMotorName(trx.motor_id)}`
          : `Pelunasan #${b.transaksi_id}`,
        tipe: "masuk" as const,
        jumlah: b.jumlah_bayar,
        metode: b.metode_bayar,
      };
    }),
    ...pengeluaranList.map((p) => ({
      id: `keluar-${p.pengeluaran_id}`,
      tanggal: p.tanggal,
      keterangan: `${p.jenis}${p.keterangan ? " — " + p.keterangan : ""}`,
      tipe: "keluar" as const,
      jumlah: p.nominal,
      metode: "Kas",
    })),
  ]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .slice(0, 8);

  // Month label
  const monthLabel = now.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-slate-400 animate-pulse">Memuat dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Dashboard</h1>
        <p className="text-sm text-slate-400">
          Ringkasan data rental motor — {monthLabel}
        </p>
      </div>

      {/* Alert: Terlambat */}
      {transaksiTerlambat > 0 && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700/50 rounded-xl">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              {transaksiTerlambat} transaksi terlambat dikembalikan!
            </p>
            <p className="text-xs text-red-400">Segera tindak lanjuti untuk menghindari kerugian.</p>
          </div>
          <button
            onClick={() => navigate("/transaksi")}
            className="flex items-center gap-1 px-3 py-1.5 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-700/50 rounded-lg text-xs font-medium transition"
          >
            Lihat <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* Discount Info Banner */}
      {diskonInfo && diskonInfo.aktif && diskonInfo.persen > 0 && diskonInfo.mulai && diskonInfo.berakhir && (() => {
        const today = new Date().toISOString().split('T')[0];
        const isActive = today >= diskonInfo.mulai && today <= diskonInfo.berakhir;
        if (!isActive) return null;
        return (
          <div className="flex items-center gap-3 p-4 bg-purple-900/20 border border-purple-700/50 rounded-xl">
            <div className="p-2.5 bg-purple-500/20 rounded-lg">
              <Tag size={20} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-purple-300">
                🎉 Promo Diskon {diskonInfo.persen}% Sedang Berlaku!
              </p>
              <p className="text-xs text-purple-400/70">
                Berlaku untuk penyewaan dari {diskonInfo.mulai} s/d {diskonInfo.berakhir}
              </p>
            </div>
            <span className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold rounded-full animate-pulse">
              PROMO
            </span>
          </div>
        );
      })()}

      {/* Row 1: Armada & Pelanggan Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Motor */}
        <button onClick={() => navigate("/motor")} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-blue-500/50 transition text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition">
              <Bike size={22} className="text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Motor</p>
              <p className="text-2xl font-bold text-slate-100">{motors.length}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={12} /> {motorTersedia} tersedia
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Clock size={12} /> {motorDisewa} disewa
            </span>
          </div>
        </button>

        {/* Total Penyewa */}
        <button onClick={() => navigate("/penyewa")} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-purple-500/50 transition text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition">
              <Users size={22} className="text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Total Penyewa</p>
              <p className="text-2xl font-bold text-slate-100">{penyewas.length}</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">Pelanggan terdaftar</p>
        </button>

        {/* Total Transaksi */}
        <button onClick={() => navigate("/transaksi")} className="bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-amber-500/50 transition text-left group">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition">
              <ClipboardList size={22} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Transaksi</p>
              <p className="text-2xl font-bold text-slate-100">{transaksiList.length}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-blue-400">
              <Clock size={12} /> {transaksiAktif} aktif
            </span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 size={12} /> {transaksiSelesai} selesai
            </span>
            {transaksiTerlambat > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <Ban size={12} /> {transaksiTerlambat} terlambat
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Row 2: Saldo Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Saldo Kas */}
        <div className={`bg-slate-800 rounded-xl border p-5 transition text-left ${saldoKas >= 0 ? "border-slate-700 hover:border-emerald-500/50" : "border-red-700/50 hover:border-red-500/50"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition ${saldoKas >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <Wallet size={22} className={saldoKas >= 0 ? "text-emerald-400" : "text-red-400"} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Saldo Kas (Tunai)</p>
              <p className={`text-2xl font-bold ${saldoKas >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                {formatCurrency(saldoKas)}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo Bank */}
        <div className={`bg-slate-800 rounded-xl border p-5 transition text-left ${saldoBank >= 0 ? "border-slate-700 hover:border-blue-500/50" : "border-red-700/50 hover:border-red-500/50"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition ${saldoBank >= 0 ? "bg-blue-500/10" : "bg-red-500/10"}`}>
              <Wallet size={22} className={saldoBank >= 0 ? "text-blue-400" : "text-red-400"} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Saldo Bank (Transfer)</p>
              <p className={`text-2xl font-bold ${saldoBank >= 0 ? "text-blue-400" : "text-red-400"}`}>
                {formatCurrency(saldoBank)}
              </p>
            </div>
          </div>
        </div>

        {/* Saldo E-Wallet */}
        <div className={`bg-slate-800 rounded-xl border p-5 transition text-left ${saldoEwallet >= 0 ? "border-slate-700 hover:border-purple-500/50" : "border-red-700/50 hover:border-red-500/50"}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition ${saldoEwallet >= 0 ? "bg-purple-500/10" : "bg-red-500/10"}`}>
              <Wallet size={22} className={saldoEwallet >= 0 ? "text-purple-400" : "text-red-400"} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Saldo E-Wallet</p>
              <p className={`text-2xl font-bold ${saldoEwallet >= 0 ? "text-purple-400" : "text-red-400"}`}>
                {formatCurrency(saldoEwallet)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Financial Summary This Month */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <TrendingUp size={18} className="text-emerald-400" />
            </div>
            <p className="text-sm text-slate-400">Pemasukan Bulan Ini</p>
          </div>
          <p className="text-2xl font-bold text-emerald-400">{formatCurrency(pemasukanBulanIni)}</p>
          <p className="text-xs text-slate-500 mt-1">{bulanIniBukti.length} pembayaran diterima</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-red-500/10 rounded-lg">
              <TrendingDown size={18} className="text-red-400" />
            </div>
            <p className="text-sm text-slate-400">Pengeluaran Bulan Ini</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{formatCurrency(pengeluaranBulanIni)}</p>
          <p className="text-xs text-slate-500 mt-1">{bulanIniPengeluaran.length} pengeluaran tercatat</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Calendar size={18} className="text-blue-400" />
            </div>
            <p className="text-sm text-slate-400">Laba Bersih Bulan Ini</p>
          </div>
          <p className={`text-2xl font-bold ${pemasukanBulanIni - pengeluaranBulanIni >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {formatCurrency(pemasukanBulanIni - pengeluaranBulanIni)}
          </p>
          <p className="text-xs text-slate-500 mt-1">Pemasukan - Pengeluaran</p>
        </div>
      </div>

      {/* Row 3: Recent Transactions & Motor Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Transaksi Terbaru</h2>
              <p className="text-sm text-slate-400">Riwayat kas terkini</p>
            </div>
            <button
              onClick={() => navigate("/kas")}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Lihat Semua <ArrowRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-slate-700 bg-slate-900/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Keterangan</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tipe</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                      Belum ada transaksi
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-700/30 transition">
                      <td className="px-4 py-3 text-slate-300 whitespace-nowrap">
                        {entry.tanggal?.slice(0, 10)}
                      </td>
                      <td className="px-4 py-3 text-slate-200 max-w-[250px] truncate">
                        {entry.keterangan}
                      </td>
                      <td className="px-4 py-3">
                        {entry.tipe === "masuk" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                            <ArrowUpCircle size={12} /> Masuk
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold bg-red-900/50 text-red-300 border border-red-700/50">
                            <ArrowDownCircle size={12} /> Keluar
                          </span>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${entry.tipe === "masuk" ? "text-emerald-400" : "text-red-400"}`}>
                        {entry.tipe === "masuk" ? "+" : "-"}{formatCurrency(entry.jumlah)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Motor Status */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Status Armada</h2>
              <p className="text-sm text-slate-400">{motors.length} motor terdaftar</p>
            </div>
            <button
              onClick={() => navigate("/motor")}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium transition"
            >
              Detail <ArrowRight size={14} />
            </button>
          </div>

          <div className="px-5 pb-5 space-y-3">
            {/* Status Bars */}
            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                  Tersedia
                </span>
                <span className="font-bold text-slate-200">{motorTersedia}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: motors.length > 0 ? `${(motorTersedia / motors.length) * 100}%` : "0%" }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-sm mb-1.5">
                <span className="text-slate-300 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                  Disewa
                </span>
                <span className="font-bold text-slate-200">{motorDisewa}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-amber-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: motors.length > 0 ? `${(motorDisewa / motors.length) * 100}%` : "0%" }}
                ></div>
              </div>
            </div>

            {/* Motor List Preview */}
            <div className="border-t border-slate-700 pt-3 mt-3 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motor Disewa</p>
              {motors.filter((m) => m.status === "dipinjam").length === 0 ? (
                <p className="text-xs text-slate-500">Tidak ada motor yang sedang disewa</p>
              ) : (
                motors
                  .filter((m) => m.status === "dipinjam")
                  .slice(0, 5)
                  .map((motor) => {
                    const trx = transaksiList.find(
                      (t) => t.motor_id === motor.motor_id && t.status !== "kembali"
                    );
                    return (
                      <div key={motor.motor_id} className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-200">{motor.nama}</p>
                          <p className="text-xs text-slate-500">{motor.plat}</p>
                        </div>
                        {trx && (
                          <div className="text-right">
                            <p className="text-xs text-slate-400">{getPenyewaName(trx.penyewa_id)}</p>
                            <p className="text-xs text-slate-500">s/d {trx.tanggal_kembali_rencana?.slice(0, 10)}</p>
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Quick Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
        <h2 className="text-lg font-bold text-slate-100 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => navigate("/motor/tambah")}
            className="flex items-center gap-3 p-4 bg-blue-500/5 border border-blue-700/30 rounded-xl hover:bg-blue-500/10 hover:border-blue-500/50 transition group"
          >
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition">
              <Bike size={20} />
            </div>
            <span className="text-sm font-medium text-slate-200">Tambah Motor</span>
          </button>

          <button
            onClick={() => navigate("/penyewa/tambah")}
            className="flex items-center gap-3 p-4 bg-purple-500/5 border border-purple-700/30 rounded-xl hover:bg-purple-500/10 hover:border-purple-500/50 transition group"
          >
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500/20 transition">
              <Users size={20} />
            </div>
            <span className="text-sm font-medium text-slate-200">Tambah Penyewa</span>
          </button>

          <button
            onClick={() => navigate("/transaksi/tambah")}
            className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-700/30 rounded-xl hover:bg-amber-500/10 hover:border-amber-500/50 transition group"
          >
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400 group-hover:bg-amber-500/20 transition">
              <ClipboardList size={20} />
            </div>
            <span className="text-sm font-medium text-slate-200">Tambah Transaksi</span>
          </button>

          <button
            onClick={() => navigate("/pengeluaran_rental/tambah")}
            className="flex items-center gap-3 p-4 bg-red-500/5 border border-red-700/30 rounded-xl hover:bg-red-500/10 hover:border-red-500/50 transition group"
          >
            <div className="p-2 bg-red-500/10 rounded-lg text-red-400 group-hover:bg-red-500/20 transition">
              <TrendingDown size={20} />
            </div>
            <span className="text-sm font-medium text-slate-200">Catat Pengeluaran</span>
          </button>
        </div>

      </div>
    </div>
  );
}