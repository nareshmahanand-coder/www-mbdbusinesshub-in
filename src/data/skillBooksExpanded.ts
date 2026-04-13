/* ═══════════════════════════════════════════════════════════════════════
   EXPANDED CHAPTERS — Mobile Repairing & Tally Prime
   These get merged into the main books at runtime
   ═══════════════════════════════════════════════════════════════════════ */

import type { Chapter } from "./skillBooks";

/* ══════════════════════════════════════════
   MOBILE REPAIRING — Chapters 6-15
   ══════════════════════════════════════════ */
export const mobileRepairExpandedChapters: Chapter[] = [
  {
    title: "अध्याय 6: Camera और Audio System",
    pages: [
      {
        title: "Camera Module — संरचना और कार्यप्रणाली",
        content: `**Camera Module** आधुनिक स्मार्टफोन का सबसे महत्वपूर्ण feature बन गया है। इसकी गहरी समझ ज़रूरी है।

**Camera Module के भाग:**
• **Lens Assembly** — Multiple glass/plastic elements (5P, 6P, 7P lens)
• **IR Filter** — Infrared light block करता है (सही colour के लिए)
• **Image Sensor** — CMOS (Complementary Metal-Oxide Semiconductor)
  - **Sony IMX** series (IMX890, IMX989) — Premium sensors
  - **Samsung ISOCELL** (GN2, HP2) — 200MP तक
  - **OmniVision** — Budget phones
• **Autofocus Motor** — VCM (Voice Coil Motor) या Piezo
• **OIS Motor** — Optical Image Stabilization (barrel shift / lens shift)
• **FPC Connector** — Flexible Printed Circuit, motherboard से connection

**Camera कैसे काम करता है:**
1. Light → Lens → IR Filter → Image Sensor (CMOS)
2. CMOS → Analog Signal → ADC → Digital Data
3. ISP (Image Signal Processor, SoC में) → Image Processing
4. **Processing**: White Balance, Noise Reduction, HDR, AI Enhancement
5. **Output**: JPEG/HEIF/RAW format में storage में save

**Camera Problems और Solutions:**

**1. Camera Black Screen (काली स्क्रीन):**
• **Software Check**: Settings → Apps → Camera → Clear Cache → Restart
• **Safe Mode** test: Volume Down + Power → Safe Mode → Camera open
• **Hardware**: FPC Connector reseat → Camera Module replace
• **Camera IC** (ISP section on SoC): Rare, board level repair

**2. Camera Blur / Out of Focus:**
• **Autofocus Motor** stuck → Gently tap camera area → Temporarily fix
• AF Motor replace (VCM type) → Microsolder or module change
• **Lens scratched/cracked** → Module replace
• **Software**: Factory Reset camera settings

**3. Camera Vibrating/Shaking (OIS Malfunction):**
• OIS gyroscope sensor faulty → Gyroscope IC replace
• **OIS motor** mechanically stuck → Module replace
• **Temporary fix**: Disable OIS in Camera settings (if available)

**4. Front Camera Not Working:**
• **Flex Cable** damage (especially in notch/punch-hole designs)
• **Proximity/Ambient sensor** on same flex → Both fail together
• Check connector → Replace flex assembly

**5. Flash Not Working:**
• **LED** burnt → Multimeter diode mode check (0.5-1.0V = OK)
• **Flash IC** on motherboard → Voltage check
• FPC connection → Reseat or clean contacts`,
        diagram: `┌──────────────────────────────────────────────┐
│     Camera Module — Internal Architecture       │
├──────────────────────────────────────────────┤
│                                              │
│  Light Source (Scene)                        │
│       │                                      │
│       ▼                                      │
│  ┌─────────────┐                             │
│  │   Lens      │  5-7 Elements (Glass+Plastic)│
│  │   Assembly  │  f/1.8 aperture              │
│  │   ┌───┐     │  24mm equivalent focal       │
│  │   │ ○ │     │                             │
│  │   └───┘     │                             │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │  IR Filter  │  Blocks infrared light      │
│  │  (Blue glass)│  Ensures correct colors    │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │  AF Motor   │  VCM / Piezo type           │
│  │  + OIS Motor│  Moves lens for focus       │
│  └──────┬──────┘  + stabilization            │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ CMOS Sensor │  Sony IMX / Samsung         │
│  │ (50-200 MP) │  Pixel size: 0.6-2.0μm     │
│  │ ┌─┬─┬─┬─┬─┐ │  Bayer Filter: R G G B     │
│  │ │R│G│R│G│R│ │                             │
│  │ │G│B│G│B│G│ │  → Analog signal out        │
│  │ │R│G│R│G│R│ │                             │
│  │ └─┴─┴─┴─┴─┘ │                             │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │    ISP      │  Inside SoC (CPU chip)      │
│  │ (Image      │  HDR, NR, WB, AI Scene     │
│  │  Processor) │  → JPEG/HEIF → Storage     │
│  └─────────────┘                             │
└──────────────────────────────────────────────┘`
      },
      {
        title: "Audio System — Speaker, Mic, Earpiece",
        content: `**Audio System** मोबाइल का एक essential part है। Calls, Music, Recording सब इसी पर निर्भर है।

**Audio Signal Path:**
Digital Audio (Storage) → Audio Codec IC → DAC → Amplifier IC → Speaker/Earpiece
Microphone → ADC → Audio Codec IC → Digital Signal → CPU → Apps

**1. Speaker (स्पीकर):**
• **Types**: Mono (1 speaker) / Stereo (2 speakers — top + bottom)
• **Working**: Electrical signal → Electromagnet → Diaphragm vibration → Sound
• **Size**: 10-15mm diameter, 3-5mm thick
• **Testing**: Multimeter → Resistance check: **6-8 Ohm** = OK, OL = Open, 0 = Short
• **Problems**: No sound, Distorted sound, Low volume, Crackling

**2. Earpiece (इयरपीस — कान का स्पीकर):**
• Call सुनने के लिए ऊपर होता है
• **Resistance**: 25-32 Ohm (higher than speaker)
• FPC connector → PCB connection

**3. Microphone (माइक्रोफोन):**
• **Types**: Primary (bottom — calls), Secondary (top — noise cancellation), Third (video recording)
• **MEMS Microphone**: Micro-Electro-Mechanical System
• **Testing**: Recording app → Speak → Playback → Clear = OK
• Multimeter: Resistance check → ~1.5K Ohm
• **No mic sound**: Check FPC → Clean connector → Replace mic module

**4. Audio IC / Codec:**
• Converts Digital ↔ Analog (DAC + ADC combined)
• **Popular ICs**: Qualcomm WCD9385, Cirrus Logic CS35L45
• **Symptoms of failure**: No sound at all (speaker + earpiece + mic all dead)
• **Fix**: BGA rework — remove, reball, replace Audio IC

**5. Headphone Jack / USB Audio:**
• 3.5mm Jack: 4-pin TRRS (Tip-Ring-Ring-Sleeve) → Left, Right, Mic, Ground
• USB-C Audio: Digital signal through USB → External DAC in earphones
• **Jack problems**: One side no sound → Internal switch contacts corroded → Clean or replace

**Common Audio Fault Table:**
| Problem | Check | Fix |
|---------|-------|-----|
| No speaker sound | Speaker resistance | Replace speaker |
| No call sound | Earpiece connector | Replace earpiece |
| Mic not working | Mic module, IC | Replace mic/IC |
| Distorted sound | Speaker cone | Replace speaker |
| Low volume | Mesh blocked | Clean mesh/replace |`,
        diagram: `┌──────────────────────────────────────────────┐
│      Audio System — Complete Signal Path        │
├──────────────────────────────────────────────┤
│                                              │
│  ── PLAYBACK PATH ──                         │
│                                              │
│  Music/Call Audio (Digital)                   │
│       │                                      │
│       ▼                                      │
│  ┌─────────────┐                             │
│  │ Audio Codec │  WCD9385 / CS35L45          │
│  │ IC          │                             │
│  │ ┌───────┐   │                             │
│  │ │  DAC  │   │ Digital → Analog            │
│  │ └───┬───┘   │                             │
│  │     │       │                             │
│  │ ┌───┴───┐   │                             │
│  │ │  AMP  │   │ Amplifier (boost signal)    │
│  │ └───┬───┘   │                             │
│  └─────┼───────┘                             │
│        │                                     │
│   ┌────┴──────────────┐                      │
│   │                   │                      │
│   ▼                   ▼                      │
│ ┌──────────┐    ┌──────────┐                 │
│ │ Speaker  │    │ Earpiece │                 │
│ │ (Bottom) │    │ (Top)    │                 │
│ │ 6-8 Ohm  │    │ 25-32 Ohm│                 │
│ │ Loud     │    │ Call     │                 │
│ └──────────┘    └──────────┘                 │
│                                              │
│  ── RECORDING PATH ──                        │
│                                              │
│  Sound Wave → Mic                            │
│       │                                      │
│       ▼                                      │
│  ┌─────────────┐                             │
│  │ MEMS Mic    │  Bottom: Primary            │
│  │ Module      │  Top: Noise Cancel          │
│  └──────┬──────┘                             │
│         │ Analog Signal                      │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ Audio Codec │                             │
│  │ ┌───────┐   │                             │
│  │ │  ADC  │   │ Analog → Digital            │
│  │ └───┬───┘   │                             │
│  └─────┼───────┘                             │
│        │ Digital                             │
│        ▼                                     │
│  ┌─────────────┐                             │
│  │ CPU / SoC   │ → App (Call / Recording)    │
│  └─────────────┘                             │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 7: Sensor और Biometric Systems",
    pages: [
      {
        title: "Fingerprint, Face ID और Sensors",
        content: `**Sensors** स्मार्टफोन को "स्मार्ट" बनाते हैं। Auto-rotate, Fingerprint, Face Unlock सब sensors से ही काम करते हैं।

**1. Fingerprint Sensor (फिंगरप्रिंट सेंसर):**

**Types:**
• **Capacitive** (Physical button) — पुराने phones, Home button पर
  - Working: उंगली की ridges = conductor, valleys = insulator → Pattern बनता है
  - Accuracy: Very high, Fast (<0.3s)
  - Example: Samsung S7, iPhone 8

• **Optical** (Under display) — AMOLED displays में
  - Working: LED light → उंगली illuminate → Camera sensor capture → Pattern match
  - Location: Display के नीचे (specific area)
  - Speed: 0.3-0.5s
  - **Limitation**: Screen protector thick हो तो work नहीं करता

• **Ultrasonic** (Under display) — Premium phones
  - Working: Ultrasonic waves → 3D fingerprint map → More secure
  - Example: Samsung S21+, S22 Ultra
  - **Advantage**: Wet/Dirty fingers पर भी काम करता है
  - **Disadvantage**: Expensive, Slower than capacitive

• **Side-mounted** — Power button में built-in
  - Capacitive type, Power button पर
  - Fast, Accurate, Cost-effective
  - Example: Samsung A-series, Xiaomi Redmi

**Fingerprint Not Working — Troubleshooting:**
• **Re-register** fingerprint (Settings → Security → Delete → Re-add)
• **Clean sensor** area (IPA + soft cloth)
• **Connector check** — FPC reseat
• **Sensor module** replace
• **IC level**: Fingerprint controller IC on motherboard → BGA rework

**2. Proximity Sensor:**
• कान के पास लगाने पर display OFF करता है
• **IR LED + IR Receiver** pair
• Testing: Call लगाएं → हाथ से ढकें → Screen OFF = Working
• **Failure**: Screen stays ON during calls → Replace sensor/flex

**3. Accelerometer + Gyroscope:**
• **Accelerometer**: Phone tilt/movement detect → Auto-rotate, Step counter
• **Gyroscope**: Rotation detect → Games, 360° photos, VR
• Single IC (6-axis IMU) — e.g., Bosch BMI260, InvenSense ICM-42688
• **Failure**: No auto-rotate, Games don't respond to tilt
• Calibration: Settings → Accessibility → Motion → Calibrate

**4. Ambient Light Sensor:**
• Auto-brightness control
• Usually on front flex (near earpiece/front camera)
• **Failure**: Brightness stuck at one level

**5. Barometer:** Altitude measurement (weather, GPS accuracy)
**6. Magnetometer:** Digital compass (Maps direction)
**7. Hall Sensor:** Magnetic flip cover detection (screen ON/OFF)`,
        diagram: `┌──────────────────────────────────────────────┐
│     Fingerprint Sensors — Types Comparison      │
├──────────────────────────────────────────────┤
│                                              │
│  1. CAPACITIVE (Physical Button)             │
│  ┌──────────────────┐                        │
│  │  ╔══════════════╗ │                        │
│  │  ║   Finger     ║ │                        │
│  │  ║ /\\/\\/\\/\\/\\  ║ │  Ridges: conductor    │
│  │  ║              ║ │  Valleys: insulator   │
│  │  ╚══════════════╝ │                        │
│  │  ┌──────────────┐ │  Capacitor array      │
│  │  │Sensor Array  │ │  beneath surface      │
│  │  │C C C C C C C │ │  detects pattern      │
│  │  └──────────────┘ │                        │
│  └──────────────────┘                        │
│                                              │
│  2. OPTICAL (Under Display — AMOLED)         │
│  ┌──────────────────┐                        │
│  │  AMOLED Display  │                        │
│  │  ════════════════ │                        │
│  │  Light ↑  ↓ Light │ LED illuminates       │
│  │  ┌──────────────┐ │ finger from below     │
│  │  │ CMOS Sensor  │ │ Sensor captures       │
│  │  │ (Camera-like)│ │ reflected image       │
│  │  └──────────────┘ │                        │
│  └──────────────────┘                        │
│                                              │
│  3. ULTRASONIC (Under Display — Premium)     │
│  ┌──────────────────┐                        │
│  │  AMOLED Display  │                        │
│  │  ════════════════ │                        │
│  │  ))) Ultrasound ))) │ Sound waves create  │
│  │  ┌──────────────┐ │ 3D depth map of       │
│  │  │ Piezoelectric│ │ fingerprint ridges    │
│  │  │ Sensor       │ │ Most secure method    │
│  │  └──────────────┘ │                        │
│  └──────────────────┘                        │
│                                              │
│  Speed:  Capacitive > Ultrasonic > Optical   │
│  Security: Ultrasonic > Capacitive > Optical │
│  Cost:   Capacitive < Optical < Ultrasonic   │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 8: Water Damage Repair",
    pages: [
      {
        title: "पानी में गिरे फोन को कैसे ठीक करें",
        content: `**Water Damage** मोबाइल की सबसे खतरनाक समस्या है। तुरंत और सही कदम उठाना ज़रूरी है।

**Emergency Steps (तुरंत करें — पहले 30 मिनट महत्वपूर्ण):**
1. **तुरंत फोन निकालें** — जितनी देर पानी में, उतना ज्यादा नुकसान
2. **Power OFF करें** — अगर चालू है तो immediately बंद करें → Short circuit रोकने के लिए
3. **SIM Tray निकालें** — पानी अंदर जाने का रास्ता बंद करें
4. **हिलाएं नहीं** — पानी और अंदर जा सकता है
5. **Charge मत करें** — ⚠️ NEVER charge wet phone = Short circuit = DEAD
6. **Hair dryer मत use करें** — Hot air से components damage हो सकते हैं

**Professional Repair Process:**

**Step 1: Disassembly (खोलना):**
• सभी screws निकालें → Back cover open
• Battery disconnect करें (FIRST!)
• Display, Camera, Speaker, all flex cables disconnect

**Step 2: IPA Cleaning (इसोप्रोपिल अल्कोहल सफाई):**
• **99% IPA (Isopropyl Alcohol)** में motherboard डुबोएं
• **Soft brush** (Toothbrush size) से gently scrub करें
• **Corrosion** (सफ़ेद/हरे दाग) को carefully clean करें
• **BGA ICs** के नीचे flux apply → Hot air से gently heat → IPA clean
• ⚠️ कम से कम **2-3 बार** IPA wash करें

**Step 3: Ultrasonic Cleaning (अल्ट्रासोनिक सफाई):**
• Professional shops में **Ultrasonic Cleaner** machine होती है
• IPA + Board → Machine में 5-10 minutes
• Sound waves से microscopic corrosion भी साफ
• **Best results** — hand cleaning से बेहतर

**Step 4: Drying:**
• **PCB** को IPA से final wash → Air dry 2-3 hours
• **UV Lamp** या Dehumidifier में रखें (optional)
• पूरी तरह सूखने दें → No moisture should remain

**Step 5: Testing:**
• Battery reconnect → Power ON
• **DC PSU** से पहले test करें (short circuit check)
• सभी functions test: Display, Touch, Camera, Mic, Speaker, Charging, WiFi, Network

**Corrosion Types:**
• **White Corrosion** — Aluminium oxide → Mild, cleanable
• **Green Corrosion** — Copper oxide → Moderate, may damage traces
• **Black Corrosion** — Severe → PCB traces broken → Jumper wire needed

**Success Rate:**
• **Freshwater** + Quick action: **70-80%** success
• **Saltwater** (समुद्र): **30-40%** (salt = aggressive corrosion)
• **Delay 24+ hours**: **20-30%** (corrosion sets in fast)`,
        diagram: `┌──────────────────────────────────────────────┐
│     Water Damage Repair — Process Flow          │
├──────────────────────────────────────────────┤
│                                              │
│  📱 Phone in Water!                           │
│       │                                      │
│       ▼                                      │
│  ⚡ POWER OFF IMMEDIATELY ⚡                  │
│  ❌ Don't charge!                             │
│  ❌ Don't shake!                              │
│  ❌ Don't use hair dryer!                     │
│       │                                      │
│       ▼                                      │
│  ┌─────────────┐                             │
│  │ Disassemble │                             │
│  │ Remove:     │                             │
│  │ • Battery   │ ← FIRST!                   │
│  │ • Display   │                             │
│  │ • Cameras   │                             │
│  │ • All flex  │                             │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ IPA Wash    │  99% Isopropyl Alcohol      │
│  │ • Dip board │  Soft brush scrubbing       │
│  │ • Scrub     │  Focus on connectors        │
│  │ • 2-3x wash │  and IC areas               │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ Ultrasonic  │  Machine clean (5-10 min)   │
│  │ Cleaner     │  Removes micro-corrosion    │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ Dry Board   │  Air dry 2-3 hours          │
│  │             │  UV Lamp optional            │
│  └──────┬──────┘                             │
│         │                                    │
│         ▼                                    │
│  ┌─────────────┐                             │
│  │ Test with   │  DC PSU first (short check) │
│  │ DC PSU      │  Then battery               │
│  │ → Assemble  │  Test ALL functions          │
│  └─────────────┘                             │
│                                              │
│  Success Rate:                               │
│  Fresh water + Quick: 70-80% ✅               │
│  Salt water: 30-40% ⚠️                       │
│  Delayed 24h+: 20-30% ❌                     │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 9: iPhone Repair — Special Techniques",
    pages: [
      {
        title: "iPhone की विशेष मरम्मत तकनीक",
        content: `**iPhone Repair** Android से बहुत अलग है। Apple के phones में **special security**, **proprietary parts**, और **pairing system** होता है।

**iPhone vs Android Repair — Key Differences:**
• **Pentalobe Screws** — Special 5-point star screws (Apple only)
• **True Tone** — Display calibration data → Lost if screen replaced without proper tools
• **Serial Number Pairing** — Battery, Display, Camera सब motherboard से paired
• **FMI Lock** (Find My iPhone) → Hardware locked → Cannot bypass without Apple ID
• **No 3rd Party Parts** — Warnings appear with non-original parts

**iPhone Internal Architecture:**
• **L-shaped Battery** (iPhone X+) — 2 cells in L-shape
• **Stacked Motherboard** (iPhone X+) — 2 PCBs sandwiched together
• **Face ID Module** — TrueDepth camera system (cannot be replaced by 3rd party)
• **Lightning / USB-C** — Proprietary charging connector

**Common iPhone Repairs:**

**1. Screen Replacement:**
• Remove Pentalobe screws (bottom) → Suction cup → Carefully open from bottom edge
• Disconnect battery FIRST → Then display cables
• Transfer: Earpiece + Proximity sensor + Front camera flex (from old to new)
• **True Tone**: Use programmer (JC V1S / I2C Programmer) → Read from old → Write to new
• **⚠️ Warning**: "Non-genuine display" message will appear → Normal with 3rd party

**2. Battery Replacement:**
• Adhesive pull tabs → Slowly pull (don't break them!)
• If tabs break: IPA underneath + Plastic card → Gently pry
• New battery → Connect → Check health in Settings → Battery
• **Pairing**: iPhone 15+ shows "Unknown Part" → Needs serial pairing via programmer

**3. Face ID Not Working:**
• **Dot Projector** failure → Cannot be repaired (entire module)
• **Flood Illuminator** → Rarely repairable
• **IR Camera** → Module replacement needed
• ⚠️ Face ID components are **paired to motherboard** → Only Apple can re-pair
• **Exception**: Some 3rd party programmers (JC, REFOX) can re-pair select models

**4. iPhone Stuck on Apple Logo / Boot Loop:**
• **iTunes/Finder** → Recovery Mode → Update (doesn't erase data)
• **DFU Mode** → Restore (erases everything, reinstalls iOS)
• DFU Steps: Connect USB → Volume Up → Volume Down → Hold Power → Screen stays black → DFU

**5. Stacked Board Separation:**
• iPhone X and later: 2-layer motherboard
• **Separation** requires: Preheater + Hot Air + Thin blade/wire
• **Reballing** both layers → Fix IC → Reassemble → Reflow
• Difficulty: ★★★★★ (Expert only, high failure risk)`,
        diagram: `┌──────────────────────────────────────────────┐
│     iPhone — Internal Component Layout          │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │          Front View (Display side)       │ │
│  │                                         │ │
│  │  ┌─────────────────────────────────┐    │ │
│  │  │  Face ID Module (TrueDepth)     │    │ │
│  │  │  [IR Cam][Dot][Flood][FrontCam] │    │ │
│  │  └─────────────────────────────────┘    │ │
│  │                                         │ │
│  │  ┌─────────────────────────────────┐    │ │
│  │  │                                 │    │ │
│  │  │      OLED Display (Super        │    │ │
│  │  │      Retina XDR)                │    │ │
│  │  │                                 │    │ │
│  │  │      2532x1170 / 2796x1290     │    │ │
│  │  │                                 │    │ │
│  │  │      ProMotion: 120Hz (Pro)     │    │ │
│  │  │                                 │    │ │
│  │  └─────────────────────────────────┘    │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │          Back View (Internal)            │ │
│  │                                         │ │
│  │  ┌──────────────┐  ┌──────────┐        │ │
│  │  │ Camera       │  │Motherboard│        │ │
│  │  │ Module       │  │(Stacked  │        │ │
│  │  │ [Main]       │  │ 2-Layer) │        │ │
│  │  │ [Ultra]      │  │ ┌──────┐ │        │ │
│  │  │ [Tele]       │  │ │A17Pro│ │        │ │
│  │  └──────────────┘  │ │6GB   │ │        │ │
│  │                    │ │RAM   │ │        │ │
│  │  ┌──────────────┐  │ └──────┘ │        │ │
│  │  │ Taptic Engine│  └──────────┘        │ │
│  │  │ (Vibration)  │                      │ │
│  │  └──────────────┘                      │ │
│  │                                         │ │
│  │  ┌─────────────────────────────────┐   │ │
│  │  │    L-shaped Battery              │   │ │
│  │  │    3.83V / 4422 mAh (15 Pro Max)│   │ │
│  │  │    ┌────────┐                    │   │ │
│  │  │    │ Cell 1 │──────┐             │   │ │
│  │  │    └────────┘      │             │   │ │
│  │  │           ┌────────┴───┐         │   │ │
│  │  │           │   Cell 2   │         │   │ │
│  │  │           └────────────┘         │   │ │
│  │  └─────────────────────────────────┘   │ │
│  │                                         │ │
│  │  [Lightning/USB-C Port] [Speaker Grills]│ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 10: IC Level Motherboard Repair",
    pages: [
      {
        title: "Motherboard Level Advanced Fault Finding",
        content: `**IC Level Repair** मोबाइल रिपेयरिंग का सबसे **advanced और profitable** skill है। इसमें schematic diagram पढ़ना और individual IC replace करना सीखते हैं।

**Schematic Diagram (सर्किट डायग्राम) पढ़ना:**

**1. Schematic क्या है?**
• Motherboard का **complete electrical map**
• हर IC, resistor, capacitor, connector — सब दिखाया जाता है
• **ZXW Tool** या **Wuxinji** — Popular schematic software (Chinese, ₹500-2000/year)

**2. Schematic Symbols:**
• **R** = Resistor (प्रतिरोध) — □ box with value (10K, 47K)
• **C** = Capacitor (संधारित्र) — || symbol with value (100nF, 10μF)
• **L** = Inductor (Coil) — ∿∿∿ symbol
• **D** = Diode — ▷| symbol (one direction current)
• **Q** = MOSFET/Transistor — Switch, Amplifier
• **U** = IC (Integrated Circuit) — Rectangle with pins

**3. Power Rail Tracing:**
• PMIC → Generates multiple voltage rails
• Each rail has a name: **VDD_CORE**, **VDD_MEM**, **VDD_IO**, **VDD_RF**
• Trace from PMIC output → Through inductors → To destination IC
• **Missing voltage** = Problem in that rail → Check components on path

**Fault Finding Using Schematic:**

**Example: No WiFi**
1. Open schematic → Find WiFi IC (e.g., WCN3990)
2. Check power input pins → Is **VDD_WIFI (1.8V)** present?
3. Trace VDD_WIFI back → PMIC Rail → LDO output
4. If 1.8V missing → Check LDO → Enable signal → Feedback resistor
5. If 1.8V present → WiFi IC itself dead → Replace IC

**Example: No Backlight (Screen Dark)**
1. Schematic → Find Display Backlight IC (e.g., LM3697)
2. Check **LED+** output → Should be 20-25V (boost converter)
3. If 0V → Check Backlight IC → Input voltage → Enable pin
4. Check boost inductor → Capacitor → Schottky diode in boost circuit
5. If all OK → Backlight IC dead → Replace

**Common ICs on Motherboard:**
| IC Name | Function | Failure Symptom |
|---------|----------|-----------------|
| PMIC | Power management | Dead, No charge |
| CPU/SoC | Processing | Dead, Boot loop |
| WiFi IC | WiFi/BT | No WiFi/BT |
| Audio IC | Sound | No sound |
| RF IC | Network | No signal |
| eMMC/UFS | Storage | Boot loop, data |
| Backlight IC | Screen light | Dark screen |
| Charging IC | Charging | No charge |
| Baseband PM | Network power | No network |`,
        diagram: `┌──────────────────────────────────────────────┐
│     Motherboard — IC Location Map               │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │        MOTHERBOARD (PCB) — Top Side      │ │
│  │                                         │ │
│  │  ┌────────┐         ┌────────┐          │ │
│  │  │  CPU   │         │  RF IC │          │ │
│  │  │  SoC   │         │(Trans- │          │ │
│  │  │        │         │ceiver) │          │ │
│  │  │Snapdrgn│         └────────┘          │ │
│  │  │  /MTK  │                             │ │
│  │  └────────┘    ┌────────┐               │ │
│  │                │ WiFi IC│               │ │
│  │  ┌────────┐    │ WCN    │               │ │
│  │  │  PMIC  │    └────────┘               │ │
│  │  │(Power) │                             │ │
│  │  │PM8150  │    ┌────────┐               │ │
│  │  └────────┘    │Audio IC│               │ │
│  │                │Codec   │               │ │
│  │  ┌────────┐    └────────┘               │ │
│  │  │Charging│                             │ │
│  │  │IC/SMB  │    ┌────────┐               │ │
│  │  └────────┘    │Backlit │               │ │
│  │                │IC      │               │ │
│  │                └────────┘               │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │        MOTHERBOARD — Bottom Side         │ │
│  │                                         │ │
│  │  ┌────────┐    ┌────────┐               │ │
│  │  │  RAM   │    │ eMMC / │               │ │
│  │  │ LPDDR5 │    │  UFS   │               │ │
│  │  │ 8GB    │    │Storage │               │ │
│  │  └────────┘    │ 128GB  │               │ │
│  │                └────────┘               │ │
│  │                                         │ │
│  │  ┌────────┐    ┌────────┐               │ │
│  │  │Baseband│    │ NFC IC │               │ │
│  │  │PM IC   │    └────────┘               │ │
│  │  └────────┘                             │ │
│  │                ┌────────┐               │ │
│  │                │eFuse IC│               │ │
│  │                └────────┘               │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  Fault Finding: Schematic → Trace power rail │
│  → Measure with Multimeter → Find bad IC     │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 11: eMMC/UFS — Data Recovery",
    pages: [
      {
        title: "Storage IC और Data Recovery",
        content: `**eMMC (embedded MultiMediaCard)** और **UFS (Universal Flash Storage)** मोबाइल की permanent storage ICs हैं। इनमें OS, Apps, और User Data सब store होता है।

**eMMC vs UFS:**
| Feature | eMMC | UFS |
|---------|------|-----|
| Speed | 100-400 MB/s | 500-4200 MB/s |
| Interface | Parallel | Serial (SCSI) |
| Lanes | Single | Dual (Read+Write same time) |
| Used in | Budget phones | Mid-Premium phones |
| Version | 4.5, 5.0, 5.1 | 2.0, 2.1, 3.1, 4.0 |

**eMMC/UFS Failures:**
• **Boot Loop** — OS partition corrupt
• **Dead Phone** — eMMC completely dead, CPU can't read boot data
• **Storage Full + Slow** — Bad blocks accumulated
• **Data Corruption** — File system damaged, apps crash

**eMMC/UFS Repair Methods:**

**Method 1: ISP (In-System Programming):**
• eMMC/UFS को **board पर ही program** करना
• **ISP Pinout**: CLK, CMD, DAT0, VCC, VCCQ, GND
• **Tools**: Easy JTAG Plus, UFi Box, Medusa Pro
• Schematic से ISP points find करें → Fine wire solder → Connect to box → Read/Write

**Method 2: Direct eMMC (Remove and Program):**
• Hot Air से eMMC IC remove करें
• **BGA Socket** (e.g., eMCP/eMMC socket adapter) में लगाएं
• Programmer (UFi Box, Easy JTAG) से connect
• **Read Full Dump** → Save as backup
• **Write Fresh Firmware** → Flash stock ROM partition-by-partition
• Reball → Place back on board → Reflow

**Method 3: EDL/Download Mode (Software Level):**
• CPU-level programming mode (no storage IC removal needed)
• **Qualcomm EDL**: Emergency Download via USB
• **MediaTek BROM**: Boot ROM download mode
• Tools: QPST/QFil (Qualcomm), SP Flash Tool (MediaTek)

**Data Recovery from Dead Phone:**
1. Remove eMMC/UFS → Read in programmer
2. **User data partition** extract → Mount on computer
3. Use data recovery software → Recover photos, contacts, messages
4. ⚠️ If eMMC has bad blocks → Limited recovery possible
5. ⚠️ Encrypted phones → Need pin/password to decrypt

**eMMC Change (Upgrade Storage):**
• Remove old eMMC (e.g., 32GB) → Put new bigger (e.g., 128GB)
• Write firmware → Boot loader → OS → Done!
• **Same package type** ज़रूरी (BGA-153 या BGA-169)
• Popular upgrade: 16GB → 64GB, 32GB → 128GB (Good business!)`,
        diagram: `┌──────────────────────────────────────────────┐
│     eMMC/UFS — Data Recovery Process            │
├──────────────────────────────────────────────┤
│                                              │
│  Phone Dead / Boot Loop / Data Needed        │
│       │                                      │
│       ├──→ Method 1: Software (EDL/BROM)     │
│       │    • No disassembly needed           │
│       │    • USB cable → Programmer box      │
│       │    • Flash firmware partitions       │
│       │                                      │
│       ├──→ Method 2: ISP (In-System)         │
│       │    • Open phone → Find ISP points    │
│       │    ┌─────────────────┐               │
│       │    │ Motherboard     │               │
│       │    │  ┌─────┐        │               │
│       │    │  │eMMC │←─ISP   │               │
│       │    │  │ IC  │  Wires │               │
│       │    │  └─────┘  │     │               │
│       │    └───────────┼─────┘               │
│       │                │                     │
│       │            ┌───┴────┐                │
│       │            │ UFi Box│ Read/Write     │
│       │            └────────┘                │
│       │                                      │
│       └──→ Method 3: Direct (Remove IC)      │
│            • Hot Air → Remove eMMC           │
│            ┌──────────┐                      │
│            │  eMMC IC │                      │
│            │ (removed)│                      │
│            └────┬─────┘                      │
│                 │                            │
│                 ▼                            │
│            ┌──────────┐                      │
│            │BGA Socket│                      │
│            │ Adapter  │                      │
│            └────┬─────┘                      │
│                 │                            │
│                 ▼                            │
│            ┌──────────┐                      │
│            │Programmer│                      │
│            │(UFi/JTAG)│                      │
│            └────┬─────┘                      │
│                 │                            │
│            Read Dump → Recover Data          │
│            Flash New FW → Reball → Refit     │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 12: Business Setup — मोबाइल रिपेयर का बिज़नेस",
    pages: [
      {
        title: "अपनी मोबाइल रिपेयरिंग शॉप कैसे खोलें",
        content: `**मोबाइल रिपेयरिंग** भारत में सबसे demanding और profitable small business में से एक है। सही planning से महीने के ₹50,000-₹2,00,000 कमा सकते हैं।

**Step 1: Training और Skill Level (3-6 महीने):**
• **Basic Level** (1-2 महीने): Software flash, Screen change, Battery change, Charging port
  - Earning Potential: ₹15,000-25,000/month
• **Intermediate Level** (2-3 महीने): IC soldering, Fault finding, Data recovery
  - Earning Potential: ₹30,000-60,000/month
• **Advanced Level** (3-6 महीने): BGA rework, Motherboard repair, iPhone
  - Earning Potential: ₹60,000-2,00,000+/month

**Step 2: Investment (पूंजी लगाना):**

**Basic Setup (₹30,000-50,000):**
• Screwdriver Set: ₹500-1,500
• Multimeter: ₹1,000-3,000
• Soldering Iron (basic): ₹500-1,500
• DC Power Supply: ₹3,000-5,000
• Opening Tools (Spudger, Suction): ₹500-1,000
• Spare Parts Stock: ₹10,000-20,000
• Furniture (Table, Chair): ₹5,000-10,000

**Professional Setup (₹1,00,000-2,50,000):**
• Hot Air Rework Station: ₹8,000-25,000
• Soldering Station (Hakko): ₹5,000-15,000
• Microscope (Binocular): ₹10,000-30,000
• BGA Stencils Kit: ₹3,000-5,000
• Ultrasonic Cleaner: ₹5,000-10,000
• UV Curing Lamp: ₹2,000-5,000
• OCA Machine (Glass change): ₹15,000-40,000

**Step 3: Location (जगह चुनना):**
• **Market area** — Mobile shops के पास (footfall ज्यादा)
• **College/University** area — Students = Regular customers
• **Residential area** — कम competition, loyal customers
• **Rent**: ₹3,000-15,000/month (शहर पर निर्भर)
• **Size**: 100-200 sq ft enough for start

**Step 4: Revenue Sources:**
| Service | Charge (₹) | Time | Parts Cost |
|---------|-----------|------|------------|
| Screen Change | 1500-8000 | 30 min | 800-5000 |
| Battery Change | 500-1500 | 15 min | 200-700 |
| Charging Port | 300-1000 | 20 min | 50-200 |
| Software Flash | 300-800 | 30 min | 0 |
| Water Damage | 1500-5000 | 2-4 hrs | 100-500 |
| Motherboard IC | 2000-10000 | 1-3 hrs | 200-2000 |
| Data Recovery | 2000-15000 | 1-5 hrs | 0-500 |

**Step 5: Marketing:**
• **Google My Business** listing (free, most important!)
• **JustDial, Sulekha** listing
• **WhatsApp Business** — Status updates, Customer groups
• **Instagram/YouTube** — Repair videos → Build trust
• **Visiting Cards** — Local distribution
• **Signboard** — Clear, Visible, Professional`,
        diagram: `┌──────────────────────────────────────────────┐
│     Mobile Repair Business — Revenue Model      │
├──────────────────────────────────────────────┤
│                                              │
│  Monthly Revenue Estimate (Average Shop):    │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │  Service          │ Jobs/Mo │ Revenue    │ │
│  ├────────────────────┼─────────┼──────────│ │
│  │ Screen Replace    │   20    │ ₹40,000   │ │
│  │ Battery Replace   │   30    │ ₹15,000   │ │
│  │ Software/Flash    │   25    │ ₹10,000   │ │
│  │ Charging Port     │   20    │ ₹8,000    │ │
│  │ Water Damage      │   5     │ ₹12,500   │ │
│  │ IC/Board Repair   │   5     │ ₹20,000   │ │
│  │ Data Recovery     │   3     │ ₹15,000   │ │
│  │ Accessories Sale  │   50    │ ₹10,000   │ │
│  ├────────────────────┼─────────┼──────────│ │
│  │ TOTAL REVENUE     │         │₹1,30,500  │ │
│  │ Parts/Expenses    │         │ -₹45,000  │ │
│  │ Rent + Bills      │         │ -₹15,000  │ │
│  ├────────────────────┼─────────┼──────────│ │
│  │ NET PROFIT        │         │ ₹70,500   │ │
│  └────────────────────┴─────────┴──────────┘ │
│                                              │
│  Growth Path:                                │
│  Year 1: Solo → ₹40-60K/month              │
│  Year 2: +1 Helper → ₹80K-1.2L/month       │
│  Year 3: Training + Repair → ₹1.5-3L/month │
│  Year 5: Multi-branch → ₹5-10L+/month      │
│                                              │
│  Key Success Factors:                        │
│  ✅ Quality work = Repeat customers          │
│  ✅ Fast turnaround = More jobs              │
│  ✅ Fair pricing = Word of mouth             │
│  ✅ YouTube presence = Trust building        │
└──────────────────────────────────────────────┘`
      },
    ],
  },
];

/* ══════════════════════════════════════════
   TALLY PRIME — Expanded Chapters 3-10
   ══════════════════════════════════════════ */
export const tallyExpandedChapters: Chapter[] = [
  {
    title: "अध्याय 3: GST in Tally — जीएसटी",
    pages: [
      {
        title: "GST की संपूर्ण समझ और Tally में Setup",
        content: `**GST (Goods and Services Tax)** भारत का **एकीकृत अप्रत्यक्ष कर** है जो 1 जुलाई 2017 से लागू है। Tally Prime में GST पूरी तरह integrated है।

**GST के प्रकार:**
• **CGST** (Central GST) — केंद्र सरकार को → Same state sale
• **SGST** (State GST) — राज्य सरकार को → Same state sale
• **IGST** (Integrated GST) — केंद्र को → Inter-state sale
• **UTGST** — Union Territory GST

**GST Tax Rates:**
• **0%**: दूध, सब्जी, फल, अनाज, नमक, ताज़ा मांस
• **5%**: चीनी, चाय, मसाले, तेल, शिक्षा सामग्री
• **12%**: फ्रोज़न मीट, प्रसंस्कृत खाद्य, मोबाइल फोन
• **18%**: IT सेवाएं, रेस्तरां, कैपिटल goods, अधिकांश services
• **28%**: कार, AC, TV, सिगरेट, luxury items, cement

**Tally में GST Setup:**

**Step 1: Company में GST Enable**
• Gateway → F11 (Features) → Statutory & Taxation
• Enable Goods & Services Tax (GST): **Yes**
• GST Registration Type: **Regular** (Turnover > ₹40L) / Composition (₹1.5Cr तक)
• State: अपना राज्य चुनें
• GSTIN: 15-digit number enter करें

**Step 2: GST Rate Ledger बनाना**
• Input/Output CGST @ 9%: Under "Duties & Taxes" → Tax type: GST → Type: CGST → Rate: 9%
• Input/Output SGST @ 9%: Same → Type: SGST → Rate: 9%
• Input/Output IGST @ 18%: Same → Type: IGST → Rate: 18%

**Step 3: Party Ledger में GST**
• Customer/Supplier create → Registration Type: Regular/Unregistered
• GSTIN: Customer/Supplier का GST number
• State: Auto IGST vs CGST+SGST decide

**Step 4: Stock Item में HSN Code**
• Stock Item → GST Applicable: Yes
• HSN Code: Harmonized System of Nomenclature (e.g., 8517 for Mobile phones)
• GST Rate: 18% (example)
• Taxability: Taxable / Exempt / Nil Rated

**GST Entry Example (Same State Sale):**
Sales Voucher (F8):
• Party: XYZ Traders (UP) → Debit
• Sales A/c → Credit
• Item: Mobile Phone (₹10,000)
• CGST @ 9%: ₹900 (Auto)
• SGST @ 9%: ₹900 (Auto)
• Total Invoice: ₹11,800`,
        diagram: `┌──────────────────────────────────────────────┐
│     GST Structure — Tax Flow Diagram            │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │     INTRA-STATE (Same State) Sale        │ │
│  │                                         │ │
│  │  Seller (UP) ──→ Buyer (UP)             │ │
│  │                                         │ │
│  │  Item Value:     ₹10,000                │ │
│  │  + CGST @ 9%:    ₹   900 → Central Govt│ │
│  │  + SGST @ 9%:    ₹   900 → State Govt  │ │
│  │  ─────────────────────────              │ │
│  │  Invoice Total:  ₹11,800                │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │     INTER-STATE (Different State) Sale   │ │
│  │                                         │ │
│  │  Seller (UP) ──→ Buyer (Maharashtra)    │ │
│  │                                         │ │
│  │  Item Value:     ₹10,000                │ │
│  │  + IGST @ 18%:   ₹ 1,800 → Central Govt│ │
│  │  ─────────────────────────              │ │
│  │  Invoice Total:  ₹11,800                │ │
│  │                                         │ │
│  │  (Central splits IGST → CGST + SGST    │ │
│  │   to respective state)                  │ │
│  └─────────────────────────────────────────┘ │
│                                              │
│  GST Returns in Tally:                       │
│  ┌──────────────────────────────────┐        │
│  │ GSTR-1: Sales Return (Monthly)  │        │
│  │ → Invoice-wise sales details    │        │
│  │ → Due: 11th of next month       │        │
│  ├──────────────────────────────────┤        │
│  │ GSTR-3B: Summary Return         │        │
│  │ → Tax liability summary         │        │
│  │ → ITC (Input Tax Credit) claim  │        │
│  │ → Due: 20th of next month       │        │
│  ├──────────────────────────────────┤        │
│  │ GSTR-9: Annual Return           │        │
│  │ → Yearly summary                │        │
│  │ → Due: 31st December            │        │
│  └──────────────────────────────────┘        │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 4: Inventory Management — स्टॉक प्रबंधन",
    pages: [
      {
        title: "Stock Group, Item, Godown — इन्वेंट्री सेटअप",
        content: `**Inventory Management** Tally की सबसे powerful feature है। दुकान/गोदाम का पूरा स्टॉक Tally में manage करें।

**Step 1: Inventory Features Enable**
• Gateway → F11 → Inventory Features
• Enable: Maintain multiple Godowns, Track batches, Use different actual & billed quantities

**Step 2: Units of Measure (माप की इकाई):**
• Gateway → Masters → Inventory → Unit → Create
• **Simple Units**: Nos (Numbers), Kg, Ltr, Mtr, Box, Pcs
• **Compound Units**: 1 Box = 12 Nos (Box of Nos)

**Step 3: Stock Group (स्टॉक समूह):**
• Like Ledger Groups but for items
• Examples: Electronics, Groceries, Stationery, Garments
• Sub-groups: Electronics → Mobile Phones, Laptops, Accessories

**Step 4: Stock Item (स्टॉक आइटम):**
• Gateway → Masters → Inventory → Stock Items → Create
• **Name**: Samsung Galaxy A15
• **Under**: Mobile Phones (Stock Group)
• **Units**: Nos
• **GST**: HSN Code: 8517, Rate: 18%
• **Opening Balance**: 10 Nos @ ₹12,000 each = ₹1,20,000

**Step 5: Godown (गोदाम):**
• Different storage locations track करें
• Main Store, Showroom, Warehouse
• Transfer between godowns: Stock Journal (F7 Alt+F7)

**Inventory Vouchers:**

**1. Purchase (F9 — खरीद):**
• Supplier → Items with rate, quantity → Auto tax → Save
• Stock increases automatically

**2. Sales (F8 — बिक्री):**
• Customer → Items → Auto stock reduction
• If stock insufficient → Warning shows

**3. Stock Journal (Alt+F7):**
• Godown transfer: Main Store → Showroom
• Manufacturing: Raw materials → Finished goods

**4. Physical Stock (Alt+F10):**
• Physical count करें → Tally में enter → Difference auto-calculate
• Excess/Shortage → Adjustment entry

**Inventory Reports:**
• **Stock Summary**: सभी items का current stock
• **Movement Analysis**: Item-wise in/out/balance
• **Ageing Analysis**: कितने दिन से stock पड़ा है
• **Reorder Level**: Minimum stock alert → Auto reorder suggestion
• **Godown Summary**: Location-wise stock`,
        diagram: `┌──────────────────────────────────────────────┐
│     Inventory Structure in Tally                │
├──────────────────────────────────────────────┤
│                                              │
│  Stock Groups (Hierarchy):                   │
│  ┌──────────────────────────────────┐        │
│  │  Primary (All Items)             │        │
│  │  ├── Electronics                 │        │
│  │  │   ├── Mobile Phones           │        │
│  │  │   │   ├── Samsung Galaxy A15  │        │
│  │  │   │   ├── Redmi Note 13       │        │
│  │  │   │   └── Realme 12 Pro       │        │
│  │  │   ├── Accessories             │        │
│  │  │   │   ├── Charger 65W         │        │
│  │  │   │   ├── Tempered Glass      │        │
│  │  │   │   └── Back Cover          │        │
│  │  │   └── Laptops                 │        │
│  │  │       ├── HP Pavilion 15      │        │
│  │  │       └── Lenovo IdeaPad      │        │
│  │  ├── Groceries                   │        │
│  │  │   ├── Rice (Kg)               │        │
│  │  │   ├── Sugar (Kg)              │        │
│  │  │   └── Oil (Ltr)               │        │
│  │  └── Stationery                  │        │
│  │      ├── Pen (Nos)               │        │
│  │      └── Notebook (Nos)          │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Godown (Storage Locations):                 │
│  ┌──────────────────────────────────┐        │
│  │  Main Godown                     │        │
│  │  ├── Samsung A15: 50 Nos         │        │
│  │  └── Charger: 100 Nos            │        │
│  │                                  │        │
│  │  Showroom                        │        │
│  │  ├── Samsung A15: 5 Nos          │        │
│  │  └── Charger: 20 Nos             │        │
│  │                                  │        │
│  │  Stock Journal: Transfer         │        │
│  │  Main → Showroom: 5 Samsung A15  │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Stock Summary Report:                       │
│  Item          │ Qty │ Rate    │ Value       │
│  ─────────────┼─────┼─────────┼────────────│
│  Samsung A15  │ 55  │ ₹12,000 │ ₹6,60,000  │
│  Charger 65W  │ 120 │ ₹800    │ ₹96,000    │
│  Tempered Glass│ 200│ ₹50     │ ₹10,000    │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 5: Financial Statements — वित्तीय विवरण",
    pages: [
      {
        title: "Balance Sheet, P&L, Trial Balance",
        content: `**Financial Statements** (वित्तीय विवरण) किसी भी business की financial health बताते हैं। Tally इन्हें **automatically generate** करता है।

**1. Trial Balance (तलपट):**
• सभी ledgers का **Debit और Credit total**
• Purpose: Books सही हैं या नहीं — verify करने के लिए
• **Rule**: Total Debit = Total Credit (हमेशा बराबर)
• Tally: Gateway → Reports → Trial Balance
• अगर बराबर नहीं → कहीं entry गलत है → Find और correct करें

**2. Profit & Loss Account (लाभ-हानि खाता):**
• एक निश्चित अवधि में कितना **फायदा या नुकसान** हुआ
• **Income - Expenses = Profit (or Loss)**

**Structure:**
• **Trading Account** (व्यापार खाता):
  - Opening Stock + Purchases - Closing Stock = **Cost of Goods Sold (COGS)**
  - Sales - COGS = **Gross Profit**
• **Profit & Loss Account**:
  - Gross Profit + Other Income - Indirect Expenses = **Net Profit**
  - Indirect Expenses: Salary, Rent, Electricity, Advertising, Depreciation

**3. Balance Sheet (तुलन पत्र):**
• किसी **तिथि विशेष** पर business की कुल financial position
• **Assets = Liabilities + Capital** (हमेशा बराबर)

**Assets (संपत्ति):**
• **Fixed Assets**: Land, Building, Machinery, Furniture, Vehicle
• **Current Assets**: Cash, Bank, Stock, Debtors (जिनसे लेना है)
• **Investments**: Shares, FD, Bonds

**Liabilities (देनदारी):**
• **Current Liabilities**: Creditors (जिन्हें देना है), Short-term loans
• **Long-term Liabilities**: Bank loan, Mortgage
• **Capital**: Owner's investment + Retained profits

**Tally Reports Navigation:**
• Gateway → Reports → Balance Sheet
• Gateway → Reports → Profit & Loss A/c
• **F2**: Date change → Any period का report
• **Alt+F5**: Detailed view (ledger-wise breakup)
• **F12**: Configure columns, show percentages

**Important Ratios (अनुपात):**
• **Gross Profit Ratio** = (Gross Profit / Net Sales) × 100
• **Net Profit Ratio** = (Net Profit / Net Sales) × 100
• **Current Ratio** = Current Assets / Current Liabilities (Ideal: 2:1)
• **Quick Ratio** = (Current Assets - Stock) / Current Liabilities (Ideal: 1:1)
• **Debt-Equity Ratio** = Total Debt / Owner's Equity (Lower = Better)`,
        diagram: `┌──────────────────────────────────────────────┐
│     Balance Sheet — Format & Structure          │
├──────────────────────────────────────────────┤
│                                              │
│  ┌──────────────────┬───────────────────┐    │
│  │   LIABILITIES    │     ASSETS        │    │
│  │   (Sources)      │     (Uses)        │    │
│  ├──────────────────┼───────────────────┤    │
│  │                  │                   │    │
│  │ Capital   5,00,000│ Fixed Assets      │    │
│  │ + Net Profit     │ Land      3,00,000│    │
│  │   1,50,000       │ Building  2,00,000│    │
│  │ = Owner's Equity │ Furniture   50,000│    │
│  │   6,50,000       │ Vehicle  1,00,000│    │
│  │                  │          ─────────│    │
│  │ Bank Loan        │          6,50,000│    │
│  │   3,00,000       │                   │    │
│  │                  │ Current Assets    │    │
│  │ Creditors        │ Cash       80,000│    │
│  │   1,20,000       │ Bank     1,50,000│    │
│  │                  │ Stock    1,40,000│    │
│  │ Outstanding      │ Debtors    90,000│    │
│  │ Expenses  40,000 │ Prepaid    40,000│    │
│  │                  │          ─────────│    │
│  │                  │          5,00,000│    │
│  │                  │                   │    │
│  │ Provisions       │ Investments       │    │
│  │   40,000         │ FD         60,000│    │
│  │                  │                   │    │
│  ├──────────────────┼───────────────────┤    │
│  │ TOTAL:11,50,000  │ TOTAL: 11,50,000 │    │
│  │   (Always Equal) │   ✅ Balanced!    │    │
│  └──────────────────┴───────────────────┘    │
│                                              │
│  P&L Summary:                                │
│  Sales: ₹25,00,000                           │
│  - COGS: ₹18,00,000                         │
│  = Gross Profit: ₹7,00,000 (28%)            │
│  - Expenses: ₹5,50,000                      │
│  = Net Profit: ₹1,50,000 (6%) ✅             │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 6: Banking और Reconciliation",
    pages: [
      {
        title: "Bank Entries, Cheque Management, BRS",
        content: `**Banking** हर business का अभिन्न हिस्सा है। Tally में bank transactions और reconciliation आसानी से करें।

**Bank Ledger Create करना:**
• Gateway → Masters → Ledger → Create
• Name: State Bank of India (SBI)
• Under: **Bank Accounts** group
• A/c Number: Enter your account number
• IFSC: Enter IFSC code
• Opening Balance: ₹1,50,000 (if any)

**Bank Transaction Entries:**

**1. Payment by Cheque/NEFT (F5):**
• Dr: Supplier/Expense → Cr: Bank A/c
• Instrument Type: Cheque/NEFT/RTGS/UPI
• Cheque Number: Enter → Auto cheque register maintain
• Date of cheque → Reconciliation में use

**2. Receipt by Cheque/NEFT (F6):**
• Dr: Bank A/c → Cr: Customer/Income
• Instrument details → Same as above

**3. Cash Deposit to Bank:**
• Dr: Bank A/c → Cr: Cash A/c
• Narration: "Cash deposited to SBI"

**4. Cash Withdrawal from Bank:**
• Dr: Cash A/c → Cr: Bank A/c
• Via Cheque/ATM

**Bank Reconciliation Statement (BRS):**

**BRS क्यों ज़रूरी है:**
• Tally में entry date ≠ Bank में actual credit/debit date
• Cheque issue → 2-3 दिन बाद clear होता है
• **Reconcile** = Tally balance को Bank statement से match कराना

**BRS Process in Tally:**
1. Gateway → Banking → Bank Reconciliation
2. Bank Ledger select करें (e.g., SBI)
3. Bank statement date enter करें
4. **Bank Statement Balance** enter करें (Passbook/Online statement से)
5. हर transaction के सामने **Bank Date** enter करें (जिस date bank ने process किया)
6. Reconciled = ✅, Not cleared = Blank
7. Difference should be **ZERO** at end

**Cheque Management:**
• Post-Dated Cheque (PDC): Future date का cheque → Tally tracks separately
• Cheque Register: Gateway → Banking → Cheque Register
• Bounced Cheque: Reverse entry → Receipt/Payment reversal

**Important Points:**
• **Always** bank reconciliation monthly करें
• Mismatch reasons: Pending cheques, Bank charges, Interest, Errors
• Year-end BRS → Audit के लिए ज़रूरी
• **Ctrl+F9**: View all reconciled/un-reconciled entries`,
        diagram: `┌──────────────────────────────────────────────┐
│     Bank Reconciliation — Process               │
├──────────────────────────────────────────────┤
│                                              │
│  Tally Book Balance        Bank Statement    │
│  (as per our books)        (as per bank)     │
│                                              │
│  ┌──────────────┐        ┌──────────────┐    │
│  │ Tally shows: │        │ Bank shows:  │    │
│  │ ₹1,50,000    │        │ ₹1,35,000    │    │
│  │              │        │              │    │
│  │ Difference   │←──────→│ ₹15,000      │    │
│  └──────────────┘        └──────────────┘    │
│                                              │
│  WHY DIFFERENCE?                             │
│  ┌──────────────────────────────────────┐    │
│  │ 1. Cheque issued but not cleared     │    │
│  │    (Tally: -₹20,000 | Bank: not yet)│    │
│  │                                      │    │
│  │ 2. Bank charges debited              │    │
│  │    (Tally: not entered | Bank: -₹500)│    │
│  │                                      │    │
│  │ 3. Interest credited by bank         │    │
│  │    (Tally: not entered | Bank: +₹800)│    │
│  │                                      │    │
│  │ 4. Cheque deposited but not cleared  │    │
│  │    (Tally: +₹5,000 | Bank: not yet) │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  RECONCILIATION STEPS:                       │
│  ┌──────────────────────────────────┐        │
│  │ 1. Get bank statement (monthly)  │        │
│  │ 2. Open Bank Reconciliation      │        │
│  │ 3. Enter bank statement balance  │        │
│  │ 4. Match each transaction        │        │
│  │ 5. Enter bank clearing date      │        │
│  │ 6. Check: Difference = ₹0 ✅      │        │
│  │ 7. If not zero → Find error      │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Tally Path:                                 │
│  Gateway → Banking → Bank Reconciliation     │
│  → Select Bank → Enter dates → Reconcile     │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 7: TDS/TCS in Tally",
    pages: [
      {
        title: "TDS/TCS — कटौती और Tally Entry",
        content: `**TDS (Tax Deducted at Source)** — Payment करते समय tax काटकर government को जमा करना।
**TCS (Tax Collected at Source)** — Sale करते समय tax collect करके government को जमा करना।

**TDS कब काटना होता है:**
• **Salary** (Section 192): Employer काटता है
• **Professional Fee** (194J): ₹30,000+ payment → 10% TDS
• **Rent** (194I): ₹2,40,000+/year → 10% TDS
• **Contract** (194C): ₹30,000+ single / ₹1,00,000+ yearly → 1-2% TDS
• **Commission** (194H): ₹15,000+ → 5% TDS

**Tally में TDS Setup:**

**Step 1: TDS Feature Enable**
• Gateway → F11 → Statutory → Enable TDS: **Yes**
• TAN Number enter करें (Tax Deduction Account Number)

**Step 2: TDS Nature of Payment Ledger**
• Gateway → Masters → TDS Nature of Payment
• Select: Professional Fee (194J) / Rent (194I) / Contract (194C)

**Step 3: TDS Ledger Create**
• Name: TDS on Professional Fee @10%
• Under: Duties & Taxes
• Type: TDS → Nature: 194J → Rate: 10%

**Step 4: Party Ledger**
• Supplier create → PAN mandatory for TDS
• TDS Applicable: Yes → Deductee Type: Individual/Company

**TDS Entry Example:**

**Situation**: CA को ₹50,000 Professional Fee payment
• Payment Voucher (F5):
  - Dr: Professional Fee A/c → ₹50,000
  - Cr: Bank A/c → ₹45,000 (Net payment)
  - Cr: TDS Payable @10% → ₹5,000 (Tax deducted)

**TDS Reports:**
• Gateway → Reports → Statutory → TDS Reports
• **TDS Computation**: Party-wise TDS deducted
• **TDS Outstanding**: Amount to be deposited to Govt
• **TDS Challan Register**: Challans paid
• **Form 26Q** (Non-salary quarterly return): Auto-generate from Tally

**TDS Payment to Government:**
• Bank payment → Challan 281
• Due Date: 7th of next month (March: 30th April)
• Late payment: Interest 1.5% per month`,
        diagram: `┌──────────────────────────────────────────────┐
│     TDS Process — Complete Flow                 │
├──────────────────────────────────────────────┤
│                                              │
│  Company pays ₹50,000 to CA (Sec 194J)      │
│                                              │
│  ┌─────────────────────────────────────┐     │
│  │         DEDUCTOR (Company)           │     │
│  │                                     │     │
│  │  Total Bill:        ₹50,000         │     │
│  │  TDS @10%:         -₹ 5,000         │     │
│  │  ──────────────────────────         │     │
│  │  Net Payment to CA: ₹45,000         │     │
│  └──────┬──────────────┬───────────────┘     │
│         │              │                     │
│     ┌───┴───┐     ┌────┴─────┐               │
│     │₹45,000│     │ ₹5,000   │               │
│     │to CA  │     │to Govt   │               │
│     │(Bank) │     │(Challan) │               │
│     └───┬───┘     └────┬─────┘               │
│         │              │                     │
│         ▼              ▼                     │
│  ┌───────────┐  ┌──────────────┐             │
│  │    CA     │  │  Government  │             │
│  │ (Deductee)│  │  (Income Tax)│             │
│  │           │  │              │             │
│  │ Gets      │  │ Challan 281  │             │
│  │ ₹45,000   │  │ Due: 7th of  │             │
│  │ + Form 16A│  │ next month   │             │
│  └───────────┘  └──────────────┘             │
│                                              │
│  TDS Return Filing:                          │
│  ┌──────────────────────────────────┐        │
│  │ Quarterly Returns:               │        │
│  │ Q1 (Apr-Jun) → Due: 31 July     │        │
│  │ Q2 (Jul-Sep) → Due: 31 Oct      │        │
│  │ Q3 (Oct-Dec) → Due: 31 Jan      │        │
│  │ Q4 (Jan-Mar) → Due: 31 May      │        │
│  │                                  │        │
│  │ Form 24Q: Salary TDS             │        │
│  │ Form 26Q: Non-salary TDS         │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Tally Path:                                 │
│  Reports → Statutory → TDS Reports           │
│  → Computation / Outstanding / Challan       │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 8: Payroll — वेतन प्रबंधन",
    pages: [
      {
        title: "Tally में Payroll Setup और Salary Processing",
        content: `**Payroll** — कर्मचारियों का वेतन, PF, ESI, TDS calculation और payment Tally में automated है।

**Payroll Enable:**
• Gateway → F11 → Features → Enable Payroll: **Yes**

**Step 1: Pay Heads Create (वेतन घटक):**
• **Earnings (कमाई):**
  - Basic Salary — Pay Head Type: Earnings, Calculation: As Computed Value
  - HRA (House Rent Allowance) — Percentage of Basic (e.g., 40%)
  - DA (Dearness Allowance) — Percentage of Basic
  - Conveyance Allowance — Fixed amount
  - Special Allowance — Fixed/Percentage

• **Deductions (कटौती):**
  - PF (Provident Fund) — 12% of Basic (Employee contribution)
  - ESI — 0.75% of Gross (if Gross < ₹21,000/month)
  - Professional Tax — State-wise slab (e.g., ₹200/month)
  - TDS — As per income tax slab

**Step 2: Employee Create:**
• Gateway → Payroll Info → Employees → Create
• Name, Designation, Department, Date of Joining
• PAN, Aadhar, UAN (PF), ESI Number
• Bank A/c details (for salary transfer)
• Pay structure: Basic ₹15,000 + HRA ₹6,000 + DA ₹3,000 etc.

**Step 3: Attendance:**
• Gateway → Payroll Vouchers → Attendance (Alt+F5)
• Enter: Present days, Absent days, Leave, OT hours
• Auto-calculate: (Basic/30) × Present days = Earned salary

**Step 4: Payroll Processing (Salary):**
• Gateway → Payroll Vouchers → Payroll (F5)
• Select Employee → Auto-calculate all components
• Gross Salary - Deductions = **Net Pay**

**Example Salary Slip:**
| Component | Amount (₹) |
|-----------|-----------|
| Basic Salary | 15,000 |
| HRA (40%) | 6,000 |
| DA (20%) | 3,000 |
| Conveyance | 1,600 |
| **Gross Salary** | **25,600** |
| PF (12% Basic) | -1,800 |
| ESI (0.75%) | -192 |
| Professional Tax | -200 |
| TDS | -500 |
| **Total Deductions** | **-2,692** |
| **Net Salary** | **22,908** |

**PF Compliance:**
• Employee: 12% of Basic → Employee PF Account
• Employer: 12% of Basic → 8.33% Pension + 3.67% PF
• Monthly due date: **15th of next month**
• Tally generates: PF Challan + ECR (Electronic Challan Return)`,
        diagram: `┌──────────────────────────────────────────────┐
│     Salary Processing — Flow in Tally           │
├──────────────────────────────────────────────┤
│                                              │
│  Step 1: CREATE PAY HEADS                    │
│  ┌──────────────────────────────────┐        │
│  │ Earnings:        │ Deductions:   │        │
│  │ • Basic Salary   │ • PF (12%)    │        │
│  │ • HRA (40%)      │ • ESI (0.75%) │        │
│  │ • DA (20%)       │ • Prof Tax    │        │
│  │ • Conveyance     │ • TDS         │        │
│  │ • Special Allow  │ • Loan EMI    │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Step 2: CREATE EMPLOYEES                    │
│  ┌──────────────────────────────────┐        │
│  │ Employee: Ramesh Kumar           │        │
│  │ Department: Sales                │        │
│  │ Basic: ₹15,000/month            │        │
│  │ PAN: ABCDE1234F                  │        │
│  │ UAN: 100123456789                │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Step 3: PROCESS PAYROLL                     │
│  ┌──────────────────────────────────┐        │
│  │                                  │        │
│  │  Gross Salary      ₹25,600      │        │
│  │  ├── Basic          15,000      │        │
│  │  ├── HRA             6,000      │        │
│  │  ├── DA              3,000      │        │
│  │  └── Conveyance      1,600      │        │
│  │                                  │        │
│  │  (-) Deductions     ₹2,692      │        │
│  │  ├── PF              1,800      │        │
│  │  ├── ESI               192      │        │
│  │  ├── P.Tax             200      │        │
│  │  └── TDS               500      │        │
│  │  ────────────────────────────   │        │
│  │  NET PAY           ₹22,908  ✅  │        │
│  │  → Bank Transfer / Cash         │        │
│  └──────────────────────────────────┘        │
│                                              │
│  Step 4: STATUTORY PAYMENTS                  │
│  PF Challan → 15th of next month             │
│  ESI Challan → 15th of next month            │
│  TDS Challan → 7th of next month             │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 9: Advanced Tally Features",
    pages: [
      {
        title: "Multi-Currency, Cost Centers, Budgets",
        content: `**Advanced Features** Tally Prime को एक powerful ERP solution बनाती हैं। बड़े businesses के लिए ज़रूरी।

**1. Cost Centers (लागत केंद्र):**
• **Purpose**: Department/Project-wise profitability track करना
• **Example**: Company has 3 branches → Each branch = Cost Center
  - Delhi Branch, Mumbai Branch, Kolkata Branch
• **Setup**: Gateway → Masters → Cost Centers → Create
• **Entry**: हर voucher में Cost Center allocate करें
• **Report**: Branch-wise P&L → कौन सा branch profitable?

**2. Multi-Currency (बहु-मुद्रा):**
• Import/Export business → USD, EUR, GBP transactions
• Gateway → F11 → Allow Multi-Currency: Yes
• **Currency Create**: USD (US Dollar), Rate: ₹83.50
• **Forex Gain/Loss**: Exchange rate बदलने पर auto-calculate
• Entry: Purchase from USA → USD amount → Auto ₹ conversion

**3. Budgets (बजट):**
• Target vs Actual comparison
• Gateway → Masters → Budgets → Create
• Set monthly/yearly targets for each Ledger
• **Report**: Gateway → Reports → Trial Balance → Budget variance
• Red = Over budget, Green = Under budget

**4. Interest Calculation:**
• Supplier/Customer पर late payment interest
• Ledger → Enable Interest: Yes → Rate: 18% → Per: Month
• Auto-calculate interest on outstanding amounts
• **Report**: Interest calculation statement → Auto generate

**5. Job Costing / Job Work:**
• Manufacturing units → Raw Material + Labour = Finished Product
• Track cost per job/batch
• Gateway → Inventory → Job Work In/Out

**6. Multi-Company Consolidation:**
• Multiple Tally companies → Combined Balance Sheet
• Group company reporting
• Gateway → Company → Select multiple companies → Consolidated view

**7. Security & Access Control:**
• User-level access restrictions
• **Admin**: Full access
• **Data Entry**: Only voucher entry, no delete/alter
• **View Only**: Reports only, no changes
• Gateway → F3 → Security Control → Users & Passwords

**8. Tally Connected (Cloud):**
• Access Tally data from anywhere
• Tally Prime Server + Browser access
• Real-time sync between branches
• **Cost**: ₹18,000-₹54,000/year (depending on plan)

**Important Shortcut Keys — Complete List:**
• **F1**: Select/Help → Company select
• **F2**: Change Date
• **F3**: Company/Change current company
• **F4**: Contra voucher
• **F5**: Payment | **F6**: Receipt | **F7**: Journal
• **F8**: Sales | **F9**: Purchase
• **F10**: Accounting Vouchers Menu
• **F11**: Features/Company Features
• **F12**: Configuration
• **Alt+D**: Delete voucher
• **Ctrl+A**: Accept/Save entry
• **Esc**: Go back / Cancel`,
        diagram: `┌──────────────────────────────────────────────┐
│     Tally Prime — Feature Map                   │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────────┐ │
│  │          TALLY PRIME FEATURES            │ │
│  │                                         │ │
│  │  ┌─── ACCOUNTING ───┐                   │ │
│  │  │ ✅ Voucher Entry  │                   │ │
│  │  │ ✅ GST Ready      │                   │ │
│  │  │ ✅ TDS/TCS        │                   │ │
│  │  │ ✅ Multi-Currency  │                   │ │
│  │  │ ✅ Bank Recon      │                   │ │
│  │  │ ✅ Interest Calc   │                   │ │
│  │  └──────────────────┘                   │ │
│  │                                         │ │
│  │  ┌─── INVENTORY ────┐                   │ │
│  │  │ ✅ Stock Items     │                   │ │
│  │  │ ✅ Multi-Godown    │                   │ │
│  │  │ ✅ Batch Tracking  │                   │ │
│  │  │ ✅ Reorder Level   │                   │ │
│  │  │ ✅ Ageing Analysis │                   │ │
│  │  │ ✅ Job Work        │                   │ │
│  │  └──────────────────┘                   │ │
│  │                                         │ │
│  │  ┌─── PAYROLL ──────┐                   │ │
│  │  │ ✅ Salary Process  │                   │ │
│  │  │ ✅ PF/ESI          │                   │ │
│  │  │ ✅ Attendance      │                   │ │
│  │  │ ✅ Payslip         │                   │ │
│  │  └──────────────────┘                   │ │
│  │                                         │ │
│  │  ┌─── REPORTS ──────┐                   │ │
│  │  │ ✅ Balance Sheet   │                   │ │
│  │  │ ✅ P&L Account     │                   │ │
│  │  │ ✅ Cash/Bank Book  │                   │ │
│  │  │ ✅ GST Returns     │                   │ │
│  │  │ ✅ Cost Center     │                   │ │
│  │  │ ✅ Budget Variance │                   │ │
│  │  └──────────────────┘                   │ │
│  │                                         │ │
│  │  ┌─── SECURITY ─────┐                   │ │
│  │  │ ✅ User Access     │                   │ │
│  │  │ ✅ Audit Trail     │                   │ │
│  │  │ ✅ Data Backup     │                   │ │
│  │  │ ✅ Cloud Sync      │                   │ │
│  │  └──────────────────┘                   │ │
│  └─────────────────────────────────────────┘ │
└──────────────────────────────────────────────┘`
      },
    ],
  },
  {
    title: "अध्याय 10: Practical Exercises — अभ्यास",
    pages: [
      {
        title: "Complete Practice Set — पूरा अभ्यास सेट",
        content: `**Practice Set** — इन exercises को Tally Prime में करें और complete accounting cycle practice करें।

**Company Details:**
• Name: **शर्मा मोबाइल शॉप**
• Address: Main Market, Lucknow, UP
• Financial Year: April 2024 - March 2025
• GSTIN: 09AABCS1234D1ZA
• State: Uttar Pradesh

**Exercise 1: Ledger Creation**
Create these ledgers:
1. Cash (Cash-in-Hand)
2. SBI Bank A/c (Bank Accounts) — Opening: ₹2,00,000
3. Capital A/c (Capital Account) — ₹5,00,000
4. Purchase A/c (Purchase Accounts) — GST 18%
5. Sales A/c (Sales Accounts) — GST 18%
6. Rent (Indirect Expenses) — ₹10,000/month
7. Salary (Indirect Expenses)
8. Rahul Traders — Supplier (Sundry Creditors) — GSTIN: 09AABCR5678E1ZB
9. Pooja Electronics — Customer (Sundry Debtors) — GSTIN: 09AABCP9012F1ZC
10. CGST @9%, SGST @9% (Duties & Taxes)

**Exercise 2: Stock Items Creation**
1. Samsung Galaxy A15 — Under: Mobile Phones — Units: Nos — HSN: 8517 — Rate: ₹12,000
2. Redmi Note 13 — Same group — Rate: ₹15,000
3. Mobile Charger 65W — Under: Accessories — Rate: ₹800
4. Tempered Glass — Under: Accessories — Rate: ₹50

**Exercise 3: Transactions (April 2024)**
• April 1: Capital introduced ₹5,00,000 (Cash deposit to bank)
• April 3: Purchased 20 Samsung + 15 Redmi from Rahul Traders (Credit) — GST 18%
• April 5: Sold 5 Samsung to Pooja Electronics @ ₹14,000 each (Credit)
• April 8: Paid Rent ₹10,000 by cheque #123456
• April 10: Received ₹50,000 from Pooja Electronics (Cheque)
• April 15: Purchased 100 Chargers + 200 Tempered Glass (Cash purchase)
• April 20: Cash Sales of 3 Redmi @ ₹17,500 each
• April 25: Paid Salary ₹20,000 to shop helper (Cash)
• April 28: Sold 50 Chargers @ ₹1,200 each (Bank transfer from customer)
• April 30: Electricity bill ₹2,500 (Cash)

**Exercise 4: Reports**
After all entries, generate and verify:
1. Trial Balance — Check: Debit = Credit ✅
2. Profit & Loss — Calculate Net Profit
3. Balance Sheet — Check: Assets = Liabilities ✅
4. Stock Summary — Remaining stock of each item
5. GST Report (GSTR-1) — Sales with GST breakdown
6. Bank Book — SBI transactions and balance
7. Ledger-wise: Check Rahul Traders outstanding
8. Check Pooja Electronics outstanding

**Exercise 5: Bank Reconciliation**
• Bank Statement Balance (April 30): ₹3,45,000
• Reconcile with Tally Balance
• Find differences (if any) and resolve`,
        diagram: `┌──────────────────────────────────────────────┐
│     Practice Set — Transaction Flow             │
├──────────────────────────────────────────────┤
│                                              │
│  April Timeline:                             │
│                                              │
│  01 ── Capital ₹5L → Bank                   │
│  │     (F6 Receipt: Cash → Bank)             │
│  │                                           │
│  03 ── Purchase from Rahul Traders           │
│  │     20 Samsung × ₹12K = ₹2,40,000        │
│  │     15 Redmi × ₹15K = ₹2,25,000          │
│  │     + GST 18% = ₹83,700                  │
│  │     Total: ₹5,48,700 (Credit)            │
│  │                                           │
│  05 ── Sale to Pooja Electronics             │
│  │     5 Samsung × ₹14K = ₹70,000           │
│  │     + GST 18% = ₹12,600                  │
│  │     Total: ₹82,600 (Credit)              │
│  │                                           │
│  08 ── Rent ₹10,000 (Cheque)                │
│  │                                           │
│  10 ── Receipt ₹50,000 from Pooja           │
│  │                                           │
│  15 ── Cash Purchase: Chargers + Glass       │
│  │     100 × ₹800 + 200 × ₹50 = ₹90,000    │
│  │     + GST                                 │
│  │                                           │
│  20 ── Cash Sale: 3 Redmi × ₹17,500         │
│  │     = ₹52,500 + GST                      │
│  │                                           │
│  25 ── Salary ₹20,000 (Cash)                │
│  │                                           │
│  28 ── Sale: 50 Chargers × ₹1,200           │
│  │     = ₹60,000 + GST (Bank transfer)      │
│  │                                           │
│  30 ── Electricity ₹2,500 (Cash)            │
│       │                                      │
│       ▼                                      │
│  Generate Reports:                           │
│  ✅ Trial Balance    ✅ P&L                   │
│  ✅ Balance Sheet    ✅ Stock Summary          │
│  ✅ GST Report       ✅ Bank Reconciliation    │
└──────────────────────────────────────────────┘`
      },
    ],
  },
];
