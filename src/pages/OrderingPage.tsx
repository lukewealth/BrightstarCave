import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBagIcon, 
  ChevronRightIcon, 
  CreditCardIcon, 
  ClockIcon, 
  CheckCircleIcon,
  UserIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  ArrowRightIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";
import { User } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit,
  doc,
  updateDoc,
  increment
} from "firebase/firestore";
import { db, getUserRole, UserRole } from "../lib/firebase";
import { menuItems, MenuItem } from "../data/menu";
import { 
  GlassCard, 
  GoldButton, 
  EmeraldButton, 
  SilverInput, 
  Badge, 
  SectionTitle, 
  GlassModal, 
  TabSystem, 
  Toast 
} from "../components/design-system/Primitive";
import { trackAddToCart, trackPurchase, trackEvent, Events } from "../lib/analytics";

interface CartItem extends MenuItem {
  quantity: number;
}

export const OrderingPage = ({ user }: { user: User | null }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableId, setTableId] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  const categories = useMemo(() => ["All", ...Array.from(new Set(menuItems.map(i => i.category)))], []);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
      
      const q = query(
        collection(db, "orders"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      
      const unsub = onSnapshot(q, (snap) => {
        setActiveOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      
      return () => unsub();
    }
  }, [user]);

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = activeTab === "All" || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeTab, searchQuery]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (!isCartOpen) setIsCartOpen(true);
    showToast(`${item.name} added to selection`);
    trackAddToCart(item);
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const totalAmount = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart]);

  const handleCheckout = async () => {
    if (!tableId) {
      showToast("Please provide Table/Room ID", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderData = {
        table: tableId,
        items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total: totalAmount,
        status: "new",
        userId: user?.uid || "guest",
        userName: user?.displayName || user?.email || "Guest",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        staffAttribution: role !== 'guest' ? user?.email : null,
        staffEmail: staffEmail || null
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);

      for (const item of cart) {
        const itemRef = doc(db, "inventory", item.id);
        await updateDoc(itemRef, {
          stock: increment(-item.quantity),
          soldCount: increment(item.quantity)
        }).catch(() => console.log("Inventory tracking skipped for this item"));
      }

      trackPurchase(docRef.id, totalAmount, cart);
      
      setCart([]);
      setShowCheckout(false);
      setIsCartOpen(false);
      showToast("Order synchronized with terminal");
    } catch (err) {
      showToast("Checkout failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openCheckout = () => {
    setShowCheckout(true);
    trackEvent(Events.BEGIN_CHECKOUT, {
      value: totalAmount,
      currency: 'NGN',
      items: cart.map(i => ({ item_id: i.id, item_name: i.name, quantity: i.quantity }))
    });
  };

  return (
    <div className="flex h-full bg-primary text-white overflow-hidden relative font-sans">
      {/* Main Selection Area */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-12 no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <h3 className="text-gold text-[10px] uppercase tracking-[0.8em] font-black opacity-60">Selection Portal</h3>
            <SectionTitle subtitle="Gastronomy & Leisure" title="The Curated Menu" />
          </div>
          <div className="flex flex-col gap-2 w-full md:w-80 relative group">
            <SilverInput 
              placeholder="Seek flavors..." 
              icon={MagnifyingGlassIcon} 
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            <AnimatePresence>
              {searchQuery.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-secondary/90 backdrop-blur-3xl border border-white/10 rounded-2xl overflow-hidden z-[60] shadow-2xl"
                >
                  {menuItems.filter(item => 
                    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase())
                  ).slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSearchQuery(item.name);
                        setActiveTab("All");
                      }}
                      className="w-full px-6 py-4 text-left hover:bg-white/5 transition-colors flex justify-between items-center group/item"
                    >
                      <div>
                        <p className="text-sm font-bold text-white group-hover/item:text-gold transition-colors">{item.name}</p>
                        <p className="text-[10px] text-silver uppercase tracking-widest">{item.category}</p>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-silver/40 group-hover/item:text-gold transition-all group-hover/item:translate-x-1" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <TabSystem 
            tabs={categories.map(c => ({ id: c, label: c }))} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="group"
              >
                <GlassCard className="p-6 lg:p-8 h-full flex flex-col justify-between border-white/[0.03] hover:border-gold/20 transition-all">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge color="silver">{item.category}</Badge>
                      <p className="font-serif text-gold text-lg font-black">₦{item.price.toLocaleString()}</p>
                    </div>
                    <h4 className="text-xl font-serif text-white group-hover:text-gold transition-colors">{item.name}</h4>
                    <p className="text-xs text-silver leading-relaxed font-light opacity-60 line-clamp-2">{item.description}</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] uppercase tracking-widest text-silver font-bold">Stock: {item.stock}</p>
                    <GoldButton 
                      onClick={() => addToCart(item)}
                      disabled={item.stock <= 0}
                      className="py-2.5 px-5"
                    >
                      <div className="flex items-center gap-2">
                        <span>Add</span>
                        <ChevronRightIcon className="w-3 h-3" />
                      </div>
                    </GoldButton>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Toggle Button (Mobile & Collapsed) */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsCartOpen(!isCartOpen)}
        className={`fixed bottom-8 right-8 z-[100] p-5 rounded-full bg-gold text-black shadow-2xl shadow-gold/40 flex items-center gap-3 transition-transform ${isCartOpen ? 'scale-0' : 'scale-100'}`}
      >
        <ShoppingBagIcon className="w-6 h-6" />
        {cart.length > 0 && (
          <span className="bg-black text-gold text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
            {cart.reduce((a, b) => a + b.quantity, 0)}
          </span>
        )}
      </motion.button>

      {/* Backdrop for Mobile */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Cart Sidebar (Registry) */}
      <AnimatePresence>
        {isCartOpen && (
          <motion.aside 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed lg:relative right-0 top-0 bottom-0 w-full md:w-[450px] lg:w-[450px] border-l border-white/[0.03] bg-black/90 lg:bg-black/40 backdrop-blur-3xl p-8 lg:p-10 flex flex-col z-[90]"
          >
            <div className="flex-1 flex flex-col min-h-0">
              <header className="mb-10 flex justify-between items-center border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <ShoppingBagIcon className="w-6 h-6 text-gold" />
                  <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Registry</h3>
                </div>
                <div className="flex items-center gap-4">
                  <Badge color="gold">{cart.reduce((a, b) => a + b.quantity, 0)} Items</Badge>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-2 hover:bg-white/5 rounded-full text-silver transition-colors"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>
              </header>

              <div className="flex-1 overflow-y-auto space-y-6 no-scrollbar pr-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 py-20">
                    <ShoppingBagIcon className="w-16 h-16 text-silver mb-6" />
                    <p className="text-[10px] uppercase tracking-[0.5em] font-black">Archive Empty</p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.div
                        layout
                        key={item.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 hover:bg-white/[0.05] transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-white group-hover:text-gold transition-colors">{item.name}</p>
                            <p className="text-[9px] text-silver font-mono">₦{item.price.toLocaleString()} ea</p>
                          </div>
                          <p className="text-sm font-serif text-gold font-black">₦{(item.price * item.quantity).toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4 bg-black/40 rounded-xl px-4 py-2 border border-white/5">
                            <button onClick={() => updateQuantity(item.id, -1)} className="text-gold hover:text-white transition-colors text-lg font-black">-</button>
                            <span className="text-xs font-mono w-6 text-center font-bold text-white">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="text-gold hover:text-white transition-colors text-lg font-black">+</button>
                          </div>
                          <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-[9px] uppercase tracking-widest text-red-400/60 hover:text-red-400 font-black transition-colors">Archive</button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] uppercase tracking-widest text-silver">
                    <span>Subtotal Settlement</span>
                    <span>₦{totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs uppercase tracking-[0.4em] font-black text-white">Final Total</span>
                    <span className="text-4xl font-serif text-gold font-black tracking-tighter">
                      ₦{totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>

                <GoldButton 
                  className="w-full py-6 text-[11px]" 
                  disabled={cart.length === 0}
                  onClick={() => setShowCheckout(true)}
                >
                  Establish Transmission
                </GoldButton>
              </div>
            </div>

            {/* Live Order Status */}
            {activeOrders.length > 0 && (
              <div className="mt-10 pt-10 border-t border-white/5">
                <h4 className="text-[10px] uppercase tracking-[0.4em] text-silver mb-6 font-black opacity-60">Active Transmissions</h4>
                <div className="space-y-3">
                  {activeOrders.map(order => (
                    <div key={order.id} className="p-4 bg-emerald/5 border border-emerald/20 rounded-2xl flex justify-between items-center">
                      <div>
                        <p className="text-[9px] font-black text-white uppercase tracking-widest">ID: {order.id.slice(-4).toUpperCase()}</p>
                        <p className="text-[10px] text-emerald font-bold mt-1 uppercase tracking-widest">{order.status}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-emerald animate-pulse" />
                        <span className="text-[9px] font-black text-emerald uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <GlassModal 
        isOpen={showCheckout} 
        onClose={() => setShowCheckout(false)} 
        title="Protocol Settlement"
      >
        <div className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-silver font-black">Terminal Identification</label>
                <SilverInput 
                  placeholder="Table or Room ID (e.g. VIP-04)" 
                  icon={TableCellsIcon}
                  value={tableId}
                  onChange={(e: any) => setTableId(e.target.value)}
                />
              </div>
              {role !== 'guest' && (
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-gold font-black">Staff Attribution</label>
                  <SilverInput 
                    placeholder="Staff Email ID" 
                    icon={UserIcon}
                    value={staffEmail}
                    onChange={(e: any) => setStaffEmail(e.target.value)}
                  />
                </div>
              )}
            </div>
            
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-6">
              <div className="flex items-center gap-4 text-emerald mb-4">
                <CreditCardIcon className="w-6 h-6" />
                <h4 className="text-sm font-black uppercase tracking-widest">Direct Settlement</h4>
              </div>
              <p className="text-[10px] text-silver leading-relaxed font-light">
                Complete settlement to:
                <br /><span className="text-white font-bold tracking-widest">Zenith Bank | 1234567890</span>
                <br />Brightstar Cave Ltd
              </p>
              <div className="pt-6 border-t border-white/5">
                <div className="flex justify-between text-[10px] font-black uppercase text-silver">
                  <span>Grand Total</span>
                  <span className="text-gold">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          <EmeraldButton 
            className="w-full py-6 text-sm" 
            onClick={handleCheckout}
            disabled={isSubmitting || !tableId}
          >
            {isSubmitting ? "Synchronizing..." : "Initialize High-Tier Order"}
          </EmeraldButton>
        </div>
      </GlassModal>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default OrderingPage;
