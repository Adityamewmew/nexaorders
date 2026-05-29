import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Store, Mail, Lock, Loader2, ArrowRight } from "lucide-react";
import { loginSuccess } from "@/features/auth/authSlice";
import api from "@/lib/api";

export default function PlatformLogin() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (user.role !== 'SUPERADMIN') {
        setErrorMsg("Akun ini tidak memiliki akses ke panel superadmin.");
        setIsLoading(false);
        return;
      }

      dispatch(loginSuccess({ user, token }));
      navigate("/platform/dashboard");
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || "Email atau password salah.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-[#0B3B60] text-white flex-col justify-center p-12 lg:p-24 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-amber-500 opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#0B3B60] font-bold text-3xl mb-8 shadow-lg">N</div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Nexa Order <br />
            <span className="text-amber-500">Superadmin Panel</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
            Pusat kendali ekosistem Nexa Order. Kelola pendaftaran UMKM kuliner, pantau transaksi, dan bangun jaringan mitra yang luas.
          </p>
          <div className="mt-12 flex items-center gap-4 text-white/60 text-sm">
            <Store className="w-5 h-5" />
            <span>Sistem Multi-Tenant Tersentralisasi</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-3">
          <div className="w-8 h-8 bg-[#0B3B60] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">N</div>
          <span className="font-bold text-xl text-[#0B3B60]">NEXA ORDER</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang</h2>
            <p className="text-slate-500 text-sm">Silakan masuk ke akun Superadmin Anda.</p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3">
              <span className="mt-0.5">⚠️</span>
              <p>{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Email atau Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0B3B60] focus:border-transparent transition-all outline-none"
                  placeholder="admin@nexaorder.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 block">Kata Sandi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#0B3B60] focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></>
              ) : (
                <><span>Masuk ke Panel</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
            <p>Gunakan akun superadmin yang sudah didaftarkan oleh sistem.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
