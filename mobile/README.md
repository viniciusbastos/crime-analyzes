# Crime Analysis Mobile App

A React Native mobile application for crime data analysis, built with Expo and featuring the same functionality as the web dashboard.

## Features Implemented

### ✅ Completed Features

- **Project Setup**: Expo React Native project with proper folder structure
- **Navigation**: React Navigation with stack and tab navigators
- **Authentication**: Login, register, and password recovery screens with JWT token management
- **State Management**: React Context API for authentication state
- **API Integration**: Axios with React Query for data fetching
- **Internationalization**: English and Portuguese (pt-BR) support
- **UI Framework**: React Native Paper for Material Design components

### 🔄 In Progress

- **Dashboard Screen**: Main dashboard with statistics overview
- **Statistics Screen**: Detailed crime statistics and analytics
- **Map Screen**: Interactive crime map with heatmap visualization
- **Charts Screen**: Various chart types for data visualization
- **AI Chat Interface**: Natural language queries for crime data
- **Data Management**: Upload, export, and cache management features

### 📋 Planned Features

- **Theme System**: Dark/light mode support
- **Offline Storage**: AsyncStorage for offline data persistence
- **Push Notifications**: Real-time alerts and updates
- **Deep Linking**: Direct navigation to specific crime records

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Context API
- **API Client**: Axios + TanStack React Query
- **UI Components**: React Native Paper
- **Maps**: React Native Maps
- **Charts**: React Native Chart Kit
- **Authentication**: JWT tokens with secure storage
- **Internationalization**: react-i18next

## Project Structure

```
mobile/
├── src/
│   ├── components/        # Reusable UI components
│   ├── screens/          # Screen components
│   │   ├── auth/         # Authentication screens
│   │   ├── DashboardScreen.js
│   │   ├── StatisticsScreen.js
│   │   ├── MapScreen.js
│   │   ├── ChartsScreen.js
│   │   └── ChatScreen.js
│   ├── navigation/       # Navigation configuration
│   ├── services/         # API services (to be implemented)
│   ├── hooks/           # Custom hooks
│   ├── contexts/        # React contexts
│   ├── utils/           # Utility functions
│   ├── constants/       # App constants
│   ├── locales/         # Translation files
│   └── assets/          # Images and assets
├── App.js               # Main app component
└── package.json
```

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- iOS Simulator (macOS) or Android Emulator/Device

### Installation

1. **Install dependencies:**
   ```bash
   cd mobile
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on device/emulator:**
   - For iOS: Press `i` in the terminal or scan QR code with Camera app
   - For Android: Press `a` in the terminal or scan QR code with Expo Go app
   - For web: Press `w` in the terminal

### Backend Connection

The app expects a backend API running at `http://localhost:5000/api`. Make sure your crime analysis backend is running before using the mobile app.

## API Integration

The app uses the same API endpoints as the web application:

- Authentication: `/auth/login`, `/auth/register`, `/auth/forgot-password`
- Crime Data: `/crimes`, `/heatmap`, `/summary`, `/temporal`, etc.
- Chat: `/chat`
- Data Management: `/upload`, `/export`, `/cache/*`

## Authentication Flow

1. **Login Screen**: Email/password authentication with "Remember Me" option
2. **Registration**: New user signup with validation
3. **Password Recovery**: Email-based password reset
4. **Token Management**: JWT tokens stored securely using Expo SecureStore
5. **Auto-login**: Automatic authentication on app restart

## Navigation Structure

```
App Navigator (Stack)
├── Auth Stack (when not authenticated)
│   ├── Login Screen
│   ├── Register Screen
│   └── Forgot Password Screen
└── Main Tab Navigator (when authenticated)
    ├── Dashboard Tab
    ├── Statistics Tab
    ├── Map Tab
    ├── Charts Tab
    └── Chat Tab
```

## Development Notes

### Code Organization

- **Screens**: Main UI components representing full screens
- **Components**: Reusable UI elements
- **Hooks**: Custom React hooks for data fetching and state management
- **Contexts**: Global state management
- **Services**: API communication logic
- **Utils**: Helper functions and configurations

### State Management

The app uses React Context API for global state:
- **AuthContext**: User authentication state and actions
- **Future**: Theme context for dark/light mode

### Data Fetching

- **React Query**: For server state management and caching
- **Axios**: HTTP client with interceptors for authentication
- **Offline Support**: Planned with AsyncStorage

### Styling

- **React Native Paper**: Material Design components
- **Inline Styles**: For custom styling
- **Responsive Design**: Adapts to different screen sizes

## Testing

### Manual Testing Checklist

- [ ] Authentication flow (login/register/logout)
- [ ] Navigation between tabs
- [ ] API calls and error handling
- [ ] Offline functionality
- [ ] Internationalization switching
- [ ] Form validation
- [ ] Loading states

### Device Testing

Test on multiple devices and screen sizes:
- iPhone SE (small screen)
- iPhone 12/13 (standard screen)
- iPad (large screen)
- Android phones (various sizes)

## Deployment

### Build Commands

```bash
# Build for production
expo build:ios
expo build:android

# Submit to stores
expo submit --platform ios
expo submit --platform android
```

### Environment Configuration

Create environment files for different builds:
- `.env.production`
- `.env.staging`
- `.env.development`

## Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for new components (planned migration)
3. Write clear commit messages
4. Test on multiple devices before submitting PRs

## Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `expo r -c`
2. **Package version conflicts**: Check Expo SDK compatibility
3. **iOS build failures**: Ensure CocoaPods is installed and up to date
4. **Android build failures**: Check Android SDK and build tools versions

### Debug Mode

Enable debug mode in development:
```javascript
if (__DEV__) {
  console.log('Debug information');
}
```

## License

This project is part of the Crime Analysis Dashboard suite.


