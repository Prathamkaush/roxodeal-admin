export type Role = "buyer" | "seller" | "admin";
export type Product = {
  images?: string[];
  specifications?: Record<string, string>;
  subcategory?: string | null;
  maximumPrice?: number;
  id: string;
  name: string;
  category: string;
  price: number;
  moq: number;
  unit: string;
  sellerId: string;
  image: string;
  status: string;
  description: string;
};
export type Seller = {
  userId?: string;
  subscriptionExpiresAt?: string | null;
  active?: boolean;
  kycNote?: string | null;
  id: string;
  company: string;
  name: string;
  city: string;
  category: string;
  kyc: string;
  years: number;
  plan: string;
  credits: number;
  email: string;
  phone: string;
};
export type Lead = {
  subcategory?: string | null;
  documentIds?: string[];
  id: string;
  title: string;
  category: string;
  quantity: number;
  unit: string;
  budget: number;
  city: string;
  description: string;
  date: string;
  status: string;
  price: number;
  purchases: string[];
  buyerName: string;
  email: string;
  phone: string;
};
export type Claim = {
  protectionId?: string;
  documentIds?: string[];
  approvedAmount?: number | null;
  adminNote?: string | null;
  refundReference?: string | null;
  id: string;
  title: string;
  sellerId: string;
  amount: number;
  reason: string;
  status: string;
  response: string;
  reference: string;
};
export type Plan = {
  durationDays?: number;
  active?: boolean;
  id: string;
  name: string;
  price: number;
  listings: number;
  credits: number;
};
export const categories = [
  "Industrial Machinery",
  "Packaging Materials",
  "Raw Textiles",
  "Electronics & Components",
  "Construction Materials",
  "Chemical & Distribution",
  "Agricultural Equipment",
  "Furniture & Wood",
  "Automotive Parts",
  "Food & Beverage",
  "Medical & Healthcare Supplies",
  "Plastics & Polymers",
];
export const initialSellers: Seller[] = [
  {
    id: "seller-1",
    company: "Naresh Textiles",
    name: "Naresh Shah",
    city: "Surat",
    category: "Raw Textiles",
    kyc: "Approved",
    years: 14,
    plan: "silver",
    credits: 15,
    email: "naresh@example.com",
    phone: "+91 90000 00001",
  },
  {
    id: "seller-2",
    company: "Vikram Auto Parts",
    name: "Vikram Kohli",
    city: "Ludhiana",
    category: "Automotive Parts",
    kyc: "Approved",
    years: 18,
    plan: "gold",
    credits: 30,
    email: "vikram@example.com",
    phone: "+91 90000 00002",
  },
  {
    id: "seller-3",
    company: "Sanjay Polymers",
    name: "Sanjay Patel",
    city: "Vadodara",
    category: "Packaging Materials",
    kyc: "Under Review",
    years: 8,
    plan: "bronze",
    credits: 5,
    email: "sanjay@example.com",
    phone: "+91 90000 00003",
  },
  {
    id: "seller-4",
    company: "Deepak Steels",
    name: "Deepak Singh",
    city: "Jamshedpur",
    category: "Construction Materials",
    kyc: "Approved",
    years: 21,
    plan: "silver",
    credits: 15,
    email: "deepak@example.com",
    phone: "+91 90000 00004",
  },
];
export const initialProducts: Product[] = [
  {
    id: "cotton-tshirts",
    name: "Premium cotton T-shirts",
    category: "Raw Textiles",
    price: 120,
    moq: 500,
    unit: "piece",
    sellerId: "seller-1",
    image:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=640&q=80",
    status: "Active",
    description:
      "180 GSM, 100% combed cotton. Custom colours, sizes and corporate branding available. Request a quote for your bulk requirement.",
  },
  {
    id: "cotton-yarn",
    name: "Combed cotton yarn",
    category: "Raw Textiles",
    price: 268,
    moq: 1000,
    unit: "kg",
    sellerId: "seller-1",
    image:
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=640&q=80",
    status: "Active",
    description:
      "Quality cotton yarn for knitting and weaving. Available in multiple counts with consistent tensile strength.",
  },
  {
    id: "cnc-components",
    name: "Precision CNC components",
    category: "Automotive Parts",
    price: 38,
    moq: 2000,
    unit: "piece",
    sellerId: "seller-2",
    image:
      "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=640&q=80",
    status: "Active",
    description:
      "Precision machined components manufactured to your specifications. Contact the supplier for drawings and tolerances.",
  },
  {
    id: "corrugated-boxes",
    name: "5-ply corrugated boxes",
    category: "Packaging Materials",
    price: 14,
    moq: 1000,
    unit: "piece",
    sellerId: "seller-3",
    image:
      "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=640&q=80",
    status: "Active",
    description:
      "Durable packaging boxes with custom dimensions and printing for bulk industrial and retail packaging.",
  },
  {
    id: "steel-billets",
    name: "Industrial steel billets",
    category: "Construction Materials",
    price: 52400,
    moq: 10,
    unit: "tonne",
    sellerId: "seller-4",
    image:
      "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=640&q=80",
    status: "Active",
    description:
      "Steel billets for rolling mills and construction manufacturing. Specifications and test certificates available on enquiry.",
  },
];
export const initialLeads: Lead[] = [
  {
    id: "RFQ-1042",
    title: "Cotton T-shirts for corporate uniforms",
    category: "Raw Textiles",
    quantity: 5000,
    unit: "pieces",
    budget: 600000,
    city: "Delhi",
    description:
      "180 GSM cotton with embroidered company logo. Mixed sizes, navy and white. Samples required before production.",
    date: "2026-11-15",
    status: "Active",
    price: 199,
    purchases: ["seller-demo-2", "seller-demo-3", "seller-demo-4"],
    buyerName: "Rahul Mehta",
    email: "rahul@example.com",
    phone: "+91 90000 00101",
  },
  {
    id: "RFQ-1041",
    title: "Combed cotton yarn, 30s count",
    category: "Raw Textiles",
    quantity: 2000,
    unit: "kg",
    budget: 540000,
    city: "Ahmedabad",
    description:
      "For our new knitwear production line. Looking for a regular monthly supplier.",
    date: "2026-11-01",
    status: "Active",
    price: 249,
    purchases: ["seller-demo-2"],
    buyerName: "Priya Sharma",
    email: "priya@example.com",
    phone: "+91 90000 00102",
  },
  {
    id: "RFQ-1040",
    title: "Custom printed packaging boxes",
    category: "Packaging Materials",
    quantity: 10000,
    unit: "pieces",
    budget: 180000,
    city: "Mumbai",
    description: "5-ply corrugated boxes, two-colour printing.",
    date: "2026-11-20",
    status: "Pending",
    price: 299,
    purchases: [],
    buyerName: "Rahul Mehta",
    email: "rahul@example.com",
    phone: "+91 90000 00101",
  },
  {
    id: "RFQ-1039",
    title: "Bulk knitted fabric, 220 GSM",
    category: "Raw Textiles",
    quantity: 3000,
    unit: "kg",
    budget: 750000,
    city: "Jaipur",
    description: "Cotton fabric for winter collection.",
    date: "2026-11-25",
    status: "Fully Sold",
    price: 399,
    purchases: ["s2", "s3", "s4", "s5", "s6"],
    buyerName: "Amit Jain",
    email: "amit@example.com",
    phone: "+91 90000 00103",
  },
];
export const initialPlans: Plan[] = [
  { id: "free", name: "Free", price: 0, listings: 5, credits: 0 },
  { id: "bronze", name: "Bronze", price: 999, listings: 20, credits: 5 },
  { id: "silver", name: "Silver", price: 2499, listings: 40, credits: 15 },
  { id: "gold", name: "Gold", price: 4999, listings: 80, credits: 30 },
];
export const initialClaims: Claim[] = [
  {
    id: "CLM-101",
    title: "Corporate uniform delivery",
    sellerId: "seller-1",
    amount: 600000,
    reason:
      "Delivery is overdue. Please review the agreed delivery date and payment proof.",
    status: "Under Review",
    response: "",
    reference: "DEAL-204",
  },
];
