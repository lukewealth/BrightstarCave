import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChartBarIcon, 
  Square2StackIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
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
  ArrowLeftOnRectangleIcon,
  TrashIcon,
  ArrowTrendingUpIcon
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
import { db, getUserRole, UserRole, logout, logAudit, validateInput } from "../lib/firebase";
import { 
  GlassCard, 
  Badge, 
  SectionTitle,
  LuxuryTable, 
  Toast,
  GoldButton,
  SilverInput,
  EmeraldButton,
  GlassModal,
  LionLoader,
  ConfirmModal
} from "../components/design-system/Primitive";
import { useCart } from "../lib/cart-context";
import { menuItems, MenuItem } from "../data/menu";
import { useNavigate } from "react-router-dom";
import { DEPARTMENTS, DEPARTMENT_CATEGORIES } from "../lib/constants";

export const StaffPortal = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();
  const { cart, addToCart, updateQuantity, clearCart, totalAmount } = useCart();
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'orders' | 'accounting' | 'pos'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [displayMenu, setDisplayMenu] = useState<MenuItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQueries, setSearchQueries] = useState({
    pos: "",
    inventory: "",
    orders: "",
    accounting: ""
  });
  const [tableId, setTableId] = useState("");
  const [showCheckout, setShowCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Confirmation State
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

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    if (!role || role === 'guest') return;

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(500)), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Orders sync error:", err));

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Inventory sync error:", err));

    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      setDisplayMenu(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as MenuItem[]);
    }, (err) => console.error("Menu sync error:", err));

    return () => { unsubOrders(); unsubInv(); unsubMenu(); };
  }, [role]);

  // Comprehensive Department Categorization
  const deptCategories = useMemo(() => {
    if (role === 'staff_bar') return DEPARTMENT_CATEGORIES[DEPARTMENTS.BAR];
    if (role === 'staff_waiter') return DEPARTMENT_CATEGORIES[DEPARTMENTS.KITCHEN];
    return DEPARTMENT_CATEGORIES[DEPARTMENTS.ALL]; 
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
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const personalRevenue = paidOrders
      .filter(o => o.staffId === user?.uid)
      .reduce((acc, curr) => acc + (curr.total || 0), 0);
    
    const activeOrders = relevantOrders.filter(o => o.status === 'pending-payment').length;
    
    const relevantInventory = role === 'admin' ? inventory : inventory.filter(i => deptCategories.includes(i.category));
    const lowStock = relevantInventory.filter(i => i.stock < 10).length;

    const topSelling = [...relevantInventory]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 5);

    const recentSettlements = paidOrders.slice(0, 5);

    return { 
      totalRevenue, 
      personalRevenue,
      activeOrders, 
      lowStock, 
      totalOrders: paidOrders.length, 
      relevantOrders,
      topSelling,
      recentSettlements
    };
  }, [orders, inventory, role, deptCategories, departmentType, user?.uid]);

  // Filtered Lists
  const filteredData = useMemo(() => {
    const q = searchQueries;
    return {
      pos: displayMenu.filter(item => {
        const isInDepartment = role === 'admin' || deptCategories.includes(item.category);
        const matchesSearch = item.name.toLowerCase().includes(q.pos.toLowerCase()) || item.category.toLowerCase().includes(q.pos.toLowerCase());
        return isInDepartment && matchesSearch;
      }),
      inventory: inventory.filter(i => {
        const isInDept = role === 'admin' || role === 'staff' || deptCategories.includes(i.category);
        const matchesSearch = i.name?.toLowerCase().includes(q.inventory.toLowerCase()) || i.category?.toLowerCase().includes(q.inventory.toLowerCase());
        return isInDept && matchesSearch;
      }),
      orders: stats.relevantOrders.filter(o => 
        (o.table.toLowerCase().includes(q.orders.toLowerCase()) || 
         o.userName.toLowerCase().includes(q.orders.toLowerCase()) ||
         o.status.toLowerCase().includes(q.orders.toLowerCase()))
      ),
      accounting: stats.relevantOrders.filter(o => 
        o.status === 'paid' && 
        (o.id.toLowerCase().includes(q.accounting.toLowerCase()) || o.table.toLowerCase().includes(q.accounting.toLowerCase()))
      )
    };
  }, [displayMenu, inventory, stats.relevantOrders, searchQueries, role, deptCategories]);

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

  if (user && !role) {
    return (
      <div className="h-full flex items-center justify-center bg-primary">
        <LionLoader size="lg" />
      </div>
    );
  }

  if (!role || role === 'guest') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20 text-center">
        <GlassCard className="p-12 space-y-6 max-w-lg">
          <ExclamationTriangleIcon className="w-16 h-16 text-gold mx-auto animate-pulse" />
          <h2 className="text-3xl font-serif text-white uppercase tracking-widest">Unauthorized Terminal</h2>
          <p className="text-silver opacity-60">Authorized personnel protocols only. Verify access points.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden relative">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Operator Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 ${isCollapsed ? 'lg:w-28' : 'w-72 lg:w-80'} border-r border-white/[0.03] bg-black/40 p-6 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-all duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="px-2">
            <div className="flex justify-between items-center mb-10">
              {!isCollapsed && (
                <div className="space-y-1">
                   <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black opacity-60">Terminal Hub</p>
                   <h4 className="text-sm font-serif text-white uppercase tracking-widest">{departmentName}</h4>
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:block p-1 text-silver/40 hover:text-gold transition-colors">
                  {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40"><XMarkIcon className="w-5 h-5" /></button>
              </div>
            </div>
            <nav className="space-y-3">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-5 text-[10px] p-5 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black shadow-2xl shadow-gold/20' : 'text-silver hover:bg-white/5 hover:text-gold'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        <div className={`p-4 lg:p-6 border-t border-white/5 space-y-4 ${isCollapsed ? 'items-center' : ''}`}>
          {!isCollapsed && (
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold shadow-xl border border-gold/10">{user?.email?.[0].toUpperCase()}</div>
              <div className="overflow-hidden text-left">
                <p className="text-[10px] font-black text-white truncate">{user?.email}</p>
                <p className="text-[7px] uppercase tracking-widest text-gold font-bold">Verified Operator</p>
              </div>
            </div>
          )}
          <button onClick={handleSignOut} className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all group ${isCollapsed ? 'justify-center' : ''}`} title="Terminate Session">
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest text-left">Terminate</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-16 space-y-10 no-scrollbar">
...
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 border-b border-white/5 relative">
          <div className="flex justify-between items-start w-full xl:w-auto">
            <div className="space-y-4">
              <h3 className="text-gold text-[10px] uppercase tracking-[0.6em] font-black opacity-40 flex items-center gap-3">
                <BoltIcon className="w-4 h-4" /> Secure Operational POS v1.0
              </h3>
              <h2 className="text-4xl xl:text-6xl font-serif text-white tracking-tighter uppercase">{view === 'pos' ? 'Order Entry' : view}</h2>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-white/5 border border-white/10 rounded-2xl text-gold"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
          {['pos', 'inventory', 'orders', 'accounting'].includes(view) && (
            <SilverInput 
              placeholder={`Search ${view === 'pos' ? 'Menu' : view === 'orders' ? 'Queue' : view}...`} 
              icon={MagnifyingGlassIcon} 
              value={(searchQueries as any)[view]} 
              onChange={(e: any) => setSearchQueries({ ...searchQueries, [view]: e.target.value })} 
              className="w-full xl:w-96"
            />
          )}
        </header>

        {view === 'pos' && (
          <div className="flex flex-col xl:flex-row gap-10 items-start">
            <div className="flex-1 space-y-8 w-full">
              <div className="flex justify-between items-end">
                <SectionTitle subtitle="Departmental Selection" title="Master Menu" />
                <Badge color="silver">{filteredData.pos.length} Resources Available</Badge>
              </div>
              <div className={`grid grid-cols-1 md:grid-cols-2 ${cart.length > 0 ? '2xl:grid-cols-3' : '2xl:grid-cols-4'} gap-6 transition-all duration-500`}>
                {filteredData.pos.map(item => (
                  <GlassCard 
                    key={item.id} 
                    className={`p-6 space-y-4 hover:border-gold/50 transition-all cursor-pointer group relative overflow-hidden ${item.stock <= 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`} 
                    onClick={() => { addToCart(item); showToast(`${item.name} added`); }}
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <PlusIcon className="w-5 h-5 text-gold" />
                    </div>
                    <div className="flex justify-between items-start">
                      <Badge color={item.stock > 10 ? 'emerald' : item.stock > 0 ? 'gold' : 'red'}>
                        {item.stock > 0 ? `${item.stock} Unit` : 'Out of Stock'}
                      </Badge>
                      <p className="text-lg font-black text-gold">₦{item.price.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-lg font-serif text-white uppercase group-hover:text-gold transition-colors line-clamp-1">{item.name}</h4>
                      <p className="text-[9px] text-silver/40 uppercase font-black tracking-widest">{item.category}</p>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
            
            <AnimatePresence mode="wait">
              {cart.length > 0 && (
                <motion.aside 
                  initial={{ opacity: 0, x: 50, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: '100%', maxWidth: '384px' }}
                  exit={{ opacity: 0, x: 50, width: 0 }}
                  className="w-full xl:w-96 space-y-8 sticky top-0"
                >
                  <GlassCard className="p-8 space-y-8 border-gold/20 shadow-2xl shadow-gold/5">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-black uppercase tracking-widest flex items-center gap-4">
                        <ShoppingBagIcon className="w-5 h-5 text-gold" /> 
                        Cart <span className="text-silver/40">({cart.length})</span>
                      </h3>
                      <button onClick={clearCart} className="text-[8px] uppercase font-black text-red-400/60 hover:text-red-400 transition-colors">Clear All</button>
                    </div>
                    
                    <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                      {cart.map(item => (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          key={item.id} 
                          className="flex justify-between items-center p-5 bg-white/[0.03] border border-white/5 rounded-2xl hover:border-white/10 transition-all"
                        >
                          <div className="space-y-1">
                            <p className="text-[11px] font-bold text-white uppercase">{item.name}</p>
                            <p className="text-[10px] text-gold font-mono">₦{(item.price * item.quantity).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-4 bg-black/40 rounded-xl px-3 py-2 border border-white/5">
                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="text-silver hover:text-gold transition-colors font-bold">-</button>
                            <span className="text-xs font-black w-4 text-center">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="text-silver hover:text-gold transition-colors font-bold">+</button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="pt-8 border-t border-white/5 space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] uppercase font-black text-silver/40 ml-2 tracking-widest">Identification</label>
                        <SilverInput placeholder="Table / Room / Name" icon={TableCellsIcon} value={tableId} onChange={(e: any) => setTableId(e.target.value)} />
                      </div>
                      <div className="flex justify-between items-end p-4 bg-gold/5 rounded-2xl border border-gold/10">
                        <span className="text-[9px] uppercase tracking-widest text-gold/60 font-black">Total Settlement</span>
                        <span className="text-3xl font-serif text-gold font-black">₦{totalAmount.toLocaleString()}</span>
                      </div>
                      <GoldButton 
                        className="w-full py-5 text-[10px] uppercase font-black tracking-widest shadow-2xl shadow-gold/10" 
                        disabled={cart.length === 0 || !tableId} 
                        onClick={handleInitiateOrder}
                      >
                        Transmit Order
                      </GoldButton>
                    </div>
                  </GlassCard>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <GlassCard className="p-8 space-y-4">
                  <p className="text-[8px] uppercase tracking-widest text-gold font-black">Dept Revenue (Today)</p>
                  <p className="text-4xl font-serif font-black">₦{stats.totalRevenue.toLocaleString()}</p>
                  <Badge color="gold">Verified Settlements</Badge>
              </GlassCard>
              <GlassCard className="p-8 space-y-4">
                  <p className="text-[8px] uppercase tracking-widest text-emerald font-black">Personal Contribution</p>
                  <p className="text-4xl font-serif font-black">₦{stats.personalRevenue.toLocaleString()}</p>
                  <Badge color="emerald">Operator Performance</Badge>
              </GlassCard>
              <GlassCard className="p-8 space-y-4">
                  <p className="text-[8px] uppercase tracking-widest text-purple-400 font-black">Settled Audits</p>
                  <p className="text-4xl font-serif font-black">{stats.totalOrders}</p>
                  <Badge color="purple">Total Transmissions</Badge>
              </GlassCard>
              <GlassCard className="p-8 space-y-4 border-red-500/10">
                  <p className="text-[8px] uppercase tracking-widest text-red-500 font-black">Low Stock Alert</p>
                  <p className="text-4xl font-serif font-black">{stats.lowStock}</p>
                  <Badge color="red">Resource Warning</Badge>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <GlassCard className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <SectionTitle subtitle="Movement Analytics" title="Top Performing Resources" />
                  <ArrowTrendingUpIcon className="w-8 h-8 text-gold opacity-20" />
                </div>
                <div className="space-y-6">
                  {stats.topSelling.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl group hover:border-gold/20 transition-all">
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-serif font-black text-silver/20">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-white uppercase tracking-widest">{item.name}</p>
                          <p className="text-[10px] text-silver/40 uppercase font-black">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-serif text-gold font-black">{item.soldCount || 0}</p>
                        <p className="text-[8px] text-silver/40 uppercase font-black tracking-widest">Units Sold</p>
                      </div>
                    </div>
                  ))}
                  {stats.topSelling.length === 0 && (
                    <p className="text-center text-[10px] text-silver/40 uppercase py-10">No movement detected</p>
                  )}
                </div>
              </GlassCard>

              <GlassCard className="p-10 space-y-8">
                <SectionTitle subtitle="Traceability" title="Recent Activity" />
                <div className="space-y-4">
                  {stats.recentSettlements.map((order) => (
                    <div key={order.id} className="flex gap-4 items-start p-4 border-b border-white/5 last:border-0 group hover:bg-white/[0.02] transition-all rounded-xl">
                      <div className="mt-1 w-2 h-2 rounded-full shrink-0 bg-gold" />
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between">
                          <p className="text-[10px] font-black uppercase text-white tracking-widest">Order {order.table}</p>
                          <span className="text-[8px] text-silver/40 font-mono">{order.formattedTime}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] text-silver/60 italic">{order.items.length} items settled</p>
                          <p className="text-xs font-serif text-gold font-black">₦{order.total?.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {stats.recentSettlements.length === 0 && (
                    <p className="text-center text-[10px] text-silver/40 uppercase py-10">No recent activity</p>
                  )}
                  <button onClick={() => setView('accounting')} className="w-full py-4 text-[9px] uppercase font-black tracking-widest text-gold hover:bg-gold/5 rounded-2xl transition-all">View All Ledger Logs</button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-8">
            <SectionTitle subtitle="Operational Stream" title="Dispatch Queue" />
            <LuxuryTable headers={['Timestamp', 'Room/Table', 'Items Ordered', 'Operator', 'Value', 'Status', 'Action']}>
              {filteredData.orders.map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <p className="text-[10px] text-silver font-mono">{order.formattedDate}</p>
                    <p className="text-[10px] text-silver/40 font-mono">{order.formattedTime}</p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-bold text-white uppercase tracking-widest">{order.table}</p>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-[10px] text-silver/60">
                          <span className="text-gold font-bold">{item.quantity}x</span> {item.name}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-8 py-6 text-[10px] text-white/60 font-black uppercase">{order.staffName || "System"}</td>
                  <td className="px-8 py-6 font-serif text-gold font-black text-lg">₦{order.total?.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <Badge color={order.status === 'paid' ? 'emerald' : 'gold'}>{order.status.replace('-', ' ').toUpperCase()}</Badge>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {order.status === 'pending-payment' ? (
                      <GoldButton onClick={() => { setPendingOrderId(order.id); setShowCheckout(true); }} className="px-4 py-2 text-[9px] uppercase font-black tracking-widest">Settle</GoldButton>
                    ) : (
                      <button onClick={() => handlePrintReceipt(order)} className="p-2 bg-emerald/10 text-emerald hover:bg-emerald hover:text-black rounded-lg transition-all" title="Print Receipt">
                        <PrinterIcon className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </LuxuryTable>
            {filteredData.orders.length === 0 && (
              <div className="py-32 text-center opacity-10 space-y-6">
                <ClockIcon className="w-20 h-20 mx-auto" />
                <p className="text-[12px] uppercase tracking-[0.5em] font-black">Queue clear</p>
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
                  <td className="px-8 py-6 text-[11px] text-white font-black uppercase tracking-tighter">{order.id.slice(-8)}</td>
                  <td className="px-8 py-6"><Badge color="gold">{order.table}</Badge></td>
                  <td className="px-8 py-6 text-[10px] text-white/60 font-black uppercase">{order.staffName}</td>
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
                    <p className="text-sm font-bold text-white uppercase tracking-widest">{item.name}</p>
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
            <div className="space-y-2"><p className="text-4xl font-serif text-white font-black">Audit Active</p><p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black">Waiting for Settlement Proof</p></div>
            <div className="space-y-4 pt-6 border-t border-white/5 text-left">
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Bank Identifier</span><span className="text-[10px] text-gold font-black tracking-widest">MONIEPOINT 5007071458</span></div>
              <div className="flex justify-between"><span className="text-[9px] text-silver uppercase font-bold tracking-widest">Verified Value</span><span className="text-xl text-white font-serif font-black">₦{pendingOrderId ? orders.find(o => o.id === pendingOrderId)?.total?.toLocaleString() : totalAmount.toLocaleString()}</span></div>
            </div>
          </div>
          <EmeraldButton onClick={handleConfirmPayment} className="w-full py-5" disabled={isSubmitting}><span className="text-[9px] uppercase font-black tracking-widest">Authorize Paid & Print</span></EmeraldButton>
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

export default StaffPortal;
