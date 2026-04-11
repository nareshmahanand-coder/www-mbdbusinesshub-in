import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, Wrench, Car, Scissors, Heart, Monitor, Sprout, Globe, BookOpen, Lightbulb, ChevronRight, ChevronDown, ArrowLeft, Star, Award, Send, Image, Volume2, VolumeX, FileCheck, Trophy, BookMarked, Layers } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { downloadCertificate } from "@/lib/generateCertificate";

/* ─── Types ─── */
interface Lesson {
  step: string;
  title: string;
  titleHi: string;
  points: string[];
  diagram: string;
}

interface Topic {
  name: string;
  desc: string;
  lessons: Lesson[];
}

/* ─── Helper ─── */
const makeLessons = (steps: { title: string; titleHi: string; points: string[]; diagram: string }[]): Lesson[] =>
  steps.map((s, i) => ({ step: `Step ${i + 1}`, ...s }));

/* ─── TTS Helper ─── */
const speakHindi = (text: string) => {
  if (!("speechSynthesis" in window)) {
    toast({ title: "⚠️ आपका ब्राउज़र Text-to-Speech सपोर्ट नहीं करता" });
    return null;
  }
  window.speechSynthesis.cancel();
  const cleaned = text.replace(/\*\*/g, "").replace(/→/g, " से ").replace(/\|/g, ", ");
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = "hi-IN";
  utterance.rate = 0.9;
  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang.startsWith("hi"));
  if (hindiVoice) utterance.voice = hindiVoice;
  window.speechSynthesis.speak(utterance);
  return utterance;
};

const stopSpeaking = () => window.speechSynthesis?.cancel();

/* ─── Exam Question Generator ─── */
const generateExamQuestions = (topicName: string, lessons: Lesson[]) => {
  const questions: { question: string; options: string[]; correct: number }[] = [];
  lessons.forEach((lesson) => {
    lesson.points.forEach((point, idx) => {
      const clean = point.replace(/\*\*/g, "");
      if (clean.includes(":") && idx < 3) {
        const parts = clean.split(":");
        const q = `"${lesson.titleHi}" में "${parts[0].trim()}" से क्या तात्पर्य है?`;
        const correctAns = parts.slice(1).join(":").trim().substring(0, 60);
        questions.push({
          question: q,
          options: [
            correctAns,
            "यह एक अन्य प्रक्रिया है",
            "इसकी जानकारी उपलब्ध नहीं",
            "उपरोक्त में से कोई नहीं"
          ],
          correct: 0,
        });
      }
    });
  });
  // Shuffle and limit to 10
  const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 10);
  // Shuffle options for each question
  return shuffled.map(q => {
    const correctText = q.options[q.correct];
    const shuffledOpts = [...q.options].sort(() => Math.random() - 0.5);
    return { ...q, options: shuffledOpts, correct: shuffledOpts.indexOf(correctText) };
  });
};

/* ══════════════════════════════════════════════════════════════
   DATA — All categories with full Hindi theory (no video links)
   ══════════════════════════════════════════════════════════════ */

const electronicsLessons: Record<string, Lesson[]> = {
  "मोबाइल रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["स्क्रू ड्राइवर सेट, हीट गन, मल्टीमीटर जमा करें", "**ESD ब्रेसलेट** पहनें ताकि IC ना जले", "फोन का **मॉडल नंबर** नोट करें", "सभी स्क्रू को **लेबल** करके रखें — हर फोन में अलग साइज़ होते हैं", "**PCB** (Printed Circuit Board) की फोटो लें — reference के लिए"], diagram: "📐 मोबाइल टूलकिट: स्क्रू ड्राइवर सेट → Spudger → सक्शन कप → हीट गन → मल्टीमीटर → DC Power Supply → माइक्रोस्कोप" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**मल्टीमीटर** से बैटरी वोल्टेज चेक करें (3.7V-4.2V)", "**DC पावर सप्लाई** से शॉर्ट चेक करें — अगर Ampere ज्यादा आए तो शॉर्ट है", "स्क्रीन, टच, चार्जिंग पोर्ट एक-एक करके टेस्ट करें", "**Boot Loop** में अटका है तो Software Flash करें", "**Network Issue**: Antenna Connector और RF IC चेक करें", "**कैमरा काम नहीं**: कैमरा कनेक्टर और Camera IC चेक करें"], diagram: "📊 मदरबोर्ड ब्लॉक डायग्राम:\nCPU (Processor) ← RAM\n↓\nPower Management IC → Charging IC\n↓\nWiFi/BT IC ← RF IC (Network)\n↓\nDisplay Connector → Touch IC\n↓\nAudio IC → Speaker/Mic" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**हीट गन** (350°C) से खराब IC हटाएं — BGA chip के लिए ज़रूरी", "**Reballing** करके नई IC लगाएं — Stencil + Solder Balls + Flux", "सोल्डरिंग के बाद **IPA (Isopropyl Alcohol)** से बोर्ड साफ करें", "सब कनेक्टर जोड़कर टेस्ट करें — स्क्रीन, टच, चार्जिंग, कैमरा", "**Jumper Wire**: टूटी हुई Line को तार से जोड़ना", "**Microscope** का इस्तेमाल करें — छोटे components देखने के लिए"], diagram: "🔧 सोल्डरिंग प्रोसेस:\n1. फ्लक्स लगाएं\n2. हीट गन से IC गर्म करें (350°C)\n3. IC Carefully हटाएं\n4. पैड साफ करें (Solder Wick से)\n5. नई IC रखें + फ्लक्स\n6. Reflow करें\n7. IPA से Clean\n8. Test करें" },
  ]),
  "लैपटॉप रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["लैपटॉप का मॉडल और **सर्विस मैनुअल** डाउनलोड करें", "बैटरी निकालें, **पावर बटन 10 सेकंड** दबाएं (discharge)", "स्क्रू को **लेबल** करके रखें — हर जगह अलग साइज़ है", "**Anti-Static Mat** पर काम करें", "**BIOS** बैकअप लें — CH341A Programmer से"], diagram: "📐 लैपटॉप Disassembly:\nBottom Cover → RAM Slot → HDD/SSD Bay\n→ WiFi Card → Battery\n→ Keyboard → Palmrest\n→ Display Hinge → Motherboard" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**No Power**: चार्जर वोल्टेज चेक करें (19V typical)", "**No Display**: RAM निकालकर दोबारा लगाएं — Beep Code सुनें", "**Overheating**: Fan और Thermal Paste चेक करें — CPU temp 90°C+ = problem", "**Blue Screen (BSOD)**: RAM या HDD खराब हो सकता है", "**WiFi Not Working**: WiFi Card और Antenna Cable चेक करें", "**Keyboard कुछ Keys काम नहीं**: Keyboard ribbon cable चेक करें"], diagram: "📊 लैपटॉप पावर फ्लो:\nAC Adapter (19V) → DC Jack\n→ Charging IC (ISL6251 etc)\n→ Battery (11.1V/14.8V)\n→ Power IC (Main Power Rail)\n→ CPU VRM → CPU\n→ RAM, GPU, Chipset" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**Thermal Paste** बदलें — हर 2 साल (Arctic MX-4 recommended)", "खराब **RAM/HDD** को रिप्लेस करें — SSD upgrade करें (speed 10x)", "मदरबोर्ड पर **कैपेसिटर/MOSFET** चेंज करें — SMD Soldering", "**BIOS Chip** reprogram करें — CH341A Programmer + Software", "**DC Jack** loose हो तो solder करें या replace करें", "**Hinge** टूटा हो तो Epoxy + Reinforcement plate लगाएं"], diagram: "🔧 रिपेयर फ्लो:\n1. Customer से Problem Details लें\n2. Visual Inspection करें\n3. Multimeter से Voltage Check\n4. Part Identify करें\n5. Replace/Repair करें\n6. Full Test (2-3 घंटे)\n7. Deliver + Warranty दें" },
  ]),
  "LED/LCD TV रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["TV का **बैक कवर** खोलें (screws निकालें)", "**3 मुख्य बोर्ड** पहचानें: Power Supply, Main Board, T-Con", "सभी **रिबन केबल** ध्यान से नोट करें", "**LED Tester** तैयार करें — individual LED check के लिए", "**ESR Meter** रखें — Capacitor test के लिए"], diagram: "📐 TV Internal Layout:\n┌─────────────────────────┐\n│ LED Strips (Behind Panel)│\n│ ┌───────┐ ┌──────────┐  │\n│ │T-Con  │ │Main Board│  │\n│ │Board  │ │(HDMI,USB)│  │\n│ └───────┘ └──────────┘  │\n│ ┌──────────────────────┐│\n│ │  Power Supply Board  ││\n│ └──────────────────────┘│\n└─────────────────────────┘" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**No Power**: पावर बोर्ड पर फ्यूज़ और MOSFETs चेक करें", "**No Picture but Sound**: T-Con बोर्ड या LED Strips चेक करें", "**No Sound**: Main Board का ऑडियो सेक्शन चेक करें", "**Lines on Screen**: T-Con Board या LVDS Cable issue", "**Dim Display**: LED Strips में कोई LED जली हुई है", "**No HDMI**: Main Board HDMI IC या Port चेक करें"], diagram: "📊 पावर सप्लाई डायग्राम:\nAC 220V Input → EMI Filter\n→ Bridge Rectifier (310V DC)\n→ SMPS Controller (TNY series)\n→ Transformer\n→ Output: 24V (LED), 12V (Main), 5V (Standby)\n→ Feedback: Optocoupler → Controller" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["फूले हुए **कैपेसिटर** बदलें — ESR Meter से पहचानें", "**LED Strip** खराब हो तो individual LED या पूरी strip बदलें", "Main Board की **Firmware** अपडेट करें (USB Method)", "**T-Con Board** पर Ribbon Cable reseat करें", "**MOSFET** shorted हो तो same rating का लगाएं", "**Soldering Iron** 60W + Flux + Desoldering Wick ज़रूरी"], diagram: "🔧 LED Strip Replacement:\n1. Back Cover खोलें\n2. All Boards Disconnect करें\n3. Panel को Flat रखें\n4. Bezel Frame खोलें\n5. Diffuser Sheets निकालें\n6. Optical Sheets निकालें\n7. LED Strips दिखेंगी\n8. खराब LED/Strip बदलें\n9. Reverse Order में Assemble" },
  ]),
  "AC रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**मैनिफोल्ड गेज**, वैक्यूम पंप, गैस सिलेंडर तैयार करें", "AC का **BTU रेटिंग** और गैस टाइप (R32/R410a) नोट करें", "**बिजली बंद** करके काम शुरू करें", "**PPE**: Safety Gloves और Goggles पहनें", "Indoor और Outdoor Unit दोनों Access करें"], diagram: "📐 AC System Flow:\nCompressor (Outdoor)\n→ Condenser Coil (Outdoor, गर्मी बाहर)\n→ Expansion Valve (Capillary)\n→ Evaporator Coil (Indoor, ठंडक अंदर)\n→ Suction Line back to Compressor" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**कूलिंग नहीं**: गैस प्रेशर चेक करें (R32: 60-70 PSI low side)", "**पानी टपकना**: ड्रेन पाइप ब्लॉक है — पानी से flush करें", "**कंप्रेसर चालू नहीं**: कैपेसिटर (35µF/45µF) और रिले चेक करें", "**AC चलता-बंद होता है**: Thermistor या PCB sensor issue", "**बिजली ज्यादा खाता है**: Dirty Condenser coil या Low Gas", "**Compressor गर्म होकर बंद**: OLP (Overload Protector) trip हो रहा"], diagram: "📊 Pressure Guide:\nR32 Gas:\n  Low Side: 60-80 PSI (Running)\n  High Side: 280-350 PSI\nR410a Gas:\n  Low Side: 110-130 PSI\n  High Side: 350-420 PSI\nR22 Gas (Old AC):\n  Low Side: 60-70 PSI\n  High Side: 200-250 PSI" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**गैस चार्जिंग**: वैक्यूम (30 min) → गैस भरें → लीक चेक करें", "**PCB रिपेयर**: सेंसर, रिले, MOSFET बदलें — schematic देखें", "**सर्विसिंग**: फिल्टर धोएं, कॉइल साफ करें (Coil Cleaner spray)", "**कैपेसिटर** बदलें: Rating match करें (µF and Voltage)", "**Compressor Change**: Recovery → Brazing → Vacuum → Gas Charge", "**Fan Motor**: Check winding with Multimeter, replace if open/short"], diagram: "🔧 Gas Charging Steps:\n1. Connect Manifold Gauge\n2. Vacuum Pump ON (30 minutes)\n3. Check vacuum holds (-30 inHg)\n4. Connect Gas Cylinder\n5. Open Low Side Valve slowly\n6. Monitor Pressure\n7. Reach target PSI\n8. Close Valve\n9. Check Cooling Performance" },
  ]),
  "फ्रिज रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["फ्रिज का मॉडल और **कंप्रेसर रेटिंग** नोट करें", "**गैस टाइप** पहचानें: R134a (पुराना) / R600a (नया, ज्वलनशील)", "Piercing Valve और Manifold Gauge तैयार करें", "फ्रिज को बिजली से हटाएं, 30 min बाद काम करें"], diagram: "📐 Fridge Refrigeration Cycle:\nCompressor (Bottom Back)\n→ Condenser Coils (Back/Bottom)\n→ Capillary Tube (Thin copper)\n→ Evaporator (Freezer section)\n→ Suction Line → Compressor" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**ठंडा नहीं**: कंप्रेसर चल रहा है? गैस कम है?", "**ज्यादा ठंडा/बर्फ जमना**: Thermostat खराब है या Defrost Timer", "**आवाज़ आना**: कंप्रेसर माउंटिंग, Fan Motor, या Relay issue", "**पानी जमा होना**: Drain Hole blocked — wire से साफ करें", "**Compressor Start+Stop**: PTC Relay या OLP खराब", "**बिजली ज्यादा**: Dirty Condenser या Door Gasket loose"], diagram: "📊 Diagnostic Table:\nSymptom → Cause\nNot Cold + Comp Running = Gas Leak\nNot Cold + Comp Not Running = Relay/OLP\nToo Cold = Thermostat Stuck\nNoisy = Bad Bearings/Fan\nWater Inside = Blocked Drain\nFrost Buildup = Defrost Timer/Heater" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**लीक** ढूंढें: सोप बुलबुला टेस्ट या नाइट्रोजन प्रेशर टेस्ट (100 PSI)", "लीक जगह **ब्रेज़िंग** (Silver Brazing Rod) से वेल्ड करें", "वैक्यूम करके **सही मात्रा** में गैस भरें (R134a: 100-150g typical)", "**Thermostat** बदलना: Wire नोट करें → पुराना निकालें → नया लगाएं", "**Door Gasket** loose: गर्म पानी से सीधा करें या नया लगाएं", "**Defrost Timer**: Manual advance test → Replace if faulty"], diagram: "🔧 Gas Charging Flow:\n1. Attach Piercing Valve\n2. Connect Gauge\n3. Recovery (if old gas)\n4. Brazing Repair\n5. Nitrogen Leak Test (100 PSI, 24hr)\n6. Vacuum (45 min minimum)\n7. Charge Gas (by weight)\n8. Seal System\n9. Run Test (4-6 hours)" },
  ]),
  "वॉशिंग मशीन रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["मशीन टाइप पहचानें: **Semi-Auto / Fully-Auto / Front Load**", "पानी बंद करें, बिजली हटाएं", "**Error Code** नोट करें (Fully Auto डिस्प्ले में दिखाता है)", "मॉडल नंबर नोट करें — Parts ordering के लिए ज़रूरी"], diagram: "📐 Washing Machine Parts:\nInlet Valve (पानी अंदर)\n→ Tub/Drum (कपड़े धोना)\n→ Motor + Belt (घूमाना)\n→ Drain Pump (पानी बाहर)\n→ PCB (Control Brain)\n→ Door Lock (Front Load)" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**धुलाई नहीं**: मोटर कैपेसिटर (10-16µF) या बेल्ट चेक करें", "**पानी नहीं भरता**: Inlet Valve (Solenoid) या Water Level Sensor", "**Spin नहीं करती**: Lid Switch (Top Load) / Door Lock (Front Load)", "**Error E1**: Water Inlet problem — Filter mesh साफ करें", "**Error E2**: Drain issue — Pump या Drain hose blocked", "**Leak**: Door Gasket (Front Load) या Tub Seal (Top Load)"], diagram: "📊 Error Code Guide:\nE1 = Water Supply Issue\nE2 = Drain Blocked\nE3 = Motor Overload\nE4 = Water Level Sensor\nE5 = Temperature Sensor\nE7 = Door Lock Failed\nE9 = Overflow Protection" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**बेल्ट** ढीली/टूटी हो तो बदलें — size match करें", "**PCB** पर जले हुए Relay/Triac बदलें — Multimeter से चेक", "**बेयरिंग** से आवाज़: Drum खोलकर Bearing + Seal बदलें", "**Inlet Valve**: 220V देकर चेक करें — click होना चाहिए", "**Drain Pump**: Blockage साफ करें या Pump Motor बदलें", "**Carbon Brush** (Front Load Motor): Worn out हो तो बदलें"], diagram: "🔧 Motor Check:\n1. Multimeter Continuity Mode\n2. Start Winding: 20-40 Ohm\n3. Run Winding: 5-15 Ohm\n4. Common to Both: Sum of above\n5. Earth Test: No continuity to body\n6. Capacitor: Test µF value\n7. If Open/Short → Replace Motor" },
  ]),
  "कैमरा और CCTV": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**कैमरा टाइप** चुनें: Bullet (outdoor), Dome (indoor), PTZ (rotate), IP (network)", "**DVR/NVR** की चैनल कैपेसिटी नोट करें (4/8/16/32 CH)", "केबलिंग प्लान बनाएं: **कहां-कहां कैमरा लगेगा** — map draw करें", "**Storage Calculate**: 1 Camera = ~15GB/day (1080p)"], diagram: "📐 CCTV System Architecture:\nCameras (Analog/IP)\n→ Cable (Coax 3+1 / Cat6 Ethernet)\n→ DVR (Analog) / NVR (IP)\n→ Hard Disk (Storage)\n→ Monitor (Live View)\n→ Router (Remote Access via Mobile)" },
    { title: "Installation", titleHi: "इंस्टॉलेशन", points: ["कैमरे को **ऊंचाई पर** (8-10 फीट) फिक्स करें — Tamper-proof", "केबल को **PVC पाइप/Casing** में सुरक्षित रखें", "DVR को **सूखी और हवादार** जगह रखें — UPS से जोड़ें", "**IP Camera Setup**: PoE Switch → Cat6 → Camera (single cable for power+data)", "**Remote View**: DVR/NVR को Router से जोड़ें → App Configure करें"], diagram: "📊 Cable Selection:\nAnalog Camera → Coaxial (3+1 core) → Max 200m\nIP Camera → Cat6 Ethernet → Max 100m\nPoE → Power over Ethernet (No separate power)\nPower Cable → DC 12V 1A per camera\nBackup → UPS 600VA for 4CH system" },
    { title: "Troubleshooting", titleHi: "समस्या निवारण", points: ["**No Picture**: BNC/RJ45 कनेक्टर और पावर चेक करें", "**Blur Image**: लेंस साफ करें, फोकस एडजस्ट करें (manual focus ring)", "**Recording नहीं**: HDD चेक करें — S.M.A.R.T. test, Format if needed", "**Night Vision खराब**: IR LED board चेक करें — solder joints", "**Remote Access नहीं**: Port Forwarding या P2P Cloud setup check", "**Flickering**: Power Supply voltage check — 12V ±0.5V"], diagram: "🔧 Systematic Troubleshooting:\n1. Check Power (12V at camera)\n2. Check Cable (Continuity test)\n3. Check Connector (BNC/RJ45 crimp)\n4. Swap Camera to test\n5. Check DVR Channel\n6. Check HDD Health\n7. Check Network/Remote\n8. Firmware Update if needed" },
  ]),
  "पंखा / कूलर रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["पंखे का **टाइप** पहचानें: Ceiling, Table, Exhaust, Cooler", "**वाइंडिंग डेटा** नोट करें: SWG gauge, Number of Turns, Slots", "मल्टीमीटर, सोल्डरिंग आयरन, Winding Machine तैयार करें", "**Capacitor Rating** note करें: Ceiling Fan = 2.5µF, Table Fan = 1.5-2µF"], diagram: "📐 Electric Motor Components:\nStator (Fixed, has windings)\n→ Rotor (Rotates, inside stator)\n→ Bearings (Top + Bottom)\n→ Capacitor (Start/Run)\n→ Regulator (Speed control)\n→ Blades/Impeller" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**नहीं चलता**: कैपेसिटर चेक करें — Multimeter Capacitance mode", "**धीमा चलता**: बेयरिंग में friction या वाइंडिंग inter-turn short", "**आवाज़ आती है**: बेयरिंग dry — oil डालें (Machine Oil)", "**गर्म होता है**: Winding short — Megger test करें (>1MΩ = OK)", "**एक ही Speed**: Regulator खराब — Electronic/Step type check करें", "**Spark**: Carbon deposit साफ करें (Table Fan brush type)"], diagram: "📊 Capacitor Testing:\nMultimeter → Capacitance Mode (F)\nCeiling Fan: 2.5µF ±10% = OK\nTable Fan: 1.5-2.5µF\nExhaust: 2-3µF\nCooler: 2.5-4µF\nReading 0 = Dead (Replace)\nReading Low = Weak (Replace)" },
    { title: "Rewinding Process", titleHi: "रिवाइंडिंग प्रक्रिया", points: ["पुरानी **Coil Data** नोट करें: Turns, SWG, Connection pattern", "पुरानी coil निकालें — Slots साफ करें (Sand paper + Varnish remove)", "**Slot Insulation** (Paper/Film) लगाएं — Short circuit prevention", "नई **Copper Wire** (SWG 36 for ceiling fan) लपेटें — **1400-1800 turns**", "Winding pattern: **24 Slot = 4 Pole** (standard ceiling fan)", "**वार्निश** में डुबोएं → ओवन में सुखाएं (80°C, 4 hours)", "असेंबल करें → कैपेसिटर जोड़ें → टेस्ट करें"], diagram: "🔧 Rewinding Steps:\n1. Count Old Turns + Note SWG\n2. Remove Old Winding\n3. Clean Slots thoroughly\n4. Insert Slot Insulation Paper\n5. Wind New Coils on Former\n6. Place Coils in Slots\n7. Connect as per Diagram\n8. Apply Varnish (Dip/Spray)\n9. Bake/Dry (4-6 hours)\n10. Assemble + Test Run" },
  ]),
};

const automobileLessons: Record<string, Lesson[]> = {
  "बाइक / स्कूटर रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["बाइक का **सर्विस मैनुअल** पढ़ें — सारी specifications मिलेंगी", "टूलकिट: **रिंग स्पैनर, प्लग रेंच, फीलर गेज, Torque Wrench** तैयार करें", "इंजन ठंडा होने दें — गर्म इंजन पर काम करना खतरनाक", "**Oil Drain Pan** और रैग्स रखें"], diagram: "📐 2-Wheeler Engine:\nAir Filter → Carburetor/FI\n→ Intake Valve → Cylinder\n→ Piston (Compression + Power)\n→ Crankshaft → Gearbox\n→ Chain/Belt → Rear Wheel" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**स्टार्ट नहीं**: Spark Plug → Fuel → Battery → Compression check", "**पिकअप कम**: Air Filter dirty, Carburetor Jet clogged, Valve clearance", "**ऑइल लीक**: Head Gasket, Crank Seal, या Oil Filter housing", "**अजीब आवाज़**: Timing Chain loose, Valve tapping, Bearing worn", "**Brake issue**: Pad worn (<2mm), Disc warped, Fluid low/old", "**Clutch slip**: Plates worn — heavy load पर RPM बढ़े पर speed नहीं"], diagram: "📊 Spark Check Flow:\n1. Remove Spark Plug\n2. Connect to HT Cable\n3. Ground to Engine\n4. Kick/Crank\n5. Blue Spark = OK\n6. No Spark = CDI/Coil/Pickup Issue\n7. Weak Spark = Plug Gap Wrong (0.6-0.8mm)" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**रिंग-पिस्टन** बदलें: Cylinder Head खोलें → Carbon साफ करें → नया Piston+Rings फिट", "**क्लच प्लेट** बदलें: Cover खोलें → 5 Friction + 5 Steel Plates set बदलें", "**चेन-स्प्रोकेट** सेट बदलें: 15,000-20,000 km पर (या stretched > 3%)", "**Carburetor Cleaning**: Jets निकालें → Carb Cleaner spray → Blow with air", "**Valve Clearance**: Feeler Gauge से चेक (Intake 0.05mm, Exhaust 0.10mm typical)", "**Oil Change**: Drain → New Filter/Screen → Fill (800ml-1200ml as per model)"], diagram: "🔧 Engine Overhaul Sequence:\n1. Drain Oil completely\n2. Remove Exhaust, Carburetor\n3. Remove Cylinder Head Bolts\n4. Lift Head → Check Valves\n5. Remove Cylinder → Check Bore\n6. Pull Piston → Check Ring Gap\n7. Install New Rings + Gaskets\n8. Torque Head Bolts (spec)\n9. Adjust Valves + Timing\n10. Fill Oil → Start → Test" },
  ]),
  "कार मैकेनिक": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["कार को **जैक** पर उठाएं, **एक्सल स्टैंड** लगाएं — जैक पर काम न करें", "**OBD2 स्कैनर** से Error Code पढ़ें — ELM327 Bluetooth adapter सस्ता विकल्प", "इंजन ऑइल Level (Dipstick), कूलेंट Level, Brake Fluid चेक करें", "**VIN Number** से exact model और parts verify करें"], diagram: "📐 Car Major Systems:\n1. Engine (Power Generation)\n2. Transmission (Gear/Drive)\n3. Suspension (Ride Comfort)\n4. Braking (Safety)\n5. Electrical (Lights/ECU)\n6. AC/HVAC (Climate)\n7. Steering (Direction)" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**Check Engine Light**: OBD2 से P-code पढ़ें — P0300=Misfire, P0171=Lean, P0420=Cat", "**ब्रेक**: Pad thickness चेक (min 3mm), Disc runout (<0.1mm), Fluid level", "**सस्पेंशन**: Shock absorber leak, Bush worn, Ball joint play", "**AC not cooling**: Compressor clutch engage? Gas pressure? Blower working?", "**Starting Problem**: Battery Voltage (>12.4V), Starter Motor, Fuel Pump sound", "**Vibration**: Wheel balance, Engine mount worn, CV joint boot torn"], diagram: "📊 OBD2 Common Codes:\nP0300 = Random Misfire\nP0171 = System Too Lean (Air Leak)\nP0420 = Catalytic Converter Low\nP0507 = Idle Speed High\nP0128 = Thermostat Issue\nP0340 = Camshaft Position Sensor\nP0562 = Low System Voltage\nC = Chassis, B = Body, U = Network" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**ऑइल चेंज**: Drain Plug खोलें → 30 min drain → New Filter → Fill spec oil → Check Dipstick", "**ब्रेक पैड**: Jack up → Wheel off → Caliper Bolts → Old Pad out → Compress Piston → New Pad", "**Timing Belt**: हर 60,000 km — बहुत ज़रूरी, टूटा तो Engine damage", "**Coolant Flush**: Drain → Flush Water → Fill New Coolant (50:50 mix)", "**Spark Plug**: Remove Coil → Unscrew Plug → Gap check → New Plug → Torque spec", "**Air Filter**: Open Box → Remove old → Clean housing → Install new → Close properly"], diagram: "🔧 Service Schedule:\n5,000 km = Engine Oil + Filter\n10,000 km = + Air Filter\n20,000 km = + Cabin Filter + Brake Check\n40,000 km = + Spark Plugs + Coolant\n60,000 km = + Timing Belt/Chain Check\n80,000 km = + Transmission Fluid\n100,000 km = Full Major Service" },
  ]),
  "डीजल इंजन (ट्रक/ट्रैक्टर)": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["इंजन टाइप पहचानें: **Inline 4/6 Cylinder, V-Type (Truck)**", "**FIP (Fuel Injection Pump)** का मॉडल नोट करें — Bosch, Mico, Denso", "कंप्रेशन प्रेशर गेज तैयार करें — Diesel min 350 PSI needed", "**Turbocharger** equipped है तो Boost pressure भी check करें", "**Injector Tester** (Pop Tester) — spray pattern और pressure test"], diagram: "📐 Diesel Engine Cycle:\n1. Intake Stroke: Only Air pulled in\n2. Compression: Air compressed 22:1 ratio\n   (Temperature rises to 700°C+)\n3. Power: Diesel injected → Auto-ignites\n4. Exhaust: Burnt gases pushed out\n\nKey: No Spark Plug needed!\nFuel Injection Timing is CRITICAL" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**सफेद धुआं**: Head Gasket leak — Coolant जल रहा है (sweet smell)", "**काला धुआं**: Injector Nozzle worn, Air Filter blocked, Over-fueling", "**नीला धुआं**: Oil burning — Piston Rings/Valve Seals worn", "**स्टार्ट नहीं**: FIP timing, Injector, Glow Plug (cold weather), Fuel Filter blocked", "**Knocking Sound**: Injector timing advanced, Bearing worn, Low oil", "**Power Loss**: Turbo issue, Fuel Filter clogged, EGR valve stuck"], diagram: "📊 Smoke Color Diagnosis:\n\nWhite Smoke = Coolant entering cylinder\n  → Head Gasket, Cracked Head\n\nBlack Smoke = Too much fuel/less air\n  → Injector, Air Filter, Turbo\n\nBlue Smoke = Oil burning\n  → Rings, Valve Seals, Turbo Seals\n\nNo Smoke but Low Power = \n  → Fuel delivery issue, Timing off" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**इंजेक्टर** ओवरहॉल: निकालें → Nozzle साफ → Pop Test (175-180 bar) → Fine spray pattern check", "**FIP Calibration**: Authorized workshop — Delivery Volume और Timing सेट करें", "**हेड गैसकेट** बदलें: Head Bolts को Torque Wrench से **specific sequence** में कसें", "**Turbo Service**: Oil feed line check → Shaft play (max 0.05mm) → Rebuild if worn", "**Valve Grinding**: Lap valves with paste → 45° seat → Blue test for seal", "**Engine Overhaul**: Rebore Cylinder → Oversize Piston → New Bearings → Assembly"], diagram: "🔧 Major Overhaul Steps:\n1. Remove Engine from Vehicle\n2. Disassemble completely\n3. Clean all parts (Degreaser)\n4. Measure Cylinder Bore\n5. Rebore if worn (0.25/0.50mm OS)\n6. New Pistons, Rings, Bearings\n7. Grind Valves, Replace Seals\n8. Assemble with new Gaskets\n9. Set FIP Timing\n10. Break-in: 500km gentle driving" },
  ]),
  "ऑटो इलेक्ट्रिकल": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**वायरिंग डायग्राम** पढ़ना सीखें — Color codes याद करें", "मल्टीमीटर, टेस्ट लैंप, Oscilloscope तैयार करें", "बैटरी डिस्कनेक्ट करें (**-ve पहले**, reconnect +ve पहले)", "**Fuse Box** location जानें — Owner's Manual में diagram", "**Ground Connection** सबसे ज़्यादा common problem है"], diagram: "📐 Vehicle Electrical System:\nBattery (12V)\n→ Starter Motor (Cranking)\n→ Alternator (Charging)\n→ Fuse Box (Protection)\n→ Ignition System\n→ Lighting System\n→ ECU/Sensors\n→ Accessories (AC, Music, etc)" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**बैटरी**: Voltage चेक — 12.6V=Full, 12.4V=75%, <12V=Dead", "**Alternator**: इंजन चालू पर 13.8V-14.4V आना चाहिए — less = Alternator issue", "**Starter Motor**: Click हो पर न घूमे = Solenoid Contact या Carbon Brush worn", "**Lights dim**: Ground wire loose या corroded — Clean और tighten करें", "**Battery drain**: Parasitic draw test — Multimeter Amp mode, <50mA normal", "**Wiper/Window**: Relay, Switch, Motor — Step by step check करें"], diagram: "📊 Battery Health Check:\n12.6V+ = 100% Charged\n12.4V  = 75%\n12.2V  = 50%\n12.0V  = 25%\n11.8V  = Dead\n\nLoad Test: Apply 50% CCA\nVoltage should stay >9.6V for 15 sec\n\nAlternator: 13.8V-14.4V (engine on)\nBelow 13V = Alternator failing" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**Alternator Rebuild**: Belt off → Remove → Open → New Brushes + Bearings + Regulator → Assemble", "**Starter Motor**: Remove → Open → New Solenoid Contacts → Carbon Brushes → Test on bench", "**Wiring Repair**: Damaged wire → Strip → Solder join → Heat shrink → Route properly", "**Relay Replacement**: Find correct relay → Match pin pattern → Plug in new one", "**ECU Reset**: Disconnect Battery 15 min → Reconnect → Drive 50km for relearn", "**Headlight Upgrade**: Check wiring capacity → Relay harness → Proper fuse sizing"], diagram: "🔧 Alternator Rebuild:\n1. Remove Belt\n2. Disconnect wires\n3. Remove Alternator\n4. Open Rear Cover\n5. Remove old Brushes\n6. Check Slip Rings\n7. Remove Bearings (puller)\n8. Install new Bearings (press)\n9. New Brushes + Springs\n10. New Regulator/Rectifier\n11. Assemble → Test output" },
  ]),
  "पेंटिंग और डेंटिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["डेंट की **गहराई** और एरिया मापें — PDR possible?", "**सैंडपेपर** grades: 80 (rough), 150, 400 (medium), 800, 1500, 2000 (fine)", "**मास्किंग टेप और Paper** से बाकी हिस्सा ढकें — overspray prevention", "**PPE**: Respirator mask, Goggles, Gloves — Paint fumes खतरनाक", "Paint **Color Code** मैच करें — Door pillar sticker पर होता है"], diagram: "📐 Vehicle Paint Layers:\nMetal Body (Base)\n→ E-Coat (Anti-rust, Factory)\n→ Primer (Adhesion + Filling)\n→ Base Coat (Color)\n→ Clear Coat (Protection + Shine)\n\nTotal thickness: ~100-150 microns" },
    { title: "Denting Process", titleHi: "डेंटिंग प्रक्रिया", points: ["**PDR (Paintless Dent Repair)**: छोटे डेंट — Special rods से पीछे से push", "**Conventional**: बड़े डेंट — Hammer/Dolly technique", "**Body Filler** (Putty): Mix Filler + Hardener → Apply → Dry 30 min → Sand smooth", "Sand sequence: **80 grit → 150 → 400 → 800** (progressively smoother)", "**Primer** 2-3 coats लगाएं → Dry → Sand 800 → Ready for paint", "**Spot Putty**: Pin holes भरने के लिए fine putty → Sand 1000 → Smooth finish"], diagram: "🔧 Dent Repair Steps:\n1. Assess Damage Depth\n2. PDR attempt (if possible)\n3. If not: Rough out with Hammer\n4. Apply Body Filler\n5. Shape with File/Board\n6. Sand 80 → 150 → 400\n7. Apply Spot Putty (pinholes)\n8. Sand 800\n9. Clean surface\n10. Apply Primer (2-3 coats)" },
    { title: "Painting Process", titleHi: "पेंटिंग प्रक्रिया", points: ["**स्प्रे गन** सेटिंग: HVLP gun, 2-3 bar pressure, correct nozzle (1.3-1.4mm)", "**Base Coat**: 2-3 coats, 10-15 min flash time between coats", "**Metallic/Pearl**: Extra care — uniform passes, same distance (15-20cm)", "**Clear Coat**: 2-3 coats, slightly higher pressure, flow coat last", "**Drying**: 24 hours natural या 30 min bake (60°C oven)", "**Polishing**: After cure → 1500 grit wet sand → Compound → Polish → Wax"], diagram: "📐 Spray Technique:\n→ Hold Gun 15-20cm from surface\n→ Move Left to Right steadily\n→ 50% overlap each pass\n→ Top to Bottom sequence\n→ Start spraying OFF panel\n→ Release trigger OFF panel\n→ Maintain constant speed\n→ Check coverage after each coat" },
  ]),
  "EV रिपेयरिंग (इलेक्ट्रिक वाहन)": makeLessons([
    { title: "Safety First", titleHi: "सुरक्षा सबसे पहले", points: ["**1000V Insulated Gloves** पहनें — High Voltage Battery!", "**HV Battery** डिस्कनेक्ट करें — Orange Service Plug/Connector", "**Wait 10 minutes** after disconnect — Capacitors discharge होने दें", "**Insulation Resistance Test**: Megger >1MΩ before touching any HV component", "**First Responder**: EV accident में पानी से बुझाएं, Dry Chemical Extinguisher भी OK"], diagram: "📐 EV Major Systems:\nBattery Pack (48V-400V+)\n→ BMS (Battery Management)\n→ Inverter (DC to AC)\n→ Electric Motor (BLDC/PMSM)\n→ Motor Controller\n→ On-Board Charger (OBC)\n→ DC-DC Converter (12V system)\n→ Thermal Management" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**Range कम**: Individual cell voltage check — BMS data read करें", "**चार्ज नहीं**: Charger, OBC, Charging Port, Communication (CAN bus) check", "**Motor noise**: Bearing worn, Hall Sensor fault (BLDC), Controller issue", "**Error on Dashboard**: OBD/CAN Scanner से fault code read करें", "**12V Battery dead**: DC-DC Converter output check (13.5-14.5V)", "**Thermal Cutoff**: Cooling system check — Pump, Radiator, Coolant level"], diagram: "📊 Battery Pack Structure:\n\nSingle Cell: 3.2V (LFP) or 3.7V (NMC)\n↓\nModule: 4-12 cells in series\n↓\nPack: Multiple modules\n↓\nBMS monitors:\n  - Individual Cell Voltage\n  - Temperature (each module)\n  - Current (charge/discharge)\n  - State of Charge (SOC)\n  - State of Health (SOH)" },
    { title: "Repairing Process", titleHi: "ठीक करने की प्रक्रिया", points: ["**Cell Replacement**: Bad cell identify → Spot Weld remove → New cell (same capacity) → Spot Weld", "**Controller Repair**: MOSFET check → Gate Driver IC → Capacitors → Replace faulty", "**Motor Service**: Bearing replace, Hall Sensor replace (BLDC), Winding check (Megger)", "**BMS Reset/Replace**: Calibrate SOC, Replace if communication error persists", "**Charger Repair**: Input fuse, Bridge rectifier, PFC stage, Output DC check", "**Wiring**: HV cables must be Orange color coded, proper torque on terminals"], diagram: "🔧 Cell Replacement Procedure:\n1. Safety Protocol (Gloves, Disconnect)\n2. Open Battery Pack\n3. Measure Each Cell Voltage\n4. Identify Bad Cell (<2.5V or >3.65V)\n5. Remove Spot Weld (Grinder/Drill)\n6. Extract Bad Cell\n7. Match New Cell (Same mAh rating)\n8. Spot Weld New Cell\n9. Insulate properly\n10. BMS Calibration\n11. Close Pack → Charge → Test" },
  ]),
};

const modernSkillsLessons: Record<string, Lesson[]> = {
  "टेलरिंग / सिलाई": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**सिलाई मशीन** सेट करें: बॉबिन भरें, सुई लगाएं (नंबर 14 general purpose)", "**मापने के उपकरण**: इंच टेप, L-Scale रूलर, French Curve, चॉक/मार्कर", "कपड़े का **टाइप** पहचानें: Cotton (आसान), Silk (फिसलता है), Polyester (गर्मी सहता है)", "**Thread**: कपड़े के रंग से मैच करें, Polyester thread सबसे versatile"], diagram: "📐 Body Measurement Points:\n1. Chest/Bust (सीने का माप)\n2. Waist (कमर)\n3. Hip (कूल्हा)\n4. Shoulder (कंधा)\n5. Sleeve Length (बांह)\n6. Full Length (पूरी लंबाई)\n7. Neck (गला)\n8. Armhole (बगल)" },
    { title: "Cutting", titleHi: "कटिंग", points: ["**पैटर्न** बनाएं: Brown paper पर माप के अनुसार draw करें", "कपड़े को **फोल्ड** करें (Grain Line follow करें — thread direction)", "**सीम अलाउंस** (0.5-1 इंच) हर तरफ छोड़ें", "**Notches** (निशान) लगाएं — matching points बाद में काम आएंगे", "**Bias Cut** (तिरछा): stretchy drape के लिए — Salwar, Gowns", "Sharp **Fabric Scissors** ही use करें — paper scissors से कपड़ा खराब कटेगा"], diagram: "📊 Pattern Layout on Fabric:\n┌──────────────────────┐\n│ ←Selvedge (किनारा)→  │\n│  ┌─────┐  ┌──────┐   │\n│  │Front│  │ Back │   │\n│  │     │  │      │   │\n│  └─────┘  └──────┘   │\n│  ┌────┐ ┌────┐       │\n│  │Slv1│ │Slv2│       │\n│  └────┘ └────┘       │\n│  ←Fold Line→         │\n└──────────────────────┘" },
    { title: "Stitching", titleHi: "सिलाई प्रक्रिया", points: ["**लॉक स्टिच** से शुरू और खत्म करें (3 बार आगे-पीछे)", "**सीधी सिलाई**: Presser Foot की edge को guide की तरह use करें", "**ज़िग-ज़ैग**: कच्चे किनारे पर — unraveling रोकने के लिए", "**बटनहोल**: Buttonhole foot use करें, Button size measure करें", "**ज़िप लगाना**: Zipper foot use करें, Baste (कच्ची सिलाई) पहले", "**हेम (मोड़)**: Iron से fold → Pin → Straight stitch or Blind hem", "**प्रेस** (इस्त्री): हर seam सिलने के बाद press करें — professional finish"], diagram: "🔧 Stitch Types Guide:\nStraight Stitch → General sewing\nZigzag → Edge finishing, stretchy fabric\nOverlock → Professional edge (Serger machine)\nButtonhole → Button openings\nBlind Hem → Invisible hem\nTopstitch → Decorative, visible stitch\nBasting → Temporary hold (long stitch)" },
  ]),
  "ब्यूटी पार्लर कोर्स": makeLessons([
    { title: "Foundation", titleHi: "बेसिक्स", points: ["**स्किन टाइप** पहचानें: Oily (तैलीय), Dry (रूखी), Combination, Sensitive", "**हाइजीन**: सभी tools को Autoclave/UV Sterilize करें — infection prevention", "प्रोडक्ट्स का **Patch Test** करें — कान के पीछे 24 hours test", "**Shelf Life** चेक करें — expired products से skin damage", "**PPE**: Gloves, Apron, Clean towels — हर client के लिए fresh"], diagram: "📐 Skin Anatomy:\nEpidermis (बाहरी परत)\n  → Stratum Corneum (Dead cells)\n  → Melanocytes (Color)\nDermis (मध्य परत)\n  → Collagen (Elasticity)\n  → Sebaceous Glands (Oil)\n  → Sweat Glands\nSubcutaneous (Fat layer)" },
    { title: "Facial Treatment", titleHi: "फेशियल ट्रीटमेंट", points: ["**Step 1 - Cleansing**: Milk/Gel cleanser → Circular motion → Remove", "**Step 2 - Scrubbing**: Gentle scrub → 2-3 min → Remove dead cells", "**Step 3 - Steaming**: 5-7 min → Opens pores (Oily skin: 5min, Dry: 3min)", "**Step 4 - Extraction**: Blackheads/Whiteheads carefully → Comedone tool", "**Step 5 - Massage**: 10-15 min → Upward circular motion → Blood circulation", "**Step 6 - Face Pack**: Skin type अनुसार → 15 min → Remove → Tone → Moisturize", "**Frequency**: Normal skin monthly, Oily skin 15 days, Sensitive skin 6 weeks"], diagram: "📊 Facial Flow Chart:\nCleanse (3 min)\n→ Scrub (3 min)\n→ Steam (5 min)\n→ Extract (5 min)\n→ Massage (15 min)\n→ Pack (15 min)\n→ Remove + Tone\n→ Serum\n→ Moisturizer\n→ Sunscreen (day)\nTotal: ~60 minutes" },
    { title: "Bridal Makeup", titleHi: "ब्राइडल मेकअप", points: ["**Prep**: CTM (Cleanse-Tone-Moisturize) → Primer (silicone-based for long wear)", "**Foundation**: Shade match करें (Jawline test) → Beauty Blender से apply", "**Concealer**: Under-eye (inverted triangle) → Blemishes → Set with powder", "**Eyes**: Primer → Eyeshadow (3 shade rule) → Liner → Mascara → False Lashes", "**Contour + Highlight**: Cheekbones, Nose, Jawline → Cream then Powder", "**Lips**: Lip Liner → Lipstick → Blot → Reapply → Gloss (optional)", "**Set**: Setting Spray (2-3 passes) → Photo test → Touch-up kit ready"], diagram: "🔧 Bridal Makeup Order:\n1. Skin Prep + Primer\n2. Color Corrector (Green=Redness)\n3. Foundation\n4. Concealer\n5. Loose Powder (Set)\n6. Eyebrows\n7. Eyeshadow + Liner\n8. False Lashes\n9. Contour + Blush\n10. Highlight\n11. Lips\n12. Setting Spray\nTotal: 90-120 minutes" },
  ]),
  "कुकिंग / बेकिंग": makeLessons([
    { title: "Kitchen Mastery", titleHi: "किचन में महारत", points: ["**बर्तन**: कड़ाही (deep fry), तवा (रोटी), प्रेशर कुकर (दाल), बेकिंग ट्रे", "**मसाले**: हल्दी, मिर्च, धनिया, जीरा, गरम मसाला, अमचूर, काला नमक", "**Knife Skills**: Julienne (पतली strips), Dice (छोटे cubes), Chop, Mince", "**हाइजीन**: हाथ धोएं, Cutting Board अलग (veg/non-veg), फ्रिज temp <5°C"], diagram: "📐 Kitchen Station Setup:\n1. Prep Station (Cutting, Measuring)\n2. Cooking Zone (Stove, Oven)\n3. Assembly/Plating Area\n4. Cleaning Station (Sink)\n\nEssential Spices:\nWhole: Cumin, Mustard, Clove, Cardamom\nPowder: Turmeric, Chili, Coriander, Garam Masala" },
    { title: "Indian Cooking", titleHi: "भारतीय खाना", points: ["**तड़का/छौंक**: तेल गर्म → जीरा crackle → राई → करी पत्ता → प्याज golden → टमाटर soft → मसाले", "**रोटी**: आटा + पानी गूंधें → 20 min rest → बेलें (गोल) → तवे पर सेकें → सीधी आंच पर फुलाएं", "**दाल**: धोएं (3-4 बार) → Pressure cook (3-4 सीटी) → तड़का लगाएं → नमक-मसाला", "**चावल**: 1:2 ratio → Soak 30min → Boil → Drain OR Absorption method", "**सब्ज़ी**: तेल → जीरा → प्याज → अदरक-लहसुन → टमाटर → सब्ज़ी → ढक्कन → 10-15 min", "**बिरयानी**: Rice parboil → Meat/Veg curry → Layer → Saffron milk → Dum (slow cook 30 min)"], diagram: "📊 Tadka/Tempering Order:\n1. Heat Oil/Ghee\n2. Cumin Seeds (crackle)\n3. Mustard Seeds (pop)\n4. Curry Leaves (splutter)\n5. Dried Red Chili\n6. Hing/Asafoetida (pinch)\n7. Onion (golden brown)\n8. Ginger-Garlic paste\n9. Tomato (soft)\n10. Powder Spices\n11. Add main ingredient" },
    { title: "Baking Mastery", titleHi: "बेकिंग", points: ["**ओवन प्रीहीट**: हमेशा 10-15 min पहले set temperature पर गर्म करें", "**केक Basic**: Flour 200g + Sugar 150g + Butter 100g + Eggs 3 + Baking Powder 1tsp + Milk", "**Mixing**: Cream Butter+Sugar → Add Eggs one by one → Fold dry ingredients gently", "**कुकीज़**: Cold Butter + Sugar → Flour → Shape → Chill → Bake 180°C 12-15 min", "**ब्रेड**: Flour + Yeast + Sugar + Salt + Warm Water → Knead 10 min → Rise 1 hr → Bake", "**Measurement**: Baking = Science, हमेशा exact measure करें — guessing नहीं चलेगा"], diagram: "🔧 Baking Temperature Guide:\nCookies: 180°C — 12-15 min\nCake: 180°C — 25-35 min\nBread: 200°C — 25-30 min\nPizza: 220°C — 12-15 min\nCupcakes: 175°C — 18-22 min\nBiscuits: 170°C — 15-20 min\n\nDoneness Test:\n→ Toothpick comes out clean\n→ Springs back when touched\n→ Edges pull from sides" },
  ]),
  "ड्राइविंग नियम": makeLessons([
    { title: "Traffic Rules", titleHi: "ट्रैफिक नियम", points: ["**लाल गोला**: रुकें / मना है (No Entry, No Parking, No Horn)", "**नीला गोला**: अनिवार्य (Mandatory — One Way, Compulsory Turn)", "**त्रिकोण (लाल)**: सावधानी / खतरा (School Zone, Speed Breaker, Curve)", "**Signal**: हरी=जाएं, पीली=तैयार रहें/रुकें, लाल=रुकें (Fine ₹1000)", "**Speed Limits**: शहर 50 km/h, हाईवे Car 100/Truck 80 km/h", "**Lane Discipline**: बाएं चलें, Right lane overtaking के लिए, No zigzag"], diagram: "📐 Traffic Sign Categories:\n\n🔴 Prohibitory (मना करने वाले):\n  No Entry, No Parking, Speed Limit\n\n🔵 Mandatory (अनिवार्य):\n  One Way, Compulsory Turn\n\n⚠️ Warning (चेतावनी):\n  School, Speed Breaker, Curve\n\n🟩 Informatory (सूचना):\n  Hospital, Petrol, Parking Available" },
    { title: "License Process", titleHi: "लाइसेंस प्रक्रिया", points: ["**Learning License**: parivahan.gov.in → Apply → Documents → Online Test → LL issued", "**30 दिन बाद** Driving License Apply करें — Practical driving test", "**Documents**: आधार, Age Proof, Address Proof, 6 Passport Photos, Medical (40+ age)", "**Test**: Traffic Rules quiz (online) → Driving test (figure 8, parking, traffic)", "**Renewal**: 20 साल की वैधता → Expire से 1 साल पहले renew करें", "**International DL**: RTO से apply, Valid passport required, 1 year validity"], diagram: "📊 License Process:\n1. parivahan.gov.in\n2. Fill Form 1 (LL Application)\n3. Upload Documents\n4. Pay Fee (₹200 approx)\n5. Book Slot for LL Test\n6. Pass Online Test\n7. LL Issued (Valid 6 months)\n8. Practice 30+ days\n9. Apply for DL (Form 4)\n10. Driving Test at RTO\n11. DL Issued (Valid 20 years)" },
    { title: "Safe Driving & Fines", titleHi: "सुरक्षित ड्राइविंग और जुर्माने", points: ["**सीट बेल्ट** ज़रूरी: Driver + Front Passenger (₹1,000 fine)", "**हेलमेट** ज़रूरी: ISI marked, 3 months suspension possible (₹1,000)", "**शराब पीकर**: 0 tolerance — ₹10,000 fine + 6 months jail + License suspend", "**ओवरस्पीडिंग**: ₹1,000-2,000 first, ₹2,000-4,000 repeat", "**Red Light Jump**: ₹1,000-5,000 fine", "**Without License**: ₹5,000 fine + Vehicle seized", "**Phone while driving**: ₹5,000 fine — Use hands-free or pull over"], diagram: "🔧 Fine Chart (Motor Vehicle Act 2019):\nNo Seatbelt: ₹1,000\nNo Helmet: ₹1,000 + 3 month suspend\nDrunk Driving: ₹10,000 + Jail\nOverspeeding: ₹1,000-4,000\nRed Light: ₹1,000-5,000\nNo License: ₹5,000\nNo Insurance: ₹2,000\nPhone Use: ₹5,000\nNo Pollution Certificate: ₹10,000\nOverloading: ₹20,000 + ₹2,000/extra ton" },
  ]),
  "प्लम्बिंग कोर्स": makeLessons([
    { title: "Fundamentals", titleHi: "बेसिक्स", points: ["**Pipe Types**: PVC (Cold Water, सफेद), CPVC (Hot Water, क्रीम), PPR (Premium, हरा), GI (Heavy Duty, लोहा)", "**Fittings**: Elbow (90°/45°), Tee (T-junction), Coupling (जोड़), Reducer, Union, Valve", "**Tools**: Pipe Cutter, Adjustable Wrench, Teflon Tape, Solvent Cement, Pipe Threading Die", "**Pipe Sizes**: 15mm (½ inch) taps, 20mm (¾) distribution, 25mm (1 inch) main line"], diagram: "📐 Plumbing System Overview:\nOverhead Tank\n→ Main Valve (25mm GI/PPR)\n→ Distribution Lines (20mm)\n→ Branch Lines (15mm)\n→ Taps, Showers, WC\n\nDrainage:\nSink/WC → P-Trap/S-Trap\n→ Drain Pipe (75-110mm)\n→ Vent Pipe (for air)\n→ Main Sewer Line" },
    { title: "Installation", titleHi: "इंस्टॉलेशन", points: ["**सप्लाई लाइन**: Tank → Main Valve → Distribution → Individual Taps", "**ड्रेनेज**: हर fixture में **Trap** (P or S) ज़रूरी — gas blockage", "**Slope**: ड्रेन पाइप में 1-2% slope (1 inch per foot) रखें — gravity flow", "**Hot Water Line**: Geyser → Red pipe → Mixer tap → Never mix PVC for hot water", "**WC Installation**: Closet → Wax Ring/Rubber Seal → Floor Bolts → Water Connection", "**Concealed Plumbing**: Plan before wall work — PVC conduit में pipe रखें"], diagram: "📊 Standard Heights:\nWash Basin: 800mm from floor\nKitchen Sink: 850mm\nShower: 2000mm\nWC Flush: 1000mm\nGeyser: 1800mm\nWashing Machine Tap: 700mm\nBalcony Tap: 300mm" },
    { title: "Repair & Maintenance", titleHi: "रिपेयर और रखरखाव", points: ["**लीकेज Fix**: Thread joint → Teflon Tape (clockwise 5-6 wraps) → Tighten", "**PVC Joint Fix**: Cut bad section → Clean → Solvent Cement → Join → Wait 2 hrs", "**ब्लॉक Drain**: Plunger (suction) → Chemical (NaOH) → Snake Wire → Hydro jet", "**Tap Dripping**: Washer/Cartridge बदलें — Turn off main supply first", "**Flush Not Working**: Float valve adjust/replace, Flush valve seal replace", "**Water Hammer**: Air chamber install करें, Check valve tighten करें"], diagram: "🔧 PVC Pipe Joining:\n1. Cut pipe square (Pipe Cutter)\n2. Deburr edges (Sand paper)\n3. Dry Fit first (check alignment)\n4. Apply Primer (Purple, optional)\n5. Apply Solvent Cement (both surfaces)\n6. Push and twist ¼ turn\n7. Hold 30 seconds\n8. Wipe excess cement\n9. Wait 2 hours before pressure\n10. Test for leaks" },
  ]),
  "इलेक्ट्रीशियन कोर्स": makeLessons([
    { title: "Electrical Basics", titleHi: "बेसिक्स", points: ["**V = I × R** (Ohm's Law) — Voltage = Current × Resistance", "**P = V × I** (Power) — Watt = Volt × Ampere", "**Phase (लाल/भूरा)**, **Neutral (काला/नीला)**, **Earth (हरा/पीला-हरा)**", "**MCB**: Overload/Short Circuit protection, **RCCB**: Earth Leakage protection", "**Wire Rating**: 1.0mm (5A/Light), 1.5mm (10A/Fan), 2.5mm (15A/AC), 4.0mm (20A/Geyser)"], diagram: "📐 House Electrical Distribution:\nMeter (EB Supply)\n→ Main MCB (32A/63A)\n→ RCCB (Earth Leakage Protection)\n→ Distribution Board (DB)\n  → MCB 6A (Lights)\n  → MCB 10A (Fans + Sockets)\n  → MCB 16A (AC)\n  → MCB 20A (Geyser)\n  → MCB 16A (Kitchen)" },
    { title: "House Wiring", titleHi: "हाउस वायरिंग", points: ["**Conduit (PVC)**: 20mm for Light, 25mm for Power — wire को सुरक्षित रखता है", "**15A सर्किट**: AC, Geyser, Heater — 2.5mm wire + 16A MCB", "**5A सर्किट**: Light, Fan, Charging — 1.0-1.5mm wire + 6-10A MCB", "**हर रूम**: Minimum 2 circuits — 1 Light + 1 Power socket", "**Switch Board**: Height 1200mm from floor, Uniform throughout house", "**Junction Box**: हर connection accessible रखें — future repair के लिए"], diagram: "📊 Load Calculation Example:\nBedroom:\n  2 Lights × 15W = 30W\n  1 Fan × 75W = 75W\n  1 AC × 1500W = 1500W\n  2 Sockets × 100W = 200W\n  Total = 1805W\n  Current = 1805/220 = 8.2A\n  Wire: 2.5mm\n  MCB: 16A\n\nFull House: Sum all rooms\n  → Main MCB size accordingly" },
    { title: "Safety & Earthing", titleHi: "सुरक्षा और अर्थिंग", points: ["**काम से पहले**: MCB बंद करें → Tester से confirm → Lock Out Tag Out", "**Earthing (GI Pipe Method)**: 8ft गड्ढा → GI Pipe → Coal + Salt layers → GI Wire → DB Earth Bar", "**Earthing (Plate Method)**: 600×600mm Copper Plate → 8ft deep → Charcoal + Salt", "**Earth Resistance**: <2 Ohm (ideal), measure with Earth Tester", "**Testing**: Megger से Insulation Resistance चेक करें (>1 MΩ)", "**Safety**: Rubber mat use करें, Wet hands से कभी switch न छुएं"], diagram: "🔧 GI Pipe Earthing Steps:\n1. Dig pit 8 feet deep × 1.5ft wide\n2. Insert GI Pipe (2 inch, 8ft)\n3. Fill around pipe:\n   Layer 1: Charcoal (6 inches)\n   Layer 2: Salt (3 inches)\n   Repeat layers to top\n4. Connect GI Wire (8 SWG)\n5. Run wire to Distribution Board\n6. Connect to Earth Bar\n7. Pour water (weekly in summer)\n8. Test Earth Resistance (<2 Ohm)\n9. Cover pit with concrete chamber\n10. Maintain: Water + Salt yearly" },
  ]),
};

const medicalLessons: Record<string, Lesson[]> = {
  "नर्सिंग कोर्स": makeLessons([
    { title: "Patient Assessment", titleHi: "मरीज़ की जांच", points: ["**Vitals Check**: BP (120/80 mmHg), Pulse (60-100/min), Temp (98.6°F/37°C), SpO2 (95-100%)", "**BP Measurement**: Cuff बांधें → Stethoscope → Inflate → Slowly deflate → Note systolic/diastolic", "**Pain Scale**: 0-10 (0=No Pain, 10=Worst) — Patient से पूछें", "**GCS (Glasgow Coma Scale)**: Eye 4 + Verbal 5 + Motor 6 = 15 (Normal)", "**Medical History**: Allergies, Current Medicines, Past Surgeries, Chronic conditions"], diagram: "📐 Vital Signs Normal Range:\nBlood Pressure: 120/80 mmHg\n  High: >140/90 (Hypertension)\n  Low: <90/60 (Hypotension)\nPulse: 60-100 beats/min\n  Infant: 120-160\n  Child: 80-120\nTemperature: 98.6°F (37°C)\n  Fever: >100.4°F (38°C)\nSpO2: 95-100%\n  Below 90% = Emergency\nRespiration: 12-20/min" },
    { title: "Injections & IV", titleHi: "इंजेक्शन और IV", points: ["**IM (Intramuscular)**: Deltoid या Gluteus muscle, 90° angle, 22-23G needle", "**SC (Subcutaneous)**: पेट या बांह, 45° angle, 25-26G needle (Insulin)", "**IV (Intravenous)**: Cannula insert, Tourniquet लगाएं, Vein select (dorsal hand/forearm)", "**IV Drip Rate**: Drops/min = (Volume × Drop Factor) / (Time in min)", "**Aseptic Technique**: Gloves + Alcohol swab + No touch technique", "**Complications Watch**: Infiltration, Phlebitis, Air embolism, Allergic reaction"], diagram: "📊 Injection Angles & Sites:\nIntradermal (ID): 10-15° → Forearm\n  → TB Test (Mantoux)\nSubcutaneous (SC): 45° → Abdomen/Arm\n  → Insulin, Heparin\nIntramuscular (IM): 90° → Deltoid/Gluteus\n  → Vaccines, Antibiotics\nIntravenous (IV): 15-25° → Vein\n  → Fluids, Medications\n\nNeedle Gauge:\n18G = Blood donation\n20G = IV fluids\n22G = IM injection\n25G = SC injection" },
    { title: "Emergency & First Aid", titleHi: "आपातकालीन और प्राथमिक चिकित्सा", points: ["**CPR**: 30 Chest Compressions + 2 Breaths → Rate 100-120/min → Depth 5cm → Allow full recoil", "**AED Use**: Power ON → Attach Pads → Analyze → Clear → Shock if advised", "**Choking**: Back blows (5) → Abdominal thrusts/Heimlich (5) → Repeat", "**Severe Bleeding**: Direct Pressure → Elevate → Tourniquet (last resort, note time)", "**Burns Rule of 9s**: Head 9% → Each Arm 9% → Front/Back Trunk 18% each → Each Leg 18%", "**Fracture**: Immobilize (Splint) → Don't move → Cold pack → Hospital immediately", "**Anaphylaxis**: Epi-Pen (Thigh IM) → Call ambulance → Lay flat → Monitor airway"], diagram: "🔧 CPR Algorithm (Adult):\n1. Check Scene Safety\n2. Check Responsiveness (Tap + Shout)\n3. Call 108/112\n4. Check Breathing (10 seconds)\n5. If not breathing normally:\n   → 30 Chest Compressions\n   → Push hard, push fast (5cm depth)\n   → Rate 100-120/min\n   → 2 Rescue Breaths\n   → Head tilt, chin lift\n   → Watch chest rise\n6. Continue 30:2 ratio\n7. Use AED when available\n8. Don't stop until help arrives" },
  ]),
  "होम्योपैथिक दवाएं": makeLessons([
    { title: "Principles", titleHi: "सिद्धांत", points: ["**Like Cures Like**: जो substance बीमारी जैसे लक्षण पैदा करे, वही उसका इलाज", "**Minimum Dose**: सबसे कम मात्रा में दवा — side effects शून्य", "**Potency Scale**: Mother Tincture (Q) → 6C → 30C → 200C → 1M → 10M → CM", "**Higher Potency = Stronger** (paradox) — 200C > 30C in strength", "**Individualization**: Same बीमारी, Different लोग = Different दवा (संपूर्ण लक्षण देखें)", "**Miasm Theory**: Psora, Sycosis, Syphilis — Disease की जड़"], diagram: "📐 Potency Guide:\nMother Tincture (Q/θ) = Original substance\n6C = Mild, Physical ailments\n30C = Medium, General use\n200C = Strong, Acute cases\n1M = Very Strong, Deep acting\n10M = Constitutional treatment\nCM = Highest, Rare use\n\nLX = 50 Millesimal scale\n(Gentler, continuous dosing)" },
    { title: "Important Medicines", titleHi: "महत्वपूर्ण दवाइयां", points: ["**Arnica Montana**: चोट, सूजन, मांसपेशी दर्द, Surgery से पहले/बाद — 'King of Injuries'", "**Nux Vomica**: अपच, गैस, कब्ज, अधिक खाने/पीने से, सुबह तबीयत खराब", "**Belladonna**: तेज बुखार (अचानक), गले में दर्द, सिरदर्द (throbbing), लाल चेहरा", "**Rhus Toxicodendron**: जोड़ों का दर्द (movement से better), Stiffness, Muscle pain", "**Bryonia Alba**: सूखी खांसी, Motion से worse, Press करने से better, Thirst ज्यादा", "**Aconitum Napellus**: बुखार/ठंड लगने पर (sudden onset), Fear, Anxiety attack", "**Pulsatilla**: Changeable symptoms, Weepy mood, Better in open air, No thirst with fever"], diagram: "📊 Quick Medicine Finder:\nFever (sudden) → Aconitum 200C\nFever (high, red face) → Belladonna 200C\nInjury/Bruise → Arnica 200C\nIndigestion → Nux Vomica 30C\nJoint Pain (stiff) → Rhus Tox 30C\nDry Cough → Bryonia 30C\nCold (running nose) → Allium Cepa 30C\nSore Throat → Mercurius 30C\nAnxiety → Argentum Nit 30C\nSleeplessness → Coffea 200C" },
    { title: "Usage & Dosage", titleHi: "उपयोग और मात्रा", points: ["**30C Dosage**: 4-5 globules, दिन में 3 बार (सामान्य बीमारी)", "**200C Dosage**: Single dose, Wait and Watch — Repeat only if symptoms return", "**Mother Tincture**: 10-15 drops in water, 2-3 times daily", "**How to Take**: चीनी गोलियों पर 2-3 बूंद → ज़ुबान के नीचे रखें → Melt होने दें", "**Avoid**: कपूर, पुदीना, Strong coffee, Raw onion/garlic — ये antidote करते हैं", "**Storage**: Dark glass bottle, Away from sunlight, perfume, strong odors"], diagram: "🔧 Dosing Rules:\n\nAcute Illness (तीव्र):\n  30C: Every 2-4 hours\n  200C: Single dose, Wait 24 hrs\n\nChronic (पुरानी बीमारी):\n  30C: Twice daily for weeks\n  200C: Once weekly\n  1M: Monthly (by practitioner)\n\nPrevention:\n  200C: One dose weekly\n\n⚠️ Important:\n→ Stop when better\n→ If no change in 48 hrs, reconsider\n→ Consult practitioner for chronic issues" },
  ]),
  "एलोपैथिक ज्ञान": makeLessons([
    { title: "Medicine Categories", titleHi: "दवाओं के प्रकार", points: ["**Analgesic (दर्द)**: Paracetamol (500mg), Ibuprofen (400mg), Diclofenac", "**Antibiotic (संक्रमण)**: Amoxicillin, Azithromycin, Ciprofloxacin — **Doctor's prescription ज़रूरी**", "**Antacid (एसिडिटी)**: Pantoprazole (40mg), Omeprazole, Ranitidine", "**Antihistamine (एलर्जी)**: Cetirizine (10mg), Levocetirizine, Fexofenadine", "**Antipyretic (बुखार)**: Paracetamol ही primary — Aspirin बच्चों को नहीं देना", "**कभी भी** बिना Doctor की सलाह Antibiotic न लें — Resistance बढ़ता है!"], diagram: "📐 Medicine Forms:\nTablet/Capsule → Oral (मुंह से)\nSyrup → Oral (बच्चों के लिए)\nInjection → IM/IV/SC\nOintment/Cream → Topical (त्वचा पर)\nDrops → Eye/Ear/Nose\nInhaler → Respiratory (सांस)\nSuppository → Rectal\nPatch → Transdermal (चिपकाने वाला)" },
    { title: "Common Treatments", titleHi: "आम बीमारियों का इलाज", points: ["**बुखार**: Paracetamol 500mg हर 6 घंटे (max 4 tablets/day) + Rest + Fluids", "**एसिडिटी**: Pantoprazole 40mg सुबह खाली पेट, 30 min पहले खाने से", "**एलर्जी/ज़ुकाम**: Cetirizine 10mg रात को (drowsy हो सकता है)", "**दस्त**: ORS (Oral Rehydration Salt) — ज़्यादा ज़रूरी है दवा से + Zinc supplement", "**खांसी (dry)**: Dextromethorphan syrup → Productive खांसी: Ambroxol/Guaifenesin", "**दर्द (Muscle/Joint)**: Ibuprofen 400mg after food (पेट खराब हो सकता है)", "**⚠️ Doctor ज़रूरी**: Fever >3 days, Blood anywhere, Chest pain, Breathing difficulty"], diagram: "📊 ORS Recipe (घर पर बनाएं):\n1 Liter Clean Water\n+ 6 Teaspoons Sugar\n+ ½ Teaspoon Salt\nMix well → Sip frequently\n\nWhen to use:\n→ Diarrhea/Vomiting\n→ Heat stroke\n→ Dehydration\n\nSigns of Dehydration:\n→ Dry mouth\n→ Less urination\n→ Sunken eyes\n→ Dizziness" },
    { title: "Safety & Precautions", titleHi: "सुरक्षा", points: ["**Expiry Date** हमेशा चेक करें — Expired दवा ज़हर हो सकती है", "**Side Effects**: हर दवा के — जानकारी रखें (Leaflet पढ़ें)", "**Drug Interaction**: 2+ दवाइयां साथ लेने से पहले Doctor/Pharmacist से पूछें", "**Antibiotic Course** पूरा करें — बीच में छोड़ने से Resistance bacteria बनते हैं", "**Allergic Reaction**: Rash, Swelling, Breathing problem → तुरंत बंद करें + Hospital", "**Storage**: Cool Dry place, Not in Bathroom, Not in direct sunlight, Children से दूर"], diagram: "🔧 Medicine Safety Checklist:\n✅ Check Expiry Date\n✅ Read Dosage Instructions\n✅ Take with/without food (as directed)\n✅ Complete full course (Antibiotics)\n✅ Note any Side Effects\n✅ Don't share prescription medicines\n✅ Don't take double dose if missed\n✅ Store properly\n✅ Keep list of all your medicines\n✅ Inform Doctor about allergies\n\n⚠️ NEVER:\n❌ Self-prescribe Antibiotics\n❌ Use expired medicines\n❌ Crush enteric-coated tablets\n❌ Mix alcohol with medicines" },
  ]),
  "आयुर्वेदिक चिकित्सा": makeLessons([
    { title: "Foundation", titleHi: "आधार", points: ["**त्रिदोष**: शरीर 3 ऊर्जाओं से चलता है — **वात, पित्त, कफ**", "**वात** (Air+Space): Movement, Nervous system — असंतुलन: दर्द, गैस, चिंता, अनिद्रा", "**पित्त** (Fire+Water): Digestion, Metabolism — असंतुलन: एसिडिटी, जलन, गुस्सा, रैश", "**कफ** (Water+Earth): Structure, Immunity — असंतुलन: सर्दी, मोटापा, सुस्ती, कफ", "**Prakriti (प्रकृति)**: जन्म से तय Body Constitution — V/P/K dominant", "**Agni (अग्नि)**: पाचन शक्ति — Strong Agni = Good Health"], diagram: "📐 Tridosha System:\n\nVata (वात) = Air + Space\n  → Controls: Movement, Breathing, Nervous\n  → Time: Evening (2-6 PM, 2-6 AM)\n  → Season: Rainy/Autumn\n\nPitta (पित्त) = Fire + Water\n  → Controls: Digestion, Metabolism, Body Heat\n  → Time: Midday (10-2 PM/AM)\n  → Season: Summer\n\nKapha (कफ) = Water + Earth\n  → Controls: Structure, Immunity, Lubrication\n  → Time: Morning (6-10 AM/PM)\n  → Season: Winter/Spring" },
    { title: "Home Remedies", titleHi: "घरेलू नुस्खे", points: ["**सर्दी-खांसी**: अदरक (1 inch) + तुलसी (5 पत्ते) + काली मिर्च (3) + शहद — काढ़ा बनाएं", "**पेट दर्द/गैस**: अजवाइन (½ tsp) + काला नमक + गर्म पानी — खाने के बाद", "**गले में दर्द**: हल्दी (½ tsp) + नमक (¼ tsp) + गर्म पानी — गरारे 3-4 बार/दिन", "**अनिद्रा**: गर्म दूध + हल्दी (¼ tsp) + अश्वगंधा (½ tsp) — सोने से 30 min पहले", "**कब्ज**: त्रिफला चूर्ण (1 tsp) + गर्म पानी — रात को सोते समय", "**एसिडिटी**: ठंडा दूध (1 glass) + सौंफ पानी — खाने के 30 min बाद"], diagram: "📊 Ayurvedic Kadha Recipe:\nIngredients:\n• Water: 2 cups\n• Ginger: 1 inch (crushed)\n• Tulsi: 5-7 leaves\n• Black Pepper: 3-4\n• Clove: 2\n• Cinnamon: 1 small stick\n• Jaggery/Honey: to taste\n\nMethod:\n1. Boil water with all ingredients\n2. Simmer on low 10 minutes\n3. Strain\n4. Add honey when warm (not hot)\n5. Drink warm, 2 times daily\n\nBest for: Cold, Cough, Immunity, Digestion" },
    { title: "Important Herbs", titleHi: "महत्वपूर्ण जड़ी-बूटियां", points: ["**अश्वगंधा**: Stress relief, Energy, Sleep — 500mg powder/day with warm milk", "**गिलोय**: Immunity booster, Fever reducer, Blood purifier — Juice या tablet", "**त्रिफला**: Digestion, Constipation, Eye health — 3 fruits: Amla + Haritaki + Bibhitaki", "**ब्राह्मी**: Memory, Concentration, Brain tonic — Students के लिए best", "**शतावरी**: Women's health, Hormonal balance, Lactation — Powder with milk", "**आंवला (Amla)**: Vitamin C king, Hair, Skin, Immunity — रोज़ 1 आंवला खाएं", "**हल्दी (Curcumin)**: Anti-inflammatory, Wound healing, Immunity — ½ tsp daily with warm milk"], diagram: "🔧 Daily Ayurvedic Routine (Dinacharya):\n4:30 AM - Wake up (Brahma Muhurta)\n5:00 AM - Warm water (2 glasses)\n5:30 AM - Oil Pulling (Til oil, 10 min)\n6:00 AM - Yoga + Pranayama\n6:30 AM - Abhyanga (Self-massage)\n7:00 AM - Bath\n7:30 AM - Breakfast (warm, light)\n12:00 PM - Lunch (largest meal)\n6:00 PM - Light Dinner\n9:00 PM - Warm Milk + Turmeric\n10:00 PM - Sleep\n\n⚡ Key: Eat with hunger, Sleep on time" },
  ]),
  "योग और फिटनेस": makeLessons([
    { title: "Yoga Asanas", titleHi: "योगासन", points: ["**सूर्य नमस्कार**: 12 आसनों का sequence, रोज़ 5-12 rounds — Complete body workout", "**ताड़ासन**: खड़े होकर ऊपर खिंचें — Posture correction, Height growth support", "**भुजंगासन (Cobra)**: पेट के बल, ऊपर उठें — Back pain relief, Spine flexibility", "**पश्चिमोत्तानासन**: बैठकर आगे झुकें — Hamstring stretch, Digestion improvement", "**वृक्षासन (Tree)**: एक पैर पर Balance — Concentration और stability", "**शवासन**: अंत में 5-10 min लेटें — Complete relaxation, Stress relief"], diagram: "📐 Surya Namaskar 12 Poses:\n1. Pranamasana (Prayer)\n2. Hasta Uttanasana (Raised Arms)\n3. Padahastasana (Forward Bend)\n4. Ashwa Sanchalanasana (Lunge)\n5. Dandasana (Plank)\n6. Ashtanga Namaskara (8 points)\n7. Bhujangasana (Cobra)\n8. Adho Mukha (Downward Dog)\n9. Ashwa Sanchalanasana (Lunge)\n10. Padahastasana (Forward Bend)\n11. Hasta Uttanasana (Raised Arms)\n12. Pranamasana (Prayer)\n\n1 Round = Right + Left side" },
    { title: "Pranayama", titleHi: "प्राणायाम", points: ["**अनुलोम-विलोम**: Right nostril बंद → Left से सांस → Switch → Right से बाहर → 10 min", "**कपालभाति**: Force से सांस बाहर (belly pump) → 120 strokes/min → 5 min → Detox", "**भ्रामरी**: कान बंद → भौंरे की आवाज़ (Humming) → Stress और Anxiety relief", "**भस्त्रिका**: दोनों नाक से तेज़ सांस अंदर-बाहर → Energy booster → 2-3 min", "**शीतली**: जीभ मोड़ कर सांस अंदर → नाक से बाहर → Body cooling → Summer में best", "**⚠️ Important**: खाली पेट करें, Heart/BP patients → Doctor से पूछें first"], diagram: "📊 Pranayama Daily Schedule:\nMorning (Empty Stomach):\n\n1. Kapalbhati: 3 rounds × 40 strokes\n   Rest 30 sec between rounds\n   \n2. Anulom-Vilom: 10 minutes\n   Ratio: Inhale 4 → Hold 16 → Exhale 8\n   (Beginners: Just Inhale-Exhale)\n   \n3. Bhastrika: 2 minutes\n   \n4. Bhramari: 5 minutes\n   (7 rounds)\n   \n5. Om Chanting: 5-11 times\n\nTotal: 25-30 minutes" },
    { title: "Fitness Training", titleHi: "फिटनेस ट्रेनिंग", points: ["**Push-ups**: Chest + Arms → Start 5 → Build to 3×15 → Variations: Wide, Diamond, Incline", "**Squats**: Legs + Core → 3×15 → Feet shoulder width → Knees don't pass toes", "**Plank**: Core strength → Hold 30s → 1min → 2min → Side Plank for obliques", "**Lunges**: Legs + Balance → 3×12 each leg → Forward, Reverse, Walking", "**Running/Walking**: 30 min daily → Start walking → Jog → Run → Build stamina", "**Diet**: Protein (दाल, अंडे, पनीर) + Complex Carbs (रोटी, ओट्स) + Vegetables"], diagram: "🔧 Weekly Workout Plan:\nMonday: Chest + Triceps\n  Push-ups, Dips, Diamond Push-ups\n  \nTuesday: Legs + Abs\n  Squats, Lunges, Plank, Crunches\n  \nWednesday: REST or Light Yoga\n  \nThursday: Back + Biceps\n  Pull-ups, Superman, Rows\n  \nFriday: Shoulders + Abs\n  Pike Push-ups, Lateral Raise\n  \nSaturday: Cardio\n  Running 30 min or Skipping\n  \nSunday: REST + Stretching\n\n💧 Water: 3-4 Liters daily\n🍳 Protein: 1g per kg body weight" },
  ]),
};

const computerLessons: Record<string, Lesson[]> = {
  "बेसिक कंप्यूटर": makeLessons([
    { title: "Computer Fundamentals", titleHi: "कंप्यूटर की बुनियाद", points: ["**Input**: Keyboard (टाइप), Mouse (क्लिक), Scanner (स्कैन), Microphone (आवाज़)", "**Processing (CPU)**: Processor (Intel/AMD) = दिमाग, RAM = अस्थायी memory, Motherboard = base", "**Output**: Monitor (दिखाना), Printer (छापना), Speaker (सुनाना)", "**Storage**: HDD (सस्ता, धीमा), SSD (तेज़, महंगा), Pen Drive, Cloud (Google Drive)", "**Software**: OS (Windows/Linux), Application (Word, Chrome), Utility (Antivirus)"], diagram: "📐 Computer Architecture:\nInput Devices\n  ↓\nCPU (Central Processing Unit)\n  ├─ ALU (Arithmetic Logic Unit)\n  ├─ CU (Control Unit)\n  └─ Registers (Fast Memory)\n  ↓\nRAM (Temporary) ←→ Storage (Permanent)\n  ↓\nOutput Devices\n\nStorage Hierarchy (Fast→Slow):\nRegisters → Cache → RAM → SSD → HDD → Cloud" },
    { title: "Windows & Office", titleHi: "विंडोज़ और ऑफिस", points: ["**Desktop**: Icons, Taskbar (bottom), Start Menu (programs), System Tray (clock/wifi)", "**File Management**: Folder बनाना → Right Click → New → Folder | Copy (Ctrl+C), Paste (Ctrl+V)", "**MS Word**: Document बनाना, Font बदलना, Table insert, Header/Footer, Print", "**MS Excel**: Spreadsheet, Formulas (SUM, AVERAGE), Charts, Data Sorting/Filtering", "**MS PowerPoint**: Slides बनाना, Transitions, Animations, Insert Image/Video", "**Shortcuts**: Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+P (Print), Alt+Tab (Switch Windows)"], diagram: "📊 Essential Keyboard Shortcuts:\nCtrl+C = Copy\nCtrl+V = Paste\nCtrl+X = Cut\nCtrl+Z = Undo\nCtrl+S = Save\nCtrl+P = Print\nCtrl+A = Select All\nCtrl+F = Find\nAlt+Tab = Switch Window\nAlt+F4 = Close Program\nWin+D = Show Desktop\nWin+E = File Explorer\nF2 = Rename\nF5 = Refresh" },
    { title: "Internet & Safety", titleHi: "इंटरनेट और सुरक्षा", points: ["**Browser**: Chrome/Firefox — URL bar में address टाइप करें, Search bar में खोजें", "**Email**: Gmail account → Compose → To (किसे) → Subject → Message → Send", "**Strong Password**: 8+ chars, Upper+Lower+Number+Symbol (e.g., Mera@Bharat2024)", "**Phishing**: Fake emails/SMS से बचें — Bank कभी OTP नहीं मांगता", "**2FA (Two Factor)**: Password + OTP/Authenticator → Double security", "**Safe Download**: Official websites से ही download करें — .exe files से सावधान"], diagram: "🔧 Internet Safety Checklist:\n✅ Strong unique passwords\n✅ Enable 2-Factor Authentication\n✅ Don't share OTP with anyone\n✅ Check URL before entering data\n✅ HTTPS = Secure (🔒 icon)\n✅ Update software regularly\n✅ Use Antivirus\n✅ Don't click unknown links\n✅ Backup important files\n✅ Use VPN on public WiFi\n\n⚠️ Red Flags:\n❌ Urgency (\"Act NOW!\")\n❌ Too good offers\n❌ Unknown sender\n❌ Spelling mistakes in email/URL" },
  ]),
  "Tally / अकाउंटिंग": makeLessons([
    { title: "Accounting Basics", titleHi: "अकाउंटिंग बेसिक्स", points: ["**Golden Rules**: Personal A/c (Debit receiver, Credit giver) | Real A/c (Debit what comes in) | Nominal A/c (Debit expenses)", "**Company Create**: Gateway → Create Company → Name, Address, Financial Year (April-March)", "**Ledger बनाएं**: Cash, Bank, Sales, Purchase, Capital, Loan, Expenses", "**Voucher Types**: Payment (पैसा दिया), Receipt (पैसा आया), Journal (adjustment), Contra (Cash↔Bank)", "**Double Entry**: हर Transaction में 2 entries — Debit = Credit (हमेशा बराबर)"], diagram: "📐 Accounting Equation:\nAssets = Liabilities + Capital\n\nGolden Rules:\n┌─────────────────────────────────┐\n│ Personal A/c:                   │\n│   Debit the Receiver            │\n│   Credit the Giver              │\n│ Real A/c:                       │\n│   Debit what Comes In           │\n│   Credit what Goes Out          │\n│ Nominal A/c:                    │\n│   Debit Expenses & Losses       │\n│   Credit Income & Gains         │\n└─────────────────────────────────┘" },
    { title: "GST in Tally", titleHi: "टैली में GST", points: ["**GST Enable**: Company → F11 → Statutory → Enable GST → Yes", "**GSTIN** 15 अंकों का → State Code (2) + PAN (10) + Entity (1) + Check (2)", "**GST Rates**: 5% (Essential), 12% (Standard), 18% (Services/General), 28% (Luxury)", "**Invoice**: Sales Voucher → Party with GSTIN → Items with HSN Code → Tax auto-calculate", "**GSTR-1**: बेचने वाले की monthly return (outward supplies) → 11th of next month", "**GSTR-3B**: Summary return → 20th of next month → Tax payment", "**Input Tax Credit**: Purchase पर चुकाया GST Sales से काटें = Net payment"], diagram: "📊 GST Calculation Example:\nSale Price: ₹10,000\nGST Rate: 18%\n\nIf Same State (IGST = 0):\n  CGST 9% = ₹900\n  SGST 9% = ₹900\n  Total = ₹11,800\n\nIf Different State:\n  IGST 18% = ₹1,800\n  Total = ₹11,800\n\nInput Credit:\n  Purchase GST paid: ₹720\n  Sales GST collected: ₹1,800\n  Net GST to pay: ₹1,080" },
    { title: "Reports & Analysis", titleHi: "रिपोर्ट्स और विश्लेषण", points: ["**Balance Sheet**: Assets (property, cash, stock) vs Liabilities (loans, payable) + Capital", "**Profit & Loss**: Total Income - Total Expenses = Profit (or Loss)", "**Trial Balance**: सभी Ledgers का Summary — Debit total = Credit total", "**Outstanding Report**: Receivables (किससे पैसा आना) + Payables (किसको देना)", "**Cash Flow**: Cash कहां से आया, कहां गया — Liquidity analysis", "**Stock Summary**: कितना माल है, किसकी value कितनी — Inventory management"], diagram: "🔧 Financial Reports Flow:\n\nDaily Work:\n  Voucher Entry (Sales, Purchase, Payment, Receipt)\n  ↓\nMonthly:\n  Ledger Review → Trial Balance → Bank Reconciliation\n  ↓\nQuarterly:\n  GST Returns (GSTR-1, GSTR-3B)\n  ↓\nYearly:\n  Profit & Loss Account\n  → Balance Sheet\n  → Cash Flow Statement\n  → Income Tax Filing\n  → Audit (if applicable)" },
  ]),
  "Excel मास्टर": makeLessons([
    { title: "Excel Fundamentals", titleHi: "Excel बेसिक्स", points: ["**Cell Address**: Column Letter + Row Number = A1, B5, Z100", "**Data Types**: Numbers, Text, Dates (DD/MM/YYYY), Time, Currency", "**Formatting**: Bold (Ctrl+B), Font Size, Cell Color, Border, Number Format (₹, %, decimal)", "**AutoFill**: Pattern select → Drag handle → Series complete (1,2,3... or Jan,Feb,Mar...)", "**Freeze Panes**: View → Freeze Panes → Header row fix while scrolling", "**Sort/Filter**: Data tab → Sort (A-Z, Z-A) → Filter (dropdown per column)"], diagram: "📐 Excel Interface:\n┌─ Name Box ─┬─ Formula Bar ──────────┐\n├────────────┼────────────────────────┤\n│    │  A    │  B    │  C    │  D    │\n│  1 │ Name  │ Price │ Qty   │ Total │\n│  2 │ Rice  │ 50    │ 10    │ =B2*C2│\n│  3 │ Dal   │ 80    │ 5     │ =B3*C3│\n│  4 │       │       │       │       │\n├────┴───────┴───────┴───────┴───────┤\n│ Sheet1 │ Sheet2 │ Sheet3 │         │\n└────────┴────────┴────────┴─────────┘" },
    { title: "Essential Formulas", titleHi: "ज़रूरी फॉर्मूले", points: ["**SUM**: =SUM(A1:A10) — Numbers जोड़ना (Total निकालना)", "**AVERAGE**: =AVERAGE(A1:A10) — औसत निकालना", "**IF**: =IF(A1>50, \"Pass\", \"Fail\") — Condition check करना", "**VLOOKUP**: =VLOOKUP(search_value, table, column_number, FALSE) — Data खोजना", "**COUNTIF**: =COUNTIF(A1:A10, \">50\") — Condition पर count करना", "**CONCATENATE**: =A1&\" \"&B1 — Text जोड़ना (e.g., First + Last Name)", "**SUMIF**: =SUMIF(A:A, \"Rice\", C:C) — Condition based sum"], diagram: "📊 Formula Quick Reference:\n\nMath:\n  SUM, AVERAGE, MAX, MIN, COUNT\n  ROUND, ABS, MOD\n\nLogical:\n  IF, AND, OR, NOT\n  IFERROR, IFS\n\nLookup:\n  VLOOKUP, HLOOKUP, INDEX-MATCH\n  XLOOKUP (newer Excel)\n\nText:\n  CONCATENATE, LEFT, RIGHT, MID\n  UPPER, LOWER, PROPER, TRIM, LEN\n\nDate:\n  TODAY, NOW, DATEDIF\n  YEAR, MONTH, DAY\n  NETWORKDAYS" },
    { title: "Advanced Features", titleHi: "एडवांस्ड", points: ["**Pivot Table**: Large data → Insert → PivotTable → Drag fields to Rows/Values → Summary", "**Charts**: Data select → Insert → Chart Type (Bar, Pie, Line) → Customize", "**Conditional Formatting**: Home → Conditional Formatting → Rules (Color cells based on value)", "**Data Validation**: Dropdown list बनाना → Data → Validation → List", "**VLOOKUP → INDEX-MATCH**: =INDEX(C:C, MATCH(lookup, A:A, 0)) — More powerful than VLOOKUP", "**Macro (VBA)**: Record Macro → Automate repetitive tasks → Developer tab"], diagram: "🔧 Pivot Table Steps:\n1. Click any cell in data range\n2. Insert → PivotTable\n3. Choose New Worksheet\n4. Drag Fields:\n   → Row Labels: Category\n   → Column Labels: Month\n   → Values: Sales (Sum)\n   → Filters: Region\n5. Right-click → Value Field Settings\n6. Change Sum/Count/Average\n7. Insert PivotChart\n8. Refresh: Right-click → Refresh\n\nPro Tips:\n→ Ctrl+Shift+L = Auto Filter\n→ Alt+= = Auto Sum\n→ F4 = Absolute Reference ($A$1)" },
  ]),
  "AI और ChatGPT": makeLessons([
    { title: "AI Fundamentals", titleHi: "AI की समझ", points: ["**AI (Artificial Intelligence)**: मशीन को इंसान जैसा सोचना-समझना सिखाना", "**Machine Learning**: Computer खुद Data से patterns सीखता है (जैसे Spam filter)", "**Deep Learning**: Neural Networks — दिमाग की नकल, Layers of processing", "**LLM (Large Language Model)**: ChatGPT, Gemini — भाषा समझना और generate करना", "**Types**: Narrow AI (specific task — Siri, Google Translate) vs AGI (general — future)", "**Training**: Huge data + Computing Power + Algorithms = AI Model"], diagram: "📐 AI Evolution Timeline:\n1950s: AI concept (Turing Test)\n1980s: Expert Systems\n1990s: Machine Learning rises\n2000s: Deep Learning breakthrough\n2010s: Image Recognition, NLP\n2017: Transformers (Attention)\n2020: GPT-3 (Language AI)\n2022: ChatGPT (Public access)\n2023: GPT-4, Gemini, Claude\n2024: Multimodal AI (Text+Image+Video)\n\nAI Hierarchy:\nAI → ML → Deep Learning → Neural Networks → Transformers → LLMs" },
    { title: "Using AI Tools", titleHi: "AI टूल्स का इस्तेमाल", points: ["**ChatGPT/Gemini**: Questions पूछें, Letters लिखवाएं, Code बनवाएं, Translation करें", "**Prompt Engineering**: Clear instructions + Context + Format specify = Better results", "**Image AI**: DALL-E, Midjourney — Text describe करें → Image generate", "**Code AI**: GitHub Copilot, Cursor — Coding assistant, Bug fixing", "**Video AI**: Runway, Pika — Text से Video बनाएं", "**⚠️ Limitations**: Hallucination (गलत info), Bias, Outdated data, No real understanding"], diagram: "📊 Good Prompt Formula:\n\nBasic: \"Write a letter to school\"\n↓ ↓ ↓\nBetter: \"You are a professional Hindi letter writer. Write a formal leave application to the school principal for 3 days leave due to family function. Include today's date. Keep it respectful and concise in Hindi.\"\n\nComponents:\n1. Role: \"You are a [expert]...\"\n2. Context: Background info\n3. Task: What to do\n4. Format: How to present\n5. Constraints: Limits/rules\n6. Examples: Show desired output" },
    { title: "AI Career Path", titleHi: "AI में करियर", points: ["**Data Entry → Data Analysis**: Excel, SQL, Python basics — Entry level", "**Data Science**: Statistics + Python + ML libraries (Pandas, Scikit-learn)", "**AI/ML Engineer**: Deep Learning, TensorFlow/PyTorch, Model training", "**Prompt Engineer**: AI tools expertly use करना — Growing demand", "**AI Trainer**: AI models को better बनाने के लिए feedback देना", "**Freelancing**: AI tools से content, images, code बनाकर बेचें"], diagram: "🔧 AI Learning Roadmap:\n\nBeginner (0-3 months):\n  → Learn Python basics\n  → Excel + SQL\n  → Statistics basics\n  → Use ChatGPT/Gemini daily\n\nIntermediate (3-9 months):\n  → Pandas, NumPy, Matplotlib\n  → Machine Learning concepts\n  → Scikit-learn projects\n  → Kaggle competitions\n\nAdvanced (9-18 months):\n  → Deep Learning (TensorFlow/PyTorch)\n  → NLP / Computer Vision\n  → Build real projects\n  → Contribute to open source\n\nFree Resources:\n  → Coursera, Khan Academy\n  → YouTube (Hindi channels)\n  → Google AI courses (free)" },
  ]),
  "Tally PGDCA कोर्स": makeLessons([
    { title: "Course Overview", titleHi: "पाठ्यक्रम", points: ["**PGDCA**: Post Graduate Diploma in Computer Applications — 1 Year (2 Semesters)", "**Semester 1**: Computer Fundamentals, C Programming, Office Automation, Data Structure", "**Semester 2**: DBMS (Database), Web Design (HTML/CSS/JS), Java/Python, Project Work", "**Eligibility**: Graduation (any stream) — Arts/Commerce/Science सब eligible", "**Career**: Data Entry, IT Support, Web Developer, Software Tester, Bank IT"], diagram: "📐 PGDCA Complete Syllabus:\n\nSemester 1:\n  1. Computer Fundamentals\n  2. Operating Systems (Windows/Linux)\n  3. C Programming Language\n  4. Office Automation (Word/Excel/PPT)\n  5. Data Structures\n\nSemester 2:\n  1. Database Management (SQL)\n  2. Web Technologies (HTML/CSS/JS)\n  3. Object Oriented Programming\n  4. Software Engineering\n  5. Project + Viva\n\nDuration: 1 Year\nFees: ₹5,000-25,000 (Govt/Pvt)" },
    { title: "C Programming", titleHi: "C प्रोग्रामिंग", points: ["**Basic Structure**: #include <stdio.h> → main() → { code here }", "**Variables**: int (पूर्णांक), float (दशमलव), char (अक्षर) — Data store करना", "**Input/Output**: scanf() (input लेना), printf() (output दिखाना)", "**Control**: if-else (शर्त), switch (multiple choice), for/while (loop/दोहराना)", "**Functions**: Code को छोटे reusable टुकड़ों में बांटना — modular programming", "**Arrays**: Same type के multiple values एक variable में — int marks[5];"], diagram: "📊 C Program Example:\n\n#include <stdio.h>\n\nint main() {\n    // Variable declare\n    int num1, num2, sum;\n    \n    // Input\n    printf(\"Enter two numbers: \");\n    scanf(\"%d %d\", &num1, &num2);\n    \n    // Process\n    sum = num1 + num2;\n    \n    // Output\n    printf(\"Sum = %d\", sum);\n    \n    return 0;\n}\n\nOutput: Enter two numbers: 5 3\n        Sum = 8" },
    { title: "Database & Web", titleHi: "डेटाबेस और वेब", points: ["**SQL Basics**: CREATE TABLE → INSERT data → SELECT (query) → UPDATE → DELETE", "**Joins**: Two tables connect करना — Inner Join, Left Join, Right Join", "**HTML**: Web page structure — <html> <head> <body> <h1> <p> <img> <a href>", "**CSS**: Design और styling — color, font-size, background, margin, padding, flexbox", "**JavaScript**: Interactive बनाना — onClick, form validation, dynamic content", "**Project**: Complete website बनाना — HTML structure + CSS design + JS logic + SQL backend"], diagram: "🔧 Web Development Stack:\n\n┌─────────────────────────┐\n│     Browser (User)      │\n├─────────────────────────┤\n│  HTML (Structure/Content)│\n│  CSS (Design/Layout)     │\n│  JavaScript (Interaction)│\n├─────────────────────────┤\n│  Server (Node/Python/PHP)│\n├─────────────────────────┤\n│  Database (MySQL/SQL)    │\n│  Tables → Rows → Columns │\n└─────────────────────────┘\n\nSQL Example:\nSELECT name, marks\nFROM students\nWHERE marks > 50\nORDER BY marks DESC;" },
  ]),
  "कोडिंग / प्रोग्रामिंग": makeLessons([
    { title: "Start Coding", titleHi: "कोडिंग शुरू करें", points: ["**Python** सबसे आसान भाषा: print(\"नमस्ते!\") ← पहला प्रोग्राम", "**Variable**: name = \"राम\" (text), age = 25 (number), price = 99.5 (decimal)", "**Condition**: if age >= 18: print(\"वोट दे सकते हैं\") else: print(\"अभी नहीं\")", "**Loop**: for i in range(5): print(i) → 0,1,2,3,4 प्रिंट होगा", "**Function**: def add(a, b): return a+b → add(3, 5) = 8", "**List**: fruits = [\"सेब\", \"केला\", \"आम\"] → fruits[0] = \"सेब\""], diagram: "📐 Programming Language Comparison:\n\nPython: Easy, AI/ML, Data Science\n  print(\"Hello\") → सबसे आसान\n\nJavaScript: Web Development (Frontend+Backend)\n  console.log(\"Hello\")\n\nJava: Android Apps, Enterprise\n  System.out.println(\"Hello\")\n\nC/C++: System Programming, Competitive\n  printf(\"Hello\")\n\nBeginner Path:\nPython → JavaScript → Choose specialization" },
    { title: "Web Development", titleHi: "वेब डेवलपमेंट", points: ["**Frontend**: HTML (structure) + CSS (design) + JavaScript (interaction) — User देखता है", "**Backend**: Server side logic — Node.js, Python (Django/Flask), PHP", "**Database**: Data store — MySQL, PostgreSQL, MongoDB", "**Framework**: React (Facebook), Angular (Google), Vue — Frontend faster बनाते हैं", "**API**: Frontend ↔ Backend communication — REST API (JSON data exchange)", "**Deployment**: GitHub → Vercel/Netlify (free hosting) → Custom Domain connect"], diagram: "📊 Full Stack Web Development Path:\n\nMonth 1-2: HTML + CSS\n  → Build 5 static websites\n  → Responsive Design (Mobile friendly)\n\nMonth 3-4: JavaScript\n  → DOM Manipulation\n  → Fetch API, Async/Await\n  → Build interactive pages\n\nMonth 5-6: React.js\n  → Components, State, Props\n  → Routing, API calls\n  → Build 2-3 projects\n\nMonth 7-8: Node.js + Database\n  → Express.js server\n  → MongoDB/PostgreSQL\n  → REST API build\n\nMonth 9-10: Full Stack Project\n  → Complete app (e.g., E-commerce)\n  → Deploy on cloud\n  → Build portfolio" },
    { title: "Mobile App Development", titleHi: "मोबाइल ऐप बनाना", points: ["**Android**: Kotlin (modern) / Java → Android Studio IDE", "**iOS**: Swift → Xcode (Mac required)", "**Cross-Platform**: Flutter (Dart) या React Native (JavaScript) → एक code, दोनों platforms", "**Flutter**: Google का framework — Beautiful UI, Fast development, Hot Reload", "**App Structure**: UI (Screens) + Logic (Functions) + Data (API/Database) + Navigation", "**Publish**: Google Play Console (₹1,700 one-time) / Apple Developer ($99/year)"], diagram: "🔧 Flutter App Development:\n\nSetup:\n  1. Install Flutter SDK\n  2. Install Android Studio\n  3. Create project: flutter create myapp\n\nBasics:\n  → Widget = UI building block\n  → Stateless = Static UI\n  → Stateful = Dynamic UI\n  → Material Design = Google style\n\nApp Structure:\nmain.dart\n  → MyApp (MaterialApp)\n    → HomePage (Scaffold)\n      → AppBar (top bar)\n      → Body (content)\n      → FloatingActionButton\n      → BottomNavigationBar\n\nLearn Path:\nDart basics (1 week)\n→ Flutter widgets (2 weeks)\n→ State Management (1 week)\n→ API/Database (2 weeks)\n→ First App (2 weeks)" },
  ]),
};

const agricultureLessons: Record<string, Lesson[]> = {
  "एडवांस खेती तकनीक": makeLessons([
    { title: "Modern Irrigation", titleHi: "आधुनिक सिंचाई", points: ["**ड्रिप इरिगेशन**: पौधे की जड़ में सीधा पानी — 90% पानी बचत, 30% ज्यादा उपज", "**स्प्रिंकलर**: बारिश जैसा छिड़काव — बड़े खेतों के लिए (गेहूं, दलहन)", "**Mulching**: प्लास्टिक शीट या सूखी घास बिछाएं — नमी बचाव + खरपतवार नियंत्रण", "**सोलर पंप**: बिजली बिल शून्य — PM-KUSUM Yojana से 60% subsidy", "**Rain Water Harvesting**: बारिश का पानी तालाब/टैंक में जमा करें — Dry season में काम आएगा"], diagram: "📐 Drip Irrigation System:\nWater Source (Bore/Tank)\n→ Pump\n→ Filter (Sand + Screen + Disc)\n→ Fertigation Unit (Venturi)\n→ Main Line (PVC/HDPE)\n→ Sub Main Line\n→ Lateral Lines (16mm LLDPE)\n→ Drippers (2-4 LPH)\n→ Plant Root Zone\n\nCost: ₹40,000-60,000/acre\nSubsidy: 55-80% (State varies)\nROI: 1-2 seasons" },
    { title: "Greenhouse Farming", titleHi: "पॉली हाउस / ग्रीनहाउस", points: ["**Structure**: GI Pipe frame + UV stabilized Polyethylene Film + Shade Net", "**Climate Control**: Temperature 20-30°C, Humidity 60-80% — Fan + Pad Cooling system", "**Crops**: Capsicum ₹60-100/kg, Cherry Tomato ₹80-120/kg, Cucumber, Gerbera flowers", "**Cost**: ₹800-1200/sqm (Naturally Ventilated) — Govt gives 50% subsidy (NHM scheme)", "**Income**: 3-5x more than open field — Year-round production possible", "**Hydroponics**: बिना मिट्टी, पानी + nutrients में उगाना — Premium produce"], diagram: "📊 Polyhouse Economics (1000 sqm):\n\nInvestment:\n  Structure: ₹10,00,000\n  Subsidy (50%): -₹5,00,000\n  Net Cost: ₹5,00,000\n\nAnnual Income (Capsicum):\n  Yield: 8000 kg/year\n  Rate: ₹60/kg average\n  Revenue: ₹4,80,000\n  Expenses: ₹1,50,000\n  Net Profit: ₹3,30,000\n\nPayback: 1.5-2 years\nLife of structure: 15-20 years" },
    { title: "Soil & Crop Management", titleHi: "मिट्टी और फसल प्रबंधन", points: ["**Soil pH**: 6.0-7.0 ideal — Below 6: चूना मिलाएं, Above 7: Gypsum/Sulphur", "**NPK**: N (Nitrogen)=पत्ती growth, P (Phosphorus)=जड़+फूल, K (Potassium)=फल+ताकत", "**Soil Health Card**: Government scheme — Free testing, KCC office में sample दें", "**Crop Rotation**: Cereal → Legume → Oilseed → Vegetable → Repeat (soil health maintain)", "**Intercropping**: 2 फसलें साथ में (e.g., Maize + Soybean) — Risk reduce, Income increase", "**Zero Budget Natural Farming**: No chemicals — Beejamrit, Jeevamrit, Mulch, Whapasa"], diagram: "🔧 Soil Testing & Treatment:\n\n1. Collect Soil Sample:\n   → 6-8 spots in field (zigzag)\n   → 15-20 cm depth\n   → Mix all, take 500g\n   → Send to Soil Testing Lab\n\n2. Results Guide:\n   pH < 6.0 → Add Lime (2-4 tons/ha)\n   pH > 7.5 → Add Gypsum (2-5 tons/ha)\n   Low N → Urea / Neem Cake\n   Low P → DAP / Rock Phosphate\n   Low K → MOP / Ash\n   Low Organic → FYM / Vermicompost\n\n3. Organic Matter:\n   → FYM: 10-12 tons/hectare\n   → Vermicompost: 2-3 tons/hectare\n   → Green Manure: Dhaincha/Sunhemp" },
  ]),
  "जैविक खेती": makeLessons([
    { title: "Organic Basics", titleHi: "जैविक खेती की शुरुआत", points: ["**Chemical Free**: कोई रासायनिक खाद, कीटनाशक, या Weedicide नहीं", "**जैविक खाद**: गोबर खाद, Vermicompost, Neem Cake, Bone Meal, Rock Phosphate", "**Certification**: 3 साल Conversion period → PGS-India (free) या NPOP (paid)", "**Premium Price**: Organic produce 20-50% ज्यादा दाम पर बिकता है", "**Market**: Organic stores, Online (Amazon, BigBasket), Direct to consumer, Export", "**Government Support**: Paramparagat Krishi Vikas Yojana — ₹50,000/ha/3 years"], diagram: "📐 Organic Farming Ecosystem:\n\nInput Sources:\n  Cow → Dung → FYM/Biogas\n       → Urine → Jeevamrit\n  \nSoil Enhancement:\n  Vermicompost → Nutrients\n  Green Manure → Nitrogen Fix\n  Mulch → Moisture + Weed control\n\nPest Management:\n  Neem → Natural pesticide\n  Pheromone Traps → Pest monitoring\n  Companion Plants → Repel insects\n  Beneficial Insects → Ladybug, Lacewing\n\nCycle: Zero Waste → Self-Sustainable" },
    { title: "Vermicompost Production", titleHi: "वर्मीकम्पोस्ट बनाना", points: ["**केंचुआ**: Eisenia Fetida (Red Wiggler) — सबसे अच्छी species for composting", "**Bed Setup**: ईंट/सीमेंट Tank (10×4×3 ft) या HDPE Vermi-bed", "**Layer**: गोबर + सूखी पत्तियां + Kitchen waste → नमी 60-70% maintain", "**2000 केंचुए** प्रति bed → 45-60 दिन में 400-500 kg खाद तैयार", "**Harvesting**: रोशनी डालें → केंचुए नीचे जाएंगे → ऊपर की खाद collect करें", "**Income**: ₹8-15/kg retail, ₹3,000-5,000 per bed/cycle profit"], diagram: "📊 Vermicompost Bed Setup:\n┌─────────────────────────────┐\n│     Cover (Shade Net/Jute)   │\n├─────────────────────────────┤\n│ Layer 4: Fresh Cow Dung      │\n│ Layer 3: Green/Kitchen Waste │\n│ Layer 2: Dry Leaves/Straw    │\n│ Layer 1: Cow Dung (base)     │\n│ ═══════ Earthworms ═════════ │\n│ Bottom: Sand/Gravel (drain)  │\n├─────────────────────────────┤\n│ Brick/Concrete Tank          │\n│ (Slope for drainage)         │\n└─────────────────────────────┘\n\nMaintain: Water every 2 days\nTemp: 20-30°C | Moisture: 60-70%" },
    { title: "Organic Pest Management", titleHi: "जैविक कीट प्रबंधन", points: ["**नीम Oil Spray**: 5ml Neem Oil + 1ml Liquid Soap + 1L Water → शाम को छिड़कें", "**Jeevamrit**: 200L water + 10kg Dung + 10L Urine + 2kg Jaggery + 2kg Flour → 48hrs ferment", "**Pheromone Traps**: 5-8 per acre — Male insects attract → Population control", "**Yellow Sticky Traps**: White flies, Aphids attract होते हैं — 20-25 per acre", "**Companion Planting**: Marigold (nematode repel), Basil (flies repel), Garlic (aphid repel)", "**Biological Control**: Trichogramma cards (₹50/acre) — Egg parasitoid for stem borer"], diagram: "🔧 Jeevamrit Recipe (Natural Fertilizer):\n\nIngredients (for 1 acre):\n• Water: 200 Liters\n• Fresh Cow Dung: 10 kg\n• Cow Urine: 10 Liters\n• Jaggery/Molasses: 2 kg\n• Flour (any): 2 kg\n• Handful of soil (under tree)\n\nPreparation:\n1. Mix all in drum\n2. Stir clockwise daily\n3. Keep covered (not sealed)\n4. Ready in 48 hours\n5. Filter and spray/drip\n6. Apply every 15 days\n\nBenefits:\n→ Microbe activation in soil\n→ Nutrient availability\n→ Disease resistance\n→ Better root growth\n→ Cost: Nearly ZERO!" },
  ]),
  "पशुपालन": makeLessons([
    { title: "Dairy Farming", titleHi: "डेयरी फार्मिंग", points: ["**देसी नस्ल**: Gir (10-15L), Sahiwal (8-12L), Tharparkar, Red Sindhi — A2 Milk, Hardy", "**विदेशी नस्ल**: HF (20-25L), Jersey (15-20L) — High milk, Need good management", "**चारा**: हरा चारा 25kg + सूखा 5kg + दाना 3-4kg + Mineral Mix 50g per day per cow", "**Shed Design**: 40 sqft per cow, Pucca floor with slope, Good ventilation, East-West facing", "**दूध दोहना**: 2 times daily, Clean udder, Strip cup test (Mastitis check), Machine milking", "**टीकाकरण**: FMD (Foot & Mouth), HS (Haemorrhagic Septicaemia), BQ (Black Quarter) — Annual"], diagram: "📐 Dairy Farm Business Plan (5 Cows):\n\nInvestment:\n  Cows (HF): 5 × ₹80,000 = ₹4,00,000\n  Shed: ₹2,00,000\n  Equipment: ₹50,000\n  Total: ₹6,50,000\n  Subsidy (NABARD 25%): -₹1,62,500\n  Net Investment: ₹4,87,500\n\nMonthly Income:\n  Milk: 5 × 15L × 30 days = 2250L\n  Rate: ₹50/L (average)\n  Revenue: ₹1,12,500\n  Expenses: ₹55,000\n  Profit: ₹57,500/month\n\nPayback: 8-10 months\n\nSubsidy: NABARD, State Dairy Dev Board" },
    { title: "Poultry Farming", titleHi: "मुर्गी पालन", points: ["**Broiler**: 42 दिन में तैयार — 2-2.5 kg weight, Quick return", "**Layer**: 20-22 weeks से अंडा शुरू — 280-300 eggs/year (commercial breed)", "**Shed**: 1 sqft per broiler bird, लंबाई East-West, हवादार, Curtain side walls", "**Feed**: Starter (0-2 weeks) → Grower (2-4 weeks) → Finisher (4-6 weeks)", "**Vaccination**: Marek's (Day 1), Ranikhet/Newcastle (Day 7, 21), IBD/Gumboro (Day 14)", "**Biosecurity**: Foot bath, Visitor restriction, Dead bird disposal, All-in All-out system"], diagram: "📊 Poultry Economics (500 Broiler Birds):\n\nInvestment (First batch):\n  Chicks: 500 × ₹40 = ₹20,000\n  Feed: ₹60,000 (6 weeks)\n  Medicine/Vaccine: ₹5,000\n  Electricity/Labor: ₹5,000\n  Total: ₹90,000\n\nIncome:\n  Birds sold: 450 × 2.2kg × ₹85/kg\n  = ₹84,150\n  + Litter sale: ₹3,000\n  Total: ₹87,150\n  \n  Note: First batch break-even\n  Profit from 2nd batch onwards\n  (Shed cost already covered)\n\n6 batches/year = ₹1.5-3L profit" },
    { title: "Goat & Fish Farming", titleHi: "बकरी और मछली पालन", points: ["**बकरी नस्ल**: Jamunapari (milk+meat), Sirohi (meat), Barbari (twins common), Beetal (milk)", "**बकरी Care**: चराई + दाना (200g/day) + Mineral mixture + Deworming every 3 months", "**बकरी Income**: Buck sale ₹15,000-30,000 (6 months), Doe ₹8,000-15,000", "**मछली पालन**: Composite fish culture — Catla + Rohu + Mrigal (surface+middle+bottom feeders)", "**तालाब**: 0.1 hectare (1000 sqm), 5-6 ft depth, Lime treatment before stocking", "**Fish Income**: 3000-5000 kg/hectare/year × ₹100-150/kg = Good profit"], diagram: "🔧 Integrated Fish-Poultry Model:\n\n┌─────────────────────────────┐\n│    Poultry Shed (above)      │\n│    500 birds on slatted floor │\n├─────────────────────────────┤\n│         Fish Pond             │\n│    (Droppings fall directly)  │\n│                               │\n│  Catla (surface) + Rohu (mid) │\n│  + Mrigal (bottom feeder)     │\n│                               │\n│  No separate fish feed needed!│\n│  Poultry waste = Fish food    │\n│                               │\n│  Water = Irrigation for crops │\n└─────────────────────────────┘\n\nIncome: Poultry + Fish + Crops\nCost: Reduced (shared resources)" },
  ]),
  "मशरूम और शहद उत्पादन": makeLessons([
    { title: "Mushroom Farming", titleHi: "मशरूम की खेती", points: ["**Types**: Oyster (सबसे आसान, ₹150-250/kg), Button (₹200-400/kg), Shiitake (Premium)", "**Room**: 10×10 ft, Dark, Humidity 80-90%, Temperature 20-28°C, Good ventilation", "**Substrate**: Wheat/Rice straw — उबालें (1.5 hr) → निचोड़ें (60% moisture) → Cool करें", "**Spawn**: ₹80-100/kg — Government labs (ICAR/University) से certified लें", "**Process**: PP bag + Substrate layer + Spawn layer → Repeat → Tie → Incubate 15-20 days", "**Harvest**: Pin heads → 3-4 days → Full mushroom → Twist and pluck → 3-4 flushes per bag"], diagram: "📐 Mushroom Growing Timeline:\n\nDay 1: Bag Filling\n  → Substrate + Spawn Layering\n  → Tie bags, make holes\n\nDay 1-20: Incubation (Dark room)\n  → White mycelium growth\n  → Temp: 25-28°C\n  → No water spray needed\n\nDay 20-25: Pinning Stage\n  → Cut bag openings\n  → Start water spraying\n  → Light exposure (indirect)\n  → Humidity: 85-90%\n\nDay 25-30: Harvest!\n  → Pick when edges start curling\n  → Early morning best\n  → Twist and pull gently\n\nDay 30-60: Flush 2, 3, 4\n  → Continue spraying\n  → Each flush every 7-10 days\n  → Yield decreases per flush" },
    { title: "Beekeeping (शहद)", titleHi: "मधुमक्खी पालन", points: ["**Box Type**: ISI Standard Langstroth box — 10 frame brood + Super", "**Colony**: ₹3,000-6,000/colony — Start with minimum 5 colonies", "**Location**: फूलों वाले पेड़ों के पास — Mustard, Sunflower, Litchi, Eucalyptus, Ajwain", "**Honey Flow Season**: Mustard (Dec-Feb), Litchi (Mar-Apr), Eucalyptus (Year round)", "**Management**: Weekly check — Queen present? Eggs? Disease? Honey frames full?", "**Income**: 1 colony = 20-40 kg/year × ₹300-500/kg = ₹6,000-20,000 per colony"], diagram: "📊 Bee Colony Management Calendar:\n\nNovember-February: Mustard Season\n  → Major Honey Flow\n  → Add Super boxes\n  → Extract honey\n  → Feed sugar if needed\n\nMarch-April: Litchi/Mango Flow\n  → Good honey production\n  → Swarm management\n  → Split strong colonies\n\nMay-June: Summer\n  → Provide water nearby\n  → Shade for hives\n  → Treat for Varroa mites\n\nJuly-September: Monsoon\n  → Low honey flow\n  → Feed sugar syrup (1:1)\n  → Disease monitoring\n\nOctober: Preparation\n  → Combine weak colonies\n  → New queens if needed\n  → Relocate near mustard fields" },
    { title: "Business & Marketing", titleHi: "बिज़नेस और मार्केटिंग", points: ["**Mushroom Drying**: Solar dryer या Electric dehydrator — Dried mushroom ₹600-1000/kg", "**Mushroom Pickle/Powder**: Value addition — Higher margins than fresh selling", "**Honey Bottling**: Glass/Food grade plastic → Label (Weight, Date, Batch) → FSSAI license", "**Brand Building**: Local brand बनाएं → Social media marketing → Direct to consumer", "**Government Help**: NABARD, KVIC (Khadi) loans for beekeeping, MIDH for mushroom", "**Export**: Organic certified → Export quality → ₹2-3x domestic price"], diagram: "🔧 Business Plan Summary:\n\nMushroom Unit (100 bags/batch):\n  Setup Cost: ₹30,000-50,000\n  Monthly Income: ₹15,000-25,000\n  → Fresh: Local market/restaurants\n  → Dried: Online/Wholesale\n  → Pickle: Value added product\n\nBeekeeping (10 colonies):\n  Setup Cost: ₹50,000-80,000\n  Annual Income: ₹1,00,000-2,00,000\n  → Raw Honey: Direct selling\n  → Wax: Cosmetic industry\n  → Pollen: Health food\n  → Colony Sale: ₹5,000-8,000 each\n\nFSSAI License: ₹100 (Petty)\nBrand Label: ₹2,000-5,000\nOnline Platform: Free (WhatsApp/Insta)" },
  ]),
};

/* ─── Knowledge Categories ─── */
const knowledgeLessons: Record<string, Lesson[]> = {
  "उत्तर भारत": makeLessons([
    { title: "States", titleHi: "राज्यों का परिचय", points: ["**उत्तर प्रदेश**: राजधानी लखनऊ, सबसे ज्यादा आबादी (24 करोड़), ताजमहल (आगरा), काशी विश्वनाथ (वाराणसी)", "**मध्य प्रदेश**: भारत का दिल, भोपाल (राजधानी), खजुराहो मंदिर (UNESCO), सांची स्तूप, बाघ अभयारण्य", "**राजस्थान**: सबसे बड़ा राज्य (क्षेत्रफल), जयपुर (Pink City), थार रेगिस्तान, राजपूत विरासत, हवा महल", "**बिहार**: पटना (राजधानी), नालंदा विश्वविद्यालय (दुनिया का पहला), बोधगया (बुद्ध ज्ञान प्राप्ति), छठ पूजा", "**उत्तराखंड**: देहरादून (राजधानी), चारधाम यात्रा (बद्रीनाथ, केदारनाथ), ऋषिकेश (योग नगरी), जिम कॉर्बेट पार्क"], diagram: "📐 North India Overview:\n┌────────────────────────────────┐\n│ Jammu & Kashmir ❄️ (Srinagar)  │\n│ Himachal Pradesh 🏔️ (Shimla)  │\n│ Punjab 🌾 (Chandigarh)         │\n│ Haryana 🏭 (Chandigarh)        │\n│ Uttarakhand 🙏 (Dehradun)     │\n│ UP 🕌 (Lucknow) - Most populated│\n│ MP 🐯 (Bhopal) - Heart of India│\n│ Rajasthan 🏰 (Jaipur) - Largest│\n│ Bihar 📚 (Patna) - Ancient seat│\n│ Jharkhand ⛏️ (Ranchi) - Minerals│\n│ Chhattisgarh 🌳 (Raipur) - Forest│\n│ Delhi 🏛️ - National Capital    │\n└────────────────────────────────┘" },
    { title: "Culture", titleHi: "संस्कृति और भाषाएं", points: ["**भाषाएं**: Hindi (UP, MP, Bihar, Rajasthan), Bhojpuri (Bihar/UP), Rajasthani, Maithili, Dogri", "**त्योहार**: होली (रंगों का), दीवाली (दीपों का), छठ पूजा (सूर्य, Bihar), तीज (Rajasthan), Baisakhi (Punjab)", "**खाना**: दाल-बाटी-चूरमा (Rajasthan), लिट्टी-चोखा (Bihar), पराठे (Punjab), चाट (UP)", "**नृत्य**: कत्थक (UP, Classical), घूमर (Rajasthan), भांगड़ा (Punjab), छऊ (Jharkhand/Bihar)", "**हस्तशिल्प**: चिकनकारी (Lucknow), ब्लॉक प्रिंट (Jaipur), मधुबनी (Bihar), फुलकारी (Punjab)"], diagram: "📊 Cultural Calendar:\nJanuary: Makar Sankranti, Lohri\nMarch: Holi 🎨\nApril: Baisakhi (Punjab Harvest)\nAugust: Raksha Bandhan, Teej\nSeptember: Ganesh Chaturthi\nOctober: Navratri, Dussehra\nNovember: Diwali 🪔, Chhath Puja\nDecember: Christmas\n\nWorld Heritage Sites (North):\n→ Taj Mahal (Agra)\n→ Qutub Minar (Delhi)\n→ Khajuraho (MP)\n→ Sanchi Stupa (MP)\n→ Red Fort (Delhi)\n→ Fatehpur Sikri (UP)" },
    { title: "Economy", titleHi: "अर्थव्यवस्था", points: ["**कृषि**: गेहूं (Punjab, Haryana, UP), गन्ना (UP — No.1), चावल (UP, Bihar)", "**उद्योग**: IT (Noida/Gurugram), Automobile (Chennai of North = Manesar), Textiles (Jaipur)", "**खनिज**: Coal (Jharkhand), Iron (Chhattisgarh), Mica (Bihar), Marble (Rajasthan)", "**Tourism**: Golden Triangle (Delhi-Agra-Jaipur), Varanasi, Amritsar, Rishikesh, Kashmir", "**GDP**: Maharashtra > Tamil Nadu > Gujarat > UP > Karnataka (Top 5 states)"], diagram: "🔧 North India Economy Snapshot:\n\nAgriculture Leaders:\n  Wheat: Punjab, Haryana\n  Sugarcane: UP (No.1 globally)\n  Rice: UP, Bihar\n  Pulses: MP (Daal Bowl)\n\nIndustrial Hubs:\n  NCR: IT, Automobile, Startup\n  Jaipur: Gems, Textiles, Tourism\n  Kanpur: Leather, Textiles\n  Ludhiana: Hosiery, Bicycle\n\nMajor Projects:\n  Delhi-Mumbai Expressway\n  Bullet Train (planning)\n  Smart City Mission\n  Digital India initiative" },
  ]),
  // More knowledge lessons abbreviated for space — same structure applies
};

// Generate placeholder knowledge lessons for other topics
const makeKnowledgeLessons = (topic: string): Lesson[] => makeLessons([
  { title: "Introduction", titleHi: "परिचय", points: [`**${topic}** का संपूर्ण ज्ञान यहां उपलब्ध है`, "विस्तृत अध्याय-वार जानकारी हिंदी में", "ऐतिहासिक तथ्य, आंकड़े, और विश्लेषण", "हर पहलू की गहन जानकारी नक्शों और चित्रों सहित"], diagram: `📐 ${topic}: विस्तृत अध्ययन सामग्री — बेसिक से एडवांस तक` },
  { title: "Details", titleHi: "विस्तृत जानकारी", points: ["प्रमुख तथ्य और आंकड़े", "ऐतिहासिक पृष्ठभूमि और विकास", "वर्तमान स्थिति और भविष्य की संभावनाएं", "महत्वपूर्ण व्यक्तित्व और उनका योगदान", "प्रमुख घटनाएं और उनका प्रभाव"], diagram: `📊 ${topic}: Timeline और Key Facts` },
  { title: "Analysis", titleHi: "विश्लेषण", points: ["तुलनात्मक अध्ययन", "सामाजिक और आर्थिक प्रभाव", "शिक्षा और करियर में उपयोगिता", "प्रतियोगी परीक्षाओं के लिए महत्वपूर्ण बिंदु", "सारांश और निष्कर्ष"], diagram: `🔧 ${topic}: Summary और Important Points` },
]);

/* ─── Category Definitions ─── */
const skillCategories = [
  { id: "electronics", icon: Wrench, title: "टेक्निकल रिपेयरिंग", subtitle: "Electronics & Devices", color: "from-blue-600 to-indigo-500",
    topics: Object.entries(electronicsLessons).map(([name, lessons]) => ({ name, desc: `${lessons.length} विस्तृत पाठ`, lessons })),
  },
  { id: "automobile", icon: Car, title: "ऑटोमोबाइल इंजीनियरिंग", subtitle: "Vehicles & Engines", color: "from-red-600 to-orange-500",
    topics: Object.entries(automobileLessons).map(([name, lessons]) => ({ name, desc: `${lessons.length} विस्तृत पाठ`, lessons })),
  },
  { id: "modern", icon: Scissors, title: "आधुनिक हुनर", subtitle: "Modern Skills", color: "from-pink-600 to-rose-500",
    topics: Object.entries(modernSkillsLessons).map(([name, lessons]) => ({ name, desc: `${lessons.length} विस्तृत पाठ`, lessons })),
  },
  { id: "medical", icon: Heart, title: "मेडिकल और हेल्थ", subtitle: "Health & Medicine", color: "from-emerald-600 to-green-500",
    topics: Object.entries(medicalLessons).map(([name, lessons]) => ({ name, desc: `${lessons.length} विस्तृत पाठ`, lessons })),
  },
  { id: "computer", icon: Monitor, title: "कंप्यूटर और IT", subtitle: "Computer & Technology", color: "from-violet-600 to-purple-500",
    topics: Object.entries(computerLessons).map(([name, lessons]) => ({ name, desc: `${lessons.length} विस्तृत पाठ`, lessons })),
  },
  { id: "agriculture", icon: Sprout, title: "आधुनिक कृषि", subtitle: "Agriculture & Farming", color: "from-lime-600 to-green-500",
    topics: Object.entries(agricultureLessons).map(([name, lessons]) => ({ name, desc: `${lessons.length} विस्तृत पाठ`, lessons })),
  },
];

const knowledgeCategories = [
  { id: "india", icon: Globe, title: "भारत का कोना-कोना", subtitle: "Indian States & Culture", color: "from-orange-600 to-amber-500",
    topics: [
      { name: "उत्तर भारत", desc: "UP, MP, Rajasthan, Bihar & more", lessons: knowledgeLessons["उत्तर भारत"] || makeKnowledgeLessons("उत्तर भारत") },
      { name: "दक्षिण भारत", desc: "Tamil Nadu, Kerala, Karnataka, Telangana", lessons: makeKnowledgeLessons("दक्षिण भारत") },
      { name: "पूर्वोत्तर भारत", desc: "Seven Sisters & Sikkim", lessons: makeKnowledgeLessons("पूर्वोत्तर भारत") },
      { name: "पश्चिम भारत", desc: "Gujarat, Maharashtra, Goa", lessons: makeKnowledgeLessons("पश्चिम भारत") },
      { name: "भारतीय भाषाएं", desc: "22 Official Languages & Scripts", lessons: makeKnowledgeLessons("भारतीय भाषाएं") },
    ],
  },
  { id: "world", icon: Globe, title: "विश्व इतिहास और भूगोल", subtitle: "World History & Geography", color: "from-teal-600 to-cyan-500",
    topics: [
      { name: "विश्व इतिहास", desc: "Ancient to Modern world history", lessons: makeKnowledgeLessons("विश्व इतिहास") },
      { name: "विश्व भूगोल", desc: "Continents, Countries, Capitals", lessons: makeKnowledgeLessons("विश्व भूगोल") },
      { name: "प्रथम PM / राष्ट्रपति", desc: "First leaders of every country", lessons: makeKnowledgeLessons("प्रथम PM / राष्ट्रपति") },
      { name: "विश्व युद्ध", desc: "WWI, WWII & Cold War", lessons: makeKnowledgeLessons("विश्व युद्ध") },
    ],
  },
  { id: "constitution", icon: BookOpen, title: "संविधान और कानून", subtitle: "Indian Constitution & Laws", color: "from-indigo-600 to-blue-500",
    topics: [
      { name: "भारतीय संविधान", desc: "Preamble, Articles, Amendments", lessons: makeKnowledgeLessons("भारतीय संविधान") },
      { name: "मौलिक अधिकार", desc: "Fundamental Rights (Art 12-35)", lessons: makeKnowledgeLessons("मौलिक अधिकार") },
      { name: "रोज़मर्रा के कानून", desc: "Consumer, Property, Labour Laws", lessons: makeKnowledgeLessons("रोज़मर्रा के कानून") },
      { name: "RTI और PIL", desc: "Right to Information, Public Interest", lessons: makeKnowledgeLessons("RTI और PIL") },
    ],
  },
  { id: "education", icon: Star, title: "शिक्षा और विज्ञान", subtitle: "Education, Science & GK", color: "from-yellow-600 to-orange-500",
    topics: [
      { name: "अर्थशास्त्र", desc: "Economics: GDP, Inflation, Budget", lessons: makeKnowledgeLessons("अर्थशास्त्र") },
      { name: "विज्ञान", desc: "Physics, Chemistry, Biology basics", lessons: makeKnowledgeLessons("विज्ञान") },
      { name: "सामान्य ज्ञान (GK)", desc: "Current Affairs & Static GK", lessons: makeKnowledgeLessons("सामान्य ज्ञान") },
      { name: "गणित", desc: "Arithmetic, Algebra, Geometry", lessons: makeKnowledgeLessons("गणित") },
    ],
  },
];

/* ══════════════════════════════════
   COMPONENTS
   ══════════════════════════════════ */

const LessonCard = ({ lesson, index }: { lesson: Lesson; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleListen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
      return;
    }
    const text = `${lesson.titleHi}। ${lesson.points.join("। ")}`;
    const utterance = speakHindi(text);
    if (utterance) {
      setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
    }
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card shadow-sm">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left p-3 flex items-center gap-3 hover:bg-accent/50 transition-colors">
        <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-foreground">{lesson.titleHi}</p>
          <p className="text-[10px] text-muted-foreground">{lesson.title}</p>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="px-3 pb-3 space-y-3">
          {/* Listen Button */}
          <Button onClick={handleListen} size="sm" variant={isSpeaking ? "destructive" : "secondary"} className="w-full gap-2 text-xs">
            {isSpeaking ? <><VolumeX className="h-3.5 w-3.5" /> बंद करें</> : <><Volume2 className="h-3.5 w-3.5" /> 🔊 सुनिए (Listen)</>}
          </Button>
          {/* Diagram */}
          <div className="bg-muted/50 border border-dashed border-border rounded-lg p-3 flex items-start gap-2">
            <Image className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <pre className="text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">{lesson.diagram}</pre>
          </div>
          {/* Points */}
          <ul className="space-y-2">
            {lesson.points.map((point, pi) => (
              <li key={pi} className="text-xs text-foreground leading-relaxed flex gap-2">
                <span className="text-primary mt-0.5 shrink-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: point.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>') }} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/* ─── Exam Dialog ─── */
const ExamDialog = ({ topicName, lessons, onClose }: { topicName: string; lessons: Lesson[]; onClose: () => void }) => {
  const [questions] = useState(() => generateExamQuestions(topicName, lessons));
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userName, setUserName] = useState("");

  const handleSubmit = () => {
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.options[q.correct]) s++;
    });
    setScore(s);
    setSubmitted(true);
  };

  const handleDownloadCert = () => {
    downloadCertificate({
      userName: userName || "Student",
      courseName: topicName,
      score,
      totalQuestions: questions.length,
      date: new Date().toLocaleDateString("hi-IN"),
    });
    toast({ title: "🎓 Certificate Downloaded!", description: "आपका Digital Certificate डाउनलोड हो गया।" });
  };

  const passed = score >= Math.ceil(questions.length * 0.6);

  if (questions.length === 0) {
    return (
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader><DialogTitle>परीक्षा उपलब्ध नहीं</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">इस विषय के लिए पर्याप्त प्रश्न उपलब्ध नहीं हैं। कृपया पहले सभी पाठ पढ़ें।</p>
        <DialogFooter><Button onClick={onClose}>बंद करें</Button></DialogFooter>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-base">
          <FileCheck className="h-5 w-5 text-primary" />
          {submitted ? (passed ? "🎉 बधाई! परीक्षा पास!" : "❌ पुनः प्रयास करें") : `📝 Final Exam: ${topicName}`}
        </DialogTitle>
      </DialogHeader>

      {!submitted ? (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">60% अंक पास होने के लिए ज़रूरी हैं। ({Math.ceil(questions.length * 0.6)}/{questions.length})</p>
          {questions.map((q, qi) => (
            <div key={qi} className="space-y-2 border-b border-border pb-3">
              <p className="text-xs font-bold text-foreground">प्रश्न {qi + 1}: {q.question}</p>
              <RadioGroup value={answers[qi] || ""} onValueChange={(v) => setAnswers(p => ({ ...p, [qi]: v }))}>
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <RadioGroupItem value={opt} id={`q${qi}o${oi}`} />
                    <Label htmlFor={`q${qi}o${oi}`} className="text-xs cursor-pointer">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ))}
          <Button onClick={handleSubmit} className="w-full gap-2" disabled={Object.keys(answers).length < questions.length}>
            <FileCheck className="h-4 w-4" /> Submit Exam
          </Button>
        </div>
      ) : (
        <div className="space-y-4 text-center">
          <div className={`text-4xl font-bold ${passed ? "text-green-600" : "text-red-500"}`}>
            {score}/{questions.length}
          </div>
          <p className="text-sm text-muted-foreground">
            {passed ? "बहुत बढ़िया! आपने परीक्षा पास कर ली। अपना Certificate डाउनलोड करें!" : "आपको 60% से ज्यादा अंक चाहिए। कृपया पाठ दोबारा पढ़ें और फिर से कोशिश करें।"}
          </p>
          {passed && (
            <div className="space-y-2">
              <Input
                placeholder="अपना नाम लिखें (Certificate के लिए)"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="text-center"
              />
              <Button onClick={handleDownloadCert} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Trophy className="h-4 w-4" /> 🎓 Certificate डाउनलोड करें
              </Button>
            </div>
          )}
          <Button onClick={onClose} variant="outline" className="w-full">बंद करें</Button>
        </div>
      )}
    </DialogContent>
  );
};

/* ══════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════ */
const SkillDevelopmentPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [businessIdea, setBusinessIdea] = useState("");
  const [examTopic, setExamTopic] = useState<{ name: string; lessons: Lesson[] } | null>(null);

  const allTopics = [
    ...skillCategories.flatMap((c) => c.topics.map((t) => ({ ...t, category: c.title }))),
    ...knowledgeCategories.flatMap((c) => c.topics.map((t) => ({ ...t, category: c.title }))),
  ];

  const filteredTopics = search.trim()
    ? allTopics.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.desc.toLowerCase().includes(search.toLowerCase()) ||
          t.category.toLowerCase().includes(search.toLowerCase())
      )
    : [];

  const handleSubmitIdea = () => {
    if (!businessIdea.trim()) return;
    toast({ title: "✅ आइडिया सबमिट हो गया!", description: "Admin approval के बाद आपको Digital Reward मिलेगा।" });
    setBusinessIdea("");
  };

  const selectedSkill = skillCategories.find((c) => c.id === selectedCategory);
  const selectedKnowledge = knowledgeCategories.find((c) => c.id === selectedCategory);
  const selected = selectedSkill || selectedKnowledge;

  /* ─── Category Detail View ─── */
  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        {/* Exam Dialog */}
        <Dialog open={!!examTopic} onOpenChange={(o) => !o && setExamTopic(null)}>
          {examTopic && <ExamDialog topicName={examTopic.name} lessons={examTopic.lessons} onClose={() => setExamTopic(null)} />}
        </Dialog>

        {/* Header */}
        <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
          <button onClick={() => { setSelectedCategory(null); setExpandedTopic(null); stopSpeaking(); }} className="flex items-center gap-2 text-sm mb-2 opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> वापस जाएं
          </button>
          <div className="flex items-center gap-3">
            <selected.icon className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold font-hindi">{selected.title}</h1>
              <p className="text-xs opacity-80">{selected.subtitle} — {selected.topics.length} Courses</p>
            </div>
          </div>
        </div>

        {/* Topics List */}
        <div className="container mx-auto px-4 py-4 space-y-3">
          {selected.topics.map((topic, i) => (
            <Card key={i} className="overflow-hidden border-border shadow-sm">
              <CardContent className="p-4">
                {/* Topic Header */}
                <button onClick={() => setExpandedTopic(expandedTopic === i ? null : i)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <BookMarked className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-bold font-hindi text-foreground text-sm">{topic.name}</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{topic.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="secondary" className="text-[9px]">📖 {topic.lessons.length} पाठ</Badge>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedTopic === i ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </button>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1.5 text-xs border-primary/30 text-primary"
                    onClick={() => setExamTopic({ name: topic.name, lessons: topic.lessons })}
                  >
                    <Award className="h-3.5 w-3.5" /> 📝 परीक्षा दें
                  </Button>
                </div>

                {/* Expanded Lessons */}
                {expandedTopic === i && topic.lessons.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" /> अध्याय (Chapters) — Step-by-Step Hindi Theory
                    </h4>
                    {topic.lessons.map((lesson, li) => (
                      <LessonCard key={li} lesson={lesson} index={li} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  /* ─── Main Dashboard ─── */
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <GraduationCap className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold font-hindi">कौशल विकास</h1>
              <p className="text-[10px] opacity-80">Digital Library — Theory, Diagrams, Exam & Certificate</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="खोजें... Mobile Repair, Tally, संविधान, Cooking..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/90 text-foreground border-0 h-10"
            />
          </div>
        </div>
      </div>

      {/* Search Results */}
      {search.trim() && (
        <div className="container mx-auto px-4 py-3 space-y-2">
          <p className="text-xs text-muted-foreground font-hindi">{filteredTopics.length} परिणाम मिले</p>
          {filteredTopics.map((t, i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm font-hindi text-foreground">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground">{t.category} • {t.lessons.length} पाठ</p>
                </div>
                <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setExamTopic({ name: t.name, lessons: t.lessons })}>
                  <Award className="h-3 w-3" /> Exam
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!search.trim() && (
        <div className="container mx-auto px-4 py-4 space-y-6">
          {/* Skills Section */}
          <div>
            <h2 className="text-base font-bold font-hindi text-foreground mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4 text-primary" /> कौशल प्रशिक्षण (Skill Courses)
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {skillCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="cursor-pointer border-border hover:shadow-md transition-all active:scale-[0.98]"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 shadow-sm`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xs font-hindi text-foreground leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.topics.length} Courses • Exam & Certificate</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Knowledge Section */}
          <div>
            <h2 className="text-base font-bold font-hindi text-foreground mb-3 flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" /> विश्व ज्ञान महासागर
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {knowledgeCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="cursor-pointer border-border hover:shadow-md transition-all active:scale-[0.98]"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 shadow-sm`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xs font-hindi text-foreground leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.topics.length} Topics • Exam & Certificate</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Business Ideas */}
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-hindi flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" /> नया बिज़नेस आइडिया दें
                <Badge className="text-[9px] bg-primary">🏆 Reward</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-[11px] text-muted-foreground font-hindi">
                अपना बिज़नेस आइडिया सबमिट करें। Approval पर Digital Reward मिलेगा!
              </p>
              <Textarea
                placeholder="अपना बिज़नेस आइडिया यहां लिखें..."
                value={businessIdea}
                onChange={(e) => setBusinessIdea(e.target.value)}
                className="text-sm min-h-[80px]"
              />
              <Button onClick={handleSubmitIdea} className="w-full gap-2" size="sm">
                <Send className="h-3.5 w-3.5" /> सबमिट करें
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SkillDevelopmentPage;
