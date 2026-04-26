import { Clock, MapPin, Phone, ShieldCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { OptimizedImage } from "../components/design-system/Primitive";

const aboutImages = [
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (11).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (9).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (2).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32.jpeg",
  "/images/IMG_1752.png",
  "/images/IMG_1757.png",
  "/images/IMG_1758.png",
  "/images/IMG_1760 2.png",
];

export const AboutUsPage = () => {
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % aboutImages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const hover2X = {
    scale: 1.0,
    transition: { duration: 0.3, ease: "easeInOut" }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-16 lg:space-y-24 py-12 lg:py-24">
      <header className="text-center space-y-4 lg:space-y-6">
        <motion.h3 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-emerald text-[10px] lg:text-sm font-bold tracking-[0.4em] uppercase italic"
        >
          Our Heritage
        </motion.h3>
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl xs:text-5xl lg:text-8xl font-serif text-white tracking-tight"
        >
          The Brightstar Story
        </motion.h2>
        <div className="w-16 lg:w-24 h-1 bg-emerald mx-auto rounded-full" />
      </header>

      {/* Sleek Artistic Slider */}
      <div className="relative h-[350px] lg:h-[500px] rounded-[32px] lg:rounded-[40px] overflow-hidden border border-white/[0.05] glass-card group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImage}
            initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <OptimizedImage 
              src={aboutImages[currentImage]} 
              alt="Atmosphere"
              aspectRatio="h-full"
              artistic={false}
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          </motion.div>
        </AnimatePresence>
        
        <div className="absolute bottom-6 lg:bottom-10 left-6 lg:left-10 right-6 lg:right-10 flex justify-between items-end z-20">
          <div className="space-y-1 lg:space-y-2">
            <span className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-emerald font-bold">Gallery Archive</span>
            <h4 className="text-xl lg:text-2xl font-serif text-white">Atmospheric Transmission</h4>
          </div>
          <div className="flex gap-2 lg:gap-4">
            <button 
              onClick={() => setCurrentImage((prev) => (prev - 1 + aboutImages.length) % aboutImages.length)}
              className="p-2 lg:p-3 rounded-full border border-white/10 text-white hover:bg-emerald hover:text-black transition-all"
            >
              <ChevronLeft size={16} className="lg:w-5 lg:h-5" />
            </button>
            <button 
              onClick={() => setCurrentImage((prev) => (prev + 1) % aboutImages.length)}
              className="p-2 lg:p-3 rounded-full border border-white/10 text-white hover:bg-emerald hover:text-black transition-all"
            >
              <ChevronRight size={16} className="lg:w-5 lg:h-5" />
            </button>
          </div>
        </div>

        <div className="absolute top-6 lg:top-10 right-6 lg:right-10 z-20 flex gap-1.5 lg:gap-2">
          {aboutImages.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${currentImage === i ? "w-6 lg:w-8 bg-emerald" : "w-1.5 lg:w-2 bg-white/20"}`} 
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
        <div className="space-y-6 lg:space-y-8 text-secondary leading-relaxed text-base lg:text-lg font-light">
          <p>
            Founded in 1994, <span className="text-white font-medium italic">Brightstar Cave</span> emerged as a sanctuary for those who appreciate the intersection of African soul and Asian precision. 
          </p>
          <p>
            What began as an intimate lounge has evolved into a global benchmark for luxury hospitality. We believe that true sanctuary is found where the elements align—Metals and Nature in a deliberate, beautiful dialogue.
          </p>
          <div className="pt-6 lg:pt-8 border-l-2 border-emerald pl-6 lg:pl-8 italic text-xl lg:text-2xl text-white font-serif leading-relaxed">
            "Every transmission, every sip, every rest is a story of distant shores and local heart."
          </div>
        </div>
        <div className="relative aspect-[4/5] rounded-[32px] lg:rounded-[40px] overflow-hidden border border-white/[0.05] glass-card p-2 group">
          <OptimizedImage 
            src="/images/WhatsApp Image 2026-04-21 at 19.35.32 (10).jpeg" 
            alt="Atmosphere"
            aspectRatio="h-full"
            className="w-full h-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000"
          />
          <div className="absolute inset-0 bg-emerald/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12 pt-10 lg:pt-12 border-t border-white/[0.05]">
        <div className="text-center space-y-2 lg:space-y-4">
          <h4 className="text-4xl lg:text-5xl font-serif text-emerald">30+</h4>
          <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-secondary font-black">Years of Heritage</p>
        </div>
        <div className="text-center space-y-2 lg:space-y-4">
          <h4 className="text-4xl lg:text-5xl font-serif text-emerald">12k</h4>
          <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-secondary font-black">Curated Transmissions</p>
        </div>
        <div className="text-center space-y-2 lg:space-y-4 col-span-2 sm:col-span-1">
          <h4 className="text-4xl lg:text-5xl font-serif text-emerald">5★</h4>
          <p className="text-[8px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-secondary font-black">Service Excellence</p>
        </div>
      </div>

      <section className="pt-16 lg:pt-24 space-y-10 lg:space-y-12">
        <div className="flex items-center gap-4">
          <ShieldCheck className="text-emerald" size={24} />
          <h3 className="text-xl lg:text-2xl font-serif text-white uppercase tracking-widest">Connect with the Cave</h3>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div 
            whileHover={{ scale: 1.01 }}
            className="glass-card p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-white/5 space-y-8"
          >
            <div className="flex gap-4 lg:gap-6 items-start">
              <div className="p-3 lg:p-4 bg-emerald/10 rounded-2xl text-emerald shrink-0">
                <MapPin size={20} className="lg:w-6 lg:h-6" />
              </div>
              <div>
                <h5 className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-secondary font-black mb-1 lg:mb-2">Location Terminal</h5>
                <p className="text-white text-base lg:text-lg font-light leading-relaxed">
                  Road 3C Ogunfayo, <br />
                  between Blenco/Limitless, <br />
                  Lagos, Nigeria
                </p>
              </div>
            </div>

            <div className="flex gap-4 lg:gap-6 items-start">
              <div className="p-3 lg:p-4 bg-emerald/10 rounded-2xl text-emerald shrink-0">
                <Phone size={20} className="lg:w-6 lg:h-6" />
              </div>
              <div>
                <h5 className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-secondary font-black mb-1 lg:mb-2">Voice Frequency</h5>
                <p className="text-white text-lg lg:text-xl font-mono font-bold">09168858844</p>
                <p className="text-[9px] text-emerald/60 uppercase tracking-widest mt-1">Reservations Preferred</p>
              </div>
            </div>
          </motion.div>

          <div className="space-y-4 lg:space-y-6">
            <h5 className="text-[9px] lg:text-[10px] uppercase tracking-[0.3em] lg:tracking-[0.4em] text-secondary font-black ml-4">Operational Status</h5>
            <div className="glass-card p-8 lg:p-10 rounded-[32px] lg:rounded-[40px] border border-white/5 space-y-4 lg:space-y-6">
              <div className="flex justify-between items-center pb-3 lg:pb-4 border-b border-white/5">
                <span className="text-xs lg:text-sm text-secondary">Concierge</span>
                <span className="text-[10px] lg:text-xs text-emerald font-bold uppercase tracking-widest">24/7 Active</span>
              </div>
              <div className="flex justify-between items-center pb-3 lg:pb-4 border-b border-white/5">
                <span className="text-xs lg:text-sm text-secondary">Kitchen Terminal</span>
                <span className="text-[10px] lg:text-xs text-emerald font-bold uppercase tracking-widest">12:00 - 02:00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs lg:text-sm text-secondary">Vantage Lounge</span>
                <span className="text-[10px] lg:text-xs text-emerald font-bold uppercase tracking-widest">16:00 - LATE</span>
              </div>
              <motion.button 
                whileHover={hover2X}
                className="w-full py-4 bg-emerald text-black font-black uppercase text-[9px] lg:text-[10px] tracking-[0.3em] lg:tracking-[0.4em] rounded-2xl mt-4"
              >
                Send Message
              </motion.button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
