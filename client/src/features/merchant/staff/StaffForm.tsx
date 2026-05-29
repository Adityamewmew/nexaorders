import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ImagePlus, Eye, EyeOff, Info, Save, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";

export default function StaffForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    password: "",
    confirmPassword: "",
    role: "CASHIER",
    isActive: true,
    photo: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handlePhotoUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { showToast("Format tidak didukung. Gunakan JPG, PNG, atau WebP.", "error"); return; }
    if (file.size > 2 * 1024 * 1024) { showToast("Ukuran file maksimal 2MB.", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setFormData(prev => ({ ...prev, photo: `http://localhost:5000${res.data.url}` }));
      showToast("Foto berhasil diupload!", "success");
    } catch {
      showToast("Gagal mengupload foto.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.name.trim() || !formData.password) {
      showToast("Harap isi semua kolom wajib!", "error");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      showToast("Password dan Konfirmasi Password tidak cocok!", "error");
      return;
    }
    if (formData.password.length < 6) {
      showToast("Password minimal 6 karakter!", "error");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        username: formData.username.trim(),
        name: formData.name.trim(),
        password: formData.password,
        role: formData.role,
        photo: formData.photo || null,
      });
      showToast("Akun kasir berhasil ditambahkan!", "success");
      navigate("/merchant/staff");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showToast(error.response?.data?.error || "Gagal membuat akun kasir", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto min-h-[calc(100vh-64px)] flex flex-col pb-24">
      
      {/* Tombol Kembali */}
      <button 
        onClick={() => navigate("/merchant/staff")}
        className="flex items-center gap-2 text-slate-800 font-bold hover:text-brand-primary transition-colors w-fit mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Kelola Akun Kasir
      </button>

      {/* Header Halaman */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-primary">Tambah Akun Kasir</h1>
        <p className="text-slate-500 mt-1">Tambahkan akun kasir baru untuk mengakses sistem di halaman ini</p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-brand-secondary/30 shadow-sm p-6 md:p-10 flex flex-col">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          
          {/* Kolom Kiri: Input Kredensial */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Nama Lengkap</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Masukkan nama lengkap kasir"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Username</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="Masukkan username kasir"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="bg-white border border-brand-secondary/30 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-1">Status Akun</h4>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Tentukan apakah akun aktif saat ini</p>
              </div>
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
          </div>

          {/* Kolom Kanan: Foto dan Role */}
          <div className="space-y-6">
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Role Akses</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors appearance-none"
              >
                <option value="CASHIER">Kasir</option>
                {/* Opsi role lain jika ada di masa depan */}
              </select>
            </div>

            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Foto Profil Kasir</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
              />
              <div
                onClick={() => !uploading && fileInputRef.current?.click()}
                className="w-full aspect-[2/1] border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
              >
                {formData.photo ? (
                  <>
                    <img src={formData.photo} alt="foto kasir" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">Ganti Foto</span>
                      <button
                        onClick={e => { e.stopPropagation(); setFormData(prev => ({ ...prev, photo: "" })); }}
                        className="bg-red-500/80 text-white p-1.5 rounded-full hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                ) : uploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-brand-secondary animate-spin" />
                    <p className="text-xs text-brand-secondary font-semibold">Mengupload...</p>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <ImagePlus className="w-5 h-5 text-slate-400 group-hover:text-brand-secondary transition-colors" />
                    </div>
                    <h4 className="font-bold text-slate-700 text-sm mb-1">Upload Foto</h4>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">JPG, PNG, WebP (Maks. 2MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="bg-red-50/50 border-l-4 border-red-400 p-4 rounded-r-xl flex gap-3 text-red-800 mt-auto">
              <Info className="w-5 h-5 shrink-0 text-red-500" />
              <p className="text-xs leading-relaxed">
                Akun kasir yang dibuat dapat digunakan untuk login ke dashboard kasir.
              </p>
            </div>
          </div>

        </div>

        {/* Footer Buttons */}
        <div className="mt-10 flex justify-end gap-3 pt-6 border-t border-slate-100">
          <button 
            onClick={() => navigate("/merchant/staff")}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 py-2.5 bg-brand-secondary hover:bg-brand-secondaryHover disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {loading ? "Menyimpan..." : "Simpan Akun"}
          </button>
        </div>

      </div>

    </div>
  );
}