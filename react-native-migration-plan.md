# React Web to React Native Migration Prompt

## Part 1: Analyze My Existing React Web App

### Application Overview
**App Name:** Crime Analysis Dashboard
**App Description:** A comprehensive web application for analyzing and visualizing crime data with interactive maps, charts, statistics, AI-powered insights, and data management capabilities.
**Target Users:** Law enforcement agencies, crime analysts, researchers, and public safety officials who need to analyze crime patterns, trends, and statistics.

### Current Tech Stack
**Frontend Framework:**
React with JavaScript
React Version: 19.1.1

**State Management:**
React Context API

**Routing:**
Custom conditional rendering (no React Router)

**API/Data Fetching:**
Axios
TanStack React Query / React Query

**Form Management:**
Custom form handling

**UI Framework/Styling:**
Tailwind CSS

**Authentication:**
JWT tokens

### Core Features to Migrate

**Feature 1: User Authentication**
- Login screen with email/password and CAPTCHA
- User registration
- Password recovery (email-based)
- JWT token-based authentication
- Role-based access control (viewer/admin)
- Protected routes and components

**Feature 2: Crime Data Visualization Dashboard**
- Interactive crime heatmap with Leaflet maps
- Crime density contour overlays
- Real-time filtering by date range, crime type, city, time ranges
- Collapsible filter panels
- Responsive dashboard layout

**Feature 3: Statistical Analysis**
- Total crimes statistics
- Date range analysis
- Monthly growth tracking
- Trend direction indicators
- Crime type distribution charts
- Year-over-year comparisons
- Semester-over-semester analysis

**Feature 4: Charts and Analytics**
- Hourly crime patterns
- Daily/weekly/monthly trends
- Moving averages analysis
- Forecast predictions
- City-based crime statistics
- Weekday vs weekend comparisons
- Growth rate calculations

**Feature 5: AI-Powered Chat Interface**
- Natural language queries about crime data
- AI-generated insights and analysis
- Filter-aware responses
- Real-time data analysis

**Feature 6: Data Management**
- CSV/Excel data upload with validation
- Data export functionality
- Cache management and statistics
- Crime record CRUD operations
- Bulk data processing

**Feature 7: Geographic Analysis**
- Spatial clustering analysis
- Location-based statistics
- City and neighborhood breakdowns
- Interactive map controls

### API Endpoints
**Base URL:** /api
**Authentication Method:** Bearer token (JWT)
**Key Endpoints:**
```
POST   /auth/login
POST   /auth/register
POST   /auth/forgot-password
GET    /crimes
GET    /heatmap
GET    /density
GET    /summary
GET    /temporal
GET    /spatial
GET    /trends/year-over-year
GET    /trends/growth-rates
GET    /trends/moving-averages
GET    /trends/weekly-moving-averages
GET    /trends/forecast
GET    /cities
GET    /semester-comparison
POST   /chat
POST   /upload
GET    /export
GET    /cache/stats
POST   /cache/clear
GET    /locations/cities
POST   /crimes (CRUD)
PUT    /crimes/:id
DELETE /crimes/:id
```

### App Structure
**Current Folder Structure:**
```
src/
├── components/
│   ├── CrimeDashboard.jsx
│   ├── Login.jsx
│   ├── DashboardHeader.jsx
│   ├── FilterPanel.jsx
│   ├── CollapsibleFilterBar.jsx
│   ├── Sidebar.jsx
│   ├── CrimeMap.jsx
│   ├── StatisticsPanel.jsx
│   ├── DashboardStatistics.jsx
│   ├── ChartsGrid.jsx
│   ├── ChatInterface.jsx
│   ├── ExportPanel.jsx
│   ├── DataUpload.jsx
│   ├── CrimeManagement.jsx
│   ├── CacheStatus.jsx
│   ├── LoadingSpinner.jsx
│   ├── ThemeContext.jsx
│   ├── charts/
│   │   ├── CrimeInsights.jsx
│   │   ├── CrimeTypesChart.jsx
│   │   ├── ForecastChart.jsx
│   │   ├── GrowthRateChart.jsx
│   │   ├── HourlyChart.jsx
│   │   ├── MonthlyChart.jsx
│   │   ├── MovingAveragesChart.jsx
│   │   ├── SemesterComparisonChart.jsx
│   │   ├── WeekdayWeekendChart.jsx
│   │   ├── YearOverYearChart.jsx
│   │   └── CityInfoChart.jsx
│   └── statistics/
│       ├── TotalCrimesStat.jsx
│       ├── DateRangeStat.jsx
│       ├── MonthlyGrowthStat.jsx
│       ├── TrendDirectionStat.jsx
│       ├── TopCrimeTypesStat.jsx
│       └── YearOverYearStat.jsx
├── contexts/
│   ├── AuthContext.js
│   └── AuthProvider.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useCrimeData.js
│   ├── useTheme.js
│   └── useChartExport.js
├── locales/
│   ├── en/translation.json
│   └── pt-BR/translation.json
└── utils/
    └── i18n.js
```

**Main Routes:**
/ (authenticated) → CrimeDashboard
/login (unauthenticated) → Login

### Business Logic to Preserve

**Custom Hooks:**
- `useAuth()` - Manages authentication state and user context
- `useCrimeDataSets()` - Orchestrates all crime data API calls with React Query
- `useTheme()` - Manages dark/light theme state
- `useChartExport()` - Handles chart export functionality
- `useInvalidateQueries()` - Manages query invalidation for data refresh

**Utilities/Helpers:**
- `i18n.js` - Internationalization setup with react-i18next
- Custom API interceptors for JWT token management
- Query key management for React Query caching
- Filter parameter handling and URL encoding

**State Management Logic:**
- Authentication state (user info, token, login status)
- Theme state (dark/light mode)
- Global filter state for crime data queries
- Loading states for various data operations

## Part 2: Generate My React Native App

I have a React web application and need to create a React Native mobile version that maintains all core functionality. Here are the details:

**Application:** Crime Analysis Dashboard - A comprehensive mobile application for analyzing and visualizing crime data with interactive maps, charts, statistics, AI-powered insights, and data management capabilities.

**Current Stack:** React 19.1.1 with JavaScript, React Context API for state management, Axios + TanStack React Query for API calls, Tailwind CSS for styling, JWT authentication, custom conditional routing.

**Core Features to Implement:**
1. User Authentication (login, register, password recovery, JWT tokens, role-based access)
2. Crime Data Visualization Dashboard (maps, heatmaps, filtering, statistics)
3. Statistical Analysis (total crimes, growth rates, trends, comparisons)
4. Charts and Analytics (temporal patterns, forecasts, city breakdowns)
5. AI-Powered Chat Interface (natural language queries, AI insights)
6. Data Management (upload, export, cache management, CRUD operations)
7. Geographic Analysis (spatial clustering, location statistics)

**API Integration:**

**Base URL:** /api
**Authentication:** Bearer token (JWT)
**Key endpoints:** All endpoints listed above in Part 1

**Requirements:**

**Project Setup:**

Create a React Native app using Expo
Use JavaScript (matching web app)
Set up the same folder structure adapted for mobile

**Navigation:**

Implement React Navigation with the following screens:
- AuthStack: Login, Register, ForgotPassword
- MainStack: Dashboard, Statistics, Map, Charts, Chat, Filters, Upload, Export, Cache, Crimes
Include tab navigation for main sections (Dashboard, Statistics, Map, Charts, Chat)
Stack navigation for detailed views and modals
Implement the same authentication flow as the web app

**State Management:**

Use React Context API (same as web app)
Preserve all business logic from the web app
Maintain the same state structure

**API Services:**

Create API service layer identical to web app
Use Axios with the same configuration
Implement token management and refresh logic
Handle offline scenarios with AsyncStorage

**Reusable Business Logic:**

Port these custom hooks from web app:
- useAuth() - Authentication state management
- useCrimeDataSets() - Crime data API orchestration
- useTheme() - Theme management
- useChartExport() - Chart export functionality
- useInvalidateQueries() - Query invalidation

Port these utility functions:
- i18n setup for internationalization
- API interceptors for JWT handling
- Query key management
- Filter parameter utilities

Maintain the same validation logic

**UI Components:**

Create mobile-optimized versions of all web components
Use React Native Paper for consistent Material Design components
Maintain similar user flows and UX patterns
Ensure responsive design for different screen sizes

**Features Parity:**
For each feature from my web app, implement the mobile equivalent:
1. Authentication: Login/register screens with CAPTCHA, secure token storage
2. Dashboard: Main screen with statistics cards and navigation tabs
3. Statistics: Dedicated screen with all statistical components
4. Map: Full-screen map with heatmap overlays and filters
5. Charts: Scrollable chart gallery with all analytics
6. Chat: AI chat interface with message history
7. Filters: Modal or collapsible filter panel
8. Upload: File picker and upload progress
9. Export: Data export with format selection
10. Cache: Cache statistics and clear functionality
11. Crimes: Crime record management with search/filter

**Additional Mobile Features:**

Push notifications setup
Handle deep linking
Implement pull-to-refresh
Add loading states and error handling
Offline data persistence with AsyncStorage

**Authentication:**

Implement the same authentication flow
Securely store tokens using expo-secure-store
Handle token refresh
Protected navigation guards

**Code Organization:**

Maintain separation of concerns
Keep business logic separate from UI
Create reusable components
Follow the same patterns as the web app

**File Structure:**
```
src/
├── components/        # UI components (mobile versions)
├── screens/          # Screen components (from web pages)
├── navigation/       # Navigation configuration
├── services/         # API services (same as web)
├── hooks/           # Custom hooks (same logic as web)
├── utils/           # Utility functions (same as web)
├── store/           # State management (same structure)
├── types/           # TypeScript types (same as web)
├── constants/       # Constants (same as web)
├── theme/           # Theme configuration
└── assets/          # Images and other assets
```

**Deliverables:**

Complete project setup with all dependencies
Navigation structure with all screens
API integration with all endpoints
All custom hooks ported from web app
State management implemented
Authentication flow working
All core features functional
Error handling and loading states
README with setup instructions

**Additional Context:**
This is a data-heavy application requiring efficient handling of large datasets, smooth map interactions, and responsive chart rendering. The mobile version should prioritize touch interactions, gesture-based navigation, and optimized performance for mobile networks. Maintain the same level of analytical depth as the web version while adapting the UI for smaller screens and touch interfaces.

## Part 3: Validation Checklist

After generating your React Native app, verify:

- [ ] All web app features are present in mobile app
- [ ] Authentication works the same way
- [ ] API calls use the same endpoints
- [ ] Business logic is preserved
- [ ] State management works identically
- [ ] Custom hooks function the same
- [ ] Form validation is consistent
- [ ] Error handling matches web app
- [ ] User flows are similar
- [ ] Data persistence works correctly