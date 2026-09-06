/**
 * Category-driven dynamic registration fields + search aliases.
 *
 * The merchant registration forms pick the category FIRST and then render the
 * extra fields defined here right underneath the universal fields.
 */

export type CategoryFieldType = "text" | "textarea" | "number" | "select" | "multiselect" | "photo";

export interface CategoryField {
  key: string;
  label: string;
  labelHindi: string;
  type: CategoryFieldType;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

export interface CategoryFieldGroup {
  /** Lowercase keywords — if any matches the selected category, the group applies. */
  match: string[];
  title: string;
  titleHindi: string;
  fields: CategoryField[];
  /** Extra search tags always attached to merchants in this group. */
  tags: string[];
}

export const CATEGORY_FIELD_GROUPS: CategoryFieldGroup[] = [
  {
    match: ["auto", "e-rickshaw", "rickshaw", "taxi", "cab", "driver"],
    title: "Vehicle & Driver Details",
    titleHindi: "गाड़ी और ड्राइवर की जानकारी",
    tags: ["auto", "e-rickshaw", "ई-रिक्शा", "रिक्शा", "टैक्सी", "taxi", "cab", "ride", "सवारी"],
    fields: [
      { key: "vehicle_type", label: "Vehicle Type", labelHindi: "गाड़ी का प्रकार", type: "select", required: true, options: ["E-Rickshaw (ई-रिक्शा)", "Auto Rickshaw (ऑटो)", "Taxi / Cab (टैक्सी)", "Bike Taxi (बाइक टैक्सी)", "Tempo / Loading Auto"] },
      { key: "vehicle_number", label: "Vehicle Number", labelHindi: "गाड़ी नंबर", type: "text", required: true, placeholder: "CG07 AB 1234" },
      { key: "driving_license", label: "Driving Licence Number", labelHindi: "ड्राइविंग लाइसेंस नंबर", type: "text", required: true, placeholder: "CG0720230001234" },
      { key: "permit_number", label: "Permit / RC Number", labelHindi: "परमिट / आरसी नंबर", type: "text", placeholder: "Permit or RC number" },
      { key: "seating_capacity", label: "Seating Capacity", labelHindi: "सवारी क्षमता", type: "number", placeholder: "4" },
      { key: "service_area", label: "Service Area / Route", labelHindi: "सेवा क्षेत्र / रूट", type: "text", placeholder: "Bhilai — Durg — Station" },
      { key: "fare_note", label: "Fare Details", labelHindi: "किराया", type: "text", placeholder: "₹20 per km / ₹300 per trip" },
      { key: "vehicle_photo", label: "Vehicle Photo", labelHindi: "गाड़ी का फ़ोटो", type: "photo", required: true },
      { key: "license_photo", label: "Driving Licence Photo", labelHindi: "लाइसेंस का फ़ोटो", type: "photo" },
    ],
  },
  {
    match: ["fish", "meat", "poultry", "chicken", "मछली", "मटन", "मुर्गा"],
    title: "Available Items",
    titleHindi: "उपलब्ध सामान",
    tags: ["fish", "meat", "chicken", "मछली", "मटन", "मुर्गा", "non-veg"],
    fields: [
      { key: "items", label: "Types available", labelHindi: "कौन-कौन से प्रकार उपलब्ध हैं", type: "multiselect", required: true, options: ["Rohu (रोहू)", "Katla (कतला)", "Prawn (झींगा)", "Surmai / Sea Fish", "Chicken (मुर्गा)", "Desi Chicken (देसी मुर्गा)", "Mutton (मटन)", "Eggs (अंडा)", "Fish Fry / Ready to Cook"] },
      { key: "price_list", label: "Rate list", labelHindi: "रेट लिस्ट", type: "textarea", placeholder: "Rohu ₹180/kg, Mutton ₹700/kg" },
      { key: "fresh_cut", label: "Fresh cutting / home delivery", labelHindi: "ताज़ा कटाई / होम डिलीवरी", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
    ],
  },
  {
    match: ["beauty", "parlour", "parlor", "salon", "barber", "massage", "spa"],
    title: "Services Offered",
    titleHindi: "दी जाने वाली सेवाएँ",
    tags: ["beauty", "parlour", "salon", "ब्यूटी", "पार्लर", "मेकअप", "हेयर"],
    fields: [
      { key: "services", label: "Services", labelHindi: "सेवाएँ", type: "multiselect", required: true, options: ["Haircut (हेयर कट)", "Facial (फेशियल)", "Bridal Makeup (ब्राइडल मेकअप)", "Threading / Waxing", "Hair Colour / Spa", "Mehndi (मेहंदी)", "Massage (मसाज)", "Men's Grooming"] },
      { key: "service_description", label: "Service description", labelHindi: "सेवाओं का विवरण", type: "textarea", required: true, placeholder: "Describe packages, timing, speciality" },
      { key: "price_range", label: "Price range", labelHindi: "कीमत", type: "text", placeholder: "₹100 - ₹5000" },
      { key: "home_service", label: "Home service available", labelHindi: "घर पर सेवा", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
    ],
  },
  {
    match: ["travel", "tour", "rent", "किराया", "truck", "tractor", "car"],
    title: "Travel / Rental Details",
    titleHindi: "ट्रेवल / किराया जानकारी",
    tags: ["travel", "ट्रेवल", "tour", "rent", "किराया", "booking", "गाड़ी"],
    fields: [
      { key: "vehicles", label: "Vehicles available", labelHindi: "उपलब्ध गाड़ियाँ", type: "multiselect", required: true, options: ["Hatchback", "Sedan", "SUV / Innova", "Tempo Traveller", "Bus", "Bike / Scooty", "Truck", "Tractor"] },
      { key: "routes", label: "Routes / Destinations", labelHindi: "रूट / जगह", type: "text", placeholder: "Bhilai — Raipur Airport, Local, Outstation" },
      { key: "rate", label: "Rate", labelHindi: "किराया", type: "text", placeholder: "₹12/km, ₹2500/day" },
      { key: "driver_included", label: "Driver included", labelHindi: "ड्राइवर सहित", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
    ],
  },
  {
    match: ["maid", "बाई", "baby sitter", "caretaker", "cook", "खाना", "tiffin", "mess"],
    title: "Work & Availability",
    titleHindi: "काम और उपलब्धता",
    tags: ["maid", "काम वाली बाई", "बाई", "househelp", "cook", "खाना बनाने वाली", "tiffin", "मेस"],
    fields: [
      { key: "work_types", label: "Work types", labelHindi: "कौन-सा काम", type: "multiselect", required: true, options: ["Cleaning / झाड़ू-पोंछा", "Utensils / बर्तन", "Cooking / खाना बनाना", "Baby Care / बच्चा संभालना", "Elder Care / बुजुर्ग देखभाल", "Tiffin Supply / टिफिन"] },
      { key: "timing", label: "Working hours", labelHindi: "काम का समय", type: "text", placeholder: "8 AM - 12 PM" },
      { key: "monthly_charge", label: "Monthly charge", labelHindi: "मासिक शुल्क", type: "text", placeholder: "₹3000 / month" },
      { key: "experience", label: "Experience", labelHindi: "अनुभव", type: "text", placeholder: "5 years" },
    ],
  },
  {
    match: ["plumber", "electrician", "mason", "painter", "mechanic", "repair", "cleaning", "labor", "labour", "मजदूर"],
    title: "Service Details",
    titleHindi: "सेवा की जानकारी",
    tags: ["service", "repair", "मरम्मत", "मिस्त्री"],
    fields: [
      { key: "service_description", label: "Work you do", labelHindi: "आप कौन-सा काम करते हैं", type: "textarea", required: true, placeholder: "Describe your work / specialisation" },
      { key: "visiting_charge", label: "Visiting charge", labelHindi: "विजिटिंग चार्ज", type: "text", placeholder: "₹200" },
      { key: "experience", label: "Experience (years)", labelHindi: "अनुभव (साल)", type: "number", placeholder: "5" },
      { key: "available_24x7", label: "Emergency 24x7", labelHindi: "इमरजेंसी 24x7", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
    ],
  },
  {
    match: ["pharmacy", "doctor", "hospital", "ambulance", "ayurvedic", "veterinary"],
    title: "Clinic / Medical Details",
    titleHindi: "क्लिनिक / मेडिकल जानकारी",
    tags: ["health", "medical", "डॉक्टर", "दवा"],
    fields: [
      { key: "speciality", label: "Speciality", labelHindi: "विशेषज्ञता", type: "text", required: true, placeholder: "General Physician / Ayurveda" },
      { key: "timings", label: "OPD / Shop timings", labelHindi: "समय", type: "text", placeholder: "9 AM - 9 PM" },
      { key: "emergency", label: "Emergency service", labelHindi: "इमरजेंसी सेवा", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
      { key: "reg_number", label: "Registration / Licence number", labelHindi: "रजिस्ट्रेशन नंबर", type: "text" },
    ],
  },
  {
    match: ["school", "college", "coaching", "tutor", "training", "computer training"],
    title: "Institute Details",
    titleHindi: "संस्थान की जानकारी",
    tags: ["education", "पढ़ाई", "coaching", "ट्यूशन"],
    fields: [
      { key: "courses", label: "Courses / Classes", labelHindi: "कोर्स / कक्षाएँ", type: "textarea", required: true, placeholder: "Class 6-12, PGDCA, Tally" },
      { key: "fees", label: "Fees", labelHindi: "फीस", type: "text", placeholder: "₹500/month" },
      { key: "batch_timing", label: "Batch timings", labelHindi: "बैच का समय", type: "text" },
    ],
  },
  {
    match: ["food", "restaurant", "bakery", "sweet", "mithai", "snack", "momos", "tea", "paan", "dairy", "milk"],
    title: "Menu & Timings",
    titleHindi: "मेन्यू और समय",
    tags: ["food", "खाना", "नाश्ता"],
    fields: [
      { key: "menu_items", label: "Popular items", labelHindi: "मुख्य आइटम", type: "textarea", required: true, placeholder: "Samosa ₹10, Thali ₹80" },
      { key: "timings", label: "Open timings", labelHindi: "खुलने का समय", type: "text", placeholder: "7 AM - 10 PM" },
      { key: "delivery", label: "Home delivery", labelHindi: "होम डिलीवरी", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
      { key: "veg_nonveg", label: "Veg / Non-Veg", labelHindi: "वेज / नॉन-वेज", type: "select", options: ["Pure Veg", "Veg & Non-Veg", "Non-Veg only"] },
    ],
  },
  {
    match: ["property", "plot", "flat", "rental broker", "pg", "hostel"],
    title: "Property Details",
    titleHindi: "प्रॉपर्टी की जानकारी",
    tags: ["property", "मकान", "किराया", "pg", "hostel"],
    fields: [
      { key: "property_types", label: "Property types", labelHindi: "प्रॉपर्टी प्रकार", type: "multiselect", required: true, options: ["Plot", "Flat", "House", "Shop", "PG / Hostel", "Godown"] },
      { key: "budget_range", label: "Budget range", labelHindi: "बजट", type: "text", placeholder: "₹5,000 - ₹50 Lakh" },
      { key: "areas", label: "Areas covered", labelHindi: "क्षेत्र", type: "text" },
    ],
  },
];

/** Fields shown when no specialised group matches the chosen category. */
export const GENERIC_CATEGORY_FIELDS: CategoryField[] = [
  { key: "main_items", label: "Main items / services you offer", labelHindi: "आप क्या बेचते या सेवा देते हैं", type: "textarea", required: true, placeholder: "List your main items or services" },
  { key: "timings", label: "Open timings", labelHindi: "खुलने का समय", type: "text", placeholder: "9 AM - 9 PM" },
  { key: "home_delivery", label: "Home delivery", labelHindi: "होम डिलीवरी", type: "select", options: ["Yes (हाँ)", "No (नहीं)"] },
];

export const getCategoryGroup = (category: string): CategoryFieldGroup | null => {
  const c = (category || "").toLowerCase();
  if (!c) return null;
  return CATEGORY_FIELD_GROUPS.find((g) => g.match.some((m) => c.includes(m))) ?? null;
};

export const getCategoryFields = (category: string): CategoryField[] => {
  const group = getCategoryGroup(category);
  return group ? group.fields : category ? GENERIC_CATEGORY_FIELDS : [];
};

/** Build searchable tags from a category + its dynamic answers. */
export const buildServiceTags = (category: string, details: Record<string, unknown>): string[] => {
  const tags = new Set<string>();
  const push = (v: string) => {
    const clean = v.trim().toLowerCase();
    if (clean && clean.length <= 60) tags.add(clean);
  };
  if (category) {
    push(category);
    category.split(/[/,()&]|\s-\s/).forEach((part) => push(part));
  }
  getCategoryGroup(category)?.tags.forEach(push);
  Object.values(details || {}).forEach((value) => {
    if (typeof value === "string") value.split(/[,\n]/).forEach(push);
    else if (Array.isArray(value)) value.forEach((v) => typeof v === "string" && push(v));
  });
  return [...tags].slice(0, 60);
};

/**
 * Hindi / colloquial query terms mapped to the words we should also match on.
 * Lets "ई-रिक्शा चाहिए", "काम वाली बाई" or "ट्रेवल" find the right merchants.
 */
export const SEARCH_ALIASES: Record<string, string[]> = {
  "ई-रिक्शा": ["e-rickshaw", "rickshaw", "auto", "टैक्सी"],
  "ईरिक्शा": ["e-rickshaw", "rickshaw", "auto"],
  "रिक्शा": ["rickshaw", "e-rickshaw", "auto"],
  "ऑटो": ["auto", "rickshaw", "taxi"],
  "टैक्सी": ["taxi", "cab", "auto"],
  "सवारी": ["taxi", "auto", "rickshaw"],
  "erickshaw": ["e-rickshaw", "rickshaw", "auto"],
  "rickshaw": ["रिक्शा", "ई-रिक्शा", "auto"],
  "taxi": ["टैक्सी", "cab", "auto"],
  "cab": ["taxi", "टैक्सी"],
  "ट्रेवल": ["travel", "tour", "car", "rent", "किराया"],
  "ट्रैवल": ["travel", "tour", "rent"],
  "travel": ["ट्रेवल", "tour", "rent", "किराया"],
  "काम वाली बाई": ["maid", "बाई", "househelp"],
  "बाई": ["maid", "काम वाली", "househelp"],
  "मेड": ["maid", "बाई"],
  "maid": ["बाई", "काम वाली बाई", "househelp"],
  "मछली": ["fish"],
  "fish": ["मछली"],
  "मटन": ["mutton", "meat"],
  "मुर्गा": ["chicken", "poultry"],
  "chicken": ["मुर्गा", "poultry"],
  "पार्लर": ["parlour", "beauty", "salon"],
  "ब्यूटी": ["beauty", "parlour", "salon"],
  "parlour": ["पार्लर", "beauty", "salon"],
  "मिस्त्री": ["mason", "mechanic", "repair"],
  "प्लंबर": ["plumber"],
  "बिजली": ["electrician", "इलेक्ट्रीशियन"],
  "दवा": ["pharmacy", "medical"],
  "डॉक्टर": ["doctor", "clinic"],
  "किराना": ["general store", "grocery", "kirana"],
  "खाना": ["food", "tiffin", "mess", "restaurant"],
  "टिफिन": ["tiffin", "mess", "खाना"],
  "मकान": ["property", "rent", "flat", "house"],
  "किराया": ["rent", "rental", "travel"],
};

/** Expand a user query into the list of terms we should match against. */
export const expandQuery = (query: string): string[] => {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];
  const terms = new Set<string>([q]);
  const words = q.split(/\s+/).filter((w) => w.length > 1);
  words.forEach((w) => terms.add(w));
  Object.entries(SEARCH_ALIASES).forEach(([key, values]) => {
    if (q.includes(key)) values.forEach((v) => terms.add(v.toLowerCase()));
  });
  return [...terms];
};

/** Does any expanded search term appear in any of the given haystack values? */
export const matchesQuery = (query: string, haystack: (string | null | undefined)[]): boolean => {
  const terms = expandQuery(query);
  if (!terms.length) return true;
  const blob = haystack.filter(Boolean).join(" • ").toLowerCase();
  return terms.some((term) => blob.includes(term));
};
