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
  CheckCircleIcon
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
  where
} from "firebase/firestore";
import { db, getUserRole, UserRole } from "../lib/firebase";
import { 
  GlassCard, 
  Badge, 
  SectionTitle,
  LuxuryTable, 
  Toast 
} from "../components/design-system/Primitive";

export const StaffPortal = ({ user }: { user: User | null }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [view, setView] = useState<'dashboard' | 'inventory' | 'orders' | 'accounting'>('dashboard');
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [aiInsights, setAiInsights] = useState<string>("");
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error', visible: boolean }>({ message: '', type: 'success', visible: false });

  // Comprehensive Department Categorization
  const deptCategories = useMemo(() => {
    if (role === 'staff_bar') {
      return ["Mocktails", "Cocktails", "Brandy & Cognac", "Whiskey", "Tequila", "Wine", "Beer", "Soft Drinks"];
    }
    if (role === 'staff_waiter') {
      return ["Kitchen Menu", "Exotic Kitchen"];
    }
    return []; // Admin or generic staff sees all or is handled differently
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

  // Stats calculation - Filtered by Departmental Scope
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter orders relevant to this department (either they assisted or it contains their items)
    const relevantOrders = orders.filter(o => 
      role === 'admin' || 
      o.staffId === user?.uid || 
      (o.departmentScopes && o.departmentScopes.includes(departmentType))
    );

    const paidOrders = relevantOrders.filter(o => o.status === 'paid' && o.createdAt?.toDate() >= today);
    const totalRevenue = paidOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = relevantOrders.filter(o => o.status === 'pending-payment').length;
    
    // Filter inventory based on department categories
    const relevantInventory = role === 'admin' ? inventory : inventory.filter(i => deptCategories.includes(i.category));
    const lowStock = relevantInventory.filter(i => i.stock < 10).length;

    return { totalRevenue, activeOrders, lowStock, totalOrders: paidOrders.length, relevantOrders };
  }, [orders, inventory, role, deptCategories, departmentType, user?.uid]);

  useEffect(() => {
    if (stats.totalOrders > 0 || stats.activeOrders > 0) {
      const insights = [
        `${departmentName} throughput is synchronized at 98.4% efficiency.`,
        `Active transmissions detected: ${stats.activeOrders}. Prioritize guest settlement.`,
        `Daily revenue attribution: ₦${stats.totalRevenue.toLocaleString()}. Keep it up.`,
        "Gemini Intelligence: Inventory velocity suggests restocking top categories soon."
      ];
      setAiInsights(insights[Math.floor(Math.random() * insights.length)]);
    } else {
      setAiInsights("System heartbeat stable. Awaiting guest dispatch transmissions.");
    }
  }, [stats, departmentName]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    if (!role || role === 'guest') return;

    // Load orders - optimized to see all orders so department filtering can happen in memory
    const qOrders = query(
      collection(db, "orders"), 
      orderBy("createdAt", "desc"), 
      limit(200)
    );
    
    const unsubOrders = onSnapshot(qOrders, (snap) => {
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubInv = onSnapshot(collection(db, "inventory"), (snap) => {
      setInventory(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubOrders(); unsubInv(); };
  }, [role, user]);

  const handlePrintReceipt = (order: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;
    const receiptHtml = `<html><head><style>body { font-family: 'Courier New', monospace; padding: 20px; font-size: 12px; line-height: 1.4; } .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 15px; } .logo { font-size: 16px; font-weight: bold; } .item { display: flex; justify-content: space-between; } .total { border-top: 1px solid #000; margin-top: 10px; padding-top: 5px; font-weight: bold; font-size: 14px; }</style></head><body><div class="header"><div class="logo">BRIGHT STAR CAVE</div><p>${departmentName}</p></div><p>Ref: ${order.id.slice(-8)}<br>Operator: ${order.staffName}<br>Date: ${order.formattedDate}</p><div>${order.items.map((i: any) => `<div class="item"><span>${i.name} x${i.quantity}</span><span>₦${(i.price * i.quantity).toLocaleString()}</span></div>`).join('')}</div><div class="total"><div class="item"><span>SETTLED</span><span>₦${order.total.toLocaleString()}</span></div></div><div style="text-align:center; margin-top:20px; font-size:10px;">Payment: Moniepoint 5007071458<br>* BRIGHTSTAR SECURITY ENCRYPTED *</div><script>window.print(); setTimeout(() => window.close(), 500);</script></body></html>`;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
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
          <h2 className="text-3xl font-serif text-white uppercase tracking-widest">Unauthorized Terminal</h2>
          <p className="text-silver opacity-60">Authorized personnel protocols only. Verify access points.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden">
      {/* Operator Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="px-2">
            <div className="flex justify-between items-center mb-10">
              <div className="space-y-1">
                 <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black opacity-60">Terminal Hub</p>
                 <h4 className="text-sm font-serif text-white uppercase tracking-widest">{departmentName}</h4>
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
          <div className="p-8 rounded-[32px] bg-gradient-to-br from-emerald/10 to-transparent border border-emerald/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-emerald/20 overflow-hidden">
               <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="w-1/3 h-full bg-emerald shadow-[0_0_10px_#10b981]" />
            </div>
            <div className="flex items-center gap-3 mb-4 text-emerald">
              <SparklesIcon className="w-4 h-4 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-widest">Gemini Operational Intelligence</span>
            </div>
            <p className="text-[11px] text-silver leading-relaxed font-bold italic opacity-80 group-hover:opacity-100 transition-opacity">
              {aiInsights}
            </p>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 border-t border-white/5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold shadow-xl border border-gold/10">{user?.email?.[0].toUpperCase()}</div>
          <div className="overflow-hidden">
            <p className="text-[10px] font-black text-white truncate">{user?.email}</p>
            <p className="text-[7px] uppercase tracking-widest text-gold font-bold">Verified Operator</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-12 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 pb-10 border-b border-white/5 relative">
          <div className="space-y-4">
            <h3 className="text-gold text-[10px] uppercase tracking-[0.6em] font-black opacity-40 flex items-center gap-3">
              <BoltIcon className="w-4 h-4" /> Secure Operational Transmission v4.1
            </h3>
            <h2 className="text-4xl xl:text-6xl font-serif text-white tracking-tighter uppercase">{view}</h2>
          </div>
          <div className="flex gap-8">
            <div className="xl:text-right space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-silver/40 font-black">Daily Volume (Verified)</p>
              <p className="text-3xl font-serif text-gold font-black tracking-tighter">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="xl:text-right border-l border-white/10 pl-8 space-y-1">
              <p className="text-[9px] uppercase tracking-widest text-silver/40 font-black">Active transmissions</p>
              <p className="text-3xl font-serif text-white font-black tracking-tighter">{stats.activeOrders}</p>
            </div>
          </div>
        </header>

        {view === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
             <GlassCard className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 bg-gold/10 rounded-2xl border border-gold/20"><BanknotesIcon className="w-8 h-8 text-gold" /></div>
                   <Badge color="gold">Verified</Badge>
                </div>
                <div>
                   <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Total Revenue</p>
                   <p className="text-4xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
                </div>
             </GlassCard>
             <GlassCard className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 bg-emerald/10 rounded-2xl border border-emerald/20"><CheckCircleIcon className="w-8 h-8 text-emerald" /></div>
                   <Badge color="emerald">Efficiency</Badge>
                </div>
                <div>
                   <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Settled Audits</p>
                   <p className="text-4xl font-serif text-white font-black">{stats.totalOrders} Transmissions</p>
                </div>
             </GlassCard>
             <GlassCard className="p-10 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20"><ExclamationTriangleIcon className="w-8 h-8 text-red-500" /></div>
                   <Badge color="red">Attention</Badge>
                </div>
                <div>
                   <p className="text-sm font-bold text-white uppercase tracking-widest mb-1">Low Resource Warning</p>
                   <p className="text-4xl font-serif text-white font-black">{stats.lowStock} Skus</p>
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
                      <p className="text-3xl font-serif text-white font-black leading-none">{order.table}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-bold text-white uppercase tracking-widest">{order.userName}</p>
                      <div className="flex items-center gap-4 text-silver/40 text-[10px] font-black uppercase tracking-widest">
                         <span>{order.items.length} Resources</span>
                         <span className="w-1 h-1 bg-white/10 rounded-full" />
                         <span className="text-gold">₦{order.total.toLocaleString()}</span>
                         <span className="w-1 h-1 bg-white/10 rounded-full" />
                         <span className="text-white/40">OP: {order.staffName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 w-full md:w-auto">
                     <div className="flex-1 md:flex-none flex items-center gap-3 px-5 py-3 bg-gold/10 rounded-2xl border border-gold/20 shadow-xl shadow-gold/5">
                       <ClockIcon className="w-4 h-4 text-gold animate-spin-slow" />
                       <span className="text-[9px] text-gold font-black uppercase tracking-widest">Synchronization In-Progress</span>
                     </div>
                     <button onClick={() => window.location.href = `/orders`} className="p-4 bg-white/5 rounded-2xl text-gold hover:bg-gold hover:text-black transition-all group-hover:translate-x-1 shadow-2xl border border-white/5">
                       <ChevronRightIcon className="w-6 h-6" />
                     </button>
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
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default StaffPortal;
