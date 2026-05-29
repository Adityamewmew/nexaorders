import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard, Store, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/features/auth/authSlice";
import { RootState } from "@/store";

export default function PlatformLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Dashboard", path: "/platform/dashboard", icon: LayoutDashboard },
    { name: "Manajemen Tenant", path: "/platform/tenants", icon: Store },
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/platform/login");
  };

  // Komponen Sidebar agar bisa direuse di Desktop & Mobile
  const renderSidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-brand-primary font-bold text-xl shrink-0">
          N
        </div>
        <span className="font-bold text-xl tracking-wide truncate">NEXA ORDER</span>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-white/50 mb-4 px-2 uppercase tracking-wider">
          Superadmin Panel
        </div>
        {navItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                isActive
                  ? "bg-white text-brand-primary font-semibold shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-left text-white/80 hover:bg-white/10 hover:text-white rounded-xl transition-colors"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          <span className="truncate">Keluar</span>
        </button>

        <div className="mt-4 flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-brand-secondary rounded-full flex items-center justify-center text-white font-bold shrink-0 shadow-sm">
            {user?.name?.charAt(0) || "SA"}
          </div>
          <div className="truncate">
            <p className="text-sm font-semibold text-white truncate">{user?.name || "Super Admin"}</p>
            <p className="text-xs text-white/60 truncate">Platform Owner</p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full bg-brand-background overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-brand-primary text-white flex-col shadow-xl z-20">
        {renderSidebarContent()}
      </aside>

      {/* Overlay Mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 w-64 bg-brand-primary text-white flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="absolute top-4 right-4">
          <button onClick={() => setIsMobileMenuOpen(false)} className="text-white/80 hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>
        {renderSidebarContent()}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Topbar (Terlihat jelas di Mobile, opsional di Desktop) */}
        <header className="h-16 bg-white border-b flex items-center justify-between md:justify-start px-4 md:px-8 shadow-sm z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button
              className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
              {navItems.find((i) => location.pathname.includes(i.path))?.name || "Platform Admin"}
            </h2>
          </div>

          {/* Teks logo khusus mobile di topbar */}
          <div className="sm:hidden font-bold text-brand-primary flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-white text-xs">N</div>
            NEXA
          </div>
        </header>

        {/* Dynamic Content (Outlet) */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
