import { useState, useEffect, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, getUserRole, UserRole } from "./lib/firebase";
import { CartProvider } from "./lib/cart-context";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import OrderingPage from "./pages/OrderingPage";
import AdminPortal from "./pages/AdminPortal";
import StaffPortal from "./pages/StaffPortal";
import ServicePolicy from "./pages/ServicePolicy";
import DataProtection from "./pages/DataProtection";

// Security Gatekeeper
const AuthGuard = ({ 
  children, 
  user, 
  role, 
  allowedRoles 
}: { 
  children: ReactNode, 
  user: User | null, 
  role: UserRole, 
  allowedRoles: UserRole[] 
}) => {
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fireUser) => {
      if (fireUser) {
        const userRole = await getUserRole(fireUser.uid, fireUser.email);
        setUser(fireUser);
        setRole(userRole);
      } else {
        setUser(null);
        setRole('guest');
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
  };

  if (loading) return null;

  return (
    <CartProvider>
      <BrowserRouter>
        <div className={theme}>
          <Layout user={user} role={role} theme={theme} toggleTheme={toggleTheme}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/orders" element={<OrderingPage user={user} />} />
              <Route path="/service-policy" element={<ServicePolicy />} />
              <Route path="/data-protection" element={<DataProtection />} />
              
              <Route path="/admin" element={
                <AuthGuard user={user} role={role} allowedRoles={['admin']}>
                  <AdminPortal user={user} />
                </AuthGuard>
              } />

              <Route path="/staff" element={
                <AuthGuard user={user} role={role} allowedRoles={['admin', 'staff', 'staff_bar', 'staff_waiter']}>
                  <StaffPortal user={user} />
                </AuthGuard>
              } />
            </Routes>
          </Layout>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
