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
  DocumentChartBarIcon,
  Bars3Icon
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
  deleteDoc,
  setDoc,
  where,
  addDoc
} from "firebase/firestore";
import { db, getUserRole, UserRole, seedInventory } from "../lib/firebase";
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
  const [view, setView] = useState<'dashboard' | 'inventory' | 'staff' | 'orders' | 'accounting'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'item' | 'staff' | 'order'>('item');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(o => o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
    const lowStock = inventory.filter(i => i.stock < 10).length;

    const revenueByCategory: Record<string, number> = {};
    todaysOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        const invItem = inventory.find(i => i.id === item.id);
        const category = invItem?.category || 'Uncategorized';
        const itemRevenue = Number(item.price || 0) * Number(item.quantity || 0);
        revenueByCategory[category] = (revenueByCategory[category] || 0) + itemRevenue;
      });
    });
    
    return { 
      totalRevenue: Number(totalRevenue), 
      activeOrders: Number(activeOrders), 
      lowStock: Number(lowStock), 
      totalOrders: todaysOrders.length, 
      revenueByCategory 
    };
  }, [orders, inventory]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
      seedInventory(initialMenu);
    }
  }, [user]);

  useEffect(() => {
    if (!role || role === 'guest') return;

    const qOrders = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100));
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    if (role === 'admin') {
      const unsubStaff = onSnapshot(collection(db, "admins"), (snap) => {
        setStaff(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      });
      return () => { unsubOrders(); unsubInv(); unsubStaff(); };
    }

    return () => { unsubOrders(); unsubInv(); };
  }, [role]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type, visible: true });
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedItem.id) {
        await updateDoc(doc(db, "inventory", selectedItem.id), selectedItem);
        showToast("Item updated successfully");
      } else {
        const newId = `item-${Date.now()}`;
        await setDoc(doc(db, "inventory", newId), { ...selectedItem, id: newId });
        showToast("Item added successfully");
      }
      setIsModalOpen(false);
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "admins"), selectedItem);
      showToast("Staff added successfully");
      setIsModalOpen(false);
    } catch (err) {
      showToast("Operation failed", "error");
    }
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Queue' },
    { id: 'inventory', icon: Square2StackIcon, label: 'Stock' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Finance' },
    { id: 'staff', icon: UserGroupIcon, label: 'Staff', adminOnly: true },
  ].filter(item => !item.adminOnly || role === 'admin');

  if (!role || role === 'guest') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20">
        <GlassCard className="p-8 lg:p-20 text-center space-y-6 lg:space-y-8 max-w-lg">
          <ExclamationTriangleIcon className="w-12 h-12 lg:w-20 lg:h-20 text-gold mx-auto animate-pulse" />
          <h2 className="text-2xl lg:text-4xl font-serif text-white uppercase tracking-widest">Access Restricted</h2>
          <p className="text-silver text-xs lg:text-sm leading-relaxed opacity-60">System protocols require administrative clearance for this terminal.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 flex items-center justify-between px-6 border-b border-white/[0.03] bg-black/40 backdrop-blur-xl shrink-0 z-[60]">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-5 h-5 text-gold" />
          <span className="text-[10px] font-black uppercase tracking-widest">Terminal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] text-gold font-bold uppercase tracking-widest">{role.replace('_', ' ')}</span>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-silver">
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Desktop Sidebar / Mobile Drawer */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/95 lg:bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12 lg:space-y-16">
          <div className="px-2 lg:px-4">
            <div className="flex justify-between items-center mb-10">
              <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.4em] lg:tracking-[0.6em] text-gold font-black opacity-60">Operations Hub</p>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40">
                <XMarkIcon className="w-5 h-5" />
              </button>
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

          <div className="p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
            <div className="flex items-center gap-3 mb-3 lg:mb-4 text-gold">
              <SparklesIcon className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" />
              <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Intelligence</span>
            </div>
            <p className="text-[10px] lg:text-[11px] text-silver leading-relaxed font-bold italic opacity-80">
              {stats.lowStock > 0 ? `Alert: ${stats.lowStock} items are low on stock. Restock recommended.` : "All systems operational. Efficiency at peak levels."}
            </p>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 border-t border-white/5 flex items-center gap-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold text-sm lg:text-base">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] lg:text-[10px] font-black text-white truncate">{user?.email}</p>
            <p className="text-[7px] lg:text-[8px] uppercase tracking-widest text-gold font-bold">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 lg:space-y-16 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 lg:pb-12 border-b border-white/5">
          <div className="space-y-3 lg:space-y-4">
            <h3 className="text-gold text-[9px] lg:text-[11px] uppercase tracking-[0.6em] lg:tracking-[0.8em] font-black opacity-60">System Protocol v6.2</h3>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-serif text-white tracking-tighter uppercase">
              {view === 'dashboard' ? 'Analytics' : view === 'inventory' ? 'Stock' : view === 'staff' ? 'Personnel' : view === 'accounting' ? 'Revenue' : 'Queue'}
            </h2>
          </div>
          
          <div className="flex gap-6 lg:gap-8 w-full xl:w-auto">
            <div className="flex-1 xl:text-right">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Daily Revenue</p>
              <p className="text-2xl lg:text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex-1 xl:text-right border-l border-white/10 pl-6 lg:pl-8">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Sales Count</p>
              <p className="text-2xl lg:text-3xl font-serif text-white font-black">{stats.totalOrders}</p>
            </div>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 lg:gap-10">
            <GlassCard className="xl:col-span-2 p-8 lg:p-12 relative group overflow-hidden">
              <div className="relative z-10 space-y-8 lg:space-y-10">
                <div className="flex items-center gap-3 lg:gap-4 text-gold">
                  <SparklesIcon className="w-6 h-6 lg:w-8 lg:h-8" />
                  <h4 className="text-lg lg:text-2xl font-serif uppercase tracking-widest">Performance Insights</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 lg:gap-10">
                  <div className="space-y-3 lg:space-y-4">
                    <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.4em] text-silver font-black">Avg Fulfillment</p>
                    <p className="text-4xl lg:text-5xl font-serif text-white font-black">14.5<span className="text-base lg:text-xl">min</span></p>
                    <Badge color="emerald">Optimal</Badge>
                  </div>
                  <div className="space-y-3 lg:space-y-4">
                    <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.4em] text-silver font-black">Peak Activity</p>
                    <p className="text-4xl lg:text-5xl font-serif text-gold font-black">20:00</p>
                    <p className="text-[8px] lg:text-[10px] text-silver italic opacity-60">Based on 7-day trend</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-8 lg:space-y-10">
              <GlassCard className="p-6 lg:p-8 border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-3 lg:gap-4 text-purple-400 mb-5 lg:mb-6">
                  <ExclamationTriangleIcon className="w-5 h-5 lg:w-6 lg:h-6 animate-pulse" />
                  <h4 className="text-[10px] lg:text-sm font-black uppercase tracking-widest">Critical Alerts</h4>
                </div>
                <div className="space-y-3 lg:space-y-4">
                  {stats.lowStock > 0 && (
                    <div className="p-3 lg:p-4 bg-black/40 rounded-xl lg:rounded-2xl border border-white/5 flex items-center justify-between">
                      <span className="text-[9px] lg:text-[10px] font-bold text-silver">Low Stock Items</span>
                      <Badge color="red">{stats.lowStock}</Badge>
                    </div>
                  )}
                  <div className="p-3 lg:p-4 bg-black/40 rounded-xl lg:rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[9px] lg:text-[10px] font-bold text-silver">Active Queue</span>
                    <Badge color="gold">{stats.activeOrders}</Badge>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {view === 'accounting' && (
          <div className="space-y-10 lg:space-y-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8">
              {Object.entries(stats.revenueByCategory).map(([category, revenue]) => (
                <GlassCard key={category} className="p-5 lg:p-8 space-y-3 lg:space-y-4 border-white/5 hover:border-gold/20 transition-all">
                  <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.2em] text-silver font-black truncate">{category}</p>
                  <p className="text-xl lg:text-2xl font-serif text-white font-black">₦{revenue.toLocaleString()}</p>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold" 
                      style={{ width: `${stats.totalRevenue > 0 ? ((revenue as number) / (stats.totalRevenue as number)) * 100 : 0}%` }}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="space-y-6 lg:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <h4 className="text-lg lg:text-xl font-serif uppercase tracking-widest text-gold">Financial Ledger</h4>
                  <p className="text-[8px] lg:text-[10px] text-silver font-black uppercase opacity-60">Synchronized Records</p>
                </div>
                <GoldButton className="py-2.5 px-5 text-[8px] lg:text-[9px] w-full sm:w-auto">Export Ledger</GoldButton>
              </div>

              <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 no-scrollbar">
                <div className="min-w-[800px]">
                  <LuxuryTable headers={['Time', 'Ref', 'Staff', 'Items', 'Amount']}>
                    {orders.map((order) => (
                      <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                        <td className="px-6 lg:px-8 py-5 text-[9px] lg:text-[10px] text-silver font-mono">
                          {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '...'}
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <p className="text-xs lg:text-sm font-bold text-white uppercase tracking-tighter">{order.id.slice(-8)}</p>
                          <p className="text-[8px] lg:text-[9px] text-gold tracking-widest font-black opacity-40">{order.table}</p>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <div className="flex items-center gap-2">
                            <div className="w-1 h-1 rounded-full bg-emerald" />
                            <p className="text-[9px] lg:text-[10px] text-white font-black uppercase tracking-widest truncate max-w-[80px]">{order.staffAttribution?.split('@')[0] || 'AUTO'}</p>
                          </div>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <p className="text-[9px] lg:text-[10px] text-silver">{order.items?.length || 0} units</p>
                        </td>
                        <td className="px-6 lg:px-8 py-5">
                          <p className="text-base lg:text-lg font-serif text-gold font-black">₦{order.total?.toLocaleString()}</p>
                          <Badge color={order.status === 'served' ? 'emerald' : 'gold'}>{order.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </LuxuryTable>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-8 lg:space-y-10">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0 w-full sm:w-auto no-scrollbar">
                <TabSystem 
                  tabs={[
                    { id: 'all', label: 'All' },
                    { id: 'bar', label: 'Bar' },
                    { id: 'kitchen', label: 'Kitchen' }
                  ]} 
                  activeTab="all" 
                  onChange={() => {}} 
                />
              </div>
              <GoldButton onClick={() => { setModalType('item'); setSelectedItem({}); setIsModalOpen(true); }} className="w-full sm:w-auto">
                <div className="flex items-center justify-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-[9px]">Add Resource</span>
                </div>
              </GoldButton>
            </div>

            <div className="overflow-x-auto -mx-6 px-6 lg:mx-0 lg:px-0 no-scrollbar">
              <div className="min-w-[700px]">
                <LuxuryTable headers={['Item', 'Cat', 'Price', 'Stock', 'Opt']}>
                  {inventory.map((item) => (
                    <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                      <td className="px-6 lg:px-8 py-5">
                        <p className="text-sm font-bold text-white leading-tight">{item.name}</p>
                        <p className="text-[8px] uppercase tracking-widest text-silver opacity-40">{item.type}</p>
                      </td>
                      <td className="px-6 lg:px-8 py-5">
                        <Badge color="silver">{item.category}</Badge>
                      </td>
                      <td className="px-6 lg:px-8 py-5 font-serif text-white">₦{item.price.toLocaleString()}</td>
                      <td className="px-6 lg:px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-16 lg:w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.stock < 10 ? 'bg-red-500' : 'bg-emerald'}`}
                              style={{ width: `${Math.min(item.stock, 100)}%` }}
                            />
                          </div>
                          <span className={`text-[9px] font-black ${item.stock < 10 ? 'text-red-400' : 'text-silver'}`}>{item.stock}</span>
                        </div>
                      </td>
                      <td className="px-6 lg:px-8 py-5">
                        <div className="flex gap-4">
                          <button onClick={() => { setSelectedItem(item); setModalType('item'); setIsModalOpen(true); }} className="text-silver/40 hover:text-gold transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                          <button className="text-silver/20 hover:text-red-400 transition-colors"><TrashIcon className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </LuxuryTable>
              </div>
            </div>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-6 lg:space-y-8">
            <AnimatePresence mode="popLayout">
              {orders.map((order) => (
                <motion.div 
                  layout
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 lg:p-8 rounded-[24px] lg:rounded-[32px] bg-secondary/20 border border-white/5 hover:border-gold/30 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 group"
                >
                  <div className="flex items-center gap-5 lg:gap-8">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-[20px] lg:rounded-[24px] bg-black border border-white/5 flex flex-col items-center justify-center shrink-0">
                      <p className="text-[7px] lg:text-[8px] uppercase tracking-widest text-gold font-black mb-0.5">ROOM</p>
                      <p className="text-2xl lg:text-3xl font-serif text-white font-black leading-none">{order.table?.split('-').pop()}</p>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1.5 lg:mb-2">
                        <h5 className="text-base lg:text-xl font-bold text-white leading-tight">{order.userName || "Guest"}</h5>
                        <Badge color={order.status === 'served' ? 'emerald' : order.status === 'cancelled' ? 'red' : 'gold'}>
                          {order.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.1em] lg:tracking-[0.2em] text-silver font-bold opacity-60">
                        {order.items?.length || 0} ITEMS • ₦{order.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <select 
                      value={order.status}
                      onChange={(e) => updateDoc(doc(db, "orders", order.id), { status: e.target.value, updatedAt: serverTimestamp() })}
                      className="flex-1 sm:flex-none bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 lg:py-3 text-[9px] lg:text-[10px] uppercase tracking-widest font-black text-silver focus:outline-none focus:border-gold/30"
                    >
                      <option value="new">New</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                    </select>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      className="p-2.5 lg:p-3 rounded-xl bg-white/5 border border-white/10 text-silver hover:text-gold shrink-0"
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Sidebar Overlay for Mobile */}
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

      {/* Modals */}
      <GlassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalType === 'item' ? 'Configuration' : 'Personnel'}
      >
        <div className="max-h-[60vh] overflow-y-auto no-scrollbar -mx-2 px-2">
          {modalType === 'item' ? (
            <form onSubmit={handleUpdateItem} className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <SilverInput 
                  placeholder="Item Name" 
                  value={selectedItem?.name || ''} 
                  onChange={(e: any) => setSelectedItem({ ...selectedItem, name: e.target.value })} 
                />
                <SilverInput 
                  placeholder="Price" 
                  type="number"
                  value={selectedItem?.price || ''} 
                  onChange={(e: any) => setSelectedItem({ ...selectedItem, price: Number(e.target.value) })} 
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                <select 
                  value={selectedItem?.type || 'bar'}
                  onChange={(e) => setSelectedItem({ ...selectedItem, type: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-gold/30"
                >
                  <option value="bar">Bar</option>
                  <option value="kitchen">Kitchen</option>
                  <option value="hotel">Hotel</option>
                </select>
                <SilverInput 
                  placeholder="Stock" 
                  type="number"
                  value={selectedItem?.stock || ''} 
                  onChange={(e: any) => setSelectedItem({ ...selectedItem, stock: Number(e.target.value) })} 
                />
              </div>
              <textarea 
                placeholder="Description" 
                value={selectedItem?.description || ''} 
                onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white h-24 focus:outline-none focus:border-gold/30"
              />
              <GoldButton type="submit" className="w-full py-4 lg:py-5 text-[10px] lg:text-sm">Synchronize Protocol</GoldButton>
            </form>
          ) : (
            <form onSubmit={handleAddStaff} className="space-y-6 lg:space-y-8">
              <SilverInput 
                placeholder="Employee Email" 
                value={selectedItem?.email || ''} 
                onChange={(e: any) => setSelectedItem({ ...selectedItem, email: e.target.value })} 
              />
              <select 
                value={selectedItem?.role || 'staff_waiter'}
                onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3.5 text-sm text-white focus:outline-none focus:border-gold/30"
              >
                <option value="staff_waiter">Staff Waiter</option>
                <option value="staff_kitchen">Staff Kitchen</option>
                <option value="staff_bar">Staff Bar</option>
                <option value="admin">Admin</option>
              </select>
              <GoldButton type="submit" className="w-full py-4 lg:py-5 text-[10px] lg:text-sm">Onboard Employee</GoldButton>
            </form>
          )}
        </div>
      </GlassModal>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.visible} 
        onClose={() => setToast({ ...toast, visible: false })} 
      />
    </div>
  );
};

export default AdminPortal;
