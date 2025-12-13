# Invest_IQ 💰

An intelligent investment tracking and finance automation platform built with cutting-edge technologies. Invest_IQ helps users manage their portfolios, create investment plans, track transactions, and automate financial workflows with AI-powered insights.

## 🌟 Features

### Core Features
- **Dashboard**: Real-time portfolio overview and financial metrics
- **Investment Planning**: AI-powered investment plan generation based on risk profile and goals
- **Portfolio Management**: Track multiple investment accounts and assets
- **Transaction Management**: Record and categorize all financial transactions
- **Wallet System**: Manage digital wallets and fund transfers
- **Risk Assessment**: Dynamic risk questionnaire with personalized recommendations
- **KYC Verification**: Know Your Customer identity verification flow
- **Account Management**: Multi-account support with role-based access

### Advanced Features
- **AI Recommendations**: Gemini-powered investment recommendations
- **Market Data Simulation**: Real-time market data simulator for testing
- **Investment Calculators**: SIP, investment comparison, and generic calculators
- **Email Notifications**: Automated alerts for transactions and account activities
- **Payment Integration**: Razorpay integration for seamless payments
- **Security**: ArcJet protection and PIN-based authentication
- **Task Automation**: Inngest-powered background job scheduling
- **Responsive Design**: Mobile-first UI with Tailwind CSS and Shadcn/ui

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 (with Turbopack)
- **Language**: JavaScript/JSX
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui, Radix UI
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form
- **State Management**: React Hooks
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Framework**: Next.js API Routes
- **Authentication**: Clerk
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Task Queue**: Inngest
- **Email Service**: Resend
- **Security**: ArcJet
- **Payment Gateway**: Razorpay

### AI & Analytics
- **AI Model**: Google Generative AI (Gemini)
- **PDF Generation**: jsPDF
- **Data Export**: jsPDF AutoTable

## 📋 Prerequisites

Before you begin, ensure you have the following:
- Node.js 18+ and npm/yarn
- Git
- A Supabase account (for database)
- A Clerk account (for authentication)
- Google Generative AI API key
- Resend API key (for emails)
- ArcJet API key (for security)
- Razorpay API keys (for payments)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/darshand36/Invest_IQ.git
cd Invest_IQ
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=your_supabase_database_url
DIRECT_URL=your_supabase_direct_url

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/onboarding
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# AI (Google Generative AI)
GEMINI_API_KEY=your_gemini_api_key

# Email Service
RESEND_API_KEY=your_resend_api_key

# Security
ARCJET_KEY=your_arcjet_api_key

# Payment Gateway
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Task Queue
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key
```

### 4. Setup Database

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 📁 Project Structure

```
├── app/                          # Next.js app directory
│   ├── (auth)/                  # Authentication pages
│   │   ├── sign-in/
│   │   └── sign-up/
│   ├── (main)/                  # Main application pages
│   │   ├── account/
│   │   ├── calculator/
│   │   ├── dashboard/
│   │   ├── kyc/
│   │   ├── portfolio/
│   │   ├── risk-assessment/
│   │   ├── transaction/
│   │   └── wallet/
│   ├── api/                     # API routes
│   │   ├── inngest/
│   │   ├── seed/
│   │   └── webhooks/
│   └── lib/                     # Database schema
│
├── components/                  # React components
│   ├── ui/                      # Shadcn UI components
│   ├── calculators/             # Calculator components
│   └── [feature components]/
│
├── actions/                     # Server actions
│   ├── account.js
│   ├── budget.js
│   ├── dashboard.js
│   ├── investment.js
│   ├── portfolio.js
│   ├── transaction.js
│   └── [other actions]/
│
├── lib/                         # Utility functions
│   ├── arcjet.js
│   ├── email-service.js
│   ├── investment-calculator.js
│   ├── payment-gateway.js
│   ├── prisma.js
│   ├── risk-assessment.js
│   └── [other utilities]/
│
├── emails/                      # Email templates
│   ├── low-balance-alert.jsx
│   ├── overspend-alert.jsx
│   └── transaction-receipt.jsx
│
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma
│   └── migrations/
│
├── public/                      # Static assets
│
├── hooks/                       # Custom React hooks
│   └── use-fetch.js
│
└── data/                        # Static data
    ├── categories.js
    └── landing.js
```

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start development server with Turbopack

# Production
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database
npx prisma generate     # Generate Prisma client
npx prisma migrate dev  # Run migrations
npm run seed            # Seed database with sample data

# Email
npm run email           # Start email development server

# Utilities
npm run generate-report # Generate PDF report
```

## 🔐 Authentication & Security

- **Clerk**: Secure user authentication with multiple sign-in methods
- **ArcJet**: Real-time threat protection and rate limiting
- **PIN Authentication**: Additional security layer for sensitive operations
- **Role-Based Access**: Different user roles with specific permissions

## 💳 Payment Integration

The platform integrates with **Razorpay** for secure payment processing:
- Multiple payment methods support
- Subscription management
- Transaction tracking and reporting

## 📧 Email Notifications

Automated email alerts for:
- Transaction confirmations
- Low balance warnings
- Overspend alerts
- Account updates

## 🤖 AI Features

### Investment Recommendations
- Powered by Google Generative AI (Gemini)
- Personalized recommendations based on:
  - Risk profile
  - Investment goals
  - Market conditions
  - Portfolio composition

### Risk Assessment
- Dynamic questionnaire system
- Risk profile calculation
- Personalized risk recommendations
- Portfolio allocation suggestions

## 📊 Key Modules

### Portfolio Management
- Track multiple investment accounts
- Asset allocation visualization
- Performance analytics
- Rebalancing recommendations

### Investment Planning
- Goal-based planning
- Multi-step plan creation
- Risk questionnaire
- Plan approval workflow
- Plan modification and tracking

### Dashboard
- Real-time metrics
- Portfolio overview
- Recent transactions
- Quick actions
- Customizable widgets

### Transaction Management
- Record all transactions
- Categorization
- Search and filter
- Export functionality
- Transaction receipts

## 🚀 Deployment

### Deploy to Vercel (Recommended)

```bash
# Push to GitHub
git push origin main

# Connect to Vercel dashboard at https://vercel.com
# Select your repository and deploy
```

### Environment Variables for Production
Ensure all environment variables are set in your Vercel project settings.

## 📝 API Documentation

### Key API Endpoints

**Authentication**
- `POST /api/auth/sign-up` - User registration
- `POST /api/auth/sign-in` - User login

**Portfolio**
- `GET /api/portfolio` - Get portfolio data
- `POST /api/portfolio/create-plan` - Create investment plan

**Transactions**
- `GET /api/transactions` - Fetch transactions
- `POST /api/transactions` - Record transaction

**Risk Assessment**
- `POST /api/risk-assessment` - Calculate risk profile

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch
```

## 🐛 Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Check Supabase network access settings
- Ensure PostgreSQL extensions are enabled

### Authentication Errors
- Verify Clerk API keys are correct
- Check redirect URLs in Clerk dashboard
- Clear browser cookies and local storage

### AI/API Errors
- Verify API keys are active and not expired
- Check rate limits on respective services
- Review API documentation for specific error codes

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, please:
- Open an issue on GitHub
- Contact the development team
- Check existing documentation

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Real broker integration
- [ ] Cryptocurrency support
- [ ] Advanced portfolio optimization
- [ ] Machine learning predictions
- [ ] Multi-currency support

## 👨‍💻 Author

**Invest_IQ Development Team**
- GitHub: [@darshand36](https://github.com/darshand36)
- Repository: [Invest_IQ](https://github.com/darshand36/Invest_IQ)

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Last Updated**: December 2025
**Version**: 1.0.0

##Screenshots
![Dashboard](https://github.com/user-attachments/assets/ef274e80-4c91-4601-9960-8898ac07b559)
![Wallet](https://github.com/user-attachments/assets/626868e4-c3d2-4638-b26d-79965c22db19)
![Portfolio](https://github.com/user-attachments/assets/e213a965-efc5-47c2-90f6-4086f7b4298c)
![Risk Profile](https://github.com/user-attachments/assets/26b3b1e6-433d-4957-9b38-b2fe1b00e3a8)
![KYC](https://github.com/user-attachments/assets/641b25d9-238d-4e7a-b181-04d7d6c000df)
