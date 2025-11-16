import Link from 'next/link';
import Button from './components/ui/Button';
import Card from './components/ui/Card';
import { ShieldCheck, Zap, BookOpen, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium animate-float">
            <ShieldCheck size={14} />
            <span>Verified Student Marketplace</span>
          </div>

          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
            The <span className="text-gradient">Smartest</span> Way<br />
            to Buy & Sell on Campus.
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Exclusively for students. Verify your ID, trade textbooks, gear, and services securely without the sketchy meetups.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Link href="/signup">
              <Button className="h-12 px-8 text-lg rounded-full">Start Selling Free</Button>
            </Link>
            <Link href="/browse">
              <Button variant="outline" className="h-12 px-8 text-lg rounded-full border-zinc-700 hover:bg-zinc-800">
                Explore Listings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bento Grid Features */}
      <div className="max-w-7xl mx-auto px-4 py-20 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card */}
          <Card className="md:col-span-2 bg-gradient-to-br from-violet-900/20 to-zinc-900/50 border-violet-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <div className="relative z-10">
              <div className="h-12 w-12 bg-violet-500/20 rounded-xl flex items-center justify-center mb-4 text-violet-400">
                <ShieldCheck />
              </div>
              <h3 className="text-2xl font-bold mb-2">100% Verified Students</h3>
              <p className="text-zinc-400 max-w-md">We verify every single user via their student ID or .edu email. No bots, no scams, just your classmates.</p>
            </div>
            <div className="absolute right-[-50px] bottom-[-50px] opacity-20 group-hover:opacity-40 transition-opacity">
              <ShieldCheck size={200} />
            </div>
          </Card>

          {/* Small Card */}
          <Card className="flex flex-col justify-center bg-zinc-900/50">
            <div className="h-10 w-10 bg-pink-500/20 rounded-lg flex items-center justify-center mb-3 text-pink-400">
              <Zap />
            </div>
            <h3 className="text-xl font-bold mb-1">Zero Fees</h3>
            <p className="text-sm text-zinc-400">Keep 100% of what you earn. We don't take a cut.</p>
          </Card>
          
           {/* Small Card */}
           <Card className="flex flex-col justify-center bg-zinc-900/50">
            <div className="h-10 w-10 bg-blue-500/20 rounded-lg flex items-center justify-center mb-3 text-blue-400">
              <BookOpen />
            </div>
            <h3 className="text-xl font-bold mb-1">Textbooks & Notes</h3>
            <p className="text-sm text-zinc-400">Find course materials for cheap from seniors.</p>
          </Card>

          {/* Large Card */}
          <Card className="md:col-span-2 bg-gradient-to-tl from-indigo-900/20 to-zinc-900/50 border-indigo-500/20">
             <div className="flex items-center gap-4">
               <div className="h-12 w-12 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                  <Users />
               </div>
               <div>
                 <h3 className="text-2xl font-bold">Community Driven</h3>
                 <p className="text-zinc-400">Built by students, for students.</p>
               </div>
             </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/5 py-10 bg-zinc-950">
        <div className="text-center text-zinc-500 text-sm">
          © 2025 College Marketplace. 
        </div>
      </footer>
    </div>
  );
}