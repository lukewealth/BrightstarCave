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
  PrinterIcon
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
  GoldButton, 
  Badge, 
  GlassModal, 
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

  // Department determination based on role
  const department = useMemo(() => {
    if (role === 'staff_bar') return 'Bar';
    if (role === 'staff_waiter') return 'Kitchen';
    return 'All';
  }, [role]);

  // Stats calculation - Personalized and Departmental
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(o => o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
    
    // Filter inventory based on department
    const relevantInventory = department === 'All' ? inventory : inventory.filter(i => i.category === department);
    const lowStock = relevantInventory.filter(i => i.stock < 10).length;

    return { totalRevenue, activeOrders, lowStock, totalOrders: todaysOrders.length };
  }, [orders, inventory, department]);

  useEffect(() => {
    if (stats.totalOrders > 0) {
      const insights = [
        `Your ${department} service pace is optimal.`,
        `High demand for ${department} items detected.`,
        "Revenue transmission velocity: 1.4x",
        `Gemini suggests: Prepare for the ${department} rush.`
      ];
      setAiInsights(insights[Math.floor(Math.random() * insights.length)]);
    } else {
      setAiInsights("Ready for synchronization. Establish transmissions.");
    }
  }, [stats, department]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    if (!role || role === 'guest') return;

    // Load personal orders
    const qOrders = query(
      collection(db, "orders"), 
      where("staffId", "==", user?.uid),
      orderBy("createdAt", "desc"), 
      limit(100)
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

    const receiptHtml = `
      <html>
        <head>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; width: 70mm; margin: 0 auto; padding: 10px; font-size: 12px; line-height: 1.2; }
            .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .logo { font-size: 16px; font-weight: bold; }
            .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; font-weight: bold; display: flex; justify-content: space-between; font-size: 14px; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BRIGHT STAR CAVE</div>
            <div>Dept: ${department}</div>
          </div>
          <div class="staff">
            Ref: ${order.id.slice(-8)}<br>
            Date: ${order.formattedDate}<br>
            Staff: ${order.staffName}
          </div>
          <div class="items">
            ${order.items.map((i: any) => `
              <div class="item">
                <span>${i.name} x${i.quantity}</span>
                <span>₦${(i.price * i.quantity).toLocaleString()}</span>
              </div>
            `).join('')}
          </div>
          <div class="total">
            <span>TOTAL</span>
            <span>₦${order.total.toLocaleString()}</span>
          </div>
          <div class="footer">
            Bank: Moniepoint 5007071458<br>
            * Brightstar Encryption v4.0 *
          </div>
          <script>window.print(); setTimeout(() => window.close(), 500);</script>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const navItems = [
    { id: 'dashboard', icon: ChartBarIcon, label: 'Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'Queue' },
    { id: 'inventory', icon: Square2StackIcon, label: 'Resources' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Sales' },
  ];

  const filteredInventory = useMemo(() => {
    if (department === 'All') return inventory;
    return inventory.filter(i => i.category === department);
  }, [inventory, department]);

  if (!role || role === 'guest') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20 text-center">
        <GlassCard className="p-12 space-y-6 max-w-lg">
          <ExclamationTriangleIcon className="w-16 h-16 text-gold mx-auto animate-pulse" />
          <h2 className="text-3xl font-serif text-white uppercase">Access Restricted</h2>
          <p className="text-silver opacity-60">Authorized personnel only.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-full bg-primary font-sans text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:relative inset-y-0 left-0 w-72 lg:w-80 border-r border-white/[0.03] bg-black/40 p-8 lg:p-10 flex flex-col justify-between backdrop-blur-3xl z-[100] transition-transform duration-500 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="space-y-12">
          <div className="px-2">
            <div className="flex justify-between items-center mb-10">
              <p className="text-[9px] uppercase tracking-[0.4em] text-gold font-black opacity-60">{department} HUB</p>
              <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden p-1 text-silver/40"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button 
                  key={item.id}
                  onClick={() => { setView(item.id as any); setIsSidebarOpen(false); }}
                  className={`w-full flex items-center gap-4 text-[10px] p-4 rounded-2xl transition-all uppercase tracking-[0.2em] font-black ${view === item.id ? 'bg-gold text-black' : 'text-silver hover:bg-white/5'}`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </div>
          <div className="p-6 rounded-[24px] bg-gradient-to-br from-emerald/10 to-transparent border border-emerald/20">
            <p className="text-[10px] text-silver leading-relaxed font-bold italic opacity-80">{aiInsights}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 border-b border-white/5">
          <div className="space-y-3">
            <h3 className="text-gold text-[9px] uppercase tracking-[0.6em] font-black opacity-60">{department} TERMINAL</h3>
            <h2 className="text-4xl font-serif text-white tracking-tighter uppercase">{view}</h2>
          </div>
          <div className="flex gap-6">
            <div className="xl:text-right">
              <p className="text-[8px] uppercase tracking-widest text-silver mb-1 opacity-60">Personal Sales</p>
              <p className="text-2xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="xl:text-right border-l border-white/10 pl-6">
              <p className="text-[8px] uppercase tracking-widest text-silver mb-1 opacity-60">Stock Alerts</p>
              <p className="text-2xl font-serif text-white font-black">{stats.lowStock}</p>
            </div>
          </div>
        </header>

        {view === 'inventory' && (
          <div className="space-y-10">
            <LuxuryTable headers={['Resource', 'Available', 'Status']}>
              {filteredInventory.map((item) => (
                <tr key={item.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                  <td className="px-6 py-5">
                    <p className="text-sm font-bold text-white">{item.name}</p>
                  </td>
                  <td className="px-6 py-5 font-mono text-gold">{item.stock} units</td>
                  <td className="px-6 py-5">
                    <Badge color={item.stock < 10 ? 'red' : 'emerald'}>{item.stock < 10 ? 'Low' : 'OK'}</Badge>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {view === 'accounting' && (
          <LuxuryTable headers={['Time', 'Ref', 'Amount', 'Action']}>
            {orders.map((order) => (
              <tr key={order.id} className="group hover:bg-white/[0.02] border-b border-white/[0.02]">
                <td className="px-6 py-5 text-[9px] text-silver">{order.formattedTime}</td>
                <td className="px-6 py-5 text-xs text-white">{order.id.slice(-8)}</td>
                <td className="px-6 py-5 font-serif text-gold">₦{order.total?.toLocaleString()}</td>
                <td className="px-6 py-5">
                  <button onClick={() => handlePrintReceipt(order)} className="p-2 text-emerald hover:text-white transition-colors"><PrinterIcon className="w-5 h-5" /></button>
                </td>
              </tr>
            ))}
          </LuxuryTable>
        )}
      </main>
      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default StaffPortal;
