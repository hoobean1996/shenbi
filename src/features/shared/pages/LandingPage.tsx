/**
 * Landing Page - Marketing page for selling Shenbi
 */

import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import {
  Sparkles,
  ChevronRight,
  Gamepad2,
  Star,
  Zap,
  Heart,
  Check,
  Play,
  Brain,
  Rocket,
  Shield,
  Clock,
  Monitor,
  Crown,
  Paintbrush,
  Users,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <>
      <SEO
        title="Fun Coding for Kids"
        description="Turn your kids into little programmers with Shenbi. Game-based learning makes coding as fun as playing. 50+ interactive puzzles for ages 5-14."
        url="/landing"
      />
      <div className="h-screen overflow-y-auto bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4a7a2a] rounded-xl flex items-center justify-center">
              <Paintbrush className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">Shenbi</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#features" className="text-gray-600 hover:text-[#4a7a2a] transition-colors hidden sm:block">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-[#4a7a2a] transition-colors hidden sm:block">
              Pricing
            </a>
            <Link
              to="/"
              className="px-5 py-2 bg-[#4a7a2a] text-white rounded-xl font-medium hover:bg-[#3a6a1a] transition-colors"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 bg-gradient-to-br from-[#e8f5e0] via-white to-[#f0f9eb]">
        <div className="max-w-6xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full text-[#4a7a2a] text-sm mb-6 shadow-sm border border-[#e8f5e0]">
            <Sparkles className="w-4 h-4" />
            The fun way to learn programming
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Turn Your Kids Into
            <br />
            <span className="text-[#4a7a2a]">Little Programmers</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-10">
            Shenbi makes coding as fun as playing games. Kids solve puzzles, collect stars,
            and learn real programming concepts through interactive adventures.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/"
              className="flex items-center gap-2 px-8 py-4 bg-[#4a7a2a] text-white rounded-2xl font-bold text-lg hover:bg-[#3a6a1a] transition-all shadow-xl hover:shadow-2xl hover:scale-105"
            >
              <Play className="w-5 h-5" />
              Start Learning Free
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#4a7a2a]">50+</div>
              <div className="text-gray-600">Interactive Levels</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#4a7a2a]">Ages 5-14</div>
              <div className="text-gray-600">Designed For Kids</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#4a7a2a]">1000+</div>
              <div className="text-gray-600">Happy Learners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Kids Love Shenbi
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Game mechanics + real programming = an engaging learning experience.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#7dad4c] transition-all">
              <div className="w-12 h-12 bg-[#e8f5e0] rounded-2xl flex items-center justify-center mb-4">
                <Gamepad2 className="w-6 h-6 text-[#4a7a2a]" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Game-Based Learning</h3>
              <p className="text-gray-600 text-sm">
                Solve puzzles by writing code. Learning feels like playing.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#7dad4c] transition-all">
              <div className="w-12 h-12 bg-[#e8f5e0] rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-[#4a7a2a]" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Real Programming</h3>
              <p className="text-gray-600 text-sm">
                Loops, conditionals, functions - concepts used by real programmers.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#7dad4c] transition-all">
              <div className="w-12 h-12 bg-[#e8f5e0] rounded-2xl flex items-center justify-center mb-4">
                <Star className="w-6 h-6 text-[#4a7a2a]" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Earn Stars & Badges</h3>
              <p className="text-gray-600 text-sm">
                Collect up to 3 stars per level and unlock achievement badges.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#7dad4c] transition-all">
              <div className="w-12 h-12 bg-[#e8f5e0] rounded-2xl flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-[#4a7a2a]" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Instant Feedback</h3>
              <p className="text-gray-600 text-sm">
                Watch code come alive with smooth animations.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#7dad4c] transition-all">
              <div className="w-12 h-12 bg-[#e8f5e0] rounded-2xl flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-[#4a7a2a]" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Battle Mode</h3>
              <p className="text-gray-600 text-sm">
                Challenge friends to real-time coding battles.
              </p>
            </div>

            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#7dad4c] transition-all">
              <div className="w-12 h-12 bg-[#e8f5e0] rounded-2xl flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-[#4a7a2a]" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Kid-Friendly</h3>
              <p className="text-gray-600 text-sm">
                Large buttons, simple language, friendly characters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Simple Pricing
            </h2>
            <p className="text-gray-600">
              Start free, upgrade when ready. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Free Tier */}
            <div className="bg-white rounded-3xl p-8 border-2 border-gray-200">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-800">$0</div>
                <p className="text-gray-500 text-sm">Forever free</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#4a7a2a] flex-shrink-0" />
                  <span className="text-gray-700">10+ free levels</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#4a7a2a] flex-shrink-0" />
                  <span className="text-gray-700">Maze & turtle adventures</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#4a7a2a] flex-shrink-0" />
                  <span className="text-gray-700">Battle mode with friends</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 text-[#4a7a2a] flex-shrink-0" />
                  <span className="text-gray-700">Progress tracking</span>
                </li>
              </ul>

              <Link
                to="/"
                className="block w-full py-3 text-center bg-white border-2 border-[#4a7a2a] text-[#4a7a2a] rounded-xl font-bold hover:bg-[#f0f9eb] transition-colors"
              >
                Get Started Free
              </Link>
            </div>

            {/* Premium Tier */}
            <div className="bg-gradient-to-br from-[#4a7a2a] to-[#3a6a1a] rounded-3xl p-8 text-white relative">
              <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                <Crown className="w-3 h-3" />
                POPULAR
              </div>

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Premium</h3>
                <div className="text-4xl font-bold">$9.99<span className="text-lg font-normal">/mo</span></div>
                <p className="text-white/70 text-sm">Billed monthly</p>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Everything in Free</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>All 50+ premium levels</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>Advanced coding concepts</span>
                </li>
                <li className="flex items-center gap-3 text-sm">
                  <Check className="w-5 h-5 flex-shrink-0" />
                  <span>New content monthly</span>
                </li>
              </ul>

              <Link
                to="/"
                className="block w-full py-3 text-center bg-white text-[#4a7a2a] rounded-xl font-bold hover:bg-gray-100 transition-colors"
              >
                Start Premium
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Parents Love Us
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">
                "My 8-year-old can't stop playing! She's learning loops without even realizing it."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f5e0] rounded-full flex items-center justify-center text-lg">
                  👩
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">Sarah M.</div>
                  <div className="text-gray-500 text-xs">Parent</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">
                "The battle mode is genius! My son practices coding with his friends online."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f5e0] rounded-full flex items-center justify-center text-lg">
                  👨
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">Michael R.</div>
                  <div className="text-gray-500 text-xs">Parent</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 text-sm mb-4">
                "Best educational app we've found. Worth every penny of premium."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e8f5e0] rounded-full flex items-center justify-center text-lg">
                  👩
                </div>
                <div>
                  <div className="font-bold text-gray-800 text-sm">Lisa K.</div>
                  <div className="text-gray-500 text-xs">Parent</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-12 px-4 border-y border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-6 h-6 text-[#4a7a2a]" />
              <span className="text-gray-600 text-sm">Kid-Safe</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 text-[#4a7a2a]" />
              <span className="text-gray-600 text-sm">No Ads</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Monitor className="w-6 h-6 text-[#4a7a2a]" />
              <span className="text-gray-600 text-sm">All Devices</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Heart className="w-6 h-6 text-[#4a7a2a]" />
              <span className="text-gray-600 text-sm">Made with Love</span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#4a7a2a] to-[#3a6a1a] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your Child's Coding Journey
          </h2>
          <p className="text-white/80 mb-8">
            Join thousands of kids learning to code through play.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[#4a7a2a] rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-xl hover:scale-105"
          >
            <Rocket className="w-5 h-5" />
            Start Learning Free
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4a7a2a] rounded-lg flex items-center justify-center">
              <Paintbrush className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Shenbi</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 Shenbi. Made with ❤️ for young coders.
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
