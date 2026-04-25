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
  DocumentChartBarIcon
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
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Stats calculation
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(o => o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
    const lowStock = inventory.filter(i => i.stock < 10).length;

    // Revenue by category
    const revenueByCategory: Record<string, number> = {};
    todaysOrders.forEach(order => {
      order.items?.forEach((item: any) => {
        // Find item in inventory to get category if not in order item
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

  if (!role || role === 'guest') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-20">
        <GlassCard className="p-20 text-center space-y-8 max-w-lg">
          <ExclamationTriangleIcon className="w-20 h-20 text-gold mx-auto animate-pulse" />
          <h2 className="text-4xl font-serif text-white">Access Restricted</h2>
          <p className="text-silver text-sm leading-relaxed">System protocols require administrative clearance for this terminal.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-primary font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-80 border-r border-white/[0.03] bg-black/40 p-10 flex flex-col justify-between backdrop-blur-3xl z-50">
        <div className="space-y-16">
          <div className="px-4">
            <p className="text-[10px] uppercase tracking-[0.6em] text-gold mb-10 font-black opacity-60">Operations Hub</p>
            <nav className="space-y-3">
              {[
                { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
                { id: 'orders', icon: ArrowPathIcon, label: 'Live Orders' },
                { id: 'inventory', icon: Square2StackIcon, label: 'Inventory' },
                { id: 'accounting', icon: BanknotesIcon, label: 'Accounting' },
                { id: 'staff', icon: UserGroupIcon, label: 'Staff Management', adminOnly: true },
              ].filter(item => !item.adminOnly || role === 'admin').map((item) => (
                <button 
                  key={item.id}
                  onClick={() => setView(item.id as any)}
                  className={`w-full flex items-center gap-5 text-[11px] p-5 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black shadow-2xl shadow-gold/20' : 'text-silver hover:bg-white/5 hover:text-gold'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8 rounded-[32px] bg-gradient-to-br from-gold/10 to-transparent border border-gold/20">
            <div className="flex items-center gap-3 mb-4 text-gold">
              <SparklesIcon className="w-5 h-5 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Intelligence</span>
            </div>
            <p className="text-[11px] text-silver leading-relaxed font-bold italic">
              {stats.lowStock > 0 ? `Alert: ${stats.lowStock} items are low on stock. Restock recommended.` : "All systems operational. Efficiency at peak levels."}
            </p>
          </div>
        </div>
        
        <div className="p-6 border-t border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-white truncate">{user?.email}</p>
            <p className="text-[8px] uppercase tracking-widest text-gold font-bold">{role.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 lg:p-20 space-y-16 no-scrollbar">
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 pb-12 border-b border-white/5">
          <div className="space-y-4">
            <h3 className="text-gold text-[11px] uppercase tracking-[0.8em] font-black opacity-60">System Protocol v6.2</h3>
            <SectionTitle 
              subtitle="Management Terminal" 
              title={view === 'dashboard' ? 'Daily Analytics' : view === 'inventory' ? 'Stock Control' : view === 'staff' ? 'Personnel' : view === 'accounting' ? 'Revenue Records' : 'Active Queue'} 
            />
          </div>
          
          <div className="flex gap-8">
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-widest text-silver mb-1">Today's Revenue</p>
              <p className="text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="text-right border-l border-white/10 pl-8">
              <p className="text-[9px] uppercase tracking-widest text-silver mb-1">Total Sales</p>
              <p className="text-3xl font-serif text-white font-black">{stats.totalOrders}</p>
            </div>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <GlassCard className="lg:col-span-2 p-12 relative group">
              <div className="relative z-10 space-y-10">
                <div className="flex items-center gap-4 text-gold">
                  <SparklesIcon className="w-8 h-8" />
                  <h4 className="text-2xl font-serif uppercase tracking-widest">Performance Insights</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-silver font-black">Average Fulfillment</p>
                    <p className="text-5xl font-serif text-white font-black">14.5<span className="text-xl">min</span></p>
                    <Badge color="emerald">Optimal</Badge>
                  </div>
                  <div className="space-y-4">
                    <p className="text-[10px] uppercase tracking-[0.4em] text-silver font-black">Peak Hour</p>
                    <p className="text-5xl font-serif text-gold font-black">20:00</p>
                    <p className="text-[10px] text-silver italic">Based on 7-day trend</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="space-y-10">
              <GlassCard className="p-8 border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center gap-4 text-purple-400 mb-6">
                  <ExclamationTriangleIcon className="w-6 h-6 animate-pulse" />
                  <h4 className="text-sm font-black uppercase tracking-widest">Critical Alerts</h4>
                </div>
                <div className="space-y-4">
                  {stats.lowStock > 0 && (
                    <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-silver">Low Stock Items</span>
                      <Badge color="red">{stats.lowStock}</Badge>
                    </div>
                  )}
                  <div className="p-4 bg-black/40 rounded-2xl border border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-silver">Active Queue</span>
                    <Badge color="gold">{stats.activeOrders}</Badge>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {view === 'accounting' && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
              {Object.entries(stats.revenueByCategory).map(([category, revenue]) => (
                <GlassCard key={category} className="p-8 space-y-4 border-white/5 hover:border-gold/20 transition-all">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-silver font-black">{category}</p>
                  <p className="text-2xl font-serif text-white font-black">₦{revenue.toLocaleString()}</p>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gold" 
                      style={{ width: `${stats.totalRevenue > 0 ? ((revenue as number) / (stats.totalRevenue as number)) * 100 : 0}%` }}
                    />
                  </div>
                </GlassCard>
              ))}
            </div>

            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <h4 className="text-xl font-serif uppercase tracking-widest text-gold">Financial Ledger</h4>
                  <p className="text-[10px] text-silver font-black uppercase opacity-60">System Synchronized Records</p>
                </div>
                <div className="flex gap-4">
                  <GoldButton className="py-3 px-6 text-[9px]">Export Ledger</GoldButton>
                </div>
              </div>

              <LuxuryTable headers={['Timestamp', 'Reference', 'Staff Attribution', 'Itemization', 'Settlement']}>
                {orders.map((order) => (
                  <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6 text-[10px] text-silver font-mono">
                      {order.createdAt?.toDate().toLocaleString() || 'Pending...'}
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-white uppercase tracking-tighter">{order.id.slice(-8)}</p>
                      <p className="text-[9px] text-gold tracking-widest font-black opacity-60">{order.table}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <p className="text-[10px] text-white font-black uppercase tracking-widest">{order.staffAttribution?.split('@')[0] || 'GUEST-AUTO'}</p>
                      </div>
                      <p className="text-[8px] text-silver italic">{order.staffEmail || 'Internal Transmission'}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="max-w-[200px] space-y-1">
                        {order.items?.map((item: any, idx: number) => (
                          <p key={idx} className="text-[10px] text-silver truncate">
                            <span className="text-white font-bold">{item.quantity}x</span> {item.name}
                          </p>
                        ))}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-lg font-serif text-gold font-black">₦{order.total?.toLocaleString()}</p>
                      <Badge color={order.status === 'served' ? 'emerald' : 'gold'}>{order.status}</Badge>
                    </td>
                  </tr>
                ))}
              </LuxuryTable>
            </div>
          </div>
        )}

        {view === 'inventory' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <TabSystem 
                tabs={[
                  { id: 'all', label: 'All Items' },
                  { id: 'bar', label: 'Bar' },
                  { id: 'kitchen', label: 'Kitchen' },
                  { id: 'hotel', label: 'Hotel' }
                ]} 
                activeTab="all" 
                onChange={() => {}} 
              />
              <GoldButton onClick={() => { setModalType('item'); setSelectedItem({}); setIsModalOpen(true); }}>
                <div className="flex items-center gap-2">
                  <PlusIcon className="w-4 h-4" />
                  <span>Add Resource</span>
                </div>
              </GoldButton>
            </div>

            <LuxuryTable headers={['Item Name', 'Category', 'Price', 'Stock', 'Actions']}>
              {inventory.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="text-sm font-bold text-white">{item.name}</p>
                      <p className="text-[9px] uppercase tracking-widest text-silver">{item.type}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge color="silver">{item.category}</Badge>
                  </td>
                  <td className="px-8 py-6 font-serif text-white">₦{item.price.toLocaleString()}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${item.stock < 10 ? 'bg-red-500' : item.stock < 20 ? 'bg-gold' : 'bg-emerald'}`}
                          style={{ width: `${Math.min(item.stock, 100)}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-black ${item.stock < 10 ? 'text-red-400' : 'text-silver'}`}>{item.stock}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedItem(item); setModalType('item'); setIsModalOpen(true); }} className="text-silver hover:text-gold transition-colors"><PencilSquareIcon className="w-5 h-5" /></button>
                      <button className="text-silver hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'staff' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <h4 className="text-xl font-serif uppercase tracking-widest text-gold">Personnel Registry</h4>
              <GoldButton onClick={() => { setModalType('staff'); setSelectedItem({}); setIsModalOpen(true); }}>
                <div className="flex items-center gap-2">
                  <UserGroupIcon className="w-4 h-4" />
                  <span>Onboard Staff</span>
                </div>
              </GoldButton>
            </div>

            <LuxuryTable headers={['Employee', 'Role', 'Status', 'Actions']}>
              {staff.map((member) => (
                <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-silver">
                        {member.email[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-white">{member.email}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <Badge color={member.role === 'admin' ? 'gold' : 'purple'}>{member.role.replace('_', ' ')}</Badge>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                      <span className="text-[10px] font-black text-silver uppercase tracking-widest">Active</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-silver">
                    <button className="hover:text-red-400 transition-colors"><TrashIcon className="w-5 h-5" /></button>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'orders' && (
          <div className="space-y-8">
            <AnimatePresence mode="popLayout">
              {orders.map((order, i) => (
                <motion.div 
                  layout
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 rounded-[32px] bg-secondary/20 border border-white/5 hover:border-gold/30 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-8 group"
                >
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 rounded-[24px] bg-black border border-white/5 flex flex-col items-center justify-center">
                      <p className="text-[8px] uppercase tracking-widest text-gold font-black mb-1">Room</p>
                      <p className="text-3xl font-serif text-white font-black">{order.table?.split('-').pop()}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="text-xl font-bold text-white">{order.userName || "Guest"}</h5>
                        <Badge color={order.status === 'served' ? 'emerald' : order.status === 'cancelled' ? 'red' : 'gold'}>
                          {order.status.replace('-', ' ')}
                        </Badge>
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-silver font-bold">
                        {order.items?.length || 0} ITEMS • TOTAL: ₦{order.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <select 
                      value={order.status}
                      onChange={(e) => updateDoc(doc(db, "orders", order.id), { status: e.target.value, updatedAt: serverTimestamp() })}
                      className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-[10px] uppercase tracking-widest font-black text-silver focus:outline-none focus:border-gold/30"
                    >
                      <option value="new">New</option>
                      <option value="preparing">Preparing</option>
                      <option value="ready">Ready</option>
                      <option value="served">Served</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                    <motion.button 
                      whileHover={{ scale: 1.05 }}
                      className="p-3 rounded-xl bg-white/5 border border-white/10 text-silver hover:text-gold"
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

      {/* Modals */}
      <GlassModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={modalType === 'item' ? 'Resource Configuration' : 'Personnel Onboarding'}
      >
        {modalType === 'item' ? (
          <form onSubmit={handleUpdateItem} className="space-y-8">
            <div className="grid grid-cols-2 gap-6">
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
            <div className="grid grid-cols-2 gap-6">
              <select 
                value={selectedItem?.type || 'bar'}
                onChange={(e) => setSelectedItem({ ...selectedItem, type: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/30"
              >
                <option value="bar">Bar</option>
                <option value="kitchen">Kitchen</option>
                <option value="hotel">Hotel</option>
              </select>
              <SilverInput 
                placeholder="Initial Stock" 
                type="number"
                value={selectedItem?.stock || ''} 
                onChange={(e: any) => setSelectedItem({ ...selectedItem, stock: Number(e.target.value) })} 
              />
            </div>
            <textarea 
              placeholder="Description" 
              value={selectedItem?.description || ''} 
              onChange={(e) => setSelectedItem({ ...selectedItem, description: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 text-sm text-white h-32 focus:outline-none focus:border-gold/30"
            />
            <GoldButton type="submit" className="w-full py-5 text-sm">Synchronize Protocol</GoldButton>
          </form>
        ) : (
          <form onSubmit={handleAddStaff} className="space-y-8">
            <SilverInput 
              placeholder="Employee Email" 
              value={selectedItem?.email || ''} 
              onChange={(e: any) => setSelectedItem({ ...selectedItem, email: e.target.value })} 
            />
            <select 
              value={selectedItem?.role || 'staff_waiter'}
              onChange={(e) => setSelectedItem({ ...selectedItem, role: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-gold/30"
            >
              <option value="staff_waiter">Staff Waiter</option>
              <option value="staff_kitchen">Staff Kitchen</option>
              <option value="staff_bar">Staff Bar</option>
              <option value="admin">Admin</option>
            </select>
            <GoldButton type="submit" className="w-full py-5 text-sm">Onboard Employee</GoldButton>
          </form>
        )}
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
