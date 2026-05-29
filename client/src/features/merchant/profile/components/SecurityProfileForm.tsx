import { useState } from "react";
import { Lock, EyeOff, Eye, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import api from "@/lib/api";

export default function SecurityProfileForm() {
  const { showToast } = useToast();
  const [showPassword, setShowPassword] = useState({ old: false, new: false, confirm: false });
  const [securityData, setSecurityData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [loading, setLoading] = useState(false);

  const handleSaveSecurity = async () => {
    if (!securityData.oldPassword || !securityData.newPassword || !securityData.confirmPassword) {
      showToast("Semua field wajib diisi", "error");
      return;
    }
    if (securityData.newPassword !== securityData.confirmPassword) {
      showToast("Password baru dan konfirmasi tidak cocok!", "error");
      return;
    }
    if (securityData.newPassword.length < 6) {
      showToast("Password baru minimal 6 karakter", "error");
      return;
    }

    setLoading(true);
    try {
      await api.patch("/auth/change-password", {
        oldPassword: securityData.oldPassword,
        newPassword: securityData.newPassword,
      });
      showToast("Password berhasil diubah!", "success");
      setSecurityData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showToast(error.response?.data?.error || "Gagal mengubah password", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-10 flex flex-col max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Ubah Password</h2>
          <p className="text-sm text-slate-500">Pastikan akun Anda selalu aman dengan password yang kuat.</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-slate-800 mb-2 block">Password Lama</label>
          <div className="relative">
            <input
              type={showPassword.old ? "text" : "password"}
              value={securityData.oldPassword}
              onChange={(e) => setSecurityData({...securityData, oldPassword: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <button type="button" onClick={() => setShowPassword(p => ({...p, old: !p.old}))} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
              {showPassword.old ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6">
          <label className="text-sm font-bold text-slate-800 mb-2 block">Password Baru</label>
          <div className="relative">
            <input
              type={showPassword.new ? "text" : "password"}
              value={securityData.newPassword}
              onChange={(e) => setSecurityData({...securityData, newPassword: e.target.value})}
              placeholder="Minimal 6 karakter"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <button type="button" onClick={() => setShowPassword(p => ({...p, new: !p.new}))} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
              {showPassword.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm font-bold text-slate-800 mb-2 block">Konfirmasi Password Baru</label>
          <div className="relative">
            <input
              type={showPassword.confirm ? "text" : "password"}
              value={securityData.confirmPassword}
              onChange={(e) => setSecurityData({...securityData, confirmPassword: e.target.value})}
              placeholder="••••••••"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
            />
            <button type="button" onClick={() => setShowPassword(p => ({...p, confirm: !p.confirm}))} className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600">
              {showPassword.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
        <button
          onClick={handleSaveSecurity}
          disabled={loading}
          className="px-8 py-3 bg-brand-secondary hover:bg-brand-secondaryHover disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {loading ? "Menyimpan..." : "Perbarui Password"}
        </button>
      </div>
    </div>
  );
}
