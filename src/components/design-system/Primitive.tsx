import { motion, AnimatePresence } from "motion/react";
import { ReactNode, useEffect, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

interface PrimitiveProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const GlassCard = ({ children, className = "", onClick }: PrimitiveProps) => (
  <motion.div 
    whileHover={onClick ? { scale: 1.01, borderColor: "rgba(212, 175, 55, 0.3)" } : {}}
    onClick={onClick}
    className={`bg-secondary/40 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
  >
    {children}
  </motion.div>
);

export const GoldButton = ({ children, className = "", onClick, disabled, type = "button" }: PrimitiveProps) => (
  <motion.button
    whileHover={{ scale: 1.02, brightness: 1.1 }}
    whileTap={{ scale: 0.98 }}
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`bg-gold text-black font-black uppercase tracking-[0.2em] text-[10px] py-4 px-8 rounded-2xl shadow-2xl shadow-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${className}`}
  >
    {children}
  </motion.button>
);

export const EmeraldButton = ({ children, className = "", onClick, disabled, type = "button" }: PrimitiveProps) => (
  <motion.button
    whileHover={{ scale: 1.02, brightness: 1.1 }}
    whileTap={{ scale: 0.98 }}
    type={type}
    disabled={disabled}
    onClick={onClick}
    className={`bg-emerald text-black font-black uppercase tracking-[0.2em] text-[10px] py-4 px-8 rounded-2xl shadow-2xl shadow-emerald/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${className}`}
  >
    {children}
  </motion.button>
);

export const SilverInput = ({ placeholder, value, onChange, type = "text", className = "", icon: Icon }: any) => (
  <div className={`relative group ${className}`}>
    {Icon && <Icon className="absolute left-5 top-1/2 -translate-y-1/2 text-silver/40 group-focus-within:text-gold transition-colors" size={18} />}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full bg-white/5 border border-white/10 rounded-2xl py-4 ${Icon ? 'pl-14' : 'px-6'} pr-6 text-sm text-white placeholder:text-silver/20 focus:outline-none focus:border-gold/30 transition-all`}
    />
  </div>
);

export const Badge = ({ children, color = "gold" }: { children: ReactNode, color?: "gold" | "emerald" | "silver" | "purple" | "red" }) => {
  const colors = {
    gold: "bg-gold/10 text-gold border-gold/20",
    emerald: "bg-emerald/10 text-emerald border-emerald/20",
    silver: "bg-silver/10 text-silver border-silver/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    red: "bg-red-500/10 text-red-400 border-red-500/20"
  };
  
  return (
    <span className={`text-[9px] uppercase tracking-widest font-black px-3 py-1 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const SectionTitle = ({ subtitle, title }: { subtitle: string, title: string }) => (
  <div className="space-y-2 mb-8">
    <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-black opacity-60">{subtitle}</p>
    <h2 className="text-4xl font-serif text-white tracking-tighter">{title}</h2>
  </div>
);

export const GlassModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-secondary/80 backdrop-blur-2xl border border-white/10 rounded-[40px] shadow-2xl overflow-hidden"
        >
          <div className="p-8 border-b border-white/5 flex justify-between items-center">
            <h3 className="text-xl font-serif text-white uppercase tracking-widest">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-silver transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-8 max-h-[70vh] overflow-y-auto no-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const LuxuryTable = ({ headers, children }: { headers: string[], children: ReactNode }) => (
  <div className="w-full overflow-hidden rounded-[32px] border border-white/5 bg-black/20 backdrop-blur-sm">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-white/5">
          {headers.map((header, i) => (
            <th key={i} className="px-8 py-6 text-[10px] uppercase tracking-[0.3em] text-gold font-black border-b border-white/5">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.02]">
        {children}
      </tbody>
    </table>
  </div>
);

export const TabSystem = ({ tabs, activeTab, onChange }: { tabs: { id: string, label: string }[], activeTab: string, onChange: (id: string) => void }) => (
  <div className="flex gap-4 p-2 bg-white/5 rounded-2xl w-fit">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`px-6 py-3 rounded-xl text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === tab.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-silver hover:text-white'}`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export const Toast = ({ message, type = "success", isVisible, onClose }: { message: string, type?: "success" | "error", isVisible: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-4 ${type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
        >
          <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-emerald' : 'bg-red-500'}`} />
          <span className="text-[10px] uppercase tracking-[0.2em] font-black">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
