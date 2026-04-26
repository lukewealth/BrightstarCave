import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, ShieldCheck, Loader2, ArrowRight } from "lucide-react";
import { loginWithEmail, signInWithGoogle } from "../lib/firebase";

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginPopup = ({ isOpen, onClose }: LoginPopupProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "staff" | "admin">("guest");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (role === "guest") {
        await signInWithGoogle();
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-secondary border border-white/5 rounded-[32px] lg:rounded-[40px] overflow-hidden shadow-2xl p-8 lg:p-12"
          >
            <button
              onClick={onClose}
              className="absolute top-6 lg:top-8 right-6 lg:right-8 p-2 rounded-full border border-white/10 text-secondary hover:bg-emerald hover:text-black transition-all"
            >
              <X size={18} />
            </button>

            <div className="text-center mb-8 lg:mb-10">
              <div className="size-16 lg:size-20 bg-emerald/5 rounded-[20px] lg:rounded-[24px] flex items-center justify-center mx-auto mb-5 lg:mb-6 border border-emerald/10 relative group">
                {role === "admin" ? <ShieldCheck className="text-emerald" size={32} /> : <User className="text-emerald" size={32} />}
                <motion.div 
                  animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute inset-0 bg-emerald rounded-full blur-xl"
                />
              </div>
              <h2 className="text-2xl lg:text-3xl font-serif text-white uppercase tracking-tight">Portal Entry</h2>
              <p className="text-secondary text-[9px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] mt-2 lg:mt-3 font-bold">Secure Access Verification</p>
            </div>

            <div className="flex gap-1.5 lg:gap-2 mb-8 lg:mb-10 p-1.5 bg-primary/50 rounded-2xl border border-white/5">
              {(["guest", "staff", "admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setError(null); }}
                  className={`flex-1 py-2.5 lg:py-3 text-[9px] lg:text-[10px] uppercase font-bold tracking-[0.1em] lg:tracking-[0.2em] rounded-xl transition-all ${
                    role === r ? "bg-emerald text-black shadow-xl" : "text-secondary hover:text-white"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="space-y-4 lg:space-y-5">
              {role !== "guest" ? (
                <>
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[9px] lg:text-[10px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-secondary font-bold ml-1">Email Terminal</label>
                    <div className="relative">
                      <Mail className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-secondary/30" size={14} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="clearance@brightstar.cave"
                        className="w-full bg-primary/80 border border-white/5 rounded-2xl py-4 lg:py-5 pl-12 lg:pl-14 pr-5 text-sm text-white focus:border-emerald/30 outline-none transition-all placeholder:text-white/10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 lg:space-y-2">
                    <label className="text-[9px] lg:text-[10px] uppercase tracking-[0.2em] lg:tracking-[0.3em] text-secondary font-bold ml-1">Access Key</label>
                    <div className="relative">
                      <Lock className="absolute left-4 lg:left-5 top-1/2 -translate-y-1/2 text-secondary/30" size={14} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-primary/80 border border-white/5 rounded-2xl py-4 lg:py-5 pl-12 lg:pl-14 pr-5 text-sm text-white focus:border-emerald/30 outline-none transition-all placeholder:text-white/10"
                        required
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 lg:p-8 text-center space-y-4 bg-primary/30 rounded-[24px] lg:rounded-3xl border border-white/5">
                  <p className="text-xs lg:text-sm text-secondary font-light leading-relaxed">
                    Guests are welcomed via <span className="text-emerald font-bold">Google Authentication</span> for an encrypted, seamless high-tier experience.
                  </p>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-[9px] lg:text-[10px] uppercase font-bold tracking-widest text-center py-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 lg:py-5 bg-emerald text-black font-black uppercase text-[10px] lg:text-[11px] tracking-[0.2em] lg:tracking-[0.3em] rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-2xl shadow-emerald/10 mt-4 lg:mt-6"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  <>Establish Connection <ArrowRight size={16} /></>
                )}
              </button>
            </form>

            <p className="text-[8px] lg:text-[9px] text-center text-secondary/20 uppercase tracking-[0.4em] lg:tracking-[0.5em] mt-10 lg:mt-12 font-bold">
              Brightstar Encryption v4.0
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
