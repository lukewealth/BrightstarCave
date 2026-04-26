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
  XMarkIcon,
  PrinterIcon,
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
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableId, setTableId] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Fetch Dynamic Menu
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "menu"), (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[];
      setMenuItems(items);
    });
    return () => unsub();
  }, []);

  const categories = useMemo(() => ["All", ...Array.from(new Set(menuItems.map(i => i.category)))], [menuItems]);

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

  // Payment Timer Logic (60s Max)
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
            Date: ${order.formattedDate}<br>
            Time: ${order.formattedTime}<br>
            Table: ${order.table}<br>
            Staff: ${order.staffName || 'Guest'}
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
            Thank you for your visit!<br>
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
        isStaffAssisted: role !== 'guest' && role !== null,
        staffId: role !== 'guest' ? user?.uid : null,
        staffName: role !== 'guest' ? (user?.displayName || user?.email?.split('@')[0]) : null,
        staffEmail: role !== 'guest' ? user?.email : (staffEmail || null),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPendingOrderId(docRef.id);
      setTimeLeft(60);
      setShowCheckout(true);
    } catch (err) {
      showToast("Failed to initiate protocol", "error");
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

      // Deplete Inventory
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
      showToast("Transmission Successful. Receipt Generated.");
    } catch (err) {
      showToast("Confirmation failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelOrder = async (reason = "Discarded by User") => {
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

  return (
    <div className="flex h-full bg-primary text-white overflow-hidden relative font-sans">
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <SectionTitle subtitle="Gastronomy & Leisure" title="Menu Selection" />
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
          {menuItems.filter(i => activeTab === "All" || i.category === activeTab).map((item) => (
            <GlassCard key={item.id} className="p-6 h-full flex flex-col justify-between border-white/[0.03] hover:border-gold/20 transition-all">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <Badge color="silver">{item.category}</Badge>
                  <p className="font-serif text-gold text-lg font-black">₦{item.price.toLocaleString()}</p>
                </div>
                <h4 className="text-xl font-serif text-white">{item.name}</h4>
                <p className="text-xs text-silver leading-relaxed opacity-60 line-clamp-2">{item.description}</p>
              </div>
              <GoldButton onClick={() => addToCart(item)} className="mt-8 py-2.5">
                <span className="text-[10px]">Select Resource</span>
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
                  <Badge color="gold">{item.quantity} Units</Badge>
                </div>
              ))}
            </div>

            <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
              <div className="space-y-4">
                <SilverInput placeholder="Table / Room ID" icon={TableCellsIcon} value={tableId} onChange={(e: any) => setTableId(e.target.value)} />
                <div className="flex justify-between items-end">
                  <span className="text-xs uppercase tracking-widest text-silver">Total Settlement</span>
                  <span className="text-4xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <GoldButton className="w-full py-6" disabled={cart.length === 0 || isSubmitting} onClick={handleInitiateOrder}>
                Establish Connection
              </GoldButton>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <GlassModal isOpen={showCheckout} onClose={() => {}} title="Settlement Authorization">
        <div className="space-y-8">
          <div className="p-8 bg-gold/5 border border-gold/20 rounded-[32px] text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/10">
              <motion.div 
                className="h-full bg-gold" 
                initial={{ width: "100%" }} 
                animate={{ width: "0%" }} 
                transition={{ duration: 60, ease: "linear" }} 
              />
            </div>
            <div className="flex flex-col items-center gap-4">
              <ClockIcon className="w-12 h-12 text-gold animate-pulse" />
              <div className="space-y-1">
                <p className="text-3xl font-serif text-white font-black">{timeLeft}s</p>
                <p className="text-[9px] uppercase tracking-[0.3em] text-gold font-black">Payment Synchronization Active</p>
              </div>
            </div>
            
            <div className="space-y-3 pt-4 border-t border-white/5 text-left">
              <div className="flex justify-between">
                <span className="text-[9px] text-silver uppercase font-bold">Moniepoint Bank</span>
                <span className="text-[9px] text-gold font-black">5007071458</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-silver uppercase font-bold">Account Name</span>
                <span className="text-[9px] text-white font-black">BRIGHT STAR CAVE</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/5">
                <span className="text-xs text-white uppercase font-black">Grand Total</span>
                <span className="text-lg text-gold font-serif font-black">₦{totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleCancelOrder()}
              className="flex items-center justify-center gap-3 py-5 rounded-2xl bg-white/5 border border-white/10 text-silver hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <NoSymbolIcon className="w-5 h-5 opacity-40" />
              <span className="text-[10px] font-black uppercase tracking-widest">Discard</span>
            </button>
            <EmeraldButton onClick={handleConfirmPayment} className="py-5" disabled={isSubmitting}>
              <div className="flex items-center gap-3">
                <BanknotesIcon className="w-5 h-5" />
                <span className="text-[10px]">Confirm Paid</span>
              </div>
            </EmeraldButton>
          </div>
          
          <p className="text-[8px] text-center text-silver/40 uppercase tracking-[0.2em]">Transaction records are permanent and audited</p>
        </div>
      </GlassModal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default OrderingPage;
