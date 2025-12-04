// Market Data
export const cropPrices = [
  { id: 1, name: "Maize", price: 245, unit: "per 90kg", change: 5.2, trend: "up" },
  { id: 2, name: "Wheat", price: 380, unit: "per 90kg", change: -2.1, trend: "down" },
  { id: 3, name: "Sorghum", price: 195, unit: "per 90kg", change: 3.8, trend: "up" },
  { id: 4, name: "Soybeans", price: 520, unit: "per 90kg", change: 1.5, trend: "up" },
  { id: 5, name: "Groundnuts", price: 680, unit: "per 90kg", change: -0.8, trend: "down" },
];

export const priceHistory = [
  { date: "Jan", maize: 220, wheat: 350, sorghum: 180 },
  { date: "Feb", maize: 225, wheat: 365, sorghum: 175 },
  { date: "Mar", maize: 235, wheat: 370, sorghum: 185 },
  { date: "Apr", maize: 230, wheat: 375, sorghum: 190 },
  { date: "May", maize: 240, wheat: 380, sorghum: 188 },
  { date: "Jun", maize: 245, wheat: 380, sorghum: 195 },
];

export const recommendedMarkets = [
  { id: 1, name: "Kumasi Central Market", distance: "12 km", bestFor: "Maize", avgPrice: 248 },
  { id: 2, name: "Tamale Agro Hub", distance: "25 km", bestFor: "Sorghum", avgPrice: 200 },
  { id: 3, name: "Accra Wholesale", distance: "45 km", bestFor: "Wheat", avgPrice: 385 },
];

// Crop Intelligence Data
export const fieldData = [
  { id: 1, name: "North Field", crop: "Maize", area: "5 ha", ndvi: 0.78, moisture: 65, health: "Good" },
  { id: 2, name: "South Field", crop: "Wheat", area: "3 ha", ndvi: 0.62, moisture: 45, health: "Moderate" },
  { id: 3, name: "East Plot", crop: "Sorghum", area: "2 ha", ndvi: 0.85, moisture: 72, health: "Excellent" },
  { id: 4, name: "West Garden", crop: "Groundnuts", area: "1.5 ha", ndvi: 0.55, moisture: 38, health: "Needs Attention" },
];

export const ndviHistory = [
  { week: "W1", north: 0.65, south: 0.58, east: 0.70 },
  { week: "W2", north: 0.68, south: 0.60, east: 0.75 },
  { week: "W3", north: 0.72, south: 0.61, east: 0.78 },
  { week: "W4", north: 0.75, south: 0.62, east: 0.82 },
  { week: "W5", north: 0.78, south: 0.62, east: 0.85 },
];

export const yieldForecasts = [
  { field: "North Field", current: 4.2, projected: 4.8, unit: "tons/ha" },
  { field: "South Field", current: 2.8, projected: 3.1, unit: "tons/ha" },
  { field: "East Plot", current: 3.5, projected: 4.0, unit: "tons/ha" },
];

// Resources Data
export const inventoryItems = [
  { id: 1, name: "NPK Fertilizer", quantity: 250, unit: "kg", status: "Sufficient", reorderAt: 100 },
  { id: 2, name: "Maize Seeds", quantity: 45, unit: "kg", status: "Low", reorderAt: 50 },
  { id: 3, name: "Pesticide A", quantity: 12, unit: "liters", status: "Sufficient", reorderAt: 5 },
  { id: 4, name: "Herbicide", quantity: 8, unit: "liters", status: "Low", reorderAt: 10 },
];

export const recommendations = [
  { id: 1, type: "Fertilizer", product: "Urea", amount: "50 kg/ha", field: "South Field", reason: "Low nitrogen levels" },
  { id: 2, type: "Irrigation", action: "Increase", amount: "2 hours/day", field: "West Garden", reason: "Low soil moisture" },
  { id: 3, type: "Pesticide", product: "Neem Oil", amount: "2 liters/ha", field: "North Field", reason: "Pest activity detected" },
];

export const irrigationSchedule = [
  { day: "Mon", field: "North Field", duration: "4 hrs", time: "6:00 AM" },
  { day: "Tue", field: "South Field", duration: "3 hrs", time: "6:00 AM" },
  { day: "Wed", field: "East Plot", duration: "2 hrs", time: "5:30 AM" },
  { day: "Thu", field: "West Garden", duration: "4 hrs", time: "6:00 AM" },
  { day: "Fri", field: "North Field", duration: "4 hrs", time: "6:00 AM" },
];

// Harvest & Logistics Data
export const harvestSchedule = [
  { id: 1, field: "North Field", crop: "Maize", optimalDate: "Dec 15, 2024", status: "Ready", workers: 8 },
  { id: 2, field: "East Plot", crop: "Sorghum", optimalDate: "Dec 20, 2024", status: "Pending", workers: 5 },
  { id: 3, field: "South Field", crop: "Wheat", optimalDate: "Jan 5, 2025", status: "Upcoming", workers: 6 },
];

export const workers = [
  { id: 1, name: "Kwame Asante", role: "Harvester", status: "Available", rating: 4.8 },
  { id: 2, name: "Ama Mensah", role: "Driver", status: "On Task", rating: 4.9 },
  { id: 3, name: "Kofi Owusu", role: "Harvester", status: "Available", rating: 4.6 },
  { id: 4, name: "Akua Boateng", role: "Supervisor", status: "Available", rating: 5.0 },
];

export const deliverySchedule = [
  { id: 1, destination: "Kumasi Market", date: "Dec 16, 2024", cargo: "5 tons Maize", status: "Scheduled" },
  { id: 2, destination: "Accra Warehouse", date: "Dec 22, 2024", cargo: "3 tons Sorghum", status: "Pending" },
];

// Finance Data
export const cashflowData = [
  { month: "Jul", income: 12000, expenses: 8500 },
  { month: "Aug", income: 15000, expenses: 9200 },
  { month: "Sep", income: 18000, expenses: 10500 },
  { month: "Oct", income: 22000, expenses: 11000 },
  { month: "Nov", income: 25000, expenses: 12000 },
  { month: "Dec", income: 28000, expenses: 13500 },
];

export const loanOptions = [
  { id: 1, provider: "AgriBank", amount: 50000, rate: "8.5%", term: "12 months", status: "Eligible" },
  { id: 2, provider: "FarmCredit", amount: 30000, rate: "10%", term: "6 months", status: "Eligible" },
  { id: 3, provider: "MicroFinance Plus", amount: 15000, rate: "12%", term: "3 months", status: "Eligible" },
];

export const insuranceOptions = [
  { id: 1, type: "Crop Insurance", coverage: "Weather damage", premium: 500, provider: "AgriShield" },
  { id: 2, type: "Livestock Insurance", coverage: "Disease & theft", premium: 350, provider: "FarmGuard" },
  { id: 3, type: "Equipment Insurance", coverage: "Breakdown & damage", premium: 200, provider: "AgriShield" },
];

// Marketplace Data
export const listings = [
  { id: 1, title: "Fresh Maize - 500kg", price: 1225, seller: "John D.", location: "Kumasi", rating: 4.8, image: "maize" },
  { id: 2, title: "Organic Wheat - 200kg", price: 760, seller: "Mary K.", location: "Tamale", rating: 4.9, image: "wheat" },
  { id: 3, title: "Premium Sorghum - 300kg", price: 585, seller: "Peter A.", location: "Accra", rating: 4.7, image: "sorghum" },
  { id: 4, title: "Groundnuts - 100kg", price: 680, seller: "Grace O.", location: "Cape Coast", rating: 4.6, image: "groundnuts" },
];

export const transactions = [
  { id: 1, item: "Maize 200kg", buyer: "AgroTrade Ltd", amount: 490, date: "Nov 28, 2024", status: "Completed" },
  { id: 2, item: "Wheat 150kg", buyer: "FoodMart Inc", amount: 570, date: "Nov 25, 2024", status: "Completed" },
  { id: 3, item: "Sorghum 100kg", buyer: "LocalBuyer", amount: 195, date: "Dec 1, 2024", status: "In Progress" },
];

// Community Data
export const forumPosts = [
  { id: 1, title: "Best practices for maize storage", author: "FarmerJoe", replies: 23, views: 156, time: "2 hours ago" },
  { id: 2, title: "Dealing with fall armyworm", author: "AgriExpert", replies: 45, views: 289, time: "5 hours ago" },
  { id: 3, title: "Organic fertilizer recipes", author: "GreenThumb", replies: 18, views: 98, time: "1 day ago" },
  { id: 4, title: "Water conservation techniques", author: "SmartFarm", replies: 31, views: 201, time: "2 days ago" },
];

export const events = [
  { id: 1, title: "Farmers Training Workshop", date: "Dec 10, 2024", location: "Kumasi Agri Center", attendees: 45 },
  { id: 2, title: "Seed Fair 2024", date: "Dec 15, 2024", location: "Tamale Exhibition Hall", attendees: 120 },
  { id: 3, title: "Smart Farming Webinar", date: "Dec 18, 2024", location: "Online", attendees: 89 },
];

export const alerts = [
  { id: 1, type: "warning", title: "Price Drop Alert", message: "Wheat prices expected to drop 5% this week" },
  { id: 2, type: "info", title: "Weather Advisory", message: "Light rainfall expected in the next 48 hours" },
  { id: 3, type: "success", title: "Harvest Ready", message: "North Field maize has reached optimal maturity" },
];
