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
  rating: number;
  reviewCount: number;
  reviews: Review[];
  description: string;
}

export const sampleShops: Shop[] = [
  {
    id: "1",
    name: "Sharma General Store",
    nameHindi: "शर्मा जनरल स्टोर",
    category: "General Store",
    address: "Main Road, Risali",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2167,
    lng: 81.3833,
    whatsapp: "919876543210",
    phone: "919876543210",
    photos: [],
    verified: true,
    premium: true,
    rating: 4.5,
    reviewCount: 28,
    reviews: [
      { id: "r1", userName: "Rahul", rating: 5, comment: "बहुत अच्छी दुकान!", date: "2026-02-15" },
      { id: "r2", userName: "Priya", rating: 4, comment: "Good quality products.", date: "2026-02-20" },
    ],
    description: "Your trusted neighborhood kirana store with daily essentials, groceries, snacks, and household items.",
  },
  {
    id: "2",
    name: "Gupta Cloth House",
    nameHindi: "गुप्ता क्लॉथ हाउस",
    category: "Clothing & Fashion",
    address: "Nehru Nagar",
    city: "New Delhi",
    pincode: "110001",
    lat: 28.6139,
    lng: 77.2090,
    whatsapp: "919876543211",
    phone: "919876543211",
    photos: [],
    verified: true,
    rating: 4.3,
    reviewCount: 15,
    reviews: [],
    description: "Wide range of men's, women's, and kids' clothing. Best quality fabrics at affordable prices.",
  },
  {
    id: "3",
    name: "Patel Electronics",
    nameHindi: "पटेल इलेक्ट्रॉनिक्स",
    category: "Electronics",
    address: "Station Road",
    city: "New Delhi",
    pincode: "110002",
    lat: 28.6200,
    lng: 77.2100,
    whatsapp: "919876543212",
    phone: "919876543212",
    photos: [],
    verified: false,
    rating: 4.0,
    reviewCount: 8,
    reviews: [],
    description: "Mobile phones, accessories, repair services, and all electronic items at competitive prices.",
  },
  {
    id: "4",
    name: "Jain Medical Store",
    nameHindi: "जैन मेडिकल स्टोर",
    category: "Pharmacy",
    address: "MG Road",
    city: "Bengaluru",
    pincode: "560001",
    lat: 12.9716,
    lng: 77.5946,
    whatsapp: "919876543213",
    phone: "919876543213",
    photos: [],
    verified: true,
    rating: 4.7,
    reviewCount: 42,
    reviews: [
      { id: "r3", userName: "Anita", rating: 5, comment: "Fast delivery and genuine medicines.", date: "2026-03-01" },
    ],
    description: "All medicines, health supplements, and medical supplies. Free home delivery on orders above ₹200.",
  },
  {
    id: "5",
    name: "Singh Hardware",
    nameHindi: "सिंह हार्डवेयर",
    category: "Hardware",
    address: "Sector 22",
    city: "Chandigarh",
    pincode: "160022",
    lat: 30.7333,
    lng: 76.7794,
    whatsapp: "919876543214",
    phone: "919876543214",
    photos: [],
    verified: true,
    rating: 4.2,
    reviewCount: 12,
    reviews: [],
    description: "Complete hardware solutions - tools, plumbing, electrical, and construction materials.",
  },
  {
    id: "6",
    name: "Bhojanshala Restaurant",
    nameHindi: "भोजनशाला रेस्टोरेंट",
    category: "Fast Food",
    address: "MI Road",
    city: "Jaipur",
    pincode: "302001",
    lat: 26.9124,
    lng: 75.7873,
    whatsapp: "919876543215",
    phone: "919876543215",
    photos: [],
    verified: true,
    rating: 4.6,
    reviewCount: 55,
    reviews: [],
    description: "Delicious North Indian thali, snacks, and street food. Pure vegetarian. Family restaurant.",
  },
  {
    id: "7",
    name: "LIC Agent - Ramesh Verma",
    nameHindi: "LIC एजेंट - रमेश वर्मा",
    category: "Life Insurance (LIC)",
    address: "Civil Lines",
    city: "Bhilai",
    pincode: "490006",
    lat: 21.2100,
    lng: 81.3800,
    whatsapp: "919876543220",
    phone: "919876543220",
    photos: [],
    verified: true,
    rating: 4.4,
    reviewCount: 18,
    reviews: [],
    description: "LIC policies, Jeevan Bima, term insurance, and pension plans. 15+ years experience.",
  },
  {
    id: "8",
    name: "Chauhan Tractor Service",
    nameHindi: "चौहान ट्रैक्टर सर्विस",
    category: "Tractor on Rent",
    address: "Village Road",
    city: "Durg",
    pincode: "491001",
    lat: 21.1900,
    lng: 81.2800,
    whatsapp: "919876543221",
    phone: "919876543221",
    photos: [],
    verified: false,
    rating: 4.1,
    reviewCount: 6,
    reviews: [],
    description: "Tractor on rent for farming, construction. Harvester and trolley also available.",
  },
];

// ─── Category Sections ───
export interface CategorySection {
  sectionName: string;
  sectionNameHindi: string;
  categories: string[];
}

export const categorySections: CategorySection[] = [
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
      "Stationery",
    ],
  },
  {
    sectionName: "Health & Wellness",
    sectionNameHindi: "स्वास्थ्य",
    categories: [
      "Pharmacy",
      "Salon & Barber",
    ],
  },
  {
    sectionName: "Electronics & Tech",
    sectionNameHindi: "इलेक्ट्रॉनिक्स और टेक",
    categories: [
      "Electronics",
      "Mobile Recharge & Repair",
      "Computer Services",
      "Cyber Cafe",
    ],
  },
  {
    sectionName: "Home & Hardware",
    sectionNameHindi: "घर और हार्डवेयर",
    categories: [
      "Hardware",
      "Electrician",
      "Plumber",
    ],
  },
  {
    sectionName: "Services",
    sectionNameHindi: "सेवाएं",
    categories: [
      "Tailor",
      "Car/Bike Mechanic",
      "Key Maker (चाबी वाला)",
      "Cobbler (मोची)",
      "Umbrella Repair",
      "Stove/Gas Repair",
      "Knife Sharpening (धार वाला)",
    ],
  },
  {
    sectionName: "Banking & Insurance (बैंकिंग और बीमा)",
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
    sectionName: "Sanitation & Labor (स्वच्छता और जमीनी सेवाएं)",
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
    sectionName: "Agriculture (कृषि)",
    sectionNameHindi: "कृषि",
    categories: [
      "Tractor on Rent",
      "Pesticide Spraying",
      "Harvester Service",
      "Veterinary (पशु डॉक्टर)",
    ],
  },
  {
    sectionName: "Professional & Digital (प्राइवेट और डिजिटल)",
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
      "Car/Travels on Rent",
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
    sectionName: "Accommodation & Food (रहना और खाना)",
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
    sectionName: "Transport & Vehicles (वाहन और रिपेयर)",
    sectionNameHindi: "वाहन और रिपेयर",
    categories: [
      "Cycle Store (साइकिल स्टोर)",
      "Cycle Repair (साइकिल रिपेयर)",
      "Two Wheeler Spare Parts",
    ],
  },
  {
    sectionName: "Home & Hospitality (घरेलू सेवा)",
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

// Flat list of all categories
export const shopCategories: string[] = categorySections.flatMap((s) => s.categories);

export const categoryIcons: Record<string, string> = {
  "General Store": "🛒",
  "Clothing & Fashion": "👗",
  "Electronics": "📱",
  "Pharmacy": "💊",
  "Salon & Barber": "✂️",
  "Fast Food": "🍔",
  "Stationery": "📚",
  "Hardware": "🔧",
  "Vegetables & Fruits": "🥦",
  "Milk & Dairy": "🥛",
  "Bakery": "🍞",
  "Mithai & Sweets": "🍬",
  "Snacks & Chaat": "🍿",
  "Momos": "🥟",
  "Car/Bike Mechanic": "🔩",
  "Electrician": "⚡",
  "Plumber": "🪠",
  "Tailor": "🧵",
  "Gift Items": "🎁",
  "Jewelry": "💎",
  "Footwear": "👟",
  "Toys": "🧸",
  "Mobile Recharge & Repair": "📲",
  "Computer Services": "💻",
  "Cyber Cafe": "🖥️",
  "Other": "🏪",
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
  // Agriculture
  "Tractor on Rent": "🚜",
  "Pesticide Spraying": "🌾",
  "Harvester Service": "🌿",
  "Veterinary (पशु डॉक्टर)": "🐄",
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
  "Car/Travels on Rent": "🚘",
  // Real Estate
  "Property Dealer": "🏘️",
  "Plot/Flat Sales": "🏗️",
  "Rental Broker": "🔑",
  // Zero-gap
  "Key Maker (चाबी वाला)": "🔐",
  "Cobbler (मोची)": "👞",
  "Umbrella Repair": "☂️",
  "Stove/Gas Repair": "🔥",
  "Knife Sharpening (धार वाला)": "🔪",
  // Accommodation & Food
  "Boys PG (पेइंग गेस्ट)": "🏠",
  "Girls PG (पेइंग गेस्ट)": "🏡",
  "Student Hostel (हॉस्टल)": "🏢",
  "Tiffin Service / Mess (मेस)": "🍱",
  "Home-Made Food (घर का खाना)": "🍲",
  // Transport & Vehicles
  "Cycle Store (साइकिल स्टोर)": "🚲",
  "Cycle Repair (साइकिल रिपेयर)": "🔧",
  "Two Wheeler Spare Parts": "🏍️",
  // Home & Hospitality
  "Maid / काम वाली बाई": "🧹",
  "Baby Sitter / बच्चा संभालने वाली": "👶",
  "Caretaker / बुजुर्गों की देखभाल": "🧓",
  "Cook / खाना बनाने वाली": "👩‍🍳",
};
