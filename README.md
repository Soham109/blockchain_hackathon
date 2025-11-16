# UniMarket

A student-only marketplace platform for buying and selling textbooks, electronics, furniture, and other items within college communities. Built with Next.js, MongoDB, and blockchain payment integration.

## Overview

UniMarket is a verified student marketplace that connects buyers and sellers within the same academic community. The platform ensures security through .edu email verification and student ID validation, while providing a seamless trading experience with zero transaction fees.

## Features

### User Authentication & Verification
- Email-based authentication with .edu domain validation
- Student ID verification using OCR and AI
- Role-based access (Buyer/Seller)
- Secure session management with NextAuth.js

### Product Management
- Create, edit, and manage product listings
- Multiple image uploads with automatic compression
- Product categorization and search
- Product boosting for increased visibility
- Wishlist functionality
- Product comparison tools

### Messaging System
- Real-time chat between buyers and sellers
- Image support in messages
- Conversation management
- Message read receipts

### Payment Integration
- Blockchain payments via Solana and Ethereum/Arbitrum
- Payment history tracking
- Transaction verification
- Support for listing fees and product boosts

### Additional Features
- User profiles and avatars
- Order management
- Review and rating system
- Price alerts
- Saved searches
- Activity feed
- Analytics dashboard for sellers

## Tech Stack

### Frontend
- Next.js 16.0.3 (App Router)
- React 19.2.0
- TypeScript
- Tailwind CSS 4.1.17
- Radix UI components
- Framer Motion for animations
- Wagmi and Viem for Ethereum integration
- Solana Web3.js for Solana integration

### Backend
- Next.js API Routes
- NextAuth.js for authentication
- MongoDB 5.9.2 for database
- bcryptjs for password hashing
- Nodemailer/Resend for email services

### Blockchain
- Solana blockchain integration
- Ethereum/Arbitrum integration
- Hardhat for smart contract development
- Local blockchain node support

### Additional Services
- Cloudinary for image hosting
- Tesseract.js for OCR
- Google Generative AI for ID verification

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js 20.x or higher
- npm or yarn
- MongoDB (local or Atlas connection string)
- Git

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blockchain_hackathon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Variables section)

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/college-marketplace
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (choose one)
# Option 1: Resend
RESEND_API_KEY=your-resend-api-key

# Option 2: Nodemailer (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary (for image hosting)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google Generative AI (for ID verification)
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key

# Blockchain Configuration
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
# Or: mainnet-beta, testnet

# Ethereum/Arbitrum
NEXT_PUBLIC_ARBITRUM_RPC_URL=https://arb1.arbitrum.io/rpc
# Or for local: http://localhost:8545
```

### Generating NEXTAUTH_SECRET

You can generate a secure secret using:
```bash
openssl rand -base64 32
```

## Database Setup

The application uses MongoDB and automatically creates collections as needed. No manual schema setup is required.

### Initial Setup

1. Ensure MongoDB is running locally or you have a MongoDB Atlas connection string
2. Update `MONGODB_URI` in your `.env.local` file
3. Start the application - collections will be created automatically on first use

### Database Reset

The project includes a database reset script for development purposes. This will drop all collections and allow you to start with a fresh database.

**Warning: This will delete all data in your database.**

To reset the database:

```bash
npm run reset-db
```

Or run directly:
```bash
node scripts/reset-database.js
```

The script will:
- Connect to your MongoDB database using `MONGODB_URI`
- List all existing collections
- Drop all collections
- Confirm the reset is complete

After resetting, you'll need to:
1. Create a new user account
2. Verify your email
3. Upload your student ID for verification
4. Start creating listings

## Running the Application

### Development Mode

```bash
npm run dev
```

Starts the development server with hot-reloading at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

## Project Structure

```
blockchain_hackathon/
├── app/                    # Next.js app directory
│   ├── auth/              # Authentication pages
│   ├── browse/             # Product browsing
│   ├── chat/               # Messaging system
│   ├── components/         # React components
│   │   ├── ui/            # UI component library
│   │   └── ...            # Feature components
│   ├── dashboard/          # User dashboard
│   ├── onboarding/        # Student ID verification
│   ├── payments/           # Payment history
│   ├── products/           # Product pages
│   ├── seller/             # Seller-specific pages
│   └── ...
├── pages/
│   └── api/               # API routes
│       ├── auth/          # Authentication endpoints
│       ├── messages/      # Chat endpoints
│       ├── payments/      # Payment endpoints
│       ├── products/      # Product endpoints
│       └── ...
├── lib/                   # Utility libraries
│   ├── blockchain/       # Blockchain integration
│   ├── mongodb.ts        # Database connection
│   └── ...
├── scripts/              # Utility scripts
│   └── reset-database.js # Database reset script
├── components/           # Shared components
└── public/              # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/verifyEmail` - Verify email address
- `POST /api/auth/sendVerification` - Resend verification email

### Products
- `GET /api/products` - List products with filters
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Messages
- `GET /api/messages` - Get user conversations
- `POST /api/messages` - Create new conversation
- `GET /api/messages/[conversationId]` - Get conversation messages
- `POST /api/messages/[conversationId]` - Send message

### Payments
- `GET /api/payments` - Get payment history
- `POST /api/payments/confirm` - Confirm payment
- `POST /api/payments/verify` - Verify transaction

### Users
- `GET /api/users/current` - Get current user
- `GET /api/users/[id]` - Get user profile
- `GET /api/users/stats` - Get user statistics

## Blockchain Integration

### Solana Integration

The application supports Solana payments through the Phantom wallet adapter. Transactions are processed on the Solana network (configurable between devnet, testnet, and mainnet).

### Ethereum/Arbitrum Integration

Ethereum and Arbitrum payments are handled through Wagmi and Viem. The application supports:
- MetaMask wallet connection
- Transaction signing and confirmation
- Local Arbitrum node support for development

### Local Blockchain Setup

For local development, you can run a local Arbitrum node:

```bash
./START_LOCAL_NODES.sh
```

This script starts a local Hardhat node for testing blockchain transactions.

## Image Handling

The application includes automatic image compression for uploads:
- Images are compressed client-side before upload
- Maximum dimensions: 1920x1920 pixels
- JPEG quality: 80% (reduced to 30% if still over 500KB)
- Maximum file size: 10MB before compression

## Email Verification

Users must verify their .edu email address before accessing the platform. Verification emails are sent using either:
- Resend API (recommended)
- SMTP via Nodemailer

## Student ID Verification

The platform uses OCR and AI to verify student IDs:
1. User uploads a photo of their student ID
2. Tesseract.js extracts text from the image
3. Google Generative AI verifies the information
4. User is marked as verified upon successful validation

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

Ensure all environment variables are set in your deployment platform.

## Development Guidelines

### Code Style
- TypeScript for type safety
- ESLint for code linting
- Functional components with hooks
- Server components where appropriate

### Database
- Use MongoDB collections as needed
- Collections are created automatically
- Use indexes for frequently queried fields

### API Routes
- All API routes are in `pages/api/`
- Use NextAuth session for authentication
- Validate input data
- Return appropriate HTTP status codes

## Troubleshooting

### Database Connection Issues
- Verify `MONGODB_URI` is correct
- Check MongoDB is running (if local)
- Verify network access (if using Atlas)

### Authentication Issues
- Ensure `NEXTAUTH_SECRET` is set
- Check `NEXTAUTH_URL` matches your domain
- Verify email service is configured

### Image Upload Issues
- Check Cloudinary credentials
- Verify file size limits
- Check network connectivity

### Blockchain Issues
- Verify wallet is connected
- Check network configuration (devnet/testnet/mainnet)
- Ensure sufficient balance for transactions

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary. All rights reserved.

## Support

For issues and questions, please open an issue in the repository or contact the development team.

## Acknowledgments

Built with Next.js, React, MongoDB, and various open-source libraries. Special thanks to the Radix UI team for the excellent component library.

