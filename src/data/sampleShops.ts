export interface Shop {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  address: string;
  pincode: string;
  lat: number;
  lng: number;
  whatsapp: string;
  phone: string;
  photos: string[];
  verified: boolean;
  rating: number;
  description: string;
}

export const sampleShops: Shop[] = [
  {
    id: "1",
    name: "Sai Kirana",
    nameHindi: "साई किराना",
    category: "Kirana / Grocery",
    address: "Main Road, Risali, Bhilai, Chhattisgarh",
    pincode: "490006",
    lat: 21.2167,
    lng: 81.3833,
    whatsapp: "919876543210",
    phone: "919876543210",
    photos: [],
    verified: true,
    rating: 4.5,
    description: "Your trusted neighborhood kirana store with daily essentials, groceries, snacks, and household items at best prices.",
  },
  {
    id: "2",
    name: "Sharma Medicals",
    nameHindi: "शर्मा मेडिकल्स",
    category: "Pharmacy",
    address: "Station Road, Risali, Bhilai, Chhattisgarh",
    pincode: "490006",
    lat: 21.2180,
    lng: 81.3850,
    whatsapp: "919876543211",
    phone: "919876543211",
    photos: [],
    verified: true,
    rating: 4.2,
    description: "All medicines, health supplements, and medical supplies available. Free home delivery on orders above ₹200.",
  },
  {
    id: "3",
    name: "Bhilai Electronics",
    nameHindi: "भिलाई इलेक्ट्रॉनिक्स",
    category: "Electronics",
    address: "Nehru Nagar, Bhilai, Chhattisgarh",
    pincode: "490020",
    lat: 21.2100,
    lng: 81.3780,
    whatsapp: "919876543212",
    phone: "919876543212",
    photos: [],
    verified: false,
    rating: 4.0,
    description: "Mobile phones, accessories, repair services, and all electronic items at competitive prices.",
  },
  {
    id: "4",
    name: "Maa Vaishno Sweets",
    nameHindi: "माँ वैष्णो स्वीट्स",
    category: "Food & Sweets",
    address: "Power House Road, Risali, Bhilai",
    pincode: "490006",
    lat: 21.2195,
    lng: 81.3810,
    whatsapp: "919876543213",
    phone: "919876543213",
    photos: [],
    verified: true,
    rating: 4.7,
    description: "Pure desi ghee sweets, namkeen, and snacks. Famous for our special samosa and jalebi.",
  },
];

export const shopCategories = [
  "Kirana / Grocery",
  "Pharmacy",
  "Electronics",
  "Food & Sweets",
  "Clothing & Fashion",
  "Hardware & Tools",
  "Stationery & Books",
  "Mobile & Recharge",
  "Salon & Beauty",
  "Vegetables & Fruits",
  "Dairy & Milk",
  "Other",
];
