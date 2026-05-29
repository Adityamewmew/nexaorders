import { ImagePlus, AlertCircle, ArrowRight, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import api from "@/lib/api";

interface MenuBasicInfoProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formData: any;
  categories: { id: string; name: string }[];
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleToggleAvailability: () => void;
  onNext: () => void;
}

export default function MenuBasicInfo({ formData, categories, handleInputChange, handleToggleAvailability, onNext }: MenuBasicInfoProps) {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) { setUploadError("Format tidak didukung. Gunakan JPG, PNG, atau WebP."); return; }
    if (file.size > 2 * 1024 * 1024) { setUploadError("Ukuran file maksimal 2MB."); return; }

    setUploadError("");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await api.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      const url = `http://localhost:5000${res.data.url}`;
      // Trigger handleInputChange dengan synthetic event
      handleInputChange({ target: { name: "imageUrl", value: url } } as React.ChangeEvent<HTMLInputElement>);
    } catch {
      setUploadError("Gagal mengupload gambar. Coba lagi.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-brand-secondary/30 shadow-sm overflow-hidden flex flex-col">
      <div className="p-6 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-10">
        
        {/* Sisi Kiri: Upload Foto */}
        <div className="md:col-span-4 flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Foto Menu</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }}
          />
          <div
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleImageUpload(f); }}
            className="flex-1 min-h-[250px] border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer group relative overflow-hidden"
          >
            {formData.imageUrl ? (
              <>
                <img src={formData.imageUrl} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <span className="text-white text-xs font-semibold bg-black/50 px-3 py-1.5 rounded-full">Ganti Gambar</span>
                  <button
                    onClick={e => { e.stopPropagation(); handleInputChange({ target: { name: "imageUrl", value: "" } } as React.ChangeEvent<HTMLInputElement>); }}
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
                <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImagePlus className="w-6 h-6 text-brand-secondary" />
                </div>
                <h4 className="font-bold text-slate-700 mb-1">Drag & Drop atau Klik</h4>
                <p className="text-xs text-slate-400 leading-relaxed">JPG, PNG, WebP (Maks. 2MB)</p>
              </>
            )}
          </div>
          {uploadError && <p className="text-red-500 text-xs mt-1">{uploadError}</p>}
        </div>

        {/* Sisi Kanan: Input Fields */}
        <div className="md:col-span-8 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Nama Menu</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Contoh: Nasi Goreng Spesial"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Kategori</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors appearance-none"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Harga (Rp)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-semibold text-sm">Rp</span>
                </div>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Stok Awal</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-800 mb-2 block">Deskripsi Menu</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              placeholder="Jelaskan detail menu seperti bahan utama, rasa, dan porsi..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* Status Toggle Area */}
          <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-5 flex items-center justify-between mt-2">
            <div>
              <h4 className="font-bold text-slate-800 text-sm mb-1">Status Ketersediaan</h4>
              <p className="text-xs text-slate-500">Tampilkan menu ini di halaman pemesanan pelanggan</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-sm font-bold", formData.isAvailable ? "text-brand-secondary" : "text-slate-400")}>
                {formData.isAvailable ? "Tersedia" : "Disembunyikan"}
              </span>
              <button 
                onClick={handleToggleAvailability}
                className={cn(
                  "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none",
                  formData.isAvailable ? "bg-brand-secondary" : "bg-slate-300"
                )}
              >
                <span className={cn(
                  "inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm",
                  formData.isAvailable ? "translate-x-6" : "translate-x-1"
                )} />
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Footer Tab 1 */}
      <div className="mt-auto">
        <div className="bg-red-50/80 px-6 py-3 border-y border-red-100 flex items-center gap-2 text-red-600">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="text-xs font-semibold">Perubahan akan langsung terlihat pada menu pelanggan</span>
        </div>
        <div className="bg-slate-50 p-6 flex justify-end gap-3">
          <button 
            onClick={() => navigate("/merchant/menu")}
            className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button 
            onClick={onNext}
            className="px-6 py-2.5 bg-brand-secondary hover:bg-brand-secondaryHover text-white font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
          >
            Lanjut ke Add-on
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}