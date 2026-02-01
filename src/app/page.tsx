import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  CheckCircle, 
  Download, 
  FolderOpen, 
  FileBarChart, 
  Users, 
  Rss,
  Trophy,
  TrendingUp,
  ArrowLeftRight,
  Target,
  Sparkles,
  Shield,
  Zap,
  Star,
  Bell,
  BarChart3,
  Crown,
  Gem
} from 'lucide-react';
import { DigitalSlab } from '@/components/digital-slab';
import { Icons } from '@/components/icons';
import placeHolderImage from '@/lib/placeholder-images.json';

export default function Home() {
  const sampleCard = {
    id: 'sample',
    userId: 'sample',
    frontImageUrl: placeHolderImage.placeholderImages[0].imageUrl,
    backImageUrl: 'https://picsum.photos/seed/2/400/600',
    cardName: 'Mew EX',
    set: 'Paldean Fates',
    grade: 10,
    subgrades: {
      centering: 10,
      corners: 10,
      edges: 9.5,
      surface: 10,
    },
    confidence: 0.98,
    createdAt: new Date(),
    publicShareId: 'sample',
  };



  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">GSA</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>

          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link href="/signup">
                Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-16 md:py-24 lg:py-32 overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/20" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/30 rounded-full blur-3xl" />
          
          <div className="container relative px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="flex flex-col justify-center space-y-8">
                <div className="space-y-6">
                  <Badge variant="secondary" className="w-fit px-4 py-1.5 text-sm font-medium">
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI-Powered Card Grading Platform
                  </Badge>
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    Grade, Collect, Trade & 
                    <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"> Dominate</span>
                  </h1>
                  <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
                    The ultimate platform for trading card collectors. AI grading in seconds, portfolio tracking, social trading, and gamified achievements.
                  </p>
                </div>
                
                <div className="flex flex-col gap-4 sm:flex-row">
                  <Button asChild size="lg" className="text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                    <Link href="/signup">
                      Start Grading Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="text-base">
                    <Link href="#how-it-works">
                      See How It Works
                    </Link>
                  </Button>
                </div>

                {/* Trust indicators */}
                <div className="flex flex-wrap items-center gap-6 pt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-5 h-5 text-green-500" />
                    <span>Bank-level security</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    <span>Instant results</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="w-5 h-5 text-primary" />
                    <span>Free to start</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-end relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 blur-3xl rounded-full scale-75" />
                <div className="relative transform hover:scale-105 transition-transform duration-500">
                  <DigitalSlab card={sampleCard} />
                </div>
              </div>
            </div>
          </div>
        </section>



        {/* Core Features Section */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <Badge variant="outline" className="px-4 py-1.5">
                Core Features
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                Everything You Need to 
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Succeed</span>
              </h2>
              <p className="max-w-[800px] text-muted-foreground md:text-lg">
                From instant AI grading to social trading, GSA gives you all the tools to build, manage, and grow your collection.
              </p>
            </div>

            {/* Feature Cards - 2x3 Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* AI Grading */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground">
                      <Icons.brainCircuit className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">AI Grading</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Get professional-quality grades in under 5 seconds. Our AI analyzes centering, corners, edges, and surface with 99%+ accuracy.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Instant subgrades breakdown</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Confidence scoring</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>PSA/BGS scale compatible</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Digital Slabs */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white">
                      <Icons.slab className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">Digital Slabs</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Beautiful, animated digital slabs that showcase your cards. Share on social media or embed anywhere.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Holographic effects</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>QR code verification</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>PDF certificates</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Portfolio Analytics */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">Portfolio Analytics</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Track your collection's value in real-time. Monitor ROI, trends, and get alerts when prices change.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Real-time market values</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Investment ROI tracking</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Price alerts</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Trading System */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white">
                      <ArrowLeftRight className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">Trading System</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Trade cards with collectors worldwide. Our fairness calculator ensures balanced deals every time.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Fair trade calculator</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Counter offers</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Trade history</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Leaderboards */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center text-white">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">Leaderboards</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Compete for glory! Climb the ranks across collection value, card count, grades, and trading volume.
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Multiple categories</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Weekly/monthly/all-time</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Top 50 rankings</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card className="group relative overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white">
                      <Target className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold font-headline">Achievements</h3>
                  </div>
                  <p className="text-muted-foreground mb-4">
                    Unlock achievements as you collect. From your first grade to becoming a legendary whale!
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>50+ achievements</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Rarity tiers (Common → Legendary)</span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Progress tracking</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* More Features Banner */}
        <section className="w-full py-12 bg-gradient-to-r from-primary/10 via-primary/5 to-secondary/10">
          <div className="container px-4 md:px-6">
            <div className="flex flex-wrap justify-center gap-8 md:gap-12">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-primary" />
                <span className="font-medium">Smart Collections</span>
              </div>
              <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-primary" />
                <span className="font-medium">Social Network</span>
              </div>
              <div className="flex items-center gap-3">
                <Rss className="w-6 h-6 text-primary" />
                <span className="font-medium">Activity Feed</span>
              </div>
              <div className="flex items-center gap-3">
                <Bell className="w-6 h-6 text-primary" />
                <span className="font-medium">Notifications</span>
              </div>
              <div className="flex items-center gap-3">
                <Download className="w-6 h-6 text-primary" />
                <span className="font-medium">Export & Backup</span>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="w-full py-20 md:py-28 bg-secondary/30">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <Badge variant="outline" className="px-4 py-1.5">
                How It Works
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                Grade Your Card in 
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> 3 Simple Steps</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold mb-6">
                  1
                </div>
                <h3 className="text-xl font-bold mb-3">Upload Your Card</h3>
                <p className="text-muted-foreground">
                  Take clear photos of the front and back of your card. Our AI will handle the rest.
                </p>
                {/* Connector line */}
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              </div>

              <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold mb-6">
                  2
                </div>
                <h3 className="text-xl font-bold mb-3">AI Analysis</h3>
                <p className="text-muted-foreground">
                  Our AI examines centering, corners, edges, and surface to calculate your grade.
                </p>
                <div className="hidden md:block absolute top-8 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground text-2xl font-bold mb-6">
                  3
                </div>
                <h3 className="text-xl font-bold mb-3">Print Your Label</h3>
                <p className="text-muted-foreground">
                  Get your digital slab, print the label, and showcase your graded card!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Achievement Tiers */}
        <section className="w-full py-20 md:py-28">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
              <Badge variant="outline" className="px-4 py-1.5">
                Gamification
              </Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                Unlock Achievements, 
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Earn Glory</span>
              </h2>
              <p className="max-w-[600px] text-muted-foreground md:text-lg">
                From your first graded card to becoming a legendary collector, every milestone is celebrated.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <Card className="text-center p-6 border-2 border-gray-200 dark:border-gray-700">
                <div className="text-4xl mb-3">🎯</div>
                <h4 className="font-bold text-lg">Common</h4>
                <p className="text-sm text-muted-foreground">Basic milestones</p>
              </Card>
              <Card className="text-center p-6 border-2 border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="text-4xl mb-3">🏆</div>
                <h4 className="font-bold text-lg text-blue-600 dark:text-blue-400">Rare</h4>
                <p className="text-sm text-muted-foreground">Intermediate achievements</p>
              </Card>
              <Card className="text-center p-6 border-2 border-purple-300 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-950/20">
                <div className="text-4xl mb-3">👑</div>
                <h4 className="font-bold text-lg text-purple-600 dark:text-purple-400">Epic</h4>
                <p className="text-sm text-muted-foreground">Significant accomplishments</p>
              </Card>
              <Card className="text-center p-6 border-2 border-yellow-300 dark:border-yellow-600 bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30">
                <div className="text-4xl mb-3">💎</div>
                <h4 className="font-bold text-lg text-yellow-600 dark:text-yellow-400">Legendary</h4>
                <p className="text-sm text-muted-foreground">Elite status</p>
              </Card>
            </div>
          </div>
        </section>



        {/* Final CTA */}
        <section className="w-full py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-secondary/20" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-secondary/30 rounded-full blur-3xl" />
          
          <div className="container relative px-4 md:px-6">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-8">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl font-headline">
                Ready to Join the 
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent"> Next Generation</span>
                <br />of Card Collectors?
              </h2>
              <p className="text-lg text-muted-foreground max-w-[600px]">
                Start grading, building your collection, and competing with collectors worldwide. It's free to get started!
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="text-lg px-8 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                  <Link href="/signup">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                No credit card required • Free tier available forever
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t bg-background/95">
        <div className="container py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl mb-4">
                <Icons.logo className="w-8 h-8" />
                <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">GSA</span>
              </Link>
              <p className="text-sm text-muted-foreground">
                The future of trading card grading is here.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/signup" className="hover:text-foreground transition-colors">Get Started</Link></li>
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/grading-guide" className="hover:text-foreground transition-colors">Grading Guide</Link></li>
                <li><Link href="/discover" className="hover:text-foreground transition-colors">Discover</Link></li>
                <li><Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 mt-8 border-t">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Global Slab Authority. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <span className="text-sm text-muted-foreground">Made with ❤️ for collectors</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
