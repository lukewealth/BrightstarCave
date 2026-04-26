import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  SunIcon,
  MoonIcon,
  MapPinIcon,
  PhoneIcon,
  ClockIcon,
  UserIcon,
  ArrowLeftOnRectangleIcon,
  WifiIcon,
  ChevronRightIcon,
  Bars3BottomRightIcon,
  XMarkIcon,
  ShieldCheckIcon,
  KeyIcon,
  BoltIcon
} from "@heroicons/react/24/outline";
import { User, signOut } from "firebase/auth";
import { auth, UserRole } from "../lib/firebase";
import { LoginPopup } from "./LoginPopup";
import { Badge, OptimizedImage, Toast, GoldButton } from "./design-system/Primitive";

export const Layout = ({ 
  children, 
  user, 
  role,
  theme, 
  toggleTheme 
}: { 
  children: ReactNode, 
  user: User | null,
  role: UserRole,
  theme: string,
  toggleTheme: () => void
}) => {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setToast({ message: "Operational Session Terminated. Security Lock Active.", type: 'success', visible: true });
    } catch (err) {
      setToast({ message: "Termination failed.", type: 'error', visible: true });
    }
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "Heritage" },
    { to: "/orders", label: "Gastronomy" },
  ];

  const isOperator = role === 'admin' || role === 'staff' || role === 'staff_bar' || role === 'staff_waiter';

  return (
    <div className="min-h-screen flex flex-col bg-primary text-primary font-sans selection:bg-gold/30">
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      {/* Staff Operations Bar */}
      <AnimatePresence>
        {isOperator && !isAdminView && (
          <motion.div 
            initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
            className="h-10 bg-gold backdrop-blur-md flex items-center justify-between px-6 lg:px-12 z-[60] border-b border-black/10"
          >
            <div className="flex items-center gap-4">
              <BoltIcon className="w-4 h-4 text-black animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest text-black">Operator: {role?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center gap-6">
              <Link to={role === 'admin' ? "/admin" : "/staff"} className="text-[9px] font-black uppercase tracking-widest text-black hover:bg-black/5 px-3 py-1 rounded-full transition-all flex items-center gap-2">
                <ShieldCheckIcon className="w-3 h-3" /> Dashboard
              </Link>
              <button onClick={handleSignOut} className="text-[9px] font-black uppercase tracking-widest text-black/60 hover:text-black transition-colors">Exit</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <header className={`h-20 lg:h-24 flex items-center justify-between px-6 lg:px-12 border-b border-white/[0.03] bg-black/40 backdrop-blur-xl sticky z-50 transition-all ${isOperator && !isAdminView ? 'top-10' : 'top-0'}`}>
        <div className="flex items-center gap-4 lg:gap-6">
          <Link to="/" className="relative group overflow-hidden rounded-full shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} className="w-10 h-10 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/10">
              <OptimizedImage src="/logo.jpg" alt="Logo" aspectRatio="h-full" artistic={false} className="w-full h-full" />
            </motion.div>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg lg:text-2xl font-serif font-black tracking-[0.1em] lg:tracking-[0.15em] text-white uppercase leading-none">Brightstar Cave</h1>
            <span className="text-[7px] lg:text-[8px] uppercase tracking-[0.4em] lg:tracking-[0.5em] text-gold mt-1 font-bold leading-none">Luxury Hospitality</span>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((nav) => (
            <Link key={nav.to} to={nav.to} className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 relative group py-2 ${location.pathname === nav.to ? "text-gold" : "text-silver/60 hover:text-gold"}`}>
              <span className="relative z-10">{nav.label}</span>
              <motion.span className="absolute bottom-0 left-0 w-full h-[1px] bg-gold origin-left" initial={{ scaleX: 0 }} animate={{ scaleX: location.pathname === nav.to ? 1 : 0 }} />
            </Link>
          ))}
          {isOperator && (
            <Link to={role === 'admin' ? "/admin" : "/staff"} className="p-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold text-[9px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
              Terminal
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {!user ? (
            <motion.button whileHover={{ scale: 1.05 }} onClick={() => setIsLoginOpen(true)} className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-silver bg-white/5 px-5 py-2.5 rounded-xl border border-white/10 transition-all">
              <KeyIcon className="w-4 h-4" /> Portal
            </motion.button>
          ) : (
            <div className="flex items-center gap-4">
               <div className="w-8 h-8 rounded-full border border-gold/30 overflow-hidden hidden xs:block shadow-2xl">
                  <OptimizedImage src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=D4AF37&color=000`} alt="U" aspectRatio="h-full" artistic={false} />
               </div>
               <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gold hover:bg-white/5 rounded-xl transition-all">
                 <Bars3BottomRightIcon className="w-6 h-6" />
               </button>
            </div>
          )}
          {!user && <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 text-gold"><Bars3BottomRightIcon className="w-6 h-6" /></button>}
        </div>
      </header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] lg:hidden">
            <div onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25 }} className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-secondary p-8 flex flex-col">
              <div className="flex justify-between items-center mb-16">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-[0.4em] text-gold font-black">Selection</span>
                  <h4 className="text-xl font-serif text-white uppercase tracking-widest">Protocol</h4>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-silver"><XMarkIcon className="w-6 h-6" /></button>
              </div>
              <nav className="flex flex-col gap-8">
                {navItems.map((nav) => (
                  <Link key={nav.to} to={nav.to} className={`text-2xl font-serif uppercase tracking-widest block py-2 ${location.pathname === nav.to ? 'text-gold' : 'text-white'}`}>{nav.label}</Link>
                ))}
                {isOperator && <Link to={role === 'admin' ? "/admin" : "/staff"} className="text-2xl font-serif uppercase tracking-widest text-emerald">Dashboard</Link>}
              </nav>
              <div className="mt-auto pt-8 border-t border-white/5">
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div className="w-10 h-10 rounded-full border border-gold/30 overflow-hidden"><OptimizedImage src={user.photoURL || ""} alt="U" aspectRatio="h-full" artistic={false} /></div>
                      <div className="overflow-hidden"><p className="text-[10px] font-black text-white truncate">{user.email}</p><p className="text-[8px] text-gold uppercase font-bold">{role}</p></div>
                    </div>
                    <GoldButton onClick={handleSignOut} className="w-full py-5 text-[11px]">Terminate Session</GoldButton>
                  </div>
                ) : (
                  <GoldButton onClick={() => { setIsMobileMenuOpen(false); setIsLoginOpen(true); }} className="w-full py-5 text-[11px]">Authorize Access</GoldButton>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-primary no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }} className="h-full">
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        {!isAdminView && <Footer role={role} />}
      </div>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

const Footer = ({ role }: { role: UserRole }) => (
  <footer className="bg-secondary border-t border-white/[0.03] py-20 px-6 lg:px-12">
    <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center gap-12">
       <div className="flex flex-col items-center lg:items-start gap-4 text-center lg:text-left">
          <h2 className="text-2xl font-serif font-black uppercase text-white tracking-widest leading-none">Brightstar Cave</h2>
          <p className="text-silver/40 text-[9px] uppercase tracking-[0.4em]">Advanced Luxury Operational Systems © 2024</p>
       </div>
       <div className="flex flex-wrap justify-center gap-8 text-[9px] font-black uppercase tracking-[0.3em] text-silver/60">
          <Link to="/" className="hover:text-gold transition-all">Home</Link>
          <Link to="/about" className="hover:text-gold transition-all">Heritage</Link>
          <Link to="/orders" className="hover:text-gold transition-all">Gastronomy</Link>
          {role === 'admin' ? (
            <Link to="/admin" className="text-gold">Command Terminal</Link>
          ) : (role === 'staff' || role === 'staff_bar' || role === 'staff_waiter') ? (
            <Link to="/staff" className="text-emerald">Operator Terminal</Link>
          ) : null}
       </div>
    </div>
  </footer>
);
