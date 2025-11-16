import Link from 'next/link';
import Button from './components/ui/Button';
import Card from './components/ui/Card';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 md:py-32">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-full">
            <span className="text-sm font-semibold text-indigo-300">✨ College Student Marketplace</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Buy & Sell with Your Campus
          </h1>

          <p className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed">
            A secure marketplace exclusively for college students. Sell textbooks, notes, items, and services. Buy from verified peers.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/signup">
              <Button className="px-8 py-3 text-lg">Get Started Free</Button>
            </Link>
            <Link href="/browse">
              <Button variant="ghost" className="px-8 py-3 text-lg">
                Browse Marketplace
              </Button>
            </Link>
          </div>

          {/* Hero Stats */}
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-400">1000+</div>
              <div className="text-xs text-slate-400">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400">5000+</div>
              <div className="text-xs text-slate-400">Items Listed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-400">$50k+</div>
              <div className="text-xs text-slate-400">Monthly Value</div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why College Marketplace?</h2>
        <p className="text-center text-slate-300 mb-12 max-w-2xl mx-auto">
          Built by students, for students. A safe, verified community where you can buy and sell with confidence.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <Card hoverable>
            <div className="text-4xl mb-3">🎓</div>
            <h3 className="font-bold text-lg mb-2">Student Verified</h3>
            <p className="text-sm text-slate-300">
              All users verify their student email and ID. Buy and sell with confidence knowing everyone is a verified student.
            </p>
          </Card>

          {/* Feature 2 */}
          <Card hoverable>
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-lg mb-2">No Commission Fees</h3>
            <p className="text-sm text-slate-300">
              Direct peer-to-peer marketplace. Keep 100% of your earnings. Lower prices for buyers.
            </p>
          </Card>

          {/* Feature 3 */}
          <Card hoverable>
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-bold text-lg mb-2">Secure Transactions</h3>
            <p className="text-sm text-slate-300">
              Built-in messaging, ratings, and dispute resolution. Trade safely within your college community.
            </p>
          </Card>

          {/* Feature 4 */}
          <Card hoverable>
            <div className="text-4xl mb-3">📚</div>
            <h3 className="font-bold text-lg mb-2">Textbooks & Notes</h3>
            <p className="text-sm text-slate-300">
              Save thousands on textbooks. Share study notes and course materials with classmates.
            </p>
          </Card>

          {/* Feature 5 */}
          <Card hoverable>
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold text-lg mb-2">Services & Skills</h3>
            <p className="text-sm text-slate-300">
              Offer tutoring, help with assignments, design work, or any service. Build your reputation.
            </p>
          </Card>

          {/* Feature 6 */}
          <Card hoverable>
            <div className="text-4xl mb-3">⭐</div>
            <h3 className="font-bold text-lg mb-2">Ratings & Reviews</h3>
            <p className="text-sm text-slate-300">
              Build your seller reputation. Trust scores help buyers find reliable sellers on campus.
            </p>
          </Card>
        </div>
      </div>

      {/* How It Works */}
      <div className="mx-auto max-w-7xl px-4 py-20 bg-white/5 rounded-lg my-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">How It Works</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Step 1 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-indigo-500/20 border-2 border-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">1</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Sign Up & Verify</h3>
            <p className="text-sm text-slate-300">
              Create an account with your college email and upload your student ID for verification.
            </p>
          </div>

          {/* Step 2 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-purple-500/20 border-2 border-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">2</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Browse or List</h3>
            <p className="text-sm text-slate-300">
              Browse items from other students or create your first listing in seconds.
            </p>
          </div>

          {/* Step 3 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-pink-500/20 border-2 border-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">3</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Connect & Chat</h3>
            <p className="text-sm text-slate-300">
              Message sellers or buyers directly. Negotiate, ask questions, and arrange meetups.
            </p>
          </div>

          {/* Step 4 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border-2 border-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold">4</span>
            </div>
            <h3 className="font-bold text-lg mb-2">Leave Feedback</h3>
            <p className="text-sm text-slate-300">
              Rate your experience. Help build a trustworthy community on campus.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Join?</h2>
        <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
          Join thousands of students already buying and selling on College Marketplace.
        </p>

        <Link href="/signup">
          <Button className="px-10 py-4 text-lg">Start Selling Today</Button>
        </Link>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20 py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-slate-400 text-sm">
          <p>&copy; 2025 College Marketplace. Built for students, by students.</p>
        </div>
      </footer>
    </div>
  );
}
