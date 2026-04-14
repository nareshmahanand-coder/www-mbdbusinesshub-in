/* ═══════════════════════════════════════════════════════════════════════
   SKILL DEVELOPMENT — Complete E-Book Library Data
   Every book has chapters → pages with detailed Hindi theory & diagrams
   ═══════════════════════════════════════════════════════════════════════ */

import { mobileRepairExpandedChapters, tallyExpandedChapters } from "./skillBooksExpanded";

export interface BookPage {
  title: string;
  content: string; // Full Hindi text with **bold** markers
  diagram?: string; // ASCII/text diagram
}

export interface Chapter {
  title: string;
  pages: BookPage[];
}

export interface Book {
  id: string;
  title: string;
  titleHi: string;
  icon: string; // emoji
  description: string;
  totalPages: number;
  chapters: Chapter[];
  govtPdfUrl?: string; // Link to official govt e-book PDF
  govtPdfLabel?: string; // Label for the govt PDF button
}

export interface PdfItem {
  id: string;
  titleHi: string;
  titleEn: string;
  icon: string;
  pdfUrl: string;
  tags: string[];
}

export interface BookCategory {
  id: string;
  title: string;
  titleHi: string;
  color: string;
  descriptionHi?: string;
  books: Book[];
  pdfLibrary?: PdfItem[];
}

/* ─── Helper: count pages ─── */
const countPages = (chapters: Chapter[]) => chapters.reduce((s, c) => s + c.pages.length, 0);

/* ══════════════════════════════════════════
   1. MOBILE REPAIRING — Complete Textbook
   ══════════════════════════════════════════ */
const mobileRepairBook: Book = {
  id: "mobile-repair",
  title: "Mobile Repairing",
  titleHi: "मोबाइल रिपेयरिंग — संपूर्ण गाइड",
  icon: "📱",
  description: "मोबाइल फोन रिपेयरिंग A-Z, Hardware + Software",
  totalPages: 0,
  chapters: [
    {
      title: "अध्याय 1: मोबाइल फोन का परिचय और इतिहास",
      pages: [
        {
          title: "मोबाइल फोन क्या है?",
          content: `**मोबाइल फोन** एक इलेक्ट्रॉनिक डिवाइस है जो **रेडियो तरंगों (Radio Waves)** के माध्यम से बिना तार के संचार (Wireless Communication) करता है।

**मोबाइल फोन के प्रकार:**
• **Feature Phone** — बेसिक कॉलिंग और SMS, जैसे Nokia 1100
• **Smartphone** — टच स्क्रीन, ऑपरेटिंग सिस्टम (Android/iOS), कैमरा, इंटरनेट
• **Tablet** — बड़ी स्क्रीन (7-12 इंच), कम कॉलिंग, ज्यादा मल्टीमीडिया

**मोबाइल का इतिहास:**
• 1983 — **Motorola DynaTAC** — दुनिया का पहला मोबाइल फोन (₹2 लाख, 1 kg वजन)
• 1992 — **Nokia 1011** — पहला GSM फोन
• 2007 — **Apple iPhone** — पहला आधुनिक स्मार्टफोन (टच स्क्रीन क्रांति)
• 2008 — **Android** ऑपरेटिंग सिस्टम लॉन्च (Google)
• 2014+ — **4G LTE** क्रांति, सस्ते स्मार्टफोन (Jio Effect)
• 2020+ — **5G** टेक्नोलॉजी, Foldable Phones

**मोबाइल रिपेयरिंग क्यों सीखें:**
• भारत में **80+ करोड़** स्मार्टफोन यूज़र हैं
• हर गली-मोहल्ले में रिपेयर की **ज़बरदस्त डिमांड**
• कम पूंजी में बिज़नेस शुरू — **₹25,000-50,000** में पूरा सेटअप
• महीने की **₹30,000-80,000** कमाई संभव`,
          diagram: `┌──────────────────────────────────────────────┐
│           मोबाइल फोन — ब्लॉक डायग्राम           │
├──────────────────────────────────────────────┤
│                                              │
│   ┌─────────┐    ┌──────────┐               │
│   │ Battery │───→│ PMIC     │──→ All ICs    │
│   │ 3.7-4.4V│    │(Power IC)│               │
│   └─────────┘    └──────────┘               │
│                       │                      │
│   ┌─────────┐    ┌────┴─────┐               │
│   │Charging │───→│ CPU/SoC  │──→ RAM        │
│   │ Port    │    │(Processor)│              │
│   └─────────┘    └────┬─────┘               │
│                       │                      │
│   ┌─────────┐    ┌────┴─────┐               │
│   │ Display │←──→│ Display  │               │
│   │ (LCD/   │    │ Driver IC│               │
│   │ AMOLED) │    └──────────┘               │
│   └─────────┘                                │
│                                              │
│   ┌─────────┐    ┌──────────┐               │
│   │ Camera  │←──→│ ISP      │               │
│   │ Module  │    │(Image IC)│               │
│   └─────────┘    └──────────┘               │
│                                              │
│   ┌─────────┐    ┌──────────┐               │
│   │ Antenna │←──→│ RF IC    │──→ Network    │
│   │ (Signal)│    │(Modem)   │   2G/3G/4G/5G│
│   └─────────┘    └──────────┘               │
│                                              │
│   ┌─────────┐    ┌──────────┐               │
│   │Speaker/ │←──→│ Audio IC │               │
│   │  Mic    │    │(Codec)   │               │
│   └─────────┘    └──────────┘               │
│                                              │
│   ┌─────────┐    ┌──────────┐               │
│   │WiFi/BT  │←──→│ WiFi IC  │               │
│   │Antenna  │    │(Combo)   │               │
│   └─────────┘    └──────────┘               │
└──────────────────────────────────────────────┘`
        },
        {
          title: "मोबाइल फोन के मुख्य पार्ट्स",
          content: `**1. PCB (Printed Circuit Board) — मदरबोर्ड:**
यह मोबाइल का **दिमाग** है। सभी IC (Integrated Circuits) इसी पर लगे होते हैं।
• **CPU/SoC**: Qualcomm Snapdragon, MediaTek Helio/Dimensity, Samsung Exynos
• **RAM**: LPDDR4x / LPDDR5 — 4GB, 6GB, 8GB, 12GB
• **Storage**: eMMC (पुराने) / UFS 3.1 (नए) — 64GB, 128GB, 256GB

**2. Display (स्क्रीन):**
• **LCD (Liquid Crystal Display)** — सस्ता, अच्छी brightness, IPS technology
• **AMOLED** — गहरे काले रंग, बेहतर contrast, कम बिजली खपत
• **Super AMOLED** — Samsung, सबसे अच्छा color reproduction
• **Resolution**: HD (720p), FHD (1080p), QHD (1440p)

**3. Battery:**
• **Li-Ion (Lithium Ion)** — पुराने फोन
• **Li-Po (Lithium Polymer)** — नए फोन, पतली, हल्की, ज्यादा capacity
• **Voltage**: 3.7V (nominal), 4.2V (full charge), 3.0V (empty)
• **mAh**: 3000-6000 mAh (modern phones)
• **Fast Charging**: 18W, 33W, 65W, 120W (Qualcomm QC, USB PD, VOOC)

**4. Camera Module:**
• **Rear Camera**: Main (50MP+), Ultra-wide, Macro, Depth sensor
• **Front Camera**: 8-32 MP, कुछ में motorized pop-up
• **Autofocus Types**: PDAF, Laser AF, Dual Pixel AF
• **OIS**: Optical Image Stabilization (हिलने पर भी साफ फोटो)

**5. Charging Port:**
• **Micro USB** — पुराने फोन
• **USB Type-C** — नए फोन (reversible, fast data + charging)
• **Lightning** — Apple iPhone

**6. अन्य पार्ट्स:**
• **Speaker**: Mono / Stereo
• **Vibration Motor**: Linear / Rotary
• **Sensors**: Proximity, Accelerometer, Gyroscope, Fingerprint
• **SIM Tray**: Nano SIM, Dual SIM, eSIM`,
          diagram: `┌────────────────────────────────────────────┐
│        स्मार्टफोन — एक्सप्लोडेड व्यू          │
├────────────────────────────────────────────┤
│                                            │
│  Layer 1 (सबसे ऊपर):                       │
│  ┌──────────────────────────────────┐      │
│  │     Glass/Gorilla Glass         │      │
│  │     (स्क्रीन सुरक्षा)            │      │
│  └──────────────────────────────────┘      │
│                                            │
│  Layer 2:                                  │
│  ┌──────────────────────────────────┐      │
│  │  Touch Digitizer (टच सेंसर)      │      │
│  │  ─ Capacitive Touch Panel ─      │      │
│  └──────────────────────────────────┘      │
│                                            │
│  Layer 3:                                  │
│  ┌──────────────────────────────────┐      │
│  │  LCD / AMOLED Display Panel      │      │
│  │  (चित्र दिखाने वाला पैनल)        │      │
│  └──────────────────────────────────┘      │
│                                            │
│  Layer 4:                                  │
│  ┌──────────────────────────────────┐      │
│  │         MOTHERBOARD (PCB)        │      │
│  │  ┌────┐ ┌────┐ ┌────┐ ┌────┐   │      │
│  │  │CPU │ │RAM │ │PMIC│ │WiFi│   │      │
│  │  └────┘ └────┘ └────┘ └────┘   │      │
│  │  ┌────┐ ┌────┐ ┌────┐          │      │
│  │  │RF  │ │Audio││eMMC│          │      │
│  │  └────┘ └────┘ └────┘          │      │
│  └──────────────────────────────────┘      │
│                                            │
│  Layer 5:                                  │
│  ┌──────────────────────────────────┐      │
│  │     Battery (Li-Po Cell)         │      │
│  │     3.7V / 4000-5000 mAh        │      │
│  └──────────────────────────────────┘      │
│                                            │
│  Layer 6 (सबसे नीचे):                      │
│  ┌──────────────────────────────────┐      │
│  │  Back Cover (Plastic/Glass/Metal)│      │
│  └──────────────────────────────────┘      │
└────────────────────────────────────────────┘`
        },
        {
          title: "आवश्यक उपकरण (Tools & Equipment)",
          content: `**मोबाइल रिपेयरिंग शुरू करने के लिए ये उपकरण ज़रूरी हैं:**

**1. स्क्रू ड्राइवर सेट (Screwdriver Set):**
• Pentalobe (iPhone), Phillips (+), Tri-wing, Torx
• **Precision Set** (0.8mm से 2.0mm तक) — अलग-अलग फोन के लिए अलग स्क्रू
• Y-type (Xiaomi, Samsung कुछ models)

**2. मल्टीमीटर (Multimeter):**
• **DC Voltage** (V): बैटरी और IC voltage check (0-20V रेंज)
• **Resistance** (Ω): शॉर्ट सर्किट, ओपन सर्किट पता करना
• **Continuity** (🔔): तार या ट्रैक जुड़ा है या टूटा — beep आए तो जुड़ा
• **Capacitance** (F): कैपेसिटर test करना
• **Recommended**: UNI-T UT61E या Fluke 17B+

**3. सोल्डरिंग स्टेशन (Soldering Station):**
• **Temperature Range**: 200°C - 480°C (adjustable)
• **Tip Types**: Pointed (fine work), Chisel (wider joints), Knife (drag soldering)
• **Recommended**: Hakko FX-888D या Quick 861DW (Hot Air)

**4. हीट गन / Hot Air Rework Station:**
• **Temperature**: 100°C - 500°C
• **Air Flow**: Adjustable (BGA work के लिए 350°C, 45% air)
• **Nozzle Set**: Round (5mm-12mm) — IC size के हिसाब से
• **Use**: IC remove/replace, Glass change, Back cover open

**5. DC पावर सप्लाई (DC Power Supply):**
• **Output**: 0-30V, 0-5A (adjustable)
• **Display**: Current (Ampere) दिखाता है
• **Use**: शॉर्ट सर्किट detect — बिना बैटरी के फोन को पावर देना
• शॉर्ट है तो **Ampere तुरंत बढ़ जाएगा** (0.5A+ = short)

**6. माइक्रोस्कोप (Microscope):**
• **Magnification**: 10x-45x (Binocular preferred)
• **Use**: छोटे components देखना, solder joints check, trace finding
• **Budget Option**: USB Digital Microscope (₹2,000-5,000)

**7. अन्य ज़रूरी उपकरण:**
• **Spudger** (प्लास्टिक/मेटल) — कनेक्टर खोलने के लिए
• **Suction Cup** — स्क्रीन उठाने के लिए
• **Tweezers** (ESD safe) — छोटे पार्ट्स पकड़ने के लिए
• **IPA (Isopropyl Alcohol) 99%** — बोर्ड सफाई
• **Flux** (Amtech, RMA-223) — सोल्डरिंग में ज़रूरी
• **Solder Wire** (0.3mm-0.5mm, 63/37 Tin-Lead)
• **Kapton Tape** (Heat resistant) — IC protect करने के लिए
• **BGA Stencils** — Reballing के लिए
• **NAND Programmer** (IP Box, JC Pro) — iPhone data recovery`,
          diagram: `┌──────────────────────────────────────────────┐
│         मोबाइल रिपेयरिंग — टूलकिट सेटअप          │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │          Work Desk (4x2 ft)         │     │
│  │                                     │     │
│  │  ┌───────┐  ┌───────┐  ┌───────┐   │     │
│  │  │Solder │  │Hot Air│  │DC PSU │   │     │
│  │  │Station│  │Rework │  │0-30V  │   │     │
│  │  │200-480°│ │100-500°│ │0-5A   │   │     │
│  │  └───────┘  └───────┘  └───────┘   │     │
│  │                                     │     │
│  │  ┌───────┐  ┌───────┐  ┌───────┐   │     │
│  │  │Multi- │  │Micro- │  │UV     │   │     │
│  │  │meter  │  │scope  │  │Lamp   │   │     │
│  │  └───────┘  └───────┘  └───────┘   │     │
│  │                                     │     │
│  │  ┌─────────────────────────────┐   │     │
│  │  │    ESD Mat (Anti-static)    │   │     │
│  │  │  ┌──────┐ ┌──────┐         │   │     │
│  │  │  │Phone │ │Parts │         │   │     │
│  │  │  │Work  │ │Tray  │         │   │     │
│  │  │  └──────┘ └──────┘         │   │     │
│  │  └─────────────────────────────┘   │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  कुल Setup Cost: ₹25,000 - ₹1,00,000        │
│  Basic: ₹25K | Professional: ₹1L            │
└──────────────────────────────────────────────┘`
        },
      ],
    },
    {
      title: "अध्याय 2: मोबाइल हार्डवेयर — गहन अध्ययन",
      pages: [
        {
          title: "CPU/SoC (प्रोसेसर) — दिमाग",
          content: `**SoC (System on Chip)** मोबाइल का सबसे महत्वपूर्ण IC है। इसमें CPU, GPU, Modem, ISP सब एक चिप में होते हैं।

**प्रमुख SoC निर्माता:**
• **Qualcomm Snapdragon**: 8 Gen 3 (flagship), 7 Gen 3 (mid), 4 Gen 2 (budget)
• **MediaTek**: Dimensity 9300 (flagship), Helio G99 (budget king)
• **Samsung Exynos**: 2400 (Galaxy S series)
• **Apple A-series**: A17 Pro (iPhone 15 Pro) — सबसे तेज़

**CPU Architecture:**
• **ARM** आर्किटेक्चर पर आधारित (x86 नहीं, जो laptop/PC में होता है)
• **Cortex-A78/X3**: Performance cores (भारी काम)
• **Cortex-A55**: Efficiency cores (हल्का काम, बैटरी बचत)
• **big.LITTLE**: बड़े + छोटे cores साथ — Performance + Battery balance

**Process Node:**
• **nm (nanometer)** — जितना कम, उतना बेहतर
• 4nm/5nm = current flagship (कम बिजली, ज्यादा speed)
• 7nm = mid-range (अभी भी अच्छा)
• 12nm = budget (ज्यादा गर्मी, कम efficient)

**GPU (Graphics Processing Unit):**
• **Adreno** (Qualcomm) — gaming और display processing
• **Mali** (MediaTek/Samsung) — ARM design
• **Apple GPU** — custom design, सबसे efficient

**अगर CPU खराब हो तो:**
• फोन बिल्कुल **चालू नहीं होगा** (Dead condition)
• **Reballing** से कभी-कभी ठीक हो जाता है
• ज्यादातर cases में **motherboard change** करना पड़ता है
• CPU standalone नहीं मिलता — पूरा SoC change होता है`,
          diagram: `┌──────────────────────────────────────────────┐
│        SoC (System on Chip) — Internal View     │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │              QUALCOMM SD 8 Gen 3         │ │
│  │                                         │ │
│  │  ┌───────────────┐ ┌────────────────┐   │ │
│  │  │    CPU Block   │ │   GPU Block    │   │ │
│  │  │               │ │                │   │ │
│  │  │ 1x Cortex-X4  │ │   Adreno 750   │   │ │
│  │  │ (3.3 GHz)     │ │   (Graphics)   │   │ │
│  │  │               │ │                │   │ │
│  │  │ 3x Cortex-A720│ │   Ray Tracing  │   │ │
│  │  │ (3.15 GHz)    │ │   Support      │   │ │
│  │  │               │ │                │   │ │
│  │  │ 4x Cortex-A520│ └────────────────┘   │ │
│  │  │ (2.27 GHz)    │                      │ │
│  │  └───────────────┘                      │ │
│  │                                         │ │
│  │  ┌────────┐ ┌────────┐ ┌────────────┐  │ │
│  │  │  5G    │ │  ISP   │ │    NPU     │  │ │
│  │  │ Modem  │ │(Camera)│ │  (AI/ML)   │  │ │
│  │  │X75     │ │Spectra │ │ Hexagon    │  │ │
│  │  └────────┘ └────────┘ └────────────┘  │ │
│  │                                         │ │
│  │  Process: TSMC 4nm | TDP: ~8.5W        │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Pin Count: ~1200+ BGA balls (underneath)    │
│  Size: ~12mm x 12mm                         │
└──────────────────────────────────────────────┘`
        },
        {
          title: "PMIC (Power Management IC)",
          content: `**PMIC** मोबाइल का **बिजली विभाग** है। बैटरी से आने वाली एक voltage को अलग-अलग voltages में बदलकर हर IC को सही पावर देता है।

**PMIC के मुख्य काम:**
• बैटरी **चार्जिंग** कंट्रोल (CC-CV method)
• **Voltage Regulation** — 3.7V बैटरी से 1.0V (CPU), 1.8V (RAM), 3.3V (SD card) बनाना
• **Power Sequencing** — कौन सा IC पहले ON होगा, कौन सा बाद में
• **Sleep Mode** — जब फोन idle हो तो बिजली बचाना
• **Over-voltage/Over-current Protection** — सुरक्षा

**PMIC से जुड़ी समस्याएं:**
• **फोन चार्ज नहीं होता** — PMIC का charging section खराब
• **बैटरी जल्दी खत्म** — Leakage current (PMIC internal short)
• **फोन ON नहीं होता** — Main power rail generate नहीं हो रही
• **Restart बार-बार** — Voltage fluctuation

**PMIC Testing:**
• **Multimeter** से output voltages check करें
• **Schematic diagram** ज़रूरी — हर model का अलग PMIC होता है
• **Common PMIC ICs**: Qualcomm PM8150, Samsung S2MPS19

**PMIC बदलना:**
• **Hot Air** (350-380°C) से पुरानी IC हटाएं
• **Reballing** करें (Stencil + Solder Balls)
• नई IC रखें, **Reflow** करें
• सभी output voltages verify करें
• ⚠️ यह **Advanced Level** का काम है — Practice ज़रूरी`,
          diagram: `┌──────────────────────────────────────────────┐
│     PMIC — Power Distribution Diagram          │
├──────────────────────────────────────────────┤
│                                              │
│  Battery (3.7V-4.2V)                         │
│       │                                      │
│       ▼                                      │
│  ┌─────────────────────────────────────┐     │
│  │              PMIC                    │     │
│  │                                     │     │
│  │  ┌──────────┐  Output Rails:        │     │
│  │  │Charging  │                       │     │
│  │  │Controller│  → VDD_CPU: 0.6-1.2V  │     │
│  │  └──────────┘    (प्रोसेसर के लिए)   │     │
│  │                                     │     │
│  │  ┌──────────┐  → VDD_MEM: 1.1V     │     │
│  │  │  LDO     │    (RAM के लिए)       │     │
│  │  │Regulators│                       │     │
│  │  └──────────┘  → VDD_IO: 1.8V      │     │
│  │                  (I/O interfaces)   │     │
│  │  ┌──────────┐                       │     │
│  │  │  Buck    │  → VDD_SD: 2.85/3.3V │     │
│  │  │Converters│    (SD Card/SIM)      │     │
│  │  └──────────┘                       │     │
│  │                → VDD_LCD: 5.5V      │     │
│  │  ┌──────────┐    (Display Backlight)│     │
│  │  │  Boost   │                       │     │
│  │  │Converter │  → VDD_CAM: 2.8V     │     │
│  │  └──────────┘    (Camera Module)    │     │
│  │                                     │     │
│  │  Protection: OVP, OCP, OTP, UVLO   │     │
│  └─────────────────────────────────────┘     │
│                                              │
│  Testing: Multimeter → Check each rail       │
│  No output = PMIC fault → Replace            │
└──────────────────────────────────────────────┘`
        },
        {
          title: "Display और Touch — LCD/AMOLED",
          content: `**Display** मोबाइल का सबसे **महंगा पार्ट** है। इसे समझना और रिपेयर करना बहुत ज़रूरी है।

**LCD (Liquid Crystal Display):**
• **TFT LCD** — सबसे सस्ता, कमजोर viewing angles, कम brightness
• **IPS LCD** — बेहतर colors, wide viewing angles, अच्छी brightness
• **Working**: Backlight → Liquid Crystals → Color Filters → Image
• Backlight हमेशा ON रहता है — इसलिए **काले रंग में भी बिजली खर्च**

**AMOLED (Active Matrix Organic LED):**
• हर pixel **खुद चमकता** है — अलग से backlight नहीं चाहिए
• **True Black** — pixel OFF = कोई light नहीं = बैटरी बचत
• **Thinner** — LCD से पतला, Flexible possible (curved/foldable)
• **Burn-in Risk** — एक ही image लंबे समय तक दिखाने से permanent mark

**Touch Digitizer:**
• **Capacitive Touch** — उंगली की electrical conductivity से काम करता है
• **On-Cell** — Touch layer Display के ऊपर (अलग-अलग बदल सकते हैं)
• **In-Cell** — Touch layer Display के अंदर (**एक साथ बदलना** पड़ता है)

**Display की समस्याएं और समाधान:**
• **टूटा हुआ Glass**: Only Glass change (OCA machine + Separator) — ₹300-800
• **Display काम नहीं**: Connector check → Display IC check → Display change
• **Touch काम नहीं**: Touch IC (U2402 type) → Connector → Full display
• **Lines आ रही हैं**: Flex cable damage → Display IC → Panel damage
• **Dim/Dark**: Backlight IC → LED strip (LCD) → Coil → Filter
• **Flickering**: Loose connector → Display IC → Software issue

**Glass Separation Process (OCA):**
1. **Separator Machine** पर फोन रखें (80-100°C)
2. **Molybdenum wire** से Glass अलग करें
3. **OCA Glue** remove करें (adhesive remover)
4. **नया OCA** लगाएं (Optical Clear Adhesive)
5. **नया Glass** रखें
6. **OCA Machine** में press करें (bubble remove)
7. **UV Lamp** से cure करें (5-10 min)
8. Test करें — Touch, Display, Colors सब check`,
          diagram: `┌──────────────────────────────────────────────┐
│      Display Assembly — Cross Section View     │
├──────────────────────────────────────────────┤
│                                              │
│  LCD Display:                                │
│  ┌────────────────────────────────────┐      │
│  │  Gorilla Glass (Protection)  ═══  │      │
│  ├────────────────────────────────────┤      │
│  │  Polarizer Film ─────────── ═══   │      │
│  ├────────────────────────────────────┤      │
│  │  Touch Digitizer (Capacitive)     │      │
│  ├────────────────────────────────────┤      │
│  │  OCA Glue (Optical Clear Adhesive)│      │
│  ├────────────────────────────────────┤      │
│  │  Color Filter (R, G, B)           │      │
│  ├────────────────────────────────────┤      │
│  │  Liquid Crystal Layer             │      │
│  ├────────────────────────────────────┤      │
│  │  TFT Array (Transistors)          │      │
│  ├────────────────────────────────────┤      │
│  │  Polarizer Film                   │      │
│  ├────────────────────────────────────┤      │
│  │  LED Backlight Unit               │      │
│  └────────────────────────────────────┘      │
│                                              │
│  AMOLED Display:                             │
│  ┌────────────────────────────────────┐      │
│  │  Gorilla Glass ════════════════    │      │
│  ├────────────────────────────────────┤      │
│  │  Touch Digitizer (In-Cell)        │      │
│  ├────────────────────────────────────┤      │
│  │  OLED Pixels (Self-Emitting)      │      │
│  │  R  G  B  R  G  B  R  G  B       │      │
│  │  ●  ●  ●  ●  ●  ●  ●  ●  ●      │      │
│  ├────────────────────────────────────┤      │
│  │  TFT Backplane                    │      │
│  ├────────────────────────────────────┤      │
│  │  Flexible Substrate               │      │
│  └────────────────────────────────────┘      │
│  ❌ No Backlight Needed!                      │
└──────────────────────────────────────────────┘`
        },
        {
          title: "Charging System — चार्जिंग सिस्टम",
          content: `**चार्जिंग** मोबाइल की सबसे **common problem** है। इसे पूरी तरह समझना ज़रूरी है।

**चार्जिंग का सर्किट फ्लो:**
Charger → USB Port → ESD Filter → Charging IC → Battery

**1. USB Port/Connector:**
• **Pin Configuration** (Type-C): VBUS (5V power), D+/D- (Data), CC1/CC2 (Connection detect), GND
• **Common Issues**: Pin bent, Corrosion, Loose solder joints
• **Fix**: Reflow solder joints → Pin cleaning → Port replace

**2. ESD Protection IC:**
• USB port के बाद सबसे पहले ESD IC आती है
• **Over-voltage protection** — 5V से ज्यादा आए तो block
• **Testing**: Diode mode में check — 0.4-0.7V normal reading
• **Shorted ESD IC**: Port से कोई voltage आगे नहीं जाएगी — IC बदलें

**3. Charging IC (PMIC Charging Section):**
• **CC-CV Charging Method**:
  - **CC (Constant Current)**: पहले तेज़ चार्ज — fixed current (1A-6A) देता है
  - **CV (Constant Voltage)**: 80% के बाद — 4.2V fix, current धीरे-धीरे कम
• **Fast Charging Protocols**:
  - **Qualcomm Quick Charge** (QC 3.0/4.0): 18W-100W
  - **USB PD** (Power Delivery): 18W-240W (universal standard)
  - **VOOC/Dash** (OnePlus/Oppo): 65W-100W (high current, low voltage)
  - **SuperCharge** (Huawei): 40W-66W

**4. Battery Connector:**
• FPC connector (Flat Pin Connector)
• **Pins**: B+ (positive), B- (negative), NTC (temperature sensor), BSI (battery ID)
• **NTC** खराब → "Battery not detected" error → charging नहीं होगी

**Charging Problems — Diagnostic Table:**
| समस्या | संभावित कारण | जांच विधि |
|---------|-------------|-----------|
| चार्ज नहीं होता | Port, IC, Battery | DC PSU से check |
| धीमा चार्ज | Cable, IC, Software | Ampere app से check |
| गर्म होकर चार्ज रुकता | NTC sensor, Battery old | Temperature check |
| Charger लगाते ही restart | Capacitor short near port | DC PSU ampere check |
| 0% पर अटका | Battery dead, PMIC | Kick-start battery |`,
          diagram: `┌──────────────────────────────────────────────┐
│      Charging Circuit — Signal Flow            │
├──────────────────────────────────────────────┤
│                                              │
│  Charger (5V-20V)                            │
│       │                                      │
│       ▼                                      │
│  ┌─────────┐                                 │
│  │ USB     │  VBUS (5V)                      │
│  │ Type-C  │──────┐                          │
│  │ Port    │      │                          │
│  │         │──D+  │                          │
│  │         │──D-  ▼                          │
│  │         │──CC ┌──────────┐                │
│  └─────────┘    │ESD Filter│                 │
│                 │IC (TVS)  │                 │
│                 └────┬─────┘                 │
│                      │                       │
│                      ▼                       │
│                 ┌──────────┐                 │
│                 │Charging  │                 │
│                 │IC / PMIC │                 │
│                 │          │                 │
│                 │CC Mode:  │                 │
│                 │ 1-6A     │                 │
│                 │          │                 │
│                 │CV Mode:  │                 │
│                 │ 4.2V     │                 │
│                 └────┬─────┘                 │
│                      │                       │
│                      ▼                       │
│                 ┌──────────┐                 │
│                 │ Battery  │                 │
│                 │ Li-Po    │                 │
│                 │ 3.7-4.2V │                 │
│                 │          │                 │
│                 │ B+ ─── Power out           │
│                 │ B- ─── Ground              │
│                 │ NTC ── Temp sensor          │
│                 │ BSI ── Battery ID           │
│                 └──────────┘                 │
│                                              │
│  Fast Charge Negotiation:                    │
│  Phone ←→ Charger IC: "I support QC 3.0"    │
│  Charger raises voltage to 9V/12V           │
│  Higher Power = Faster Charging              │
└──────────────────────────────────────────────┘`
        },
      ],
    },
    {
      title: "अध्याय 3: Fault Finding — खराबी ढूंढना",
      pages: [
        {
          title: "Dead Phone — फोन चालू नहीं हो रहा",
          content: `**Dead Phone** सबसे common और challenging problem है। Systematic approach से solve करें।

**Step 1: Visual Inspection (आंखों से जांच):**
• **Water Damage Indicator** check करें — SIM tray में white sticker (गीला हुआ तो pink/red)
• **Physical Damage** — कहीं टूटा, जला, या bent है?
• **Charging Port** — pin bent, corrosion, dust?
• **Battery Swelling** — फूली हुई battery? (immediately remove!)

**Step 2: Battery Check:**
• **Multimeter** से battery voltage check: 3.0V से ऊपर = OK
• **Below 2.5V** = Deep discharge — Kick-start करें:
  - DC PSU से directly 4.2V/0.5A दें → 5-10 min → Battery revive
• **0V** = Battery dead — नई battery लगाएं

**Step 3: DC Power Supply Test:**
• Battery निकालें → DC PSU के +/- wires battery connector पर लगाएं
• **4.0V Set करें, Current Limit 3A**
• Power button दबाएं:
  - **0.00A** = Open circuit — कहीं connection टूटा है (power button, connector)
  - **0.01-0.05A** = Normal standby → Software issue likely
  - **0.1-0.3A** = Boot attempt → CPU/RAM/eMMC issue
  - **0.5A+ instant** = Short circuit → IC level fault

**Step 4: Short Circuit Finding:**
• DC PSU पर **high ampere** दिखे तो शॉर्ट है
• **Freeze Spray Method**: Board पर spray करें → जहां सबसे पहले बर्फ पिघले = शॉर्ट वहां
• **Thermal Camera** (FLIR): Hot spot = Shorted component
• **Multimeter Diode Mode**: Main power rail पर check → Reading **0.000-0.100** = Short

**Step 5: Component Level Repair:**
• **शॉर्ट IC** को hot air से हटाएं
• बिना IC check करें — अगर short हट गया = वही IC खराब थी
• नई IC लगाएं → Recheck with DC PSU
• Common shorted ICs: **PMIC, WiFi IC, Audio IC, CPU (rare)**`,
          diagram: `┌──────────────────────────────────────────────┐
│     Dead Phone — Diagnostic Flowchart          │
├──────────────────────────────────────────────┤
│                                              │
│  Phone Dead (चालू नहीं)                       │
│       │                                      │
│       ▼                                      │
│  ┌─────────────┐                             │
│  │ Battery     │──→ Below 2.5V? ──→ Kick     │
│  │ Voltage?    │         │         Start     │
│  └──────┬──────┘    OK (3.0-4.2V)            │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ DC PSU Test │                             │
│  │ (4V, 3A    │                             │
│  │  limit)     │                             │
│  └──────┬──────┘                             │
│         │                                    │
│    ┌────┴────┬───────────┬──────────┐        │
│    ▼         ▼           ▼          ▼        │
│  0.00A    0.01-0.05A  0.1-0.3A   0.5A+      │
│  Open     Standby     Boot       SHORT       │
│  Circuit  (SW issue)  Attempt    CIRCUIT     │
│    │         │           │          │        │
│    ▼         ▼           ▼          ▼        │
│  Check    Flash       Check     Freeze       │
│  Power    Software    CPU/RAM   Spray or     │
│  Button   (SP Flash   eMMC/     Thermal     │
│  & Path   Tool)       UFS       Camera      │
│                                    │        │
│                              Find Shorted    │
│                              Component →     │
│                              Remove & Test   │
│                              → Replace IC    │
└──────────────────────────────────────────────┘`
        },
        {
          title: "Network और Signal Problems",
          content: `**Network समस्या** काफी common है — No Signal, No SIM, IMEI issue सब इसी श्रेणी में आते हैं।

**Network System कैसे काम करता है:**
Antenna → RF Switch → RF Filter → RF IC (Transceiver) → Modem (in CPU/SoC) → Baseband Software

**1. No Signal / No Network:**
• **SIM Tray** check — properly inserted? SIM damaged?
• **SIM Connector** pins check — bent, corroded?
• **Antenna** connector reseat — Coaxial cable (snap-on type)
• **RF IC** — Network processing chip → Test with known good signal
• **Software**: Reset Network Settings → Update firmware → Flash modem file

**2. IMEI Null/Invalid (00000000):**
• IMEI **baseband software** में store होता है
• **Cause**: Failed update, root attempt, modem partition corrupt
• **Fix**: 
  - **Android**: SP Flash Tool → Flash modem partition only
  - **Qualcomm**: QPST/QFil → Write IMEI via Diag mode
  - **MediaTek**: SN Write Tool / Engineer Mode (*#*#3646633#*#*)
  - ⚠️ IMEI changing is **illegal** — only restore original IMEI

**3. WiFi / Bluetooth Not Working:**
• **WiFi IC** — Qualcomm WCN series (WCN3990, WCN6856)
• **Testing**: Enter WiFi → Turns on? MAC address दिखता है?
  - **No MAC address** = WiFi IC dead
  - **Connects but no internet** = Software/Antenna issue
• **Fix**: WiFi IC replace (BGA soldering) → Flash WiFi calibration data

**4. Network Band Information:**
• **2G GSM**: 900MHz, 1800MHz (voice calls, SMS)
• **3G WCDMA**: 2100MHz (basic data)
• **4G LTE**: Band 40 (2300MHz), Band 3 (1800MHz), Band 1 (2100MHz) — India primary bands
• **5G NR**: n78 (3500MHz), n41 (2500MHz), n77 — Sub-6GHz in India
• **VoLTE**: Voice over LTE — 4G पर HD calling (Jio default)`,
          diagram: `┌──────────────────────────────────────────────┐
│      Mobile Network — Signal Path Diagram      │
├──────────────────────────────────────────────┤
│                                              │
│  Cell Tower (BTS)                            │
│  📡 Signal (Radio Waves)                     │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                                │
│  │ Antenna  │ (Internal PCB antenna)         │
│  │ (Main +  │ Main: Calls/Data               │
│  │  Diversity│ Diversity: Better reception    │
│  │  + WiFi) │ WiFi: 2.4G + 5G               │
│  └────┬─────┘                                │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                                │
│  │RF Switch │ (Band selection)               │
│  │/ Antenna │ Switches between bands         │
│  │ Tuner    │ based on network               │
│  └────┬─────┘                                │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                                │
│  │  SAW/BAW │ (Surface/Bulk Acoustic         │
│  │  Filters │  Wave Filters)                 │
│  │          │ Specific frequency only        │
│  └────┬─────┘                                │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                                │
│  │  RF IC   │ (Transceiver)                  │
│  │(WTR5975) │ Analog ↔ Digital conversion    │
│  │          │ Signal amplification           │
│  └────┬─────┘                                │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐                                │
│  │  Modem   │ (Inside SoC/CPU)               │
│  │(Baseband)│ Protocol processing            │
│  │          │ IMEI stored here               │
│  └──────────┘                                │
│                                              │
│  No Signal Checklist:                        │
│  ✓ SIM OK? → ✓ Antenna? → ✓ RF IC?          │
│  → ✓ Modem FW? → ✓ IMEI valid?              │
└──────────────────────────────────────────────┘`
        },
      ],
    },
    {
      title: "अध्याय 4: Software Repair — सॉफ्टवेयर रिपेयर",
      pages: [
        {
          title: "Android Flashing और Software Issues",
          content: `**Software Problems** hardware जितनी ही common हैं। सही tool और method से 90% software issues solve हो जाते हैं।

**Android Boot Process:**
1. **Power Button** press → PMIC → CPU power ON
2. **Boot ROM** (CPU internal) → First code execution
3. **Bootloader** (LK/U-Boot) → Hardware init → Load kernel
4. **Kernel** (Linux) → Drivers load → Mount system
5. **Android Framework** → System apps → Home screen

**Common Software Problems:**
• **Boot Loop**: Logo पर अटका, बार-बार restart
• **Stuck on Logo**: Progress नहीं होता — System partition corrupt
• **FRP Lock**: Factory Reset Protection — Google account required after reset
• **Pattern/Password Lock**: Screen lock भूल गए
• **Dead after Update**: Update fail → Soft brick

**Flashing Tools (by Chipset):**
• **MediaTek**: SP Flash Tool (Windows) — Scatter file based
• **Qualcomm**: QPST/QFil — EDL mode (Emergency Download)
• **Samsung**: Odin — .tar.md5 firmware files
• **Xiaomi**: Mi Flash Tool — Fastboot mode
• **Universal**: TWRP Recovery → Flash ZIP → Factory Reset

**Flashing Process (MediaTek Example):**
1. **Firmware Download**: GSM Forum, firmware.mobi, official website
2. **SP Flash Tool** install करें + USB Drivers install
3. **Scatter File** select करें (firmware folder में)
4. **Download Agent** auto-load होगा
5. Phone **OFF** करें → USB connect → Volume Down + USB = Download mode
6. **Download** button → Progress bar → Green circle = ✅ Done
7. Phone restart → First boot 5-10 min लग सकता है

**⚠️ Important Warnings:**
• **Wrong firmware** = Hard brick (Dead phone — JTAG/ISP needed)
• **Correct Model Number** verify करें — Settings → About Phone
• **Battery 50%+** होनी चाहिए flashing से पहले
• **Backup** ज़रूर लें — Data erase हो जाएगा`,
          diagram: `┌──────────────────────────────────────────────┐
│     Android Boot Process — Stage Diagram       │
├──────────────────────────────────────────────┤
│                                              │
│  Power Button Press                          │
│       │                                      │
│       ▼                                      │
│  ┌─────────────┐                             │
│  │  Boot ROM   │  (CPU Internal, Read-Only)  │
│  │  - Hardware │  - Cannot be modified       │
│  │    init     │  - Loads bootloader         │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ Bootloader  │  (LK / U-Boot)              │
│  │ - Unlock?   │  - Fastboot mode here       │
│  │ - Verify    │  - Recovery mode here        │
│  │   system    │  - Vol Down = Fastboot       │
│  └──────┬──────┘  - Vol Up = Recovery         │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │   Kernel    │  (Linux Kernel)              │
│  │ - Drivers   │  - Hardware abstraction      │
│  │ - Mount     │  - File systems              │
│  │   /system   │  - Security (SELinux)        │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │  Android    │  (System Framework)          │
│  │  Framework  │                             │
│  │ - System UI │  - Settings, Phone, SMS      │
│  │ - Services  │  - Play Services             │
│  │ - Apps      │  - User apps                 │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ Home Screen │  ✅ Phone Ready!             │
│  │  (Launcher) │                             │
│  └─────────────┘                             │
│                                              │
│  Boot Time: 15-45 seconds (normal)           │
│  First Boot after flash: 5-10 minutes        │
└──────────────────────────────────────────────┘`
        },
      ],
    },
    {
      title: "अध्याय 5: Advanced Soldering Techniques",
      pages: [
        {
          title: "BGA Reballing और IC Replacement",
          content: `**BGA (Ball Grid Array)** मोबाइल में सभी main ICs (CPU, RAM, PMIC, WiFi) इसी पैकेज में होती हैं। इन्हें बदलना **advanced level** का काम है।

**BGA क्या है?**
• IC के नीचे **सैकड़ों छोटी गोलियां (Solder Balls)** होती हैं
• ये balls PCB के pads से connect होती हैं
• **0.3mm-0.5mm** size की balls — नंगी आंखों से देखना मुश्किल

**BGA IC Remove करने का Process:**
1. **PCB को Preheat** करें (150°C) — Preheater station से
2. **Kapton Tape** से आस-पास के components protect करें
3. **Flux** (Amtech NC-559-V2) लगाएं IC के चारों ओर
4. **Hot Air Station** set करें: 350-380°C, Air 45-50%
5. **Circular motion** में heat दें — 2-3 minutes
6. IC **float** होगी (solder melt) → Tweezers से carefully उठाएं
7. PCB pads **clean** करें: Solder Wick + Flux + Soldering Iron

**Reballing Process (नई IC तैयार करना):**
1. पुरानी IC के नीचे से **old solder** remove करें
2. **Stencil** (IC के model specific) रखें IC पर
3. **Solder Balls** (0.3mm Leaded/Lead-free) stencil holes में डालें
4. **Flux** लगाएं
5. **Hot Air** से balls melt करें (320-340°C, light air)
6. Stencil हटाएं → IC तैयार — सभी balls uniform होनी चाहिए
7. **Microscope** से verify करें — Missing/bridged balls check

**IC लगाने का Process (Placement):**
1. PCB pads पर **Flux** लगाएं
2. IC को **सही orientation** में रखें (dot/marking match करें)
3. **Hot Air**: 350-380°C → IC float and self-align होगी
4. Cool down → **No touch** जब तक ठंडा न हो
5. **Multimeter** से check — Shorts? Connections OK?

**⚠️ Critical Tips:**
• **Lead-free solder**: 217°C melt point → Higher temp needed
• **Leaded solder**: 183°C melt point → Easier to work with
• **Practice** पहले dead boards पर करें
• **Microscope** essential है — बिना microscope pro-level काम नहीं
• **Anti-static**: ESD bracelet + Mat → IC damage prevention`,
          diagram: `┌──────────────────────────────────────────────┐
│       BGA Reballing — Step by Step              │
├──────────────────────────────────────────────┤
│                                              │
│  Step 1: IC Remove                           │
│  ┌────────────────────┐                      │
│  │  Hot Air 350-380°C │                      │
│  │     ↓↓↓↓↓↓↓↓       │                      │
│  │  ┌──────────────┐  │                      │
│  │  │ IC (BGA)     │  │ ← Flux around edges  │
│  │  │ ●●●●●●●●●●●  │  │                      │
│  │  │ ●●●●●●●●●●●  │  │ (solder balls melt)  │
│  │  └──────────────┘  │                      │
│  │  ══════════════════│ ← PCB Board          │
│  └────────────────────┘                      │
│                                              │
│  Step 2: Clean Pads                          │
│  ┌────────────────────┐                      │
│  │  Solder Wick +     │                      │
│  │  Soldering Iron    │                      │
│  │  ┌──────────────┐  │                      │
│  │  │ PCB Pads     │  │                      │
│  │  │ ○ ○ ○ ○ ○ ○  │  │ ← Clean, flat pads  │
│  │  │ ○ ○ ○ ○ ○ ○  │  │                      │
│  │  └──────────────┘  │                      │
│  └────────────────────┘                      │
│                                              │
│  Step 3: Reballing                           │
│  ┌────────────────────┐                      │
│  │  ┌── Stencil ───┐  │                      │
│  │  │ ◉ ◉ ◉ ◉ ◉ ◉ │  │ ← Solder balls in   │
│  │  │ ◉ ◉ ◉ ◉ ◉ ◉ │  │    stencil holes     │
│  │  └──────────────┘  │                      │
│  │  ┌──────────────┐  │                      │
│  │  │   IC (flip)  │  │                      │
│  │  └──────────────┘  │                      │
│  │       Hot Air      │                      │
│  │      320-340°C     │ ← Balls melt & stick │
│  └────────────────────┘                      │
│                                              │
│  Step 4: Place IC on PCB                     │
│  ┌────────────────────┐                      │
│  │  ┌──────────────┐  │                      │
│  │  │ IC (balls ↓) │  │ ← Align dot/marking  │
│  │  │ ● ● ● ● ● ● │  │                      │
│  │  │ ● ● ● ● ● ● │  │                      │
│  │  └──────────────┘  │                      │
│  │  ══════════════════│ ← PCB (flux on pads) │
│  │     Hot Air 360°C  │ ← IC self-aligns     │
│  └────────────────────┘                      │
│                                              │
│  Total Time: 20-40 minutes per IC            │
│  Difficulty: ★★★★★ (Expert Level)            │
└──────────────────────────────────────────────┘`
        },
      ],
    },
  ],
};
mobileRepairBook.chapters.push(...mobileRepairExpandedChapters);
mobileRepairBook.totalPages = countPages(mobileRepairBook.chapters);
mobileRepairBook.govtPdfUrl = "https://nios.ac.in/media/documents/vocational/mobile_phone_repairing.pdf";
mobileRepairBook.govtPdfLabel = "NIOS — Mobile Phone Repairing (Official PDF)";

/* ══════════════════════════════════════════
   2. LAPTOP REPAIRING — Textbook
   ══════════════════════════════════════════ */
const laptopRepairBook: Book = {
  id: "laptop-repair",
  title: "Laptop Repairing",
  titleHi: "लैपटॉप रिपेयरिंग — संपूर्ण कोर्स",
  icon: "💻",
  description: "लैपटॉप हार्डवेयर, सॉफ्टवेयर और मदरबोर्ड रिपेयर",
  totalPages: 0,
  chapters: [
    { title: "अध्याय 1: लैपटॉप परिचय और आर्किटेक्चर", pages: [
      { title: "लैपटॉप के प्रकार और मुख्य भाग", content: `**लैपटॉप** एक पोर्टेबल कंप्यूटर है जिसमें **Display, Keyboard, Battery, Motherboard** सब एक ही unit में होते हैं।\n\n**लैपटॉप के प्रकार:**\n• **Notebook**: Standard laptop (14-15.6 inch) — General use\n• **Ultrabook**: पतला और हल्का (Intel certified) — Business/Travel\n• **Gaming Laptop**: High-end GPU, बड़ी cooling, Heavy — Gamers\n• **Chromebook**: Chrome OS, Cloud-based — Education/Basic\n• **2-in-1**: Tablet + Laptop (Touch + Keyboard detach/fold)\n\n**मुख्य Components:**\n• **Motherboard**: CPU, RAM slots, Chipset, VRM, I/O ports सब इस पर\n• **CPU**: Intel Core i3/i5/i7/i9 या AMD Ryzen 3/5/7/9\n• **RAM**: DDR4/DDR5 SODIMM (4-32GB), 2 slots (most laptops)\n• **Storage**: 2.5" HDD (पुराना), M.2 NVMe SSD (नया, 5-7x तेज़)\n• **Display**: 14"/15.6" IPS, 60-144Hz, FHD/QHD\n• **Battery**: 3-cell to 6-cell Li-Ion, 40-100 Wh\n• **Keyboard**: Membrane (सस्ता) / Mechanical (premium gaming)\n• **Cooling**: Heat pipe + Fan (1 या 2), Thermal Paste/Pad`, diagram: `┌──────────────────────────────────────────────┐\n│        Laptop — Internal Layout (Top View)     │\n├──────────────────────────────────────────────┤\n│                                              │\n│  ┌─────────────────────────────────────────┐ │\n│  │            Display Assembly              │ │\n│  │  ┌─────────────────────────────────┐    │ │\n│  │  │  LCD/IPS Panel + Backlight      │    │ │\n│  │  │  Webcam + Mic (top center)      │    │ │\n│  │  │  WiFi Antenna (sides)           │    │ │\n│  │  └─────────────────────────────────┘    │ │\n│  │            Hinges (L + R)                │ │\n│  └─────────────────────────────────────────┘ │\n│                                              │\n│  ┌─────────────────────────────────────────┐ │\n│  │          Base Assembly                   │ │\n│  │  ┌──────┐ ┌─────────────────────────┐   │ │\n│  │  │ Fan  │ │    Motherboard           │   │ │\n│  │  │ + Heat│ │  ┌───┐ ┌───┐ ┌───┐     │   │ │\n│  │  │  Pipe│ │  │CPU│ │GPU│ │RAM│     │   │ │\n│  │  └──────┘ │  └───┘ └───┘ └───┘     │   │ │\n│  │           │  [WiFi Card] [SSD M.2]  │   │ │\n│  │           └─────────────────────────┘   │ │\n│  │  ┌──────────────────────────────────┐   │ │\n│  │  │      Battery (40-100 Wh)         │   │ │\n│  │  └──────────────────────────────────┘   │ │\n│  └─────────────────────────────────────────┘ │\n└──────────────────────────────────────────────┘` },
      { title: "लैपटॉप पावर सिस्टम", content: `**पावर सिस्टम** लैपटॉप रिपेयरिंग का सबसे important part है। पावर नहीं तो कुछ नहीं!\n\n**पावर फ्लो:**\nAC Adapter (19V/65W) → DC Jack → Input Fuse → MOSFET Switch → Charging IC → Battery\n                                                               → System Power Rails\n\n**1. AC Adapter (Charger):**\n• **Standard Output**: 19V-20V (most brands), 45W/65W/90W/120W\n• **USB-C PD**: Newer laptops, 45W-100W, Universal\n• **Testing**: Multimeter → Output voltage check (19V ±0.5V)\n\n**2. DC Jack:**\n• **Barrel Jack**: Round connector (HP, Dell, Lenovo older)\n• **USB-C**: Modern laptops, PD charging\n• **Common Issue**: Loose solder joints → No charge/Intermittent\n• **Fix**: Resolder or replace DC jack\n\n**3. Charging IC:**\n• **ISL6251, BQ24780** etc. — Manages battery charging\n• CC-CV method (same as mobile)\n• Controls charge current, monitors temperature\n• **MOSFET switches**: Control whether AC or Battery powers system\n\n**4. Battery:**\n• **Smart Battery**: Internal controller (BMS) monitors cells\n• **Cells**: 18650 (cylindrical) or Pouch (flat polymer)\n• **BMS Functions**: Cell balancing, Over-charge protection, Temp monitoring\n• **Testing**: Battery voltage (10.8V=3S, 14.4V=4S), Capacity via software\n\n**5. VRM (Voltage Regulator Module):**\n• Converts 19V → CPU needs 1.0-1.3V, GPU needs 0.8-1.1V\n• **Multi-phase** design (4-8 phases for CPU)\n• **MOSFET** per phase — gets hot → needs cooling\n• Failure = No power to CPU = Dead laptop`, diagram: `┌──────────────────────────────────────────────┐\n│      Laptop Power Architecture                 │\n├──────────────────────────────────────────────┤\n│                                              │\n│  AC Input (220V)                             │\n│       │                                      │\n│       ▼                                      │\n│  ┌─────────────┐                             │\n│  │  AC Adapter  │  Output: 19V / 3.42A       │\n│  │  (65W-120W) │  = 65W typical              │\n│  └──────┬──────┘                             │\n│         │                                    │\n│         ▼                                    │\n│  ┌─────────────┐                             │\n│  │   DC Jack   │  Fuse → Protection          │\n│  │  (Barrel/   │                             │\n│  │   USB-C)    │                             │\n│  └──────┬──────┘                             │\n│         │                                    │\n│    ┌────┴──────────────────────┐              │\n│    │        Charger IC         │              │\n│    │    (ISL6251/BQ24780)      │              │\n│    │                           │              │\n│    │  → Battery Charging       │              │\n│    │    (CC/CV, 4.2V/cell)     │              │\n│    │                           │              │\n│    │  → System Power           │              │\n│    │    (19V rail → VRMs)      │              │\n│    └───────┬───────────────────┘              │\n│            │                                 │\n│     ┌──────┴──────┐                          │\n│     │    VRMs     │                          │\n│     │ (Voltage    │                          │\n│     │  Regulators)│                          │\n│     │             │                          │\n│     │ → CPU: 1.0V │                          │\n│     │ → GPU: 0.9V │                          │\n│     │ → RAM: 1.2V │                          │\n│     │ → I/O: 3.3V │                          │\n│     │ → USB: 5.0V │                          │\n│     └─────────────┘                          │\n└──────────────────────────────────────────────┘` },
    ]},
    { title: "अध्याय 2: Common Faults और Solutions", pages: [
      { title: "No Power / Dead Laptop", content: `**Laptop चालू नहीं हो रहा — Step-by-Step Diagnosis:**\n\n**Step 1: Adapter Check**\n• Multimeter से adapter output: **19V ±0.5V** होनी चाहिए\n• LED indicator charger पर: ON = OK, OFF = Adapter dead\n• Cable damage check — especially near connector\n\n**Step 2: Battery Bypass Test**\n• Battery निकालें → केवल Adapter से power दें → Power button press\n• **चालू हुआ** = Battery खराब\n• **नहीं चालू** = Motherboard issue\n\n**Step 3: Visual Inspection**\n• Motherboard खोलें → Liquid damage? Burnt components? Swollen caps?\n• **Fuse** check (near DC jack) — Continuity mode, Beep = OK\n• **MOSFET** check (near charging IC) — Diode mode: 0.4-0.6V = OK\n\n**Step 4: Voltage Testing**\n• DC Jack पर 19V आ रहा? → Input OK\n• **Standby voltage (3.3V/5V)** present? → EC IC alive\n• Main power rails check → VRM output\n\n**Step 5: EC/KBC IC:**\n• **Embedded Controller** — Laptop का "watchman"\n• Power sequence control, Keyboard, Fan control, Battery management\n• EC dead = Laptop completely dead (no LED, no fan, nothing)\n• Fix: **EC IC reprogram** (requires programmer + firmware)`, diagram: `┌──────────────────────────────────────────────┐\n│     Dead Laptop — Diagnostic Flowchart         │\n├──────────────────────────────────────────────┤\n│                                              │\n│  Laptop Dead (कोई LED नहीं, कोई Response नहीं) │\n│       │                                      │\n│       ▼                                      │\n│  Adapter OK? ──No──→ Replace Adapter          │\n│       │ Yes                                  │\n│       ▼                                      │\n│  Remove Battery                              │\n│  Only Adapter → Power?                       │\n│       │                                      │\n│   ┌───┴───┐                                  │\n│  Yes     No                                  │\n│   │       │                                  │\n│   ▼       ▼                                  │\n│ Battery  Check:                              │\n│ Dead     1. DC Jack Fuse                     │\n│ Replace  2. Input MOSFET                     │\n│ Battery  3. Charging IC                      │\n│          4. 3.3V/5V Standby                  │\n│          5. EC/KBC IC                        │\n│          6. CPU VRM                          │\n│               │                              │\n│          3.3V/5V Present?                    │\n│          ┌────┴────┐                         │\n│         Yes       No                         │\n│          │         │                         │\n│          ▼         ▼                         │\n│       Power     EC/KBC IC                    │\n│       Button    Dead or                      │\n│       Circuit   Input Stage                  │\n│       or VRM    Failure                      │\n│       Issue                                  │\n└──────────────────────────────────────────────┘` },
    ]},
  ],
};
laptopRepairBook.totalPages = countPages(laptopRepairBook.chapters);
laptopRepairBook.govtPdfUrl = "https://nios.ac.in/media/documents/vocational/computer_hardware.pdf";
laptopRepairBook.govtPdfLabel = "NIOS — Computer Hardware Repair (Official PDF)";

/* ══════════════════════════════════════════
   3. TV REPAIRING
   ══════════════════════════════════════════ */
const tvRepairBook: Book = {
  id: "tv-repair",
  title: "LED/LCD TV Repairing",
  titleHi: "LED/LCD TV रिपेयरिंग",
  icon: "📺",
  description: "TV Power Supply, Main Board, T-Con, LED Strip repair",
  totalPages: 0,
  chapters: [
    { title: "अध्याय 1: TV के मुख्य बोर्ड", pages: [
      { title: "Power Supply Board (SMPS)", content: `**Power Supply Board** TV का सबसे ज़्यादा खराब होने वाला बोर्ड है। यह AC 220V को DC में बदलता है।\n\n**Power Supply के Output:**\n• **24V** — LED Backlight के लिए (सबसे ज्यादा current)\n• **12V** — Main Board / T-Con Board\n• **5V Standby** — हमेशा ON (Remote receive, Standby LED)\n• **3.3V** — Logic circuits\n\n**SMPS Working Principle:**\n1. AC 220V → **EMI Filter** (Noise reduction)\n2. → **Bridge Rectifier** (AC → DC, ~310V)\n3. → **Switching MOSFET** (High frequency ON/OFF, 50-100kHz)\n4. → **Transformer** (Step down + Isolation)\n5. → **Secondary Rectifier** (Schottky diodes → Clean DC)\n6. → **Filter Capacitors** (Ripple removal)\n7. → **Feedback** (Optocoupler → Regulation)\n\n**Common Faults:**\n• **TV Dead**: Fuse blown → Check bridge rectifier, MOSFET, capacitors\n• **Standby OK but No Power ON**: Main relay → 12V/24V section\n• **TV turns ON then OFF**: Feedback circuit → Optocoupler, TL431\n• **Humming Sound**: Filter capacitors dry/swollen → Replace\n• **Flickering**: Unstable output → Check feedback loop`, diagram: `┌──────────────────────────────────────────────┐\n│     TV Power Supply — Circuit Flow             │\n├──────────────────────────────────────────────┤\n│                                              │\n│  AC 220V Input                               │\n│       │                                      │\n│       ▼                                      │\n│  ┌─────────┐                                 │\n│  │EMI      │ (Noise Filter)                  │\n│  │Filter   │                                 │\n│  └────┬────┘                                 │\n│       │                                      │\n│       ▼                                      │\n│  ┌─────────┐                                 │\n│  │Bridge   │ → ~310V DC                      │\n│  │Rectifier│ (4 Diodes)                      │\n│  └────┬────┘                                 │\n│       │                                      │\n│       ▼                                      │\n│  ┌─────────┐   ┌──────────┐                  │\n│  │Main     │   │Switching │                  │\n│  │Filter   │──→│MOSFET    │──→ Transformer   │\n│  │Cap      │   │(PWM IC   │   (Step Down)    │\n│  │(400V)   │   │controls) │                  │\n│  └─────────┘   └──────────┘                  │\n│                      │                       │\n│                 ┌────┴────┐                  │\n│                 │Secondary│                  │\n│                 │Side     │                  │\n│                 │         │                  │\n│                 │→ 24V (LED Backlight)       │\n│                 │→ 12V (Main Board)          │\n│                 │→ 5V  (Standby)             │\n│                 │→ 3.3V (Logic)              │\n│                 └─────────┘                  │\n│                                              │\n│  ⚠️ 310V DC is LETHAL!                        │\n│  Always discharge caps before touching!      │\n└──────────────────────────────────────────────┘` },
    ]},
  ],
};
tvRepairBook.totalPages = countPages(tvRepairBook.chapters);

/* ══════════════════════════════════════════
   4. AC/FRIDGE REPAIRING
   ══════════════════════════════════════════ */
const acFridgeBook: Book = {
  id: "ac-fridge",
  title: "AC & Fridge Repairing",
  titleHi: "AC और फ्रिज रिपेयरिंग",
  icon: "❄️",
  description: "Refrigeration cycle, Gas charging, Compressor repair",
  totalPages: 0,
  chapters: [
    { title: "अध्याय 1: Refrigeration Cycle — शीतलन चक्र", pages: [
      { title: "Refrigeration कैसे काम करता है", content: `**Refrigeration** का मूल सिद्धांत: **गैस को compress करो → गर्मी बाहर निकालो → expand करो → ठंडक पैदा होती है**\n\n**चार मुख्य Components:**\n\n**1. Compressor (कंप्रेसर) — दिल:**\n• Low pressure gas को **high pressure** में compress करता है\n• **Reciprocating** (Piston type) — Most fridges\n• **Rotary** — Most ACs (compact, efficient)\n• **Inverter** — Variable speed (बिजली बचत 30-50%)\n• Power: 1/8 HP (small fridge) to 2 HP (2-ton AC)\n\n**2. Condenser (कंडेंसर) — गर्मी बाहर:**\n• High pressure hot gas → **गर्मी छोड़ता है** → Liquid बन जाता है\n• **Fridge**: Black coils at back\n• **AC**: Outdoor unit (fan forced air cooling)\n• Dirty condenser = Poor cooling = High electricity bill\n\n**3. Expansion Device (विस्तारण उपकरण):**\n• High pressure liquid → **Suddenly low pressure** → Temperature drops drastically\n• **Capillary Tube** (Fridge) — Thin copper tube, fixed expansion\n• **TXV** (AC) — Thermostatic Expansion Valve, adjustable\n• **EEV** (Inverter AC) — Electronic, precise control\n\n**4. Evaporator (एवापोरेटर) — ठंडक अंदर:**\n• Low pressure liquid → **गर्मी absorb** → Gas बन जाता है\n• **Fridge**: Freezer section inside\n• **AC**: Indoor unit coil\n• Frosting = Poor airflow or low gas\n\n**Refrigerant Gases:**\n• **R22** (Freon) — Purana, Ozone harmful, Being phased out\n• **R410A** — Non-ozone, Higher pressure, Newer ACs\n• **R32** — Low GWP, Mildly flammable, Latest ACs\n• **R134a** — Fridge, Car AC\n• **R600a** (Isobutane) — New fridges, Highly flammable, Very efficient`, diagram: `┌──────────────────────────────────────────────┐\n│    Refrigeration Cycle — Complete Diagram       │\n├──────────────────────────────────────────────┤\n│                                              │\n│     ┌────────────────────────────┐           │\n│     │    CONDENSER (गर्मी बाहर)    │           │\n│     │    High Pressure, Hot       │           │\n│     │    Gas → Liquid             │           │\n│     │    🌡️ 50-60°C               │           │\n│     │    Fan blows heat out       │           │\n│     └─────────┬──────────────────┘           │\n│               │                              │\n│               │ High Pressure Liquid          │\n│               │ (Warm, ~40°C)                │\n│               ▼                              │\n│     ┌────────────────────┐                   │\n│     │  EXPANSION DEVICE  │                   │\n│     │  (Capillary / TXV) │                   │\n│     │  Pressure DROP     │                   │\n│     │  Temp DROP         │                   │\n│     └─────────┬──────────┘                   │\n│               │                              │\n│               │ Low Pressure Liquid           │\n│               │ (Very Cold, -10°C to -20°C)  │\n│               ▼                              │\n│     ┌────────────────────────────┐           │\n│     │   EVAPORATOR (ठंडक अंदर)    │           │\n│     │   Low Pressure, Cold        │           │\n│     │   Liquid → Gas              │           │\n│     │   🌡️ -10°C to +5°C          │           │\n│     │   Absorbs room heat         │           │\n│     └─────────┬──────────────────┘           │\n│               │                              │\n│               │ Low Pressure Gas              │\n│               │ (Cool, ~10°C)                │\n│               ▼                              │\n│     ┌────────────────────────────┐           │\n│     │   COMPRESSOR (दिल)          │           │\n│     │   Low P Gas → High P Gas    │           │\n│     │   🌡️ Gas heats up (80°C+)   │           │\n│     │   Motor driven              │           │\n│     └─────────┬──────────────────┘           │\n│               │                              │\n│               └──→ Back to Condenser ──→ ♻️   │\n│                                              │\n│  Cycle repeats continuously until            │\n│  desired temperature is reached              │\n└──────────────────────────────────────────────┘` },
    ]},
  ],
};
acFridgeBook.totalPages = countPages(acFridgeBook.chapters);

/* ══════════════════════════════════════════
   5-12: Additional Books (Concise structure)
   ══════════════════════════════════════════ */
const makeQuickBook = (id: string, title: string, titleHi: string, icon: string, desc: string, chapters: Chapter[]): Book => {
  const b: Book = { id, title, titleHi, icon, description: desc, totalPages: 0, chapters };
  b.totalPages = countPages(chapters);
  return b;
};

const automobileBook = makeQuickBook("automobile", "Automobile Engineering", "ऑटोमोबाइल इंजीनियरिंग", "🚗", "बाइक, कार, ट्रक — इंजन, गियरबॉक्स, इलेक्ट्रिकल", [
  { title: "अध्याय 1: IC Engine — इंजन की बुनियाद", pages: [
    { title: "4-Stroke Engine कैसे काम करता है", content: `**Internal Combustion Engine (IC Engine)** में fuel को cylinder के अंदर जलाकर **mechanical energy** पैदा की जाती है।\n\n**4-Stroke Cycle (Otto Cycle):**\n\n**Stroke 1 — Intake (सक्शन):**\n• Piston नीचे जाता है → Cylinder में vacuum बनता है\n• **Intake Valve** खुलता है → Air + Fuel mixture अंदर आती है\n• Carburetor/FI system fuel-air mix तैयार करता है\n\n**Stroke 2 — Compression (कंप्रेशन):**\n• दोनों Valves बंद → Piston ऊपर जाता है\n• Air-Fuel mixture **compress** होती है (8:1 to 12:1 ratio)\n• Temperature बढ़ती है (~400°C)\n• Compression ratio जितना ज्यादा → Efficiency उतनी ज्यादा\n\n**Stroke 3 — Power (पावर):**\n• **Spark Plug** spark देता है → Fuel **explode** होता है\n• Pressure **piston को ज़ोर से नीचे** धकेलता है\n• यही stroke **ऊर्जा पैदा** करता है — बाकी 3 strokes passive हैं\n• Connecting Rod → Crankshaft → **Rotary Motion**\n\n**Stroke 4 — Exhaust (निकास):**\n• **Exhaust Valve** खुलता है → Piston ऊपर जाता है\n• जली हुई gases बाहर निकलती हैं → Silencer → Tailpipe\n• Catalytic Converter harmful gases को कम करता है\n\n**Petrol vs Diesel Engine:**\n| Feature | Petrol | Diesel |\n|---------|--------|--------|\n| Ignition | Spark Plug | Self-ignition (compression) |\n| Compression | 8-12:1 | 16-23:1 |\n| Fuel System | Carburetor/PFI/GDI | Common Rail Direct |\n| Torque | Lower | Higher |\n| Efficiency | 25-30% | 35-45% |`, diagram: `┌──────────────────────────────────────────────┐\n│     4-Stroke Engine Cycle — Visual Guide        │\n├──────────────────────────────────────────────┤\n│                                              │\n│  Stroke 1: INTAKE      Stroke 2: COMPRESSION│\n│  ┌──────────┐           ┌──────────┐         │\n│  │ IV=Open  │           │ IV=Close │         │\n│  │ ↓↓↓↓↓↓↓  │           │ ┌──────┐ │         │\n│  │ ┌──────┐ │           │ │Air+  │ │         │\n│  │ │      │ │           │ │Fuel  │ │         │\n│  │ │ Air+ │ │           │ │Comp- │ │         │\n│  │ │ Fuel │ │           │ │ressed│ │         │\n│  │ │ Mix  │ │           │ └──────┘ │         │\n│  │ │  ↓   │ │           │    ↑     │         │\n│  │ │Piston│ │           │ Piston ↑ │         │\n│  │ └──↓───┘ │           │          │         │\n│  │ EV=Close │           │ EV=Close │         │\n│  └──────────┘           └──────────┘         │\n│                                              │\n│  Stroke 3: POWER       Stroke 4: EXHAUST    │\n│  ┌──────────┐           ┌──────────┐         │\n│  │ IV=Close │           │ IV=Close │         │\n│  │ ⚡SPARK!  │           │          │         │\n│  │ 💥BOOM!   │           │ ↑↑↑↑↑↑↑  │         │\n│  │ ┌──────┐ │           │ ┌──────┐ │         │\n│  │ │Expan-│ │           │ │Exhaust│ │         │\n│  │ │sion  │ │           │ │gases │ │         │\n│  │ │Force │ │           │ │pushed│ │         │\n│  │ │  ↓↓↓ │ │           │ │  ↑↑  │ │         │\n│  │ │Piston│ │           │ │Piston│ │         │\n│  │ └──↓───┘ │           │ └──↑───┘ │         │\n│  │ EV=Close │           │ EV=Open  │         │\n│  └──────────┘           └──────────┘         │\n│                                              │\n│  IV = Intake Valve | EV = Exhaust Valve      │\n│  Crankshaft: 2 full rotations = 1 cycle      │\n└──────────────────────────────────────────────┘` },
  ]},
]);

const tallyBook = makeQuickBook("tally", "Tally Prime", "टैली प्राइम — अकाउंटिंग", "📊", "GST, Vouchers, Reports — Complete Tally Course", [
  { title: "अध्याय 1: Accounting Basics — लेखांकन की शुरुआत", pages: [
    { title: "Accounting (लेखांकन) क्या है?", content: `**Accounting** (लेखांकन) किसी व्यापार या संस्था के **वित्तीय लेनदेन (Financial Transactions)** को व्यवस्थित रूप से लिखना, वर्गीकरण करना, और विश्लेषण करना है।\n\n**Accounting के प्रकार:**\n• **Single Entry** — सिर्फ एक तरफ लिखना (छोटे दुकानदार)\n• **Double Entry** — हर लेनदेन दो जगह लिखना (Debit + Credit)\n• Tally **Double Entry System** पर काम करता है\n\n**Golden Rules of Accounting:**\n\n**Rule 1: Personal Account (व्यक्तिगत खाता)**\n• **Debit** the Receiver (लेने वाला)\n• **Credit** the Giver (देने वाला)\n• Example: राम को ₹10,000 दिए → Ram A/c Dr. | Cash A/c Cr.\n\n**Rule 2: Real Account (वास्तविक खाता)**\n• **Debit** what comes IN (जो आए)\n• **Credit** what goes OUT (जो जाए)\n• Example: फर्नीचर खरीदा ₹50,000 → Furniture Dr. | Cash Cr.\n\n**Rule 3: Nominal Account (नाममात्र खाता)**\n• **Debit** all Expenses & Losses\n• **Credit** all Incomes & Gains\n• Example: Salary दी ₹20,000 → Salary Dr. | Cash Cr.\n\n**Tally Prime — परिचय:**\n• भारत का **सबसे popular accounting software**\n• **GST Ready** — Automatic GST calculation और return filing\n• **Multi-Company** — Multiple companies manage कर सकते हैं\n• **Shortcut Keys** — Mouse-free fast entry (F2, Alt+F5, etc.)\n• **Cloud Access** — कहीं से भी data देखें (TallyPrime Server)`, diagram: `┌──────────────────────────────────────────────┐\n│    Accounting — Double Entry System            │\n├──────────────────────────────────────────────┤\n│                                              │\n│  Transaction: फर्नीचर खरीदा ₹50,000 नकद       │\n│                                              │\n│  ┌────────────────┐  ┌────────────────┐      │\n│  │   DEBIT (Dr.)  │  │  CREDIT (Cr.)  │      │\n│  │                │  │                │      │\n│  │  Furniture A/c │  │   Cash A/c     │      │\n│  │  ₹50,000       │  │   ₹50,000      │      │\n│  │                │  │                │      │\n│  │ (जो आया =     │  │ (जो गया =      │      │\n│  │  फर्नीचर)      │  │  पैसा)         │      │\n│  └────────────────┘  └────────────────┘      │\n│                                              │\n│  Rule: Real Account                          │\n│  Debit what comes IN (Furniture)             │\n│  Credit what goes OUT (Cash)                 │\n│                                              │\n│  ═══════════════════════════════════         │\n│  Total Debits = Total Credits (ALWAYS)       │\n│  ₹50,000     =  ₹50,000  ✅                  │\n│  ═══════════════════════════════════         │\n│                                              │\n│  Types of Accounts:                          │\n│  ┌──────────┬──────────┬──────────┐          │\n│  │Personal  │  Real    │ Nominal  │          │\n│  │(व्यक्ति) │(संपत्ति) │(खर्च/आय)│          │\n│  │Ram, Bank │Cash,     │Salary,   │          │\n│  │Supplier  │Furniture │Rent,     │          │\n│  │Customer  │Building  │Interest  │          │\n│  └──────────┴──────────┴──────────┘          │\n└──────────────────────────────────────────────┘` },
  ]},
  { title: "अध्याय 2: Tally में Company बनाना और Voucher Entry", pages: [
    { title: "Company Create और Ledger Setup", content: `**Tally Prime शुरू करने के Steps:**\n\n**Step 1: Company Create (Alt + F3 → Create Company)**\n• **Company Name**: अपनी दुकान/कंपनी का नाम\n• **Address**: पूरा पता\n• **Financial Year**: April to March (भारत में)\n• **Books Beginning**: जिस तारीख से शुरू करना है\n• **GSTIN**: अगर GST registered हैं तो GST number\n• **State**: राज्य चुनें (GST calculations के लिए ज़रूरी)\n\n**Step 2: Ledger Create (Gateway → Masters → Accounts Info → Ledger → Create)**\n• **Cash**: Under "Cash-in-Hand" group\n• **Bank A/c**: Under "Bank Accounts" (SBI, PNB etc.)\n• **Customer**: Under "Sundry Debtors" (जिनसे पैसा लेना है)\n• **Supplier**: Under "Sundry Creditors" (जिन्हें पैसा देना है)\n• **Purchase**: Under "Purchase Accounts"\n• **Sales**: Under "Sales Accounts"\n• **Expenses**: Salary, Rent, Electricity — Under "Indirect Expenses"\n\n**Step 3: GST Setup**\n• Company Alter → Statutory & Taxation → Enable GST = Yes\n• GST Registration Type: Regular / Composition\n• GSTIN: 15-digit number (27AABCU9603R1ZM format)\n• Ledger में GST Rate set करें: 5%, 12%, 18%, 28%\n\n**Important Shortcut Keys:**\n• **F2**: Change Date\n• **F5**: Payment Voucher\n• **F6**: Receipt Voucher\n• **F7**: Journal Voucher\n• **F8**: Sales Voucher\n• **F9**: Purchase Voucher\n• **Alt+F5**: Sales Return (Credit Note)\n• **Alt+F6**: Purchase Return (Debit Note)\n• **Alt+F2**: Change Period`, diagram: `┌──────────────────────────────────────────────┐\n│     Tally Prime — Navigation Map               │\n├──────────────────────────────────────────────┤\n│                                              │\n│  Gateway of Tally                            │\n│       │                                      │\n│       ├── Masters                            │\n│       │    ├── Accounts Info                  │\n│       │    │    ├── Groups (Create/Alter)     │\n│       │    │    └── Ledgers (Create/Alter)    │\n│       │    │                                 │\n│       │    ├── Inventory Info                 │\n│       │    │    ├── Stock Groups              │\n│       │    │    ├── Stock Items               │\n│       │    │    └── Units of Measure          │\n│       │    │                                 │\n│       │    └── Voucher Types                  │\n│       │                                      │\n│       ├── Transactions (Vouchers)             │\n│       │    ├── F5: Payment 💰                 │\n│       │    ├── F6: Receipt 📥                 │\n│       │    ├── F7: Journal 📋                 │\n│       │    ├── F8: Sales 🛒                   │\n│       │    ├── F9: Purchase 📦                │\n│       │    ├── Alt+F5: Credit Note            │\n│       │    └── Alt+F6: Debit Note             │\n│       │                                      │\n│       ├── Reports                            │\n│       │    ├── Balance Sheet                  │\n│       │    ├── Profit & Loss                  │\n│       │    ├── Trial Balance                  │\n│       │    ├── Day Book                       │\n│       │    ├── Cash/Bank Book                 │\n│       │    └── GST Reports                    │\n│       │                                      │\n│       └── GST (Statutory Reports)             │\n│            ├── GSTR-1 (Sales Return)          │\n│            ├── GSTR-3B (Summary Return)       │\n│            └── GSTR-9 (Annual Return)         │\n└──────────────────────────────────────────────┘` },
  ]},
]);
tallyBook.chapters.push(...tallyExpandedChapters);
tallyBook.totalPages = countPages(tallyBook.chapters);
tallyBook.govtPdfUrl = "https://nios.ac.in/media/documents/vocational/accounting_with_tally.pdf";
tallyBook.govtPdfLabel = "NIOS — Accounting with Tally (Official PDF)";

const nursingBook = makeQuickBook("nursing", "Nursing & Health", "नर्सिंग और स्वास्थ्य", "🏥", "Patient Care, First Aid, Medicine Knowledge", [
  { title: "अध्याय 1: नर्सिंग का परिचय", pages: [
    { title: "नर्सिंग क्या है और क्यों ज़रूरी", content: `**नर्सिंग (Nursing)** स्वास्थ्य सेवा का वह क्षेत्र है जहां **मरीज़ की देखभाल, इलाज में सहायता, और स्वास्थ्य शिक्षा** दी जाती है।\n\n**नर्सिंग के प्रकार:**\n• **ANM** (Auxiliary Nurse Midwife) — 2 साल, 10वीं बाद, ग्रामीण स्वास्थ्य केंद्र\n• **GNM** (General Nursing & Midwifery) — 3.5 साल, 12वीं बाद\n• **B.Sc Nursing** — 4 साल, Degree course (12वीं Science)\n• **Post Basic B.Sc** — GNM के बाद 2 साल\n• **M.Sc Nursing** — Specialization (ICU, OT, Pediatric, Psychiatric)\n\n**Vital Signs — जीवन के संकेत (हर नर्स को आने चाहिए):**\n\n**1. Temperature (तापमान):**\n• **Normal**: 98.6°F / 37°C (Oral)\n• **Method**: Oral (मुंह), Axillary (बगल), Rectal (गुदा), Ear (कान)\n• **Fever**: >100.4°F (38°C) = Fever, >104°F = High Fever (Emergency)\n\n**2. Pulse (नाड़ी):**\n• **Normal**: 60-100 beats/min (Adult)\n• **Location**: Radial (कलाई), Carotid (गर्दन), Brachial (बांह)\n• **Method**: 2 fingers (index + middle) on radial artery, count 60 sec\n• Tachycardia: >100 bpm | Bradycardia: <60 bpm\n\n**3. Respiration (श्वसन):**\n• **Normal**: 12-20 breaths/min (Adult)\n• Count without patient knowing (they change if aware)\n• Dyspnea = difficulty breathing, Apnea = no breathing\n\n**4. Blood Pressure (रक्तचाप):**\n• **Normal**: 120/80 mmHg (Systolic/Diastolic)\n• **Hypertension**: >140/90 mmHg\n• **Hypotension**: <90/60 mmHg\n• **Equipment**: Sphygmomanometer + Stethoscope\n• **Method**: Cuff on arm → Inflate → Listen with stethoscope → Note readings\n\n**5. SpO2 (Oxygen Saturation):**\n• **Normal**: 95-100%\n• **Below 90%**: Oxygen support needed (Emergency)\n• **Equipment**: Pulse Oximeter (finger clip)`, diagram: `┌──────────────────────────────────────────────┐\n│     Vital Signs — Quick Reference Card          │\n├──────────────────────────────────────────────┤\n│                                              │\n│  Parameter     │ Normal      │ Abnormal      │\n│  ─────────────┼─────────────┼───────────────│\n│  Temperature  │ 98.6°F/37°C │ >100.4°F =    │\n│               │             │ Fever 🌡️       │\n│  ─────────────┼─────────────┼───────────────│\n│  Pulse        │ 60-100/min  │ <60 Brady     │\n│               │             │ >100 Tachy 💓  │\n│  ─────────────┼─────────────┼───────────────│\n│  Respiration  │ 12-20/min   │ <12 or >20    │\n│               │             │ = Distress 🫁  │\n│  ─────────────┼─────────────┼───────────────│\n│  BP           │ 120/80 mmHg │ >140/90 High  │\n│               │             │ <90/60 Low 💉  │\n│  ─────────────┼─────────────┼───────────────│\n│  SpO2         │ 95-100%     │ <90% = O2     │\n│               │             │ Emergency 🫧   │\n│  ─────────────┴─────────────┴───────────────│\n│                                              │\n│  BP Measurement Steps:                       │\n│  1. Patient seated, arm at heart level       │\n│  2. Cuff 1 inch above elbow crease          │\n│  3. Place stethoscope on brachial artery     │\n│  4. Inflate cuff to 180 mmHg                │\n│  5. Slowly release (2-3 mmHg/sec)           │\n│  6. First sound = Systolic (ऊपर का)          │\n│  7. Sound disappears = Diastolic (नीचे का)   │\n│  8. Record as Systolic/Diastolic             │\n└──────────────────────────────────────────────┘` },
  ]},
]);
nursingBook.govtPdfUrl = "https://nios.ac.in/media/documents/vocational/community_health.pdf";
nursingBook.govtPdfLabel = "NIOS — Community Health (Official PDF)";

const constitutionBook = makeQuickBook("constitution", "Indian Constitution", "भारतीय संविधान", "⚖️", "मौलिक अधिकार, DPSP, Amendment, RTI", [
  { title: "अध्याय 1: संविधान का परिचय", pages: [
    { title: "भारतीय संविधान — निर्माण और विशेषताएं", content: `**भारत का संविधान** दुनिया का **सबसे बड़ा लिखित संविधान** है। इसे **संविधान सभा** ने बनाया।\n\n**संविधान सभा (Constituent Assembly):**\n• गठन: **9 दिसंबर 1946** (पहली बैठक)\n• अध्यक्ष: **डॉ. राजेंद्र प्रसाद** (स्थायी)\n• प्रारूप समिति अध्यक्ष: **डॉ. भीमराव अंबेडकर** (संविधान के जनक)\n• कुल सदस्य: 389 → विभाजन के बाद **299**\n• निर्माण अवधि: **2 साल, 11 महीने, 18 दिन**\n• लागू: **26 जनवरी 1950** (गणतंत्र दिवस)\n• हस्ताक्षर: **24 जनवरी 1950** (284 सदस्यों ने)\n\n**संविधान की विशेषताएं:**\n1. **सबसे बड़ा लिखित संविधान**: मूलतः 395 अनुच्छेद, 22 भाग, 8 अनुसूचियां\n   वर्तमान: **470+ अनुच्छेद, 25 भाग, 12 अनुसूचियां**\n2. **कठोर + लचीला**: कुछ प्रावधान साधारण बहुमत से बदल सकते हैं, कुछ के लिए विशेष\n3. **संसदीय शासन**: President (नाममात्र) + PM (वास्तविक शक्ति)\n4. **संघीय + एकात्मक**: सामान्य समय संघीय, आपातकाल में एकात्मक\n5. **मौलिक अधिकार**: अनुच्छेद 12-35 (6 अधिकार)\n6. **DPSP**: अनुच्छेद 36-51 (राज्य नीति निर्देशक तत्व)\n7. **मौलिक कर्तव्य**: अनुच्छेद 51A (11 कर्तव्य, 42वां संशोधन)\n8. **स्वतंत्र न्यायपालिका**: Supreme Court, High Court\n9. **धर्मनिरपेक्ष**: सभी धर्मों को समान सम्मान\n10. **वयस्क मताधिकार**: 18+ को वोट का अधिकार (61वां संशोधन)\n\n**प्रस्तावना (Preamble) — संविधान की आत्मा:**\n"हम भारत के लोग, भारत को एक **संपूर्ण प्रभुत्व संपन्न, समाजवादी, धर्मनिरपेक्ष, लोकतांत्रिक गणराज्य** बनाने के लिए... **न्याय, स्वतंत्रता, समता, बंधुता** की प्राप्ति हेतु..."`, diagram: `┌──────────────────────────────────────────────┐\n│     भारतीय संविधान — Structure Overview         │\n├──────────────────────────────────────────────┤\n│                                              │\n│  ┌─────────────────────────────────────────┐ │\n│  │         PREAMBLE (प्रस्तावना)            │ │\n│  │  Sovereign, Socialist, Secular,         │ │\n│  │  Democratic, Republic                   │ │\n│  └─────────────────────────────────────────┘ │\n│                                              │\n│  Part I-II:    Union & Territory (Art 1-11)  │\n│  Part III:     मौलिक अधिकार (Art 12-35) ⭐   │\n│  Part IV:      DPSP (Art 36-51)              │\n│  Part IVA:     मौलिक कर्तव्य (Art 51A)       │\n│  Part V:       Union Government              │\n│                ├── President (Art 52-78)      │\n│                ├── Parliament (Art 79-122)    │\n│                └── Supreme Court (Art 124-147)│\n│  Part VI:      State Government              │\n│                ├── Governor (Art 153-167)     │\n│                ├── Legislature (Art 168-212)  │\n│                └── High Court (Art 214-237)   │\n│  Part XI-XII:  केंद्र-राज्य संबंध              │\n│  Part XV:      चुनाव (Art 324-329)            │\n│  Part XVI:     SC/ST/OBC आरक्षण               │\n│  Part XVIII:   आपातकाल (Art 352-360)          │\n│  Part XX:      संशोधन (Art 368)               │\n│                                              │\n│  Schedules (अनुसूचियां): 12                    │\n│  1st: States & UTs                           │\n│  7th: Union/State/Concurrent Lists           │\n│  8th: 22 Official Languages                  │\n│                                              │\n│  Total Amendments: 105+ (till 2023)          │\n└──────────────────────────────────────────────┘` },
  ]},
]);

const scienceBook = makeQuickBook("science", "Science & GK", "विज्ञान और सामान्य ज्ञान", "🔬", "Physics, Chemistry, Biology, GK in Hindi", [
  { title: "अध्याय 1: भौतिक विज्ञान — बेसिक्स", pages: [
    { title: "बल, गति और न्यूटन के नियम", content: `**न्यूटन के गति के तीन नियम (Newton's Laws of Motion):**\n\n**पहला नियम — जड़त्व का नियम (Law of Inertia):**\n• "कोई वस्तु अपनी **विराम या गति की अवस्था** तब तक नहीं बदलती जब तक कोई **बाहरी बल** न लगे"\n• **उदाहरण**: बस अचानक ब्रेक लगाए → यात्री आगे गिरते हैं (जड़त्व)\n• गाड़ी में **सीटबेल्ट** जड़त्व से बचाती है\n\n**दूसरा नियम — बल और त्वरण (F = ma):**\n• **बल (F)** = **द्रव्यमान (m)** × **त्वरण (a)**\n• ज्यादा बल = ज्यादा तेज़ी से गति बदलेगी\n• भारी वस्तु को ज्यादा बल लगता है\n• Unit: Newton (N) = kg × m/s²\n• **उदाहरण**: क्रिकेट बॉल (0.15 kg) को 30 m/s² से फेंकना → F = 0.15 × 30 = 4.5 N\n\n**तीसरा नियम — क्रिया-प्रतिक्रिया (Action-Reaction):**\n• "हर क्रिया की **समान और विपरीत** प्रतिक्रिया होती है"\n• **उदाहरण 1**: बंदूक से गोली → गोली आगे, बंदूक पीछे (recoil)\n• **उदाहरण 2**: रॉकेट → गैस नीचे, रॉकेट ऊपर\n• **उदाहरण 3**: तैरना → हाथ से पानी पीछे, शरीर आगे\n\n**गुरुत्वाकर्षण (Gravity):**\n• **g = 9.8 m/s²** (पृथ्वी पर)\n• **चंद्रमा पर g = 1.6 m/s²** (6 गुना कम — इसलिए astronauts उछलते हैं)\n• **वजन (Weight)** = mass × g (बदलता है)\n• **द्रव्यमान (Mass)** = fixed (हर जगह same)\n\n**ऊर्जा (Energy):**\n• **गतिज ऊर्जा (KE)** = ½mv² (चलती वस्तु में)\n• **स्थितिज ऊर्जा (PE)** = mgh (ऊंचाई पर रखी वस्तु में)\n• **ऊर्जा संरक्षण**: ऊर्जा न बनती है न नष्ट होती, रूप बदलती है`, diagram: `┌──────────────────────────────────────────────┐\n│     Newton's Laws — Visual Examples             │\n├──────────────────────────────────────────────┤\n│                                              │\n│  Law 1: INERTIA (जड़त्व)                     │\n│  ┌─────────────────────────────┐             │\n│  │  🚌 BUS → ──→ BRAKE!       │             │\n│  │  👤 Passenger →→→ (falls fwd)│             │\n│  │  Body wants to keep moving  │             │\n│  └─────────────────────────────┘             │\n│                                              │\n│  Law 2: F = ma (बल = द्रव्यमान × त्वरण)      │\n│  ┌─────────────────────────────┐             │\n│  │                             │             │\n│  │  Same Force (F):            │             │\n│  │  ⚾ Small ball → →→→→→ Fast  │             │\n│  │  🎳 Heavy ball → →→  Slow   │             │\n│  │                             │             │\n│  │  Less mass = More speed     │             │\n│  └─────────────────────────────┘             │\n│                                              │\n│  Law 3: Action ↔ Reaction                    │\n│  ┌─────────────────────────────┐             │\n│  │                             │             │\n│  │  🚀 ROCKET:                 │             │\n│  │     🔥 Gas pushes DOWN      │             │\n│  │     🚀 Rocket goes UP       │             │\n│  │                             │             │\n│  │  🏊 SWIMMING:               │             │\n│  │     ✋ Push water BACK       │             │\n│  │     🏊 Body moves FORWARD   │             │\n│  └─────────────────────────────┘             │\n│                                              │\n│  Gravity:                                    │\n│  Earth: g = 9.8 m/s² (Weight = mg)          │\n│  Moon:  g = 1.6 m/s² (6x lighter feel)      │\n│  Jupiter: g = 24.8 m/s² (2.5x heavier)      │\n└──────────────────────────────────────────────┘` },
  ]},
]);

const agricultureFullBook = makeQuickBook("agriculture-full", "Modern Agriculture", "आधुनिक कृषि विज्ञान", "🌾", "खेती, सिंचाई, जैविक, पशुपालन — संपूर्ण कोर्स", [
  { title: "अध्याय 1: मिट्टी विज्ञान — Soil Science", pages: [
    { title: "मिट्टी के प्रकार और परीक्षण", content: `**मिट्टी (Soil)** खेती की नींव है। सही मिट्टी = अच्छी फसल।\n\n**मिट्टी के प्रकार:**\n\n**1. जलोढ़ मिट्टी (Alluvial Soil):**\n• **कहां**: गंगा-यमुना का मैदान, पंजाब, UP, Bihar\n• **रंग**: हल्का भूरा / ग्रे\n• **गुण**: उपजाऊ, Potash rich, NPK balanced\n• **फसलें**: गेहूं, धान, गन्ना, दालें\n• **भारत की 40% भूमि** जलोढ़ मिट्टी है\n\n**2. काली मिट्टी (Black/Regur Soil):**\n• **कहां**: महाराष्ट्र, MP, Gujarat, Karnataka (Deccan Plateau)\n• **रंग**: काला (Basalt rock से बनी)\n• **गुण**: नमी धारण क्षमता बहुत ज्यादा, गीली होने पर चिपचिपी\n• **फसलें**: **कपास** (इसीलिए Cotton Soil भी कहते हैं), सोयाबीन, ज्वार\n\n**3. लाल मिट्टी (Red Soil):**\n• **कहां**: Tamil Nadu, Jharkhand, Odisha, छोटानागपुर\n• **रंग**: लाल (Iron Oxide content ज्यादा)\n• **गुण**: कम उपजाऊ, Humus कम, Acidic (pH 5.5-6.5)\n• **फसलें**: मूंगफली, तंबाकू, बाजरा, रागी\n\n**4. लैटेराइट मिट्टी (Laterite):**\n• **कहां**: Kerala, पश्चिमी घाट, Meghalaya\n• **गुण**: Heavy rain से nutrients धुल जाते हैं, Iron-Aluminium rich\n• **फसलें**: चाय, कॉफी, काजू, Rubber\n\n**मिट्टी परीक्षण (Soil Testing):**\n• **कैसे Sample लें**: खेत में Z-pattern में 8-10 जगह, 15cm गहराई, 500g मिश्रित sample\n• **कहां भेजें**: जिला कृषि विभाग Soil Testing Lab (Free)\n• **क्या पता चलता है**: pH, N (Nitrogen), P (Phosphorus), K (Potassium), Organic Carbon, Micronutrients\n• **Soil Health Card**: PM scheme — हर 2 साल में free testing + recommendations`, diagram: `┌──────────────────────────────────────────────┐\n│     भारत — मिट्टी के प्रकार (Soil Map)          │\n├──────────────────────────────────────────────┤\n│                                              │\n│  ┌─────────────────────────────────────────┐ │\n│  │       NORTH                             │ │\n│  │   ████ जलोढ़ (Alluvial) ████            │ │\n│  │   Punjab, Haryana, UP, Bihar            │ │\n│  │   गेहूं, धान, गन्ना                      │ │\n│  │                                         │ │\n│  │    WEST          CENTRAL                │ │\n│  │   ▓▓▓▓ काली      ░░░░ मिश्रित           │ │\n│  │   (Black)        (Mixed)                │ │\n│  │   Maharashtra    MP                     │ │\n│  │   कपास, सोयाबीन   गेहूं, सोयाबीन         │ │\n│  │                                         │ │\n│  │       SOUTH                             │ │\n│  │   ╳╳╳╳ लाल (Red) ╳╳╳╳                  │ │\n│  │   TN, Karnataka, Jharkhand              │ │\n│  │   मूंगफली, रागी                          │ │\n│  │                                         │ │\n│  │   COAST           NORTHEAST             │ │\n│  │   ◇◇◇◇ लैटेराइट  ∆∆∆∆ Forest           │ │\n│  │   Kerala          Assam, Meghalaya      │ │\n│  │   चाय, काजू       चाय, चावल              │ │\n│  └─────────────────────────────────────────┘ │\n│                                              │\n│  Soil Test Sampling Pattern:                 │\n│  ┌──────────────┐                            │\n│  │ ✕        ✕   │  Z-pattern                 │\n│  │   ✕    ✕     │  8-10 spots                │\n│  │     ✕        │  15cm depth                │\n│  │   ✕    ✕     │  Mix all → 500g sample     │\n│  │ ✕        ✕   │  Send to Lab               │\n│  └──────────────┘                            │\n└──────────────────────────────────────────────┘` },
  ]},
]);

const historyBook = makeQuickBook("history", "World History", "विश्व इतिहास", "🌍", "प्राचीन से आधुनिक — विश्व और भारत का इतिहास", [
  { title: "अध्याय 1: भारत का प्राचीन इतिहास", pages: [
    { title: "सिंधु घाटी सभ्यता से मौर्य साम्राज्य तक", content: `**भारतीय इतिहास** को तीन भागों में बांटा जाता है: **प्राचीन, मध्यकालीन, आधुनिक**\n\n**1. सिंधु घाटी सभ्यता (3300-1300 BCE):**\n• **खोज**: 1921 में **दयाराम साहनी** (हड़प्पा) और 1922 में **राखालदास बनर्जी** (मोहनजोदड़ो)\n• **प्रमुख शहर**: हड़प्पा (Punjab), मोहनजोदड़ो (Sindh), लोथल (Gujarat), कालीबंगन (Rajasthan)\n• **विशेषताएं**: नगर नियोजन (Grid pattern), सार्वजनिक स्नानागार, नालियां, ईंटों के मकान\n• **लोथल**: दुनिया का सबसे पुराना **Dockyard** (बंदरगाह)\n• **लिपि**: अभी तक **पढ़ी नहीं गई** (undeciphered)\n• **अंत**: जलवायु परिवर्तन, नदी सूखना, या बाहरी आक्रमण (विवादित)\n\n**2. वैदिक काल (1500-600 BCE):**\n• **ऋग्वेद** — सबसे प्राचीन ग्रंथ (Sanskrit)\n• **चार वेद**: ऋग्वेद, यजुर्वेद, सामवेद, अथर्ववेद\n• **उपनिषद**: दार्शनिक ग्रंथ — "सत्यमेव जयते" (मुंडक उपनिषद से)\n• **समाज**: वर्ण व्यवस्था, कृषि, पशुपालन\n\n**3. महाजनपद काल (600-321 BCE):**\n• **16 महाजनपद** (बड़े राज्य): मगध, कोसल, वत्स, अवंती प्रमुख\n• **मगध** सबसे शक्तिशाली — राजधानी राजगृह, बाद में पाटलिपुत्र\n• **महावीर** (जैन धर्म) और **गौतम बुद्ध** (बौद्ध धर्म) इसी काल में\n\n**4. मौर्य साम्राज्य (321-185 BCE):**\n• **चंद्रगुप्त मौर्य**: नंद वंश को हराकर साम्राज्य स्थापित, गुरु **चाणक्य** (कौटिल्य)\n• **अशोक** (273-232 BCE): कलिंग युद्ध → हिंसा देख बौद्ध धर्म अपनाया\n• **अशोक स्तंभ**: चार शेर — भारत का **राष्ट्रीय चिह्न** (National Emblem)\n• **अर्थशास्त्र** (कौटिल्य): राजनीति और अर्थव्यवस्था पर ग्रंथ`, diagram: `┌──────────────────────────────────────────────┐\n│     भारतीय इतिहास — Timeline                    │\n├──────────────────────────────────────────────┤\n│                                              │\n│  3300 BCE ─── सिंधु घाटी सभ्यता शुरू          │\n│  │            (हड़प्पा, मोहनजोदड़ो)             │\n│  │                                           │\n│  1500 BCE ─── वैदिक काल शुरू                  │\n│  │            (ऋग्वेद, आर्य)                   │\n│  │                                           │\n│  600 BCE ──── महाजनपद काल                    │\n│  │            बुद्ध (563 BCE)                  │\n│  │            महावीर (540 BCE)                 │\n│  │                                           │\n│  321 BCE ──── मौर्य साम्राज्य                   │\n│  │            चंद्रगुप्त → बिंदुसार → अशोक     │\n│  │                                           │\n│  185 BCE ──── शुंग वंश                        │\n│  │                                           │\n│  320 CE ───── गुप्त साम्राज्य (स्वर्णयुग)       │\n│  │            विज्ञान, कला, साहित्य चरम        │\n│  │                                           │\n│  712 CE ───── अरब आक्रमण (सिंध)               │\n│  │                                           │\n│  1206 CE ──── दिल्ली सल्तनत                    │\n│  │                                           │\n│  1526 CE ──── मुगल साम्राज्य (बाबर)             │\n│  │            अकबर → जहांगीर → शाहजहां        │\n│  │                                           │\n│  1757 CE ──── ब्रिटिश शासन शुरू (प्लासी)       │\n│  │                                           │\n│  1857 CE ──── प्रथम स्वतंत्रता संग्राम           │\n│  │                                           │\n│  1947 CE ──── स्वतंत्रता! 🇮🇳                   │\n│  │                                           │\n│  1950 CE ──── गणतंत्र (संविधान लागू)            │\n└──────────────────────────────────────────────┘` },
  ]},
]);

const computerBook = makeQuickBook("computer-full", "Computer & IT", "कंप्यूटर और IT", "🖥️", "Hardware, Software, Excel, PGDCA, AI — Complete Course", [
  { title: "अध्याय 1: कंप्यूटर का परिचय", pages: [
    { title: "कंप्यूटर क्या है — Hardware & Software", content: `**कंप्यूटर** एक इलेक्ट्रॉनिक मशीन है जो **Input** लेता है, **Process** करता है, और **Output** देता है।\n\n**IPO Cycle: Input → Process → Output → Storage**\n\n**Hardware (हार्डवेयर — छू सकते हैं):**\n\n**1. CPU (Central Processing Unit) — दिमाग:**\n• **ALU** (Arithmetic Logic Unit): गणित + तुलना\n• **CU** (Control Unit): सब कंट्रोल करता है\n• **Registers**: अस्थायी memory (सबसे तेज़)\n• Brands: **Intel** (Core i3/i5/i7/i9), **AMD** (Ryzen 3/5/7/9)\n\n**2. RAM (Random Access Memory) — अस्थायी मेमोरी:**\n• बिजली बंद = Data गायब (Volatile)\n• DDR4 (current), DDR5 (newest, faster)\n• **4GB**: Basic, **8GB**: Standard, **16GB+**: Gaming/Professional\n\n**3. Storage — स्थायी मेमोरी:**\n• **HDD** (Hard Disk Drive): Spinning disk, Cheap, Slow (80-160 MB/s)\n• **SSD** (Solid State Drive): Flash memory, Expensive, Fast (500-7000 MB/s)\n• **NVMe M.2**: Fastest SSD type (direct PCIe connection)\n\n**4. Motherboard:**\n• सभी components connect होते हैं\n• CPU Socket, RAM Slots, PCIe Slots, SATA ports, USB headers\n\n**5. Input Devices**: Keyboard, Mouse, Scanner, Microphone, Webcam\n**6. Output Devices**: Monitor, Printer, Speaker\n\n**Software (सॉफ्टवेयर — छू नहीं सकते):**\n• **System Software**: OS (Windows, Linux, macOS)\n• **Application Software**: MS Office, Tally, Photoshop, Chrome\n• **Utility Software**: Antivirus, Disk Cleanup, Backup tools\n\n**Operating System (OS):**\n• **Windows 11**: सबसे popular desktop OS (Microsoft)\n• **Linux**: Free, Open source (Ubuntu, Fedora, CentOS)\n• **macOS**: Apple computers (MacBook, iMac)`, diagram: `┌──────────────────────────────────────────────┐\n│     Computer — Block Diagram                   │\n├──────────────────────────────────────────────┤\n│                                              │\n│  ┌─────────────────────────────────────────┐ │\n│  │           INPUT DEVICES                  │ │\n│  │  ⌨️ Keyboard  🖱️ Mouse  📷 Scanner       │ │\n│  │  🎤 Microphone  📹 Webcam               │ │\n│  └──────────────────┬──────────────────────┘ │\n│                     │                        │\n│                     ▼                        │\n│  ┌─────────────────────────────────────────┐ │\n│  │        PROCESSING UNIT (CPU)             │ │\n│  │  ┌────────┐ ┌────────┐ ┌────────┐       │ │\n│  │  │  ALU   │ │   CU   │ │Register│       │ │\n│  │  │(गणना)  │ │(नियंत्रण)│ │(अस्थायी)│      │ │\n│  │  └────────┘ └────────┘ └────────┘       │ │\n│  │                                         │ │\n│  │  ┌──────────────────────────────────┐   │ │\n│  │  │     RAM (Primary Memory)         │   │ │\n│  │  │     अस्थायी — Fast — Volatile     │   │ │\n│  │  └──────────────────────────────────┘   │ │\n│  └──────────────────┬──────────────────────┘ │\n│                     │                        │\n│          ┌──────────┴──────────┐             │\n│          ▼                     ▼             │\n│  ┌───────────────┐    ┌──────────────────┐   │\n│  │OUTPUT DEVICES │    │  STORAGE          │   │\n│  │🖥️ Monitor     │    │  💾 HDD/SSD       │   │\n│  │🖨️ Printer     │    │  📀 CD/DVD        │   │\n│  │🔊 Speaker     │    │  🔌 USB Drive     │   │\n│  └───────────────┘    │  ☁️ Cloud          │   │\n│                       └──────────────────┘   │\n│                                              │\n│  Speed Comparison:                           │\n│  Register > Cache > RAM > SSD > HDD         │\n│  (Fastest)              (Slowest)            │\n│                                              │\n│  Storage Comparison:                         │\n│  HDD > SSD > RAM > Cache > Register         │\n│  (Most)              (Least)                 │\n└──────────────────────────────────────────────┘` },
  ]},
]);

/* ══════════════════════════════════════════
   CATEGORIES EXPORT
   ══════════════════════════════════════════ */
export const bookCategories: BookCategory[] = [
  {
    id: "electronics",
    title: "टेक्निकल रिपेयरिंग",
    titleHi: "Technical & Electronics Repairing",
    color: "from-blue-600 to-indigo-500",
    books: [mobileRepairBook, laptopRepairBook, tvRepairBook, acFridgeBook],
  },
  {
    id: "automobile",
    title: "ऑटोमोबाइल इंजीनियरिंग",
    titleHi: "Automobile Engineering",
    color: "from-red-600 to-orange-500",
    books: [automobileBook],
  },
  {
    id: "computer",
    title: "कंप्यूटर और IT",
    titleHi: "Computer, Tally, PGDCA, Coding",
    color: "from-violet-600 to-purple-500",
    books: [tallyBook, computerBook],
  },
  {
    id: "medical",
    title: "मेडिकल और नर्सिंग",
    titleHi: "Nursing, Health & Medicine",
    color: "from-emerald-600 to-green-500",
    books: [nursingBook],
  },
  {
    id: "agriculture",
    title: "आधुनिक कृषि विज्ञान",
    titleHi: "Agriculture, Farming & Animal Husbandry",
    color: "from-lime-600 to-green-600",
    descriptionHi: "यह भारत का सबसे व्यापक कृषि शिक्षा केंद्र है — जैविक खेती, मशरूम उत्पादन, मछली पालन, बकरी पालन, पशुपालन, तालाब प्रबंधन, और ICAR की नवीनतम तकनीकें। किसान भाई यहाँ से सीधे सरकारी पुस्तकें पढ़ सकते हैं और आधुनिक कृषि विज्ञान से अपनी आय दोगुनी कर सकते हैं। हर PDF असली सरकारी/संस्थान की पुस्तक है।",
    books: [agricultureFullBook],
    pdfLibrary: [
      { id: "pdf-organic-theory", titleHi: "जैविक खेती — सिद्धांत पुस्तक", titleEn: "Organic Grower Theory", icon: "🌿", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/organic-grower-theory.pdf", tags: ["जैविक", "खेती", "organic"] },
      { id: "pdf-organic-practical", titleHi: "जैविक उत्पाद — प्रैक्टिकल गाइड", titleEn: "Organic Grower Practical", icon: "🥬", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/organic-grower-practical.pdf", tags: ["जैविक", "प्रैक्टिकल", "organic"] },
      { id: "pdf-icar-2025", titleHi: "ICAR वार्षिक रिपोर्ट 2025 — आधुनिक कृषि", titleEn: "ICAR Annual Report 2025 Hindi", icon: "📊", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/icar-2025-hindi.pdf", tags: ["ICAR", "आधुनिक", "तकनीक"] },
      { id: "pdf-mushroom-theory", titleHi: "मशरूम की खेती — सिद्धांत", titleEn: "Mushroom Theory Book", icon: "🍄", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/mushroom-theory.pdf", tags: ["मशरूम", "mushroom", "खेती"] },
      { id: "pdf-mushroom-practical", titleHi: "मशरूम की खेती — प्रैक्टिकल गाइड", titleEn: "Mushroom Practical Book", icon: "🍄", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/mushroom-practical.pdf", tags: ["मशरूम", "प्रैक्टिकल"] },
      { id: "pdf-animal-husbandry", titleHi: "पशुपालन जानकारी (11th)", titleEn: "Animal Husbandry 11th", icon: "🐄", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/animal-husbandry-11th.pdf", tags: ["पशुपालन", "animal", "dairy"] },
      { id: "pdf-pashupalan", titleHi: "पशुपालन निर्देशिका — संपूर्ण गाइड", titleEn: "Pashupalan Nirdeshika Hindi", icon: "🐃", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/pashupalan-nirdeshika.pdf", tags: ["पशुपालन", "निर्देशिका", "dairy"] },
      { id: "pdf-fish-farming", titleHi: "मछली पालन — संपूर्ण गाइड", titleEn: "Fish Farming Guide", icon: "🐟", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/fish-farming-guide.pdf", tags: ["मछली", "fish", "पालन"] },
      { id: "pdf-pond-mgmt", titleHi: "तालाब प्रबंधन — Pond Management", titleEn: "Pond Management Booklet", icon: "🌊", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/pond-management.pdf", tags: ["तालाब", "pond", "मछली"] },
      { id: "pdf-bakri-palan", titleHi: "बकरी पालन — IVRI गाइड", titleEn: "Goat Farming IVRI Guide", icon: "🐐", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/bakri-palan-ivri.pdf", tags: ["बकरी", "goat", "पालन"] },
      { id: "pdf-bater-palan", titleHi: "बटेर पालन — एक लाभकारी उद्यम", titleEn: "Quail Farming - A Profitable Enterprise", icon: "🐦", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/bater_palan_labhkari_udyam.pdf", tags: ["बटेर", "quail", "पालन", "लाभकारी"] },
      { id: "pdf-murgi-palan", titleHi: "मुर्गी पालन — संपूर्ण पाठ्यपुस्तक", titleEn: "Poultry Husbandry Textbook", icon: "🐔", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/murgi_palan_poultry_husbandry.pdf", tags: ["मुर्गी", "poultry", "पालन", "कुक्कुट"] },
      { id: "pdf-turkey-bater-emu", titleHi: "टर्की, बटेर एवं इमू पालन — पाठ्यपुस्तक", titleEn: "Turkey, Quail & Emu Farming", icon: "🦃", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/turkey_bater_emu_palan.pdf", tags: ["टर्की", "बटेर", "इमू", "turkey", "emu"] },
    ],
  },
  {
    id: "knowledge",
    title: "ज्ञान और इतिहास",
    titleHi: "Constitution, History, Science, GK",
    color: "from-amber-600 to-yellow-500",
    books: [constitutionBook, historyBook, scienceBook],
  },
];
