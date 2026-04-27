import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShoppingBagIcon, 
  ChevronRightIcon, 
  CreditCardIcon, 
  ClockIcon, 
  UserIcon,
  TableCellsIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  NoSymbolIcon,
  BanknotesIcon,
  BoltIcon,
  InformationCircleIcon
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
  increment,
  getDoc
} from "firebase/firestore";
import { db, getUserRole, UserRole, getStaffList } from "../lib/firebase";
import { MenuItem, menuItems } from "../data/menu";
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
  const [displayMenu, setDisplayMenu] = useState<MenuItem[]>(menuItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableId, setTableId] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Fetch Dynamic Menu (Live Readiness with Descriptions)
  useEffect(() => {
    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      if (!snap.empty) {
        const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
        setDisplayMenu(items);
      } else {
        setDisplayMenu(menuItems);
      }
    });

    getStaffList().then(setStaffList);

    return () => unsubMenu();
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(displayMenu.map(i => i.category)))], [displayMenu]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  // Audit Timer Logic
  useEffect(() => {
    let interval: any;
    if (showCheckout && pendingOrderId && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && pendingOrderId) {
      handleCancelOrder("Payment Window Expired - System Purged");
    }
    return () => clearInterval(interval);
  }, [showCheckout, pendingOrderId, timeLeft]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const totalAmount = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const handlePrintReceipt = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;
    const receiptHtml = `
      <html>
        <head><style>body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; } .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; } .total { border-top: 1px solid #000; margin-top: 10px; font-weight: bold; }</style></head>
        <body>
          <div class="header"><h3>BRIGHT STAR CAVE</h3><p>Verified Settlement</p></div>
          <p>Ref: ${order.id.slice(-8)}<br>Staff: ${order.staffName}<br>Date: ${order.formattedDate}</p>
          <div class="items">${order.items.map((i: any) => `<div>${i.name} x${i.quantity} - ₦${(i.price * i.quantity).toLocaleString()}</div>`).join('')}</div>
          <div class="total"><p>TOTAL: ₦${order.total.toLocaleString()}</p></div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>`;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleInitiateOrder = async () => {
    if (!tableId) return showToast("Room/Table Identification required", "error");
    if (!user && !selectedStaff) return showToast("Operator verification required", "error");
    
    setIsSubmitting(true);
    const now = new Date();
    try {
      const orderData = {
        table: tableId,
        items: cart.map(i => ({ id: i.id, name: i.name, quantity: i.quantity, price: i.price })),
        total: totalAmount,
        status: "pending-payment",
        userId: user?.uid || "guest",
        userName: user?.displayName || user?.email || "Guest",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        formattedDate: now.toLocaleDateString(),
        formattedTime: now.toLocaleTimeString(),
        isStaffAssisted: true,
        staffId: user ? user.uid : selectedStaff.id,
        staffName: user ? (user.displayName || user.email?.split('@')[0]) : selectedStaff.email.split('@')[0],
      };
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPendingOrderId(docRef.id);
      setTimeLeft(60);
      setShowCheckout(true);
    } catch (err) { showToast("Transmission failure", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmPayment = async () => {
    if (!pendingOrderId) return;
    setIsSubmitting(true);
    try {
      const orderRef = doc(db, "orders", pendingOrderId);
      await updateDoc(orderRef, { status: "paid", paymentConfirmedAt: serverTimestamp() });
      for (const item of cart) {
        const menuRef = doc(db, "menu", item.id);
        const invRef = doc(db, "inventory", item.id);
        await updateDoc(menuRef, { stock: increment(-item.quantity) }).catch(() => {});
        await updateDoc(invRef, { stock: increment(-item.quantity), soldCount: increment(item.quantity) }).catch(() => {});
      }
      const snap = await getDoc(orderRef);
      handlePrintReceipt({ id: pendingOrderId, ...snap.data() });
      setCart([]); setPendingOrderId(null); setShowCheckout(false); setIsCartOpen(false);
      showToast("Settlement Audited. Dispatch Authorized.");
    } catch (err) { showToast("Audit failure", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleCancelOrder = async (reason = "Manual Purge") => {
    if (!pendingOrderId) return;
    try {
      await updateDoc(doc(db, "orders", pendingOrderId), { status: "cancelled", cancelReason: reason });
      setPendingOrderId(null); setShowCheckout(false);
      showToast(reason, "error");
    } catch (err) { console.error(err); }
  };

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) return showToast("Resource Depleted", "error");
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...item, quantity: 1 }];
    });
    if (!isCartOpen && window.innerWidth >= 1024) setIsCartOpen(true);
    showToast(`${item.name} staged`);
  };

  const filteredItems = useMemo(() => {
    return displayMenu.filter(item => {
      const matchesCategory = activeTab === "All" || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [displayMenu, activeTab, searchQuery]);

  return (
    <div className="flex h-full bg-primary text-white overflow-hidden relative font-sans">
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-3">
             <h3 className="text-gold text-[10px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-2">
               <BoltIcon className="w-3 h-3" /> Operational Gastronomy Live
             </h3>
             <SectionTitle subtitle="Curated Luxury Resources" title="Master Registry" />
          </div>
          <SilverInput placeholder="Seek flavor or designation..." icon={MagnifyingGlassIcon} value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full md:w-96 shadow-2xl" />
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar border-b border-white/5">
          <TabSystem tabs={categories.map(c => ({ id: c, label: c }))} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredItems.map((item) => (
            <GlassCard key={item.id} className="p-8 h-full flex flex-col justify-between border-white/5 hover:border-gold/30 transition-all group">
              <div className="space-y-5">
                <div className="flex justify-between items-start">
                  <Badge color={item.stock > 0 ? "gold" : "red"}>{item.stock > 0 ? "AVAILABLE" : "DEPLETED"}</Badge>
                  <p className="font-serif text-gold text-xl font-black">₦{item.price.toLocaleString()}</p>
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-serif text-white group-hover:text-gold transition-colors leading-tight uppercase tracking-wide">{item.name}</h4>
                  <p className="text-[10px] text-silver/40 uppercase tracking-widest font-black">{item.category}</p>
                </div>
                <p className="text-[11px] text-silver/60 leading-relaxed font-light italic border-l border-gold/20 pl-4">{item.description}</p>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <p className={`text-[10px] font-black uppercase ${item.stock < 10 ? 'text-red-400' : 'text-gold/40'}`}>{item.stock} in stock</p>
                <GoldButton onClick={() => addToCart(item)} disabled={item.stock <= 0} className="py-2.5 px-6">
                   <span className="text-[9px] uppercase font-black tracking-widest">Select</span>
                </GoldButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </main>

      {/* Floating Shopping Bag Trigger */}
      <AnimatePresence>
        {!isCartOpen && cartCount > 0 && (
          <motion.button
            initial={{ scale: 0, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 20 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsCartOpen(true)}
            className="fixed bottom-10 right-10 z-[100] p-6 bg-gold text-black rounded-full shadow-[0_20px_50px_rgba(212,175,55,0.3)] group"
          >
            <div className="relative">
              <ShoppingBagIcon className="w-8 h-8" />
              <div className="absolute -top-3 -right-3 bg-white text-black text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-gold shadow-lg group-hover:bg-primary group-hover:text-gold transition-colors">
                {cartCount}
              </div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCartOpen && (
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed lg:relative right-0 top-0 bottom-0 w-[450px] border-l border-white/5 bg-black/40 backdrop-blur-3xl p-10 flex flex-col z-[90]">
            <header className="mb-10 flex justify-between items-center border-b border-white/5 pb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-white flex items-center gap-4"><ShoppingBagIcon className="w-5 h-5 text-gold" /> Dispatch Queue</h3>
              <button onClick={() => setIsCartOpen(false)}><XMarkIcon className="w-6 h-6 text-silver hover:text-white transition-colors" /></button>
            </header>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-white uppercase">{item.name}</p>
                    <p className="text-[9px] text-gold font-mono tracking-widest">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 rounded-xl px-3 py-1.5 border border-white/5">
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0))} className="text-gold hover:text-white transition-colors">-</button>
                    <span className="text-[10px] font-black text-white w-4 text-center">{item.quantity}</span>
                    <button onClick={() => { if(item.quantity < (displayMenu.find(m => m.id === item.id)?.stock || 0)) setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)); else showToast("Audit limit reached", "error"); }} className="text-gold hover:text-white transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
              <div className="space-y-5">
                <SilverInput placeholder="Specify Room / Table Identification" icon={TableCellsIcon} value={tableId} onChange={(e: any) => setTableId(e.target.value)} />
                {!user && (
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-[0.4em] text-silver/40 font-black">Attending Personnel Verification</label>
                    <select onChange={(e) => setSelectedStaff(staffList.find(s => s.id === e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-white focus:border-gold/40 uppercase tracking-widest">
                      <option value="">Select Operator</option>
                      {staffList.map(s => <option key={s.id} value={s.id} className="bg-primary text-white">{s.email.split('@')[0].toUpperCase()}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex justify-between items-end"><span className="text-[10px] uppercase tracking-widest text-silver/40">Audit Value</span><span className="text-4xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span></div>
              </div>
              <GoldButton className="w-full py-6 text-[10px] uppercase font-black tracking-widest" disabled={cart.length === 0 || isSubmitting} onClick={handleInitiateOrder}>Authorize Dispatch Transmission</GoldButton>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <GlassModal isOpen={showCheckout} onClose={() => {}} title="Audit Synchronization Active">
        <div className="space-y-8 p-4">
          <div className="p-8 bg-gold/5 border border-gold/20 rounded-[32px] text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5"><motion.div className="h-full bg-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 60, ease: "linear" }} /></div>
            <ClockIcon className="w-14 h-14 text-gold animate-pulse mx-auto opacity-60" />
            <div className="space-y-2"><p className="text-4xl font-serif text-white font-black">{timeLeft}s</p><p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black">Audit Window Active</p></div>
            <div className="space-y-4 pt-6 border-t border-white/5 text-left">
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Bank Identifier</span><span className="text-[10px] text-gold font-black tracking-widest">MONIEPOINT 5007071458</span></div>
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Verified Value</span><span className="text-xl text-white font-serif font-black">₦{totalAmount.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleCancelOrder()} className="py-5 rounded-2xl bg-white/5 border border-white/10 text-silver hover:text-red-400 transition-all uppercase text-[9px] font-black tracking-widest">Discard Record</button>
            <EmeraldButton onClick={handleConfirmPayment} className="py-5" disabled={isSubmitting}><span className="text-[9px] uppercase font-black tracking-widest">Authorize Paid</span></EmeraldButton>
          </div>
          <p className="text-[8px] text-center text-silver/20 uppercase tracking-[0.3em] font-black">All transmissions are permanent and audited by the master protocol</p>
        </div>
      </GlassModal>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default OrderingPage;
