// Synthetic banking transaction generator.
// Produces transactions.csv with realistic fraud patterns suitable
// for the FraudAnalytics dashboard + Power BI build.
//
// Run: node dataset/generate.mjs
// Output: dataset/transactions.csv (~100,000 rows)

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Deterministic PRNG (mulberry32) for reproducible datasets ────────────
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260509);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randint = (lo, hi) => Math.floor(rand() * (hi - lo + 1)) + lo;
const gauss = () => {
  // Box–Muller, clipped to ±4σ
  let u = 0,
    v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return Math.max(-4, Math.min(4, z));
};

// ── Reference data ───────────────────────────────────────────────────────
const CITIES = [
  { name: "Mumbai", weight: 0.18, fraudBias: 1.15 },
  { name: "Delhi", weight: 0.15, fraudBias: 1.25 },
  { name: "Bengaluru", weight: 0.14, fraudBias: 1.05 },
  { name: "Hyderabad", weight: 0.1, fraudBias: 0.9 },
  { name: "Chennai", weight: 0.1, fraudBias: 0.85 },
  { name: "Kolkata", weight: 0.09, fraudBias: 1.0 },
  { name: "Pune", weight: 0.09, fraudBias: 0.95 },
  { name: "Ahmedabad", weight: 0.07, fraudBias: 0.9 },
  { name: "Jaipur", weight: 0.04, fraudBias: 1.1 },
  { name: "Lucknow", weight: 0.04, fraudBias: 1.3 },
];

// Merchant categories drive amount range + fraud bias
const MERCHANT_CATEGORIES = [
  { cat: "E-commerce", amountMu: 1800, amountSigma: 1.0, fraudBias: 1.4 },
  { cat: "Travel", amountMu: 8500, amountSigma: 1.2, fraudBias: 1.6 },
  { cat: "Food & Dining", amountMu: 480, amountSigma: 0.8, fraudBias: 0.5 },
  { cat: "Groceries", amountMu: 1100, amountSigma: 0.7, fraudBias: 0.3 },
  { cat: "Fuel", amountMu: 1500, amountSigma: 0.6, fraudBias: 0.4 },
  { cat: "Electronics", amountMu: 14000, amountSigma: 1.4, fraudBias: 2.4 },
  { cat: "Fashion", amountMu: 2200, amountSigma: 1.0, fraudBias: 1.1 },
  { cat: "Entertainment", amountMu: 700, amountSigma: 0.9, fraudBias: 0.7 },
  { cat: "Utilities", amountMu: 2800, amountSigma: 0.5, fraudBias: 0.2 },
  { cat: "Healthcare", amountMu: 3500, amountSigma: 1.0, fraudBias: 0.6 },
  { cat: "Crypto Exchange", amountMu: 25000, amountSigma: 1.6, fraudBias: 5.0 },
  { cat: "Gambling", amountMu: 6000, amountSigma: 1.5, fraudBias: 4.5 },
  { cat: "ATM Withdrawal", amountMu: 5000, amountSigma: 0.9, fraudBias: 1.8 },
];

const MERCHANT_NAMES = [
  ["Amazon India", "E-commerce"],
  ["Flipkart", "E-commerce"],
  ["Myntra", "Fashion"],
  ["Ajio", "Fashion"],
  ["Meesho", "E-commerce"],
  ["Tata CLiQ", "E-commerce"],
  ["Nykaa", "Fashion"],
  ["Snapdeal", "E-commerce"],
  ["JioMart", "Groceries"],
  ["BigBasket", "Groceries"],
  ["Blinkit", "Groceries"],
  ["Zepto", "Groceries"],
  ["Swiggy", "Food & Dining"],
  ["Zomato", "Food & Dining"],
  ["Dominos India", "Food & Dining"],
  ["McDonalds India", "Food & Dining"],
  ["Cafe Coffee Day", "Food & Dining"],
  ["Starbucks IN", "Food & Dining"],
  ["IRCTC", "Travel"],
  ["MakeMyTrip", "Travel"],
  ["Yatra", "Travel"],
  ["Goibibo", "Travel"],
  ["Cleartrip", "Travel"],
  ["IndiGo Airlines", "Travel"],
  ["Air India", "Travel"],
  ["Vistara", "Travel"],
  ["Ola Cabs", "Travel"],
  ["Uber India", "Travel"],
  ["BookMyShow", "Entertainment"],
  ["PVR Cinemas", "Entertainment"],
  ["INOX", "Entertainment"],
  ["Hotstar", "Entertainment"],
  ["Netflix IN", "Entertainment"],
  ["Spotify IN", "Entertainment"],
  ["Sony LIV", "Entertainment"],
  ["JioCinema", "Entertainment"],
  ["Croma", "Electronics"],
  ["Reliance Digital", "Electronics"],
  ["Vijay Sales", "Electronics"],
  ["Apple India", "Electronics"],
  ["Samsung India", "Electronics"],
  ["OnePlus IN", "Electronics"],
  ["Mi India", "Electronics"],
  ["HP India", "Electronics"],
  ["Dell India", "Electronics"],
  ["Indian Oil", "Fuel"],
  ["HP Petrol", "Fuel"],
  ["Bharat Petroleum", "Fuel"],
  ["Shell India", "Fuel"],
  ["Reliance Petrol", "Fuel"],
  ["Apollo Pharmacy", "Healthcare"],
  ["1mg", "Healthcare"],
  ["Netmeds", "Healthcare"],
  ["PharmEasy", "Healthcare"],
  ["Practo", "Healthcare"],
  ["Tata 1mg", "Healthcare"],
  ["Tata Power", "Utilities"],
  ["Adani Electricity", "Utilities"],
  ["BSES Delhi", "Utilities"],
  ["BESCOM", "Utilities"],
  ["Airtel Recharge", "Utilities"],
  ["Jio Recharge", "Utilities"],
  ["Vi Recharge", "Utilities"],
  ["BSNL Bills", "Utilities"],
  ["WazirX", "Crypto Exchange"],
  ["CoinDCX", "Crypto Exchange"],
  ["CoinSwitch", "Crypto Exchange"],
  ["BinanceP2P-IN", "Crypto Exchange"],
  ["ZebPay", "Crypto Exchange"],
  ["Dream11", "Gambling"],
  ["MPL", "Gambling"],
  ["RummyCircle", "Gambling"],
  ["BetwayIN", "Gambling"],
  ["1xBet-IN", "Gambling"],
  ["ParimatchIN", "Gambling"],
  ["HDFC ATM", "ATM Withdrawal"],
  ["SBI ATM", "ATM Withdrawal"],
  ["ICICI ATM", "ATM Withdrawal"],
  ["Axis ATM", "ATM Withdrawal"],
  ["Kotak ATM", "ATM Withdrawal"],
  ["PNB ATM", "ATM Withdrawal"],
  ["CashStation", "ATM Withdrawal"],
  ["QuickCash24", "ATM Withdrawal"],
  ["MoneyMart Express", "ATM Withdrawal"],
  ["GreyMerchant LLP", "Crypto Exchange"],
  ["NovaPay Solutions", "Gambling"],
  ["FastTransfer Global", "Crypto Exchange"],
  ["Velocity Pay", "Gambling"],
  ["Onyx Trade Hub", "Crypto Exchange"],
  ["Apex Settle Co", "Gambling"],
];

const TXN_TYPES = [
  { type: "UPI", weight: 0.42, fraudBias: 0.6 },
  { type: "Online", weight: 0.3, fraudBias: 1.7 },
  { type: "POS", weight: 0.18, fraudBias: 0.9 },
  { type: "ATM", weight: 0.1, fraudBias: 1.3 },
];

// ── Weighted picker ──────────────────────────────────────────────────────
function weightedPick(items, weightKey = "weight") {
  const total = items.reduce((s, x) => s + x[weightKey], 0);
  let r = rand() * total;
  for (const item of items) {
    r -= item[weightKey];
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

// ── Customers ────────────────────────────────────────────────────────────
const NUM_CUSTOMERS = 3500;
const FIRST_NAMES = [
  "Aarav","Aditi","Aditya","Akash","Akshay","Amit","Anaya","Ananya","Aniket","Ankit","Anjali","Arjun",
  "Arnav","Aryan","Ayaan","Ayush","Bhavna","Chetan","Daksh","Deepak","Devansh","Dhruv","Diya","Esha",
  "Farhan","Gaurav","Hari","Harsh","Ishaan","Ishita","Jay","Jaya","Kabir","Kavya","Krishna","Lakshay",
  "Manav","Manish","Meera","Mohit","Naman","Nandini","Neha","Nikhil","Nisha","Om","Pari","Parth",
  "Pooja","Pranav","Priya","Raghav","Rahul","Ramesh","Reyansh","Riya","Rohan","Rohit","Rudra","Saanvi",
  "Sahil","Sameer","Sanjay","Sara","Shaurya","Shreya","Siddharth","Simran","Sneha","Sumit","Tanvi",
  "Tanya","Tara","Tushar","Uday","Varun","Vedant","Vihaan","Vivaan","Yash","Yashika","Zoya",
];
const LAST_NAMES = [
  "Sharma","Verma","Gupta","Kumar","Singh","Patel","Mehta","Joshi","Iyer","Reddy","Nair","Menon",
  "Pillai","Khanna","Kapoor","Malhotra","Chopra","Bansal","Agarwal","Mittal","Goyal","Jain","Sinha",
  "Bose","Banerjee","Chatterjee","Mukherjee","Das","Roy","Saha","Ghosh","Pandey","Tripathi","Mishra",
  "Yadav","Chauhan","Rana","Thakur","Rao","Naidu","Hegde","Shetty","Desai","Shah",
];

const customers = [];
for (let i = 1; i <= NUM_CUSTOMERS; i++) {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  // 5% of customers are fraud-prone (have multiple incidents)
  const proneness = rand() < 0.05 ? 4.0 + rand() * 4.0 : 0.6 + rand() * 0.8;
  // Activity profile (tx/year): heavy-tail. Most: 20–60. Power users: 200+.
  const activity = Math.floor(20 + Math.exp(rand() * 4.5));
  customers.push({
    id: 100000 + i,
    name: `${first} ${last}`,
    homeCity: weightedPick(CITIES).name,
    proneness,
    activity,
  });
}

// ── Merchants ────────────────────────────────────────────────────────────
const merchants = MERCHANT_NAMES.map(([name, cat], idx) => {
  const category = MERCHANT_CATEGORIES.find((c) => c.cat === cat);
  // 6% of merchants are "compromised" — outsized fraud rate
  const compromised = rand() < 0.06;
  return {
    id: 9000 + idx + 1,
    name,
    category: cat,
    amountMu: category.amountMu,
    amountSigma: category.amountSigma,
    fraudBias: category.fraudBias * (compromised ? 4 : 1),
    compromised,
  };
});

// ── Time helpers ─────────────────────────────────────────────────────────
const START = new Date("2025-05-09T00:00:00Z").getTime();
const END = new Date("2026-05-09T00:00:00Z").getTime();
const SPAN = END - START;

function timeBias(d) {
  const hour = d.getUTCHours();
  // Fraud peak 1–5am, elevated 22:00–01:00, suppressed 9–17
  if (hour >= 1 && hour <= 4) return 5.0;
  if (hour >= 22 || hour <= 0) return 2.2;
  if (hour >= 9 && hour <= 17) return 0.6;
  return 1.0;
}

function weekendBias(d) {
  const day = d.getUTCDay();
  return day === 0 || day === 6 ? 1.3 : 1.0;
}

// Volume-of-day curve (more transactions in business hours)
function hourVolumeWeight(hour) {
  // Bimodal: morning + evening peak
  const morning = Math.exp(-Math.pow((hour - 11) / 3, 2));
  const evening = Math.exp(-Math.pow((hour - 19) / 3, 2));
  return 0.2 + morning + 1.1 * evening;
}

function sampleHour() {
  const r = rand() * 24;
  // rejection sampling
  for (let i = 0; i < 24; i++) {
    const h = (Math.floor(r) + i) % 24;
    if (rand() < hourVolumeWeight(h) / 2.5) return h;
  }
  return Math.floor(r);
}

function sampleTransactionDate() {
  const t = START + Math.floor(rand() * SPAN);
  const d = new Date(t);
  d.setUTCHours(sampleHour(), randint(0, 59), randint(0, 59), 0);
  return d;
}

// ── Amount sampling (log-normal w/ category mu) ──────────────────────────
function sampleAmount(merchant, isFraud) {
  if (isFraud) {
    // Bimodal fraud: 30% small probe (₹50–₹500), 70% large extraction
    if (rand() < 0.3) {
      return Math.round(50 + rand() * 450);
    }
    const big = Math.exp(Math.log(merchant.amountMu) + 0.6 + gauss() * 0.7);
    return Math.round(Math.max(2000, Math.min(500000, big)));
  }
  const v = Math.exp(Math.log(merchant.amountMu) + gauss() * merchant.amountSigma);
  return Math.round(Math.max(20, Math.min(300000, v)));
}

// ── Generate transactions ────────────────────────────────────────────────
const NUM_ROWS = 100_000;
const BASE_FRAUD_RATE = 0.014; // 1.4% baseline → ~1.5–2% after biases
const rows = [];

// Activity-weighted customer picker for realistic volume distribution
const custCum = [];
let acc = 0;
for (const c of customers) {
  acc += c.activity;
  custCum.push(acc);
}
const custTotal = acc;
function sampleCustomer() {
  const r = rand() * custTotal;
  // binary search
  let lo = 0,
    hi = custCum.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (custCum[mid] < r) lo = mid + 1;
    else hi = mid;
  }
  return customers[lo];
}

for (let i = 1; i <= NUM_ROWS; i++) {
  const cust = sampleCustomer();
  const merchant = pick(merchants);
  const txnType = weightedPick(TXN_TYPES);
  // Customer city: 85% home, 15% travel
  const city = rand() < 0.85 ? cust.homeCity : weightedPick(CITIES).name;
  const cityObj = CITIES.find((c) => c.name === city);
  const date = sampleTransactionDate();

  const fraudP =
    BASE_FRAUD_RATE *
    cust.proneness *
    merchant.fraudBias *
    txnType.fraudBias *
    cityObj.fraudBias *
    timeBias(date) *
    weekendBias(date);

  const isFraud = rand() < fraudP ? 1 : 0;
  const amount = sampleAmount(merchant, isFraud === 1);

  rows.push({
    transaction_id: 1_000_000 + i,
    customer_id: cust.id,
    transaction_date: date.toISOString().replace("T", " ").slice(0, 19),
    amount,
    merchant: merchant.name,
    city,
    transaction_type: txnType.type,
    is_fraud: isFraud,
  });
}

// ── Write CSV ────────────────────────────────────────────────────────────
const HEADERS = [
  "transaction_id",
  "customer_id",
  "transaction_date",
  "amount",
  "merchant",
  "city",
  "transaction_type",
  "is_fraud",
];

const lines = [HEADERS.join(",")];
for (const r of rows) {
  lines.push(
    [
      r.transaction_id,
      r.customer_id,
      r.transaction_date,
      r.amount,
      `"${r.merchant.replaceAll('"', '""')}"`,
      r.city,
      r.transaction_type,
      r.is_fraud,
    ].join(","),
  );
}
const txnPath = join(__dirname, "transactions.csv");
writeFileSync(txnPath, lines.join("\n") + "\n");

// ── Customers CSV ────────────────────────────────────────────────────────
const custLines = ["customer_id,customer_name,home_city"];
for (const c of customers) {
  custLines.push(`${c.id},"${c.name.replaceAll('"', '""')}",${c.homeCity}`);
}
writeFileSync(join(__dirname, "customers.csv"), custLines.join("\n") + "\n");

// ── Merchants CSV ────────────────────────────────────────────────────────
const merchLines = ["merchant_id,merchant_name,category"];
for (const m of merchants) {
  merchLines.push(`${m.id},"${m.name.replaceAll('"', '""')}",${m.category}`);
}
writeFileSync(join(__dirname, "merchants.csv"), merchLines.join("\n") + "\n");

// ── Quick summary ────────────────────────────────────────────────────────
const fraudCount = rows.reduce((s, r) => s + r.is_fraud, 0);
const totalAmt = rows.reduce((s, r) => s + r.amount, 0);
const fraudAmt = rows.filter((r) => r.is_fraud).reduce((s, r) => s + r.amount, 0);
console.log(`✓ ${rows.length.toLocaleString()} transactions written`);
console.log(`  → fraud rows: ${fraudCount.toLocaleString()} (${((fraudCount / rows.length) * 100).toFixed(2)}%)`);
console.log(`  → total ₹: ${(totalAmt / 1e7).toFixed(2)} Cr`);
console.log(`  → fraud ₹: ${(fraudAmt / 1e7).toFixed(2)} Cr`);
console.log(`  → customers: ${customers.length}, merchants: ${merchants.length}`);
console.log(`  → file: ${txnPath}`);
