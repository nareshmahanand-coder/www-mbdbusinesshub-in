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
    pdfLibrary: [],
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
