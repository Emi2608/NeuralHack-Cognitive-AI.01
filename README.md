# NeuralHack Cognitive AI

A mobile-first Progressive Web App (PWA) for early screening of neurodegenerative diseases (Alzheimer's, Parkinson's, dementia) and depression, designed for Mexican and Latin American communities.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd neuralhack-cognitive-ai
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials.

4. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

### Ionic Commands

- `npm run ionic:serve` - Serve with Ionic CLI
- `npm run ionic:build` - Build with Ionic CLI

### Capacitor Commands (Mobile)

- `npm run cap:add` - Add mobile platform
- `npm run cap:sync` - Sync web assets to mobile
- `npm run cap:open` - Open in native IDE

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components
│   ├── forms/          # Form components
│   ├── charts/         # Data visualization
│   ├── assessments/    # Cognitive test components
│   └── accessibility/  # Accessibility components
├── pages/              # Route-based pages
│   ├── auth/          # Authentication pages
│   ├── assessments/   # Assessment pages
│   ├── dashboard/     # Dashboard pages
│   ├── profile/       # Profile pages
│   └── education/     # Educational content
├── hooks/             # Custom React hooks
├── services/          # API integration layer
├── store/             # State management (Zustand)
├── utils/             # Helper functions
├── types/             # TypeScript definitions
├── constants/         # App constants
├── locales/           # Internationalization
├── assets/            # Static assets
├── styles/            # Global styles and themes
└── tests/             # Test files
```

## 🧪 Testing

The project uses Vitest for unit testing and Playwright for E2E testing.

### Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# E2E tests (when implemented)
npm run test:e2e
```

## 🎨 Styling

- **Framework**: Ionic React components
- **CSS**: CSS custom properties (variables)
- **Themes**: Light/dark mode support
- **Accessibility**: High contrast mode, font scaling

## 🌐 Internationalization

The app supports Spanish (primary) and English:

- Translation files: `src/locales/`
- Default language: Spanish (es)
- Fallback language: Spanish (es)

## 📱 PWA Features

- Offline functionality with Service Workers
- App-like experience on mobile devices
- Push notifications (planned)
- Background sync (planned)

## 🔒 Security & Privacy

- End-to-end encryption for PII data
- GDPR/HIPAA/LFTIDPI compliance
- Row Level Security (RLS) in Supabase
- Audit logging for all data access

## 🏥 Medical Compliance

- Software as Medical Device (SaMD) - COFEPRIS
- Clinical validation with Mexican institutions
- Evidence-based cognitive assessments

## 📊 Assessments Included

- **MoCA**: Montreal Cognitive Assessment
- **PHQ-9**: Patient Health Questionnaire (Depression)
- **MMSE**: Mini-Mental State Examination
- **AD8**: Alzheimer's Disease 8-item Informant Interview
- **Parkinson's**: Parkinson's Disease Screening

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@neuralhack.com or create an issue in the repository.

## 🔗 Links

- [Documentation](docs/)
- [API Reference](docs/api.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)