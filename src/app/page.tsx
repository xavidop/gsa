import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, CheckCircle } from 'lucide-react';
import { DigitalSlab } from '@/components/digital-slab';
import { Icons } from '@/components/icons';
import placeHolderImage from '@/lib/placeholder-images.json';

const features = [
  'Upload front and back images',
  'AI-powered analysis and grading',
  'Get overall grade and subgrades',
  'View card in a stunning digital slab',
  'Share your grade with a public link',
];

export default function Home() {
  const sampleCard = {
    id: 'sample',
    userId: 'sample',
    frontImageUrl: placeHolderImage.placeholderImages[0].imageUrl,
    backImageUrl: 'https://picsum.photos/seed/2/400/600',
    cardName: 'Amazing Charizard',
    set: 'Vivid Voltage',
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
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            GSA
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Sign Up <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline">
                    The Future of Card Grading is Here
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Use the power of AI to get instant, accurate grades for your trading cards. Welcome to the Global Slab Authority.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center -mr-16 md:-mr-32">
                 <DigitalSlab card={sampleCard} />
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-secondary text-secondary-foreground">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-primary text-primary-foreground px-3 py-1 text-sm font-headline">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">
                  Fast, Accurate, and Shareable
                </h2>
                <p className="max-w-[900px] text-secondary-foreground/80 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a seamless experience from upload to share, backed by cutting-edge AI technology.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 lg:gap-16 mt-12">
               <div className="relative group grid gap-1">
                 <div className="flex items-center gap-4">
                   <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                     <Icons.upload className="h-5 w-5" />
                   </div>
                   <h3 className="text-lg font-bold">Simple Upload</h3>
                 </div>
                 <p className="text-sm text-secondary-foreground/80">
                   Easily upload front and back images of your card. Our system handles the rest.
                 </p>
               </div>
               <div className="relative group grid gap-1">
                 <div className="flex items-center gap-4">
                   <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                     <Icons.brainCircuit className="h-5 w-5" />
                   </div>
                   <h3 className="text-lg font-bold">AI Grading</h3>
                 </div>
                 <p className="text-sm text-secondary-foreground/80">
                   Gemini Vision AI analyzes centering, corners, edges, and surface for a comprehensive grade.
                 </p>
               </div>
               <div className="relative group grid gap-1">
                 <div className="flex items-center gap-4">
                   <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center">
                     <Icons.slab className="h-5 w-5" />
                   </div>
                   <h3 className="text-lg font-bold">Digital Slab</h3>
                 </div>
                 <p className="text-sm text-secondary-foreground/80">
                   Receive a beautiful, animated digital slab to showcase your card's official GSA grade.
                 </p>
               </div>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                Ready to Grade Your First Card?
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join the community and experience the new standard in trading card grading.
              </p>
            </div>
            <div className="flex justify-center">
              <Button asChild size="lg">
                <Link href="/signup">
                  Create Your Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; 2024 Global Slab Authority. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4" prefetch={false}>
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
