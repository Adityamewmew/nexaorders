import { BrowserRouter, Routes, Route, Navigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store";
import { loginSuccess, logout } from "@/features/auth/authSlice";
import api from "@/lib/api";

// Auth
import MerchantLogin from "@/features/merchant/MerchantLogin";
import ProtectedRoute from "@/components/ProtectedRoute";

// Platform (Superadmin)
import PlatformLayout from "@/layouts/PlatformLayout";
import PlatformLogin from "@/features/platform/PlatformLogin";
import PlatformDashboard from "@/features/platform/PlatformDashboard";
import PlatformTenants from "@/features/platform/PlatformTenants";

// Merchant Layout
import MerchantLayout from "@/layouts/MerchantLayout";

// Merchant pages (dikerjakan Ravi)
import MerchantDashboard from "@/features/merchant/MerchantDashboard";
import PointOfSale from "@/features/merchant/pos/PointOfSale";
import OrderList from "@/features/merchant/orders/OrderList";
import MenuList from "@/features/merchant/menu/MenuList";
import MenuForm from "@/features/merchant/menu/MenuForm";
import TableList from "@/features/merchant/tables/TableList";
import TableForm from "@/features/merchant/tables/TableForm";
import StaffList from "@/features/merchant/staff/StaffList";
import StaffForm from "@/features/merchant/staff/StaffForm";
import SalesReport from "@/features/merchant/reports/SalesReport";
import MerchantProfile from "@/features/merchant/profile/MerchantProfile";

// Customer (dikerjakan Aditya)
import CustomerLayout from "@/features/customer/layouts/CustomerLayout";
import MenuCatalogPage from "@/features/customer/pages/MenuCatalogPage";
import CartPage from "@/features/customer/pages/CartPage";
import CheckoutPage from "@/features/customer/pages/CheckoutPage";
import OrderStatusPage from "@/features/customer/pages/OrderStatusPage";

const MerchantIndexRedirect = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  if (user?.role === 'CASHIER') return <Navigate to="/merchant/pos" replace />;
  return <Navigate to="/merchant/dashboard" replace />;
};

// P3: Verifikasi token saat app pertama kali load
function TokenVerifier() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const token = localStorage.getItem('nexa_token');
    if (!token || !isAuthenticated) return;

    api.get('/auth/me').then(res => {
      // Token masih valid — update user data terbaru
      dispatch(loginSuccess({ user: res.data, token }));
    }).catch(() => {
      // Token expired atau invalid — logout
      dispatch(logout());
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

function App() {
  return (
    <BrowserRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <TokenVerifier />
      <Routes>
        {/* Home */}
        <Route path="/" element={
          <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center text-slate-800">
            <h1 className="text-4xl font-bold text-brand-primary mb-4">Nexa Order</h1>
            <p className="text-slate-500 mb-8">Self-Order E-Commerce untuk UMKM</p>
            <div className="flex gap-4">
              <Link to="/platform/login" className="px-6 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary/90 transition">Login Platform</Link>
              <Link to="/merchant/login" className="px-6 py-2 bg-brand-secondary text-white rounded-lg font-medium hover:bg-brand-secondary/90 transition">Login Merchant</Link>
            </div>
          </div>
        } />

        {/* Auth */}
        <Route path="/platform/login" element={<PlatformLogin />} />
        <Route path="/merchant/login" element={<MerchantLogin />} />

        {/* Platform (Superadmin) */}
        <Route path="/platform" element={
          <ProtectedRoute allowedRoles={['SUPERADMIN']}><PlatformLayout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/platform/dashboard" replace />} />
          <Route path="dashboard" element={<PlatformDashboard />} />
          <Route path="tenants" element={<PlatformTenants />} />
        </Route>

        {/* Merchant (Admin & Kasir) */}
        <Route path="/merchant" element={
          <ProtectedRoute allowedRoles={['MERCHANT_ADMIN', 'CASHIER']}><MerchantLayout /></ProtectedRoute>
        }>
          <Route index element={<MerchantIndexRedirect />} />
          <Route path="dashboard" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><MerchantDashboard /></ProtectedRoute>
          } />
          <Route path="menu" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN', 'CASHIER']}><MenuList /></ProtectedRoute>
          } />
          <Route path="menu/add" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><MenuForm /></ProtectedRoute>
          } />
          <Route path="menu/edit/:id" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><MenuForm /></ProtectedRoute>
          } />
          <Route path="tables" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><TableList /></ProtectedRoute>
          } />
          <Route path="tables/add" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><TableForm /></ProtectedRoute>
          } />
          <Route path="staff" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><StaffList /></ProtectedRoute>
          } />
          <Route path="staff/add" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN']}><StaffForm /></ProtectedRoute>
          } />
          <Route path="pos" element={
            <ProtectedRoute allowedRoles={['CASHIER']}><PointOfSale /></ProtectedRoute>
          } />
          <Route path="orders" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN', 'CASHIER']}><OrderList /></ProtectedRoute>
          } />
          <Route path="reports" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN', 'CASHIER']}><SalesReport /></ProtectedRoute>
          } />
          <Route path="profile" element={
            <ProtectedRoute allowedRoles={['MERCHANT_ADMIN', 'CASHIER']}><MerchantProfile /></ProtectedRoute>
          } />
        </Route>

        {/* Customer (QR Code) — tugas Aditya */}
        <Route path="/m/:tenantId/:tableId" element={<CustomerLayout />}>
          <Route index element={<MenuCatalogPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="status/:orderId" element={<OrderStatusPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
