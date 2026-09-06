export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Shop {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  address: string;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  whatsapp: string;
  phone: string;
  photos: string[];
  verified: boolean;
  premium?: boolean;
  /** Nanda Agro Farm flagship units — pinned absolutely on top of all listings */
  flagship?: boolean;
  /** Optional hero image (public path or imported asset URL) for branded portals */
  heroImage?: string;
  /** Optional tagline shown under shop name on the branded portal */
  tagline?: string;
  /** Optional price label (e.g. "₹60/किलो") shown on the branded portal */
  priceLabel?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  description: string;
}

export const defaultCategories = [
  "General Store",
  "Clothing & Fashion",
  "Electronics",
  "Pharmacy",
  "Salon & Barber",
  "Fast Food",
  "Hardware & Paints",
  "Vegetables & Fruits",
  "Milk & Dairy",
  "Bakery",
  "Life Insurance (LIC)",
  "Tractor on Rent",
];

export const sampleShops: Shop[] = [
  // ─── Nanda Agro Farm — Flagship Premium Units (Official Launch) ───
  // All demo / sample / fake merchant entries have been permanently removed.
  // Real local merchants will appear here only after they register & get verified.
  // ─── Nanda Agro Farm — Flagship Premium Units (pinned to absolute top) ───
  {
    id: "nanda-garlic",
    name: "Nanda Peeled Garlic",
    nameHindi: "नंदा छिला हुआ लहसुन",
    category: "Nanda Agro Farm",
    address: "Risali, Bhilai",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2167,
    lng: 81.3833,
    whatsapp: "918305161361",
    phone: "918305161361",
    photos: ["/src/assets/nanda-garlic.png"],
    verified: true,
    premium: true,
    flagship: true,
    heroImage: "/src/assets/nanda-garlic.png",
    tagline: "ताज़ा छिला लहसुन — रसोई का काम आसान",
    priceLabel: "₹220 / 500g",
    rating: 4.9,
    reviewCount: 84,
    reviews: [],
    description: "100% शुद्ध, हाथ से छिला हुआ लहसुन — Bhilai की Nanda Agro Farm से सीधा आपकी रसोई तक। समय की बचत, पूरी ताज़गी।",
  },
  {
    id: "nanda-meat",
    name: "Nanda Meat & Poultry",
    nameHindi: "नंदा मीट एंड पोल्ट्री",
    category: "Nanda Agro Farm",
    address: "Risali, Bhilai",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2168,
    lng: 81.3834,
    whatsapp: "918305161361",
    phone: "918305161361",
    photos: [],
    verified: true,
    premium: true,
    flagship: true,
    tagline: "देसी मुर्गा, बकरा & ताज़ा अंडे — Antibiotic Free",
    priceLabel: "Daily fresh — call for rates",
    rating: 4.8,
    reviewCount: 56,
    reviews: [],
    description: "फार्म फ्रेश देसी मुर्गा, बकरा, अंडे और बटेर। हलाल कट, साफ-सुथरा पैकिंग, होम डिलीवरी available।",
  },
  {
    id: "nanda-chicken-chips",
    name: "Nanda Desi Chicken Chips",
    nameHindi: "नंदा देसी चिकन चिप्स",
    category: "Nanda Agro Farm",
    address: "Risali, Bhilai",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2169,
    lng: 81.3835,
    whatsapp: "918305161361",
    phone: "918305161361",
    photos: ["/src/assets/nanda-chicken-chips.png"],
    verified: true,
    premium: true,
    flagship: true,
    heroImage: "/src/assets/nanda-chicken-chips.png",
    tagline: "The Power Protein Crunch — High Protein, Low Carb",
    priceLabel: "₹10 (15g) • ₹100 (80g)",
    rating: 4.9,
    reviewCount: 102,
    reviews: [],
    description: "क्रंची, प्रोटीन-रिच देसी चिकन चिप्स — बच्चों और बड़ों दोनों के लिए। FSSAI Certified, healthy snack alternative।",
  },
  {
    id: "nanda-dry-fruits",
    name: "Nanda Dry Fruits",
    nameHindi: "नंदा ड्राई फ्रूट्स",
    category: "Nanda Agro Farm",
    address: "Risali, Bhilai",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2170,
    lng: 81.3836,
    whatsapp: "918305161361",
    phone: "918305161361",
    photos: [],
    verified: true,
    premium: true,
    flagship: true,
    tagline: "बादाम, काजू, किशमिश, अखरोट — Premium Quality",
    priceLabel: "Wholesale + Retail rates",
    rating: 4.8,
    reviewCount: 47,
    reviews: [],
    description: "प्रीमियम क्वालिटी ड्राई फ्रूट्स — सीधा फार्म पैकिंग। बादाम, काजू, किशमिश, अखरोट, अंजीर — सब कुछ available।",
  },
  {
    id: "nanda-rishi-bhok-atta",
    name: "Rishi Bhok Atta",
    nameHindi: "ऋषि भोग आटा",
    category: "Nanda Agro Farm",
    address: "Risali, Bhilai",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2171,
    lng: 81.3837,
    whatsapp: "918305161361",
    phone: "918305161361",
    photos: ["/src/assets/nanda-rishi-bhok-atta.png"],
    verified: true,
    premium: true,
    flagship: true,
    heroImage: "/src/assets/nanda-rishi-bhok-atta.png",
    tagline: "ऋषि मुनियों का आहार — 5-तत्व आयुर्वेदिक पाचक मिश्रण",
    priceLabel: "₹60 / 1 KG  •  ₹300 / 5 KG",
    rating: 5.0,
    reviewCount: 211,
    reviews: [],
    description: "गेहूं, जौ, चना, मेथी और सोंठ का संतुलित आयुर्वेदिक मेल। रोज़ाना सेवन से पाचन शक्ति बढ़ाएँ। FSSAI Approved, चक्की फ्रेश आटा।",
  },
  {
    id: "nanda-acqua",
    name: "Nanda Acqua Mineral Water",
    nameHindi: "नंदा एक्वा मिनरल वाटर",
    category: "Nanda Agro Farm",
    address: "Risali, Bhilai",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2172,
    lng: 81.3838,
    whatsapp: "918305161361",
    phone: "918305161361",
    photos: ["/src/assets/nanda-acqua.jpg"],
    verified: true,
    premium: true,
    flagship: true,
    heroImage: "/src/assets/nanda-acqua.jpg",
    tagline: "एक लीटर शुद्ध पानी — Only ₹20",
    priceLabel: "₹20 / 1 LTR",
    rating: 4.9,
    reviewCount: 64,
    reviews: [],
    description: "100% शुद्ध मिनरल वाटर — Multi-stage RO + UV purification। Bulk orders, events, और daily home delivery उपलब्ध।",
  },
];

// ─── Category Sections ───
export interface CategorySection {
  sectionName: string;
  sectionNameHindi: string;
  categories: string[];
}

export const categorySections: CategorySection[] = [
  // ═══════════════ SHOPS ═══════════════
  {
    sectionName: "Daily Needs",
    sectionNameHindi: "दैनिक ज़रूरतें",
    categories: [
      "General Store",
      "Vegetables & Fruits",
      "Milk & Dairy",
      "Bakery",
      "Mithai & Sweets",
    ],
  },
  {
    sectionName: "Food & Street Food",
    sectionNameHindi: "खाना और स्ट्रीट फूड",
    categories: [
      "Fast Food",
      "Snacks & Chaat",
      "Momos",
      "Paan & Tea Stall (पान-चाय)",
    ],
  },
  {
    sectionName: "Non-Veg Market",
    sectionNameHindi: "नॉन-वेज बाजार",
    categories: [
      "Poultry & Chicken (मुर्गा)",
      "Fish Market (मछली बाजार)",
      "Meat Shop (मटन शॉप)",
    ],
  },
  {
    sectionName: "Shopping",
    sectionNameHindi: "खरीदारी",
    categories: [
      "Clothing & Fashion",
      "Footwear",
      "Jewelry",
      "Gift Items",
      "Toys",
    ],
  },
  {
    sectionName: "Specialized Shops",
    sectionNameHindi: "विशेष दुकानें",
    categories: [
      "Hardware & Paints",
      "Stationery & Photocopy",
    ],
  },
  {
    sectionName: "Health & Wellness",
    sectionNameHindi: "स्वास्थ्य",
    categories: [
      "Pharmacy",
      "Doctor (डॉक्टर)",
      "Hospital (अस्पताल)",
      "Ambulance (एम्बुलेंस)",
      "Ayurvedic Shop (आयुर्वेदिक दुकान)",
      "Massage Center (मसाज सेंटर)",
    ],
  },
  {
    sectionName: "Electronics & Tech",
    sectionNameHindi: "इलेक्ट्रॉनिक्स और टेक",
    categories: [
      "Electronics",
      "Mobile & Electronics Repair",
      "Mobile Recharge & Repair",
      "Computer Services",
      "Cyber Cafe",
    ],
  },
  // ═══════════════ SERVICES ═══════════════
  {
    sectionName: "Home Services",
    sectionNameHindi: "घरेलू सेवाएं",
    categories: [
      "Plumber (प्लंबर)",
      "Electrician (इलेक्ट्रीशियन)",
      "Mason (मिस्त्री)",
      "Painter (पेंटर)",
    ],
  },
  {
    sectionName: "Daily Services",
    sectionNameHindi: "रोज़मर्रा की सेवाएं",
    categories: [
      "Salon & Barber",
      "Beauty Parlour (ब्यूटी पार्लर)",

      "Laundry / Dry Clean (धोबी)",
      "Tailor (दरजी)",
      "Car/Bike Mechanic",
      "Key Maker (चाबी वाला)",
      "Cobbler (मोची)",
      "Umbrella Repair",
      "Stove/Gas Repair",
      "Knife Sharpening (धार वाला)",
      "Scrap Dealer (कबाड़ी वाला)",
    ],
  },
  {
    sectionName: "Education",
    sectionNameHindi: "शिक्षा",
    categories: [
      "School (स्कूल)",
      "College (कॉलेज)",
      "Computer Training Center (कंप्यूटर ट्रेनिंग सेंटर)",
      "Home Tutors (ट्यूशन)",
      "Coaching Centers (कोचिंग)",
    ],
  },
  {
    sectionName: "Banking & Insurance",
    sectionNameHindi: "बैंकिंग और बीमा",
    categories: [
      "Life Insurance (LIC)",
      "Car/Bike Insurance",
      "Health Insurance",
      "General Insurance Agent",
      "Personal Loan Agent",
      "Home Loan Consultant",
      "Mutual Fund/SIP Advisor",
      "Share Market Expert",
      "Tax/GST Consultant (CA)",
      "Banking Correspondent (BC)",
      "Mini-Bank/Aadhaar ATM",
      "Credit Card Agent",
    ],
  },
  {
    sectionName: "Sanitation & Labor",
    sectionNameHindi: "स्वच्छता और जमीनी सेवाएं",
    categories: [
      "Gutter/Nali Cleaning (नाली-गटर सफाई)",
      "Septic Tank Cleaning",
      "Garbage Collection",
      "Public Toilet Maintenance",
      "Daily Wage Workers (मजदूर)",
      "Loading/Unloading Labor",
      "Palle-Dar",
      "Warehouse Worker",
    ],
  },
  {
    sectionName: "Professional & Digital",
    sectionNameHindi: "प्राइवेट और डिजिटल",
    categories: [
      "Graphic Designer",
      "Video Editor",
      "Digital Marketing",
      "Data Entry",
    ],
  },
  {
    sectionName: "Security & Events",
    sectionNameHindi: "सुरक्षा और इवेंट",
    categories: [
      "Security Guard Agency",
      "Bodyguard",
      "Bouncers for Events",
      "Tent House",
      "DJ/Sound",
      "Light Decor",
    ],
  },
  // ═══════════════ RENTALS ═══════════════
  {
    sectionName: "Vehicle Rentals",
    sectionNameHindi: "वाहन किराया",
    categories: [
      "Car & Bike Rent (कार-बाइक किराया)",
      "Heavy Vehicle / Truck Rent (ट्रक किराया)",
      "Car/Travels on Rent",
    ],
  },
  {
    sectionName: "Agriculture & Farming",
    sectionNameHindi: "कृषि और खेती",
    categories: [
      "Tractor on Rent",
      "Pesticide Spraying",
      "Harvester Service",
      "Veterinary (पशु डॉक्टर)",
      "Seeds & Fertilizers (बीज-खाद)",
      "Animal Feed (पशु आहार)",
      "Dairy Farm (डेयरी फार्म)",
    ],
  },
  {
    sectionName: "Transport & Vehicles",
    sectionNameHindi: "वाहन और रिपेयर",
    categories: [
      "Auto / E-Rickshaw / Taxi (ऑटो / ई-रिक्शा / टैक्सी)",
      "Bike Taxi (बाइक टैक्सी)",
      "Travel Agency / Tour Package (ट्रेवल एजेंसी)",
      "Cycle Store (साइकिल स्टोर)",
      "Cycle Repair (साइकिल रिपेयर)",
      "Two Wheeler Spare Parts",
    ],
  },

  {
    sectionName: "Real Estate",
    sectionNameHindi: "रियल एस्टेट",
    categories: [
      "Property Dealer",
      "Plot/Flat Sales",
      "Rental Broker",
    ],
  },
  {
    sectionName: "Accommodation & Food",
    sectionNameHindi: "रहना और खाना",
    categories: [
      "Boys PG (पेइंग गेस्ट)",
      "Girls PG (पेइंग गेस्ट)",
      "Student Hostel (हॉस्टल)",
      "Tiffin Service / Mess (मेस)",
      "Home-Made Food (घर का खाना)",
    ],
  },
  {
    sectionName: "Home & Hospitality",
    sectionNameHindi: "घरेलू सेवा और देखभाल",
    categories: [
      "Maid / काम वाली बाई",
      "Baby Sitter / बच्चा संभालने वाली",
      "Caretaker / बुजुर्गों की देखभाल",
      "Cook / खाना बनाने वाली",
    ],
  },
  {
    sectionName: "Other",
    sectionNameHindi: "अन्य",
    categories: [
      "Other",
    ],
  },
];

// Flat list of all categories (deduplicated)
export const shopCategories: string[] = [...new Set(categorySections.flatMap((s) => s.categories))];

export const categoryIcons: Record<string, string> = {
  "Nanda Agro Farm": "🌾",
  "General Store": "🛒",
  "Clothing & Fashion": "👗",
  "Electronics": "📱",
  "Pharmacy": "💊",
  "Salon & Barber": "✂️",
  "Fast Food": "🍔",
  "Hardware & Paints": "🔧",
  "Vegetables & Fruits": "🥦",
  "Milk & Dairy": "🥛",
  "Bakery": "🍞",
  "Mithai & Sweets": "🍬",
  "Snacks & Chaat": "🍿",
  "Momos": "🥟",
  "Car/Bike Mechanic": "🔩",
  "Gift Items": "🎁",
  "Jewelry": "💎",
  "Footwear": "👟",
  "Toys": "🧸",
  "Mobile Recharge & Repair": "📲",
  "Computer Services": "💻",
  "Cyber Cafe": "🖥️",
  "Other": "🏪",
  // Non-Veg Market
  "Poultry & Chicken (मुर्गा)": "🐔",
  "Fish Market (मछली बाजार)": "🐟",
  "Meat Shop (मटन शॉप)": "🥩",
  // Specialized Shops
  "Stationery & Photocopy": "📝",
  "Paan & Tea Stall (पान-चाय)": "🍵",
  // Home Services
  "Plumber (प्लंबर)": "🪠",
  "Electrician (इलेक्ट्रीशियन)": "⚡",
  "Mason (मिस्त्री)": "🧱",
  "Painter (पेंटर)": "🖌️",
  // Daily Services
  "Laundry / Dry Clean (धोबी)": "👔",
  "Tailor (दरजी)": "🧵",
  "Mobile & Electronics Repair": "🔌",
  "Key Maker (चाबी वाला)": "🔐",
  "Cobbler (मोची)": "👞",
  "Umbrella Repair": "☂️",
  "Stove/Gas Repair": "🔥",
  "Knife Sharpening (धार वाला)": "🔪",
  "Scrap Dealer (कबाड़ी वाला)": "♻️",
  // Health & Wellness
  "Doctor (डॉक्टर)": "🩺",
  "Hospital (अस्पताल)": "🏥",
  "Ambulance (एम्बुलेंस)": "🚑",
  "Ayurvedic Shop (आयुर्वेदिक दुकान)": "🌿",
  "Massage Center (मसाज सेंटर)": "💆",
  // Education
  "School (स्कूल)": "🏫",
  "College (कॉलेज)": "🎓",
  "Computer Training Center (कंप्यूटर ट्रेनिंग सेंटर)": "🖥️",
  "Home Tutors (ट्यूशन)": "📖",
  "Coaching Centers (कोचिंग)": "📚",
  // Vehicle Rentals
  "Car & Bike Rent (कार-बाइक किराया)": "🚗",
  "Heavy Vehicle / Truck Rent (ट्रक किराया)": "🚛",
  "Car/Travels on Rent": "🚘",
  // Transport
  "Auto / E-Rickshaw / Taxi (ऑटो / ई-रिक्शा / टैक्सी)": "🛺",
  "Bike Taxi (बाइक टैक्सी)": "🏍️",
  "Travel Agency / Tour Package (ट्रेवल एजेंसी)": "🧳",
  "Beauty Parlour (ब्यूटी पार्लर)": "💄",
  // Agriculture
  "Tractor on Rent": "🚜",
  "Pesticide Spraying": "🌾",
  "Harvester Service": "🌿",
  "Veterinary (पशु डॉक्टर)": "🐄",
  "Seeds & Fertilizers (बीज-खाद)": "🌱",
  "Animal Feed (पशु आहार)": "🐃",
  "Dairy Farm (डेयरी फार्म)": "🐮",
  // Banking & Insurance
  "Life Insurance (LIC)": "🛡️",
  "Car/Bike Insurance": "🚗",
  "Health Insurance": "🏥",
  "General Insurance Agent": "📋",
  "Personal Loan Agent": "💰",
  "Home Loan Consultant": "🏠",
  "Mutual Fund/SIP Advisor": "📈",
  "Share Market Expert": "📊",
  "Tax/GST Consultant (CA)": "🧾",
  "Banking Correspondent (BC)": "🏦",
  "Mini-Bank/Aadhaar ATM": "🏧",
  "Credit Card Agent": "💳",
  // Sanitation & Labor
  "Gutter/Nali Cleaning (नाली-गटर सफाई)": "🧹",
  "Septic Tank Cleaning": "🚰",
  "Garbage Collection": "🗑️",
  "Public Toilet Maintenance": "🚻",
  "Daily Wage Workers (मजदूर)": "👷",
  "Loading/Unloading Labor": "📦",
  "Palle-Dar": "🏋️",
  "Warehouse Worker": "🏭",
  // Professional & Digital
  "Graphic Designer": "🎨",
  "Video Editor": "🎬",
  "Digital Marketing": "📣",
  "Data Entry": "⌨️",
  // Security & Events
  "Security Guard Agency": "🛡️",
  "Bodyguard": "🕶️",
  "Bouncers for Events": "💪",
  "Tent House": "⛺",
  "DJ/Sound": "🎵",
  "Light Decor": "💡",
  // Transport & Vehicles
  "Cycle Store (साइकिल स्टोर)": "🚲",
  "Cycle Repair (साइकिल रिपेयर)": "🔧",
  "Two Wheeler Spare Parts": "🏍️",
  // Real Estate
  "Property Dealer": "🏘️",
  "Plot/Flat Sales": "🏗️",
  "Rental Broker": "🔑",
  // Accommodation & Food
  "Boys PG (पेइंग गेस्ट)": "🏠",
  "Girls PG (पेइंग गेस्ट)": "🏡",
  "Student Hostel (हॉस्टल)": "🏢",
  "Tiffin Service / Mess (मेस)": "🍱",
  "Home-Made Food (घर का खाना)": "🍲",
  // Home & Hospitality
  "Maid / काम वाली बाई": "🧹",
  "Baby Sitter / बच्चा संभालने वाली": "👶",
  "Caretaker / बुजुर्गों की देखभाल": "🧓",
  "Cook / खाना बनाने वाली": "👩‍🍳",
};
