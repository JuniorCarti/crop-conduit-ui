# 🌱 **AgriSmart - AI-Powered Agricultural Intelligence Platform**

## 🚀 **Overview**

**AgriSmart** is a revolutionary multi-agent AI platform that transforms smallholder farmers in Africa from vulnerable producers into resilient, data-driven agri-entrepreneurs. Using five specialized AI agents working in concert, we provide predictive market insights, precise yield forecasts, climate resilience, post-harvest optimization, and financial visibility.

## 🎯 **Core Features**

### 🤖 **Multi-Agent AI System**
- **🌱 Sentinel Agent** - Real-time crop monitoring & yield forecasting via satellite imagery
- **📊 Oracle Agent** - Market price prediction & demand forecasting
- **💧 Quartermaster Agent** - Resource optimization & input management
- **🚚 Foreman Agent** - Harvest scheduling & logistics optimization
- **💰 Chancellor Agent** - Financial planning & risk assessment

### 🌍 **Platform Capabilities**
- **Predictive Analytics**: Forecast crop yields, market prices, and climate impacts
- **Real-time Monitoring**: Satellite-based field health tracking
- **Market Intelligence**: Best-price recommendations across regional markets
- **Resource Optimization**: Smart irrigation, fertilizer, and input management
- **Financial Tools**: Cash flow projections, loan readiness, and risk scoring
- **Offline Support**: USSD/SMS fallback for low-connectivity areas
- **Multi-language**: Swahili-first interface with English support

## 🏗️ **Technology Stack**

### **Frontend**
- **React** with **TypeScript** for type-safe development
- **Vite** for fast builds and hot module replacement
- **shadcn/ui** for beautiful, accessible components
- **Tailwind CSS** for utility-first styling
- **React Query** for server state management
- **Zustand** for client state management

### **Backend**
- **Node.js** with **Express** for API services
- **Firebase** for authentication, Firestore database, and cloud functions
- **Python FastAPI** for AI agent microservices
- **Redis** for caching and real-time features
- **Celery** for background task processing

### **AI/ML Stack**
- **TensorFlow/PyTorch** for machine learning models
- **Sentinel Hub API** for satellite imagery
- **OpenCV** for image processing
- **Scikit-learn** for traditional ML algorithms
- **Prophet** for time-series forecasting

### **Infrastructure**
- **Google Cloud Platform** for hosting and scaling
- **Docker** for containerization
- **GitHub Actions** for CI/CD
- **Terraform** for infrastructure as code
- **Prometheus & Grafana** for monitoring

## 📁 **Project Structure**

```
agrismart/
├── apps/
│   ├── web/                  # React web application
│   ├── mobile/               # Flutter mobile app (future)
│   └── admin/                # Admin dashboard
├── packages/
│   ├── api/                  # Backend API
│   ├── ai-agents/            # AI microservices
│   └── shared/               # Shared utilities & types
├── infrastructure/
│   ├── terraform/            # Infrastructure as Code
│   └── docker/               # Docker configurations
└── docs/                     # Documentation
```

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18+ and npm
- Python 3.10+
- Firebase CLI
- Docker (optional)

### **Local Development**

1. **Clone the repository**
```bash
git clone <your-repository-url>
cd agrismart
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start the development server**
```bash
npm run dev
```

5. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- AI Agents: http://localhost:8000

## 🛠️ **Development Scripts**

```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Run linting
npm run lint

# Type checking
npm run type-check

# Start AI agents locally
npm run agents:dev
```

## 🔧 **Configuration**

### **Environment Variables**
Create a `.env` file in the root directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Backend API
VITE_API_URL=http://localhost:3000

# AI Services
VITE_SENTINEL_API_URL=http://localhost:8001
VITE_ORACLE_API_URL=http://localhost:8002

# External APIs
SENTINELHUB_CLIENT_ID=your_client_id
SENTINELHUB_CLIENT_SECRET=your_secret
WEATHER_API_KEY=your_weather_api_key
```

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

## 📦 **Deployment**

### **Deploy to Lovable**
1. Push changes to your repository
2. Visit [Lovable](https://lovable.dev/projects/96453b19-d29e-489e-aaf2-bb1db34ec81d)
3. Click on Share → Publish

### **Manual Deployment**
```bash
# Build the application
npm run build

# Deploy to Firebase
npm run deploy:firebase

# Deploy AI agents
npm run deploy:agents
```

## 🔌 **API Integration**

### **Available Endpoints**
- `GET /api/v1/market-prices` - Current market prices
- `POST /api/v1/yield-forecast` - Yield prediction
- `GET /api/v1/field-health/:fieldId` - Field health status
- `POST /api/v1/recommendations` - AI recommendations

### **AI Agent APIs**
- Sentinel: `http://localhost:8001/ndvi` - NDVI analysis
- Oracle: `http://localhost:8002/predict` - Price prediction
- Quartermaster: `http://localhost:8003/optimize` - Resource optimization

## 🎨 **UI Components**

We use **shadcn/ui** components with custom theming. To add new components:

```bash
# Add a shadcn/ui component
npx shadcn-ui add button
```

Custom components are located in `apps/web/src/components/ui/`

## 📱 **Mobile Responsive**

The application is fully responsive with breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

## 🌐 **Internationalization**

Currently supports:
- 🇰🇪 Swahili (primary)
- 🇬🇧 English

To add new translations:
1. Add language file in `apps/web/src/locales/`
2. Update `apps/web/src/lib/i18n.ts`

## 🔒 **Security**

- Input validation on all endpoints
- CORS configuration
- Rate limiting
- Firebase security rules
- HTTPS enforcement in production
- Regular security audits

## 📈 **Analytics**

- User behavior tracking
- Feature usage metrics
- Error reporting with Sentry
- Performance monitoring
- A/B testing framework

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### **Code Style**
- Use TypeScript for all new code
- Follow ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📄 **License**

This project is proprietary and confidential. All rights reserved.

## 🆘 **Support**

For support, please:
1. Check the [documentation](docs/)
2. Search existing issues
3. Create a new issue with detailed information

## 🙏 **Acknowledgments**

- Kenyan farmers for their invaluable insights
- Agricultural research institutions for data partnerships
- Open source community for amazing tools
- Development partners for support and funding

---

**Built with ❤️ for African farmers**

---

*Last updated: December 2024*
