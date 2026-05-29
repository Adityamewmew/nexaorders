import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { CheckCircle2, Clock, ChefHat, Utensils, Receipt, Bell } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import api from '@/lib/api';
import { subscribePush, isPushSupported } from '@/lib/pushNotification';

interface OrderData {
  id: number;
  status: string;
  total: number;
  customerName: string | null;
  createdAt: string;
  table: { number: string } | null;
  items: Array<{
    quantity: number;
    subtotal: number;
    note: string | null;
    product: { name: string; price: number };
  }>;
  payment: { method: string; amount: number } | null;
}

const OrderStatusPage: React.FC = () => {
  const { tenantId, tableId, orderId } = useParams();
  const navigate = useNavigate();

  const { customerName, customerPhone } = useSelector((state: RootState) => state.customer);

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushLoading, setPushLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
      setError('');
    } catch {
      setError('Pesanan tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    setIsLoaded(true);

    // Cek apakah sudah subscribe push
    if (isPushSupported() && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('/sw.js').then(reg => {
        if (reg) reg.pushManager.getSubscription().then(sub => setPushEnabled(!!sub));
      });
    }

    // Polling setiap 5 detik
    const interval = setInterval(() => {
      fetchOrder();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchOrder]);

  // Stop polling jika sudah DONE
  useEffect(() => {
    if (order?.status === 'DONE') {
      // Tidak perlu stop interval karena sudah di-cleanup di useEffect atas
    }
  }, [order?.status]);

  const handleEnablePush = async () => {
    if (!orderId) return;
    setPushLoading(true);
    const success = await subscribePush(parseInt(orderId));
    setPushEnabled(success);
    setPushLoading(false);
  };

  const handleOrderMore = () => {
    setIsLoaded(false);
    setTimeout(() => navigate(`/m/${tenantId}/${tableId}`), 300);
  };

  const getStatusStep = () => {
    if (!order) return 0;
    if (order.status === 'PENDING') return 0;
    if (order.status === 'PROCESS') return 1;
    return 2; // DONE
  };

  const step = getStatusStep();

  const stepStyle = (stepIndex: number) => {
    if (stepIndex < step) return 'bg-brand-success text-white border-brand-success';
    if (stepIndex === step) return 'bg-white text-brand-secondary border-brand-secondary ring-4 ring-brand-secondary/30 shadow-lg scale-110';
    return 'bg-white text-slate-300 border-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-background flex items-center justify-center">
        <p className="text-slate-400 font-medium">Memuat status pesanan...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6 text-center">
        <p className="text-slate-500 font-medium mb-4">{error || 'Pesanan tidak ditemukan.'}</p>
        <button onClick={() => navigate(`/m/${tenantId}/${tableId}`)} className="bg-brand-primary text-white font-bold py-3 px-6 rounded-xl">
          Kembali ke Menu
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-brand-background flex flex-col h-screen overflow-hidden fixed inset-0 z-50 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${isLoaded ? 'translate-y-0' : 'translate-y-full'}`}>

      <div className="bg-brand-primary text-white p-4 text-center shrink-0">
        <h1 className="text-lg font-bold">Status Pesanan</h1>
        {order.status !== 'DONE' && (
          <p className="text-xs text-white/70 mt-0.5">Diperbarui otomatis setiap 5 detik</p>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        <div className="w-full max-w-xl mx-auto p-4 md:p-6 space-y-6">

          {/* Kartu Status */}
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 font-medium mb-2">Nomor Pesanan</p>
            <h1 className="text-6xl font-black text-brand-primary tracking-tighter mb-4">#{order.id}</h1>

            {/* Stepper */}
            <div className="relative mt-8 px-6">
              <div className="absolute top-6 left-[15%] right-[15%] h-1.5 bg-slate-100 -translate-y-1/2 z-0 rounded-full"></div>
              <div
                className="absolute top-6 left-[15%] h-1.5 bg-brand-success -translate-y-1/2 z-0 transition-all duration-1000 rounded-full"
                style={{ width: step === 0 ? '0%' : step === 1 ? '50%' : '70%' }}
              ></div>

              <div className="relative z-10 flex justify-between">
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${stepStyle(0)}`}>
                    <Clock className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${step === 0 ? 'text-brand-secondary' : 'text-slate-600'}`}>Diterima</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${stepStyle(1)}`}>
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${step === 1 ? 'text-brand-secondary' : 'text-slate-600'}`}>Disiapkan</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full border-4 flex items-center justify-center transition-all duration-500 ${stepStyle(2)}`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${step === 2 ? 'text-brand-success' : 'text-slate-600'}`}>Selesai</span>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="font-bold text-slate-800">
                {order.status === 'PENDING' && 'Pesananmu sudah masuk antrean.'}
                {order.status === 'PROCESS' && 'Koki kami sedang memasak pesananmu!'}
                {order.status === 'DONE' && 'Yeay! Pesananmu sudah siap disajikan.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {order.status === 'DONE'
                  ? 'Silakan ambil di kasir atau tunggu pelayan mengantar.'
                  : `Harap tunggu sebentar ya di Meja ${order.table?.number || tableId}.`}
              </p>
            </div>
          </div>

          {/* Tombol aktifkan notifikasi */}
          {isPushSupported() && order.status !== 'DONE' && (
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
              {pushEnabled ? (
                <div className="flex items-center gap-3 text-green-600">
                  <Bell className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold text-sm">Notifikasi Aktif</p>
                    <p className="text-xs text-slate-500">Kamu akan dapat notifikasi saat pesanan siap</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-brand-secondary shrink-0" />
                    <div>
                      <p className="font-bold text-sm text-slate-800">Aktifkan Notifikasi</p>
                      <p className="text-xs text-slate-500">Dapat notif saat pesanan siap, meski HP terkunci</p>
                    </div>
                  </div>
                  <button
                    onClick={handleEnablePush}
                    disabled={pushLoading}
                    className="bg-brand-secondary text-white text-xs font-bold px-4 py-2 rounded-xl shrink-0 disabled:opacity-50"
                  >
                    {pushLoading ? '...' : 'Aktifkan'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Rincian Pesanan */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
              <Receipt className="w-5 h-5 text-brand-primary" />
              <h2 className="font-bold text-slate-800">Rincian Pesanan</h2>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Nama Pemesan</span>
                <span className="font-bold text-slate-800">{order.customerName || customerName || 'Tamu'}</span>
              </div>
              {customerPhone && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">No. WhatsApp</span>
                  <span className="font-bold text-slate-800">{customerPhone}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Metode Bayar</span>
                <span className="font-bold text-brand-primary">{order.payment?.method || '-'}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-200 pt-4 space-y-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <p className="font-bold text-slate-700">{item.quantity}x {item.product.name}</p>
                    {item.note && <p className="text-[10px] text-slate-400 italic">Catatan: {item.note}</p>}
                  </div>
                  <span className="font-bold text-slate-800">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between items-center">
              <span className="font-bold text-slate-800">Total Harga</span>
              <span className="text-xl font-black text-brand-primary">{formatRupiah(order.total)}</span>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 pb-6 px-5 shadow-[0_-10px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium mb-0.5">Ada yang kurang?</p>
            <p className="font-bold text-slate-800 text-sm">Pesan menu tambahan</p>
          </div>
          <button
            onClick={handleOrderMore}
            className="bg-brand-primary text-white font-bold py-3.5 px-6 rounded-xl hover:bg-brand-primaryHover transition shadow-md active:scale-95 flex items-center gap-2"
          >
            Pesan Lagi
            <Utensils className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderStatusPage;
