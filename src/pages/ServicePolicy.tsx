import React from "react";
import { motion } from "motion/react";
import { 
  ShieldCheckIcon, 
  UserGroupIcon, 
  SparklesIcon, 
  FingerPrintIcon,
  DocumentCheckIcon,
  ScaleIcon
} from "@heroicons/react/24/outline";
import { SectionTitle, GlassCard, Badge } from "../components/design-system/Primitive";

const ServicePolicy = () => {
  const principles = [
    {
      icon: SparklesIcon,
      title: "Pristine Standards",
      desc: "Every interaction at Brightstar Cave is governed by a commitment to absolute excellence. Our staff are trained in the art of anticipatory service, ensuring your needs are met before they are even articulated."
    },
    {
      icon: UserGroupIcon,
      title: "Discrete Hospitality",
      desc: "Privacy is the ultimate luxury. Our personnel operate with the highest level of discretion, providing a sanctuary where high-profile guests can relax in complete anonymity."
    },
    {
      icon: DocumentCheckIcon,
      title: "Bespoke Fulfillment",
      desc: "No request is too complex. Whether it's a specific vintage from our cellar or a customized culinary creation, our department heads are empowered to deliver personalized luxury."
    }
  ];

  return (
    <div className="min-h-screen bg-primary pt-32 pb-20 px-6 lg:px-12 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gold/5 blur-[120px] rounded-full -z-10 translate-x-1/2" />
      
      <div className="max-w-5xl mx-auto space-y-20">
        <header className="space-y-6 text-center">
          <Badge color="gold">Elite Service Protocol</Badge>
          <SectionTitle 
            title="Hospitality Charter" 
            subtitle="The Brightstar Cave Commitment"
            align="center"
          />
          <p className="text-silver/60 max-w-2xl mx-auto leading-relaxed italic font-light">
            "A standard beyond five stars, where every guest is treated as the sole inhabitant of our celestial sanctuary."
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {principles.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2 }}
            >
              <GlassCard className="p-10 h-full space-y-6 border-white/5 hover:border-gold/30 transition-all group text-center">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <p.icon className="w-8 h-8 text-gold" />
                </div>
                <h3 className="text-xl font-serif text-white uppercase tracking-widest">{p.title}</h3>
                <p className="text-sm text-silver/50 leading-relaxed font-light">{p.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <section className="space-y-12">
          <div className="border-l-2 border-gold/30 pl-8 space-y-8">
            <div className="space-y-4">
              <h4 className="text-2xl font-serif text-white uppercase tracking-tighter">Operational Integrity</h4>
              <p className="text-silver/60 leading-relaxed max-w-3xl">
                Our service policy ensures that every 'transmission' (order or request) is audited for quality. We maintain a zero-tolerance policy for mediocrity. Guests can expect their orders to be dispatched with surgical precision, handled only by verified operators.
              </p>
            </div>
            <div className="space-y-4">
              <h4 className="text-2xl font-serif text-white uppercase tracking-tighter">Guest Redress</h4>
              <p className="text-silver/60 leading-relaxed max-w-3xl">
                Should any aspect of the Brightstar experience fail to meet your expectations, the Master Protocol requires immediate intervention by the Admin Lead to ensure total satisfaction.
              </p>
            </div>
          </div>
        </section>

        <footer className="text-center pt-10 opacity-30">
          <p className="text-[10px] uppercase tracking-[0.5em] text-gold font-black">Authorized by Brightstar Governance • 2024</p>
        </footer>
      </div>
    </div>
  );
};

export default ServicePolicy;
