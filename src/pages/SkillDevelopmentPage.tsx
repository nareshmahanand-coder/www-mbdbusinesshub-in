import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, GraduationCap, Wrench, Car, Scissors, Heart, Monitor, Sprout, Globe, BookOpen, Lightbulb, Play, ChevronRight, ChevronDown, ArrowLeft, Star, Award, Send, Image } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

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
  video: string;
  lessons: Lesson[];
}

const makeLessons = (steps: { title: string; titleHi: string; points: string[]; diagram: string }[]): Lesson[] =>
  steps.map((s, i) => ({ step: `Step ${i + 1}`, ...s }));

const electronicsLessons: Record<string, Lesson[]> = {
  "मोबाइल रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["स्क्रू ड्राइवर सेट, हीट गन, मल्टीमीटर जमा करें", "**ESD ब्रेसलेट** पहनें ताकि IC ना जले", "फोन का **मॉडल नंबर** नोट करें"], diagram: "📐 मोबाइल टूलकिट डायग्राम: स्क्रू ड्राइवर, Spudger, सक्शन कप, हीट गन" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**मल्टीमीटर** से बैटरी वोल्टेज चेक करें (3.7V-4.2V)", "**DC पावर सप्लाई** से शॉर्ट चेक करें", "स्क्रीन, टच, चार्जिंग पोर्ट एक-एक करके टेस्ट करें"], diagram: "📊 मदरबोर्ड ब्लॉक डायग्राम: CPU, RAM, Power IC, Charging IC, WiFi IC" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**हीट गन** (350°C) से खराब IC हटाएं", "**Reballing** करके नई IC लगाएं", "सोल्डरिंग के बाद **IPA** से बोर्ड साफ करें", "सब कनेक्टर जोड़कर टेस्ट करें"], diagram: "🔧 सोल्डरिंग प्रोसेस: फ्लक्स → हीट → IC Remove → Clean → New IC → Reflow" },
  ]),
  "लैपटॉप रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["लैपटॉप का मॉडल और **सर्विस मैनुअल** डाउनलोड करें", "बैटरी निकालें, **पावर बटन 10 सेकंड** दबाएं (discharge)", "स्क्रू को **लेबल** करके रखें"], diagram: "📐 लैपटॉप Disassembly: Bottom Cover → RAM → HDD → Keyboard → Motherboard" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**No Power**: चार्जर वोल्टेज चेक करें (19V)", "**No Display**: RAM निकालकर दोबारा लगाएं", "**Overheating**: Fan और Thermal Paste चेक करें"], diagram: "📊 लैपटॉप पावर फ्लो: Adapter → DC Jack → Charging IC → Battery → Power IC → CPU" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**Thermal Paste** बदलें (हर 2 साल)", "खराब **RAM/HDD** को रिप्लेस करें", "मदरबोर्ड पर **कैपेसिटर/MOSFET** चेंज करें"], diagram: "🔧 रिपेयर फ्लो: Diagnose → Open → Replace Part → Test → Assemble" },
  ]),
  "LED/LCD TV रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["TV का **बैक कवर** खोलें (screws निकालें)", "**3 मुख्य बोर्ड** पहचानें: Power Supply, Main Board, T-Con", "सभी **रिबन केबल** ध्यान से नोट करें"], diagram: "📐 TV Internal Layout: Power Board (Left) → Main Board (Center) → T-Con (Top)" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**No Power**: पावर बोर्ड पर फ्यूज़ और MOSFETs चेक करें", "**No Picture**: T-Con बोर्ड या LED Strips चेक करें", "**No Sound**: Main Board का ऑडियो सेक्शन चेक करें"], diagram: "📊 पावर सप्लाई डायग्राम: AC Input → Bridge Rectifier → SMPS → 12V/24V/5V Output" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["फूले हुए **कैपेसिटर** बदलें", "**LED Strip** खराब हो तो पूरी strip बदलें", "Main Board की **Firmware** अपडेट करें (USB से)"], diagram: "🔧 LED Strip Replacement: Remove Bezel → Diffuser → Optical Sheets → LED Strips" },
  ]),
  "AC रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**मैनिफोल्ड गेज**, वैक्यूम पंप, गैस सिलेंडर तैयार करें", "AC का **BTU रेटिंग** और गैस टाइप (R32/R410a) नोट करें", "**बिजली बंद** करके काम शुरू करें"], diagram: "📐 AC System: Compressor → Condenser → Expansion Valve → Evaporator → Compressor" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**कूलिंग नहीं**: गैस प्रेशर चेक करें (60-70 PSI for R32)", "**पानी टपकना**: ड्रेन पाइप ब्लॉक है, साफ करें", "**कंप्रेसर चालू नहीं**: कैपेसिटर और रिले चेक करें"], diagram: "📊 Pressure Chart: Low Side (60-70 PSI) | High Side (250-300 PSI) for R32" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**गैस चार्जिंग**: वैक्यूम करें → गैस भरें → लीक चेक करें", "**PCB रिपेयर**: सेंसर, रिले, MOSFET बदलें", "**सर्विसिंग**: फिल्टर धोएं, कॉइल साफ करें"], diagram: "🔧 Gas Charging: Vacuum (30 min) → Connect Cylinder → Fill Gas → Check Pressure" },
  ]),
  "फ्रिज रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["फ्रिज का मॉडल और **कंप्रेसर रेटिंग** नोट करें", "**गैस टाइप** (R134a/R600a) पहचानें", "Piercing Valve और Manifold Gauge तैयार करें"], diagram: "📐 Fridge Cycle: Compressor → Condenser (Back Coils) → Capillary → Evaporator → Compressor" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**ठंडा नहीं**: कंप्रेसर चल रहा है? गैस कम है?", "**ज्यादा ठंडा**: Thermostat खराब है, बदलें", "**आवाज़ आना**: कंप्रेसर माउंटिंग या फैन चेक करें"], diagram: "📊 Diagnostic: Compressor Running + Not Cold = Gas Leak | Not Running = Relay/OLP Issue" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**लीक** ढूंढें: सोप टेस्ट या नाइट्रोजन प्रेशर टेस्ट", "लीक जगह **ब्रेज़िंग** (welding) करें", "वैक्यूम करके **सही मात्रा** में गैस भरें"], diagram: "🔧 Flow: Find Leak → Brazing → Vacuum → Gas Charge → Seal → Test Cooling" },
  ]),
  "वॉशिंग मशीन रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["मशीन टाइप पहचानें: **Semi-Auto / Fully-Auto / Front Load**", "पानी बंद करें, बिजली हटाएं", "**Error Code** नोट करें (Fully Auto में)"], diagram: "📐 Parts: Motor → Belt → Drum → Pump → PCB → Inlet Valve → Drain Valve" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**धुलाई नहीं**: मोटर कैपेसिटर या बेल्ट चेक करें", "**पानी नहीं भरता**: Inlet Valve या वॉटर लेवल सेंसर चेक करें", "**Spin नहीं करती**: लिड स्विच या क्लच चेक करें"], diagram: "📊 Error Guide: E1=Water Issue | E2=Drain Issue | E3=Motor Issue | E4=Sensor" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**बेल्ट** ढीली हो तो बदलें", "**PCB** पर जले हुए रिले/ट्रायक बदलें", "**बेयरिंग** से आवाज़ आए तो Drum खोलकर बदलें"], diagram: "🔧 PCB Repair: Check Relay → Triac → Capacitor → Transformer → Replace Faulty Part" },
  ]),
  "कैमरा और CCTV": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**कैमरा टाइप** चुनें: Bullet, Dome, PTZ, IP Camera", "**DVR/NVR** की चैनल कैपेसिटी नोट करें", "केबलिंग प्लान बनाएं: **कहां-कहां कैमरा लगेगा**"], diagram: "📐 CCTV Setup: Camera → Coaxial/Ethernet Cable → DVR/NVR → Monitor → Power Supply" },
    { title: "Installation", titleHi: "इंस्टॉलेशन", points: ["कैमरे को **ऊंचाई पर** (8-10 फीट) फिक्स करें", "केबल को **PVC पाइप** में सुरक्षित रखें", "DVR को **सूखी और हवादार** जगह रखें"], diagram: "📊 Cable Types: Coaxial (3+1) for Analog | Cat6 for IP Camera | Power Cable (DC 12V)" },
    { title: "Troubleshooting", titleHi: "समस्या निवारण", points: ["**No Picture**: केबल कनेक्शन और पावर चेक करें", "**Blur Image**: लेंस साफ करें, फोकस एडजस्ट करें", "**Recording नहीं**: HDD चेक करें, फॉर्मेट करें"], diagram: "🔧 Fix: No Signal → Check BNC/RJ45 → Check Power → Replace Cable → Check DVR Port" },
  ]),
  "पंखा / कूलर रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["पंखे का **टाइप** पहचानें: Ceiling, Table, Exhaust, Cooler", "**वाइंडिंग डेटा** नोट करें: SWG, Turns", "मल्टीमीटर, सोल्डरिंग आयरन तैयार करें"], diagram: "📐 Motor Parts: Stator → Rotor → Bearings → Capacitor → Regulator → Blades" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**नहीं चलता**: कैपेसिटर चेक करें (2.5µF for ceiling fan)", "**धीमा चलता**: बेयरिंग या वाइंडिंग weak है", "**आवाज़ आती है**: बेयरिंग में तेल डालें या बदलें"], diagram: "📊 Capacitor Test: Multimeter → Capacitance Mode → 2.5µF ± 10% = OK | 0 = Replace" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**Rewinding**: पुरानी coil निकालें → नई copper wire लपेटें", "**SWG 36** wire, **1400-1800 turns** (ceiling fan)", "वार्निश लगाएं → सुखाएं → असेंबल करें → टेस्ट करें"], diagram: "🔧 Winding Pattern: Start → Slot 1 → Skip 2 → Slot 4 → Continue → End → Connect Capacitor" },
  ]),
};

const automobileLessons: Record<string, Lesson[]> = {
  "बाइक / स्कूटर रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["बाइक का **सर्विस मैनुअल** पढ़ें", "टूलकिट: **रिंग स्पैनर, प्लग रेंच, फीलर गेज** तैयार करें", "इंजन ठंडा होने दें"], diagram: "📐 Engine Layout: Cylinder → Piston → Crankshaft → Gearbox → Clutch → Chain → Wheel" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**स्टार्ट नहीं**: स्पार्क प्लग, फ्यूल, बैटरी चेक करें", "**पिकअप कम**: एयर फिल्टर, कार्बोरेटर जेट साफ करें", "**ऑइल लीक**: गैसकेट और सील चेक करें"], diagram: "📊 Ignition System: Battery → CDI → Ignition Coil → Spark Plug → Combustion" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**रिंग-पिस्टन** बदलें: सिलेंडर हेड खोलें → पुराना निकालें → नया फिट करें", "**क्लच प्लेट** बदलें: 5 प्लेट्स + 5 फ्रिक्शन प्लेट्स", "**चेन-स्प्रोकेट** सेट बदलें: 15,000 km पर"], diagram: "🔧 Engine Overhaul: Drain Oil → Remove Head → Piston Out → New Rings → Assemble → Oil Fill" },
  ]),
  "कार मैकेनिक": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["कार को **जैक** पर उठाएं, **एक्सल स्टैंड** लगाएं", "**OBD2 स्कैनर** से Error Code पढ़ें", "इंजन ऑइल, कूलेंट लेवल चेक करें"], diagram: "📐 Car Systems: Engine → Transmission → Suspension → Brakes → Electrical → AC" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**Check Engine Light**: OBD2 से P-code पढ़ें", "**ब्रेक**: पैड thickness चेक करें (min 3mm)", "**सस्पेंशन**: शॉकर से ऑइल लीक चेक करें"], diagram: "📊 OBD Codes: P0300=Misfire | P0171=Lean | P0420=Catalytic | P0507=Idle High" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**ऑइल चेंज**: Drain → New Filter → Fill 4L → Check Level", "**ब्रेक पैड**: Caliper खोलें → पुराना पैड निकालें → नया लगाएं", "**Timing Belt**: हर 60,000 km पर बदलें"], diagram: "🔧 Service Schedule: 5000km=Oil | 20000km=Filters | 40000km=Plugs | 60000km=Belt" },
  ]),
  "डीजल इंजन": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["इंजन टाइप पहचानें: **इनलाइन, V-Type**", "**FIP (Fuel Injection Pump)** का मॉडल नोट करें", "कंप्रेशन प्रेशर गेज तैयार करें"], diagram: "📐 Diesel Cycle: Air Intake → Compression (22:1) → Fuel Injection → Power → Exhaust" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**सफेद धुआं**: हेड गैसकेट लीक या कूलेंट जल रहा है", "**काला धुआं**: इंजेक्टर खराब या एयर फिल्टर बंद", "**स्टार्ट नहीं**: FIP, Injector, Glow Plug चेक करें"], diagram: "📊 Smoke Diagnosis: White=Coolant | Black=Rich Fuel | Blue=Oil Burning" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**इंजेक्टर** ओवरहॉल: खोलें → नोजल साफ करें → प्रेशर सेट करें (175 bar)", "**FIP** कैलिब्रेशन: डिलीवरी वॉल्व सेट करें", "**हेड गैसकेट** बदलें: टॉर्क रेंच से कसें"], diagram: "🔧 Injector Service: Remove → Disassemble → Clean Nozzle → Set Pressure → Refit" },
  ]),
  "ऑटो इलेक्ट्रिकल": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**वायरिंग डायग्राम** पढ़ना सीखें", "मल्टीमीटर, टेस्ट लैंप, Oscilloscope तैयार करें", "बैटरी डिस्कनेक्ट करें (-ve पहले)"], diagram: "📐 Auto Electrical: Battery → Starter → Alternator → Fuse Box → Lights/Sensors/ECU" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**बैटरी**: Voltage चेक करें (12.6V = Full, <12V = Weak)", "**Alternator**: इंजन चालू पर 13.5V-14.5V आना चाहिए", "**Starter Motor**: क्लिक हो पर न घूमे = कार्बन ब्रश खत्म"], diagram: "📊 Charging System: Engine → Alternator → Rectifier → 14V → Battery Charge" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**Alternator Rebuild**: ब्रश, बेयरिंग, रेगुलेटर बदलें", "**Starter**: सोलेनॉइड कॉन्टैक्ट्स साफ/बदलें", "**वायरिंग**: जले तार बदलें, कनेक्टर सील करें"], diagram: "🔧 Alternator Rebuild: Remove → Open → New Bearings → New Brushes → Assemble → Test" },
  ]),
  "पेंटिंग और डेंटिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["डेंट की **गहराई** और एरिया मापें", "**सैंडपेपर** (80, 150, 400, 800 grit) तैयार करें", "**मास्किंग टेप** से बाकी हिस्सा ढकें"], diagram: "📐 Paint Layers: Metal → Primer → Base Coat → Color Coat → Clear Coat" },
    { title: "Denting Process", titleHi: "डेंटिंग प्रक्रिया", points: ["**PDR (Paintless Dent Repair)**: छोटे डेंट के लिए", "बड़े डेंट: **बॉडी फिलर** (Putty) लगाएं → सैंड करें", "**प्राइमर** लगाएं → सूखने दें → सैंड करें"], diagram: "🔧 Dent Fix: Push/Pull → Filler → Sand 80→150→400 → Primer → Sand 800 → Paint" },
    { title: "Painting", titleHi: "पेंटिंग", points: ["**स्प्रे गन** सेटिंग: 2-3 bar प्रेशर", "**2-3 कोट** लगाएं, हर कोट में 10 मिनट gap", "**क्लियर कोट** लगाएं → 24 घंटे सुखाएं → **पॉलिश** करें"], diagram: "📐 Spray Pattern: 50% overlap → Left to Right → Top to Bottom → Even coats" },
  ]),
  "EV रिपेयरिंग": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**EV Safety**: इंसुलेटेड ग्लव्स (1000V rated) पहनें", "**HV Battery** डिस्कनेक्ट करें (Service Plug)", "BMS (Battery Management System) समझें"], diagram: "📐 EV System: Battery Pack → BMS → Inverter → Motor → Controller → Charger" },
    { title: "Fault Finding", titleHi: "खराबी ढूंढना", points: ["**Range कम**: सेल बैलेंसिंग चेक करें", "**चार्ज नहीं**: चार्जर, OBC, चार्जिंग पोर्ट चेक करें", "**Motor noise**: बेयरिंग या Controller चेक करें"], diagram: "📊 Battery: 48V/60V/72V Pack → Series Cells → BMS monitors each cell voltage" },
    { title: "Repairing", titleHi: "ठीक करने की प्रक्रिया", points: ["**Cell Replacement**: खराब सेल ढूंढें → Spot Weld से बदलें", "**Controller**: MOSFET और कैपेसिटर चेक/बदलें", "**Motor**: ब्रश/बेयरिंग बदलें, BLDC में Hall Sensor चेक करें"], diagram: "🔧 Cell Replace: Open Pack → Measure Each Cell → Remove Bad → Spot Weld New → Balance" },
  ]),
};

const modernSkillsLessons: Record<string, Lesson[]> = {
  "टेलरिंग / सिलाई": makeLessons([
    { title: "Preparation", titleHi: "तैयारी", points: ["**सिलाई मशीन** सेट करें: बॉबिन भरें, सुई लगाएं", "**मापने के उपकरण**: इंच टेप, रूलर, चॉक", "कपड़े का **टाइप** पहचानें: Cotton, Silk, Polyester"], diagram: "📐 Body Measurement: Chest → Waist → Hip → Shoulder → Sleeve → Length" },
    { title: "Cutting", titleHi: "कटिंग", points: ["**पैटर्न** बनाएं: कागज पर माप के अनुसार", "कपड़े को **फोल्ड** करें (दोनों तरफ बराबर कटे)", "**सीम अलाउंस** (0.5-1 इंच) छोड़ें"], diagram: "📊 Pattern Layout: Fold Line → Place Pattern → Pin → Mark Chalk → Cut with Seam Allowance" },
    { title: "Stitching", titleHi: "सिलाई", points: ["**लॉक स्टिच** से शुरू करें (3 बार आगे-पीछे)", "**सीधी सिलाई** करें: Guide Foot का इस्तेमाल करें", "**बटनहोल**, ज़िप, हेम फिनिशिंग करें", "**प्रेस** (इस्त्री) करके फाइनल शेप दें"], diagram: "🔧 Stitch Types: Straight → Zigzag → Overlock → Buttonhole → Hemming" },
  ]),
  "ब्यूटी पार्लर कोर्स": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**स्किन टाइप** पहचानें: Oily, Dry, Combination, Sensitive", "**हाइजीन**: टूल्स को Autoclave/UV Sterilize करें", "प्रोडक्ट्स का **एक्सपायरी** चेक करें"], diagram: "📐 Skin Layers: Epidermis → Dermis → Subcutaneous → Muscle" },
    { title: "Facial Steps", titleHi: "फेशियल के स्टेप्स", points: ["**क्लींजिंग** → **स्क्रबिंग** → **स्टीमिंग** (5 min)", "**मसाज** (10-15 min): ऊपर की ओर circular motion", "**पैक** लगाएं → 15 min → धोएं → **टोनर** → **मॉइस्चराइज़र**"], diagram: "📊 Facial Flow: Cleanse → Scrub → Steam → Massage → Pack → Tone → Moisturize" },
    { title: "Bridal Makeup", titleHi: "ब्राइडल मेकअप", points: ["**प्राइमर** → **फाउंडेशन** (शेड मैच करें)", "**कंसीलर** → **पाउडर** सेट करें", "**आई मेकअप**: Eyeshadow, Liner, Lashes", "**लिप्स** + **हाइलाइटर** + **सेटिंग स्प्रे**"], diagram: "🔧 Makeup Order: Primer → Foundation → Concealer → Powder → Eyes → Lips → Setting Spray" },
  ]),
  "कुकिंग / बेकिंग": makeLessons([
    { title: "Kitchen Setup", titleHi: "किचन तैयारी", points: ["**बर्तन**: कड़ाही, तवा, प्रेशर कुकर, बेकिंग ट्रे", "**मसाले**: हल्दी, मिर्च, धनिया, जीरा, गरम मसाला", "**हाइजीन**: हाथ धोएं, एप्रन पहनें, किचन साफ रखें"], diagram: "📐 Kitchen Layout: Prep Area → Cooking Zone → Plating Area → Cleaning Station" },
    { title: "Cooking Basics", titleHi: "खाना बनाने की बेसिक्स", points: ["**तड़का**: तेल गर्म करें → जीरा → प्याज → टमाटर → मसाले", "**रोटी**: आटा गूंधें → 20 min रखें → बेलें → सेकें → फुलाएं", "**चावल**: 1:2 ratio (चावल:पानी), 15 min पकाएं"], diagram: "📊 Tempering: Oil Hot → Cumin → Mustard → Curry Leaves → Onion → Tomato → Spices" },
    { title: "Baking Basics", titleHi: "बेकिंग बेसिक्स", points: ["**ओवन** प्रीहीट करें (180°C, 10 min पहले)", "**केक**: मैदा + बेकिंग पाउडर + अंडे + चीनी + बटर मिक्स करें", "**कुकीज़**: Dough बनाएं → Shape दें → 12-15 min बेक करें"], diagram: "🔧 Cake Formula: Flour 200g + Sugar 150g + Butter 100g + Eggs 3 + Baking Powder 1tsp" },
  ]),
  "ड्राइविंग नियम": makeLessons([
    { title: "Traffic Signs", titleHi: "ट्रैफिक चिन्ह", points: ["**लाल गोला**: रुकें / मना है", "**नीला गोला**: अनिवार्य (Mandatory)", "**त्रिकोण**: सावधानी / खतरा", "**हरी बत्ती**: जाएं, **पीली**: तैयार रहें, **लाल**: रुकें"], diagram: "📐 Signal: Red=Stop | Yellow=Ready | Green=Go | Arrow=Turn direction only" },
    { title: "License Process", titleHi: "लाइसेंस प्रक्रिया", points: ["**Learning License**: Parivahan.gov.in → Apply → Documents → Test → LL", "**30 दिन** बाद Driving License के लिए Apply करें", "**ज़रूरी दस्तावेज़**: आधार, पैन, Address Proof, Photo, Medical"], diagram: "📊 Process: Apply Online → Documents Upload → Slot Book → Driving Test → DL Issued" },
    { title: "Safe Driving", titleHi: "सुरक्षित ड्राइविंग", points: ["**सीट बेल्ट** ज़रूरी (₹1000 जुर्माना)", "**हेलमेट** ज़रूरी (₹1000 जुर्माना)", "**शराब पीकर गाड़ी**: ₹10,000 जुर्माना + जेल", "**Speed Limit**: शहर 50 km/h, हाईवे 100 km/h"], diagram: "🔧 Fines: No Seatbelt ₹1000 | No Helmet ₹1000 | Drunk ₹10000 | Overspeeding ₹2000" },
  ]),
  "प्लम्बिंग कोर्स": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["पाइप टाइप: **PVC, CPVC, GI, PPR**", "फिटिंग्स: **Elbow, Tee, Coupling, Valve, Reducer**", "टूल्स: **Pipe Cutter, Wrench, Teflon Tape, Solvent Cement**"], diagram: "📐 Pipe Types: PVC (Cold Water) → CPVC (Hot Water) → PPR (Premium) → GI (Heavy Duty)" },
    { title: "Installation", titleHi: "इंस्टॉलेशन", points: ["**सप्लाई लाइन**: Tank → Main Valve → Distribution → Taps", "**ड्रेनेज**: Sink → Trap → Drain Pipe → Main Sewer", "**Slope**: ड्रेन पाइप में 1-2% slope रखें"], diagram: "📊 Water Supply: Overhead Tank → Distribution Pipe → Branch Lines → Taps/Fixtures" },
    { title: "Repairing", titleHi: "रिपेयरिंग", points: ["**लीकेज**: जोड़ पर Teflon Tape लगाएं या Coupling बदलें", "**ब्लॉक**: Plunger या Snake Wire इस्तेमाल करें", "**गीज़र कनेक्शन**: Cold in (नीला) → Geyser → Hot out (लाल)"], diagram: "🔧 Leak Fix: Close Main → Cut Bad Section → Clean → Apply Solvent → Join → Wait 2hr" },
  ]),
  "इलेक्ट्रीशियन कोर्स": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**V = I × R** (Ohm's Law)", "**Phase (लाल)**, **Neutral (काला)**, **Earth (हरा)**", "**MCB/RCCB** का काम: ओवरलोड और शॉर्ट सर्किट से सुरक्षा"], diagram: "📐 House Wiring: Meter → MCB → RCCB → Distribution Board → Room Circuits" },
    { title: "House Wiring", titleHi: "हाउस वायरिंग", points: ["**PVC Conduit** में wire डालें", "**15A सर्किट**: AC, Geyser, Heater के लिए", "**5A सर्किट**: Light, Fan, Charging के लिए", "हर रूम में **2-3 सर्किट** बनाएं"], diagram: "📊 Load Calculation: Light 60W + Fan 75W + AC 1500W + Geyser 2000W = Total Load" },
    { title: "Safety & Testing", titleHi: "सुरक्षा और टेस्टिंग", points: ["**काम से पहले** MCB बंद करें, Tester से चेक करें", "**Earthing**: GI Pipe + Coal + Salt + Water method", "**Megger** से Insulation Resistance चेक करें (>1 MΩ)"], diagram: "🔧 Earthing: Dig 8ft → GI Pipe → Coal+Salt layers → GI Wire → Connect to DB Earth Bar" },
  ]),
};

const medicalLessons: Record<string, Lesson[]> = {
  "नर्सिंग कोर्स": makeLessons([
    { title: "Patient Care", titleHi: "मरीज़ की देखभाल", points: ["**Vitals** चेक करें: BP, Pulse, Temperature, SpO2", "**Normal BP**: 120/80 mmHg, **Pulse**: 60-100/min", "**बेड मेकिंग** और मरीज़ की **पोज़ीशनिंग** सीखें"], diagram: "📐 Vital Signs: BP (120/80) | Pulse (60-100) | Temp (98.6°F) | SpO2 (95-100%)" },
    { title: "Injection & IV", titleHi: "इंजेक्शन और IV", points: ["**IM (Intramuscular)**: जांघ या कूल्हे में, 90° angle", "**SC (Subcutaneous)**: पेट या बांह में, 45° angle", "**IV Line**: Cannula लगाना, Drip सेट करना, Flow Rate"], diagram: "📊 Injection Angles: IV=15° | SC=45° | IM=90° | ID=10-15° (Intradermal)" },
    { title: "First Aid", titleHi: "प्राथमिक चिकित्सा", points: ["**CPR**: 30 Chest Compressions + 2 Breaths (100-120/min)", "**Bleeding**: सीधा दबाव लगाएं, ऊपर उठाएं", "**Burns**: ठंडे पानी में 10-20 min, बर्फ नहीं लगाएं", "**Fracture**: हिलने न दें, Splint लगाएं"], diagram: "🔧 CPR Steps: Check Response → Call 108 → 30 Compressions → 2 Breaths → Repeat" },
  ]),
  "होम्योपैथिक दवाएं": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**सिद्धांत**: 'Like Cures Like' (समान से समान)", "**Potency**: 6C, 30C, 200C, 1M (higher = stronger)", "**दवा लेने के नियम**: खाली पेट, 15 min पहले/बाद कुछ न खाएं"], diagram: "📐 Potency Scale: Mother Tincture → 6C → 30C → 200C → 1M → 10M → CM" },
    { title: "Common Medicines", titleHi: "आम दवाइयां", points: ["**Arnica**: चोट, सूजन, मांसपेशी दर्द", "**Nux Vomica**: पेट खराब, गैस, कब्ज", "**Belladonna**: बुखार, गले में दर्द, सिरदर्द", "**Rhus Tox**: जोड़ों का दर्द, स्टिफनेस"], diagram: "📊 Quick Reference: Fever=Belladonna | Injury=Arnica | Digestion=Nux Vom | Joints=Rhus Tox" },
    { title: "Usage Guide", titleHi: "उपयोग गाइड", points: ["**30C**: सामान्य बीमारियों के लिए, दिन में 3 बार", "**200C**: तीव्र (Acute) बीमारी में, 1 dose", "**चीनी की गोलियों** पर 2-3 बूंद डालकर खाएं"], diagram: "🔧 Dosage: Acute=200C single dose | Chronic=30C thrice daily | Prevention=200C weekly" },
  ]),
  "एलोपैथिक ज्ञान": makeLessons([
    { title: "Medicine Categories", titleHi: "दवाओं के प्रकार", points: ["**Analgesic**: दर्द निवारक (Paracetamol, Ibuprofen)", "**Antibiotic**: बैक्टीरिया संक्रमण (Amoxicillin, Azithromycin)", "**Antacid**: एसिडिटी (Pantoprazole, Ranitidine)", "**कभी भी** बिना डॉक्टर की सलाह एंटीबायोटिक न लें"], diagram: "📐 Drug Forms: Tablet → Capsule → Syrup → Injection → Ointment → Drops" },
    { title: "Common Treatments", titleHi: "आम इलाज", points: ["**बुखार**: Paracetamol 500mg, हर 6 घंटे (max 4/day)", "**एसिडिटी**: Pantoprazole 40mg, सुबह खाली पेट", "**एलर्जी**: Cetirizine 10mg, रात को सोते समय"], diagram: "📊 When to see Doctor: Fever>3 days | Blood in stool | Chest pain | Difficulty breathing" },
    { title: "Safety", titleHi: "सुरक्षा", points: ["**Expiry Date** हमेशा चेक करें", "**Side Effects** जानें: एलर्जी, चक्कर, पेट खराब", "**Drug Interaction**: दो दवाइयां साथ लेने से पहले डॉक्टर से पूछें", "**Antibiotic Course** पूरा करें, बीच में न छोड़ें"], diagram: "🔧 Storage: Cool & Dry place | Away from Sunlight | Out of children's reach" },
  ]),
  "आयुर्वेदिक चिकित्सा": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**त्रिदोष**: वात, पित्त, कफ - शरीर की 3 ऊर्जाएं", "**वात**: हवा + आकाश (दर्द, गैस)", "**पित्त**: अग्नि + जल (एसिडिटी, जलन)", "**कफ**: जल + पृथ्वी (सर्दी, मोटापा)"], diagram: "📐 Tridosha: Vata (Air+Space) | Pitta (Fire+Water) | Kapha (Water+Earth)" },
    { title: "Home Remedies", titleHi: "घरेलू नुस्खे", points: ["**सर्दी-खांसी**: अदरक + शहद + तुलसी का काढ़ा", "**पेट दर्द**: अजवाइन + काला नमक + गर्म पानी", "**गले में दर्द**: हल्दी + नमक + गर्म पानी से गरारे", "**अनिद्रा**: गर्म दूध + हल्दी + अश्वगंधा"], diagram: "📊 Kadha Recipe: Water 2cup + Ginger + Tulsi + Black Pepper + Clove → Boil 10min" },
    { title: "Important Herbs", titleHi: "महत्वपूर्ण जड़ी-बूटियां", points: ["**अश्वगंधा**: ताकत, तनाव कम, नींद अच्छी", "**गिलोय**: इम्यूनिटी बूस्टर, बुखार", "**त्रिफला**: पेट साफ, आंखों की रोशनी", "**ब्राह्मी**: दिमाग तेज, याददाश्त बढ़ाएं"], diagram: "🔧 Daily Routine: Wake 5AM → Triphala Water → Yoga → Breakfast → Ashwagandha at Night" },
  ]),
  "योग और फिटनेस": makeLessons([
    { title: "Basic Yoga", titleHi: "बेसिक योग", points: ["**सूर्य नमस्कार**: 12 आसन, रोज़ 5-10 बार करें", "**ताड़ासन**: खड़े होकर ऊपर खिंचें (Height बढ़ाने में सहायक)", "**भुजंगासन**: पेट के बल, ऊपर उठें (कमर दर्द में लाभ)", "**शवासन**: अंत में 5 min आराम करें"], diagram: "📐 Surya Namaskar: 12 poses in sequence → Repeat 5-10 times → 15 minutes" },
    { title: "Pranayam", titleHi: "प्राणायाम", points: ["**अनुलोम-विलोम**: बारी-बारी से नाक से सांस (10 min)", "**कपालभाति**: तेज़ी से सांस बाहर छोड़ें (5 min)", "**भ्रामरी**: भौंरे की आवाज़ (तनाव कम करें)"], diagram: "📊 Pranayam Schedule: Kapalbhati 5min → Anulom-Vilom 10min → Bhramari 5min" },
    { title: "Exercise", titleHi: "व्यायाम", points: ["**Push-ups**: सीना और बांह मजबूत (3 sets × 10)", "**Squats**: पैर और कमर मजबूत (3 sets × 15)", "**Plank**: पेट मजबूत (30 sec → 1 min → 2 min)", "**Running**: हफ्ते में 3-4 बार, 20-30 min"], diagram: "🔧 Weekly Plan: Mon=Chest | Tue=Legs | Wed=Rest | Thu=Back | Fri=Arms | Sat=Cardio" },
  ]),
  "फर्स्ट एड": makeLessons([
    { title: "Emergency Response", titleHi: "आपातकालीन प्रतिक्रिया", points: ["**DRSABCD**: Danger → Response → Send for help → Airway → Breathing → CPR → Defibrillator", "**Golden Hour**: पहले 1 घंटे में इलाज ज़रूरी", "**108 कॉल** करें, मरीज़ को हिलाएं नहीं"], diagram: "📐 Emergency Chain: Scene Safety → Check Response → Call 108 → First Aid → Hospital" },
    { title: "Common Injuries", titleHi: "आम चोटें", points: ["**कटना**: साफ पानी से धोएं → Antiseptic → Bandage", "**जलना**: ठंडा पानी 10-20 min → ढकें → Hospital", "**सांप काटे**: ऊपर कसें (नहीं!), शांत रखें → Hospital तुरंत", "**बिजली का झटका**: पहले **बिजली बंद** करें → CPR → 108"], diagram: "📊 Wound Care: Wash → Antiseptic → Sterile Gauze → Bandage → Change Daily" },
    { title: "First Aid Kit", titleHi: "फर्स्ट एड किट", points: ["**बैंडेज**, रुई, **Dettol/Betadine**", "**ORS पैकेट**, Paracetamol, **Burnol**", "**कैंची**, Safety Pins, Thermometer", "**Disposable Gloves**, Torch, Emergency Numbers"], diagram: "🔧 Kit Must Have: Bandages + Antiseptic + Gauze + Tape + Scissors + Gloves + ORS + Meds" },
  ]),
};

const computerLessons: Record<string, Lesson[]> = {
  "बेसिक कंप्यूटर": makeLessons([
    { title: "Computer Basics", titleHi: "कंप्यूटर बेसिक्स", points: ["**Input Devices**: Keyboard, Mouse, Scanner", "**Output Devices**: Monitor, Printer, Speaker", "**CPU**: Processor + RAM + Motherboard (दिमाग)", "**Storage**: HDD, SSD, Pen Drive, Cloud"], diagram: "📐 Computer: Input → CPU (Process) → Output | Storage (Save)" },
    { title: "Windows & Office", titleHi: "विंडोज़ और ऑफिस", points: ["**Desktop**: Icons, Taskbar, Start Menu समझें", "**File Management**: Folder बनाना, Copy, Paste, Delete", "**MS Word**: Letter, Resume बनाना, Formatting", "**MS PowerPoint**: Presentation बनाना, Slides Design"], diagram: "📊 Office Suite: Word (Documents) | Excel (Sheets) | PowerPoint (Slides) | Outlook (Email)" },
    { title: "Internet", titleHi: "इंटरनेट", points: ["**Browser**: Chrome, Firefox - URL, Search, Bookmarks", "**Email**: Gmail अकाउंट बनाना, भेजना, Attachment", "**Safety**: Strong Password, OTP, Phishing से बचें", "**Download**: Software, PDF, Images safely डाउनलोड करें"], diagram: "🔧 Password Tips: 8+ chars | Upper+Lower+Number+Symbol | Don't share | Use 2FA" },
  ]),
  "Tally / अकाउंटिंग": makeLessons([
    { title: "Tally Basics", titleHi: "टैली बेसिक्स", points: ["**Company Create** करें: Name, Address, Financial Year", "**Ledger** बनाएं: Cash, Bank, Sales, Purchase", "**Groups**: Capital, Current Assets, Current Liabilities", "**Voucher Types**: Payment, Receipt, Journal, Contra"], diagram: "📐 Accounting: Assets = Liabilities + Capital | Debit = Credit (Golden Rule)" },
    { title: "GST in Tally", titleHi: "टैली में GST", points: ["**GST Enable** करें: Company → F11 → GST Details", "**GSTIN** डालें, Tax Rate सेट करें (5%, 12%, 18%, 28%)", "**GST Invoice** बनाएं: Sales Voucher → Party → Items → Tax", "**GST Return**: GSTR-1, GSTR-3B generate करें"], diagram: "📊 GST Rates: 5% (Essential) | 12% (Standard) | 18% (General) | 28% (Luxury)" },
    { title: "Reports", titleHi: "रिपोर्ट्स", points: ["**Balance Sheet**: Assets vs Liabilities", "**Profit & Loss**: Income vs Expenses", "**Trial Balance**: सभी Ledgers का Summary", "**Outstanding**: किससे पैसा आना है, किसको देना है"], diagram: "🔧 Report Flow: Daily Vouchers → Ledger → Trial Balance → P&L → Balance Sheet" },
  ]),
  "PGDCA कोर्स": makeLessons([
    { title: "Syllabus Overview", titleHi: "पाठ्यक्रम", points: ["**Semester 1**: Computer Fundamentals, C Programming, Office Automation", "**Semester 2**: DBMS, Web Design, Data Structure", "**Duration**: 1 Year (2 Semesters)", "**Eligibility**: Graduation in any stream"], diagram: "📐 PGDCA: Fundamentals → Programming → Database → Web → Project" },
    { title: "Programming Basics", titleHi: "प्रोग्रामिंग बेसिक्स", points: ["**C Language**: Variables, Loops, Functions, Arrays", "**Data Types**: int, float, char, double", "**Control Flow**: if-else, switch, for, while", "**Functions**: Code को छोटे टुकड़ों में बांटें"], diagram: "📊 Program Flow: Start → Input → Process (Logic) → Output → End" },
    { title: "Database & Web", titleHi: "डेटाबेस और वेब", points: ["**SQL**: CREATE, INSERT, SELECT, UPDATE, DELETE", "**HTML**: Webpage का Structure बनाएं", "**CSS**: Design और Colors लगाएं", "**JavaScript**: Interactive बनाएं (Buttons, Forms)"], diagram: "🔧 Web Stack: HTML (Structure) + CSS (Design) + JS (Interaction) + SQL (Data)" },
  ]),
  "Excel मास्टर": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**Cell**: Row (1,2,3) × Column (A,B,C) = A1, B2", "**Data Entry**: Numbers, Text, Dates टाइप करें", "**Formatting**: Bold, Color, Border, Merge Cells", "**AutoFill**: Pattern खींचें (1,2,3... या Jan, Feb, Mar...)"], diagram: "📐 Excel Layout: Name Box | Formula Bar | Column Headers | Row Numbers | Sheets Tab" },
    { title: "Formulas", titleHi: "फॉर्मूला", points: ["**SUM**: =SUM(A1:A10) - जोड़", "**AVERAGE**: =AVERAGE(A1:A10) - औसत", "**VLOOKUP**: =VLOOKUP(value, table, col, FALSE) - खोजें", "**IF**: =IF(A1>50,\"Pass\",\"Fail\") - शर्त लगाएं"], diagram: "📊 Top Formulas: SUM | AVERAGE | COUNT | IF | VLOOKUP | CONCATENATE | MAX | MIN" },
    { title: "Advanced", titleHi: "एडवांस्ड", points: ["**Pivot Table**: बड़े डेटा को Summary में बदलें", "**Charts**: Bar, Pie, Line Chart बनाएं", "**Macros**: रोज़ के काम Automate करें (VBA)", "**Conditional Formatting**: रंग से डेटा Highlight करें"], diagram: "🔧 Pivot: Select Data → Insert → Pivot Table → Drag Fields → Rows/Columns/Values" },
  ]),
  "AI और ChatGPT": makeLessons([
    { title: "AI Basics", titleHi: "AI बेसिक्स", points: ["**AI (Artificial Intelligence)**: मशीन को सोचना सिखाना", "**ML (Machine Learning)**: डेटा से सीखना", "**Deep Learning**: Neural Networks (दिमाग जैसा)", "**Types**: Narrow AI (Siri) vs General AI (Future)"], diagram: "📐 AI Hierarchy: AI → Machine Learning → Deep Learning → Neural Networks → LLMs" },
    { title: "Using ChatGPT", titleHi: "ChatGPT इस्तेमाल करें", points: ["**Prompt Writing**: साफ और detailed सवाल पूछें", "**Uses**: Letter लिखें, Code बनाएं, Translation, Summary", "**Tips**: Context दें, Role assign करें, Examples दें", "**Limitations**: Outdated info, Hallucination, Bias"], diagram: "📊 Good Prompt: Role + Context + Task + Format + Constraints = Better Output" },
    { title: "AI Tools", titleHi: "AI टूल्स", points: ["**Image**: DALL-E, Midjourney (तस्वीर बनाएं)", "**Video**: RunwayML (वीडियो Edit)", "**Code**: GitHub Copilot (कोड लिखें)", "**Career**: AI Trainer, Prompt Engineer, Data Scientist"], diagram: "🔧 AI Career Path: Learn Python → Data Science → ML → Deep Learning → AI Engineer" },
  ]),
  "कोडिंग / प्रोग्रामिंग": makeLessons([
    { title: "Start Coding", titleHi: "कोडिंग शुरू करें", points: ["**Python** सबसे आसान: print(\"Hello\") ← पहला प्रोग्राम", "**Variable**: name = \"राम\" (डेटा स्टोर करें)", "**Loop**: for i in range(10): (10 बार चलाएं)", "**Function**: def add(a,b): return a+b"], diagram: "📐 Languages: Python (Easy) → JavaScript (Web) → Java (Android) → C++ (System)" },
    { title: "Web Development", titleHi: "वेब डेवलपमेंट", points: ["**Frontend**: HTML + CSS + JavaScript", "**Backend**: Python/Node.js + Database", "**Framework**: React, Django, Express", "**Hosting**: GitHub Pages, Vercel, AWS"], diagram: "📊 Web Dev Path: HTML/CSS → JavaScript → React → Node.js → Database → Deploy" },
    { title: "Mobile App Dev", titleHi: "मोबाइल ऐप", points: ["**Android**: Kotlin / Java (Android Studio)", "**iOS**: Swift (Xcode)", "**Cross-Platform**: React Native, Flutter", "**Publish**: Google Play Store / Apple App Store"], diagram: "🔧 App Dev Path: Learn Dart/Flutter → Build UI → Add Logic → API Connect → Publish" },
  ]),
};

const agricultureLessons: Record<string, Lesson[]> = {
  "एडवांस खेती तकनीक": makeLessons([
    { title: "Modern Irrigation", titleHi: "आधुनिक सिंचाई", points: ["**ड्रिप इरिगेशन**: पौधे की जड़ में सीधा पानी (90% बचत)", "**स्प्रिंकलर**: बारिश जैसा पानी (खेत में फैलाव)", "**Mulching**: प्लास्टिक शीट से नमी बचाएं", "**सोलर पंप**: बिजली बिल ज़ीरो, सरकारी सब्सिडी"], diagram: "📐 Drip System: Water Tank → Filter → Main Line → Sub Line → Dripper → Plant Root" },
    { title: "Poly House / Green House", titleHi: "पॉली हाउस", points: ["**Structure**: GI Pipe + UV Film + Shade Net", "**फायदे**: बेमौसम सब्ज़ी, कीट से सुरक्षा", "**Cost**: ₹800-1000/sqm (Govt 50% subsidy)", "**Crops**: Capsicum, Tomato, Cucumber, Flowers"], diagram: "📊 Polyhouse: 50% Subsidy | Year-round Crops | 3x More Yield | Protected Farming" },
    { title: "Soil Testing", titleHi: "मिट्टी परीक्षण", points: ["**pH Level**: 6-7 best (अम्लीय < 6, क्षारीय > 7)", "**NPK**: Nitrogen, Phosphorus, Potassium levels", "**Soil Health Card**: Govt scheme, free testing", "**उपचार**: pH कम = चूना, pH ज्यादा = जिप्सम"], diagram: "🔧 NPK Guide: N=पत्ती growth | P=जड़ और फूल | K=फल और ताकत | pH 6-7=Ideal" },
  ]),
  "जैविक खेती": makeLessons([
    { title: "Organic Basics", titleHi: "जैविक खेती बेसिक्स", points: ["**रासायनिक खाद बंद** करें, जैविक अपनाएं", "**गोबर खाद**: 1 गाय = 1 एकड़ की खाद", "**Certification**: NPOP/PGS-India से जैविक प्रमाणपत्र", "**Premium Price**: 20-50% ज्यादा दाम मिलता है"], diagram: "📐 Organic Cycle: Cow Dung → Compost → Soil → Crop → Residue → Compost again" },
    { title: "Vermicompost", titleHi: "वर्मीकम्पोस्ट", points: ["**केंचुआ खाद**: Eisenia Fetida केंचुआ इस्तेमाल करें", "**Setup**: ईंट का टैंक (10×4×3 ft) → गोबर + कचरा भरें", "**2000 केंचुए** डालें, नमी बनाए रखें", "**45-60 दिन** में खाद तैयार, छानकर इस्तेमाल करें"], diagram: "📊 Vermicompost Bed: Layer 1=Brick+Sand | Layer 2=Dry Leaves | Layer 3=Cow Dung | Add Worms" },
    { title: "Pest Management", titleHi: "कीट प्रबंधन", points: ["**नीम का तेल**: 5ml/liter पानी में मिलाकर छिड़कें", "**जैविक कीटनाशक**: Beauveria, Trichoderma", "**Sticky Traps**: पीले चिपचिपे ट्रैप लगाएं", "**Companion Planting**: Marigold लगाएं (कीट भगाए)"], diagram: "🔧 Neem Spray: 5ml Neem Oil + 1ml Soap + 1L Water → Mix → Spray Evening" },
  ]),
  "पशुपालन": makeLessons([
    { title: "Dairy Farming", titleHi: "डेयरी फार्मिंग", points: ["**नस्ल**: Gir, Sahiwal (देसी) | HF, Jersey (विदेशी)", "**चारा**: हरा चारा (Napier) + सूखा चारा + दाना", "**दूध**: HF=15-20L/day, Gir=8-12L/day", "**टीकाकरण**: FMD, HS, BQ ज़रूरी"], diagram: "📐 Cattle Feed: Green Fodder 25kg + Dry 5kg + Concentrate 3kg + Mineral Mix 50g/day" },
    { title: "Poultry Farming", titleHi: "मुर्गी पालन", points: ["**Broiler**: 42 दिन में तैयार (मांस के लिए)", "**Layer**: 180 दिन में अंडा शुरू (अंडे के लिए)", "**Shed**: 1 sqft per bird, हवादार, सूखा", "**Feed**: Starter → Grower → Finisher (Phase wise)"], diagram: "📊 Poultry Economics: 500 Birds | Invest ₹1.5L | Income ₹2.5L/batch | 6 batches/year" },
    { title: "Goat Farming", titleHi: "बकरी पालन", points: ["**नस्ल**: Jamunapari, Sirohi, Barbari, Beetal", "**चारा**: चराई + दाना (200g/day/बकरी)", "**बच्चे**: साल में 2 बार, 2-3 बच्चे हर बार", "**कमाई**: बकरा ₹15,000-30,000 (6-8 month)"], diagram: "🔧 Goat Shed: 20sqft per adult | Elevated Floor | Ventilation | Separate for Kids" },
  ]),
  "मशरूम की खेती": makeLessons([
    { title: "Setup", titleHi: "तैयारी", points: ["**टाइप**: Oyster (आसान), Button (कमाई ज्यादा)", "**Room**: 10×10 ft, अंधेरा, नमी 80-90%, Temp 20-28°C", "**Substrate**: भूसा (Wheat Straw) उबालें → निचोड़ें", "**Spawn**: ₹80-100/kg, Govt से या Private lab से लें"], diagram: "📐 Mushroom Room: Dark + Humid 85% + Temp 22-28°C + Ventilation + Shelves for Bags" },
    { title: "Growing", titleHi: "उगाने की प्रक्रिया", points: ["**Bag Filling**: Substrate + Spawn layer by layer", "**Incubation**: 15-20 दिन (बैग सफेद होगा)", "**Fruiting**: बैग कटें, पानी छिड़कें, हवा दें", "**Harvest**: 3-4 दिन में मशरूम तोड़ लें"], diagram: "📊 Timeline: Bag Fill (Day 1) → White Mycelium (Day 20) → Pinning (Day 25) → Harvest (Day 30)" },
    { title: "Business", titleHi: "बिज़नेस", points: ["**Cost**: ₹10,000 में 100 bags से शुरू", "**Yield**: 1 bag = 1-1.5 kg mushroom", "**Rate**: ₹150-300/kg (Oyster), ₹200-400/kg (Button)", "**Market**: Hotels, Restaurants, Online selling"], diagram: "🔧 Profit: 100 bags × 1.2kg × ₹200 = ₹24,000 revenue | Cost ₹10,000 | Profit ₹14,000" },
  ]),
  "मधुमक्खी पालन": makeLessons([
    { title: "Setup", titleHi: "तैयारी", points: ["**Box Type**: Langstroth या ISI standard box", "**Colony**: ₹3,000-5,000 per colony (5 से शुरू करें)", "**Location**: फूलों के पास, छायादार जगह", "**Equipment**: Smoker, Bee Suit, Hive Tool, Extractor"], diagram: "📐 Hive Parts: Bottom Board → Brood Box → Queen Excluder → Super Box → Inner Cover → Lid" },
    { title: "Management", titleHi: "प्रबंधन", points: ["**Weekly Inspection**: रानी मक्खी, अंडे, बीमारी चेक करें", "**Feeding**: Sugar Syrup (1:1) जब फूल कम हों", "**Swarm Control**: Extra space दें, New queen cells तोड़ें", "**Disease**: Varroa mite → Formic Acid treatment"], diagram: "📊 Annual Cycle: Spring=Growth | Summer=Honey Flow | Monsoon=Feed | Winter=Rest" },
    { title: "Honey Harvest", titleHi: "शहद निकालना", points: ["**Timing**: Super box 80% भरा हो तो निकालें", "**Process**: Frames निकालें → Uncap → Extractor में डालें → छानें", "**Storage**: Glass/Food grade plastic में स्टोर करें", "**Income**: 1 colony = 20-30 kg शहद/year × ₹300-500/kg"], diagram: "🔧 Extraction: Remove Frames → Uncap Wax → Centrifuge → Filter → Bottle → Label" },
  ]),
  "नंदा एग्रो फार्म": makeLessons([
    { title: "Integrated Farming", titleHi: "एकीकृत खेती", points: ["**Concept**: खेती + पशुपालन + मछली + मशरूम साथ में", "**Benefits**: Zero Waste, Multiple Income, Self-Sufficient", "**Land**: 1 एकड़ में भी शुरू कर सकते हैं", "**Model**: गोबर → बायोगैस → खाद → खेती → चारा → पशु"], diagram: "📐 Integrated Farm: Cattle↔Biogas↔Crops↔Fish Pond↔Poultry↔Mushroom (Circular)" },
    { title: "Implementation", titleHi: "कार्यान्वयन", points: ["**Phase 1**: 2-3 गाय + हरा चारा उगाएं", "**Phase 2**: बायोगैस प्लांट + सब्ज़ी उगाएं", "**Phase 3**: मछली तालाब + मुर्गी पालन जोड़ें", "**Phase 4**: मशरूम + Vermicompost unit"], diagram: "📊 Income Sources: Milk ₹500/day + Vegetables ₹200/day + Fish ₹5000/month + Mushroom ₹3000" },
    { title: "Subsidies", titleHi: "सरकारी योजनाएं", points: ["**PM Kisan**: ₹6,000/year सीधे खाते में", "**NABARD Dairy**: 25-33% subsidy on dairy setup", "**NHM**: Polyhouse, Drip पर 50% subsidy", "**MNREGA**: तालाब, कुआं खुदाई में मदद"], diagram: "🔧 Apply: CSC Center → Bank → KCC Loan → District Agriculture Office → NABARD" },
  ]),
};

const knowledgeLessons: Record<string, Lesson[]> = {
  "उत्तर भारत": makeLessons([
    { title: "States Overview", titleHi: "राज्यों का परिचय", points: ["**उत्तर प्रदेश**: सबसे ज्यादा आबादी, ताजमहल, लखनऊ (राजधानी)", "**मध्य प्रदेश**: भारत का दिल, भोपाल, खजुराहो", "**राजस्थान**: सबसे बड़ा राज्य, जयपुर, रेगिस्तान", "**बिहार**: नालंदा विश्वविद्यालय, पटना, बोधगया"], diagram: "📐 North India: UP (Lucknow) | MP (Bhopal) | Rajasthan (Jaipur) | Bihar (Patna)" },
    { title: "Culture", titleHi: "संस्कृति", points: ["**भाषा**: हिंदी, भोजपुरी, राजस्थानी, मैथिली", "**त्योहार**: होली, दीवाली, छठ पूजा, तीज", "**खाना**: दाल-बाटी, लिट्टी-चोखा, पराठा, चाट", "**नृत्य**: कत्थक (UP), घूमर (Rajasthan)"], diagram: "📊 Festival Calendar: Holi (Mar) | Teej (Aug) | Dussehra (Oct) | Diwali (Nov) | Chhath (Nov)" },
    { title: "Economy", titleHi: "अर्थव्यवस्था", points: ["**कृषि**: गेहूं, गन्ना, चावल प्रमुख फसलें", "**उद्योग**: IT (Noida), Textiles (Jaipur), Mining (MP)", "**पर्यटन**: Taj Mahal, Varanasi, Jaipur Pink City", "**हस्तशिल्प**: चिकनकारी, ब्लॉक प्रिंट, पत्थर नक्काशी"], diagram: "🔧 GDP: UP ₹21L Cr | Rajasthan ₹13L Cr | MP ₹11L Cr | Bihar ₹7L Cr (approx)" },
  ]),
  "दक्षिण भारत": makeLessons([
    { title: "States", titleHi: "राज्य", points: ["**तमिलनाडु**: Chennai, मंदिर, IT Hub", "**केरल**: God's Own Country, Backwaters, Literacy 96%", "**कर्नाटक**: Bangalore (IT Capital), Mysore Palace", "**तेलंगाना/AP**: Hyderabad, Biryani, Charminar"], diagram: "📐 South India: TN (Chennai) | Kerala (Trivandrum) | Karnataka (Bangalore) | TS (Hyderabad)" },
    { title: "Culture", titleHi: "संस्कृति", points: ["**भाषा**: तमिल, मलयालम, कन्नड़, तेलुगु", "**नृत्य**: भरतनाट्यम, कथकली, कुचिपुड़ी", "**खाना**: इडली-डोसा, अप्पम, बिरयानी, रसम", "**त्योहार**: पोंगल, ओणम, उगादी"], diagram: "📊 Languages: Tamil (oldest) | Malayalam | Kannada | Telugu (most speakers in South)" },
    { title: "Contributions", titleHi: "योगदान", points: ["**IT**: Bangalore, Chennai, Hyderabad - India's Tech Hub", "**Space**: ISRO (Sriharikota, AP)", "**Medicine**: Ayurveda (Kerala), Siddha (TN)", "**Education**: IIT Madras, IISc Bangalore"], diagram: "🔧 IT Exports: Karnataka 40% | TN 20% | Telangana 15% | Kerala 10% of India's IT" },
  ]),
  "पूर्वोत्तर भारत": makeLessons([
    { title: "Seven Sisters", titleHi: "सात बहनें", points: ["**Assam**: चाय बागान, काजीरंगा (गैंडा)", "**Meghalaya**: चेरापूंजी (सबसे ज्यादा बारिश), Living Root Bridges", "**Manipur**: Loktak Lake, Sangai Deer", "**Nagaland**: Hornbill Festival, Tribal Culture"], diagram: "📐 NE States: Assam | Arunachal | Manipur | Meghalaya | Mizoram | Nagaland | Tripura | Sikkim" },
    { title: "Culture", titleHi: "संस्कृति", points: ["**विविधता**: 200+ जनजातियां, 400+ भाषाएं", "**Bihu**: Assam का मुख्य त्योहार", "**Bamboo**: बांस से घर, खाना, हस्तशिल्प", "**खाना**: मोमो, थुकपा, बांस शूट, स्मोक्ड मीट"], diagram: "📊 Festivals: Bihu (Assam) | Hornbill (Nagaland) | Sangai (Manipur) | Wangala (Meghalaya)" },
    { title: "Potential", titleHi: "संभावनाएं", points: ["**Tourism**: अनछुई प्राकृतिक सुंदरता", "**Organic Farming**: 100% Organic State = Sikkim", "**Bamboo Industry**: ₹30,000 Cr potential", "**Hydro Power**: India की 40% जलविद्युत क्षमता"], diagram: "🔧 Opportunities: Tea | Tourism | Organic Farming | Bamboo | Hydro Power | Handloom" },
  ]),
  "पश्चिम भारत": makeLessons([
    { title: "States", titleHi: "राज्य", points: ["**महाराष्ट्र**: Mumbai (Financial Capital), Pune, Bollywood", "**गुजरात**: Ahmedabad, Statue of Unity, Diamond Hub", "**गोवा**: Beaches, Tourism, Smallest State"], diagram: "📐 West India: Maharashtra (Mumbai) | Gujarat (Gandhinagar) | Goa (Panaji)" },
    { title: "Culture", titleHi: "संस्कृति", points: ["**भाषा**: मराठी, गुजराती, कोंकणी", "**खाना**: वड़ा पाव, ढोकला, पाव भाजी, Fish Curry", "**त्योहार**: गणेश चतुर्थी, नवरात्रि (गरबा)", "**उद्योग**: Bollywood, Diamond, Textile, IT"], diagram: "📊 Economy: Maharashtra GDP ₹35L Cr (1st) | Gujarat ₹20L Cr | Goa Tourism" },
    { title: "Heritage", titleHi: "विरासत", points: ["**Ajanta-Ellora**: UNESCO World Heritage Caves", "**Gateway of India**: Mumbai का प्रतीक", "**Rann of Kutch**: White Salt Desert, Rann Utsav", "**Shivaji Maharaj**: मराठा साम्राज्य के संस्थापक"], diagram: "🔧 UNESCO Sites: Ajanta | Ellora | Elephanta | CST Mumbai | Champaner (Gujarat)" },
  ]),
  "भारतीय भाषाएं": makeLessons([
    { title: "Overview", titleHi: "परिचय", points: ["**22 राजभाषाएं**: 8th Schedule में शामिल", "**Hindi**: सबसे ज्यादा बोली जाने वाली (43%)", "**Tamil**: सबसे पुरानी भाषा (2000+ साल)", "**Sanskrit**: सभी भाषाओं की जननी"], diagram: "📐 Language Families: Indo-Aryan (Hindi, Bengali) | Dravidian (Tamil, Telugu) | Sino-Tibetan | Austroasiatic" },
    { title: "Scripts", titleHi: "लिपियां", points: ["**देवनागरी**: Hindi, Marathi, Sanskrit", "**गुरुमुखी**: Punjabi", "**बंगाली लिपि**: Bengali, Assamese", "**तमिल/तेलुगु/कन्नड़/मलयालम**: अपनी-अपनी लिपि"], diagram: "📊 Most Speakers: Hindi 528M | Bengali 97M | Telugu 82M | Marathi 83M | Tamil 69M" },
    { title: "Preservation", titleHi: "संरक्षण", points: ["**लुप्त होती भाषाएं**: 196+ भाषाएं खतरे में", "**UNESCO**: Endangered Languages Atlas", "**Digital**: Google, Microsoft भाषा tools बना रहे हैं", "**आप क्या करें**: अपनी मातृभाषा बच्चों को सिखाएं"], diagram: "🔧 Endangered: 42 Critically | 7 Severely | 62 Definitely | 85 Vulnerable languages" },
  ]),
  "विश्व इतिहास": makeLessons([
    { title: "Ancient", titleHi: "प्राचीन", points: ["**मेसोपोटामिया**: पहली सभ्यता (इराक, 3500 BC)", "**मिस्र**: पिरामिड, फ़िरौन, नील नदी", "**सिंधु घाटी**: हड़प्पा, मोहनजोदड़ो (3300 BC)", "**ग्रीस/रोम**: लोकतंत्र, दर्शन, कानून"], diagram: "📐 Timeline: Mesopotamia 3500BC → Egypt 3100BC → Indus 3300BC → Greece 800BC → Rome 753BC" },
    { title: "Medieval to Modern", titleHi: "मध्यकाल से आधुनिक", points: ["**Dark Ages**: 500-1500 AD (Europe)", "**Renaissance**: कला और विज्ञान का पुनर्जागरण", "**Industrial Revolution**: 1760 (Britain) - मशीनों का युग", "**World Wars**: WWI (1914-18), WWII (1939-45)"], diagram: "📊 Key Events: Renaissance 1400 → Columbus 1492 → Industrial Rev 1760 → French Rev 1789" },
    { title: "Modern World", titleHi: "आधुनिक विश्व", points: ["**Cold War**: USA vs USSR (1947-1991)", "**UN**: 1945 में स्थापित, 193 सदस्य देश", "**Digital Age**: Internet 1991, Smartphone 2007", "**Current**: Climate Change, AI Revolution"], diagram: "🔧 Power Shifts: British Empire → USA/USSR → USA (sole) → USA+China+India (multi-polar)" },
  ]),
  "विश्व भूगोल": makeLessons([
    { title: "Continents", titleHi: "महाद्वीप", points: ["**एशिया**: सबसे बड़ा, 4.5 अरब लोग", "**अफ्रीका**: 54 देश, सहारा रेगिस्तान", "**यूरोप**: 44 देश, EU, विकसित", "**अमेरिका**: उत्तर (USA, Canada) + दक्षिण (Brazil)"], diagram: "📐 7 Continents: Asia | Africa | N.America | S.America | Antarctica | Europe | Australia" },
    { title: "Important Facts", titleHi: "महत्वपूर्ण तथ्य", points: ["**सबसे ऊंचा**: Mount Everest (8849m, Nepal)", "**सबसे गहरा**: Mariana Trench (11,034m, Pacific)", "**सबसे बड़ा देश**: Russia (17.1M km²)", "**सबसे छोटा**: Vatican City (0.44 km²)"], diagram: "📊 Oceans: Pacific (largest) | Atlantic | Indian | Southern | Arctic (smallest)" },
    { title: "Climate", titleHi: "जलवायु", points: ["**Tropical**: गर्म+नम (भारत, Brazil)", "**Temperate**: मध्यम (Europe, USA)", "**Polar**: बर्फीला (Arctic, Antarctic)", "**Climate Change**: तापमान बढ़ रहा, बर्फ पिघल रहा"], diagram: "🔧 Climate Zones: Tropical 0-23° | Subtropical 23-35° | Temperate 35-55° | Polar 55-90°" },
  ]),
  "प्रथम PM / राष्ट्रपति": makeLessons([
    { title: "Major Countries", titleHi: "प्रमुख देश", points: ["**भारत**: PM - Nehru (1947), President - Rajendra Prasad", "**USA**: George Washington (1789), 1st President", "**UK**: Robert Walpole (1721), 1st PM", "**China**: Mao Zedong (1949), People's Republic"], diagram: "📐 India: 1st PM Nehru | 1st President Rajendra Prasad | 1st Woman PM Indira Gandhi" },
    { title: "Key Leaders", titleHi: "प्रमुख नेता", points: ["**Russia**: Lenin (1922), USSR founded", "**France**: Napoleon Bonaparte, French Revolution", "**South Africa**: Nelson Mandela, Anti-Apartheid", "**Germany**: Konrad Adenauer, Post-WWII rebuild"], diagram: "📊 Freedom Leaders: Gandhi (India) | Mandela (SA) | Lincoln (USA) | Ataturk (Turkey)" },
    { title: "Modern Leaders", titleHi: "आधुनिक नेता", points: ["**UN Secretary General**: António Guterres (2017-)", "**World Bank**: Ajay Banga (Indian-origin, 2023-)", "**WHO**: Dr. Tedros Adhanom (2017-)", "**IMF**: Kristalina Georgieva (2019-)"], diagram: "🔧 India in UN: Non-Permanent UNSC Member multiple times | Seeking permanent seat" },
  ]),
  "विश्व युद्ध": makeLessons([
    { title: "World War I", titleHi: "प्रथम विश्व युद्ध", points: ["**कब**: 1914-1918 (4 साल)", "**कारण**: Archduke Franz Ferdinand की हत्या", "**गुट**: Allied (UK, France, Russia, USA) vs Central (Germany, Austria)", "**परिणाम**: 2 करोड़ मौतें, Germany हारा, League of Nations बना"], diagram: "📐 WWI: 1914 Assassination → Alliances Activate → Trench Warfare → USA Joins 1917 → End 1918" },
    { title: "World War II", titleHi: "द्वितीय विश्व युद्ध", points: ["**कब**: 1939-1945 (6 साल)", "**कारण**: Hitler का विस्तारवाद, Poland पर हमला", "**गुट**: Allied (UK, USA, USSR) vs Axis (Germany, Japan, Italy)", "**परिणाम**: 7-8 करोड़ मौतें, Atom Bomb, UN बना"], diagram: "📊 WWII Timeline: 1939 Poland → 1941 Pearl Harbor → 1944 D-Day → 1945 Hiroshima → End" },
    { title: "Cold War", titleHi: "शीत युद्ध", points: ["**कब**: 1947-1991", "**USA vs USSR**: Capitalism vs Communism", "**Events**: Korean War, Vietnam, Space Race, Cuba Crisis", "**End**: 1991 USSR विघटन, Berlin Wall गिरी (1989)"], diagram: "🔧 Cold War: NATO (West) vs Warsaw Pact (East) | Space Race | Nuclear Arms Race | Proxy Wars" },
  ]),
  "भारतीय संविधान": makeLessons([
    { title: "Introduction", titleHi: "परिचय", points: ["**26 Nov 1949**: संविधान अपनाया गया", "**26 Jan 1950**: लागू हुआ (गणतंत्र दिवस)", "**Dr. B.R. Ambedkar**: संविधान के निर्माता", "**395 Articles, 12 Schedules, 22 Parts** (मूल)"], diagram: "📐 Constitution: Preamble → Parts (22) → Articles (395) → Schedules (12) → Amendments (105+)" },
    { title: "Key Features", titleHi: "मुख्य विशेषताएं", points: ["**Preamble**: Sovereign, Socialist, Secular, Democratic, Republic", "**Federal**: केंद्र + राज्य सरकारें", "**3 Pillars**: Legislature (संसद), Executive (सरकार), Judiciary (न्यायालय)", "**Fundamental Rights**: 6 अधिकार (Article 12-35)"], diagram: "📊 3 Pillars: Parliament (Law) | President+PM (Execute) | Supreme Court (Justice)" },
    { title: "Amendments", titleHi: "संशोधन", points: ["**42nd**: सबसे बड़ा संशोधन (1976), Mini Constitution", "**44th**: Property right हटाया (Fundamental से)", "**73rd-74th**: Panchayat और Nagar Palika", "**101st**: GST लागू (2017)"], diagram: "🔧 Important: 1st (1951) | 42nd (1976) | 44th (1978) | 73rd (1992) | 101st (2017) GST" },
  ]),
  "मौलिक अधिकार": makeLessons([
    { title: "Six Rights", titleHi: "छह अधिकार", points: ["**समानता (14-18)**: कानून के सामने सब बराबर", "**स्वतंत्रता (19-22)**: बोलने, घूमने, व्यापार की आज़ादी", "**शोषण के विरुद्ध (23-24)**: बंधुआ मज़दूरी, बाल श्रम बंद", "**धर्म की स्वतंत्रता (25-28)**: कोई भी धर्म मानने की आज़ादी"], diagram: "📐 6 Rights: Equality | Freedom | Against Exploitation | Religion | Cultural | Constitutional Remedies" },
    { title: "Article 19 Details", titleHi: "अनुच्छेद 19", points: ["**(a)** बोलने की स्वतंत्रता", "**(b)** शांतिपूर्ण सभा करना", "**(d)** भारत में कहीं भी घूमना", "**(g)** कोई भी व्यापार या पेशा करना", "**Note**: ये unlimited नहीं, reasonable restrictions लागू"], diagram: "📊 Art 19: Speech | Assembly | Movement | Residence | Profession | (Trade abolished)" },
    { title: "Remedies", titleHi: "उपचार", points: ["**Article 32**: सीधे Supreme Court जाएं (Writ)", "**5 Writs**: Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo Warranto", "**Habeas Corpus**: गैर-कानूनी गिरफ्तारी के खिलाफ", "**Mandamus**: सरकारी अधिकारी को काम करने का आदेश"], diagram: "🔧 Writs: Habeas Corpus (Release) | Mandamus (Do Duty) | Prohibition (Don't Do) | Certiorari (Transfer)" },
  ]),
  "रोज़मर्रा के कानून": makeLessons([
    { title: "Consumer Rights", titleHi: "उपभोक्ता अधिकार", points: ["**Consumer Protection Act 2019**: नकली/खराब सामान पर शिकायत", "**Online Complaint**: consumerhelpline.gov.in", "**Helpline**: 1800-11-4000 (Toll Free)", "**District Forum**: ₹1 Cr तक के मामले"], diagram: "📐 Complaint Process: Buy → Problem → Company Complain → No Resolution → Consumer Forum" },
    { title: "Property Laws", titleHi: "संपत्ति कानून", points: ["**Registry**: Sub-Registrar Office में करवाएं", "**Stamp Duty**: राज्य के अनुसार 4-8%", "**Mutation**: तहसील में नाम बदलवाएं", "**RERA**: Builder complaint के लिए"], diagram: "📊 Property Transfer: Agreement → Stamp Duty → Registration → Mutation → Possession" },
    { title: "Labour Laws", titleHi: "श्रम कानून", points: ["**Minimum Wages**: राज्य सरकार तय करती है", "**PF**: 12% कर्मचारी + 12% नियोक्ता", "**ESI**: ₹21,000 तक वेतन पर स्वास्थ्य बीमा", "**Gratuity**: 5 साल बाद, 15 दिन/साल का वेतन"], diagram: "🔧 Worker Rights: Min Wage | PF | ESI | Gratuity | Bonus | Leave | Safety | No Harassment" },
  ]),
  "RTI और PIL": makeLessons([
    { title: "RTI", titleHi: "सूचना का अधिकार", points: ["**RTI Act 2005**: सरकारी जानकारी मांगने का अधिकार", "**Fee**: ₹10 (Post या Online)", "**Reply**: 30 दिन में जवाब मिलना ज़रूरी", "**Appeal**: जवाब न मिले तो First Appeal → CIC"], diagram: "📐 RTI Process: Write Application + ₹10 Fee → Submit PIO → Reply 30 days → Appeal if denied" },
    { title: "PIL", titleHi: "जनहित याचिका", points: ["**Public Interest Litigation**: जनता के हित में कोर्ट जाना", "**कोई भी** जनहित में PIL दायर कर सकता है", "**High Court (Article 226)** या **Supreme Court (Article 32)**", "**Famous PILs**: Vishaka (Workplace Safety), MC Mehta (Pollution)"], diagram: "📊 PIL: Identify Public Issue → Draft Petition → File in HC/SC → Court Hearing → Order" },
    { title: "How to File", titleHi: "कैसे दायर करें", points: ["**RTI Online**: rtionline.gov.in", "**PIL**: Advocate की मदद से High Court में", "**Legal Aid**: ₹0 में DLSA (District Legal Services) से वकील मिलता है", "**Lok Adalat**: छोटे मामले जल्दी सुलझाएं"], diagram: "🔧 Free Legal Help: DLSA → Lok Adalat → Legal Aid → Free Lawyer for Poor" },
  ]),
  "अर्थशास्त्र": makeLessons([
    { title: "Basics", titleHi: "बेसिक्स", points: ["**GDP**: देश में बने सभी सामान+सेवाओं का मूल्य", "**India GDP**: ~$3.7 Trillion (5th largest)", "**Inflation**: महंगाई दर (RBI target 4%)", "**Repo Rate**: RBI बैंकों को जिस दर पर पैसा देता है"], diagram: "📐 Economy: GDP = C + I + G + (X-M) | C=Consumption | I=Investment | G=Govt | X-M=Trade" },
    { title: "Banking", titleHi: "बैंकिंग", points: ["**RBI**: भारत का केंद्रीय बैंक (1935)", "**SBI**: सबसे बड़ा सरकारी बैंक", "**FD Interest**: 6-7% (2024)", "**PPF**: 15 साल, Tax Free, 7.1%"], diagram: "📊 Savings: FD 7% | PPF 7.1% | NPS 9-12% | Mutual Fund 12-15% (long term)" },
    { title: "Tax & Budget", titleHi: "टैक्स और बजट", points: ["**Income Tax Slabs**: 0-3L=0%, 3-7L=5%, 7-10L=10%, 10-12L=15%, 12-15L=20%, >15L=30%", "**GST**: 5%, 12%, 18%, 28%", "**Budget**: हर साल 1 Feb को पेश होता है", "**Fiscal Deficit**: सरकार की आमदनी < खर्चा"], diagram: "🔧 Tax Filing: Collect Form 16 → Login ITR Portal → Fill Details → Verify → Refund" },
  ]),
  "विज्ञान": makeLessons([
    { title: "Physics", titleHi: "भौतिक विज्ञान", points: ["**Newton's Laws**: 1) जड़त्व 2) F=ma 3) क्रिया-प्रतिक्रिया", "**गुरुत्वाकर्षण**: g = 9.8 m/s² (पृथ्वी पर)", "**बिजली**: V=IR (Ohm's Law)", "**ऊर्जा**: E=mc² (Einstein)"], diagram: "📐 Forces: Gravity | Friction | Magnetic | Electric | Nuclear (Strong & Weak)" },
    { title: "Chemistry", titleHi: "रसायन विज्ञान", points: ["**Atom**: Proton (+) + Neutron (0) + Electron (-)", "**Periodic Table**: 118 तत्व, 18 Groups, 7 Periods", "**pH Scale**: 0-6 Acid, 7 Neutral, 8-14 Base", "**पानी (H₂O)**: 2 Hydrogen + 1 Oxygen"], diagram: "📊 pH Examples: Lemon 2 | Vinegar 3 | Water 7 | Soap 10 | Bleach 13" },
    { title: "Biology", titleHi: "जीव विज्ञान", points: ["**Cell**: जीवन की सबसे छोटी इकाई", "**DNA**: आनुवंशिक जानकारी का कोड", "**Blood Groups**: A, B, AB, O (+ or -)", "**Digestion**: मुंह → पेट → छोटी आंत → बड़ी आंत"], diagram: "🔧 Human Body: 206 Bones | 600+ Muscles | 78 Organs | 37 Trillion Cells" },
  ]),
  "सामान्य ज्ञान (GK)": makeLessons([
    { title: "India Facts", titleHi: "भारत तथ्य", points: ["**राजधानी**: New Delhi | **मुद्रा**: ₹ (INR)", "**28 राज्य, 8 केंद्रशासित प्रदेश**", "**National**: Flag 🇮🇳 | Anthem (Jana Gana Mana) | Song (Vande Mataram)", "**सबसे लंबी नदी**: गंगा (2525 km in India)"], diagram: "📐 India: Area 3.28M km² | Population 1.4B | Languages 22 | States 28 | UTs 8" },
    { title: "World Facts", titleHi: "विश्व तथ्य", points: ["**सबसे बड़ा देश**: Russia | **सबसे छोटा**: Vatican", "**सबसे ज्यादा आबादी**: India (2024)", "**सबसे अमीर**: USA (GDP) | Luxembourg (Per Capita)", "**UN Members**: 193 देश"], diagram: "📊 Top GDP: USA $25T | China $18T | Japan $4T | Germany $4T | India $3.7T" },
    { title: "Current Affairs Tips", titleHi: "करंट अफेयर्स टिप्स", points: ["**Daily**: अखबार पढ़ें (हिंदी/English)", "**Monthly**: Pratiyogita Darpan, Competition Success", "**Apps**: Daily Current Affairs, GKToday", "**Focus**: Awards, Sports, Schemes, International"], diagram: "🔧 GK Strategy: Daily News 30min | Monthly Magazine | Weekly Quiz | Revision" },
  ]),
  "गणित": makeLessons([
    { title: "Arithmetic", titleHi: "अंकगणित", points: ["**Percentage**: मान × %/100 (50 का 20% = 10)", "**Profit/Loss**: SP-CP = Profit, CP-SP = Loss", "**Simple Interest**: SI = PRT/100", "**Compound Interest**: CI = P(1+R/100)^T - P"], diagram: "📐 Formulas: SI=PRT/100 | CI=P(1+R/100)^n-P | %Change=(Diff/Original)×100" },
    { title: "Algebra", titleHi: "बीजगणित", points: ["**(a+b)²** = a² + 2ab + b²", "**(a-b)²** = a² - 2ab + b²", "**Quadratic**: ax²+bx+c=0, x = (-b±√(b²-4ac))/2a", "**Equation Solve**: दोनों तरफ बराबर करें"], diagram: "📊 Quick: (a+b)²=a²+2ab+b² | (a-b)²=a²-2ab+b² | a²-b²=(a+b)(a-b)" },
    { title: "Geometry", titleHi: "रेखागणित", points: ["**त्रिभुज क्षेत्रफल**: ½ × आधार × ऊंचाई", "**वृत्त**: Area = πr², Circumference = 2πr", "**आयत**: Area = l×b, Perimeter = 2(l+b)", "**Pythagoras**: a² + b² = c² (समकोण त्रिभुज)"], diagram: "🔧 Shapes: Triangle=½bh | Circle=πr² | Rectangle=lb | Square=a² | Cylinder=πr²h" },
  ]),
};

// Merge lessons into topics
const addLessons = (topics: { name: string; desc: string; video: string }[], lessonMap: Record<string, Lesson[]>): Topic[] =>
  topics.map((t) => ({ ...t, lessons: lessonMap[t.name] || [] }));

const skillCategories = [
  { id: "electronics", icon: Wrench, title: "टेक्निकल और इलेक्ट्रॉनिक्स रिपेयरिंग", subtitle: "All Electronics Repair", color: "from-blue-600 to-cyan-500", bg: "bg-blue-50",
    topics: addLessons([
      { name: "मोबाइल रिपेयरिंग", desc: "Screen, Battery, Motherboard, Software", video: "https://youtube.com/results?search_query=mobile+repairing+course+hindi" },
      { name: "लैपटॉप रिपेयरिंग", desc: "Hardware & Software troubleshooting", video: "https://youtube.com/results?search_query=laptop+repairing+course+hindi" },
      { name: "LED/LCD TV रिपेयरिंग", desc: "Panel, Power Supply, Mainboard", video: "https://youtube.com/results?search_query=led+tv+repairing+hindi" },
      { name: "AC रिपेयरिंग", desc: "Split AC, Window AC, Inverter AC", video: "https://youtube.com/results?search_query=ac+repairing+course+hindi" },
      { name: "फ्रिज रिपेयरिंग", desc: "Compressor, Gas Charging, Thermostat", video: "https://youtube.com/results?search_query=fridge+repairing+hindi" },
      { name: "वॉशिंग मशीन रिपेयरिंग", desc: "Semi-Auto, Fully-Auto, Front Load", video: "https://youtube.com/results?search_query=washing+machine+repair+hindi" },
      { name: "कैमरा और CCTV", desc: "Installation & Repair", video: "https://youtube.com/results?search_query=cctv+installation+course+hindi" },
      { name: "पंखा / कूलर रिपेयरिंग", desc: "Motor winding, Capacitor, Regulator", video: "https://youtube.com/results?search_query=fan+motor+winding+hindi" },
    ], electronicsLessons),
  },
  { id: "automobile", icon: Car, title: "ऑटोमोबाइल इंजीनियरिंग", subtitle: "Vehicle Repair & Engineering", color: "from-orange-600 to-amber-500", bg: "bg-orange-50",
    topics: addLessons([
      { name: "बाइक / स्कूटर रिपेयरिंग", desc: "Engine, Electrical, Suspension", video: "https://youtube.com/results?search_query=bike+repairing+course+hindi" },
      { name: "कार मैकेनिक", desc: "Engine overhaul, Transmission, AC", video: "https://youtube.com/results?search_query=car+mechanic+course+hindi" },
      { name: "डीजल इंजन", desc: "Truck, Tractor, JCB Engine Work", video: "https://youtube.com/results?search_query=diesel+engine+repair+hindi" },
      { name: "ऑटो इलेक्ट्रिकल", desc: "Wiring, Sensors, ECU Diagnostics", video: "https://youtube.com/results?search_query=auto+electrical+course+hindi" },
      { name: "पेंटिंग और डेंटिंग", desc: "Body work, Paint matching", video: "https://youtube.com/results?search_query=car+denting+painting+hindi" },
      { name: "EV रिपेयरिंग", desc: "Electric Vehicle Battery & Motor", video: "https://youtube.com/results?search_query=electric+vehicle+repair+hindi" },
    ], automobileLessons),
  },
  { id: "modern-skills", icon: Scissors, title: "आधुनिक हुनर", subtitle: "Modern Skills & Trades", color: "from-pink-600 to-rose-400", bg: "bg-pink-50",
    topics: addLessons([
      { name: "टेलरिंग / सिलाई", desc: "कटिंग, स्टिचिंग, डिज़ाइनिंग", video: "https://youtube.com/results?search_query=tailoring+course+hindi" },
      { name: "ब्यूटी पार्लर कोर्स", desc: "Facial, Hair, Bridal Makeup", video: "https://youtube.com/results?search_query=beauty+parlour+course+hindi" },
      { name: "कुकिंग / बेकिंग", desc: "Professional Cooking & Bakery", video: "https://youtube.com/results?search_query=cooking+course+hindi" },
      { name: "ड्राइविंग नियम", desc: "Traffic Rules, License Process", video: "https://youtube.com/results?search_query=driving+rules+india+hindi" },
      { name: "प्लम्बिंग कोर्स", desc: "Pipe fitting, Sanitary work", video: "https://youtube.com/results?search_query=plumbing+course+hindi" },
      { name: "इलेक्ट्रीशियन कोर्स", desc: "House wiring, Industrial wiring", video: "https://youtube.com/results?search_query=electrician+course+hindi" },
    ], modernSkillsLessons),
  },
  { id: "medical", icon: Heart, title: "मेडिकल और हेल्थ", subtitle: "Medical & Health Knowledge", color: "from-red-600 to-rose-500", bg: "bg-red-50",
    topics: addLessons([
      { name: "नर्सिंग कोर्स", desc: "Patient care, First Aid, Injections", video: "https://youtube.com/results?search_query=nursing+course+hindi" },
      { name: "होम्योपैथिक दवाएं", desc: "Common medicines & usage", video: "https://youtube.com/results?search_query=homeopathy+course+hindi" },
      { name: "एलोपैथिक ज्ञान", desc: "General medicines awareness", video: "https://youtube.com/results?search_query=allopathy+basics+hindi" },
      { name: "आयुर्वेदिक चिकित्सा", desc: "जड़ी-बूटी, काढ़ा, नुस्खे", video: "https://youtube.com/results?search_query=ayurvedic+medicine+hindi" },
      { name: "योग और फिटनेस", desc: "Daily yoga, Exercise routines", video: "https://youtube.com/results?search_query=yoga+course+hindi" },
      { name: "फर्स्ट एड", desc: "Emergency treatment knowledge", video: "https://youtube.com/results?search_query=first+aid+training+hindi" },
    ], medicalLessons),
  },
  { id: "computer", icon: Monitor, title: "कंप्यूटर और आईटी", subtitle: "Computer & IT Skills", color: "from-violet-600 to-purple-500", bg: "bg-violet-50",
    topics: addLessons([
      { name: "बेसिक कंप्यूटर", desc: "Windows, MS Office, Internet", video: "https://youtube.com/results?search_query=basic+computer+course+hindi" },
      { name: "Tally / अकाउंटिंग", desc: "GST, Billing, Tally Prime", video: "https://youtube.com/results?search_query=tally+prime+course+hindi" },
      { name: "PGDCA कोर्स", desc: "Full diploma syllabus", video: "https://youtube.com/results?search_query=pgdca+course+hindi" },
      { name: "Excel मास्टर", desc: "Formulas, Pivot, Macros, VBA", video: "https://youtube.com/results?search_query=excel+complete+course+hindi" },
      { name: "AI और ChatGPT", desc: "Artificial Intelligence basics", video: "https://youtube.com/results?search_query=ai+course+beginners+hindi" },
      { name: "कोडिंग / प्रोग्रामिंग", desc: "Python, Web Dev, App Dev", video: "https://youtube.com/results?search_query=coding+course+hindi+beginners" },
    ], computerLessons),
  },
  { id: "agriculture", icon: Sprout, title: "आधुनिक कृषि", subtitle: "Modern Agriculture & Farming", color: "from-green-600 to-emerald-500", bg: "bg-green-50",
    topics: addLessons([
      { name: "एडवांस खेती तकनीक", desc: "Drip Irrigation, Poly House", video: "https://youtube.com/results?search_query=modern+farming+techniques+hindi" },
      { name: "जैविक खेती", desc: "Organic Farming, Vermicompost", video: "https://youtube.com/results?search_query=organic+farming+hindi" },
      { name: "पशुपालन", desc: "Dairy, Poultry, Goat farming", video: "https://youtube.com/results?search_query=animal+husbandry+hindi" },
      { name: "मशरूम की खेती", desc: "Oyster, Button mushroom", video: "https://youtube.com/results?search_query=mushroom+farming+hindi" },
      { name: "मधुमक्खी पालन", desc: "Honey Bee farming", video: "https://youtube.com/results?search_query=beekeeping+hindi" },
      { name: "नंदा एग्रो फार्म", desc: "Modern integrated farming", video: "https://youtube.com/results?search_query=integrated+farming+hindi" },
    ], agricultureLessons),
  },
];

const knowledgeCategories = [
  { id: "india", icon: Globe, title: "भारत का कोना-कोना", subtitle: "Know Every Indian State", color: "from-amber-600 to-yellow-500",
    topics: addLessons([
      { name: "उत्तर भारत", desc: "UP, MP, Rajasthan, Bihar, Jharkhand", video: "https://youtube.com/results?search_query=north+india+states+hindi" },
      { name: "दक्षिण भारत", desc: "Tamil Nadu, Kerala, Karnataka, AP, Telangana", video: "https://youtube.com/results?search_query=south+india+culture+hindi" },
      { name: "पूर्वोत्तर भारत", desc: "Assam, Meghalaya, Manipur, Nagaland...", video: "https://youtube.com/results?search_query=northeast+india+hindi" },
      { name: "पश्चिम भारत", desc: "Gujarat, Maharashtra, Goa", video: "https://youtube.com/results?search_query=west+india+culture+hindi" },
      { name: "भारतीय भाषाएं", desc: "22 Official Languages & Scripts", video: "https://youtube.com/results?search_query=indian+languages+hindi" },
    ], knowledgeLessons),
  },
  { id: "world", icon: Globe, title: "विश्व इतिहास और भूगोल", subtitle: "World History & Geography", color: "from-teal-600 to-cyan-500",
    topics: addLessons([
      { name: "विश्व इतिहास", desc: "Ancient to Modern world history", video: "https://youtube.com/results?search_query=world+history+hindi" },
      { name: "विश्व भूगोल", desc: "Continents, Countries, Capitals", video: "https://youtube.com/results?search_query=world+geography+hindi" },
      { name: "प्रथम PM / राष्ट्रपति", desc: "First leaders of every country", video: "https://youtube.com/results?search_query=first+pm+president+countries+hindi" },
      { name: "विश्व युद्ध", desc: "WWI, WWII & Cold War", video: "https://youtube.com/results?search_query=world+war+hindi" },
    ], knowledgeLessons),
  },
  { id: "constitution", icon: BookOpen, title: "संविधान और कानून", subtitle: "Indian Constitution & Laws", color: "from-indigo-600 to-blue-500",
    topics: addLessons([
      { name: "भारतीय संविधान", desc: "Preamble, Articles, Amendments", video: "https://youtube.com/results?search_query=indian+constitution+hindi" },
      { name: "मौलिक अधिकार", desc: "Fundamental Rights (Art 12-35)", video: "https://youtube.com/results?search_query=fundamental+rights+hindi" },
      { name: "रोज़मर्रा के कानून", desc: "Consumer, Property, Labour Laws", video: "https://youtube.com/results?search_query=daily+laws+india+hindi" },
      { name: "RTI और PIL", desc: "Right to Information, Public Interest", video: "https://youtube.com/results?search_query=rti+pil+hindi" },
    ], knowledgeLessons),
  },
  { id: "education", icon: Star, title: "शिक्षा और विज्ञान", subtitle: "Education, Science & GK", color: "from-yellow-600 to-orange-500",
    topics: addLessons([
      { name: "अर्थशास्त्र", desc: "Economics: GDP, Inflation, Budget", video: "https://youtube.com/results?search_query=economics+hindi+basics" },
      { name: "विज्ञान", desc: "Physics, Chemistry, Biology basics", video: "https://youtube.com/results?search_query=science+hindi+basics" },
      { name: "सामान्य ज्ञान (GK)", desc: "Current Affairs & Static GK", video: "https://youtube.com/results?search_query=gk+hindi+2024" },
      { name: "गणित", desc: "Arithmetic, Algebra, Geometry", video: "https://youtube.com/results?search_query=maths+basics+hindi" },
    ], knowledgeLessons),
  },
];

const LessonCard = ({ lesson, index }: { lesson: Lesson; index: number }) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
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
          {/* Diagram placeholder */}
          <div className="bg-muted/50 border border-dashed border-border rounded-lg p-3 flex items-center gap-2">
            <Image className="h-5 w-5 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground font-mono leading-relaxed">{lesson.diagram}</p>
          </div>
          {/* Bullet points */}
          <ul className="space-y-1.5">
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

const SkillDevelopmentPage = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedTopic, setExpandedTopic] = useState<number | null>(null);
  const [businessIdea, setBusinessIdea] = useState("");

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

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4">
          <button onClick={() => { setSelectedCategory(null); setExpandedTopic(null); }} className="flex items-center gap-2 text-sm mb-2 opacity-80 hover:opacity-100">
            <ArrowLeft className="h-4 w-4" /> वापस जाएं
          </button>
          <div className="flex items-center gap-3">
            <selected.icon className="h-7 w-7" />
            <div>
              <h1 className="text-lg font-bold font-hindi">{selected.title}</h1>
              <p className="text-xs opacity-80">{selected.subtitle}</p>
            </div>
          </div>
        </div>
        <div className="container mx-auto px-4 py-4 space-y-3">
          {selected.topics.map((topic, i) => (
            <Card key={i} className="overflow-hidden border-border">
              <CardContent className="p-4">
                <button onClick={() => setExpandedTopic(expandedTopic === i ? null : i)} className="w-full text-left">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold font-hindi text-foreground">{topic.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{topic.desc}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="secondary" className="shrink-0 text-[10px]">📖 {topic.lessons.length} पाठ</Badge>
                      <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${expandedTopic === i ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </button>

                {/* Video Button always visible */}
                <div className="flex gap-2 mt-3">
                  <a href={topic.video} target="_blank" rel="noopener noreferrer" className="flex-1">
                    <Button size="sm" className="w-full gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs">
                      <Play className="h-3.5 w-3.5" /> Watch Video
                    </Button>
                  </a>
                </div>

                {/* Expanded Lessons */}
                {expandedTopic === i && topic.lessons.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-border pt-4">
                    <h4 className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <BookOpen className="h-3.5 w-3.5" /> विस्तृत पाठ (Detailed Lessons)
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
              <p className="text-[10px] opacity-80">Skill Development & Knowledge Hub</p>
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
                  <p className="text-[10px] text-muted-foreground">{t.category}</p>
                </div>
                <a href={t.video} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1 text-xs">
                    <Play className="h-3 w-3" /> Video
                  </Button>
                </a>
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
              <Wrench className="h-4 w-4 text-primary" /> कौशल प्रशिक्षण
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {skillCategories.map((cat) => (
                <Card
                  key={cat.id}
                  className="cursor-pointer border-border hover:shadow-md transition-shadow active:scale-[0.98]"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 shadow-sm`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xs font-hindi text-foreground leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.topics.length} Topics</p>
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
                  className="cursor-pointer border-border hover:shadow-md transition-shadow active:scale-[0.98]"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <CardContent className="p-3">
                    <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2 shadow-sm`}>
                      <cat.icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-xs font-hindi text-foreground leading-tight">{cat.title}</h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{cat.topics.length} Topics</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Business Ideas Section */}
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
