import { 
  ChevronRight, 
  X, 
  Gamepad2, 
  Beer, 
  Utensils, 
  Home, 
  Sun, 
  Trophy, 
  Heart, 
  Zap,
  Star,
  ArrowRight,
  MoveRight,
  Leaf
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import { useState, useEffect, useRef } from "react";

interface Feature {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  desc: string;
  fullContent: string;
  icon: any;
  category: string;
}

const features: Feature[] = [
  {
    id: "garden",
    title: "The Zen Garden",
    subtitle: "Emerald Peace",
    img: "/images/WhatsApp Image 2026-04-21 at 19.35.31 (1).jpeg",
    desc: "A sanctuary where the Serengeti whisper meets the Kyoto breeze.",
    fullContent: "The Zen Garden is designed as a meditative space for our guests. Featuring tropical flora from across the African continent and minimalist stone elements inspired by Kyoto's famous gardens, it offers a unique atmosphere for afternoon tea or evening cocktails under the stars.",
    icon: Leaf,
    category: "Lounge"
  },
  {
    id: "pool",
    title: "Celestial Pool",
    subtitle: "Silver & Serenity",
    img: "/images/IMG_0093 2.PNG",
    desc: "Dive into a temperature-controlled infinity experience under the Lagos skyline. ₦15,000 Access.",
    fullContent: "Our temperature-controlled infinity pool offers panoramic views of Victoria Island. Guests enjoy all-day access with premium towel service, specialized poolside Afro-Asian snacks, and an underwater sound system playing curated ambient beats.",
    icon: Sun,
    category: "Outdoor Leisure"
  },
  {
    id: "snooker",
    title: "Vantage Snooker",
    subtitle: "Tactile Precision",
    img: "/images/snooker.jpg",
    desc: "Mahogany, leather, and championship-grade play. ₦10,000 per hour.",
    fullContent: "The Vantage Lounge features championship-standard tables with premium West of England cloth. Our lounge offers a curated selection of cigars and rare whiskies to complement your game. Whether you are a seasoned pro or a casual player, the ambiance of mahogany and leather provides the perfect backdrop for precision play.",
    icon: Trophy,
    category: "Gaming"
  },
  {
    id: "suites",
    title: "Celestial Suites",
    subtitle: "Golden Living",
    img: "/images/WhatsApp Image 2026-04-21 at 19.35.32 (10).jpeg",
    desc: "VIP apartments featuring PS5 gaming and 24/7 concierge. Starting ₦50,000.",
    fullContent: "Our apartments range from 1-bedroom executive studios (₦50,000) to 3-bedroom VIP penthouses (₦150,000). Each unit features smart home integration, private balconies overlooking the city, 24/7 concierge service, and high-speed fiber internet.",
    icon: Home,
    category: "Stay"
  },
  {
    id: "kitchen",
    title: "Silk Road Kitchen",
    subtitle: "Crossroads",
    img: "/images/WhatsApp Image 2026-04-21 at 19.35.32 (1).jpeg",
    desc: "Bold African spice palette applied with meticulous Asian precision.",
    fullContent: "Headed by award-winning chefs, our kitchen serves a rotating seasonal menu. Signature dishes include Suya-spiced Wagyu Ribeye, Miso-glazed Jollof Risotto, and Peri-Peri Gyoza. Every plate is a crossroads of flavor, meticulously plated for visual and sensory impact.",
    icon: Utensils,
    category: "Restaurant"
  }
];

const hubspotImages = [
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (4).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (5).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (6).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (7).jpeg",
  "/images/WhatsApp Image 2026-04-21 at 19.35.32 (8).jpeg"
];

const heroSlides = [
  {
    img: "/images/WhatsApp Image 2026-04-21 at 19.35.31 (1).jpeg",
    title: "Silver Skies, Golden Earth",
    subtitle: "SYMPHONY OF ELEMENTS"
  },
  {
    img: "/images/IMG_0093 2.PNG",
    title: "Aquatic Serenity",
    subtitle: "METALLIC FLOW"
  },
  {
    img: "/images/snooker.jpg",
    title: "Precision & Play",
    subtitle: "ELITE LEISURE"
  }
];

const HeroStar = ({ className = "", color = "text-gold" }: { className?: string, color?: string }) => (
  <div className={`relative ${className}`}>
    <Star className={`${color} fill-current`} size={16} />
    <motion.div 
      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.2, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
      className={`absolute inset-0 rounded-full blur-md ${color === "text-emerald" ? "bg-emerald" : color === "text-silver" ? "bg-silver" : "bg-gold"}`}
    />
  </div>
);

const SectionHeading = ({ subtitle, title, color = "gold" }: { subtitle: string, title: string, color?: "gold" | "silver" | "emerald" }) => (
  <div className="space-y-4 mb-16">
    <div className="flex items-center gap-4">
      <HeroStar color={`text-${color}`} />
      <span className={`text-${color} text-[10px] font-bold tracking-[0.4em] uppercase`}>{subtitle}</span>
    </div>
    <h2 className="text-4xl md:text-6xl font-serif text-primary leading-tight">{title}</h2>
  </div>
);

export const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [activeFact, setActiveFact] = useState(0);
  const [hubspotIndex, setHubspotIndex] = useState(0);
  
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    const factTimer = setInterval(() => {
      setActiveFact((prev) => (prev + 1) % funnyFacts.length);
    }, 4000);
    const hubspotTimer = setInterval(() => {
      setHubspotIndex((prev) => (prev + 1) % hubspotImages.length);
    }, 3000);
    return () => {
      clearInterval(slideTimer);
      clearInterval(factTimer);
      clearInterval(hubspotTimer);
    };
  }, []);

  const funnyFacts = [
    { text: "Our emerald garden is so green, even the shadows have a touch of jade.", icon: Leaf },
    { text: "The silver finish on our pool is mineral-treated for a literal liquid-metal feel.", icon: Zap },
    { text: "Legend says our 3-Bedroom suite has a hidden portal to a PS6 prototype.", icon: Gamepad2 }
  ];

  return (
    <div className="bg-primary text-primary min-h-screen">
      {/* Hero Section with Parallax */}
      <section ref={heroRef} className="relative h-screen w-full overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-0"
          >
            <motion.div style={{ y }} className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-primary z-10" />
              <img
                src={heroSlides[currentSlide].img}
                alt="Hero"
                className="w-full h-full object-cover scale-110"
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            key={`content-${currentSlide}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-6"
          >
            <div className="flex justify-center mb-4">
              <HeroStar color="text-silver" />
            </div>
            <span className="text-silver text-[12px] font-bold tracking-[0.6em] uppercase">
              {heroSlides[currentSlide].subtitle}
            </span>
            <h1 className="text-6xl md:text-9xl font-serif text-white leading-tight">
              {heroSlides[currentSlide].title.split(" ").map((word, i) => (
                <span key={i} className={i === 1 ? "text-emerald italic" : i === 2 ? "text-gold" : ""}>{word} </span>
              ))}
            </h1>
            <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
              <Link to="/orders" className="group flex items-center gap-3 px-12 py-5 bg-gold text-black font-black uppercase text-[10px] tracking-widest hover:brightness-110 transition-all shadow-xl shadow-gold/10">
                Establish Reservation <MoveRight className="group-hover:translate-x-2 transition-transform" size={16} />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-6">
          <span className="text-silver/30 text-[10px] font-mono font-bold tracking-widest">01</span>
          <div className="flex gap-2">
            {heroSlides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-[2px] transition-all duration-500 ${currentSlide === i ? "w-16 bg-gold" : "w-4 bg-white/10"}`}
              />
            ))}
          </div>
          <span className="text-silver/30 text-[10px] font-mono font-bold tracking-widest">0{heroSlides.length}</span>
        </div>
      </section>

      {/* Signature Vibe Section (Z-Pattern) */}
      <section className="py-32 px-8 max-w-7xl mx-auto space-y-40">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <SectionHeading subtitle="Our Philosophy" title="African Soul, Asian Precision" color="emerald" />
            <p className="text-lg text-secondary leading-relaxed font-light">
              Brightstar Cave is more than a destination; it's a crossroads. We've meticulously woven the vibrant, earthy spirit of West Africa with the quiet, disciplined elegance of the East.
            </p>
            <div className="flex items-center gap-2">
              <div className="emerald-dot" />
              <span className="text-[10px] uppercase tracking-widest text-emerald font-bold">Nature-Synchronized</span>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="absolute -inset-4 border border-silver translate-x-4 translate-y-4 opacity-10" />
            <img 
              src="/images/WhatsApp Image 2026-04-21 at 19.35.32 (10).jpeg" 
              className="relative z-10 w-full aspect-[4/5] object-cover grayscale-[0.6] hover:grayscale-0 transition-all duration-700 rounded-2xl shadow-2xl" 
            />
          </motion.div>
        </div>

        {/* HubSpot Sleek Slider */}
        <div className="py-20">
          <SectionHeading subtitle="The Hubspot" title="Sleek Visual Flow" color="silver" />
          <div className="relative h-[600px] rounded-[32px] overflow-hidden glass-emerald group border border-white/5">
            <AnimatePresence mode="wait">
              <motion.div
                key={hubspotIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.8, ease: "anticipate" }}
                className="absolute inset-0"
              >
                <img src={hubspotImages[hubspotIndex]} className="w-full h-full object-cover grayscale-[0.2]" alt="Hubspot" />
                <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-90" />
              </motion.div>
            </AnimatePresence>
            
            <div className="absolute bottom-10 left-10 z-20">
              <p className="text-emerald font-mono text-[10px] tracking-[0.4em] mb-2 uppercase font-bold">ELEMENTAL FEED</p>
              <h3 className="text-2xl font-serif text-white">Vibe Synchronization</h3>
            </div>

            <div className="absolute bottom-10 right-10 z-20 flex gap-2">
              {hubspotImages.map((_, i) => (
                <div 
                  key={i} 
                  className={`size-1.5 rounded-full transition-all duration-500 ${hubspotIndex === i ? "w-8 bg-emerald" : "bg-white/10"}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Guest Journey */}
      <section className="py-32 bg-secondary/30 border-y border-white/5 overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <SectionHeading subtitle="The Sequence" title="Your Experience Journey" color="gold" />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24 relative mt-20">
            {[
              { step: "01", label: "Arrival", desc: "Pass through the Obsidian Gates into the Zen Garden." },
              { step: "02", label: "Vantage", desc: "A frame of snooker accompanied by 18-year aged Scotch." },
              { step: "03", label: "Crossroads", desc: "Dinner at Silk Road—where Suya meets Miso." },
              { step: "04", label: "Stellar", desc: "Retire to the Celestial Suites for a zero-gravity rest." }
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group relative"
              >
                <span className="absolute -top-16 -left-4 text-[120px] font-serif text-white/[0.02] leading-none select-none group-hover:text-gold/[0.05] transition-colors pointer-events-none">
                  {item.step}
                </span>
                <div className="relative z-10 space-y-4">
                  <h4 className="text-xl font-bold tracking-[0.2em] text-primary uppercase">{item.label}</h4>
                  <div className="w-12 h-[1px] bg-silver/30 group-hover:w-full transition-all duration-700" />
                  <p className="text-sm text-secondary leading-relaxed font-light">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Asymmetric Collection Grid */}
      <section className="py-32 px-8 max-w-7xl mx-auto">
        <SectionHeading subtitle="The Selection" title="Boutique Experiences" color="silver" />

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setSelectedFeature(feature)}
              className={`group relative h-[600px] overflow-hidden rounded-[32px] cursor-pointer glass-card border-white/5 ${
                i === 0 || i === 3 ? "md:col-span-7" : "md:col-span-5"
              } hover:border-emerald/20 transition-all`}
            >
              <motion.img
                src={feature.img}
                alt={feature.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-30 group-hover:opacity-100 grayscale-[1] group-hover:grayscale-0"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-transparent to-transparent opacity-95" />
              
              <div className="absolute top-8 right-8">
                <HeroStar color={i % 2 === 0 ? "text-emerald" : "text-gold"} />
              </div>

              <div className="absolute bottom-0 left-0 p-12 w-full">
                <span className="text-silver text-[10px] font-bold tracking-[0.4em] uppercase mb-3 block">{feature.category}</span>
                <h4 className="text-4xl font-serif text-white mb-4">{feature.title}</h4>
                <div className="flex items-center gap-3 text-silver text-[10px] font-bold uppercase tracking-widest translate-y-10 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                  Access Protocol <ArrowRight size={14} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Wellness & Wit Section */}
      <section className="py-32 bg-secondary/10 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20">
          <div className="space-y-12">
            <SectionHeading subtitle="Curated Wit" title="Observations from the Cave" color="silver" />
            <div className="h-40 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFact}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex items-start gap-8"
                >
                  <div className="p-5 bg-silver/5 rounded-full text-silver shrink-0 border border-white/5">
                    {(() => {
                      const FactIcon = funnyFacts[activeFact].icon;
                      return <FactIcon size={32} />;
                    })()}
                  </div>
                  <p className="text-2xl font-light leading-relaxed italic text-secondary">
                    "{funnyFacts[activeFact].text}"
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-12">
            <SectionHeading subtitle="Heal Tips" title="The Wellness Log" color="emerald" />
            <div className="grid gap-8">
              {healthTips.map((tip, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="p-8 glass-emerald rounded-3xl flex gap-8 group hover:border-emerald/40 transition-all"
                >
                  <div className="text-emerald group-hover:rotate-12 transition-transform duration-500">
                    <tip.icon size={30} />
                  </div>
                  <div>
                    <h5 className="font-bold text-sm uppercase tracking-widest text-primary mb-3">{tip.title}</h5>
                    <p className="text-sm text-secondary leading-relaxed font-light">{tip.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Detail Modal */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-bg-primary/98 backdrop-blur-2xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-6xl bg-bg-secondary border border-white/5 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col lg:flex-row h-full">
                <div className="lg:w-1/2 h-64 lg:h-auto relative overflow-hidden">
                  <motion.img 
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    src={selectedFeature.img} 
                    alt={selectedFeature.title} 
                    className="w-full h-full object-cover grayscale-[0.8]" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-bg-secondary via-transparent to-transparent hidden lg:block" />
                </div>

                <div className="lg:w-1/2 p-16 overflow-y-auto no-scrollbar flex flex-col">
                  <div className="flex justify-between items-start mb-12">
                    <div className="flex items-center gap-4">
                      <HeroStar color="text-silver" />
                      <span className="text-silver text-[10px] font-bold tracking-[0.6em] uppercase">{selectedFeature.category}</span>
                    </div>
                    <button 
                      onClick={() => setSelectedFeature(null)}
                      className="p-3 rounded-full border border-white/10 text-secondary hover:bg-emerald hover:text-black transition-all"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <h2 className="text-6xl font-serif text-white mb-8">{selectedFeature.title}</h2>
                  <p className="text-xl text-emerald font-light italic mb-10 leading-relaxed">
                    "{selectedFeature.desc}"
                  </p>
                  
                  <div className="space-y-8 text-secondary font-light leading-relaxed mb-16 text-lg">
                    {selectedFeature.fullContent}
                  </div>

                  <div className="mt-auto flex flex-col sm:flex-row gap-6">
                    <Link to="/orders" className="flex-1 text-center py-5 bg-gold text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all flex items-center justify-center gap-3">
                      Begin Reservation <MoveRight size={16} />
                    </Link>
                    <button 
                      onClick={() => setSelectedFeature(null)}
                      className="px-10 py-5 border border-white/10 text-secondary font-bold uppercase tracking-widest text-[10px] hover:bg-white/5 transition-all"
                    >
                      Return to Hub
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Experience Stats */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { val: "24/7", label: "VIP Concierge" },
            { val: "0.0ms", label: "Gaming Latency" },
            { val: "12k", label: "Curated Cocktails" },
            { val: "30+", label: "Fusion Dishes" }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              <h5 className="text-4xl md:text-5xl font-serif text-silver mb-2">{stat.val}</h5>
              <p className="text-[10px] text-secondary uppercase tracking-[0.3em] font-bold">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

const healthTips = [
  { title: "Afro-Asian Wellness", text: "Ginger and Turmeric in our fusion dishes are your best friends for gut health and immunity.", icon: Heart },
  { title: "Active Play", text: "A focused game of Snooker can burn up to 100 calories per hour of walking and stretching.", icon: Trophy },
  { title: "Hydration Logic", text: "Balance is key: For every signature cocktail at The Obsidian, enjoy a glass of our chilled hibiscus water.", icon: Sun }
];
