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
  QueueListIcon,
  AdjustmentsHorizontalIcon,
  ArchiveBoxIcon,
  CloudArrowUpIcon
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
import { db, getUserRole, UserRole, auth, seedDatabaseFromJSON } from "../lib/firebase";
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysOrders = orders.filter(o => o.status === 'paid' && o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status === 'pending-payment').length;
    const lowStock = inventory.filter(i => i.stock < 10).length;

    return { totalRevenue, activeOrders, lowStock, totalOrders: todaysOrders.length };
  }, [orders, inventory]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
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

  const handleRestoreArchive = async () => {
    if(window.confirm("CRITICAL: This will overwrite all Menu and Inventory definitions with JSON archive. Proceed?")) {
      await seedDatabaseFromJSON(menuDataArchive);
      showToast("System resources restored from archive");
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem.id) {
        await updateDoc(doc(db, "admins", selectedItem.id), selectedItem);
        showToast("Operator synchronized");
      } else {
        const staffRef = doc(collection(db, "admins"));
        await setDoc(staffRef, { ...selectedItem, id: staffRef.id, createdAt: serverTimestamp() });
        showToast("Personnel creation successful");
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
        showToast("Menu entry updated");
      } else {
        const menuRef = doc(collection(db, "menu"));
        await setDoc(menuRef, { ...selectedItem, id: menuRef.id, createdAt: serverTimestamp() });
        await setDoc(doc(db, "inventory", menuRef.id), { id: menuRef.id, name: selectedItem.name, category: selectedItem.category, stock: 0, soldCount: 0 });
        showToast("New transmission resource added");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast("Menu synchronization failed", "error");
    }
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, "inventory", selectedItem.id), { stock: selectedItem.stock });
      showToast("Stock level authorization confirmed");
      setIsModalOpen(false);
    } catch (err) {
      showToast("Sync failed", "error");
    }
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Queue' },
    { id: 'inventory', icon: ArchiveBoxIcon, label: 'Inventory' },
    { id: 'menu', icon: QueueListIcon, label: 'Menu Registry' },
    { id: 'staff', icon: UserGroupIcon, label: 'Personnel' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Finance' },
  ];

  if (role !== 'admin') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20 text-center">
        <GlassCard className="p-12 space-y-6 max-w-lg">
          <ExclamationTriangleIcon className="w-16 h-16 text-gold mx-auto animate-pulse" />
          <h2 className="text-3xl font-serif text-white uppercase tracking-widest">Administrative Restricted</h2>
          <p className="text-silver opacity-60">System access restricted to Master Protocol holders.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden">
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="px-2">
            <div className="flex justify-between items-center mb-10">
              <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black opacity-60">Command Terminal</p>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button key={item.id} onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 text-[10px] p-4 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black shadow-2xl shadow-gold/20' : 'text-silver hover:bg-white/5 hover:text-gold'}`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="pt-6 border-t border-white/5">
            <button onClick={handleRestoreArchive} className="w-full flex items-center gap-3 p-4 rounded-2xl bg-emerald/10 border border-emerald/20 text-emerald hover:bg-emerald hover:text-black transition-all group">
              <CloudArrowUpIcon className="w-5 h-5" />
              <span className="text-[9px] font-black uppercase tracking-widest">Restore Archive</span>
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 lg:space-y-16 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 border-b border-white/5">
          <div className="space-y-3">
            <h3 className="text-gold text-[9px] uppercase tracking-[0.6em] font-black opacity-60">Admin Protocol v8.2</h3>
            <h2 className="text-4xl xl:text-5xl font-serif text-white tracking-tighter uppercase">{view}</h2>
          </div>
          <div className="flex gap-6">
            <div className="xl:text-right">
              <p className="text-[8px] uppercase tracking-widest text-silver mb-1 opacity-60">Global Paid Revenue</p>
              <p className="text-2xl lg:text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="xl:text-right border-l border-white/10 pl-6">
              <p className="text-[8px] uppercase tracking-widest text-silver mb-1 opacity-60">Low Stock Resources</p>
              <p className="text-2xl lg:text-3xl font-serif text-white font-black">{stats.lowStock}</p>
            </div>
          </div>
        </header>

        {view === 'inventory' && (
          <LuxuryTable headers={['Resource Identification', 'Availability', 'Transmissions', 'Status', 'Sync']}>
            {inventory.map((item) => (
              <tr key={item.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                <td className="px-6 py-5"><p className="text-sm font-bold text-white leading-none">{item.name}</p><p className="text-[8px] text-silver uppercase tracking-[0.2em] mt-2">{item.category}</p></td>
                <td className="px-6 py-5 font-mono text-gold font-black">{item.stock} Units</td>
                <td className="px-6 py-5 text-silver text-xs">{item.soldCount || 0}</td>
                <td className="px-6 py-5"><Badge color={item.stock < 10 ? 'red' : 'emerald'}>{item.stock < 10 ? 'Critical' : 'Operational'}</Badge></td>
                <td className="px-6 py-5"><button onClick={() => { setSelectedItem(item); setModalType('item'); setIsModalOpen(true); }} className="p-2 text-silver/40 hover:text-gold transition-all"><AdjustmentsHorizontalIcon className="w-5 h-5" /></button></td>
              </tr>
            ))}
          </LuxuryTable>
        )}

        {view === 'menu' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center"><SectionTitle subtitle="Gastronomy Configuration" title="Master Registry" /><GoldButton onClick={() => { setModalType('menu'); setSelectedItem({ category: 'Bar', price: 0 }); setIsModalOpen(true); }}><PlusIcon className="w-4 h-4 mr-2" /> Add Resource</GoldButton></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {menuItems.map((item) => (
                <GlassCard key={item.id} className="p-8 space-y-6 border-white/5 hover:border-gold/30 transition-all group">
                  <div className="flex justify-between items-start"><Badge color="gold">{item.category}</Badge><p className="text-xl font-serif text-white font-black">₦{item.price.toLocaleString()}</p></div>
                  <div className="space-y-2"><h4 className="text-xl font-bold text-white group-hover:text-gold transition-colors">{item.name}</h4><p className="text-xs text-silver/60 line-clamp-3 leading-relaxed">{item.description}</p></div>
                  <div className="flex gap-4 pt-6 border-t border-white/5"><button onClick={() => { setSelectedItem(item); setModalType('menu'); setIsModalOpen(true); }} className="flex-1 py-3 text-[9px] uppercase font-black tracking-widest text-silver hover:text-gold border border-white/10 rounded-2xl transition-all">Configure</button><button onClick={async () => { if(window.confirm("Purge resource?")) await deleteDoc(doc(db, "menu", item.id)); }} className="p-3 text-red-400/20 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all"><TrashIcon className="w-5 h-5" /></button></div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {view === 'staff' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center"><SectionTitle subtitle="Personnel Directory" title="Access Points" /><GoldButton onClick={() => { setModalType('staff'); setSelectedItem({ role: 'staff_waiter' }); setIsModalOpen(true); }}><UserPlusIcon className="w-4 h-4 mr-2" /> Onboard Operator</GoldButton></div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {staff.map((member) => (
                <GlassCard key={member.id} className="p-8 space-y-6 border-white/5 group">
                  <div className="flex justify-between items-start"><div className="w-14 h-14 rounded-2xl bg-black border border-white/10 flex items-center justify-center text-gold font-bold text-2xl shadow-2xl">{member.email?.[0].toUpperCase()}</div><Badge color={member.role === 'admin' ? 'gold' : member.role === 'staff_bar' ? 'purple' : 'emerald'}>{member.role.replace('_', ' ').toUpperCase()}</Badge></div>
                  <div className="space-y-1"><p className="text-sm font-bold text-white truncate">{member.email}</p><p className="text-[8px] uppercase tracking-[0.3em] text-silver/40 font-black">Operator Key: {member.id.slice(-8)}</p></div>
                  <div className="flex gap-4 pt-6 border-t border-white/5"><button onClick={() => { setSelectedItem(member); setModalType('staff'); setIsModalOpen(true); }} className="flex-1 py-3 text-[9px] uppercase font-black tracking-widest text-silver hover:text-gold border border-white/10 rounded-2xl transition-all">Permissions</button><button onClick={async () => { if(window.confirm("Revoke access?")) await deleteDoc(doc(db, "admins", member.id)); }} className="p-3 text-red-400/20 hover:text-red-400 rounded-2xl transition-all"><TrashIcon className="w-5 h-5" /></button></div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}
      </main>

      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registry Configuration">
        <div className="max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
          {modalType === 'staff' && (
            <form onSubmit={handleUpdateStaff} className="space-y-6">
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Email Authorization</label><SilverInput icon={EnvelopeIcon} placeholder="Operator email" value={selectedItem?.email || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, email: e.target.value })} /></div>
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Department</label><select value={selectedItem?.role || 'staff_waiter'} onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/30"><option value="staff_waiter">Kitchen (Waiter)</option><option value="staff_bar">Bar Terminal</option><option value="admin">Global Protocol</option></select></div>
              <GoldButton type="submit" className="w-full py-5 text-[11px]">Authorize Operator</GoldButton>
            </form>
          )}
          {modalType === 'menu' && (
            <form onSubmit={handleUpdateMenu} className="space-y-6">
              <SilverInput placeholder="Designation" value={selectedItem?.name || ''} onChange={(e: any) => setSelectedItem({ ...selectedItem, name: e.target.value })} />
              <SilverInput type="number" placeholder="Credit Value" value={selectedItem?.price || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, price: Number(e.target.value) })} />
              <div className="space-y-2"><label className="text-[10px] uppercase font-black text-silver">Registry Category</label><select value={selectedItem?.category || 'Bar'} onChange={(e) => setSelectedItem({ ...selectedItem, category: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white"><option value="Bar">Bar</option><option value="Kitchen Menu">Kitchen</option><option value="Exotic Kitchen">Exotic Kitchen</option><option value="Mocktails">Mocktails</option><option value="Cocktails">Cocktails</option><option value="Whiskey">Whiskey</option><option value="Tequila">Tequila</option><option value="Wine">Wine</option><option value="Beer">Beer</option><option value="Soft Drinks">Soft Drinks</option><option value="Apartments">Apartments</option><option value="Leisure">Leisure</option></select></div>
              <textarea placeholder="Description" value={selectedItem?.description || ''} onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white h-32 focus:outline-none" />
              <GoldButton type="submit" className="w-full py-5 text-[11px]">Synchronize Menu</GoldButton>
            </form>
          )}
          {modalType === 'item' && (
            <form onSubmit={handleUpdateInventory} className="space-y-6">
              <div className="p-6 bg-black/40 rounded-[24px] border border-white/5 text-center space-y-2"><p className="text-[10px] uppercase font-black text-gold">Resource Sync</p><p className="text-xl font-serif text-white">{selectedItem?.name}</p></div>
              <SilverInput type="number" placeholder="Stock Level" value={selectedItem?.stock || 0} onChange={(e: any) => setSelectedItem({ ...selectedItem, stock: Number(e.target.value) })} />
              <GoldButton type="submit" className="w-full py-5 text-[11px]">Authorize Stock</GoldButton>
            </form>
          )}
        </div>
      </GlassModal>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default AdminPortal;
