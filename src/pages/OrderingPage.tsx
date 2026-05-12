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
  Square2StackIcon,
  IdentificationIcon
} from "@heroicons/react/24/outline";
import { User } from "firebase/auth";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  doc,
  updateDoc,
  increment,
  getDoc,
  query,
  where
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
  Toast,
  LionLoader,
  ConfirmModal
} from "../components/design-system/Primitive";
import { trackPurchase, trackEvent, Events } from "../lib/analytics";
import { useCart } from "../lib/cart-context";

export const OrderingPage = ({ user }: { user: User | null }) => {
  const { cart, addToCart, updateQuantity, clearCart, totalAmount } = useCart();
  const [role, setRole] = useState<UserRole | null>(null);
  const [displayMenu, setDisplayMenu] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableId, setTableId] = useState("");
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(120);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Confirmation States
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type: 'default' | 'danger';
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    type: 'default'
  });

  // Fetch Dynamic Menu and Staff List
  useEffect(() => {
    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      if (!snap.empty) {
        setDisplayMenu(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
      } else {
        setDisplayMenu(menuItems);
      }
      setLoading(false);
    }, (error) => {
      console.error("Menu fetch error:", error);
      setDisplayMenu(menuItems);
      setLoading(false);
    });

    const unsubStaff = onSnapshot(query(collection(db, "admins"), where("role", "in", ["staff_bar", "staff_waiter", "staff", "admin"])), (snap) => {
      setStaffList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubMenu(); unsubStaff(); };
  }, []);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    } else {
      setRole('guest');
    }
  }, [user]);

  // Comprehensive Department Categorization Logic
  const deptCategories = useMemo(() => {
    if (role === 'staff_bar') {
      return ["Mocktails", "Cocktails", "Brandy & Cognac", "Whiskey", "Tequila", "Wine", "Beer", "Soft Drinks"];
    }
    if (role === 'staff_waiter') {
      return ["Kitchen Menu", "Exotic Kitchen"];
    }
    return null; // Guest or Admin see all
  }, [role]);

  const filteredItems = useMemo(() => {
    return displayMenu.filter(item => {
      const isInDepartment = !deptCategories || deptCategories.includes(item.category);
      const matchesCategory = activeTab === "All" || item.category === activeTab;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return isInDepartment && matchesCategory && matchesSearch;
    });
  }, [displayMenu, activeTab, searchQuery, deptCategories]);

  const categories = useMemo(() => {
    const allCats = Array.from(new Set(displayMenu.map(i => i.category)));
    const filteredCats = deptCategories ? allCats.filter(c => deptCategories.includes(c)) : allCats;
    return ["All", ...filteredCats];
  }, [displayMenu, deptCategories]);

  const departmentName = useMemo(() => {
    if (role === 'staff_bar') return "Bar Only";
    if (role === 'staff_waiter') return "Kitchen Only";
    return "Global Catalog";
  }, [role]);

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LionLoader />
    </div>
  );

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const handlePrintReceipt = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;
    const receiptHtml = `<html><head><style>body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; } .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; } .total { border-top: 1px solid #000; margin-top: 10px; font-weight: bold; }</style></head><body><div class="header"><h3>BRIGHT STAR CAVE</h3><p>Verified Settlement</p></div><p>Ref: ${order.id.slice(-8)}<br>Staff: ${order.staffName}<br>Date: ${order.formattedDate}</p><div class="items">${order.items.map((i: any) => `<div>${i.name} x${i.quantity} - ₦${(i.price * i.quantity).toLocaleString()}</div>`).join('')}</div><div class="total"><p>TOTAL: ₦${order.total.toLocaleString()}</p></div><div style="text-align:center; margin-top:20px; font-size:10px;">Payment: Moniepoint 5007071458<br>* BRIGHTSTAR SECURITY ENCRYPTED *</div><script>window.print(); setTimeout(() => window.close(), 500);</script></body></html>`;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleInitiateOrder = async () => {
    if (!tableId) return showToast("Room/Table Identification required", "error");
    if (role === 'guest' && !selectedStaff) return showToast("Operator verification required", "error");
    
    setIsSubmitting(true);
    const now = new Date();
    try {
      // Group items by department for better tracking
      const departmentalItems = cart.map(i => {
        const menuItem = displayMenu.find(m => m.id === i.id);
        return {
          id: i.id,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          type: menuItem?.type || 'bar',
          category: menuItem?.category || 'Bar'
        };
      });

      const orderData = {
        table: tableId,
        items: departmentalItems,
        total: totalAmount,
        status: "pending-payment",
        userId: user?.uid || "guest",
        userName: user?.displayName || user?.email || "Guest",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        formattedDate: now.toLocaleDateString(),
        formattedTime: now.toLocaleTimeString(),
        isStaffAssisted: true,
        staffId: role !== 'guest' ? user?.uid : selectedStaff.id,
        staffName: role !== 'guest' ? (user?.displayName || user?.email?.split('@')[0]) : selectedStaff.email.split('@')[0],
        departmentScopes: Array.from(new Set(departmentalItems.map(i => i.type)))
      };
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPendingOrderId(docRef.id);
      setTimeLeft(120);
      setShowCheckout(true);
    } catch (err) { showToast("Transmission failure", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleConfirmPayment = async () => {
    if (!pendingOrderId) return;
    setIsSubmitting(true);
    try {
      const orderRef = doc(db, "orders", pendingOrderId);
      await updateDoc(orderRef, { 
        status: "paid", 
        paymentConfirmedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Synchronize Stock Audit
      for (const item of cart) {
        const menuRef = doc(db, "menu", item.id);
        const invRef = doc(db, "inventory", item.id);
        await updateDoc(menuRef, { stock: increment(-item.quantity) }).catch(() => {});
        await updateDoc(invRef, { stock: increment(-item.quantity), soldCount: increment(item.quantity) }).catch(() => {});
      }

      const snap = await getDoc(orderRef);
      handlePrintReceipt({ id: pendingOrderId, ...snap.data() });
      
      clearCart(); 
      setPendingOrderId(null); 
      setShowCheckout(false); 
      setIsCartOpen(false);
      showToast("Settlement Audited. Dispatch Authorized.");
    } catch (err) { showToast("Audit failure", "error"); }
    finally { setIsSubmitting(false); }
  };

  const handleCancelOrder = async (reason = "Manual Purge") => {
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
    } catch (err) { console.error(err); }
  };

  return (
    <div className="flex h-full bg-primary text-primary overflow-hidden relative font-sans">
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 space-y-8 no-scrollbar">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div className="space-y-3">
             <h3 className="text-gold text-[10px] font-black uppercase tracking-[0.5em] opacity-40 flex items-center gap-2">
               <BoltIcon className="w-3 h-3" /> Operational Gastronomy Live
             </h3>
             <SectionTitle subtitle="Browse & Dispatch Resources" title="Sanctuary Menu" />
             <div className="flex gap-3 items-center">
                <Badge color={role === 'guest' ? 'silver' : 'gold'}>{departmentName}</Badge>
                {role === 'guest' && <Badge color="emerald">Browse Active</Badge>}
             </div>
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
                  <h4 className="text-xl font-serif text-primary group-hover:text-gold transition-colors leading-tight uppercase tracking-wide">{item.name}</h4>
                  <p className="text-[10px] text-silver/40 uppercase tracking-widest font-black">{item.category}</p>
                </div>
                <p className="text-[11px] text-silver/60 leading-relaxed font-light italic border-l border-gold/20 pl-4">{item.description}</p>
              </div>
              <div className="mt-10 flex items-center justify-between">
                <p className={`text-[10px] font-black uppercase ${item.stock < 10 ? 'text-red-400' : 'text-gold/40'}`}>{item.stock} in stock</p>
                <GoldButton onClick={() => { addToCart(item); setIsCartOpen(true); showToast(`${item.name} staged`); }} disabled={item.stock <= 0} className="py-2.5 px-6">
                   <span className="text-[9px] uppercase font-black tracking-widest">Select</span>
                </GoldButton>
              </div>
            </GlassCard>
          ))}
        </div>
      </main>

      <AnimatePresence>
        {isCartOpen && (
          <motion.aside initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} className="fixed lg:relative right-0 top-0 bottom-0 w-full sm:w-[450px] border-l border-white/5 bg-black/40 backdrop-blur-3xl p-8 lg:p-10 flex flex-col z-[100]">
            <header className="mb-10 flex justify-between items-center border-b border-white/5 pb-8">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-primary flex items-center gap-4"><ShoppingBagIcon className="w-5 h-5 text-gold" /> Dispatch Queue</h3>
              <button onClick={() => setIsCartOpen(false)}><XMarkIcon className="w-6 h-6 text-silver hover:text-primary transition-colors" /></button>
            </header>
            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar">
              {cart.map((item) => (
                <div key={item.id} className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl flex justify-between items-center group hover:bg-white/[0.05] transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-primary uppercase">{item.name}</p>
                    <p className="text-[9px] text-gold font-mono tracking-widest">₦{(item.price * item.quantity).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-4 bg-black/40 rounded-xl px-3 py-1.5 border border-white/5">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-gold hover:text-primary transition-colors">-</button>
                    <span className="text-[10px] font-black text-primary w-4 text-center">{item.quantity}</span>
                    <button onClick={() => { if(item.quantity < (displayMenu.find(m => m.id === item.id)?.stock || 0)) updateQuantity(item.id, item.quantity + 1); else showToast("Audit limit reached", "error"); }} className="text-gold hover:text-primary transition-colors">+</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 pt-10 border-t border-white/5 space-y-8">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.4em] text-silver/40 font-black ml-4">Terminal Identifier</label>
                  <SilverInput placeholder="Specify Room / Table ID" icon={TableCellsIcon} value={tableId} onChange={(e: any) => setTableId(e.target.value)} />
                </div>
                {role === 'guest' && (
                  <div className="space-y-3">
                    <label className="text-[9px] uppercase tracking-[0.4em] text-silver/40 font-black ml-4 flex items-center gap-2">
                      <IdentificationIcon className="w-3 h-3 text-gold" /> Attending Operator
                    </label>
                    <select 
                      value={selectedStaff?.id || ""}
                      onChange={(e) => setSelectedStaff(staffList.find(s => s.id === e.target.value))} 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-[10px] text-primary focus:border-gold/40 uppercase tracking-widest outline-none appearance-none"
                    >
                      <option value="" className="bg-primary">Select Authorized Staff</option>
                      {staffList.map(s => <option key={s.id} value={s.id} className="bg-primary text-primary">{s.email.split('@')[0].toUpperCase()} - {s.role.split('_')[1]?.toUpperCase() || 'GENERAL'}</option>)}
                    </select>
                  </div>
                )}
                <div className="flex justify-between items-end px-4"><span className="text-[10px] uppercase tracking-widest text-silver/40">Audit Value</span><span className="text-4xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span></div>
              </div>
              <GoldButton className="w-full py-6 text-[10px] uppercase font-black tracking-widest" disabled={cart.length === 0 || isSubmitting} onClick={handleInitiateOrder}>Authorize Dispatch Transmission</GoldButton>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      <GlassModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="Audit Synchronization Active">
        <div className="space-y-8 p-4">
          <div className="p-8 bg-gold/5 border border-gold/20 rounded-[32px] text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
              <motion.div 
                className="h-full bg-gold shadow-[0_0_15px_rgba(212,175,55,0.5)]" 
                initial={{ width: "100%" }} 
                animate={{ width: "0%" }} 
                transition={{ duration: 120, ease: "linear" }} 
              />
            </div>
            <ClockIcon className="w-14 h-14 text-gold animate-pulse mx-auto opacity-60" />
            <div className="space-y-2"><p className="text-4xl font-serif text-primary font-black">Audit Active</p><p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black">Waiting for Settlement Proof</p></div>
            <div className="space-y-4 pt-6 border-t border-white/5 text-left">
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Bank Identifier</span><span className="text-[10px] text-gold font-black tracking-widest">MONIEPOINT 5007071458</span></div>
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Verified Value</span><span className="text-xl text-primary font-serif font-black">₦{totalAmount.toLocaleString()}</span></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setShowCheckout(false)} className="py-5 rounded-2xl bg-white/5 border border-white/10 text-silver hover:text-primary transition-all uppercase text-[9px] font-black tracking-widest">Back to Cart</button>
            <EmeraldButton onClick={handleConfirmPayment} className="py-5" disabled={isSubmitting}><span className="text-[9px] uppercase font-black tracking-widest">Authorize Paid</span></EmeraldButton>
          </div>
          <button 
            onClick={() => {
              setConfirmState({
                isOpen: true,
                title: "Cancel Transmission",
                message: "This will purge your current order request from the master queue. Continue?",
                type: "danger",
                onConfirm: () => handleCancelOrder("Guest Purge Requested")
              });
            }} 
            className="w-full py-4 text-red-500/40 hover:text-red-500 transition-all uppercase text-[8px] font-black tracking-[0.4em]"
          >
            Discard & Purge Record
          </button>
          <p className="text-[8px] text-center text-silver/20 uppercase tracking-[0.3em] font-black">All transmissions are permanent and audited by the master protocol</p>
        </div>
      </GlassModal>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState({ ...confirmState, isOpen: false })}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        type={confirmState.type}
      />
    </div>
  );
};

export default OrderingPage;
