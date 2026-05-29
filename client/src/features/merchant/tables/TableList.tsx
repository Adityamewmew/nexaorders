import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, XSquare, Download, CalendarCheck, XCircle, LayoutGrid, Info, Check, Trash2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";

interface Table {
  id: number;
  number: string;
  status: string;
}

export default function TableList() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tableToDelete, setTableToDelete] = useState<number | null>(null);

  const fetchTables = async () => {
    try {
      const res = await api.get("/tables");
      setTables(res.data);
    } catch {
      showToast("Gagal memuat data meja", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTables(); }, []);

  const totalTables = tables.length;
  const activeTables = tables.filter(t => t.status === "aktif").length;
  const inactiveTables = tables.filter(t => t.status !== "aktif").length;

  const filteredTables = tables.filter(t => {
    if (filter === "active") return t.status === "aktif";
    if (filter === "inactive") return t.status !== "aktif";
    return true;
  });

  const confirmDelete = (id: number) => {
    setTableToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!tableToDelete) return;
    try {
      await api.delete(`/tables/${tableToDelete}`);
      setTables(prev => prev.filter(t => t.id !== tableToDelete));
      showToast("Meja berhasil dihapus", "success");
    } catch {
      showToast("Gagal menghapus meja", "error");
    } finally {
      setDeleteModalOpen(false);
      setTableToDelete(null);
    }
  };

  const handleToggleActive = async (table: Table) => {
    const newStatus = table.status === "aktif" ? "nonaktif" : "aktif";
    try {
      await api.put(`/tables/${table.id}`, { number: table.number, status: newStatus });
      setTables(prev => prev.map(t => t.id === table.id ? { ...t, status: newStatus } : t));
      showToast(`Meja ${table.number} ${newStatus === "aktif" ? "diaktifkan" : "dinonaktifkan"}`, "success");
    } catch {
      showToast("Gagal mengubah status meja", "error");
    }
  };

  const handleDownloadQR = (tableId: number, tableName: string) => {
    const svg = document.getElementById(`qr-${tableId}`);
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      img.onload = () => {
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, size, size);
          const padding = size * 0.1;
          ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
          ctx.fillStyle = "black";
          ctx.font = "bold 60px Arial";
          ctx.textAlign = "center";
          ctx.fillText(tableName, size / 2, size - 40);
          const pngFile = canvas.toDataURL("image/png");
          const link = document.createElement("a");
          link.download = `QR_${tableName.replace(/\s+/g, "_")}.png`;
          link.href = pngFile;
          link.click();
        }
      };
      img.src = "data:image/svg+xml;base64," + btoa(svgData);
      showToast(`QR Code ${tableName} berhasil diunduh`, "success");
    }
  };

  const generateCustomerUrl = (tableId: number) => {
    // Route customer: /m/:tenantId/:tableId
    // Karena single-tenant, gunakan tableId sebagai tenantId juga
    return `${window.location.origin}/m/1/${tableId}`;
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[calc(100vh-64px)]">
        <p className="text-slate-400">Memuat data meja...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-[1400px] mx-auto min-h-[calc(100vh-64px)] flex flex-col pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-brand-primary">Kelola Meja</h1>
          <p className="text-slate-500 mt-1">Pantau dan kelola nomor meja dan QR code di halaman ini</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:border-brand-primary appearance-none min-w-[140px] cursor-pointer"
          >
            <option value="all">Semua Meja</option>
            <option value="active">Meja Aktif</option>
            <option value="inactive">Meja Nonaktif</option>
          </select>
          <button
            onClick={() => navigate("/merchant/tables/add")}
            className="bg-brand-secondary hover:bg-brand-secondaryHover text-white font-bold py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Tambah Meja
          </button>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-brand-primary/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Meja</p>
            <h3 className="text-3xl font-black text-slate-800">{totalTables}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-green-500/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 text-green-500 rounded-xl flex items-center justify-center">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meja Aktif</p>
            <h3 className="text-3xl font-black text-slate-800">{activeTables}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-red-500/20 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Meja Nonaktif</p>
            <h3 className="text-3xl font-black text-slate-800">{inactiveTables}</h3>
          </div>
        </div>
      </div>

      {/* Grid Meja */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {filteredTables.map((table) => (
          <div key={table.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition-all">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{table.number}</h4>
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", table.status === "aktif" ? "text-green-500" : "text-slate-400")}>
                    {table.status === "aktif" ? "Aktif" : "Nonaktif"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {table.status === "aktif" && (
                  <button onClick={() => handleToggleActive(table)} className="text-slate-300 hover:text-amber-500 transition-colors" title="Nonaktifkan">
                    <XCircle className="w-5 h-5" />
                  </button>
                )}
                <button onClick={() => confirmDelete(table.id)} className="text-slate-300 hover:text-red-500 transition-colors" title="Hapus">
                  <XSquare className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50/50">
              <div className={cn("w-full aspect-square rounded-2xl flex flex-col items-center justify-center mb-4 shadow-inner overflow-hidden", table.status === "aktif" ? "bg-slate-900" : "bg-slate-300")}>
                {table.status === "aktif" ? (
                  <div className="bg-white p-3 rounded-xl shadow-sm">
                    <QRCodeSVG
                      id={`qr-${table.id}`}
                      value={generateCustomerUrl(table.id)}
                      size={180}
                      level="H"
                      includeMargin={false}
                      fgColor="#0f172a"
                    />
                  </div>
                ) : (
                  <>
                    <XCircle className="w-12 h-12 text-slate-400 mb-2" />
                    <p className="text-xs font-bold text-slate-500">QR TIDAK AKTIF</p>
                  </>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 grid grid-cols-2 gap-3 bg-white">
              {table.status === "aktif" ? (
                <>
                  <a href={generateCustomerUrl(table.id)} target="_blank" rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-brand-primary hover:border-brand-primary transition-colors font-bold text-xs">
                    <ExternalLink className="w-4 h-4" />
                    BUKA WEB
                  </a>
                  <button onClick={() => handleDownloadQR(table.id, table.number)}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-brand-secondary hover:bg-brand-secondaryHover text-white transition-colors font-bold text-xs shadow-sm">
                    <Download className="w-4 h-4" />
                    DOWNLOAD
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => handleToggleActive(table)}
                    className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl border border-green-500/30 text-green-600 hover:bg-green-50 transition-colors font-bold text-xs">
                    <Check className="w-4 h-4" />
                    AKTIFKAN
                  </button>
                  <button disabled className="flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed">
                    <Download className="w-4 h-4" />
                    DOWNLOAD
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredTables.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
            <p className="text-slate-500">Tidak ada meja yang ditemukan.</p>
          </div>
        )}
      </div>

      <div className="mt-auto">
        <div className="bg-red-50/80 p-5 rounded-2xl border border-red-100 flex gap-4 text-red-800">
          <Info className="w-6 h-6 shrink-0 mt-0.5 text-red-500" />
          <div>
            <h4 className="font-bold text-sm mb-1 text-red-600">Panduan Penggunaan QR Code</h4>
            <p className="text-xs leading-relaxed opacity-90">
              Cetak dan tempelkan QR Code ke masing-masing meja. Pelanggan cukup scan untuk melihat menu dan melakukan pemesanan.
            </p>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        title="Hapus Meja"
        description="Apakah Anda yakin ingin menghapus meja ini?"
        confirmText="Hapus"
        cancelText="Batal"
        icon={<Trash2 className="w-8 h-8" />}
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => { setDeleteModalOpen(false); setTableToDelete(null); }}
      />
    </div>
  );
}
