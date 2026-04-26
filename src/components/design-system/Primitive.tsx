import { motion, AnimatePresence } from "motion/react";
import { ReactNode, useEffect, useState, useRef, Key } from "react";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import heic2any from "heic2any";

// Persistent Cache for Image Conversions (IndexedDB)
const CACHE_DB = "BrightstarImageCache";
const STORE_NAME = "converted_images";

const getCache = async (key: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const request = indexedDB.open(CACHE_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME);
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const getReq = store.get(key);
      getReq.onsuccess = () => {
        if (getReq.result) {
          resolve(URL.createObjectURL(getReq.result));
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };
    request.onerror = () => resolve(null);
  });
};

const setCache = async (key: string, blob: Blob) => {
  const request = indexedDB.open(CACHE_DB, 1);
  request.onsuccess = () => {
    const db = request.result;
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(blob, key);
  };
};

interface PrimitiveProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  key?: Key;
}

export const OptimizedImage = ({ 
  src, 
  alt, 
  className = "", 
  aspectRatio = "aspect-square",
  artistic = true,
  priority = false 
}: { 
  src: string; 
  alt: string; 
  className?: string; 
  aspectRatio?: string;
  artistic?: boolean;
  priority?: boolean;
}) => {
  const [displaySrc, setDisplaySrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    const loadImg = async () => {
      if (!src) return;
      
      const isHeic = src.toLowerCase().endsWith(".heic");
      
      try {
        if (isHeic) {
          // Check Persistent Cache first
          const cachedUrl = await getCache(src);
          if (cachedUrl && isMounted.current) {
            setDisplaySrc(cachedUrl);
            return;
          }

          const response = await fetch(src, { cache: "force-cache" });
          const blob = await response.blob();
          const convertedBlob = await heic2any({
            blob,
            toType: "image/jpeg",
            quality: 0.7 // Balanced quality/speed
          });
          
          const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          await setCache(src, finalBlob);
          
          const url = URL.createObjectURL(finalBlob);
          if (isMounted.current) setDisplaySrc(url);
        } else {
          if (isMounted.current) setDisplaySrc(src);
        }
      } catch (err) {
        console.error("Image load error:", err);
        if (isMounted.current) setError(true);
      }
    };

    loadImg();

    return () => {
      isMounted.current = false;
      if (displaySrc && displaySrc.startsWith("blob:")) {
        // We don't always want to revoke if it's cached, 
        // but for safety in memory management:
        // URL.revokeObjectURL(displaySrc);
      }
    };
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${aspectRatio} ${className} ${artistic ? 'rounded-[32px] border border-white/5 bg-white/[0.02]' : ''}`}>
      <AnimatePresence>
        {isLoading && !error && (
          <motion.div 
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <div className="w-10 h-10 border-2 border-gold/10 border-t-gold rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-silver/20 space-y-2 bg-white/[0.02]">
          <PhotoIcon className="w-10 h-10" />
          <span className="text-[9px] uppercase tracking-widest font-black">Link Broken</span>
        </div>
      ) : (
        displaySrc && (
          <motion.img
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: isLoading ? 0 : 1, scale: isLoading ? 1.02 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            src={displaySrc}
            alt={alt}
            onLoad={() => setIsLoading(false)}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            className={`w-full h-full object-cover ${artistic ? 'grayscale-[0.2] hover:grayscale-0 transition-all duration-700' : ''}`}
          />
        )
      )}
      
      {artistic && !isLoading && !error && (
        <div className="absolute inset-0 pointer-events-none border border-white/5 rounded-[32px] shadow-inner-glass" />
      )}
    </div>
  );
};

export const GlassCard = ({ children, className = "", onClick }: PrimitiveProps) => (
  <motion.div 
    whileHover={onClick ? { scale: 1.01, borderColor: "rgba(212, 175, 55, 0.3)" } : {}}
    onClick={onClick}
    className={`bg-secondary/40 backdrop-blur-xl border border-white/5 rounded-[24px] lg:rounded-[32px] overflow-hidden ${onClick ? 'cursor-pointer' : ''} ${className}`}
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
    className={`bg-gold text-black font-black uppercase tracking-[0.2em] text-[9px] lg:text-[10px] py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl lg:rounded-2xl shadow-2xl shadow-gold/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${className}`}
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
    className={`bg-emerald text-black font-black uppercase tracking-[0.2em] text-[9px] lg:text-[10px] py-3.5 lg:py-4 px-6 lg:px-8 rounded-xl lg:rounded-2xl shadow-2xl shadow-emerald/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all ${className}`}
  >
    {children}
  </motion.button>
);

export const SilverInput = ({ placeholder, value, onChange, type = "text", className = "", icon: Icon }: any) => (
  <div className={`relative group ${className}`}>
    {Icon && (
      <div className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-silver/40 group-focus-within:text-gold transition-colors pointer-events-none">
        <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
      </div>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full bg-white/5 border border-white/10 rounded-xl lg:rounded-2xl py-3 lg:py-3.5 ${Icon ? 'pl-11 lg:pl-12' : 'px-5 lg:px-6'} pr-5 lg:pr-6 text-sm text-white placeholder:text-silver/20 focus:outline-none focus:border-gold/30 transition-all`}
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
    <span className={`text-[8px] lg:text-[9px] uppercase tracking-widest font-black px-2.5 lg:px-3 py-0.5 lg:py-1 rounded-full border ${colors[color]}`}>
      {children}
    </span>
  );
};

export const SectionTitle = ({ subtitle, title }: { subtitle: string, title: string }) => (
  <div className="space-y-1 lg:space-y-2 mb-6 lg:mb-8">
    <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-gold font-black opacity-60 leading-none">{subtitle}</p>
    <h2 className="text-3xl lg:text-4xl xl:text-5xl font-serif text-white tracking-tighter uppercase leading-tight">{title}</h2>
  </div>
);

export const GlassModal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-6 bg-black/90 backdrop-blur-xl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-secondary border border-white/5 rounded-[24px] lg:rounded-[40px] shadow-2xl overflow-hidden"
        >
          <div className="px-6 lg:px-10 py-5 lg:py-8 border-b border-white/5 flex justify-between items-center bg-black/20">
            <h3 className="text-lg lg:text-xl font-serif text-white uppercase tracking-widest">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-silver transition-colors">
              <XMarkIcon className="w-5 h-5 lg:w-6 lg:h-6" />
            </button>
          </div>
          <div className="p-6 lg:p-10 max-h-[75vh] overflow-y-auto no-scrollbar">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const LuxuryTable = ({ headers, children }: { headers: string[], children: ReactNode }) => (
  <div className="w-full overflow-hidden rounded-[20px] lg:rounded-[32px] border border-white/5 bg-black/20 backdrop-blur-sm">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-white/5">
          {headers.map((header, i) => (
            <th key={i} className="px-5 lg:px-8 py-4 lg:py-6 text-[8px] lg:text-[10px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-gold font-black border-b border-white/5 leading-none">
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
  <div className="flex gap-2 lg:gap-4 p-1.5 lg:p-2 bg-white/5 rounded-xl lg:rounded-2xl w-fit">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`px-4 lg:px-6 py-2 lg:py-3 rounded-lg lg:rounded-xl text-[8px] lg:text-[10px] uppercase tracking-widest font-black transition-all ${activeTab === tab.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-silver hover:text-white'}`}
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
          className={`fixed bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-[250] px-6 lg:px-8 py-3 lg:py-4 rounded-xl lg:rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-3 lg:gap-4 ${type === 'success' ? 'bg-emerald/10 border-emerald/20 text-emerald' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
        >
          <div className={`w-1.5 lg:w-2 h-1.5 lg:h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-emerald' : 'bg-red-500'}`} />
          <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.1em] lg:tracking-[0.2em] font-black">{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
