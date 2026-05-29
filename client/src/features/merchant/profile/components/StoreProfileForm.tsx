import { useState } from "react";
import { Save, ImagePlus, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";

export default function StoreProfileForm() {
  const { showToast } = useToast();
  const user = useSelector((state: RootState) => state.auth.user);
  const [loading, setLoading] = useState(false);
  const [storeData, setStoreData] = useState({
    name: user?.name || "",
    phone: "",
    address: "",
    openTime: "08:00",
    closeTime: "22:00",
    description: ""
  });

  const handleSaveStore = async () => {
    if (!storeData.name.trim()) {
      showToast("Nama toko wajib diisi", "error");
      return;
    }
    setLoading(true);
    try {
      // Update nama user (nama toko = nama pemilik/merchant)
      await api.patch(`/users/${user?.id}`, { name: storeData.name.trim() });
      showToast("Profil toko berhasil disimpan!", "success");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showToast(error.response?.data?.error || "Gagal menyimpan profil", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-10">

        {/* Kiri: Logo Toko */}
        <div className="md:col-span-4 flex flex-col">
          <label className="text-sm font-bold text-slate-800 mb-3">Logo Toko</label>
          <div className="flex-1 min-h-[250px] border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group">
            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ImagePlus className="w-8 h-8 text-brand-secondary" />
            </div>
            <h4 className="font-bold text-slate-700 mb-1">Upload Logo</h4>
            <p className="text-xs text-slate-400 leading-relaxed">Format: JPG, PNG (Max. 2MB)</p>
          </div>
        </div>

        {/* Kanan: Form Info Toko */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Nama Toko / Pemilik</label>
            <input
              type="text"
              value={storeData.name}
              onChange={(e) => setStoreData({...storeData, name: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Nomor Telepon</label>
              <input
                type="tel"
                value={storeData.phone}
                onChange={(e) => setStoreData({...storeData, phone: e.target.value})}
                placeholder="081234567890"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 block">Buka</label>
                <input
                  type="time"
                  value={storeData.openTime}
                  onChange={(e) => setStoreData({...storeData, openTime: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-slate-800 mb-2 block">Tutup</label>
                <input
                  type="time"
                  value={storeData.closeTime}
                  onChange={(e) => setStoreData({...storeData, closeTime: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Alamat Lengkap</label>
            <textarea
              value={storeData.address}
              onChange={(e) => setStoreData({...storeData, address: e.target.value})}
              rows={2}
              placeholder="Jl. Contoh No. 123, Kota"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Deskripsi Singkat</label>
            <textarea
              value={storeData.description}
              onChange={(e) => setStoreData({...storeData, description: e.target.value})}
              rows={3}
              placeholder="Ceritakan tentang toko Anda..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleSaveStore}
          disabled={loading}
          className="px-8 py-3 bg-brand-primary hover:bg-brand-primaryHover disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loading ? "Menyimpan..." : "Simpan Profil Toko"}
        </button>
      </div>
    </div>
  );
}
