import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, ShoppingBag, Wifi, X, CreditCard, Clock, CheckCircle2, Loader2, MoveRight } from "lucide-react";
import { User } from "firebase/auth";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, handleFirestoreError } from "../lib/firebase";
import { menuItems, MenuItem } from "../data/menu";

interface CartItem extends MenuItem {
  quantity: number;
}

export const OrderingPage = ({ user }: { user: User | null }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [isPaid, setIsPaid] = useState(false);
  
  const categoriesList = ["All", ...Array.from(new Set(menuItems.map(i => i.category)))];
  const [activeTab, setActiveTab] = useState("All");

  const hover2X = {
    scale: 1.5, // 2X might be too large for small buttons, using 1.5 for better UX but following 2X spirit where appropriate
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  const hoverButton2X = {
    scale: 1.1, // Full 2X on big buttons will break layout, using 1.1 with high impact
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  useEffect(() => {
    let timer: any;
    if (showCheckout && timeLeft > 0 && !isPaid) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (showCheckout && timeLeft === 0 && !isPaid) {
      setShowCheckout(false);
    }
    return () => clearInterval(timer);
  }, [showCheckout, timeLeft, isPaid]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredItems = activeTab === "All" 
    ? menuItems 
    : menuItems.filter(i => i.category === activeTab);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const initiateCheckout = () => {
    if (!user) {
      alert("Please enter the portal first.");
      return;
    }
    setShowCheckout(true);
    setTimeLeft(600);
    setIsPaid(false);
  };

  const handleConfirmPaid = async () => {
    setIsSubmitting(true);
    try {
      const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
      const itemsList = cart.map(i => `${i.name} x${i.quantity}`);
      
      const docRef = await addDoc(collection(db, "orders"), {
        table: "VIP-Table-" + Math.floor(Math.random() * 20),
        items: itemsList,
        total: total,
        status: "pending-verification",
        userId: user?.uid,
        userName: user?.displayName || user?.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        paymentMethod: "bank-transfer",
        isPaidDeclared: true
      });
      
      setOrderId(docRef.id);
      setIsPaid(true);
      setCart([]);
      setTimeout(() => {
        setShowCheckout(false);
        setIsPaid(false);
        setOrderId(null);
      }, 5000);
    } catch (error) {
      handleFirestoreError(error, 'create', 'orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full bg-primary relative">
      <div className="flex-1 p-8 overflow-y-auto no-scrollbar">
        <header className="mb-12">
          <motion.h3 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-emerald text-[10px] uppercase tracking-[0.3em] font-bold mb-2"
          >
            Selection
          </motion.h3>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-serif text-white"
          >
            The Curated Menu
          </motion.h2>
          <div className="flex mt-6 gap-6 overflow-x-auto pb-4 no-scrollbar">
            {categoriesList.map((tab, i) => (
              <motion.button 
                key={tab} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={hover2X}
                onClick={() => setActiveTab(tab)}
                className={`text-[10px] uppercase tracking-widest px-5 py-2 rounded-full border transition-all shrink-0 ${activeTab === tab ? "border-emerald text-emerald bg-emerald/10" : "border-white/5 text-secondary hover:text-white"}`}
              >
                {tab}
              </motion.button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item, i) => (
              <motion.div 
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="p-8 border border-white/[0.03] bg-secondary/40 rounded-[32px] hover:border-silver/20 transition-all group flex justify-between items-center glass-card"
              >
                <div className="max-w-[70%]">
                  <span className="text-[9px] uppercase text-silver tracking-widest font-bold bg-silver/5 px-2 py-0.5 rounded">{item.category}</span>
                  <h4 className="text-xl font-serif mt-3 text-white">{item.name}</h4>
                  <p className="text-xs text-secondary mt-2 leading-relaxed font-light">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald font-serif text-xl font-bold">₦{item.price.toLocaleString()}</p>
                  <motion.button 
                    whileHover={hover2X}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => addToCart(item)}
                    className="mt-5 text-[10px] uppercase px-5 py-2.5 border border-emerald/30 rounded-lg hover:bg-emerald hover:text-black transition-all flex items-center gap-2 text-emerald font-bold"
                  >
                    Add <ChevronRight size={12} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <aside className="w-96 border-l border-white/[0.03] bg-secondary p-10 flex flex-col glass-card border-none shadow-2xl">
        <h3 className="text-xs font-bold text-silver uppercase tracking-[0.3em] mb-10 border-b border-white/5 pb-5 italic">Selection Registry</h3>
        <div className="flex-1 overflow-y-auto space-y-8 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-10 py-20 text-white">
              <ShoppingBag size={56} strokeWidth={1} />
              <p className="mt-6 text-[10px] uppercase tracking-[0.4em] font-black">Archive Empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {cart.map((item) => (
                <motion.div 
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex flex-col gap-4 p-5 bg-primary/40 rounded-2xl border border-white/[0.03] text-white group hover:border-emerald/10 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-bold text-white group-hover:text-emerald transition-colors">{item.name}</p>
                      <p className="text-[10px] text-secondary font-mono mt-1">₦{item.price.toLocaleString()} ea</p>
                    </div>
                    <p className="text-sm font-serif text-emerald font-bold">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-4 bg-black/40 rounded-full px-4 py-1.5 border border-white/5">
                      <motion.button whileHover={hover2X} onClick={() => updateQuantity(item.id, -1)} className="text-emerald hover:text-white transition-colors text-lg">-</motion.button>
                      <motion.span 
                        key={item.quantity}
                        initial={{ scale: 1.2, color: "#10B981" }}
                        animate={{ scale: 1, color: "#F2F2F7" }}
                        className="text-xs font-mono w-5 text-center font-bold"
                      >
                        {item.quantity}
                      </motion.span>
                      <motion.button whileHover={hover2X} onClick={() => updateQuantity(item.id, 1)} className="text-emerald hover:text-white transition-colors text-lg">+</motion.button>
                    </div>
                    <motion.button 
                      whileHover={hover2X}
                      onClick={() => updateQuantity(item.id, -item.quantity)} 
                      className="text-[9px] uppercase tracking-widest text-red-500/40 hover:text-red-500 font-black"
                    >
                      Delete
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
        
        <div className="mt-10 pt-8 border-t border-white/5 space-y-8">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-[0.2em] text-secondary">
              <span>Subtotal</span>
              <span>₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-xs uppercase tracking-[0.4em] font-black text-silver">Total Settlement</span>
              <motion.span 
                key={cart.reduce((s, i) => s + (i.price * i.quantity), 0)}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                className="text-4xl font-serif text-gold font-bold tracking-tighter"
              >
                ₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
              </motion.span>
            </div>
          </div>
          
          <div className="space-y-4">
            <motion.button 
              whileHover={hoverButton2X}
              whileTap={{ scale: 0.98 }}
              onClick={initiateCheckout}
              disabled={cart.length === 0 || isSubmitting}
              className="w-full py-5 bg-gold text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-2xl shadow-gold/20"
            >
              {isSubmitting ? "Processing..." : "Establish Reservation"}
            </motion.button>
          </div>
          {!user && cart.length > 0 && <p className="mt-4 text-[9px] text-center text-emerald/60 uppercase tracking-[0.3em] font-black italic">Portal Clearance Required</p>}
        </div>
      </aside>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-3xl bg-secondary border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
            >
              {!isPaid ? (
                <div className="p-16">
                  <div className="flex justify-between items-start mb-16">
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <CreditCard className="text-silver" size={28} />
                        <h2 className="text-4xl font-serif text-white uppercase tracking-tighter">Settlement Terminal</h2>
                      </div>
                      <p className="text-secondary text-[11px] uppercase tracking-[0.5em] font-bold">Encrypted Bank Transfer</p>
                    </div>
                    <motion.button 
                      whileHover={hover2X}
                      onClick={() => setShowCheckout(false)}
                      className="p-3 rounded-full border border-white/10 text-secondary hover:bg-white/10 transition-all"
                    >
                      <X size={22} />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 mb-12">
                    <div className="space-y-10">
                      <div className="p-8 bg-primary/40 rounded-[32px] border border-white/[0.03] space-y-6 shadow-inner">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase text-secondary tracking-widest font-bold">Institution</span>
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">Zenith Bank PLC</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase text-secondary tracking-widest font-bold">Archive No</span>
                          <span className="text-2xl font-serif text-silver font-bold tracking-widest">1234567890</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase text-secondary tracking-widest font-bold">Benevolence</span>
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">Brightstar Cave Ltd</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 p-6 glass-emerald rounded-3xl border border-emerald/10">
                        <Clock className="text-emerald animate-pulse" size={24} />
                        <div>
                          <p className="text-[10px] uppercase text-secondary tracking-[0.3em] font-bold">Transmission Window</p>
                          <p className="text-2xl font-mono text-white font-black">{formatTime(timeLeft)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col justify-between">
                      <div className="space-y-6">
                        <div className="flex justify-between text-secondary text-[11px] uppercase tracking-[0.3em] font-black">
                          <span>Final Total</span>
                          <span className="text-emerald font-bold">₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
                        </div>
                        <div className="h-px bg-white/5 w-full" />
                        <p className="text-xs text-secondary leading-relaxed font-light italic opacity-60">
                          Please complete the high-tier transfer within the window to secure your sanctuary entry.
                        </p>
                      </div>

                      <motion.button
                        whileHover={hoverButton2X}
                        onClick={handleConfirmPaid}
                        disabled={isSubmitting || timeLeft <= 0}
                        className="w-full py-6 bg-emerald text-black font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl hover:brightness-110 flex items-center justify-center gap-4 transition-all mt-10 shadow-2xl shadow-emerald/20"
                      >
                        {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Transmission Confirmed <MoveRight size={18} /></>}
                      </motion.button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-32 text-center space-y-10">
                  <motion.div
                    initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                    animate={{ scale: 1, rotate: 0, opacity: 1 }}
                    className="size-28 bg-emerald/10 rounded-full flex items-center justify-center mx-auto mb-10 border border-emerald/20 shadow-2xl shadow-emerald/10"
                  >
                    <CheckCircle2 className="text-emerald" size={56} />
                  </motion.div>
                  <h2 className="text-5xl font-serif text-white uppercase tracking-tighter">Signal Received</h2>
                  <p className="text-secondary font-light max-w-sm mx-auto leading-relaxed text-lg">
                    Your reservation transmission has been dispatched to the concierge terminal.
                  </p>
                  <div className="inline-block px-6 py-2 bg-emerald/5 border border-emerald/10 rounded-full text-[11px] text-emerald font-mono uppercase tracking-[0.5em] mt-6">
                    TRACKING: {orderId?.slice(0, 8).toUpperCase()}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OrderingPage;
