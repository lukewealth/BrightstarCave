import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  Square2StackIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  BanknotesIcon,
  Bars3Icon,
  XMarkIcon,
  UserPlusIcon,
  ShieldCheckIcon,
  KeyIcon,
  EnvelopeIcon,
  QueueListIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  CloudArrowUpIcon,
  UserIcon,
  CheckBadgeIcon,
  ArrowLeftOnRectangleIcon,
  BellIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon,
  ArrowTrendingUpIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";
import { User, sendPasswordResetEmail } from "firebase/auth";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc,
  setDoc,
  where,
  addDoc
} from "firebase/firestore";
import { db, getUserRole, UserRole, auth, seedDatabaseFromJSON, logout, logAudit, requestNotificationPermission, validateInput, sanitizeInput } from "../lib/firebase";
import menuDataArchive from "../data/data.json";
import { 
  GlassCard, 
  GoldButton, 
  EmeraldButton, 
  SilverInput, 
  Badge, 
  SectionTitle, 
  GlassModal, 
  LuxuryTable, 
  TabSystem, 
  Toast,
  LionLoader,
  ConfirmModal
} from "../components/design-system/Primitive";
import { useNavigate } from "react-router-dom";
import { CATEGORIES } from "../lib/constants";

export const AdminPortal = ({ user }: { user: User | null }) => {
  const navigate = useNavigate();

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? 
            <span key={i} className="bg-gold/20 text-gold rounded-sm px-0.5">{part}</span> : 
            part
        )}
      </span>
    );
  };
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'staff' | 'orders' | 'accounting' | 'menu' | 'audits'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [audits, setAudits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'item' | 'staff' | 'menu'>('item');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
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

  // Search States
  const [searchQueries, setSearchQueries] = useState({
    inventory: "",
    menu: "",
    staff: "",
    audits: "",
    accounting: "",
    orders: ""
  });

  // Date Filter State for Accounting
  const [dateFilter, setDateFilter] = useState({
    start: "",
    end: ""
  });

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter(o => o.status === 'paid' && o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status === 'pending-payment').length;
    const lowStock = inventory.filter(i => i.stock < 10).length;

    const barRevenue = todaysOrders.reduce((acc, curr) => {
      const barItems = curr.items?.filter((i: any) => i.type === 'bar') || [];
      return acc + barItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
    }, 0);

    const kitchenRevenue = todaysOrders.reduce((acc, curr) => {
      const kitchenItems = curr.items?.filter((i: any) => i.type === 'kitchen') || [];
      return acc + kitchenItems.reduce((sum: number, i: any) => sum + (i.price * i.quantity), 0);
    }, 0);

    const topSelling = [...inventory]
      .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
      .slice(0, 5);

    return { totalRevenue, activeOrders, lowStock, totalOrders: todaysOrders.length, barRevenue, kitchenRevenue, topSelling };
  }, [orders, inventory]);

  // Filtered Lists
  const filteredData = useMemo(() => {
    const q = searchQueries;
    
    let accountingOrders = orders.filter(o => o.status === 'paid');
    if (dateFilter.start) {
      const startDate = new Date(dateFilter.start);
      accountingOrders = accountingOrders.filter(o => o.createdAt?.toDate() >= startDate);
    }
    if (dateFilter.end) {
      const endDate = new Date(dateFilter.end);
      endDate.setHours(23, 59, 59, 999);
      accountingOrders = accountingOrders.filter(o => o.createdAt?.toDate() <= endDate);
    }

    return {
      inventory: inventory.filter(i => 
        i.name?.toLowerCase().includes(q.inventory.toLowerCase()) || 
        i.category?.toLowerCase().includes(q.inventory.toLowerCase()) ||
        i.id?.toLowerCase().includes(q.inventory.toLowerCase())
      ),
      menu: menuItems.filter(i => 
        i.name?.toLowerCase().includes(q.menu.toLowerCase()) || 
        i.category?.toLowerCase().includes(q.menu.toLowerCase())
      ),
      staff: staff.filter(s => 
        s.email?.toLowerCase().includes(q.staff.toLowerCase()) || 
        s.role?.toLowerCase().includes(q.staff.toLowerCase())
      ),
      audits: audits.filter(a => 
        a.action?.toLowerCase().includes(q.audits.toLowerCase()) || 
        a.performedBy?.toLowerCase().includes(q.audits.toLowerCase()) ||
        a.category?.toLowerCase().includes(q.audits.toLowerCase())
      ),
      accounting: accountingOrders.filter(o => 
        o.id.toLowerCase().includes(q.accounting.toLowerCase()) || 
        o.staffName?.toLowerCase().includes(q.accounting.toLowerCase()) ||
        o.table?.toLowerCase().includes(q.accounting.toLowerCase())
      ),
      orders: orders.filter(o => 
        o.id.toLowerCase().includes(q.orders.toLowerCase()) || 
        o.staffName?.toLowerCase().includes(q.orders.toLowerCase()) ||
        o.table?.toLowerCase().includes(q.orders.toLowerCase()) ||
        o.status?.toLowerCase().includes(q.orders.toLowerCase())
      )
    };
  }, [inventory, menuItems, staff, audits, orders, searchQueries, dateFilter]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    if (role !== 'admin') return;

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(1000)), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStaff = onSnapshot(collection(db, "admins"), (snap) => {
      setStaff(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      setMenuItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubAudits = onSnapshot(query(collection(db, "audits"), orderBy("timestamp", "desc"), limit(200)), (snap) => {
      setAudits(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubOrders(); unsubInv(); unsubStaff(); unsubMenu(); unsubAudits(); };
  }, [role]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const handleEnablePush = async () => {
    const token = await requestNotificationPermission();
    if (token) {
      setPushEnabled(true);
      showToast("Master Notification Stream Active");
    } else {
      showToast("Authorization Denied", "error");
    }
  };

  const handleRestoreArchive = async () => {
    if(window.confirm("CRITICAL: This will overwrite all Menu and Inventory definitions with JSON archive. Proceed?")) {
      await seedDatabaseFromJSON(menuDataArchive);
      showToast("System resources restored from archive");
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/");
    } catch (err) {
      showToast("Sign out failed", "error");
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sanitized = {
        ...selectedItem,
        email: sanitizeInput(selectedItem.email)
      };
      
      const errors = validateInput(sanitized, { email: 'email', role: 'required' });
      if (errors.length > 0) throw new Error(errors[0]);
      
      const staffRef = sanitized.id ? doc(db, "admins", sanitized.id) : doc(collection(db, "admins"));
      const staffData = {
        email: sanitized.email,
        role: sanitized.role || 'staff_waiter',
        updatedAt: serverTimestamp(),
        ...(sanitized.id ? {} : { createdAt: serverTimestamp() })
      };

      await setDoc(staffRef, staffData, { merge: true });
      await logAudit(sanitized.id ? "PERSONNEL_UPDATE" : "PERSONNEL_ONBOARD", { email: sanitized.email, role: staffData.role }, 'staff');
      showToast(sanitized.id ? "Personnel updated" : "Operator onboarded successfully");
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Failed to update staff", "error");
    }
  };

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const sanitized = {
        ...selectedItem,
        name: sanitizeInput(selectedItem.name),
        description: sanitizeInput(selectedItem.description)
      };

      const errors = validateInput(sanitized, { 
        name: ['required', 'string'], 
        price: ['required', 'positive_number'], 
        category: ['required', 'string'] 
      });
      if (errors.length > 0) throw new Error(errors[0]);
      
      const menuRef = sanitized.id ? doc(db, "menu", sanitized.id) : doc(collection(db, "menu"));
      const itemId = sanitized.id || menuRef.id;
      
      const itemData = {
        id: itemId,
        name: sanitized.name,
        price: Number(sanitized.price),
        category: sanitized.category || 'Bar',
        type: sanitized.type || 'bar',
        description: sanitized.description || '',
        stock: Number(sanitized.stock || 0),
        updatedAt: serverTimestamp(),
        ...(sanitized.id ? {} : { createdAt: serverTimestamp() })
      };

      await setDoc(menuRef, itemData, { merge: true });
      
      // Sync to Inventory
      const invRef = doc(db, "inventory", itemId);
      await setDoc(invRef, {
        id: itemId,
        name: itemData.name,
        category: itemData.category,
        stock: itemData.stock,
        updatedAt: serverTimestamp()
      }, { merge: true });

      await logAudit("MENU_RESOURCE_SYNC", { name: itemData.name, price: itemData.price, stock: itemData.stock }, 'inventory');
      showToast("Resource synchronization successful");
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || "Menu update failed", "error");
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const errors = validateInput(selectedItem, { stock: 'positive_number' });
      if (errors.length > 0) throw new Error(errors[0]);

      await updateDoc(doc(db, "inventory", selectedItem.id), { stock: Number(selectedItem.stock) });
      await updateDoc(doc(db, "menu", selectedItem.id), { stock: Number(selectedItem.stock) });
      
      await logAudit("STOCK_ADJUSTMENT", { name: selectedItem.name, newStock: selectedItem.stock }, 'inventory');
      showToast("Stock level authorization confirmed");
      setIsModalOpen(false);
    } catch (err) {
      showToast("Sync failed", "error");
    }
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Sales Queue' },
    { id: 'inventory', icon: ArchiveBoxIcon, label: 'Inventory' },
    { id: 'menu', icon: QueueListIcon, label: 'Master Menu' },
    { id: 'staff', icon: UserGroupIcon, label: 'Personnel' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Financials' },
    { id: 'audits', icon: ClipboardDocumentCheckIcon, label: 'Master Audit' },
  ];

  if (user && !role) {
    return (
      <div className="h-full flex items-center justify-center bg-primary">
        <LionLoader size="lg" />
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20 text-center">
        <GlassCard className="p-12 space-y-6 max-w-lg">
          <ExclamationTriangleIcon className="w-16 h-16 text-gold mx-auto animate-pulse" />
          <h2 className="text-3xl font-serif text-primary uppercase tracking-widest">Access Restricted</h2>
          <p className="text-silver opacity-60">System protocols require administrative clearance.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-primary overflow-hidden relative">
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

      <aside className={`fixed lg:relative inset-y-0 left-0 ${isCollapsed ? 'lg:w-28' : 'w-72 lg:w-80'} border-r border-white/[0.03] bg-black/40 p-6 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-all duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="px-2">
            <div className="flex justify-between items-center mb-10">
              {!isCollapsed && <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black opacity-60">Master Command</p>}
              <div className="flex gap-2">
                <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden lg:block p-1 text-silver/40 hover:text-gold transition-colors">
                  {isCollapsed ? <ChevronRightIcon className="w-5 h-5" /> : <ChevronLeftIcon className="w-5 h-5" />}
                </button>
                <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40"><XMarkIcon className="w-5 h-5" /></button>
              </div>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }} 
                  className={`w-full flex items-center gap-4 text-[10px] p-4 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black shadow-2xl shadow-gold/20' : 'text-silver hover:bg-white/5 hover:text-gold'} ${isCollapsed ? 'justify-center px-0' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span>{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>
          <div className={`pt-6 border-t border-white/5 space-y-4 ${isCollapsed ? 'items-center' : ''}`}>
            {!pushEnabled && (
              <button onClick={handleEnablePush} className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-gold/5 border border-gold/20 text-gold hover:bg-gold hover:text-black transition-all group ${isCollapsed ? 'justify-center' : ''}`} title="Enable Notifications">
                <BellIcon className="w-5 h-5" />
                {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">Notifications</span>}
              </button>
            )}
            <button onClick={handleRestoreArchive} className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-emerald/10 border border-emerald/20 text-emerald hover:bg-emerald hover:text-black transition-all group ${isCollapsed ? 'justify-center' : ''}`} title="Factory Restore">
              <CloudArrowUpIcon className="w-5 h-5" />
              {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">Restore</span>}
            </button>
            <button onClick={handleSignOut} className={`w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all group ${isCollapsed ? 'justify-center' : ''}`} title="Terminate Session">
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
              {!isCollapsed && <span className="text-[9px] font-black uppercase tracking-widest">Terminate</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 lg:space-y-16 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 border-b border-white/5">
          <div className="flex flex-row-reverse justify-between items-start w-full xl:flex-row xl:w-auto">
            <div className="space-y-3 text-right xl:text-left">
              <h3 className="text-gold text-[9px] uppercase tracking-[0.6em] font-black opacity-60">Admin Protocol v10.0</h3>
              <h2 className="text-4xl xl:text-5xl font-serif text-primary tracking-tighter uppercase">{view}</h2>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-3 bg-white/5 border border-white/10 rounded-2xl text-gold"
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-6 items-end w-full xl:w-auto">
            {['inventory', 'menu', 'staff', 'audits', 'accounting', 'orders'].includes(view) && (
              <div className="relative w-full sm:w-64 group">
                <SilverInput 
                  placeholder={`Search ${view === 'orders' ? 'Queue' : view}...`} 
                  icon={MagnifyingGlassIcon} 
                  value={(searchQueries as any)[view]} 
                  onChange={(e: any) => setSearchQueries({ ...searchQueries, [view]: e.target.value })} 
                  className="w-full"
                />
                {(searchQueries as any)[view] && (
                  <button 
                    onClick={() => setSearchQueries({ ...searchQueries, [view]: "" })}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-silver/40 hover:text-gold transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            <div className="flex gap-6">
              <div className="xl:text-right">
                <p className="text-[8px] uppercase tracking-widest text-silver mb-1 opacity-60">Global Net Revenue</p>
                <p className="text-2xl lg:text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="xl:text-right border-l border-white/10 pl-6">
                <p className="text-[8px] uppercase tracking-widest text-silver mb-1 opacity-60">Active Queue</p>
                <p className="text-2xl lg:text-3xl font-serif text-primary font-black">{stats.activeOrders}</p>
              </div>
            </div>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              <GlassCard className="p-8 space-y-4">
                  <p className="text-[8px] uppercase tracking-widest text-gold font-black">Total Transmissions</p>
                  <p className="text-4xl font-serif font-black">{stats.totalOrders}</p>
                  <Badge color="gold">Verified Settlements</Badge>
              </GlassCard>
              <GlassCard className="p-8 space-y-4">
                  <p className="text-[8px] uppercase tracking-widest text-emerald font-black">Bar Revenue</p>
                  <p className="text-4xl font-serif font-black">₦{stats.barRevenue.toLocaleString()}</p>
                  <Badge color="emerald">Liquid Assets</Badge>
              </GlassCard>
              <GlassCard className="p-8 space-y-4">
                  <p className="text-[8px] uppercase tracking-widest text-purple-400 font-black">Kitchen Revenue</p>
                  <p className="text-4xl font-serif font-black">₦{stats.kitchenRevenue.toLocaleString()}</p>
                  <Badge color="purple">Gastronomy Assets</Badge>
              </GlassCard>
              <GlassCard className="p-8 space-y-4 border-red-500/10">
                  <p className="text-[8px] uppercase tracking-widest text-red-500 font-black">Low Stock Alert</p>
                  <p className="text-4xl font-serif font-black">{stats.lowStock}</p>
                  <Badge color="red">Immediate Restock</Badge>
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <GlassCard className="p-10 space-y-8">
                <div className="flex justify-between items-center">
                  <SectionTitle subtitle="Movement Analytics" title="Top Performing Assets" />
                  <ArrowTrendingUpIcon className="w-8 h-8 text-gold opacity-20" />
                </div>
                <div className="space-y-6">
                  {stats.topSelling.map((item, idx) => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl group hover:border-gold/20 transition-all">
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-serif font-black text-silver/20">{idx + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-primary uppercase tracking-widest">{item.name}</p>
                          <p className="text-[10px] text-silver/40 uppercase font-black">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-serif text-gold font-black">{item.soldCount || 0}</p>
                        <p className="text-[8px] text-silver/40 uppercase font-black tracking-widest">Units Sold</p>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard className="p-10 space-y-8">
                <SectionTitle subtitle="Operational Health" title="Recent Security Audits" />
                <div className="space-y-4">
                  {audits.slice(0, 5).map((audit) => (
                    <div key={audit.id} className="flex gap-4 items-start p-4 border-b border-white/5 last:border-0">
                      <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${audit.severity === 'high' ? 'bg-red-500 animate-pulse' : 'bg-gold'}`} />
                      <div className="space-y-1 flex-1">
                        <div className="flex justify-between">
                          <p className="text-[10px] font-black uppercase text-primary tracking-widest">{audit.action}</p>
                          <span className="text-[8px] text-silver/40 font-mono">{audit.timestamp?.toDate().toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] text-silver/60 italic">{audit.performedBy}</p>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setView('audits')} className="w-full py-4 text-[9px] uppercase font-black tracking-widest text-gold hover:bg-gold/5 rounded-2xl transition-all">View All Master Logs</button>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {view === 'audits' && (
          <div className="space-y-10">
            <SectionTitle subtitle="Governance Traceability" title="Master Audit Logs" />
            <LuxuryTable headers={['Timestamp', 'Action', 'Category', 'Operator', 'Details']}>
              {filteredData.audits.map((audit) => (
                <tr key={audit.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                  <td className="px-6 py-5 text-[10px] text-silver font-mono">{audit.timestamp?.toDate().toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <p className="text-xs font-black text-white uppercase tracking-wider">{audit.action}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge color={audit.category === 'sales' ? 'gold' : audit.category === 'inventory' ? 'emerald' : 'silver'}>{audit.category}</Badge>
                  </td>
                  <td className="px-6 py-5 text-[10px] text-silver font-bold uppercase">{audit.performedBy.split('@')[0]}</td>
                  <td className="px-6 py-5 text-[10px] text-silver/60 italic truncate max-w-xs">{JSON.stringify(audit.details)}</td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-10">
            <SectionTitle subtitle="Resource Synchronization" title="Stock Analytics" />
            <LuxuryTable headers={['Resource Identification', 'Category', 'Stock Availability', 'Sold Units', 'Action']}>
              {filteredData.inventory.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-primary leading-none uppercase tracking-wide">{item.name}</p>
                    <p className="text-[8px] text-silver/40 mt-1 font-mono uppercase tracking-widest">UID: {item.id.slice(0, 8)}</p>
                  </td>
                  <td className="px-6 py-5">
                    <Badge color="silver">{item.category}</Badge>
                  </td>
                  <td className="px-6 py-5 font-mono text-gold font-black">{item.stock} Units</td>
                  <td className="px-6 py-5 text-silver text-xs font-bold italic">{item.soldCount || 0} transmissions</td>
                  <td className="px-6 py-5 text-right">
                    <button onClick={() => { setSelectedItem(item); setModalType('item'); setIsModalOpen(true); }} className="p-2 text-silver/40 hover:text-gold transition-all"><AdjustmentsHorizontalIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center"><SectionTitle subtitle="Registry Control" title="Master Gastronomy" /><GoldButton onClick={() => { setModalType('menu'); setSelectedItem({ category: 'Bar', price: 0, type: 'bar' }); setIsModalOpen(true); }}><PlusIcon className="w-4 h-4 mr-2" /> Create Item</GoldButton></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredData.menu.map((item) => (
                <GlassCard key={item.id} className="p-8 space-y-6 border-white/5 hover:border-gold/30 transition-all group">
                  <div className="flex justify-between items-start"><Badge color="gold">{item.category}</Badge><p className="text-xl font-serif text-primary font-black">₦{item.price.toLocaleString()}</p></div>
                  <div className="space-y-2"><h4 className="text-xl font-bold text-primary group-hover:text-gold transition-colors leading-tight">{item.name}</h4><p className="text-[10px] text-silver/60 line-clamp-3 leading-relaxed">{item.description}</p></div>
                  <div className="flex gap-4 pt-6 border-t border-white/5">
                    <button onClick={() => { setSelectedItem(item); setModalType('menu'); setIsModalOpen(true); }} className="flex-1 py-3 text-[9px] uppercase font-black tracking-widest text-silver hover:text-gold border border-white/10 rounded-2xl transition-all">Configure</button>
                    <button onClick={async () => { if(window.confirm("Purge resource?")) { await deleteDoc(doc(db, "menu", item.id)); await deleteDoc(doc(db, "inventory", item.id)); await logAudit("MENU_PURGE", { name: item.name }, 'inventory'); showToast("Resource purged"); } }} className="p-3 text-red-400/20 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {view === 'staff' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center"><SectionTitle subtitle="Operational Security" title="Operator Directory" /><GoldButton onClick={() => { setModalType('staff'); setSelectedItem({ role: 'staff_waiter' }); setIsModalOpen(true); }}><UserPlusIcon className="w-4 h-4 mr-2" /> Add Personnel</GoldButton></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredData.staff.map((member) => (
                <GlassCard key={member.id} className="p-8 space-y-6 border-white/5 group">
                  <div className="flex justify-between items-start"><div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-gold font-bold text-2xl shadow-2xl uppercase">{member.email?.[0]}</div><Badge color={member.role === 'admin' ? 'gold' : member.role === 'staff_bar' ? 'purple' : 'emerald'}>{member.role.replace('_', ' ').toUpperCase()}</Badge></div>
                  <div className="space-y-1"><p className="text-sm font-bold text-primary truncate tracking-widest">{member.email}</p><p className="text-[8px] uppercase tracking-[0.3em] text-silver/40 font-black">Operator Key: {member.id.slice(-8)}</p></div>
                  <div className="flex gap-4 pt-6 border-t border-white/5">
                    <button onClick={() => { setSelectedItem(member); setModalType('staff'); setIsModalOpen(true); }} className="flex-1 py-3 text-[9px] uppercase font-black tracking-widest text-silver hover:text-gold border border-white/10 rounded-2xl transition-all">Credentials</button>
                    <button onClick={() => {
                      setConfirmState({
                        isOpen: true,
                        title: "Revoke Access Protocol",
                        message: `This will terminate all operational credentials for ${member.email}. Proceed with revocation?`,
                        type: "danger",
                        onConfirm: async () => {
                          await deleteDoc(doc(db, "admins", member.id)); 
                          await logAudit("ACCESS_REVOKED", { email: member.email }, 'staff'); 
                          showToast("Access revoked");
                        }
                      });
                    }} className="p-3 text-red-400/20 hover:text-red-400 rounded-2xl transition-all"><TrashIcon className="w-5 h-5" /></button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-10">
            <SectionTitle subtitle="Transaction Hub" title="Master Sales Queue" />
            <LuxuryTable headers={['Timestamp', 'Room/Table', 'Items Ordered', 'Operator', 'Value', 'Status', 'Action']}>
              {filteredData.orders.map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                  <td className="px-6 py-5">
                    <p className="text-[10px] text-silver font-mono">{order.formattedDate}</p>
                    <p className="text-[10px] text-silver/40 font-mono">{order.formattedTime}</p>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-primary uppercase tracking-widest">{order.table}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      {order.items.map((item: any, idx: number) => (
                        <p key={idx} className="text-[10px] text-silver/60">
                          <span className="text-gold font-bold">{item.quantity}x</span> {item.name}
                        </p>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-[10px] text-silver font-bold uppercase">{order.staffName || "System"}</td>
                  <td className="px-6 py-5 font-serif text-gold font-black">₦{order.total?.toLocaleString()}</td>
                  <td className="px-6 py-5">
                    <Badge color={order.status === 'paid' ? 'emerald' : 'gold'}>{order.status.replace('-', ' ').toUpperCase()}</Badge>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => {
                        setConfirmState({
                          isOpen: true,
                          title: "Purge Transaction Record",
                          message: `CRITICAL: This will permanently delete the transaction record for ${order.table} (₦${order.total?.toLocaleString()}). This action is irreversible. Proceed?`,
                          type: "danger",
                          onConfirm: async () => {
                            await deleteDoc(doc(db, "orders", order.id));
                            await logAudit("ORDER_DELETE", { orderId: order.id, table: order.table, total: order.total }, 'sales');
                            showToast("Transaction record purged");
                          }
                        });
                      }} 
                      className="p-2 text-red-400/20 hover:text-red-400 transition-all"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'accounting' && (
           <div className="space-y-10">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <SectionTitle subtitle="Production Audit" title="Financial Settlements" />
                <div className="flex flex-wrap gap-4 w-full md:w-auto">
                   <div className="space-y-1">
                      <p className="text-[8px] uppercase font-black text-silver/40 tracking-widest ml-1">From</p>
                      <input type="date" value={dateFilter.start} onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-primary focus:outline-none focus:border-gold/30" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-[8px] uppercase font-black text-silver/40 tracking-widest ml-1">To</p>
                      <input type="date" value={dateFilter.end} onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})} className="bg-white/5 border border-white/10 rounded-xl p-2 text-[10px] text-primary focus:outline-none focus:border-gold/30" />
                   </div>
                   <button 
                    onClick={() => setDateFilter({ start: "", end: "" })}
                    className="self-end p-2 text-silver/40 hover:text-red-400 transition-colors"
                    title="Clear Filters"
                   >
                    <XMarkIcon className="w-5 h-5" />
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <GlassCard className="p-6 border-white/5">
                    <p className="text-[8px] uppercase tracking-widest text-silver mb-1 font-black">Period Total</p>
                    <p className="text-2xl font-serif text-gold font-black">₦{filteredData.accounting.reduce((acc, curr) => acc + (curr.total || 0), 0).toLocaleString()}</p>
                 </GlassCard>
                 <GlassCard className="p-6 border-white/5">
                    <p className="text-[8px] uppercase tracking-widest text-silver mb-1 font-black">Audit Count</p>
                    <p className="text-2xl font-serif text-primary font-black">{filteredData.accounting.length}</p>
                 </GlassCard>
                 <GlassCard className="p-6 border-white/5">
                    <p className="text-[8px] uppercase tracking-widest text-silver mb-1 font-black">Average Value</p>
                    <p className="text-2xl font-serif text-primary font-black">₦{(filteredData.accounting.length ? Math.round(filteredData.accounting.reduce((acc, curr) => acc + (curr.total || 0), 0) / filteredData.accounting.length) : 0).toLocaleString()}</p>
                 </GlassCard>
              </div>

              <LuxuryTable headers={['Audit Ref', 'Timestamp', 'Room/Table', 'Operator', 'Value', 'Status']}>
                {filteredData.accounting.map((order) => (
                  <tr key={order.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                    <td className="px-8 py-6 text-xs text-primary font-black uppercase tracking-tighter">{highlightMatch(order.id.slice(-10), searchQueries.accounting)}</td>
                    <td className="px-8 py-6 text-[10px] text-silver font-mono">{order.formattedDate} {order.formattedTime}</td>
                    <td className="px-8 py-6 text-[10px] text-primary font-black">{highlightMatch(order.table, searchQueries.accounting)}</td>
                    <td className="px-8 py-6"><div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_10px_#10b981]" /><p className="text-[10px] text-primary font-black uppercase">{highlightMatch(order.staffName || "System", searchQueries.accounting)}</p></div></td>
                    <td className="px-8 py-6 font-serif text-gold font-black">₦{order.total?.toLocaleString()}</td>
                    <td className="px-8 py-6"><Badge color="emerald">AUDITED</Badge></td>
                  </tr>
                ))}
              </LuxuryTable>
           </div>
        )}
      </main>

      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Master System Configuration">
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
          {modalType === 'staff' && (
            <form onSubmit={handleUpdateStaff} className="space-y-6">
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Email Identity</label><SilverInput icon={EnvelopeIcon} placeholder="Operator authentication email" value={selectedItem?.email || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, email: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Protocol Role</label><select value={selectedItem?.role || 'staff_waiter'} onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-primary focus:outline-none focus:border-gold/30"><option value="staff_waiter">Kitchen Operator (Waiter)</option><option value="staff_bar">Bar Operator (Liquid)</option><option value="admin">Global Protocol (Super Admin)</option></select></div>
              <GoldButton type="submit" className="w-full py-5 text-[11px] uppercase tracking-[0.2em]">{selectedItem?.id ? 'Authorize Update' : 'Initialize Onboarding'}</GoldButton>
            </form>
          )}

          {modalType === 'menu' && (
            <form onSubmit={handleUpdateMenu} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Resource Designation</label><SilverInput placeholder="Item name" value={selectedItem?.name || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, name: e.target.value })} /></div>
                <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Credit Value (₦)</label><SilverInput type="number" placeholder="Price" value={selectedItem?.price || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, price: e.target.value })} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Category Registry</label><select value={selectedItem?.category || 'Bar'} onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-primary focus:outline-none">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Initial Availability</label><SilverInput type="number" placeholder="Stock" value={selectedItem?.stock || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, stock: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Resource Type</label><select value={selectedItem?.type || 'bar'} onChange={(e) => setSelectedItem({ ...selectedItem, type: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-primary focus:outline-none"><option value="bar">Bar (Beverage)</option><option value="kitchen">Kitchen (Food)</option><option value="hotel">Stay (Apartments)</option></select></div>
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Luxury Description</label><textarea placeholder="Specify resource characteristics..." value={selectedItem?.description || ''} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-primary h-24 focus:outline-none" /></div>
              <GoldButton type="submit" className="w-full py-5 text-[11px] uppercase tracking-[0.2em]">{selectedItem?.id ? 'Authorize Resource Update' : 'Initialize Resource Transmission'}</GoldButton>
            </form>
          )}

          {modalType === 'item' && (
            <form onSubmit={handleUpdateInventory} className="space-y-6 text-center">
              <div className="p-8 bg-black/40 rounded-[32px] border border-white/5 space-y-4">
                 <p className="text-[10px] uppercase font-black text-gold tracking-[0.5em]">Resource Adjustment</p>
                 <h4 className="text-2xl font-serif text-primary">{selectedItem?.name}</h4>
              </div>
              <div className="space-y-2 text-left"><label className="text-[10px] uppercase font-black text-silver ml-4">Authorized Availability Count</label><SilverInput type="number" placeholder="Adjust Stock" value={selectedItem?.stock || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, stock: e.target.value })} /></div>
              <GoldButton type="submit" className="w-full py-5 text-[11px] uppercase tracking-[0.2em]">Confirm Inventory Audit</GoldButton>
            </form>
          )}
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

export default AdminPortal;
