import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Store, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { loginSuccess } from "@/features/auth/authSlice";
import api from "@/lib/api";

export default function MerchantLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (!['MERCHANT_ADMIN', 'CASHIER'].includes(user.role)) {
        setError("Akun ini tidak memiliki akses ke portal merchant.");
        setIsLoading(false);
        return;
      }

      dispatch(loginSuccess({ user, token }));

      if (user.role === 'CASHIER') {
        navigate("/merchant/pos");
      } else {
        navigate("/merchant/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || "Login gagal. Periksa email dan password Anda.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      <div className="hidden md:flex md:w-1/2 bg-brand-primary text-white flex-col justify-center p-12 lg:p-24 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-secondary opacity-20 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-8 shadow-lg">
            <Store className="w-8 h-8 text-brand-secondary" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            Nexa Order <br />
            <span className="text-brand-secondary">Merchant Portal</span>
          </h1>
          <p className="text-lg text-white/80 leading-relaxed max-w-md">
            Kelola operasional toko Anda dengan mudah. Pantau pesanan, atur stok menu, dan lihat laporan penjualan dalam satu platform.
          </p>
          <div className="mt-12 flex items-center gap-4 text-white/60 text-sm">
            <Store className="w-5 h-5" />
            <span>Aplikasi POS & Manajemen Merchant</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 flex items-center justify-center p-6 md:p-12 relative">
        <div className="absolute top-8 left-8 md:hidden flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-primary rounded-xl flex items-center justify-center text-white shadow-sm">
            <Store className="w-4 h-4" />
          </div>
          <span className="font-bold text-xl text-brand-primary">NEXA ORDER</span>
        </div>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 sm:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Selamat Datang</h2>
            <p className="text-slate-500 text-sm">Silakan masuk ke portal Merchant Anda.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-start gap-3">
              <span className="mt-0.5">⚠️</span>
              <p>{error}</p>
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
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                  placeholder="admin@bakso.com atau admin"
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
                  className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-brand-secondary hover:bg-brand-secondaryHover disabled:bg-brand-secondary/50 text-white font-bold py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /><span>Memproses...</span></>
              ) : (
                <><span>Masuk ke Portal</span><ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-500">
            <p>Gunakan akun merchant yang sudah didaftarkan oleh admin.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
