import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, getUserRole, UserRole } from "./lib/firebase";

// Components & Pages
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { AboutUsPage } from "./pages/AboutUsPage";
import { OrderingPage } from "./pages/OrderingPage";
import { AdminPortal } from "./pages/AdminPortal";
import { motion, AnimatePresence } from "motion/react";
import { Star } from "lucide-react";

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
      setTimeout(() => setLoading(false), 1000); // Slight delay for transition
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === "dark" ? "light" : "dark"));

  return (
    <BrowserRouter>
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
              
              <motion.div 
                animate={{ rotate: -360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border border-accent/5 rounded-full border-dashed"
              />
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
            role !== 'guest' ? <AdminPortal user={user} /> : <Navigate to="/" />
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
