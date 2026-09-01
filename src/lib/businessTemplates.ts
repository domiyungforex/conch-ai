// Industry templates for the Business Memory workspace — the "boring business
// mode" the platform targets: businesses that currently run on WhatsApp,
// Excel, paper, and phone calls. A template tells Conch what to track and
// what questions it should be able to answer, so the AI assistant adapts to
// the industry instead of treating every business the same.
//
// Purely additive: businesses created before templates existed simply have no
// template set. The registry is served read-only to the UI and the assistant.

export interface BusinessTemplate {
  id: string;
  label: string;
  icon: string;
  description: string;
  whatToTrack: string[];
  exampleQuestions: string[];
}

export const BUSINESS_TEMPLATES: BusinessTemplate[] = [
  {
    id: "generic",
    label: "General business",
    icon: "🏢",
    description: "Start simple. Track customers, suppliers, products, orders, and cash flow.",
    whatToTrack: ["Customers", "Suppliers", "Products", "Orders", "Expenses", "Revenue"],
    exampleQuestions: ["Which customers haven't ordered this month?", "What did we sell most last week?"],
  },
  {
    id: "distributor",
    label: "Distributor / Wholesaler",
    icon: "🚚",
    description: "Order volumes, delivery promises, price agreements, and payment terms per customer.",
    whatToTrack: ["Customers", "Price agreements", "Delivery promises", "Orders", "Payments", "Stock levels"],
    exampleQuestions: ["What price did we agree with this customer?", "Which customers are behind on payment?", "Who ordered the most this month?"],
  },
  {
    id: "pharmacy",
    label: "Pharmacy",
    icon: "💊",
    description: "Medication stock, expiry-sensitive inventory, suppliers, and repeat prescriptions.",
    whatToTrack: ["Products", "Stock levels", "Expiry dates", "Suppliers", "Repeat customers", "Orders"],
    exampleQuestions: ["Which medicines are low in stock?", "Which products are expiring soon?", "Who is our usual supplier for paracetamol?"],
  },
  {
    id: "spare-parts",
    label: "Spare Parts",
    icon: "🔧",
    description: "Part catalogs, cross-references, suppliers, and which parts fit which models.",
    whatToTrack: ["Parts", "Part-to-model fit", "Suppliers", "Stock levels", "Orders", "Customers"],
    exampleQuestions: ["Which parts fit this model?", "Which supplier has the best price on brake pads?", "What's low in stock?"],
  },
  {
    id: "construction-supplier",
    label: "Construction Supplier",
    icon: "🏗️",
    description: "Material prices, project quotes, suppliers, deliveries, and job sites.",
    whatToTrack: ["Materials", "Prices", "Projects", "Quotes", "Suppliers", "Deliveries"],
    exampleQuestions: ["What did we quote for this project?", "Which supplier delivers cement fastest?", "How much cement is left in stock?"],
  },
  {
    id: "logistics",
    label: "Logistics",
    icon: "📦",
    description: "Vehicles, routes, shipments, drivers, delivery status, and fuel costs.",
    whatToTrack: ["Shipments", "Drivers", "Vehicles", "Routes", "Delivery status", "Fuel costs"],
    exampleQuestions: ["Which shipments are late?", "What did fuel cost us last month?", "How many deliveries did we make this week?"],
  },
  {
    id: "school",
    label: "School",
    icon: "🎓",
    description: "Students, classes, fees, staff, attendance, and parent contacts.",
    whatToTrack: ["Students", "Classes", "Fees", "Attendance", "Staff", "Parent contacts"],
    exampleQuestions: ["Which students haven't paid this term?", "How many students are in each class?", "Who hasn't attended recently?"],
  },
  {
    id: "laundry",
    label: "Laundry",
    icon: "🧺",
    description: "Drop-offs, pickups, customers, order status, and pricing per item.",
    whatToTrack: ["Customers", "Drop-offs", "Order status", "Pickups", "Item pricing"],
    exampleQuestions: ["Which orders are still uncollected?", "Who is our most frequent customer?", "How many shirts did we process this week?"],
  },
  {
    id: "repair",
    label: "Repair Business",
    icon: "🛠️",
    description: "Jobs, customers, parts used, labor, quotes, and status of each repair.",
    whatToTrack: ["Jobs", "Customers", "Parts used", "Labor", "Quotes", "Job status"],
    exampleQuestions: ["Which repairs are still in progress?", "What did this customer complain about last time?", "Which parts do we reorder most?"],
  },
  {
    id: "agriculture",
    label: "Agricultural Business",
    icon: "🌾",
    description: "Crops, harvests, inputs, suppliers, buyers, and field records.",
    whatToTrack: ["Crops", "Harvests", "Inputs", "Suppliers", "Buyers", "Field records"],
    exampleQuestions: ["How much did we harvest last season?", "What did we pay for fertilizer?", "Who buys our produce regularly?"],
  },
  {
    id: "manufacturer",
    label: "Small Manufacturer",
    icon: "🏭",
    description: "Raw materials, production runs, orders, suppliers, and unit costs.",
    whatToTrack: ["Raw materials", "Production runs", "Orders", "Suppliers", "Unit costs", "Inventory"],
    exampleQuestions: ["What's our unit cost for this product?", "Are we short on any raw material?", "Which product has the best margin?"],
  },
  {
    id: "restaurant",
    label: "Restaurant",
    icon: "🍽️",
    description: "Menu, suppliers, food costs, daily sales, regulars, and orders.",
    whatToTrack: ["Menu items", "Suppliers", "Food costs", "Daily sales", "Regular customers", "Orders"],
    exampleQuestions: ["What did we sell most this week?", "Which supplier do we buy vegetables from?", "How much did we spend on food this month?"],
  },
  {
    id: "events",
    label: "Event Business",
    icon: "🎉",
    description: "Events, clients, bookings, deposits, vendors, and payments.",
    whatToTrack: ["Events", "Clients", "Bookings", "Deposits", "Vendors", "Payments"],
    exampleQuestions: ["Which events are coming up?", "Who hasn't paid their deposit?", "Which vendor do we use for catering?"],
  },
];

export function getBusinessTemplate(id: string | null | undefined): BusinessTemplate | null {
  if (!id) return null;
  return BUSINESS_TEMPLATES.find((t) => t.id === id) ?? null;
}
