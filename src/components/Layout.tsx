import { ReactNode, useState } from "react";
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
  ChevronRightIcon
} from "@heroicons/react/24/outline";
import { User, signOut } from "firebase/auth";
import { auth, UserRole } from "../lib/firebase";
import { LoginPopup } from "./LoginPopup";
import { Badge, OptimizedImage } from "./design-system/Primitive";

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
  const isAdminView = location.pathname.startsWith("/admin");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.215, 0.61, 0.355, 1]
      }
    })
  };

  const navItems = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About Us" },
    { to: "/orders", label: "Menu" },
  ];

  if (role !== 'guest') {
    navItems.push({ to: "/admin", label: role === 'admin' ? "Admin" : "Staff" });
  }

  return (
    <div className="min-h-screen flex flex-col bg-primary text-primary font-sans selection:bg-gold/30">
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      
      {/* Header */}
      <header className="h-24 flex items-center justify-between px-12 border-b border-white/[0.03] bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link to="/" className="relative group overflow-hidden rounded-full">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              className="w-14 h-14 rounded-full overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/10"
            >
              <OptimizedImage 
                src="/logo.jpg" 
                alt="Logo" 
                aspectRatio="h-full" 
                artistic={false}
                className="w-full h-full" 
              />
            </motion.div>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-serif font-black tracking-[0.15em] text-white uppercase leading-none">Brightstar Cave</h1>
            <span className="text-[8px] uppercase tracking-[0.5em] text-gold mt-1 font-bold">Luxury Hospitality</span>
          </div>
        </div>
        
        <nav className="hidden lg:flex items-center gap-12">
          {navItems.map((nav, i) => (
            <motion.div 
              key={nav.to} 
              custom={i}
              initial="hidden"
              animate="visible"
              variants={navVariants}
            >
              <Link 
                to={nav.to} 
                className={`text-[11px] font-black tracking-[0.4em] uppercase transition-all duration-300 relative group py-2
                  ${location.pathname === nav.to ? "text-gold" : "text-silver/60 hover:text-gold"}`}
              >
                <span className="relative z-10">{nav.label}</span>
                <motion.span 
                  className="absolute bottom-0 left-0 w-full h-[2px] bg-gold origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: location.pathname === nav.to ? 1 : 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.4 }}
                />
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center gap-8">
          <motion.button 
            whileHover={{ scale: 1.1, color: "#D4AF37" }}
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-silver hover:border-gold/30 transition-all"
          >
            {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </motion.button>
          
          <div className="flex items-center gap-4 border-l border-white/10 pl-8">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{user.displayName || user.email?.split('@')[0]}</p>
                    <Badge color={role === 'admin' ? 'gold' : role.startsWith('staff') ? 'emerald' : 'silver'}>{role.replace('_', ' ')}</Badge>
                  </div>
                  <button onClick={() => signOut(auth)} className="text-[9px] text-gold/60 hover:text-gold uppercase tracking-widest font-bold transition-colors flex items-center gap-1 ml-auto">
                    Exit <ArrowLeftOnRectangleIcon className="w-3 h-3" />
                  </button>
                </div>
                <div className="w-10 h-10 rounded-full border-2 border-gold/20 shadow-xl overflow-hidden">
                  <OptimizedImage 
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=D4AF37&color=000`} 
                    alt="Avatar" 
                    aspectRatio="h-full"
                    artistic={false}
                    className="w-full h-full"
                  />
                </div>
              </div>
            ) : (
              <motion.button 
                whileHover={{ backgroundColor: "rgba(212, 175, 53, 0.1)", borderColor: "#D4AF37", color: "#D4AF37" }}
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-silver bg-white/5 px-6 py-3 rounded-xl border border-white/10 transition-all"
              >
                <UserIcon className="w-4 h-4" />
                Portal
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-primary no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {!isAdminView && <Footer />}
      </div>
    </div>
  );
};

const Footer = () => {
  return (
    <footer className="bg-secondary border-t border-white/[0.03] pt-32 pb-16 px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-20 mb-24">
          <div className="col-span-1 md:col-span-1 space-y-10">
            <div className="flex flex-col gap-6">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/10"
              >
                <OptimizedImage 
                  src="/logo.jpg" 
                  alt="Logo" 
                  aspectRatio="h-full" 
                  artistic={false}
                  className="w-full h-full" 
                />
              </motion.div>
              <h2 className="text-4xl font-serif font-black tracking-tighter uppercase text-white">Brightstar Cave</h2>
            </div>
            <p className="text-secondary text-sm leading-relaxed font-light italic opacity-70">
              "Where Stars Align in a Symphony of Metals & Nature."
            </p>
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i} 
                  whileHover={{ scale: 1.1, backgroundColor: "rgba(212, 175, 53, 0.1)", borderColor: "#D4AF37" }}
                  className="w-11 h-11 rounded-xl border border-white/10 flex items-center justify-center text-secondary hover:text-gold transition-all cursor-pointer bg-white/5"
                >
                  <WifiIcon className="w-5 h-5" />
                </motion.div>
              ))}
            </div>
          </div>
          
          <div>
            <h5 className="text-gold font-black mb-10 text-[10px] uppercase tracking-[0.5em] border-b border-gold/20 pb-4">Navigation</h5>
            <ul className="space-y-5 text-secondary text-sm font-bold uppercase tracking-widest">
              <li><Link to="/about" className="hover:text-gold transition-colors block">Our Heritage</Link></li>
              <li><Link to="/orders" className="hover:text-gold transition-colors block">Curated Menu</Link></li>
              <li><button className="hover:text-gold transition-colors block text-left">Private Events</button></li>
              <li><button className="hover:text-gold transition-colors block text-left">Membership</button></li>
            </ul>
          </div>

          <div>
            <h5 className="text-gold font-black mb-10 text-[10px] uppercase tracking-[0.5em] border-b border-gold/20 pb-4">Sanctuary Terminal</h5>
            <ul className="space-y-8 text-secondary text-sm font-light">
              <li className="flex gap-4 items-start group">
                <MapPinIcon className="w-5 h-5 text-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="leading-relaxed group-hover:text-white transition-colors">Road 3C Ogunfayo, <br />between Blenco/Limitless, <br />Lagos</span>
              </li>
              <li className="flex gap-4 items-start group">
                <PhoneIcon className="w-5 h-5 text-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="font-mono group-hover:text-white transition-colors">09168858844 <br />Reservations Preferred</span>
              </li>
              <li className="flex gap-4 items-start group">
                <ClockIcon className="w-5 h-5 text-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="group-hover:text-white transition-colors">24/7 Concierge Terminal</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-gold font-black mb-10 text-[10px] uppercase tracking-[0.5em] border-b border-gold/20 pb-4">Elite Circle</h5>
            <p className="text-[11px] text-secondary mb-8 font-light leading-relaxed opacity-60">Join for exclusive event transmissions and menu previews.</p>
            <div className="relative group">
              <input 
                className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-5 px-6 text-sm text-white focus:outline-none focus:border-gold/30 transition-all pr-14 placeholder:text-white/10" 
                placeholder="Email Frequency" 
                type="email"
              />
              <motion.button 
                whileHover={{ scale: 1.1, x: 5 }}
                className="absolute right-4 top-4 p-1.5 text-gold hover:text-white transition-colors"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </motion.button>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/[0.03] pt-16 flex flex-col lg:flex-row justify-between items-center gap-10">
          <p className="text-[9px] text-secondary uppercase tracking-[0.5em] font-black opacity-40">© 2024 Brightstar Cave. Advanced Luxury Systems.</p>
          <div className="flex gap-12 text-[9px] text-secondary uppercase tracking-[0.5em] font-black">
            <button className="hover:text-gold transition-colors">Privacy</button>
            <button className="hover:text-gold transition-colors">Terms</button>
            <Link to="/admin" className="text-gold hover:brightness-125 transition-all">Staff Terminal</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
