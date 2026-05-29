import { useState, useEffect } from "react";
import { X, Plus, Users, UserCheck, UserX, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/api";

interface Merchant {
  id: number;
  username: string;
  name: string;
  email: string | null;
  role: string;
  status: string;
  createdAt: string;
}

export default function PlatformTenants() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  const fetchMerchants = async () => {
    try {
      const res = await api.get("/users?role=MERCHANT_ADMIN");
      setMerchants(res.data);
    } catch (err) {
      console.error("Gagal memuat data merchant:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMerchants(); }, []);

  const filteredMerchants = merchants.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (m.email || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddMerchant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.username || !formData.password) return;
    setSaving(true);
    try {
      await api.post("/auth/register", {
        name: formData.name,
        username: formData.username,
        email: formData.email || null,
        password: formData.password,
        role: "MERCHANT_ADMIN",
      });
      await fetchMerchants();
      setIsModalOpen(false);
      setFormData({ name: "", username: "", email: "", password: "" });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "Gagal menambah merchant");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (merchant: Merchant) => {
    const newStatus = merchant.status === "aktif" ? "nonaktif" : "aktif";
    try {
      await api.patch(`/users/${merchant.id}`, { status: newStatus });
      setMerchants(prev => prev.map(m => m.id === merchant.id ? { ...m, status: newStatus } : m));
    } catch {
      alert("Gagal mengubah status merchant");
    }
  };

  const activeCount = merchants.filter(m => m.status === "aktif").length;
  const inactiveCount = merchants.filter(m => m.status !== "aktif").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Merchant</h1>
          <p className="text-slate-600 text-sm mt-1">Kelola semua akun merchant admin yang terdaftar di sistem Nexa Order.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl font-medium transition-colors shadow-sm whitespace-nowrap flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah Merchant
        </button>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-bold text-slate-800">{merchants.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Aktif</p>
            <p className="text-xl font-bold text-slate-800">{activeCount}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <UserX className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500">Nonaktif</p>
            <p className="text-xl font-bold text-slate-800">{inactiveCount}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Cari nama, username, atau email..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#0B3B60] shadow-sm"
        />
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Memuat data merchant...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Nama</th>
                  <th className="px-6 py-4">Username</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Terdaftar</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMerchants.map((merchant) => (
                  <tr key={merchant.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{merchant.name}</td>
                    <td className="px-6 py-4 text-slate-600">@{merchant.username}</td>
                    <td className="px-6 py-4 text-slate-600">{merchant.email || "-"}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(merchant.createdAt).toLocaleDateString("id-ID")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        merchant.status === "aktif"
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      )}>
                        {merchant.status === "aktif" ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleStatus(merchant)}
                        className={cn(
                          "font-medium px-3 py-1 rounded-lg text-xs transition-colors",
                          merchant.status === "aktif"
                            ? "text-red-500 hover:bg-red-50"
                            : "text-green-600 hover:bg-green-50"
                        )}
                      >
                        {merchant.status === "aktif" ? "Suspend" : "Aktifkan"}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredMerchants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      {searchQuery ? `Tidak ada merchant dengan kata kunci "${searchQuery}"` : "Belum ada merchant yang terdaftar."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Merchant */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Tambah Merchant Baru</h3>
                <p className="text-sm text-slate-500">Daftarkan akun merchant admin baru ke sistem.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMerchant} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Nama Pemilik / Toko</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0B3B60] focus:border-transparent outline-none transition-all"
                  placeholder="Contoh: Bakso Malang Cak Arifin"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Username</label>
                <input
                  type="text" required
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0B3B60] focus:border-transparent outline-none transition-all"
                  placeholder="Contoh: baksomalang"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Email (Opsional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0B3B60] focus:border-transparent outline-none transition-all"
                  placeholder="Contoh: owner@baksomalang.com"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-slate-700">Password Default</label>
                <input
                  type="text" required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#0B3B60] focus:border-transparent outline-none transition-all"
                />
                <p className="text-xs text-slate-500">Merchant bisa ganti password setelah login pertama.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-sm"
                >
                  {saving ? "Menyimpan..." : "Simpan & Daftarkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
