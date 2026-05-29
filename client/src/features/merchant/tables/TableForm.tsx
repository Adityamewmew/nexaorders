import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, LayoutGrid, Info, QrCode, Download, Save, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { QRCodeSVG } from "qrcode.react";
import api from "@/lib/api";

export default function TableForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({ name: "", isActive: true });
  const [isGenerated, setIsGenerated] = useState(false);
  const [savedTableId, setSavedTableId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("Harap isi nama/nomor meja terlebih dahulu!", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/tables", {
        number: formData.name.trim(),
        status: formData.isActive ? "aktif" : "nonaktif",
      });
      setSavedTableId(res.data.id);
      setIsGenerated(true);
      showToast(`Meja '${formData.name}' berhasil ditambahkan!`, "success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showToast(error.response?.data?.error || "Gagal menambah meja", "error");
    } finally {
      setLoading(false);
    }
  };

  const generateCustomerUrl = () => {
    if (!savedTableId) return "";
    return `${window.location.origin}/m/1/${savedTableId}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto min-h-[calc(100vh-64px)] flex flex-col pb-24">
      
      {/* Tombol Kembali */}
      <button 
        onClick={() => navigate("/merchant/tables")}
        className="flex items-center gap-2 text-slate-800 font-bold hover:text-brand-primary transition-colors w-fit mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Kelola Meja
      </button>

      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary">Tambah Meja</h1>
        <p className="text-slate-500 mt-1">Tambahkan nomor meja dan generate QR code menu di halaman ini</p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border-2 border-brand-primary/20 shadow-sm overflow-hidden flex flex-col md:flex-row p-6 md:p-10 gap-10">
        
        {/* Left Side: Detail Meja */}
        <div className="flex-1 flex flex-col gap-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-secondary/10 text-brand-secondary flex items-center justify-center">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Detail Meja</h2>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Nomor Meja</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Masukkan nomor meja"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
            />
            <p className="text-xs text-slate-400 mt-2">Gunakan format angka atau kombinasi (Contoh: Meja 01, Meja 12)</p>
          </div>

          <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-sm">Status Meja</h4>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-bold", formData.isActive ? "text-brand-secondary" : "text-slate-400")}>
                {formData.isActive ? "Aktif" : "Nonaktif"}
              </span>
              <button 
                onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                className={cn(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                  formData.isActive ? "bg-brand-secondary" : "bg-slate-300"
                )}
              >
                <span className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                  formData.isActive ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex gap-4 text-slate-600 mt-auto">
            <Info className="w-5 h-5 shrink-0 text-red-400" />
            <div>
              <h4 className="font-bold text-sm mb-1 text-slate-800">Informasi Penting</h4>
              <p className="text-xs leading-relaxed">
                QR code akan digunakan customer untuk melakukan pemesanan menu secara mandiri melalui aplikasi Nexa Order di smartphone mereka.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: QR Preview */}
        <div className="flex-1 flex flex-col bg-slate-50 rounded-2xl p-6 border border-slate-200">
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">QR Code Preview</h3>
            <div className="bg-brand-secondary/10 px-3 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-brand-secondary uppercase">PILIH FORMAT PNG/PDF</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8 mb-6 relative">
            {isGenerated ? (
              <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 flex items-center justify-center">
                <QRCodeSVG 
                  value={generateCustomerUrl()}
                  size={192}
                  level="H"
                  includeMargin={false}
                  fgColor="#0f172a"
                />
              </div>
            ) : (
              <div className="w-48 h-48 bg-slate-100 rounded-2xl flex items-center justify-center border border-slate-200">
                <QrCode className="w-12 h-12 text-slate-300" />
              </div>
            )}
            <p className="text-xs text-slate-400 mt-6 text-center max-w-[200px]">
              {isGenerated 
                ? "QR Code siap digunakan."
                : "Masukkan nomor meja lalu generate untuk melihat preview"
              }
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={loading || isGenerated}
            className="w-full py-3.5 bg-brand-secondary hover:bg-brand-secondaryHover disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm mb-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <QrCode className="w-5 h-5" />}
            {isGenerated ? "Meja Tersimpan" : loading ? "Menyimpan..." : "Simpan & Generate QR"}
          </button>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={() => navigate("/merchant/tables")}
              className="py-3 bg-white border border-brand-primary text-brand-primary hover:bg-brand-primary/5 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Selesai
            </button>
            <button 
              disabled={!isGenerated}
              className="py-3 bg-brand-secondary hover:bg-brand-secondaryHover disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Unduh QR
            </button>
          </div>
          
          <button 
            onClick={() => navigate("/merchant/tables")}
            className="py-3 text-slate-500 hover:text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <X className="w-4 h-4" />
            Batal
          </button>

        </div>

      </div>

    </div>
  );
}