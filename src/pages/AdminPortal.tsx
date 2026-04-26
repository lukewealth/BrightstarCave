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
  EnvelopeIcon,
  QueueListIcon
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

    const unsubMenu = onSnapshot(collection(db, "menu"), (snap) => {
      setMenuItems(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubOrders(); unsubInv(); unsubStaff(); unsubMenu(); };
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

  const handleUpdateMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem.id) {
        await updateDoc(doc(db, "menu", selectedItem.id), selectedItem);
        showToast("Menu item updated");
      } else {
        const menuRef = doc(collection(db, "menu"));
        await setDoc(menuRef, { ...selectedItem, id: menuRef.id, createdAt: serverTimestamp() });
        showToast("New item added to menu");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast("Menu update failed", "error");
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "inventory", selectedItem.id), { stock: selectedItem.stock });
      showToast("Stock levels synchronized");
      setIsModalOpen(false);
    } catch (err) {
      showToast("Sync failed", "error");
    }
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Queue' },
    { id: 'inventory', icon: Square2StackIcon, label: 'Stock' },
    { id: 'menu', icon: QueueListIcon, label: 'Menu Control' },
    { id: 'staff', icon: UserGroupIcon, label: 'Personnel' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Finance' },
  ];

  if (role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20">
        <GlassCard className="p-8 lg:p-20 text-center space-y-6 lg:space-y-8 max-w-lg">
          <ExclamationTriangleIcon className="w-12 h-12 lg:w-20 lg:h-20 text-gold mx-auto animate-pulse" />
          <h2 className="text-2xl lg:text-4xl font-serif text-white uppercase tracking-widest">Administrative Clearance Required</h2>
          <p className="text-silver text-xs lg:text-sm leading-relaxed opacity-60">This terminal is restricted to Super Admin protocols.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12 lg:space-y-16">
          <div className="px-2 lg:px-4">
            <div className="flex justify-between items-center mb-10">
              <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.4em] lg:tracking-[0.6em] text-gold font-black opacity-60">Operations Hub</p>
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
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 lg:space-y-16 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 lg:pb-12 border-b border-white/5">
          <div className="space-y-3 lg:space-y-4">
            <h3 className="text-gold text-[9px] lg:text-[11px] uppercase tracking-[0.6em] lg:tracking-[0.8em] font-black opacity-60">System Protocol v7.2</h3>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-serif text-white tracking-tighter uppercase">{view}</h2>
          </div>
          <div className="flex gap-6 lg:gap-8 w-full xl:w-auto">
            <div className="flex-1 xl:text-right">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Global Revenue</p>
              <p className="text-2xl lg:text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex-1 xl:text-right border-l border-white/10 pl-6 lg:pl-8">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Stock Alerts</p>
              <p className="text-2xl lg:text-3xl font-serif text-white font-black">{stats.lowStock}</p>
            </div>
          </div>
        </header>

        {view === 'inventory' && (
          <div className="space-y-10">
            <LuxuryTable headers={['Resource', 'Current Stock', 'Total Sold', 'Status', 'Action']}>
              {inventory.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-white">{item.name}</p>
                    <p className="text-[8px] text-silver uppercase tracking-widest">{item.category}</p>
                  </td>
                  <td className="px-6 py-5 font-mono text-gold font-bold">{item.stock} units</td>
                  <td className="px-6 py-5 text-silver">{item.soldCount || 0}</td>
                  <td className="px-6 py-5">
                    <Badge color={item.stock < 10 ? 'red' : 'emerald'}>{item.stock < 10 ? 'Critical' : 'Stable'}</Badge>
                  </td>
                  <td className="px-6 py-5">
                    <button onClick={() => { setSelectedItem(item); setModalType('item'); setIsModalOpen(true); }} className="p-2 text-silver/40 hover:text-gold transition-colors"><PencilSquareIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'menu' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <SectionTitle subtitle="Gastronomy Control" title="Menu Registry" />
              <GoldButton onClick={() => { setModalType('menu'); setSelectedItem({ category: 'Bar', price: 0 }); setIsModalOpen(true); }}>
                <PlusIcon className="w-4 h-4 mr-2" /> Add Item
              </GoldButton>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <GlassCard key={item.id} className="p-6 lg:p-8 space-y-4 border-white/5 hover:border-gold/30 transition-all">
                  <div className="flex justify-between items-start">
                    <Badge color="gold">{item.category}</Badge>
                    <p className="text-lg font-serif text-white">₦{item.price.toLocaleString()}</p>
                  </div>
                  <h4 className="text-xl font-bold text-white leading-tight">{item.name}</h4>
                  <p className="text-xs text-silver/60 line-clamp-2">{item.description}</p>
                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button onClick={() => { setSelectedItem(item); setModalType('menu'); setIsModalOpen(true); }} className="flex-1 py-2 text-[9px] uppercase font-black text-silver hover:text-gold transition-colors border border-white/10 rounded-xl">Configure</button>
                    <button onClick={async () => { if(window.confirm("Purge item?")) await deleteDoc(doc(db, "menu", item.id)); }} className="p-2 text-red-400/20 hover:text-red-400 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Staff view same as before */}
      </main>

      {/* Modals */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registry Configuration">
        {modalType === 'staff' && (
          <form onSubmit={handleUpdateStaff} className="space-y-6">
            <SilverInput placeholder="Email Address" value={selectedItem?.email || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, email: e.target.value })} />
            <select value={selectedItem?.role || 'staff_waiter'} onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white">
              <option value="staff_waiter">Staff Waiter</option>
              <option value="staff_bar">Staff Bar</option>
              <option value="admin">Global Admin</option>
            </select>
            <GoldButton type="submit" className="w-full py-5">Sync Operator</GoldButton>
          </form>
        )}

        {modalType === 'menu' && (
          <form onSubmit={handleUpdateMenu} className="space-y-6">
            <SilverInput placeholder="Item Name" value={selectedItem?.name || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, name: e.target.value })} />
            <SilverInput type="number" placeholder="Price" value={selectedItem?.price || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, price: Number(e.target.value) })} />
            <select value={selectedItem?.category || 'Bar'} onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white">
              <option value="Bar">Bar</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Signature">Signature</option>
            </select>
            <textarea placeholder="Description" value={selectedItem?.description || ''} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white h-24" />
            <GoldButton type="submit" className="w-full py-5">Update Menu</GoldButton>
          </form>
        )}

        {modalType === 'item' && (
          <form onSubmit={handleUpdateInventory} className="space-y-6">
            <p className="text-silver text-xs">Adjusting stock for: <span className="text-white font-bold">{selectedItem?.name}</span></p>
            <SilverInput type="number" placeholder="Stock Quantity" value={selectedItem?.stock || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, stock: Number(e.target.value) })} />
            <GoldButton type="submit" className="w-full py-5">Sync Inventory</GoldButton>
          </form>
        )}
      </GlassModal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default AdminPortal;
