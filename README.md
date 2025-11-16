# UniMarket - Student Marketplace Platform

A comprehensive full-stack marketplace platform exclusively for verified students. Built with Next.js 16, TypeScript, MongoDB, and NextAuth.

## 🚀 Features

### Core Features
- **User Authentication**: Secure authentication with NextAuth.js and .edu email verification
- **Product Listings**: Create, edit, and manage product listings with multiple images
- **Advanced Search**: Powerful search with filters for category, price range, location, and more
- **Messaging System**: Real-time chat between buyers and sellers
- **Wishlist**: Save favorite products for later
- **Reviews & Ratings**: Product reviews and seller ratings
- **Payment Gateway**: Integrated Stripe payment processing (ready for production)
- **Notifications**: Real-time notifications for orders, messages, and more

### Advanced Features
- **Price Alerts**: Get notified when product prices drop
- **Saved Searches**: Save and rerun your favorite searches
- **Product Comparison**: Compare up to 4 products side-by-side
- **Analytics Dashboard**: Comprehensive analytics for sellers
- **Order Management**: Track orders and download invoices
- **Activity Feed**: See your recent activity across the platform
- **Profile Management**: Customizable profiles with avatar upload
- **Role Toggle**: Switch between buyer and seller roles
- **Product Recommendations**: AI-powered product suggestions

### UI/UX Features
- **Floating Navbar**: Beautiful glassmorphism navbar with smooth animations
- **Responsive Design**: Fully responsive across all devices
- **Dark Mode**: Beautiful dark theme throughout
- **Smooth Animations**: Framer Motion animations and transitions
- **Loading States**: Skeleton loaders and loading indicators
- **Toast Notifications**: User-friendly notifications
- **Image Gallery**: Advanced image viewing with thumbnails
- **Advanced Filters**: Comprehensive filtering options

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB
- **Authentication**: NextAuth.js
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Payment**: Stripe (ready for integration)
- **Date Formatting**: date-fns

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd blockchain_hackathon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```env
MONGODB_URI=mongodb://localhost:27017/unimarket
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔑 API Keys Required

### Stripe Payment Gateway
To enable payment processing:
1. Sign up at [Stripe](https://stripe.com)
2. Get your API keys from the dashboard
3. Add `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` to `.env.local`

The payment system is ready to use - just add your Stripe keys!

## 📁 Project Structure

```
blockchain_hackathon/
├── app/                    # Next.js app directory
│   ├── components/         # React components
│   ├── products/           # Product pages
│   ├── chat/               # Messaging system
│   ├── dashboard/          # User dashboard
│   └── ...
├── pages/                  # API routes
│   └── api/                # Backend API endpoints
├── components/             # Shared UI components
└── lib/                    # Utility functions
```

## 🎨 Key Components

- **Navbar**: Floating glassmorphism navbar with notifications
- **PaymentModal**: Stripe payment integration
- **ProductRecommendations**: AI-powered recommendations
- **PriceAlert**: Price drop notifications
- **AdvancedSearch**: Comprehensive search with filters
- **AnalyticsDashboard**: Seller analytics
- **ActivityFeed**: User activity timeline
- **ProductComparison**: Side-by-side product comparison

## 🔒 Security Features

- Email verification required (.edu emails only)
- Student ID verification for sellers
- Secure authentication with NextAuth.js
- Protected API routes
- Input validation and sanitization
- XSS protection

## 🚀 Deployment

1. Build the project:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

For production deployment:
- Set up MongoDB Atlas or your preferred MongoDB hosting
- Configure environment variables
- Set up Stripe account and add keys
- Deploy to Vercel, Netlify, or your preferred platform

## 📝 API Documentation

### Products
- `GET /api/products` - List products with filters
- `POST /api/products` - Create new product
- `GET /api/products/[id]` - Get product details
- `PUT /api/products/[id]` - Update product
- `DELETE /api/products/[id]` - Delete product

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment

### Messages
- `GET /api/messages` - Get conversations
- `POST /api/messages` - Send message
- `GET /api/messages/[id]` - Get conversation messages

### Notifications
- `GET /api/notifications` - Get notifications
- `PUT /api/notifications/[id]` - Mark as read
- `DELETE /api/notifications/[id]` - Delete notification

## 🎯 Future Enhancements

- [ ] Real-time notifications with WebSockets
- [ ] Advanced analytics with charts
- [ ] Social features (follow users, share products)
- [ ] Mobile app (React Native)
- [ ] AI-powered product descriptions
- [ ] Automated price tracking
- [ ] Escrow system for high-value items
- [ ] Shipping integration
- [ ] Multi-language support

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Built for the blockchain hackathon - a comprehensive student marketplace platform.

---

**Note**: This is a production-ready marketplace with comprehensive features. Add your Stripe API keys to enable payment processing!
