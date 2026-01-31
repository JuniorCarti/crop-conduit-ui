# 🌱 AgriSmart

## AI-Powered Agricultural Intelligence Platform
## 🚀 Overview
**AgriSmart** is an **AI-powered agricultural intelligence platform** designed to protect **smallholder farmers** from **climate shocks, market exploitation, and post-harvest losses**.

At the center of the platform is **Asha**, a conversational AI assistant that helps farmers decide **when to plant, harvest, sell, and transport produce** using **real climate data, live market prices, and logistics intelligence**.

AgriSmart combines **climate insights, market intelligence, logistics coordination, and a digital marketplace** into a single, farmer-friendly system built for **African realities**.

## 🎯 What AgriSmart Solves

* Farmers sell blindly without **price visibility**
* Climate shocks destroy crops with **little or no warning**
* Poor logistics cause **post-harvest losses**
* Middlemen exploit **information gaps**
* Existing digital tools ignore **local context and language**

**AgriSmart turns this chaos into clarity.**

## 🤖 Asha – Conversational AI Assistant

**Asha** is a **task-aware, action-capable AI agent** built to support real farming decisions.

### What Asha Can Do

* Explain **today’s and upcoming weather** in simple language
* Recommend the **best day to harvest**
* Identify the **best market and price** to sell produce
* Help farmers **list produce** on the marketplace
* Assist buyers to **place orders**
* Detect **climate risks** (frost, rainfall, heat stress, disease)
* Guide **logistics and delivery decisions**
* Work via **text and voice**

Asha is designed for **low-literacy, mobile-first users**.
## 🌍 Core Platform Features

### 🌦️ Climate Intelligence

* 7–10 day forecast insights
* Frost, rainfall, heat stress, wind, and disease risk detection
* Crop-aware recommendations
* Farm-specific insights using GPS location
### 📊 Market Intelligence

* Live market prices across regions
* Price trend awareness
* Market comparison insights
* Best-time-to-sell recommendations

### 🛒 Marketplace

* Farmers list produce with images and prices
* Buyers browse and place orders
* Cart and checkout flow
* Reviews and ratings
* Seller and buyer order tracking

### 🚚 Harvest & Logistics

* Harvest scheduling
* Worker assignment
* Delivery planning
* Transport readiness indicators
* Weather-aware market delivery suitability

### 🔔 Alerts & Notifications

* Climate alerts
* Market opportunities
* Order updates
* Delivered via **WhatsApp, SMS, and Email**

### 🌐 Accessibility

* Mobile-first UI
* Swahili-first (English supported)
* Optimized for low-bandwidth environments

## 🏗️ Technology Stack (Actual & Deployed)

### Frontend

* React + TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* Responsive mobile-first design

### Backend (Serverless & Edge)

* Cloudflare Workers – API layer & AI orchestration
* Cloudflare D1 – Conversation memory & structured AI state
* Cloudflare R2 – Image and asset storage (S3-compatible)
* Firebase Authentication – Secure user login
* Firebase Firestore – Farms, listings, orders, profiles

### AI & Voice

* OpenAI APIs – AI reasoning & recommendations
* Microsoft Azure AI / Speech Services – Voice input/output for Asha
* Prompt-driven agent architecture (no hallucinated automation)
  
### Market Prediction

* Market price prediction model hosted on Render (U.S.)
* Consumed via API by AgriSmart frontend and Asha

### Notifications

* Twilio – WhatsApp & SMS alerts
* Resend – Transactional email notifications

### Cloud Infrastructure

* Cloudflare (U.S.) – Edge compute, storage, AI routing
* AWS (U.S.) – DynamoDB and S3-compatible services
* Google Cloud Firebase (U.S.) – Identity and real-time data
* Microsoft Azure (U.S.) – Voice AI services

## 🧠 Data Sources Used

* Weather forecast APIs (via Cloudflare Worker proxy)
* Market price datasets (live + predicted)
* Farmer-generated farm, crop, and harvest data
* Marketplace transactions and reviews

## 📁 Project Structure

```bash
crop-conduit-ui/
├── src/
│   ├── pages/               # App pages (Climate, Marketplace, Harvest, Asha)
│   ├── components/          # UI components
│   ├── services/            # Firestore, Workers, AI, logistics services
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript types
│   └── utils/               # Helpers & datasets
│
├── agrismart-advisory/      # Cloudflare Worker (Asha backend)
│   ├── src/
│   ├── migrations/          # D1 database migrations
│   └── wrangler.jsonc
│
├── firestore.rules
├── firestore.marketplace.rules
└── README.md
```

## 🔒 Security & Data Protection

* Firebase Authentication
* Strict Firestore security rules
* User-scoped data access
* No client-side admin privileges
* Cloudflare edge security & rate limiting
* HTTPS enforced everywhere

## 📈 Scalability & Reliability

* Fully serverless architecture
* Edge-based APIs for low latency
* No vendor lock-in (multi-cloud)
* Works independently of Firebase Cloud Functions

## 🇺🇸 U.S. Technology Compliance

AgriSmart is built entirely on **U.S.-based cloud and AI infrastructure**, including:

* Cloudflare
* Microsoft Azure
* Google Cloud
* AWS
* Render
* Twilio
* OpenAI

## 🌍 Impact Vision

AgriSmart enables farmers to:

* Earn fairer prices
* Reduce climate-related losses
* Plan confidently
* Access markets digitally
* Make decisions with data, not guesswork

## 🙏 Acknowledgments

* Kenyan farmers who shaped the product
* Open-source community
* Climate and agriculture research partners
* Innovation hubs and mentors


**Built with purpose for African farmers.**
**Designed for scale.**
**Ready for investment and impact.**
