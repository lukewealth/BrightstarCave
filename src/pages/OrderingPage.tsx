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
  ArrowRightIcon
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

interface CartItem extends MenuItem {
  quantity: number;
}

export const OrderingPage = ({ user }: { user: User | null }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
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
      
      // Listen to active orders for this user or table
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
    showToast(`${item.name} added to selection`);
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

  const handleCheckout = async () => {
    if (!tableId) {
      showToast("Please provide Table/Room ID", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const total = cart.reduce((s, i) => s + (i.price * i.quantity), 0);
      
      const orderData = {
        table: tableId,
        items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total,
        status: "new",
        userId: user?.uid || "guest",
        userName: user?.displayName || user?.email || "Guest",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        staffAttribution: role !== 'guest' ? user?.email : null,
        staffEmail: staffEmail || null
      };

      await addDoc(collection(db, "orders"), orderData);

      // Deduct stock
      for (const item of cart) {
        const itemRef = doc(db, "inventory", item.id);
        await updateDoc(itemRef, {
          stock: increment(-item.quantity),
          soldCount: increment(item.quantity)
        });
      }

      setCart([]);
      setShowCheckout(false);
      showToast("Order synchronized with terminal");
    } catch (err) {
      showToast("Checkout failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full bg-primary text-white overflow-hidden relative font-sans">
      <main className="flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-4">
            <h3 className="text-gold text-[10px] uppercase tracking-[0.8em] font-black opacity-60">Selection Portal</h3>
            <SectionTitle subtitle="Gastronomy & Leisure" title="The Curated Menu" />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <SilverInput 
              placeholder="Seek flavors..." 
              icon={MagnifyingGlassIcon} 
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="w-full md:w-80"
            />
          </div>
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <TabSystem 
            tabs={categories.map(c => ({ id: c, label: c }))} 
            activeTab={activeTab} 
            onChange={setActiveTab} 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
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
                <GlassCard className="p-8 h-full flex flex-col justify-between border-white/[0.03] hover:border-gold/20 transition-all">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <Badge color="silver">{item.category}</Badge>
                      <p className="font-serif text-gold text-lg font-black">₦{item.price.toLocaleString()}</p>
                    </div>
                    <h4 className="text-xl font-serif text-white group-hover:text-gold transition-colors">{item.name}</h4>
                    <p className="text-xs text-silver leading-relaxed font-light opacity-60">{item.description}</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <p className="text-[10px] uppercase tracking-widest text-silver font-bold">Stock: {item.stock}</p>
                    <GoldButton 
                      onClick={() => addToCart(item)}
                      disabled={item.stock <= 0}
                      className="py-3 px-6"
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

      {/* Cart Sidebar */}
      <aside className="w-[450px] border-l border-white/[0.03] bg-black/40 backdrop-blur-3xl p-10 flex flex-col z-40">
        <div className="flex-1 flex flex-col min-h-0">
          <header className="mb-10 flex justify-between items-center border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <ShoppingBagIcon className="w-6 h-6 text-gold" />
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Registry</h3>
            </div>
            <Badge color="gold">{cart.reduce((a, b) => a + b.quantity, 0)} Items</Badge>
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
                    className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-4 hover:bg-white/[0.05] transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-white">{item.name}</p>
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
                      <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-[9px] uppercase tracking-widest text-red-400 hover:text-red-500 font-black transition-colors">Archive</button>
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
                <span>₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs uppercase tracking-[0.4em] font-black text-white">Final Total</span>
                <span className="text-4xl font-serif text-gold font-black tracking-tighter">
                  ₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}
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

        {/* Live Order Status for Guest */}
        {activeOrders.length > 0 && (
          <div className="mt-10 pt-10 border-t border-white/5">
            <h4 className="text-[10px] uppercase tracking-[0.4em] text-silver mb-6 font-black opacity-60">Active Transmissions</h4>
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div key={order.id} className="p-4 bg-emerald/5 border border-emerald/20 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-[9px] font-black text-white uppercase tracking-widest">Order {order.id.slice(-4).toUpperCase()}</p>
                    <p className="text-[10px] text-emerald font-bold mt-1 uppercase tracking-widest">{order.status.replace('-', ' ')}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse" />
                    <span className="text-[10px] font-black text-emerald uppercase tracking-widest">Syncing</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

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
                  <p className="text-[8px] text-silver italic">Leave blank to use your own credentials: {user?.email}</p>
                </div>
              )}
            </div>
            
            <div className="p-8 bg-white/[0.02] border border-white/5 rounded-[32px] space-y-6">
              <div className="flex items-center gap-4 text-emerald mb-4">
                <CreditCardIcon className="w-6 h-6" />
                <h4 className="text-sm font-black uppercase tracking-widest">Direct Settlement</h4>
              </div>
              <p className="text-[10px] text-silver leading-relaxed font-light">
                Please complete transfer to:
                <br /><span className="text-white font-bold tracking-widest">Zenith Bank | 1234567890</span>
                <br />Brightstar Cave Ltd
              </p>
              <div className="pt-6 border-t border-white/5 space-y-3">
                <div className="flex justify-between text-[10px] font-black uppercase text-silver">
                  <span>Grand Total</span>
                  <span className="text-gold">₦{cart.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString()}</span>
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
