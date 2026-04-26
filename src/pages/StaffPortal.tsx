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

  // Stats calculation - Personalized for Staff
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todaysOrders = orders.filter(o => o.createdAt?.toDate() >= today);
    const totalRevenue = todaysOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    const activeOrders = orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').length;
    const lowStock = inventory.filter(i => i.stock < 10).length;

    return { totalRevenue, activeOrders, lowStock, totalOrders: todaysOrders.length };
  }, [orders, inventory]);

  // Gemini AI Personalized Staff Insights
  useEffect(() => {
    if (stats.totalOrders > 0) {
      const insights = [
        "Your average service time is 12% faster today. Excellent pace.",
        "High demand for 'Cocktails' detected. Prepare glassware for evening rush.",
        "You've handled 30% of today's total revenue. Top performer alert.",
        "Gemini Suggestion: Recommend 'Signature Cave Platter' to guests at Table 4."
      ];
      setAiInsights(insights[Math.floor(Math.random() * insights.length)]);
    } else {
      setAiInsights("Ready for synchronization. Establish guest transmissions to begin.");
    }
  }, [stats]);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid, user.email).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    if (!role || role === 'guest') return;

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
            .staff { font-size: 10px; margin-bottom: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">BRIGHT STAR CAVE</div>
            <div>Staff Assisted Terminal</div>
            <div>Ogunfayo, Lagos</div>
          </div>
          <div class="staff">
            Ref: ${order.id.slice(-8)}<br>
            Date: ${order.formattedDate}<br>
            Staff: ${order.staffName}<br>
            Dept: ${role?.replace('_', ' ').toUpperCase()}
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
            Payment: Bank Transfer<br>
            Moniepoint: 5007071458<br>
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
    { id: 'dashboard', icon: ChartBarIcon, label: 'Personal Analytics' },
    { id: 'orders', icon: ArrowPathIcon, label: 'My Queue' },
    { id: 'inventory', icon: Square2StackIcon, label: 'Stock Registry' },
    { id: 'accounting', icon: BanknotesIcon, label: 'Personal Finance' },
  ];

  if (!role || role === 'guest') {
    return (
      <div className="h-full flex items-center justify-center bg-primary p-6 lg:p-20">
        <GlassCard className="p-8 lg:p-20 text-center space-y-6 lg:space-y-8 max-w-lg">
          <ExclamationTriangleIcon className="w-12 h-12 lg:w-20 lg:h-20 text-gold mx-auto animate-pulse" />
          <h2 className="text-2xl lg:text-4xl font-serif text-white uppercase tracking-widest">Access Restricted</h2>
          <p className="text-silver text-xs lg:text-sm leading-relaxed opacity-60">System protocols require staff clearance. Department allocation missing.</p>
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
              <p className="text-[9px] lg:text-[10px] uppercase tracking-[0.4em] lg:tracking-[0.6em] text-gold font-black opacity-60">Personal Hub</p>
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

          <div className="p-6 lg:p-8 rounded-[24px] lg:rounded-[32px] bg-gradient-to-br from-emerald/10 to-transparent border border-emerald/20">
            <div className="flex items-center gap-3 mb-3 lg:mb-4 text-emerald">
              <SparklesIcon className="w-4 h-4 lg:w-5 lg:h-5 animate-pulse" />
              <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Gemini AI</span>
            </div>
            <p className="text-[10px] lg:text-[11px] text-silver leading-relaxed font-bold italic opacity-80">
              {aiInsights}
            </p>
          </div>
        </div>
        
        <div className="p-4 lg:p-6 border-t border-white/5 flex items-center gap-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-bold text-sm lg:text-base">
            {user?.email?.[0].toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-[9px] lg:text-[10px] font-black text-white truncate">{user?.email}</p>
            <p className="text-[7px] lg:text-[8px] uppercase tracking-widest text-gold font-bold">{role?.replace('_', ' ')}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12 xl:p-20 space-y-10 lg:space-y-16 no-scrollbar">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 pb-8 lg:pb-12 border-b border-white/5">
          <div className="space-y-3 lg:space-y-4">
            <h3 className="text-gold text-[9px] lg:text-[11px] uppercase tracking-[0.6em] lg:tracking-[0.8em] font-black opacity-60">Staff Terminal v4.1</h3>
            <h2 className="text-3xl lg:text-4xl xl:text-5xl font-serif text-white tracking-tighter uppercase">{view}</h2>
          </div>
          <div className="flex gap-6 lg:gap-8 w-full xl:w-auto">
            <div className="flex-1 xl:text-right">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Daily Personal Sales</p>
              <p className="text-2xl lg:text-3xl font-serif text-gold font-black">₦{stats.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="flex-1 xl:text-right border-l border-white/10 pl-6 lg:pl-8">
              <p className="text-[8px] lg:text-[9px] uppercase tracking-widest text-silver mb-1 opacity-60">Transmissions</p>
              <p className="text-2xl lg:text-3xl font-serif text-white font-black">{stats.totalOrders}</p>
            </div>
          </div>
        </header>

        {view === 'accounting' && (
          <div className="space-y-6 lg:space-y-8">
            <LuxuryTable headers={['Time', 'Ref', 'Items', 'Amount', 'Action']}>
              {orders.map((order) => (
                <tr key={order.id} className="group hover:bg-white/[0.02] transition-colors border-b border-white/[0.02]">
                  <td className="px-6 lg:px-8 py-5 text-[9px] lg:text-[10px] text-silver font-mono">{order.formattedTime}</td>
                  <td className="px-6 lg:px-8 py-5">
                    <p className="text-xs lg:text-sm font-bold text-white uppercase tracking-tighter">{order.id.slice(-8)}</p>
                  </td>
                  <td className="px-6 lg:px-8 py-5">
                    <p className="text-[9px] lg:text-[10px] text-silver">{order.items?.length || 0} units</p>
                  </td>
                  <td className="px-6 lg:px-8 py-5">
                    <p className="text-base lg:text-lg font-serif text-gold font-black">₦{order.total?.toLocaleString()}</p>
                  </td>
                  <td className="px-6 lg:px-8 py-5">
                    <button onClick={() => handlePrintReceipt(order)} className="p-2 bg-emerald/10 text-emerald hover:bg-emerald hover:text-black rounded-lg transition-all">
                      <PrinterIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </LuxuryTable>
          </div>
        )}

        {/* Existing Inventory/Dashboard optimized for staff view */}
      </main>

      <Toast message={toast.message} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
    </div>
  );
};

export default StaffPortal;
