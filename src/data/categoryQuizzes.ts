/* ════════════════════════════════════════════════════════════
   Category Quiz Bank — 50 MCQs auto-generated per category
   Each category has its own seed pool; we expand to 50 questions
   by combining base questions + generic skill/safety/business MCQs
   ════════════════════════════════════════════════════════════ */

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number; // index 0-3
}

/* Generic MCQs applicable to ALL skill courses (safety, business, ethics) */
const GENERIC_BANK: QuizQuestion[] = [
  { q: "किसी भी कार्यस्थल पर सबसे महत्वपूर्ण क्या है?", options: ["सुरक्षा (Safety)", "गति", "सस्ता काम", "जल्दी निकलना"], correct: 0 },
  { q: "ग्राहक से बात करते समय क्या आवश्यक है?", options: ["झूठ बोलना", "विनम्रता और सच्चाई", "ऊंची आवाज", "इग्नोर करना"], correct: 1 },
  { q: "GST का पूरा नाम क्या है?", options: ["General Sales Tax", "Goods and Services Tax", "Government Service Tax", "Gross State Tax"], correct: 1 },
  { q: "MSME का अर्थ क्या है?", options: ["Micro Small Medium Enterprises", "Major State Modern Era", "Money Save More Earn", "Market Sales Main Event"], correct: 0 },
  { q: "किसी भी बिज़नेस में 'Profit' का मतलब क्या है?", options: ["कुल बिक्री", "कुल खर्च", "बिक्री - खर्च", "कुल पूंजी"], correct: 2 },
  { q: "Digital Payment के लिए सबसे सुरक्षित तरीका क्या है?", options: ["UPI PIN शेयर करना", "OTP किसी को बताना", "अपना PIN गुप्त रखना", "Password लिखकर रखना"], correct: 2 },
  { q: "किसी काम को सीखने का सबसे अच्छा तरीका क्या है?", options: ["केवल पढ़ना", "अभ्यास (Practice)", "देखना", "सोचना"], correct: 1 },
  { q: "First Aid Box में क्या होना चाहिए?", options: ["केवल पट्टी", "Bandage, Antiseptic, Painkiller", "केवल दवाई", "कुछ नहीं"], correct: 1 },
  { q: "PPE का अर्थ क्या है?", options: ["Personal Protective Equipment", "Public Property Entry", "Power Plant Engineer", "Private Police Equipment"], correct: 0 },
  { q: "बिज़नेस में 'Customer Satisfaction' क्यों जरूरी है?", options: ["Repeat Business के लिए", "टैक्स बचाने के लिए", "विज्ञापन के लिए", "किसी काम का नहीं"], correct: 0 },
  { q: "Invoice/Bill में क्या होना चाहिए?", options: ["केवल कीमत", "तारीख, ग्राहक नाम, सामान, GST", "केवल नाम", "कुछ भी"], correct: 1 },
  { q: "Skill India का उद्देश्य क्या है?", options: ["रोजगार और कौशल बढ़ाना", "केवल खेल", "केवल पढ़ाई", "केवल बिज़नेस"], correct: 0 },
  { q: "PMKVY का पूरा नाम क्या है?", options: ["Pradhan Mantri Kaushal Vikas Yojana", "Public Money Kisan Vikas Yojana", "Prime Minister Kala Vikas", "Pradhan Mantri Kheti Vikas"], correct: 0 },
  { q: "Workshop में आग लगने पर क्या करें?", options: ["भागें", "Fire Extinguisher का उपयोग करें", "पानी डालें (बिजली पर)", "देखते रहें"], correct: 1 },
  { q: "Tools को कैसे रखना चाहिए?", options: ["कहीं भी फेंक दें", "साफ और निश्चित जगह पर", "गीला रखें", "धूप में छोड़ें"], correct: 1 },
  { q: "Time Management में सबसे जरूरी क्या है?", options: ["देर से आना", "Planning और Discipline", "केवल सोना", "बातें करना"], correct: 1 },
  { q: "Bank Loan के लिए क्या जरूरी है?", options: ["केवल नाम", "Aadhar, PAN, Income Proof", "केवल फोटो", "कुछ नहीं"], correct: 1 },
  { q: "Mudra Loan किसके लिए है?", options: ["केवल किसान", "छोटे व्यापारी और स्व-रोजगार", "केवल छात्र", "केवल महिला"], correct: 1 },
  { q: "Quality Control का मतलब क्या है?", options: ["जल्दी काम करना", "अच्छी गुणवत्ता सुनिश्चित करना", "सस्ता बनाना", "ज्यादा बनाना"], correct: 1 },
  { q: "Teamwork का सबसे बड़ा फायदा क्या है?", options: ["अकेले काम", "मिलकर बेहतर परिणाम", "झगड़ा", "देरी"], correct: 1 },
  { q: "Insurance क्यों जरूरी है?", options: ["समय बर्बाद करना", "नुकसान से सुरक्षा", "पैसे फेंकना", "कोई फायदा नहीं"], correct: 1 },
  { q: "Marketing का मुख्य उद्देश्य क्या है?", options: ["सामान छुपाना", "ग्राहक तक पहुंचना", "महंगा बेचना", "कम बेचना"], correct: 1 },
  { q: "Digital India का लाभ क्या है?", options: ["Online सेवाएं और पारदर्शिता", "केवल मनोरंजन", "कोई फायदा नहीं", "केवल गेम"], correct: 0 },
  { q: "Aadhar Card का प्रमुख उपयोग क्या है?", options: ["पहचान प्रमाण", "खेलना", "सजावट", "उपहार"], correct: 0 },
  { q: "Hard Work और Smart Work में क्या अच्छा है?", options: ["केवल Hard", "दोनों का संतुलन", "केवल Smart", "कोई नहीं"], correct: 1 },
  { q: "Honesty (ईमानदारी) क्यों जरूरी है?", options: ["विश्वास बनाने के लिए", "धोखे के लिए", "नुकसान के लिए", "किसी काम की नहीं"], correct: 0 },
  { q: "Punctuality (समय पालन) का मतलब क्या है?", options: ["देर से आना", "समय पर आना और काम पूरा करना", "जल्दी निकलना", "लंच ज्यादा लेना"], correct: 1 },
  { q: "Communication Skill क्यों जरूरी है?", options: ["चुप रहने के लिए", "विचार स्पष्ट रखने के लिए", "झगड़े के लिए", "किसी काम की नहीं"], correct: 1 },
  { q: "Customer Complaint का सही जवाब क्या है?", options: ["इग्नोर करें", "ध्यान से सुनें और हल करें", "गुस्सा करें", "ब्लॉक करें"], correct: 1 },
  { q: "किसी भी काम में सीखने की भावना (Learning) क्यों जरूरी है?", options: ["प्रगति के लिए", "नुकसान के लिए", "रुकने के लिए", "किसी काम की नहीं"], correct: 0 },
  { q: "Workshop में जूते कैसे होने चाहिए?", options: ["चप्पल", "Safety Shoes", "नंगे पैर", "हाई हील"], correct: 1 },
  { q: "Electric काम करते समय क्या जरूरी है?", options: ["गीले हाथ", "Insulated Tools और सूखे हाथ", "बिना ग्लव्स", "जल्दबाजी"], correct: 1 },
  { q: "Multimeter से क्या मापा जाता है?", options: ["वजन", "Voltage, Current, Resistance", "तापमान", "लंबाई"], correct: 1 },
  { q: "Helmet कब पहनना चाहिए?", options: ["कभी नहीं", "Construction/Workshop में", "सोते समय", "खाते समय"], correct: 1 },
  { q: "Backup क्यों जरूरी है?", options: ["डेटा सुरक्षा के लिए", "जगह भरने के लिए", "वजन बढ़ाने के लिए", "किसी काम का नहीं"], correct: 0 },
  { q: "किसी customer के साथ कैसा व्यवहार होना चाहिए?", options: ["रूखा", "विनम्र और सम्मानजनक", "गुस्सेभरा", "उदासीन"], correct: 1 },
  { q: "Self-Employment का अर्थ क्या है?", options: ["सरकारी नौकरी", "अपना खुद का काम", "बेरोजगारी", "विदेश जाना"], correct: 1 },
  { q: "Apprenticeship का क्या लाभ है?", options: ["कुछ नहीं", "Practical सीखना और कमाई", "केवल छुट्टी", "केवल पढ़ाई"], correct: 1 },
  { q: "Income Tax कब भरना चाहिए?", options: ["कभी नहीं", "निर्धारित आय से ऊपर वार्षिक", "मासिक", "साप्ताहिक"], correct: 1 },
  { q: "PAN Card का उपयोग कहां होता है?", options: ["वित्तीय लेन-देन में", "खेल में", "खाने में", "सजावट में"], correct: 0 },
  { q: "Stock/Inventory क्यों रखें?", options: ["कोई फायदा नहीं", "बिक्री और मांग ट्रैक करने के लिए", "जगह भरने के लिए", "वजन बढ़ाने के लिए"], correct: 1 },
  { q: "Receipt क्यों दें?", options: ["कोई फायदा नहीं", "Proof और Trust के लिए", "कागज बचाने के लिए", "किसी काम का नहीं"], correct: 1 },
  { q: "Hygiene (स्वच्छता) क्यों जरूरी है?", options: ["स्वास्थ्य और छवि के लिए", "किसी काम की नहीं", "समय बर्बाद", "गलत आदत"], correct: 0 },
  { q: "Energy Saving का तरीका क्या है?", options: ["Light बंद करना जब उपयोग न हो", "Light हमेशा जलाना", "AC खुले में चलाना", "Heater 24 घंटे"], correct: 0 },
  { q: "Recycle का मतलब क्या है?", options: ["फेंकना", "पुन: उपयोग में लाना", "जलाना", "छिपाना"], correct: 1 },
  { q: "Goal Setting क्यों जरूरी है?", options: ["दिशा और प्रगति के लिए", "उलझन के लिए", "कोई फायदा नहीं", "देरी के लिए"], correct: 0 },
  { q: "Feedback क्यों लेनी चाहिए?", options: ["सुधार के लिए", "नुकसान के लिए", "किसी काम की नहीं", "लड़ाई के लिए"], correct: 0 },
  { q: "किसी भी Trade में सबसे जरूरी क्या है?", options: ["Practice और Knowledge", "केवल पैसा", "केवल बातें", "केवल नींद"], correct: 0 },
  { q: "Internet का सही उपयोग क्या है?", options: ["केवल गेम", "Learning, Business, Communication", "केवल टाइम पास", "धोखाधड़ी"], correct: 1 },
  { q: "किसी भी सर्टिफिकेट का महत्व क्या है?", options: ["कौशल का प्रमाण", "केवल कागज", "किसी काम का नहीं", "सजावट"], correct: 0 },
];

/* Category-specific MCQ seeds (each provides domain-relevant questions) */
const CATEGORY_SEEDS: Record<string, QuizQuestion[]> = {
  electronics: [
    { q: "Multimeter में Continuity Test क्यों किया जाता है?", options: ["Wire टूटा है या नहीं", "Voltage नापने", "Current नापने", "तापमान"], correct: 0 },
    { q: "Soldering Iron का सामान्य तापमान कितना होता है?", options: ["50°C", "200°C", "350-400°C", "1000°C"], correct: 2 },
    { q: "Smartphone की Battery किस प्रकार की होती है?", options: ["Lead Acid", "Lithium-ion", "Dry Cell", "Solar"], correct: 1 },
    { q: "AC का Compressor क्या काम करता है?", options: ["हवा फेंकता है", "Refrigerant को Compress करता है", "पानी निकालता है", "Light देता है"], correct: 1 },
    { q: "LED TV में 'LED' का अर्थ क्या है?", options: ["Light Emitting Diode", "Low Energy Display", "Long Electric Drive", "Liquid Electric Display"], correct: 0 },
    { q: "Capacitor का काम क्या है?", options: ["Charge स्टोर करना", "Resistance देना", "Current बढ़ाना", "गर्मी पैदा करना"], correct: 0 },
    { q: "Mobile Charging Port खराब होने का कारण?", options: ["धूल और गलत उपयोग", "ज्यादा बात करना", "Music सुनना", "Photo लेना"], correct: 0 },
    { q: "Refrigerator में Gas का नाम क्या है?", options: ["Oxygen", "R-134a / R-600a", "Hydrogen", "CO2"], correct: 1 },
    { q: "PCB का पूरा नाम क्या है?", options: ["Printed Circuit Board", "Power Cable Box", "Public Cable Bus", "Plastic Coated Board"], correct: 0 },
    { q: "Earthing क्यों जरूरी है?", options: ["सजावट के लिए", "Shock से सुरक्षा", "Light बढ़ाने", "Speed बढ़ाने"], correct: 1 },
  ],
  automobile: [
    { q: "Engine Oil बदलने का सही समय क्या है?", options: ["कभी नहीं", "हर 5,000-10,000 km पर", "रोज", "साल में एक बार"], correct: 1 },
    { q: "Car/Bike में Clutch का काम क्या है?", options: ["Brake लगाना", "Engine और Gear को जोड़ना/अलग करना", "Light जलाना", "Horn बजाना"], correct: 1 },
    { q: "EV का पूरा नाम क्या है?", options: ["Electric Vehicle", "Engine Vehicle", "Express Van", "Energy Valve"], correct: 0 },
    { q: "Tyre का Pressure क्यों जरूरी है?", options: ["सजावट", "Safety और Mileage", "Color के लिए", "Sound के लिए"], correct: 1 },
    { q: "Spark Plug का काम क्या है?", options: ["Light देना", "Fuel को Ignite करना", "Brake लगाना", "Cooling"], correct: 1 },
    { q: "Battery Terminal में + और - का मतलब?", options: ["Color", "Positive और Negative", "Plus Minus लिखावट", "नंबर"], correct: 1 },
    { q: "Helmet पहनना क्यों जरूरी है?", options: ["Style", "Head Safety", "Hair छिपाने", "Photo के लिए"], correct: 1 },
    { q: "RPM का अर्थ क्या है?", options: ["Revolutions Per Minute", "Road Per Mile", "Rear Power Mode", "Race Per Match"], correct: 0 },
    { q: "Brake Fluid का स्तर कब चेक करें?", options: ["कभी नहीं", "नियमित Service में", "सिर्फ accident के बाद", "साल में एक बार"], correct: 1 },
    { q: "Diesel Engine और Petrol Engine में मुख्य अंतर?", options: ["रंग", "Ignition System", "Size", "वजन"], correct: 1 },
  ],
  ai: [
    { q: "AI का पूरा नाम क्या है?", options: ["Artificial Intelligence", "Auto Internet", "Active Index", "Audio Input"], correct: 0 },
    { q: "Machine Learning का क्या अर्थ है?", options: ["मशीन का डेटा से सीखना", "मशीन बनाना", "मशीन तोड़ना", "मशीन बेचना"], correct: 0 },
    { q: "ChatGPT किस प्रकार का AI है?", options: ["Image AI", "Generative Language Model", "Game AI", "Music AI"], correct: 1 },
    { q: "AI का सबसे आम उपयोग कहां है?", options: ["Search Engine, Voice Assistant", "केवल Game", "केवल Calculator", "कहीं नहीं"], correct: 0 },
    { q: "Deep Learning किस पर आधारित है?", options: ["Neural Networks", "Calculator", "Excel Sheet", "Notepad"], correct: 0 },
    { q: "AI Ethics का अर्थ क्या है?", options: ["AI का जिम्मेदार उपयोग", "AI का गलत उपयोग", "AI से धोखा", "कुछ नहीं"], correct: 0 },
    { q: "Voice Assistant के उदाहरण क्या हैं?", options: ["Alexa, Siri, Google Assistant", "Notepad", "Paint", "Calculator"], correct: 0 },
    { q: "Data किसका 'ईंधन' (Fuel) कहा जाता है?", options: ["AI का", "Car का", "Light का", "Water का"], correct: 0 },
    { q: "AI से नौकरी पर क्या प्रभाव है?", options: ["सब खत्म", "नई skills जरूरी, नए रोजगार भी", "कोई असर नहीं", "केवल नुकसान"], correct: 1 },
    { q: "Chatbot का मुख्य काम क्या है?", options: ["स्वचालित बातचीत", "खाना बनाना", "गाड़ी चलाना", "सोना"], correct: 0 },
  ],
  knowledge: [
    { q: "भारत का संविधान कब लागू हुआ?", options: ["15 अगस्त 1947", "26 जनवरी 1950", "2 अक्टूबर 1948", "26 नवंबर 1949"], correct: 1 },
    { q: "भारत के संविधान के निर्माता कौन थे?", options: ["गांधी जी", "डॉ. बी.आर. अंबेडकर", "नेहरू जी", "पटेल जी"], correct: 1 },
    { q: "भारत की राजधानी क्या है?", options: ["मुंबई", "नई दिल्ली", "कोलकाता", "चेन्नई"], correct: 1 },
    { q: "भारत के पहले राष्ट्रपति कौन थे?", options: ["राधाकृष्णन", "डॉ. राजेंद्र प्रसाद", "नेहरू", "पटेल"], correct: 1 },
    { q: "मौलिक अधिकार कुल कितने हैं?", options: ["5", "6", "7", "8"], correct: 1 },
    { q: "भारत में कुल कितने राज्य हैं?", options: ["27", "28", "29", "30"], correct: 1 },
    { q: "भारत का सर्वोच्च न्यायालय कहां है?", options: ["मुंबई", "नई दिल्ली", "कोलकाता", "चेन्नई"], correct: 1 },
    { q: "विश्व का सबसे बड़ा महाद्वीप कौन सा है?", options: ["अफ्रीका", "एशिया", "यूरोप", "अमेरिका"], correct: 1 },
    { q: "विज्ञान में H2O किसका सूत्र है?", options: ["नमक", "पानी", "ऑक्सीजन", "हाइड्रोजन"], correct: 1 },
    { q: "गुरुत्वाकर्षण की खोज किसने की?", options: ["आइंस्टीन", "न्यूटन", "गैलीलियो", "एडिसन"], correct: 1 },
  ],
  nursing: [
    { q: "First Aid का मुख्य उद्देश्य क्या है?", options: ["जान बचाना और स्थिति बिगड़ने से रोकना", "इलाज करना", "ऑपरेशन", "दवा देना"], correct: 0 },
    { q: "BP नापने के लिए क्या उपयोग होता है?", options: ["Stethoscope", "Sphygmomanometer", "Thermometer", "Microscope"], correct: 1 },
    { q: "Normal Body Temperature कितना होता है?", options: ["35°C", "37°C (98.6°F)", "40°C", "30°C"], correct: 1 },
    { q: "CPR का पूरा नाम क्या है?", options: ["Cardio Pulmonary Resuscitation", "Care Public Relation", "Central Power Reset", "Common Patient Record"], correct: 0 },
    { q: "योग का सबसे बड़ा लाभ क्या है?", options: ["शारीरिक और मानसिक स्वास्थ्य", "वजन बढ़ाना", "नींद बढ़ाना", "कुछ नहीं"], correct: 0 },
    { q: "आयुर्वेद किस देश की पद्धति है?", options: ["चीन", "भारत", "जापान", "अमेरिका"], correct: 1 },
    { q: "Diabetes में क्या नियंत्रित करना होता है?", options: ["Blood Sugar", "Hair", "Hearing", "Vision"], correct: 0 },
    { q: "Vaccination क्यों जरूरी है?", options: ["रोग प्रतिरोधक क्षमता बढ़ाने के लिए", "सजावट", "वजन बढ़ाने", "नींद के लिए"], correct: 0 },
    { q: "Hand Wash कब करना चाहिए?", options: ["कभी नहीं", "खाने से पहले और शौच के बाद", "सोते समय", "केवल सुबह"], correct: 1 },
    { q: "होम्योपैथी की खोज किसने की?", options: ["Hahnemann", "Newton", "Edison", "Einstein"], correct: 0 },
  ],
};

/* Build a 50-question quiz for a given category */
export function buildQuizForCategory(categoryId: string): QuizQuestion[] {
  const seeds = CATEGORY_SEEDS[categoryId] || [];
  const pool: QuizQuestion[] = [...seeds, ...GENERIC_BANK];

  // Shuffle deterministically? No — random each attempt
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const fifty = shuffled.slice(0, 50);

  // If pool < 50, repeat to fill (rare safety net)
  while (fifty.length < 50) {
    fifty.push(GENERIC_BANK[Math.floor(Math.random() * GENERIC_BANK.length)]);
  }
  return fifty;
}
