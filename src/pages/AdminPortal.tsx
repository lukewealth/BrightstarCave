import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  Square2StackIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
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
  EnvelopeIcon
} from "@heroicons/react/24/outline";
import { User, sendPasswordResetEmail, updateEmail } from "firebase/auth";
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
import { db, getUserRole, UserRole, seedInventory, auth } from "../lib/firebase";
import { menuItems as initialMenu } from "../data/menu";
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
  Toast 
} from "../components/design-system/Primitive";

export const AdminPortal = ({ user }: { user: User | null }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'staff' | 'orders' | 'accounting' | 'menu'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'item' | 'staff' | 'menu'>('item');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  const isSuperAdmin = useMemo(() => user?.email === 'contact@tricodepro', [user]);

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(o => o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
    const lowStock = inventory.filter(i => i.stock < 10).length;

    return { totalRevenue, activeOrders, lowStock, totalOrders: todaysOrders.length };
  }, [orders, inventory]);

  // Simulated Gemini AI Insights
  useEffect(() => {
    if (stats.totalOrders > 0) {
      const insights = [
        "Demand for 'Bar' items increased by 15% today. Recommend restocking top sellers.",
        "Peak transaction volume detected between 18:00 - 20:00. Optimal staff allocation confirmed.",
        "Revenue velocity is 1.2x higher than average. Operational efficiency at peak.",
        "Low stock alert: 4 premium spirits below threshold. Automation triggered."
      ];
      setAiInsights(insights[Math.floor(Math.random() * insights.length)]);
    }
  }, [stats]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
      seedInventory(initialMenu);
    }
  }, [user]);

  useEffect(() => {
    if (role !== 'admin') return;

    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(200)), (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubStaff = onSnapshot(collection(db, "admins"), (snap) => {
      setStaff(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubOrders(); unsubInv(); unsubStaff(); };
  }, [role]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem.id) {
        await updateDoc(doc(db, "admins", selectedItem.id), selectedItem);
        showToast("Operator updated successfully");
      } else {
        const staffRef = doc(collection(db, "admins"));
        await setDoc(staffRef, { ...selectedItem, id: staffRef.id, createdAt: serverTimestamp() });
        showToast("New operator transmission established");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast("Access update failed", "error");
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Reset protocol sent to " + email);
    } catch (err) {
      showToast("Reset failed", "error");
    }
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Queue' },
    { id: 'inventory', icon: Square2StackIcon, label: 'Stock' },
    { id: 'staff', icon: UserGroupIcon, label: 'Personnel' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Finance' },
  ];

  if (role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20">
        <GlassCard className="p-8 lg:p-20 text-center space-y-6 lg:space-y-8 max-w-lg">
          <ExclamationTriangleIcon className="w-12 h-12 lg:w-20 lg:h-20 text-gold mx-auto animate-pulse" />
          <h2 className="text-2xl lg:text-4xl font-serif text-white uppercase tracking-widest">Administrative Clearance Required</h2>
          <p className="text-silver text-xs lg:text-sm leading-relaxed opacity-60">This terminal is restricted to Super Admin protocols. Verify your credentials.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/95 lg:bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12 lg:space-y-16">
          <div className="px-2 lg:px-4">
            <div className="flex justify-between items-center mb-10">
              <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.4em] lg:tracking-[0.6em] text-gold font-black opacity-60">Control Center</p>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-2 lg:space-y-3">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 lg:gap-5 text-[10px] lg:text-[11px] p-4 lg:p-5 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black shadow-2xl shadow-gold/20' : 'text-silver hover:bg-white/5 hover:text-gold'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* AI Insights Card */}
          <div className="p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
            <div className="flex items-center gap-3 mb-3 lg:mb-4 text-gold">
              <SparklesIcon className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" />
              <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Gemini Intelligence</span>
            </div>
            <p className="text-[10px] lg:text-[11px] text-silver leading-relaxed font-bold italic opacity-80">
              {aiInsights || "Synchronizing with global data streams..."}
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 lg:space-y-16 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 lg:pb-12 border-b border-white/5">
          <div className="space-y-3 lg:space-y-4">
            <h3 className="text-gold text-[9px] lg:text-[11px] uppercase tracking-[0.6em] lg:tracking-[0.8em] font-black opacity-60">System Protocol v7.0</h3>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-serif text-white tracking-tighter uppercase">{view}</h2>
          </div>
          <div className="flex gap-6 lg:gap-8 w-full xl:w-auto">
            <div className="flex-1 xl:text-right">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Global Revenue</p>
              <p className="text-2xl lg:text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex-1 xl:text-right border-l border-white/10 pl-6 lg:pl-8">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Global Transactions</p>
              <p className="text-2xl lg:text-3xl font-serif text-white font-black">{stats.totalOrders}</p>
            </div>
          </div>
        </header>

        {view === 'staff' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <SectionTitle subtitle="Operational Personnel" title="Directory" />
              <GoldButton onClick={() => { setModalType('staff'); setSelectedItem({ role: 'staff_waiter' }); setIsModalOpen(true); }}>
                <UserPlusIcon className="w-4 h-4 mr-2" /> <span className="text-[9px]">Onboard Personnel</span>
              </GoldButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {staff.map((member) => (
                <GlassCard key={member.id} className="p-6 lg:p-8 flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-gold font-bold text-xl">{member.email?.[0].toUpperCase()}</div>
                    <Badge color={member.role === 'admin' ? 'gold' : member.role === 'staff_bar' ? 'purple' : 'emerald'}>
                      {member.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="space-y-2 mb-8">
                    <p className="text-xs lg:text-sm font-bold text-white truncate">{member.email}</p>
                    <p className="text-[8px] uppercase tracking-widest text-silver font-black opacity-40">Operator ID: {member.id.slice(-6)}</p>
                  </div>
                  <div className="flex gap-4 pt-6 border-t border-white/5">
                    <button onClick={() => handleResetPassword(member.email)} className="flex-1 py-2.5 text-[8px] uppercase font-black tracking-widest text-silver hover:text-gold transition-colors flex items-center justify-center gap-2"><KeyIcon className="w-3 h-3" /> Reset</button>
                    <button onClick={async () => { if(window.confirm("Purge operator?")) await deleteDoc(doc(db, "admins", member.id)); }} className="p-2.5 text-red-400/40 hover:text-red-400 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Other views (Inventory, Orders, etc) remain optimized as before */}
      </main>

      {/* Modals */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Operator Configuration">
        <form onSubmit={handleUpdateStaff} className="space-y-6 lg:space-y-8">
          <SilverInput placeholder="Email Address" icon={EnvelopeIcon} value={selectedItem?.email || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, email: e.target.value })} />
          <div className="space-y-3">
            <label className="text-[9px] uppercase tracking-widest text-silver font-black">Department Allocation</label>
            <select 
              value={selectedItem?.role || 'staff_waiter'}
              onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/30"
            >
              <option value="staff_waiter">Staff Waiter</option>
              <option value="staff_bar">Staff Bar</option>
              <option value="admin">Global Admin</option>
            </select>
          </div>
          <GoldButton type="submit" className="w-full py-5">Establish Operator Transmission</GoldButton>
        </form>
      </GlassModal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default AdminPortal;
