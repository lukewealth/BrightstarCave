import { useState, useEffect, ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, getUserRole, UserRole } from "./lib/firebase";
import { CartProvider } from "./lib/cart-context";

// Components & Pages
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { OrderingPage } from "./pages/OrderingPage";
import { AdminPortal } from "./pages/AdminPortal";
import { StaffPortal } from "./pages/StaffPortal";
import { motion, AnimatePresence } from "motion/react";
import { Star } from "lucide-react";

const AuthGuard = ({ children, allowedRoles }: { children: ReactNode, allowedRoles: UserRole[] }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const user = auth.currentUser;

  useEffect(() => {
    if (user) {
      getUserRole(user.uid).then((r) => {
        setRole(r);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return null;
  if (!user) return <Navigate to="/" />;
  if (role && !allowedRoles.includes(role)) return <Navigate to="/" />;

  return <>{children}</>;
};

const RoleRedirector = ({ user, role }: { user: User | null, role: UserRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      if (role === 'admin' && !location.pathname.startsWith('/admin')) {
        navigate('/admin');
      } else if (role.startsWith('staff') && !location.pathname.startsWith('/staff')) {
        navigate('/staff');
      }
    }
  }, [user, role, navigate, location.pathname]);

  return null;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('guest');
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const r = await getUserRole(u.uid);
        setRole(r);
      } else {
        setRole('guest');
      }
      setTimeout(() => setLoading(false), 1000);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <CartProvider>
      <BrowserRouter>
        <div className="relative min-h-screen">
          <RoleRedirector user={user} role={role} />
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                key="loader"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[999] bg-primary flex flex-col items-center justify-center"
              >
                <div className="relative group">
                  <motion.div
                    animate={{ 
                      rotate: 360,
                      borderColor: ["rgba(212, 175, 53, 0.1)", "rgba(212, 175, 53, 0.4)", "rgba(212, 175, 53, 0.1)"]
                    }}
                    transition={{ 
                      rotate: { duration: 12, repeat: Infinity, ease: "linear" },
                      borderColor: { duration: 4, repeat: Infinity, ease: "easeInOut" }
                    }}
                    className="w-32 h-32 border border-accent/20 rounded-full"
                  />
                  <motion.div
                    animate={{ 
                      scale: [0.95, 1.1, 0.95],
                      opacity: [0.3, 0.8, 0.3]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Star className="text-accent fill-accent/20" size={40} />
                  </motion.div>
                </div>
                
                <div className="mt-12 overflow-hidden">
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="text-accent text-[10px] uppercase tracking-[0.8em] font-bold text-center"
                  >
                    Brightstar Cave
                  </motion.p>
                  <motion.div 
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.8, duration: 1.5, ease: "easeInOut" }}
                    className="h-px bg-accent/30 mt-4 w-40 origin-center mx-auto"
                  />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <Layout user={user} role={role} theme={theme} toggleTheme={toggleTheme}>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/orders" element={<OrderingPage user={user} />} />
              <Route path="/admin" element={
                <AuthGuard allowedRoles={['admin']}>
                  <AdminPortal user={user} />
                </AuthGuard>
              } />
              <Route path="/staff" element={
                <AuthGuard allowedRoles={['admin', 'staff', 'staff_bar', 'staff_waiter']}>
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
