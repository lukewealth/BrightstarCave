import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LayoutDashboard, ShoppingBag, Utensils, Beer, Settings, ChevronRight, LayoutGrid, Users, Plus, Save, Trash2, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
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
  getDocFromServer,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db, handleFirestoreError } from "../lib/firebase";
import { Link } from "react-router-dom";
import { menuItems as initialMenu } from "../data/menu";

export const AdminPortal = ({ user }: { user: User | null }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'dashboard' | 'kitchen' | 'bar' | 'inventory' | 'staff'>('dashboard');

  const [inventory, setInventory] = useState<any[]>([]);

  const hover2X = {
    scale: 1.2,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  const hoverButton2X = {
    scale: 1.05,
    transition: { type: "spring", stiffness: 400, damping: 10 }
  };

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const checkAdmin = async () => {
      const env = (import.meta as any).env;
      const adminEmail = env.VITE_ADMIN_EMAIL;
      const staffEmail = env.VITE_STAFF_EMAIL;

      
      if (user.email === adminEmail || user.email === staffEmail) {
        setIsAdmin(true);
        return;
      }
      
      const adminRef = doc(db, "admins", user.uid);
      try {
        const snap = await getDocFromServer(adminRef);
        setIsAdmin(snap.exists());
      } catch (err) {
        console.error("Admin check failed:", err);
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (isAdmin !== true) return;

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError(null);
    }, (err) => setError("Terminal locked. Unauthorized access."));

    const qInv = query(collection(db, "inventory"));
    const unsubInv = onSnapshot(qInv, (snapshot) => {
      if (snapshot.empty) {
        setInventory(initialMenu);
      } else {
        setInventory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    });

    return () => {
      unsubscribe();
      unsubInv();
    };
  }, [isAdmin]);

  if (isAdmin === null) {
    return (
      <div className="h-full flex items-center justify-center bg-primary">
        <div className="w-10 h-10 border-2 border-emerald/20 border-t-emerald rounded-full animate-spin shadow-lg shadow-emerald/10" />
      </div>
    );
  }

  if (isAdmin === false || error) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-primary">
        <div className="size-20 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-center mb-8">
          <ShieldAlert size={40} className="text-red-500 opacity-80" />
        </div>
        <h3 className="text-3xl font-serif text-white mb-3 tracking-tighter">Access Denied</h3>
        <p className="text-secondary max-w-sm font-light leading-relaxed mb-10 text-sm">
          {error || "Your digital footprint is not recognized in the Command Dashboard."}
        </p>
        <motion.div whileHover={hover2X}>
          <Link to="/" className="text-[11px] uppercase tracking-[0.4em] font-black text-emerald border-b-2 border-emerald/20 pb-2 hover:border-emerald transition-all">
            Return to Sanctuary
          </Link>
        </motion.div>
      </div>
    );
  }

  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { 
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, 'update', 'orders');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'new': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'pending-verification': return 'bg-purple-500/10 text-purple-400 border-purple-500/20 animate-pulse';
      case 'preparing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ready': return 'bg-emerald/10 text-emerald border-emerald/20';
      case 'served': return 'bg-white/5 text-secondary border-white/10';
      default: return 'bg-white/5 text-secondary border-white/10';
    }
  };

  const filteredOrders = view === 'dashboard' ? orders : orders.filter(o => o.status !== 'served');

  return (
    <div className="flex h-full bg-primary">
      {/* Admin Sidebar */}
      <aside className="w-72 border-r border-white/[0.03] bg-secondary p-8 flex flex-col justify-between shrink-0 glass-card border-none shadow-2xl">
        <div className="space-y-12">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-silver mb-6 font-black opacity-60">Control Hub</p>
            <nav className="space-y-2">
              {[
                { id: 'dashboard', icon: LayoutDashboard, label: 'Analytics' },
                { id: 'inventory', icon: LayoutGrid, label: 'Resources' },
                { id: 'staff', icon: Users, label: 'Personnel' },
              ].map((item) => (
                <motion.button 
                  key={item.id}
                  whileHover={hoverButton2X}
                  onClick={() => setView(item.id as any)}
                  className={`w-full flex items-center gap-4 text-[11px] p-4 rounded-2xl transition-all uppercase tracking-widest font-bold ${view === item.id ? 'bg-emerald text-black shadow-xl shadow-emerald/10' : 'text-silver hover:text-white hover:bg-white/[0.02]'}`}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </motion.button>
              ))}
            </nav>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-silver mb-6 font-black opacity-60">Field Stations</p>
            <nav className="space-y-2">
              <motion.button whileHover={hoverButton2X} onClick={() => setView('kitchen')} className={`w-full flex items-center gap-4 text-[11px] p-4 rounded-2xl transition-all uppercase tracking-widest font-bold ${view === 'kitchen' ? 'bg-primary border border-emerald/20 text-emerald shadow-lg shadow-emerald/5' : 'text-silver hover:text-white'}`}>
                <Utensils size={18} />
                <span>Kitchen Terminal</span>
              </motion.button>
              <motion.button whileHover={hoverButton2X} onClick={() => setView('bar')} className={`w-full flex items-center gap-4 text-[11px] p-4 rounded-2xl transition-all uppercase tracking-widest font-bold ${view === 'bar' ? 'bg-primary border border-emerald/20 text-emerald shadow-lg shadow-emerald/5' : 'text-silver hover:text-white'}`}>
                <Beer size={18} />
                <span>Beverage Queue</span>
              </motion.button>
            </nav>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-16 space-y-16 no-scrollbar">
        <header className="flex justify-between items-end border-b border-white/[0.03] pb-10">
          <div>
            <h3 className="text-silver text-[11px] uppercase tracking-[0.6em] font-black mb-4">Ashi Terminal v4.2</h3>
            <h2 className="text-6xl font-serif text-white uppercase tracking-tighter">
              {view === 'inventory' ? 'Stock Archive' : view === 'staff' ? 'Personnel' : 'Operations'}
            </h2>
          </div>
          <div className="text-right space-y-2">
            <p className="text-[10px] uppercase tracking-[0.3em] text-silver font-bold">Authorized User</p>
            <p className="text-sm font-mono text-emerald font-bold">{user?.email}</p>
          </div>
        </header>

        {view === 'dashboard' || view === 'kitchen' || view === 'bar' ? (
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, i) => (
                <motion.div 
                  layout
                  key={order.id} 
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`glass-card rounded-[40px] overflow-hidden border transition-all duration-500 ${order.status === 'pending-verification' ? 'border-purple-500/20 bg-purple-500/[0.02]' : 'border-white/[0.03] hover:border-emerald/20'}`}
                >
                  <div className="p-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
                    <div className="flex items-center gap-10">
                      <div className="size-20 rounded-[28px] bg-primary border border-white/[0.05] flex items-center justify-center font-serif text-3xl font-bold text-white shadow-2xl">
                        {order.table?.split('-').pop()}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-5">
                          <h5 className="font-bold text-2xl text-white tracking-tight">{order.userName || "VIP Guest"}</h5>
                          <span className={`text-[10px] px-4 py-1.5 rounded-full border uppercase font-black tracking-widest ${getStatusColor(order.status)}`}>
                            {order.status.replace('-', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-silver tracking-[0.2em] uppercase font-medium">
                          {order.table} • {order.items?.length || 0} SELECTIONS • {order.createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-10 w-full lg:w-auto pt-10 lg:pt-0">
                      <div className="text-right mr-10">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-silver font-black mb-2 opacity-60">Settlement</p>
                        <p className="text-3xl font-serif text-gold font-bold">₦{order.total?.toLocaleString()}</p>
                      </div>
                      <div className="flex gap-4">
                        {order.status === 'pending-verification' && (
                          <motion.button whileHover={hoverButton2X} onClick={() => updateStatus(order.id, 'new')} className="px-8 py-4 bg-purple-500 text-white text-[11px] uppercase font-black tracking-widest rounded-2xl hover:brightness-110 shadow-2xl shadow-purple-500/20 transition-all">Verify Payment</motion.button>
                        )}
                        {order.status === 'new' && (
                          <motion.button whileHover={hoverButton2X} onClick={() => updateStatus(order.id, 'preparing')} className="px-8 py-4 bg-primary/50 border border-white/10 text-[11px] uppercase font-black tracking-widest text-white hover:bg-amber-500/20 hover:text-amber-400 rounded-2xl transition-all">Acknowledge</motion.button>
                        )}
                        {order.status === 'preparing' && (
                          <motion.button whileHover={hoverButton2X} onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)} className="px-8 py-4 bg-gold text-black text-[11px] uppercase font-black tracking-widest rounded-2xl hover:brightness-110 shadow-2xl shadow-gold/20 transition-all">Command</motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {expandedOrderId === order.id && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="p-10 bg-primary/30 border-t border-white/[0.03] grid grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <p className="text-[11px] uppercase tracking-[0.4em] text-emerald font-black">Selection Manifest</p>
                        <ul className="space-y-4">
                          {order.items?.map((it: string, idx: number) => (
                            <li key={idx} className="flex justify-between text-base text-silver border-b border-white/[0.03] pb-3 font-light">
                              <span>{it}</span>
                              <span className="text-emerald font-mono text-xs font-bold tracking-widest">VERIFIED</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex flex-col justify-end gap-6">
                        <motion.button whileHover={hoverButton2X} onClick={() => updateStatus(order.id, 'ready')} className="w-full py-5 bg-emerald text-black font-black uppercase text-[11px] tracking-widest rounded-2xl flex items-center justify-center gap-3">
                          Advance to Ready <ArrowRight size={16} />
                        </motion.button>
                        <motion.button whileHover={hoverButton2X} onClick={() => setExpandedOrderId(null)} className="w-full py-5 border border-white/5 text-silver text-[11px] uppercase font-bold tracking-widest rounded-2xl hover:bg-white/[0.02]">Collapse Terminal</motion.button>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : view === 'inventory' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {inventory.map((item) => (
              <div key={item.id} className="glass-card p-8 rounded-[40px] border border-white/[0.03] space-y-6 group hover:border-emerald/20 transition-all">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] uppercase text-emerald font-black tracking-[0.3em] bg-emerald/5 px-3 py-1.5 rounded-full">{item.type}</span>
                  <motion.button whileHover={hover2X} className="text-silver/40 hover:text-red-500 transition-colors"><Trash2 size={18} /></motion.button>
                </div>
                <h4 className="text-2xl font-serif text-white tracking-tight">{item.name}</h4>
                <div className="flex justify-between items-center pt-6 border-t border-white/[0.03]">
                  <span className="text-xl font-bold text-emerald tracking-tighter">₦{item.price.toLocaleString()}</span>
                  <span className="text-xs text-silver font-mono">STOCK: {item.stock}</span>
                </div>
                <motion.button whileHover={hoverButton2X} className="w-full py-4 border border-white/5 text-silver text-[10px] uppercase font-black tracking-widest rounded-2xl hover:bg-emerald hover:text-black transition-all">Update Entry</motion.button>
              </div>
            ))}
            <motion.button whileHover={hoverButton2X} className="h-full min-h-[250px] border-2 border-dashed border-white/[0.03] rounded-[40px] flex flex-col items-center justify-center gap-5 text-silver/40 hover:border-emerald/20 hover:text-emerald transition-all group">
              <Plus size={40} className="group-hover:scale-110 transition-transform" />
              <span className="text-[11px] uppercase font-black tracking-[0.4em]">Register Protocol</span>
            </motion.button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto space-y-12 pt-10">
            <div className="glass-card p-12 rounded-[56px] border border-white/[0.03] shadow-2xl">
              <h4 className="text-2xl font-serif text-white mb-10 flex items-center gap-4">
                <Plus className="text-emerald" size={28} />
                Personnel Registration
              </h4>
              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.4em] text-silver font-black ml-1">Archive ID</label>
                  <input type="email" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-5 px-8 text-sm text-white outline-none focus:border-emerald/30 transition-all placeholder:text-white/10 shadow-inner" placeholder="personnel@brightstar.cave" />
                </div>
                <div className="space-y-3">
                  <label className="text-[11px] uppercase tracking-[0.4em] text-silver font-black ml-1">Credential Key</label>
                  <input type="text" className="w-full bg-primary/50 border border-white/5 rounded-2xl py-5 px-8 text-sm text-white outline-none focus:border-emerald/30 transition-all placeholder:text-white/10 shadow-inner" placeholder="TEMPORARY-ACCESS" />
                </div>
                <motion.button whileHover={hoverButton2X} className="w-full py-6 bg-emerald text-black font-black uppercase text-[11px] tracking-[0.4em] rounded-2xl hover:brightness-110 shadow-2xl shadow-emerald/20 mt-6 transition-all">Authorize Clearance</motion.button>
              </div>
            </div>
            
            <div className="space-y-6">
              <p className="text-[11px] uppercase tracking-[0.6em] text-silver font-black ml-6">Registry</p>
              <div className="glass-card rounded-[48px] border border-white/[0.03] divide-y divide-white/[0.03] overflow-hidden shadow-2xl">
                {[
                  { email: 'lukeokagha@gmail.com', role: 'Elite Staff' },
                  { email: 'admin@brightstar.cave', role: 'System Admin' }
                ].map((st, idx) => (
                  <div key={idx} className="p-8 flex justify-between items-center group hover:bg-white/[0.01] transition-colors">
                    <div className="space-y-1">
                      <p className="text-lg text-white font-bold tracking-tight">{st.email}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-emerald font-black opacity-80">{st.role}</p>
                    </div>
                    <motion.button whileHover={hover2X} className="p-3 text-silver/30 hover:text-red-500 transition-all hover:scale-110"><Trash2 size={20} /></motion.button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPortal;
