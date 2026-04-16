/* ═══════════════════════════════════════════════════════════════════════
   SKILL DEVELOPMENT — Digital PDF Library Data
   Each category is a container for user-uploaded PDF books
   ═══════════════════════════════════════════════════════════════════════ */

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
  icon: string;
  color: string;
  descriptionHi: string;
  pdfLibrary: PdfItem[];
}

/* ══════════════════════════════════════════
   CATEGORIES EXPORT
   ══════════════════════════════════════════ */
export const bookCategories: BookCategory[] = [
  {
    id: "electronics",
    title: "टेक्निकल रिपेयरिंग",
    titleHi: "Mobile, Laptop, TV, AC Repairing",
    icon: "🔧",
    color: "from-blue-600 to-indigo-500",
    descriptionHi: "मोबाइल, लैपटॉप, LED TV, AC और फ्रिज रिपेयरिंग की संपूर्ण पुस्तकें। Hardware, Software, Chip-level सभी विषय।",
    pdfLibrary: [],
  },
  {
    id: "automobile",
    title: "ऑटोमोबाइल इंजीनियरिंग",
    titleHi: "Automobile Engineering",
    icon: "🚗",
    color: "from-red-600 to-orange-500",
    descriptionHi: "बाइक, कार, ट्रक — इंजन, गियरबॉक्स, इलेक्ट्रिकल सिस्टम, और EV टेक्नोलॉजी की पुस्तकें।",
    pdfLibrary: [],
  },
  {
    id: "computer",
    title: "कंप्यूटर और IT",
    titleHi: "Tally, PGDCA, Coding, Computer",
    icon: "🖥️",
    color: "from-violet-600 to-purple-500",
    descriptionHi: "Tally Prime, Excel, PGDCA, Web Development, Python, और कंप्यूटर हार्डवेयर-सॉफ्टवेयर की पुस्तकें।",
    pdfLibrary: [
      {
        id: "pdf-ict-basic-seminar",
        titleHi: "कंप्यूटर हार्डवेयर — ICT बेसिक सेमिनार",
        titleEn: "ICT Basic Seminar Final",
        icon: "💻",
        pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/computer/ict-basic-seminar-final.pdf",
        tags: ["computer", "hardware", "ICT", "seminar"],
      },
      {
        id: "pdf-computer-hardware",
        titleHi: "कंप्यूटर हार्डवेयर — संपूर्ण गाइड",
        titleEn: "Computer Hardware Complete Guide",
        icon: "🖥️",
        pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/computer/computer-hardware.pdf",
        tags: ["computer", "hardware", "guide"],
      },
      {
        id: "pdf-computer-711-712",
        titleHi: "कंप्यूटर हार्डवेयर — पाठ्यक्रम 711-712",
        titleEn: "Computer Hardware Syllabus 711-712",
        icon: "🔧",
        pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/computer/711-712-revised-h.pdf",
        tags: ["computer", "hardware", "syllabus", "711", "712"],
      },
    ],
  },
  {
    id: "medical",
    title: "मेडिकल और नर्सिंग",
    titleHi: "Nursing, Health & Medicine",
    icon: "🏥",
    color: "from-emerald-600 to-green-500",
    descriptionHi: "ANM, GNM, B.Sc Nursing, First Aid, Patient Care, और स्वास्थ्य शिक्षा की पुस्तकें।",
    pdfLibrary: [],
  },
  {
    id: "agriculture",
    title: "आधुनिक कृषि विज्ञान",
    titleHi: "Agriculture, Farming & Animal Husbandry",
    icon: "🌾",
    color: "from-lime-600 to-green-600",
    descriptionHi: "यह भारत का सबसे व्यापक कृषि शिक्षा केंद्र है — जैविक खेती, मशरूम उत्पादन, मछली पालन, बकरी पालन, पशुपालन, तालाब प्रबंधन, और ICAR की नवीनतम तकनीकें। किसान भाई यहाँ से सीधे सरकारी पुस्तकें पढ़ सकते हैं और आधुनिक कृषि विज्ञान से अपनी आय दोगुनी कर सकते हैं। हर PDF असली सरकारी/संस्थान की पुस्तक है।",
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
      { id: "pdf-pashupalan-economics", titleHi: "पशुपालन — अर्थशास्त्र एवं प्रबंधन", titleEn: "Economics of Animal Rearing", icon: "📈", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/pashupalan-economics.pdf", tags: ["पशुपालन", "अर्थशास्त्र", "economics"] },
      { id: "pdf-suar-palan-jivika", titleHi: "सूअर पालन द्वारा जीविकोपार्जन", titleEn: "Livelihood through Pig Farming", icon: "🐷", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/suar-palan-jivika.pdf", tags: ["सूअर", "पालन", "pig", "जीविका"] },
      { id: "pdf-pig-husbandry", titleHi: "सूअर पालन — संपूर्ण पाठ्यपुस्तक", titleEn: "Pig Husbandry Textbook", icon: "🐖", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/pig-husbandry.pdf", tags: ["सूअर", "pig", "husbandry", "पालन"] },
      { id: "pdf-kisan-pathshala", titleHi: "किसान पाठशाला — हांगादी खेती फ्लिप चार्ट", titleEn: "Farmer Field School Flip Chart", icon: "👨‍🌾", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/kisan-pathshala.pdf", tags: ["किसान", "पाठशाला", "FFS", "खेती"] },
      { id: "pdf-kharif-faslon", titleHi: "खरीफ फसलों का ज्ञान — जयपुर", titleEn: "Kharif Crops Knowledge Jaipur", icon: "🌱", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/kharif-faslon-jaipur.pdf", tags: ["खरीफ", "फसल", "kharif", "जयपुर"] },
      { id: "pdf-kheti-sampoorn", titleHi: "खेती का संपूर्ण ज्ञान", titleEn: "Complete Farming Knowledge", icon: "📗", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/kheti-sampoorn-gyan.pdf", tags: ["खेती", "संपूर्ण", "farming", "ज्ञान"] },
      { id: "pdf-faslon-utpadan", titleHi: "विभिन्न फसलों का उत्पादन तकनीक", titleEn: "Crop Production Techniques", icon: "🌾", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/faslon-utpadan-technique.pdf", tags: ["फसल", "उत्पादन", "तकनीक", "production"] },
      { id: "pdf-fasal-utpadan", titleHi: "फसल का उत्पादन एवं प्रबंध", titleEn: "Crop Production and Management", icon: "🏭", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/kal-utpadan-prabandh.pdf", tags: ["फसल", "उत्पादन", "प्रबंध", "management"] },
      { id: "pdf-sarson-kheti", titleHi: "उन्नत खेती — सरसों की खेती", titleEn: "Advanced Mustard Farming", icon: "🌼", pdfUrl: "https://tkenjzcyvnqnhgntmmen.supabase.co/storage/v1/object/public/skill-pdfs/agriculture/sarson-ki-kheti.pdf", tags: ["सरसों", "mustard", "उन्नत", "खेती"] },
    ],
  },
  {
    id: "knowledge",
    title: "ज्ञान और इतिहास",
    titleHi: "Constitution, History, Science, GK",
    icon: "📜",
    color: "from-amber-600 to-yellow-500",
    descriptionHi: "भारतीय संविधान, विश्व इतिहास, भौतिक विज्ञान, रसायन विज्ञान, जीव विज्ञान और सामान्य ज्ञान की पुस्तकें।",
    pdfLibrary: [],
  },
];
