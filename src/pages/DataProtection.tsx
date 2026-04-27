import React from "react";
import { motion } from "motion/react";
import { 
  ShieldCheckIcon, 
  LockClosedIcon, 
  KeyIcon,
  EyeSlashIcon,
  FingerPrintIcon,
  ServerIcon
} from "@heroicons/react/24/outline";
import { SectionTitle, GlassCard, Badge } from "../components/design-system/Primitive";

const DataProtection = () => {
  const securityFeatures = [
    {
      icon: LockClosedIcon,
      title: "Encrypted Transactions",
      desc: "All financial transmissions are processed through secure, audited channels. We never store sensitive payment credentials on our local servers."
    },
    {
      icon: EyeSlashIcon,
      title: "Zero-Knowledge Privacy",
      desc: "Your visiting history and personal preferences are accessible only to verified senior personnel, ensuring your lifestyle remains entirely private."
    },
    {
      icon: FingerPrintIcon,
      title: "Biometric Logic",
      desc: "Our internal systems require multi-factor verification for all operator-level access, preventing any unauthorized data breaches."
    }
  ];

  return (
    <div className="min-h-screen bg-primary pt-32 pb-20 px-6 lg:px-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute bottom-0 left-0 w-1/2 h-full bg-emerald/5 blur-[120px] rounded-full -z-10 -translate-x-1/2" />
      
      <div className="max-w-5xl mx-auto space-y-20">
        <header className="space-y-6 text-center">
          <Badge color="emerald">Security Infrastructure</Badge>
          <SectionTitle 
            title="Data Protection" 
            subtitle="The Vault Architecture"
            align="center"
          />
          <p className="text-silver/60 max-w-2xl mx-auto leading-relaxed italic font-light">
            "Your digital footprint at Brightstar Cave is guarded by the same standards we apply to our physical sanctuary."
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {securityFeatures.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <GlassCard className="p-10 h-full space-y-6 border-white/5 hover:border-emerald/30 transition-all group">
                <div className="w-16 h-16 bg-emerald/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <s.icon className="w-8 h-8 text-emerald" />
                </div>
                <h3 className="text-xl font-serif text-white uppercase tracking-widest">{s.title}</h3>
                <p className="text-sm text-silver/50 leading-relaxed font-light">{s.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <section className="space-y-12">
          <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 lg:p-16 space-y-10">
            <div className="flex items-center gap-6">
               <div className="p-4 bg-gold/10 rounded-2xl"><ShieldCheckIcon className="w-10 h-10 text-gold" /></div>
               <h3 className="text-3xl font-serif text-white uppercase tracking-tighter">The Governance Protocol</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-silver/60 leading-relaxed text-sm">
               <div className="space-y-6">
                  <p>
                    <strong className="text-white uppercase tracking-widest text-[10px] block mb-2">Collection Authorization</strong>
                    We collect only the essential identifiers required to facilitate your elite hospitality experience: email for authentication, and transaction data for service auditing.
                  </p>
                  <p>
                    <strong className="text-white uppercase tracking-widest text-[10px] block mb-2">Storage duration</strong>
                    Data is archived using industrial-grade rotation cycles. Inactive guest profiles are purged from our live environment after 24 months of sanctuary inactivity.
                  </p>
               </div>
               <div className="space-y-6">
                  <p>
                    <strong className="text-white uppercase tracking-widest text-[10px] block mb-2">Third-Party Disclosure</strong>
                    Brightstar Cave operates on a 'No-Disclosure' mandate. We do not sell, trade, or broadcast guest data to any external entities, excluding mandatory legal compliance.
                  </p>
                  <p>
                    <strong className="text-white uppercase tracking-widest text-[10px] block mb-2">Guest Control</strong>
                    You maintain absolute sovereignty over your data. Requests for account purging or data summaries can be initiated via the Admin Terminal.
                  </p>
               </div>
            </div>
          </div>
        </section>

        <footer className="text-center pt-10 opacity-30">
          <p className="text-[10px] uppercase tracking-[0.5em] text-emerald font-black">Encrypted by Brightstar Security Systems • 2024</p>
        </footer>
      </div>
    </div>
  );
};

export default DataProtection;
