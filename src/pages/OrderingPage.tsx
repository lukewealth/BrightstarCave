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
  BanknotesIcon
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
import { MenuItem } from "../data/menu";
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
  const [displayMenu, setDisplayMenu] = useState<MenuItem[]>([]);
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

  // Fetch Dynamic Menu and Staff List
  useEffect(() => {
    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
      setDisplayMenu(items);
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

  // Payment Timer Logic
  useEffect(() => {
    let interval: any;
    if (showCheckout && pendingOrderId && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && pendingOrderId) {
      handleCancelOrder("Payment Window Expired - Order Discarded");
    }
    return () => clearInterval(interval);
  }, [showCheckout, pendingOrderId, timeLeft]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const totalAmount = useMemo(() => cart.reduce((s, i) => s + (i.price * i.quantity), 0), [cart]);

  const handlePrintReceipt = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; width: 70mm; margin: 0 auto; padding: 10px; font-size: 12px; line-height: 1.2; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .logo { font-size: 16px; font-weight: bold; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BRIGHT STAR CAVE</div>
            <div>Luxury Gastronomy</div>
          </div>
          <div class="staff">
            Ref: ${order.id.slice(-8)}<br>
            Date: ${order.formattedDate}<br>
            Time: ${order.formattedTime}<br>
            Table: ${order.table}<br>
            Staff: ${order.staffName || 'Guest Order'}
          </div>
          <div class="items">
            ${order.items.map((i: any) => `
              <div class="item">
                <span>${i.name} x${i.quantity}</span>
                <span>₦${(i.price * i.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>PAID</span>
            <span>₦${order.total.toLocaleString()}</span>
          </div>
          <div class="footer">
            Moniepoint: 5007071458<br>
            * Brightstar Encryption v4.0 *
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleInitiateOrder = async () => {
    if (!tableId) {
      showToast("Please provide Table/Room ID", "error");
      return;
    }

    if (!user && !selectedStaff) {
      showToast("Please select attending staff member", "error");
      return;
    }
    
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
        staffEmail: user ? user.email : selectedStaff.email,
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPendingOrderId(docRef.id);
      setTimeLeft(60);
      setShowCheckout(true);
    } catch (err) {
      showToast("Transmission initiation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingOrderId) return;
    
    setIsSubmitting(true);
    try {
      const orderRef = doc(db, "orders", pendingOrderId);
      await updateDoc(orderRef, {
        status: "paid",
        updatedAt: serverTimestamp(),
        paymentConfirmedAt: serverTimestamp()
      });

      for (const item of cart) {
        const itemRef = doc(db, "inventory", item.id);
        await updateDoc(itemRef, {
          stock: increment(-item.quantity),
          soldCount: increment(item.quantity)
        }).catch(() => {});
      }

      const snap = await getDoc(orderRef);
      handlePrintReceipt({ id: pendingOrderId, ...snap.data() });

      trackPurchase(pendingOrderId, totalAmount, cart);
      
      setCart([]);
      setPendingOrderId(null);
      setShowCheckout(false);
      setIsCartOpen(false);
      showToast("Settlement Audited. Transmission Logged.");
    } catch (err) {
      showToast("Audit confirmation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (reason = "Manual Discard") => {
    if (!pendingOrderId) return;
    try {
      await updateDoc(doc(db, "orders", pendingOrderId), {
        status: "cancelled",
        cancelReason: reason,
        updatedAt: serverTimestamp()
      });
      setPendingOrderId(null);
      setShowCheckout(false);
      showToast(reason, "error");
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (item: MenuItem) => {
    if (item.stock <= 0) {
      showToast(`${item.name} is currently unavailable`, "error");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    if (!isCartOpen && window.innerWidth >= 1024) setIsCartOpen(true);
    showToast(`${item.name} selected`);
  };

  const filteredItems = useMemo(() => {
    return displayMenu.filter(item => {
      const matchesCategory = activeTab === "All" || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [displayMenu, activeTab, searchQuery]);

  return (
    <div className="flex h-full bg-primary text-white overflow-hidden relative font-sans">
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <SectionTitle subtitle="Gastronomy & Leisure" title="Menu Selections" />
          <SilverInput 
            placeholder="Search flavor..." 
            icon={MagnifyingGlassIcon} 
            value={searchQuery}
            onChange={(e: any) => setSearchQuery(e.target.value)}
            className="w-full md:w-80"
          />
        </header>

        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          <TabSystem tabs={categories.map(c => ({ id: c, label: c }))} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <GlassCard key={item.id} className="p-6 h-full flex flex-col justify-between border-white/[0.03] hover:border-gold/20 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <Badge color="silver">{item.category}</Badge>
                  <p className="font-serif text-gold text-lg font-black">₦{item.price.toLocaleString()}</p>
                </div>
                <h4 className="text-xl font-serif text-white leading-tight">{item.name}</h4>
                <div className="flex items-center gap-3">
                   <p className={`text-[10px] font-black uppercase tracking-widest ${item.stock < 10 ? 'text-red-400' : 'text-emerald'}`}>
                     {item.stock > 0 ? `${item.stock} Available` : 'Unavailable'}
                   </p>
                </div>
              </div>
              <GoldButton 
                onClick={() => addToCart(item)} 
                className="mt-8 py-2.5"
                disabled={item.stock <= 0}
              >
                <span className="text-[10px] uppercase font-black tracking-widest">Select Item</span>
              </GoldButton>
            </GlassCard>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {isCartOpen && (
          <motion.aside 
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            className="fixed lg:relative right-0 top-0 bottom-0 w-[450px] border-l border-white/[0.03] bg-black/40 backdrop-blur-3xl p-10 flex flex-col z-[90]"
          >
            <header className="mb-10 flex justify-between items-center border-b border-white/5 pb-6">
              <h3 className="text-sm font-black uppercase tracking-[0.4em] text-white">Transmission Cart</h3>
              <button onClick={() => setIsCartOpen(false)}><XMarkIcon className="w-6 h-6 text-silver" /></button>
            </header>

            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-[9px] text-gold font-mono">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0))} className="text-gold text-xl font-bold">-</button>
                    <Badge color="gold">{item.quantity}</Badge>
                    <button onClick={() => setCart(prev => prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i))} className="text-gold text-xl font-bold">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
              <div className="space-y-4">
                <SilverInput placeholder="Table / Room ID" icon={TableCellsIcon} value={tableId} onChange={(e: any) => setTableId(e.target.value)} />
                
                {!user && (
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase tracking-widest text-silver font-black">Attending Staff Selection</label>
                    <select 
                      onChange={(e) => setSelectedStaff(staffList.find(s => s.id === e.target.value))}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/30"
                    >
                      <option value="">Select Operator</option>
                      {staffList.map(s => <option key={s.id} value={s.id}>{s.email.split('@')[0].toUpperCase()}</option>)}
                    </select>
                  </div>
                )}

                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-widest text-silver">Final Settlement</span>
                  <span className="text-4xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <GoldButton className="w-full py-6" disabled={cart.length === 0 || isSubmitting} onClick={handleInitiateOrder}>
                Establish Audit Connection
              </GoldButton>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <GlassModal isOpen={showCheckout} onClose={() => {}} title="Settlement Synchronization">
        <div className="space-y-8">
          <div className="p-8 bg-gold/5 border border-gold/20 rounded-[32px] text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
              <motion.div className="h-full bg-gold" initial={{ width: "100%" }} animate={{ width: "0%" }} transition={{ duration: 60, ease: "linear" }} />
            </div>
            <div className="flex flex-col items-center gap-4">
              <ClockIcon className="w-12 h-12 text-gold animate-pulse" />
              <div className="space-y-1">
                <p className="text-3xl font-serif text-white font-black">{timeLeft}s</p>
                <p className="text-[9px] uppercase tracking-[0.3em] text-gold font-black">Audit Window Active</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/5 text-left">
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold">Moniepoint Bank</span><span className="text-[9px] text-gold font-black">5007071458</span></div>
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold">Account Name</span><span className="text-[9px] text-white font-black">BRIGHT STAR CAVE</span></div>
              <div className="flex justify-between pt-2 border-t border-white/5"><span className="text-xs text-white uppercase font-black">Audit Value</span><span className="text-lg text-gold font-serif font-black">₦{totalAmount.toLocaleString()}</span></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => handleCancelOrder()} className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 border border-white/10 text-silver hover:bg-red-500/10 hover:text-red-400 transition-all"><NoSymbolIcon className="w-5 h-5 opacity-40" /><span className="text-[10px] font-black uppercase tracking-widest">Discard</span></button>
            <EmeraldButton onClick={handleConfirmPayment} className="py-5" disabled={isSubmitting}><div className="flex items-center gap-3"><BanknotesIcon className="w-5 h-5" /><span className="text-[10px]">Confirm Paid</span></div></EmeraldButton>
          </div>
        </div>
      </GlassModal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default OrderingPage;
