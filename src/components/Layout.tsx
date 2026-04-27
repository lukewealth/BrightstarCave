import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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
  BoltIcon,
  ShoppingBagIcon,
  HomeIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  ShieldExclamationIcon,
  SparklesIcon
} from "@heroicons/react/24/outline";
import { User } from "firebase/auth";
import { UserRole, logout } from "../lib/firebase";
import { LoginPopup } from "./LoginPopup";
import { Badge, OptimizedImage, Toast, GoldButton } from "./design-system/Primitive";
import { useCart } from "../lib/cart-context";

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
  const { cart, totalAmount, cartCount, updateQuantity } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const isAdminView = location.pathname.startsWith("/admin") || location.pathname.startsWith("/staff");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Close menus on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMiniCartOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      setToast({ message: "Session Terminated. Security Lock Active.", type: 'success', visible: true });
      navigate("/");
    } catch (err) {
      setToast({ message: "Termination failed.", type: 'error', visible: true });
    }
  };

  const navItems = [
    { to: "/", label: "Home", icon: HomeIcon },
    { to: "/about", label: "Heritage", icon: InformationCircleIcon },
    { to: "/orders", label: "Gastronomy", icon: SparklesIcon },
  ];

  const policyItems = [
    { to: "/service-policy", label: "Service Policy", icon: DocumentTextIcon },
    { to: "/data-protection", label: "Data Protection", icon: ShieldExclamationIcon },
  ];

  const isOperator = role === 'admin' || role === 'staff' || role === 'staff_bar' || role === 'staff_waiter';

  return (
    <div className="min-h-screen flex flex-col bg-primary text-primary font-sans selection:bg-gold/30 relative overflow-x-hidden">
      <LoginPopup isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Staff Operations Bar */}
      <AnimatePresence>
        {isOperator && !isAdminView && (
          <motion.div 
            initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }}
            className="h-10 bg-gold backdrop-blur-md flex items-center justify-between px-6 lg:px-12 z-[60] border-b border-black/10 fixed top-0 left-0 right-0"
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
      <header className={`h-20 lg:h-24 flex items-center justify-between px-6 lg:px-12 border-b border-white/5 glass-card sticky z-50 transition-all ${isOperator && !isAdminView ? 'top-10' : 'top-0'}`}>
        <div className="flex items-center gap-4 lg:gap-6">
          <Link to="/" className="relative group shrink-0">
            <motion.div whileHover={{ scale: 1.05 }} className="w-10 h-10 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/10">
              <OptimizedImage src="/logo.jpg" alt="Logo" aspectRatio="h-full" artistic={false} className="w-full h-full" />
            </motion.div>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-lg lg:text-2xl font-serif font-black tracking-[0.1em] lg:tracking-[0.15em] text-white uppercase leading-none">Brightstar Cave</h1>
            <span className="text-[7px] lg:text-[8px] uppercase tracking-[0.4em] lg:tracking-[0.5em] text-gold mt-1 font-bold leading-none">Luxury Hospitality</span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-10">
          {navItems.map((nav) => (
            <Link 
              key={nav.to} 
              to={nav.to} 
              className={`text-[10px] font-black tracking-[0.3em] uppercase transition-all duration-300 relative group py-2
                ${location.pathname === nav.to ? "text-gold" : "text-silver/60 hover:text-gold"}`}
            >
              <span className="relative z-10">{nav.label}</span>
              <motion.span 
                className="absolute bottom-0 left-0 w-full h-[1px] bg-gold origin-left"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: location.pathname === nav.to ? 1 : 0 }}
              />
            </Link>
          ))}
          {isOperator && (
            <Link to={role === 'admin' ? "/admin" : "/staff"} className="p-2.5 bg-gold/10 border border-gold/20 rounded-xl text-gold text-[9px] font-black uppercase tracking-widest hover:bg-gold hover:text-black transition-all">
              Terminal
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1, color: "#D4AF37" }}
            onClick={toggleTheme}
            className="p-2 lg:p-2.5 rounded-xl bg-white/5 border border-white/10 text-silver hover:border-gold/30 transition-all hidden sm:block"
          >
            {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </motion.button>

          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-gold hover:bg-white/5 rounded-xl transition-all flex items-center gap-3">
             <span className="hidden lg:block text-[9px] font-black uppercase tracking-[0.3em]">Protocol</span>
             <Bars3BottomRightIcon className="w-6 h-6 lg:w-7 lg:h-7" />
          </button>
        </div>
      </header>

      {/* Global Floating Mini-Cart */}
      <AnimatePresence>
        {!isAdminView && (
          <div className="fixed bottom-6 lg:bottom-10 right-6 lg:right-10 z-[100] flex flex-col items-end gap-4">
             <AnimatePresence>
                {isMiniCartOpen && cartCount > 0 && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="w-72 lg:w-80 bg-black/80 backdrop-blur-2xl border border-gold/20 rounded-[32px] overflow-hidden shadow-2xl"
                  >
                    <header className="p-6 border-b border-white/5 flex justify-between items-center bg-gold/5">
                       <h4 className="text-[10px] font-black uppercase tracking-widest text-gold">Current Selection</h4>
                       <button onClick={() => setIsMiniCartOpen(false)}><XMarkIcon className="w-4 h-4 text-silver" /></button>
                    </header>
                    <div className="max-h-60 overflow-y-auto p-4 space-y-3 no-scrollbar">
                       {cart.map(item => (
                         <div key={item.id} className="flex justify-between items-center gap-4 group">
                            <div className="flex-1 overflow-hidden">
                               <p className="text-[10px] font-bold text-white truncate uppercase">{item.name}</p>
                               <p className="text-[8px] text-gold font-black">₦{item.price.toLocaleString()} x {item.quantity}</p>
                            </div>
                            <div className="flex items-center gap-2">
                               <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-full text-gold text-[10px]">-</button>
                               <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-5 h-5 flex items-center justify-center bg-white/5 rounded-full text-gold text-[10px]">+</button>
                            </div>
                         </div>
                       ))}
                    </div>
                    <footer className="p-6 border-t border-white/5 bg-black/40 space-y-4">
                       <div className="flex justify-between items-end">
                          <span className="text-[8px] text-silver uppercase font-black tracking-widest">Total Audit</span>
                          <span className="text-xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span>
                       </div>
                       <GoldButton onClick={() => { setIsMiniCartOpen(false); navigate('/orders'); }} className="w-full py-4 text-[9px]">
                          Complete Transmission
                       </GoldButton>
                    </footer>
                  </motion.div>
                )}
             </AnimatePresence>

             <motion.button
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (cartCount > 0) setIsMiniCartOpen(!isMiniCartOpen);
                  else navigate('/orders');
                }}
                className="p-5 lg:p-6 bg-gold text-black rounded-full shadow-[0_20px_50px_rgba(212,175,55,0.3)] group flex items-center justify-center border-2 border-white/10 relative"
              >
                <ShoppingBagIcon className="w-7 h-7 lg:w-8 lg:h-8" />
                {cartCount > 0 && <div className="absolute -top-1 -right-1 bg-white text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-gold shadow-lg">{cartCount}</div>}
              </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Unified Protocol Menu (Wide & Mobile) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]">
            <div onClick={() => setIsMobileMenuOpen(false)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30 }} className="absolute right-0 top-0 bottom-0 w-full sm:w-[450px] bg-secondary border-l border-white/5 p-8 lg:p-16 flex flex-col overflow-y-auto no-scrollbar">
              <header className="flex justify-between items-center mb-16">
                <div className="space-y-1">
                  <span className="text-[8px] uppercase tracking-[0.5em] text-gold font-black opacity-60">System Registry</span>
                  <h4 className="text-2xl font-serif text-white uppercase tracking-widest leading-none">Master Protocol</h4>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-silver hover:text-white transition-all"><XMarkIcon className="w-6 h-6" /></button>
              </header>

              <div className="space-y-12">
                {/* Main Navigation */}
                <section className="space-y-6">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-silver/30 font-black ml-4">Sanctuary Navigation</label>
                  <div className="grid grid-cols-1 gap-3">
                    {navItems.map((nav) => (
                      <Link key={nav.to} to={nav.to} className={`flex items-center gap-6 p-6 rounded-3xl border border-white/5 transition-all group hover:bg-white/5 ${location.pathname === nav.to ? 'bg-gold/10 border-gold/30 text-gold' : 'text-white'}`}>
                        <nav.icon className={`w-6 h-6 ${location.pathname === nav.to ? 'text-gold' : 'text-silver group-hover:text-gold'}`} />
                        <span className="text-xl font-serif uppercase tracking-widest">{nav.label}</span>
                      </Link>
                    ))}
                  </div>
                </section>

                {/* Operations */}
                <section className="space-y-6">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-silver/30 font-black ml-4">Governance & Security</label>
                  <div className="grid grid-cols-1 gap-3">
                    {policyItems.map((nav) => (
                      <Link key={nav.to} to={nav.to} className={`flex items-center gap-6 p-6 rounded-3xl border border-white/5 transition-all group hover:bg-white/5 ${location.pathname === nav.to ? 'bg-emerald/10 border-emerald/30 text-emerald' : 'text-white'}`}>
                        <nav.icon className={`w-6 h-6 ${location.pathname === nav.to ? 'text-emerald' : 'text-silver group-hover:text-emerald'}`} />
                        <span className="text-xl font-serif uppercase tracking-widest">{nav.label}</span>
                      </Link>
                    ))}
                    {isOperator && (
                      <Link to={role === 'admin' ? "/admin" : "/staff"} className="flex items-center gap-6 p-6 rounded-3xl border border-gold/20 bg-gold/5 text-gold hover:bg-gold hover:text-black transition-all group">
                        <ShieldCheckIcon className="w-6 h-6 group-hover:text-black" />
                        <span className="text-xl font-serif uppercase tracking-widest">Operational Terminal</span>
                      </Link>
                    )}
                  </div>
                </section>

                {/* Authentication Account State */}
                <section className="mt-auto pt-12 border-t border-white/5">
                  {user ? (
                    <div className="space-y-6">
                       <div className="flex items-center gap-6 p-6 bg-white/[0.02] border border-white/5 rounded-[32px]">
                          <div className="w-14 h-14 rounded-full border-2 border-gold/30 overflow-hidden shadow-2xl shrink-0"><OptimizedImage src={user.photoURL || ""} alt="U" aspectRatio="h-full" artistic={false} /></div>
                          <div className="overflow-hidden">
                             <p className="text-xs font-black text-white truncate tracking-widest uppercase">{user.email?.split('@')[0]}</p>
                             <Badge color={isOperator ? 'gold' : 'silver'}>{role.replace('_', ' ').toUpperCase()}</Badge>
                          </div>
                       </div>
                       <GoldButton onClick={handleSignOut} className="w-full py-6 text-[10px] flex items-center justify-center gap-4">
                          <ArrowLeftOnRectangleIcon className="w-5 h-5" /> Terminate Secure Session
                       </GoldButton>
                    </div>
                  ) : (
                    <GoldButton onClick={() => { setIsMobileMenuOpen(false); setIsLoginOpen(true); }} className="w-full py-6 text-[10px] flex items-center justify-center gap-4 tracking-[0.2em]">
                       <KeyIcon className="w-5 h-5" /> Authorize Portal Access
                    </GoldButton>
                  )}
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <main className={`flex-1 bg-primary no-scrollbar ${isOperator && !isAdminView ? 'pt-10' : ''}`}>
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-full">
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

const Footer = ({ role }: { role: UserRole }) => {
  return (
    <footer className="bg-secondary border-t border-white/[0.03] pt-20 lg:pt-32 pb-12 lg:pb-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-20 mb-20 lg:mb-24">
          <div className="space-y-8 lg:space-y-10">
            <div className="flex flex-col gap-6">
              <motion.div whileHover={{ scale: 1.05, rotate: 5 }} className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl overflow-hidden border-2 border-gold/30 shadow-2xl shadow-gold/10">
                <OptimizedImage src="/logo.jpg" alt="Logo" aspectRatio="h-full" artistic={false} className="w-full h-full" />
              </motion.div>
              <h2 className="text-3xl lg:text-4xl font-serif font-black tracking-tighter uppercase text-white leading-tight">Brightstar Cave</h2>
            </div>
            <p className="text-secondary text-sm leading-relaxed font-light italic opacity-70 max-w-xs">"Where Stars Align in a Symphony of Metals & Nature."</p>
          </div>

          <div className="hidden sm:block">
            <h5 className="text-gold font-black mb-6 lg:mb-10 text-[10px] uppercase tracking-[0.5em] border-b border-gold/20 pb-4">Navigation</h5>
            <ul className="space-y-4 lg:space-y-5 text-secondary text-sm font-bold uppercase tracking-widest">
              <li><Link to="/about" className="hover:text-gold transition-colors block">Our Heritage</Link></li>
              <li><Link to="/orders" className="hover:text-gold transition-colors block">Curated Menu</Link></li>
              <li><Link to="/service-policy" className="hover:text-gold transition-colors block">Service Charter</Link></li>
              <li><Link to="/data-protection" className="hover:text-gold transition-colors block">Privacy Vault</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-gold font-black mb-6 lg:mb-10 text-[10px] uppercase tracking-[0.5em] border-b border-gold/20 pb-4">Sanctuary Terminal</h5>
            <ul className="space-y-6 lg:space-y-8 text-secondary text-sm font-light">
              <li className="flex gap-4 items-start group">
                <MapPinIcon className="w-5 h-5 text-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="leading-relaxed group-hover:text-white transition-colors">Road 3C Ogunfayo, <br /> Lagos</span>
              </li>
              <li className="flex gap-4 items-start group">
                <PhoneIcon className="w-5 h-5 text-gold shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                <span className="font-mono group-hover:text-white transition-colors">09168858844</span>
              </li>
            </ul>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            <h5 className="text-gold font-black mb-6 lg:mb-10 text-[10px] uppercase tracking-[0.5em] border-b border-gold/20 pb-4">Elite Circle</h5>
            <p className="text-[11px] text-secondary mb-6 lg:mb-8 font-light leading-relaxed opacity-60">Join for exclusive transmissions and menu previews.</p>
            <div className="relative group max-w-md lg:max-w-none">
              <input className="w-full bg-white/[0.02] border border-white/5 rounded-2xl py-4 lg:py-5 px-6 text-sm text-white focus:outline-none focus:border-gold/30 transition-all pr-14 placeholder:text-white/10" placeholder="Email Frequency" type="email" />
              <motion.button whileHover={{ scale: 1.1, x: 5 }} className="absolute right-4 top-3.5 lg:top-4 p-1.5 text-gold hover:text-white transition-colors"><ChevronRightIcon className="w-6 h-6" /></motion.button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.03] pt-12 lg:pt-16 flex flex-col lg:flex-row justify-between items-center gap-8 lg:gap-10">
          <p className="text-[8px] lg:text-[9px] text-secondary uppercase tracking-[0.4em] lg:tracking-[0.5em] font-black opacity-40 text-center lg:text-left">© 2024 Brightstar Cave. Advanced Luxury Systems.</p>
          <div className="flex flex-wrap justify-center gap-8 lg:gap-12 text-[8px] lg:text-[9px] text-secondary uppercase tracking-[0.4em] lg:tracking-[0.5em] font-black">
            <Link to="/service-policy" className="hover:text-gold transition-colors">Service Policy</Link>
            <Link to="/data-protection" className="hover:text-gold transition-colors">Data protection</Link>
            {role === 'admin' ? (
              <Link to="/admin" className="text-gold hover:brightness-125 transition-all">Admin Terminal</Link>
            ) : (role === 'staff' || role === 'staff_bar' || role === 'staff_waiter') ? (
              <Link to="/staff" className="text-emerald hover:brightness-125 transition-all">Staff Terminal</Link>
            ) : null}
          </div>
        </div>
      </div>
    </footer>
  );
};
