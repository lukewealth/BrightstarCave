import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChartBarIcon, 
  Square2StackIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ArrowPathIcon,
  BanknotesIcon,
  Bars3Icon,
  XMarkIcon,
  PrinterIcon,
  ClockIcon,
  BoltIcon,
  CheckCircleIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  TableCellsIcon,
  IdentificationIcon,
  ArrowLeftOnRectangleIcon
} from "@heroicons/react/24/outline";
import { User } from "firebase/auth";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  where,
  addDoc,
  increment,
  getDoc
} from "firebase/firestore";
import { db, getUserRole, UserRole, logout } from "../lib/firebase";
import { 
  GlassCard, 
  Badge, 
  SectionTitle,
  LuxuryTable, 
  Toast,
  GoldButton,
  SilverInput,
  EmeraldButton,
  GlassModal
} from "../components/design-system/Primitive";
import { useCart } from "../lib/cart-context";
import { menuItems, MenuItem } from "../data/menu";
import { useNavigate } from "react-router-dom";

export const StaffPortal = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, clearCart, totalAmount } = useCart();
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'orders' | 'accounting' | 'pos'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [displayMenu, setDisplayMenu] = useState<MenuItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [tableId, setTableId] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Comprehensive Department Categorization
  const deptCategories = useMemo(() => {
    if (role === 'staff_bar') {
      return ["Mocktails", "Cocktails", "Brandy & Cognac", "Whiskey", "Tequila", "Wine", "Beer", "Soft Drinks"];
    }
    if (role === 'staff_waiter') {
      return ["Kitchen Menu", "Exotic Kitchen"];
    }
    return []; 
  }, [role]);

  const departmentType = useMemo(() => {
    if (role === 'staff_bar') return 'bar';
    if (role === 'staff_waiter') return 'kitchen';
    return 'all';
  }, [role]);

  const departmentName = useMemo(() => {
    if (role === 'staff_bar') return 'Bar & Beverage';
    if (role === 'staff_waiter') return 'Kitchen & Exotic';
    return 'General Operations';
  }, [role]);

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const relevantOrders = orders.filter(o => 
      role === 'admin' || 
      o.staffId === user?.uid || 
      (o.departmentScopes && o.departmentScopes.includes(departmentType))
    );

    const paidOrders = relevantOrders.filter(o => o.status === 'paid' && o.createdAt?.toDate() >= today);
    const myPaidOrders = paidOrders.filter(o => o.staffId === user?.uid);
    
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const myRevenue = myPaidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    
    const activeOrders = relevantOrders.filter(o => o.status === 'pending-payment').length;
    
    const relevantInventory = role === 'admin' ? inventory : inventory.filter(i => deptCategories.includes(i.category));
    const lowStock = relevantInventory.filter(i => i.stock < 10).length;

    return { 
      totalRevenue, 
      myRevenue,
      activeOrders, 
      lowStock, 
      totalOrders: paidOrders.length, 
      myOrdersCount: myPaidOrders.length,
      relevantOrders 
    };
  }, [orders, inventory, role, deptCategories, departmentType, user?.uid]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    if (!role || role === 'guest') return;

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(200)), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      if (!snap.empty) {
        setDisplayMenu(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
      } else {
        setDisplayMenu(menuItems);
      }
    });

    return () => { unsubOrders(); unsubInv(); unsubMenu(); };
  }, [role, user]);

  const filteredPOSMenu = useMemo(() => {
    return displayMenu.filter(item => {
      const isInDepartment = role === 'admin' || deptCategories.includes(item.category);
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      return isInDepartment && matchesSearch;
    });
  }, [displayMenu, searchQuery, deptCategories, role]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      showToast("Sign out failed", "error");
    }
  };

  const handlePrintReceipt = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;
    const receiptHtml = `<html><head><style>body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; line-height: 1.4; } .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; } .logo { font-size: 16px; font-weight: bold; } .item { display: flex; justify-content: space-between; } .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-weight: bold; font-size: 14px; }</style></head><body><div class="header"><div class="logo">BRIGHT STAR CAVE</div><p>${departmentName}</p></div><p>Ref: ${order.id.slice(-8)}<br>Operator: ${order.staffName}<br>Date: ${order.formattedDate}</p><div>${order.items.map((i: any) => `<div class="item"><span>${i.name} x${i.quantity}</span><span>₦${(i.price * i.quantity).toLocaleString()}</span></div>`).join('')}</div><div class="total"><div class="item"><span>SETTLED</span><span>₦${order.total.toLocaleString()}</span></div></div><div style="text-align:center; margin-top:20px; font-size:10px;">Payment: Moniepoint 5007071458<br>* BRIGHTSTAR SECURITY ENCRYPTED *</div><script>window.print(); setTimeout(() => window.close(), 500);</script></body></html>`;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const handleInitiateOrder = async () => {
    if (!tableId) return showToast("Room/Table Identification required", "error");
    setIsSubmitting(true);
    const now = new Date();
    try {
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
        userId: "staff_entry",
        userName: `Staff Order (${user?.email?.split('@')[0]})`,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        formattedDate: now.toLocaleDateString(),
        formattedTime: now.toLocaleTimeString(),
        isStaffAssisted: true,
        staffId: user?.uid,
        staffName: user?.displayName || user?.email?.split('@')[0],
        departmentScopes: Array.from(new Set(departmentalItems.map(i => i.type)))
      };
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setPendingOrderId(docRef.id);
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
      showToast("Settlement Audited. Dispatch Authorized.");
      setView('orders');
    } catch (err) { showToast("Audit failure", "error"); }
    finally { setIsSubmitting(false); }
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'pos', icon: PlusIcon, label: 'Order Entry' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Dispatch Queue' },
    { id: 'inventory', icon: Square2StackIcon, label: 'Resource Stock' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Transmission Ledger' },
  ];

  const filteredInventory = useMemo(() => {
    if (role === 'admin' || role === 'staff') return inventory;
    return inventory.filter(i => deptCategories.includes(i.category));
  }, [inventory, role, deptCategories]);

  if (!role || role === 'guest') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20 text-center">
        <GlassCard className="p-12 space-y-6 max-w-lg">
          <ExclamationTriangleIcon className="w-16 h-16 text-gold mx-auto animate-pulse" />
          <h2 className="text-3xl font-serif text-primary uppercase tracking-widest">Unauthorized Terminal</h2>
          <p className="text-silver opacity-60">Authorized personnel protocols only. Verify access points.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-primary overflow-hidden">
      {/* Operator Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="px-2">
            <div className="flex justify-between items-center mb-10">
              <div className="space-y-1">
                 <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black opacity-60">Terminal Hub</p>
                 <h4 className="text-sm font-serif text-primary uppercase tracking-widest">{departmentName}</h4>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-3">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-5 text-[10px] p-5 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black shadow-2xl shadow-gold/20' : 'text-silver hover:bg-white/5 hover:text-gold'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold shadow-xl border border-gold/10">{user?.email?.[0].toUpperCase()}</div>
            <div className="overflow-hidden text-left">
              <p className="text-[10px] font-black text-primary truncate">{user?.email}</p>
              <p className="text-[7px] uppercase tracking-widest text-gold font-bold">Verified Operator</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-primary transition-all group">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-widest text-left">Terminate Session</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-16 space-y-10 no-scrollbar">
...
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 border-b border-white/5 relative">
          <div className="space-y-4">
            <h3 className="text-gold text-[10px] uppercase tracking-[0.6em] font-black opacity-40 flex items-center gap-3">
              <BoltIcon className="w-4 h-4" /> Secure Operational POS v1.0
            </h3>
            <h2 className="text-4xl xl:text-6xl font-serif text-primary tracking-tighter uppercase">{view === 'pos' ? 'Order Entry' : view}</h2>
          </div>
          {view === 'pos' && (
            <SilverInput placeholder="Quick Menu Search..." icon={MagnifyingGlassIcon} value={searchQuery} onChange={(e: any) => setSearchQuery(e.target.value)} className="w-full xl:w-96" />
          )}
        </header>

        {view === 'pos' && (
          <div className="flex flex-col xl:flex-row gap-10">
            <div className="flex-1 space-y-8">
              <SectionTitle subtitle="Departmental Selection" title="Master Menu" />
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                {filteredPOSMenu.map(item => (
                  <GlassCard key={item.id} className="p-6 space-y-4 hover:border-gold/30 transition-all cursor-pointer group" onClick={() => { addToCart(item); showToast(`${item.name} added`); }}>
                    <div className="flex justify-between items-start">
                      <Badge color={item.stock > 0 ? 'gold' : 'red'}>{item.stock} Unit</Badge>
                      <p className="text-lg font-black text-gold">₦{item.price.toLocaleString()}</p>
                    </div>
                    <h4 className="text-lg font-serif text-primary uppercase group-hover:text-gold transition-colors">{item.name}</h4>
                    <p className="text-[10px] text-silver/40 uppercase font-black tracking-widest">{item.category}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
            
            <aside className="w-full xl:w-96 space-y-8">
              <GlassCard className="p-8 space-y-8 border-gold/10">
                <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-4"><ShoppingBagIcon className="w-5 h-5 text-gold" /> Current Cart</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-primary uppercase">{item.name}</p>
                        <p className="text-[10px] text-gold font-mono">₦{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-silver hover:text-primary">-</button>
                        <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-silver hover:text-primary">+</button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && <p className="text-[10px] text-center text-silver/40 py-10 uppercase tracking-widest">Cart is empty</p>}
                </div>
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <SilverInput placeholder="Table / Room ID" icon={TableCellsIcon} value={tableId} onChange={(e: any) => setTableId(e.target.value)} />
                  <div className="flex justify-between items-end"><span className="text-[10px] uppercase tracking-widest text-silver/40">Total Value</span><span className="text-3xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span></div>
                  <GoldButton className="w-full py-4 text-[10px] uppercase font-black tracking-widest" disabled={cart.length === 0 || !tableId} onClick={handleInitiateOrder}>Checkout Order</GoldButton>
                </div>
              </GlassCard>
            </aside>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             <GlassCard className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20"><BanknotesIcon className="w-8 h-8 text-gold" /></div>
                   <Badge color="gold">Verified</Badge>
                </div>
                <div>
                   <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Total Revenue</p>
                   <p className="text-4xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
                </div>
             </GlassCard>
             <GlassCard className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 bg-emerald/10 rounded-2xl border border-emerald/20"><CheckCircleIcon className="w-8 h-8 text-emerald" /></div>
                   <Badge color="emerald">Efficiency</Badge>
                </div>
                <div>
                   <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Settled Audits</p>
                   <p className="text-4xl font-serif text-primary font-black">{stats.totalOrders} Transmissions</p>
                </div>
             </GlassCard>
             <GlassCard className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20"><ExclamationTriangleIcon className="w-8 h-8 text-red-500" /></div>
                   <Badge color="red">Attention</Badge>
                </div>
                <div>
                   <p className="text-sm font-bold text-primary uppercase tracking-widest mb-1">Low Resource Warning</p>
                   <p className="text-4xl font-serif text-primary font-black">{stats.lowStock} Skus</p>
                </div>
             </GlassCard>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-8">
            <SectionTitle subtitle="Awaiting Settlement" title="Audit Queue" />
            <div className="grid grid-cols-1 gap-6">
              {stats.relevantOrders.filter(o => o.status === 'pending-payment').map((order) => (
                <motion.div layout key={order.id} className="p-8 bg-secondary/40 border border-white/5 rounded-[32px] flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group hover:border-gold/30 transition-all shadow-2xl">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-black rounded-[24px] flex flex-col items-center justify-center border border-white/10 shadow-inner group-hover:border-gold/20 transition-all">
                      <p className="text-[8px] text-gold font-black tracking-[0.2em] mb-1">ROOM</p>
                      <p className="text-3xl font-serif text-primary font-black leading-none">{order.table}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-primary uppercase tracking-widest">{order.userName}</p>
                      <div className="flex items-center gap-4 text-silver/40 text-[10px] font-black uppercase tracking-widest">
                         <span>{order.items.length} Resources</span>
                         <span className="w-1 h-1 bg-white/10 rounded-full" />
                         <span className="text-gold">₦{order.total.toLocaleString()}</span>
                         <span className="w-1 h-1 bg-white/10 rounded-full" />
                         <span className="text-primary/40">OP: {order.staffName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto">
                     <div className="flex-1 md:flex-none flex items-center gap-3 px-5 py-3 bg-gold/10 rounded-2xl border border-gold/20 shadow-xl shadow-gold/5">
                       <ClockIcon className="w-4 h-4 text-gold animate-spin-slow" />
                       <span className="text-[9px] text-gold font-black uppercase tracking-widest">Synchronization In-Progress</span>
                     </div>
                     <GoldButton onClick={() => { setPendingOrderId(order.id); setShowCheckout(true); }} className="px-6 py-3 text-[10px] uppercase font-black tracking-widest">Process Settlement</GoldButton>
                  </div>
                </motion.div>
              ))}
            </div>
            {stats.relevantOrders.filter(o => o.status === 'pending-payment').length === 0 && (
              <div className="py-32 text-center opacity-10 space-y-6">
                <ClockIcon className="w-20 h-20 mx-auto" />
                <p className="text-[12px] uppercase tracking-[0.5em] font-black">All transmissions settled</p>
              </div>
            )}
          </div>
        )}

        {view === 'accounting' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <SectionTitle subtitle="Verified Ledger" title="Transmissions History" />
            <LuxuryTable headers={['Timestamp', 'Audit Ref', 'Identifier', 'Operator', 'Value', 'Action']}>
              {stats.relevantOrders.filter(o => o.status === 'paid').map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors">
                  <td className="px-8 py-6 text-[10px] text-silver font-mono tracking-widest">{order.formattedTime}</td>
                  <td className="px-8 py-6 text-[11px] text-primary font-black uppercase tracking-tighter">{order.id.slice(-8)}</td>
                  <td className="px-8 py-6"><Badge color="gold">{order.table}</Badge></td>
                  <td className="px-8 py-6 text-[10px] text-primary/60 font-black uppercase">{order.staffName}</td>
                  <td className="px-8 py-6 font-serif text-gold font-black text-lg">₦{order.total?.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    <button onClick={() => handlePrintReceipt(order)} className="p-3 bg-emerald/10 text-emerald hover:bg-emerald hover:text-black rounded-xl transition-all shadow-xl hover:shadow-emerald/20 flex items-center gap-3 ml-auto group/btn">
                      <PrinterIcon className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase hidden group-hover/btn:block animate-in fade-in slide-in-from-right-2">Print Audit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-8">
            <SectionTitle subtitle="Resource Master" title="Live Readiness" />
            <LuxuryTable headers={['Resource Identification', 'Department', 'Availability', 'Status']}>
              {filteredInventory.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">{item.name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-[9px] text-silver/40 uppercase font-black tracking-[0.2em]">{item.category}</p>
                  </td>
                  <td className="px-8 py-6 font-mono text-gold font-black text-base">{item.stock} Units</td>
                  <td className="px-8 py-6">
                    <Badge color={item.stock < 10 ? 'red' : 'emerald'}>{item.stock < 10 ? 'Critical' : 'Operational'}</Badge>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}
      </main>

      <GlassModal isOpen={showCheckout} onClose={() => setShowCheckout(false)} title="Audit Synchronization Active">
        <div className="space-y-8 p-4">
          <div className="p-8 bg-gold/5 border border-gold/20 rounded-[32px] text-center space-y-8 relative overflow-hidden">
            <ClockIcon className="w-14 h-14 text-gold animate-pulse mx-auto opacity-60" />
            <div className="space-y-2"><p className="text-4xl font-serif text-primary font-black">Audit Active</p><p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black">Waiting for Settlement Proof</p></div>
            <div className="space-y-4 pt-6 border-t border-white/5 text-left">
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Bank Identifier</span><span className="text-[10px] text-gold font-black tracking-widest">MONIEPOINT 5007071458</span></div>
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Verified Value</span><span className="text-xl text-primary font-serif font-black">₦{pendingOrderId ? orders.find(o => o.id === pendingOrderId)?.total?.toLocaleString() : totalAmount.toLocaleString()}</span></div>
            </div>
          </div>
          <EmeraldButton onClick={handleConfirmPayment} className="w-full py-5" disabled={isSubmitting}><span className="text-[9px] uppercase font-black tracking-widest">Authorize Paid & Print</span></EmeraldButton>
        </div>
      </GlassModal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default StaffPortal;
