import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Mail, Lock, User, ShieldCheck, ArrowRight, ChevronRight, UserCircle } from "lucide-react";
import { loginWithEmail, signInWithGoogle } from "../lib/firebase";
import { LionLoader } from "./design-system/Primitive";

interface LoginPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginPopup = ({ isOpen, onClose }: LoginPopupProps) => {
  const [step, setStep] = useState<"select" | "login">("select");
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

  const selectRole = (r: "guest" | "staff" | "admin") => {
    setRole(r);
    setStep("login");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-2xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-secondary border border-white/5 rounded-[40px] lg:rounded-[56px] overflow-hidden shadow-2xl p-8 lg:p-16"
          >
            <button
              onClick={onClose}
              className="absolute top-8 lg:top-10 right-8 lg:right-10 p-2.5 rounded-full border border-white/10 text-silver hover:bg-gold hover:text-black transition-all z-10"
            >
              <X size={20} />
            </button>

            <AnimatePresence mode="wait">
              {step === "select" ? (
                <motion.div 
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-10"
                >
                  <div className="text-center">
                    <h2 className="text-3xl lg:text-4xl font-serif text-primary uppercase tracking-tight">Identity Registry</h2>
                    <p className="text-silver/40 text-[10px] lg:text-[11px] uppercase tracking-[0.4em] mt-3 font-black">Define Your Protocol Baseline</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <button 
                      onClick={() => selectRole("guest")}
                      className="group p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-between hover:bg-gold/5 hover:border-gold/20 transition-all text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className="size-14 bg-gold/10 rounded-2xl flex items-center justify-center text-gold group-hover:scale-110 transition-transform">
                          <UserCircle size={28} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-primary uppercase">Guest Entry</h4>
                          <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Luxury Gastronomy Access</p>
                        </div>
                      </div>
                      <ChevronRight className="text-silver/20 group-hover:text-gold group-hover:translate-x-1 transition-all" />
                    </button>

                    <button 
                      onClick={() => selectRole("staff")}
                      className="group p-8 bg-white/[0.02] border border-white/5 rounded-[32px] flex items-center justify-between hover:bg-emerald/5 hover:border-emerald/20 transition-all text-left"
                    >
                      <div className="flex items-center gap-6">
                        <div className="size-14 bg-emerald/10 rounded-2xl flex items-center justify-center text-emerald group-hover:scale-110 transition-transform">
                          <ShieldCheck size={28} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-primary uppercase">Operational Staff</h4>
                          <p className="text-[10px] text-silver/40 uppercase tracking-widest mt-1">Fleet Management Terminal</p>
                        </div>
                      </div>
                      <ChevronRight className="text-silver/20 group-hover:text-emerald group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="login"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <button onClick={() => setStep("select")} className="text-[10px] font-black uppercase tracking-[0.3em] text-silver/40 hover:text-gold transition-colors flex items-center gap-2 mb-2">
                    <ChevronRight size={14} className="rotate-180" /> Change Identity
                  </button>

                  <div className="text-center">
                    <div className={`size-20 rounded-[24px] flex items-center justify-center mx-auto mb-6 border relative ${role === 'guest' ? 'bg-gold/5 border-gold/10' : 'bg-emerald/5 border-emerald/10'}`}>
                      {role === "guest" ? <User className="text-gold" size={32} /> : <ShieldCheck className="text-emerald" size={32} />}
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.3, 0.1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                        className={`absolute inset-0 rounded-full blur-xl ${role === 'guest' ? 'bg-gold' : 'bg-emerald'}`}
                      />
                    </div>
                    <h2 className="text-2xl lg:text-3xl font-serif text-primary uppercase tracking-tight">
                      {role === 'guest' ? 'Guest Welcome' : 'Operational Login'}
                    </h2>
                  </div>

                  <form onSubmit={handleLogin} className="space-y-6">
                    {role !== "guest" ? (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.3em] text-silver/40 font-black ml-1">Registry Email</label>
                          <div className="relative">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-silver/20" size={16} />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="clearance@brightstar.cave"
                              className="w-full bg-primary/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-primary focus:border-emerald/30 outline-none transition-all placeholder:text-primary/5"
                              required
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] uppercase tracking-[0.3em] text-silver/40 font-black ml-1">Access Key</label>
                          <div className="relative">
                            <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-silver/20" size={16} />
                            <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-primary/50 border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-sm text-primary focus:border-emerald/30 outline-none transition-all placeholder:text-primary/5"
                              required
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-10 text-center space-y-6 bg-white/[0.02] border border-white/5 rounded-[40px]">
                        <p className="text-sm lg:text-base text-silver/60 font-light leading-relaxed">
                          Welcome to <span className="text-gold font-bold">Brightstar Cave</span>. Establish your guest presence via secure Google Authentication.
                        </p>
                      </div>
                    )}

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-500 text-[10px] uppercase font-black tracking-widest text-center py-2"
                      >
                        {error}
                      </motion.p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading}
                      className={`w-full py-5 lg:py-6 font-black uppercase text-[11px] tracking-[0.3em] rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-4 shadow-2xl mt-4
                        ${role === 'guest' ? 'bg-gold text-black shadow-gold/10' : 'bg-emerald text-black shadow-emerald/10'}`}
                    >
                      {isLoading ? (
                        <LionLoader size="sm" />
                      ) : (
                        <>Establish Baseline <ArrowRight size={18} /></>
                      )}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            <p className="text-[9px] text-center text-silver/10 uppercase tracking-[0.5em] mt-16 font-black">
              Brightstar Operational Framework v4.2
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
