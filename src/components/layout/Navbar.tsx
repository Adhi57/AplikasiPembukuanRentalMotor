import { useState, useEffect, useRef } from "react"; // Added hooks
import { useNavigate } from "react-router-dom"; // Added routing
import { Bell, UserCircle, AlertCircle, Calendar, X } from "lucide-react"; // Added icons
import { TransaksiService, PenyewaService } from "../../services/penyewa.service";
import { getMotor } from "../../services/motor.service";
import Breadcrumbs from "./Breadcrumb"

export default function Navbar() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<{ id: number; message: string; subtext: string; type: "overdue" | "due_today" }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();

    // Close dropdown when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [transaksiList, motors, penyewas] = await Promise.all([
        TransaksiService.getAll(),
        getMotor(),
        PenyewaService.getAll(),
      ]);

      const today = new Date().toISOString().slice(0, 10);
      const alerts: typeof notifications = [];

      transaksiList.forEach((t) => {
        if (t.status === "dipinjam") {
          const motor = motors.find((m) => m.motor_id === t.motor_id);
          const penyewa = penyewas.find((p) => p.penyewa_id === t.penyewa_id);
          const motorName = motor ? `${motor.nama} (${motor.plat})` : `Motor #${t.motor_id}`;
          const penyewaName = penyewa ? penyewa.nama : `Penyewa #${t.penyewa_id}`;

          if (t.tanggal_kembali_rencana < today) {
            alerts.push({
              id: t.transaksi_id,
              message: `Terlambat: ${motorName}`,
              subtext: `${penyewaName} — Harusnya kembali ${t.tanggal_kembali_rencana}`,
              type: "overdue",
            });
          } else if (t.tanggal_kembali_rencana === today) {
            alerts.push({
              id: t.transaksi_id,
              message: `Jatuh Tempo: ${motorName}`,
              subtext: `${penyewaName} — Kembali hari ini`,
              type: "due_today",
            });
          }
        }
      });

      setNotifications(alerts);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const handleNotificationClick = (id: number) => {
    setShowDropdown(false);
    navigate(`/transaksi/edit/${id}`);
  };

  return (
    <header
      className="
        fixed
        top-4
        left-[17rem]
        right-4
        h-16
        bg-slate-800/90
        backdrop-blur-md
        border
        border-slate-700/50
        rounded-xl
        shadow-lg
        flex
        items-center
        justify-between
        px-6
        z-40
      "
    >

      {/* Left */}
      <Breadcrumbs />

      {/* Right */}
      <div className="flex items-center gap-4" ref={dropdownRef}>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-full hover:bg-slate-700 transition"
          >
            <Bell size={20} className="text-slate-200" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-slate-800 rounded-full animate-pulse" />
            )}
          </button>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="p-3 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
                <h3 className="text-sm font-semibold text-slate-200">Notifikasi ({notifications.length})</h3>
                <button
                  onClick={() => setShowDropdown(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <Bell size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-xs">Tidak ada notifikasi baru</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif.id)}
                        className="w-full text-left p-3 hover:bg-slate-700/50 transition active:bg-slate-700 flex gap-3 group"
                      >
                        <div className={`mt-1 shrink-0 ${notif.type === "overdue" ? "text-red-400" : "text-amber-400"}`}>
                          {notif.type === "overdue" ? <AlertCircle size={16} /> : <Calendar size={16} />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${notif.type === "overdue" ? "text-red-300 group-hover:text-red-200" : "text-amber-300 group-hover:text-amber-200"}`}>
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 group-hover:text-slate-300">
                            {notif.subtext}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 cursor-pointer hover:bg-slate-700 px-3 py-1 rounded-lg transition">
          <UserCircle size={28} className="text-slate-200" />
          <div className="text-sm leading-tight">
            <p className="font-medium text-slate-100">Admin</p>
            <p className="text-xs text-slate-400">Administrator</p>
          </div>
        </div>

      </div>
    </header>
  )
}
