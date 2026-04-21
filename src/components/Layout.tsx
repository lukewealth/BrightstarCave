import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  LogIn, 
  Wifi, 
  ChevronRight, 
  Clock,
  Sun,
  Moon,
  MapPin,
  Phone
} from "lucide-react";
import { User, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { LoginPopup } from "./LoginPopup";

export const Layout = ({ 
  children, 
  user, 
  theme, 
  toggleTheme 
}: { 
  children: ReactNode, 
  user: User | null,
  theme: string,
  toggleTheme: () => void
}) => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Common hover effect for 2X scale
  const hover2X = {
    scale: 2,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  return (
    <div className="min-h-screen flex flex-col bg-primary text-primary">
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-white/[0.03] bg-black/20 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link to="/" className="relative group">
            <motion.div 
              whileHover={hover2X}
              className="w-12 h-12 rounded-full overflow-hidden border border-emerald/30 shadow-lg shadow-emerald/10"
            >
              <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
            </motion.div>
          </Link>
          <h1 className="text-xl font-bold tracking-widest text-primary uppercase font-sans">Brightstar Cave</h1>
        </div>
        
        <nav className="hidden md:flex items-center gap-10 text-[10px] font-bold tracking-[0.3em] uppercase">
          {[
            { to: "/", label: "Home" },
            { to: "/about", label: "About Us" },
            { to: "/orders", label: "Menu" },
            { to: "/admin", label: "Management" }
          ].map((nav) => (
            <motion.div key={nav.to} whileHover={hover2X}>
              <Link 
                to={nav.to} 
                className={`${location.pathname === nav.to ? "text-emerald border-b border-emerald pb-1" : "text-secondary hover:text-white"} transition-all`}
              >
                {nav.label}
              </Link>
            </motion.div>
          ))}
        </nav>

        <div className="flex items-center gap-6">
          <motion.button 
            whileHover={hover2X}
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-white/5 transition-colors text-silver"
            aria-label="Toggle Theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </motion.button>
          
          <div className="text-right hidden sm:block border-r border-white/10 pr-6 mr-2">
            <p className="text-[9px] uppercase tracking-widest text-secondary font-bold">Terminal</p>
            <p className="text-[10px] text-emerald font-bold uppercase">Active</p>
          </div>
          
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="text-right hidden xs:block">
                  <p className="text-[10px] font-bold text-primary leading-none">{user.displayName || user.email}</p>
                  <button onClick={() => signOut(auth)} className="text-[9px] text-gold uppercase tracking-widest hover:opacity-70 font-bold">Sign Out</button>
                </div>
                <motion.img 
                  whileHover={hover2X}
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.email}&background=10B981&color=000`} 
                  alt="Avatar" 
                  className="w-9 h-9 rounded-full border border-emerald/30 shadow-lg shadow-emerald/10 cursor-pointer" 
                  referrerPolicy="no-referrer" 
                />
              </div>
            ) : (
              <motion.button 
                whileHover={hover2X}
                onClick={() => setIsLoginOpen(true)}
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-silver hover:text-white transition-all bg-white/5 px-4 py-2 rounded-lg border border-white/10"
              >
                <LogIn size={14} />
                Portal
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-primary">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        
        {!isAdmin && <Footer />}
      </div>
    </div>
  );
};

const Footer = () => {
  const hover2X = {
    scale: 2,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  return (
    <footer className="bg-secondary border-t border-white/[0.03] pt-24 pb-12 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
          <div className="col-span-1 md:col-span-1 space-y-8">
            <div className="flex flex-col gap-6">
              <motion.div 
                whileHover={hover2X}
                className="w-24 h-24 rounded-full overflow-hidden border border-emerald/30 shadow-xl shadow-emerald/10"
              >
                <img src="/logo.jpg" alt="Logo" className="w-full h-full object-cover" />
              </motion.div>
              <h2 className="text-4xl font-black tracking-tighter uppercase font-sans text-white">Brightstar Cave</h2>
            </div>
            <p className="text-secondary text-sm leading-relaxed font-light italic">
              "Where Stars Align in a Symphony of Metals & Nature."
            </p>
            <div className="flex gap-4">
              {[1, 2, 3].map(i => (
                <motion.div 
                  key={i} 
                  whileHover={hover2X}
                  className="size-10 rounded-full border border-white/10 flex items-center justify-center text-secondary hover:text-emerald hover:border-emerald transition-all cursor-pointer bg-white/5"
                >
                  <Wifi size={18} />
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <h5 className="text-white font-bold mb-8 text-xs uppercase tracking-[0.3em] border-b border-white/5 pb-2">Navigation</h5>
            <ul className="space-y-4 text-secondary text-sm font-medium">
              <li><motion.div whileHover={hover2X}><Link to="/about" className="hover:text-emerald transition-colors">Our Heritage</Link></motion.div></li>
              <li><motion.div whileHover={hover2X}><Link to="/orders" className="hover:text-emerald transition-colors">Curated Menu</Link></motion.div></li>
              <li><motion.div whileHover={hover2X}><button className="hover:text-emerald transition-colors text-left">Private Events</button></motion.div></li>
              <li><motion.div whileHover={hover2X}><button className="hover:text-emerald transition-colors text-left">Membership</button></motion.div></li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-8 text-xs uppercase tracking-[0.3em] border-b border-white/5 pb-2">Visit Our Sanctuary</h5>
            <ul className="space-y-6 text-secondary text-sm font-light">
              <li className="flex gap-4 items-start">
                <MapPin size={18} className="text-emerald shrink-0 mt-0.5" />
                <span className="leading-relaxed">Road 3C Ogunfayo, <br />between Blenco/Limitless supermarket, <br />Lagos</span>
              </li>
              <li className="flex gap-4 items-start">
                <Phone size={18} className="text-emerald shrink-0 mt-0.5" />
                <span className="font-mono">09168858844 <br />Reservations Preferred</span>
              </li>
              <li className="flex gap-4 items-start">
                <Clock size={18} className="text-emerald shrink-0 mt-0.5" />
                <span>24/7 Concierge Available</span>
              </li>
            </ul>
          </div>
          <div>
            <h5 className="text-white font-bold mb-8 text-xs uppercase tracking-[0.3em] border-b border-white/5 pb-2">Elite Circle</h5>
            <p className="text-[11px] text-secondary mb-6 font-light leading-relaxed">Join for exclusive event transmissions and menu previews.</p>
            <div className="relative group">
              <input 
                className="w-full bg-white/[0.02] border border-white/5 rounded-xl py-4 px-5 text-sm text-white focus:outline-none focus:border-emerald/30 transition-all pr-12" 
                placeholder="Email Terminal" 
                type="email"
              />
              <motion.button 
                whileHover={hover2X}
                className="absolute right-3 top-3 p-1.5 text-emerald hover:text-white transition-transform"
              >
                <ChevronRight />
              </motion.button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/[0.03] pt-12 flex flex-col md:row justify-between items-center gap-8">
          <p className="text-[10px] text-secondary uppercase tracking-[0.4em] font-bold opacity-50">© 2024 Brightstar Cave. Luxury Hospitality Management.</p>
          <div className="flex gap-10 text-[10px] text-secondary uppercase tracking-[0.4em] font-bold">
            <motion.button whileHover={hover2X} className="hover:text-white transition-colors">Privacy</motion.button>
            <motion.button whileHover={hover2X} className="hover:text-white transition-colors">Terms</motion.button>
            <motion.div whileHover={hover2X}><Link to="/admin" className="hover:text-white transition-colors text-gold">Staff Terminal</Link></motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
};
