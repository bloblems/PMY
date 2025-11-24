# Press Means Yes

A React Native mobile application built with Expo for managing consent contracts and Title IX compliance.

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for Mac) or Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Press-Means-Yes
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your Supabase credentials:
```
EXPO_PUBLIC_SUPABASE_PROJECT_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_PUBLIC=your_supabase_anon_key
```

### Running the App

Start the Expo development server:
```bash
npm start
```

Then:
- Press `i` to open in iOS Simulator
- Press `a` to open in Android Emulator
- Scan the QR code with Expo Go app on your device

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run ios` - Start and open iOS simulator
- `npm run android` - Start and open Android emulator
- `npm run web` - Start web version

## 📁 Project Structure

```
app/
├── (tabs)/          # Tab-based navigation screens
│   ├── contracts/   # Contract management
│   ├── create/      # Consent flow creation
│   ├── profile/     # User profile and settings
│   └── tools/       # Utility tools
├── components/       # Reusable UI components
├── contexts/        # React contexts
├── hooks/           # Custom React hooks
├── lib/             # Utilities and configurations
└── services/        # API and storage services
```

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **State Management**: React Query (TanStack Query)
- **Backend**: Supabase
- **Language**: TypeScript
- **Styling**: React Native StyleSheet

## 🔐 Environment Variables

The app requires the following environment variables (see `.env.example`):

- `EXPO_PUBLIC_SUPABASE_PROJECT_URL` - Your Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_PUBLIC` - Your Supabase anonymous/public key

**⚠️ Important**: Never commit your `.env` file to version control. The `.env.example` file is provided as a template.

## 📝 Database Setup

See `SUPABASE_MISSING_SCHEMA.sql` for database schema setup instructions.

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

[Add your license here]

