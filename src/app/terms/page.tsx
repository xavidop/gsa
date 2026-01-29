import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold font-headline text-xl">
            <Icons.logo className="w-8 h-8" />
            GSA
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container max-w-4xl py-8 sm:py-12 px-4">
        <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-6 sm:mb-8">Terms of Service</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Last updated: January 29, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing and using Global Slab Authority (&quot;GSA&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these terms, please do not use our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground mb-4">
              GSA provides an AI-powered trading card grading service that analyzes and assigns grades to trading cards based on their condition. Our services include:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>AI-based card condition analysis and grading</li>
              <li>Digital slab generation and display</li>
              <li>Certificate generation with QR code verification</li>
              <li>Collection management and organization tools</li>
              <li>Analytics and portfolio reporting</li>
              <li>Public profile sharing capabilities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-4">
              To use GSA services, you must create an account. You agree to:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your password and account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. Grading Disclaimer</h2>
            <p className="text-muted-foreground mb-4">
              GSA grades are generated using artificial intelligence and machine learning algorithms. While we strive for accuracy:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Grades are estimates and may not reflect physical inspection results</li>
              <li>GSA grades are not affiliated with or recognized by PSA, BGS, CGC, or other traditional grading companies</li>
              <li>Grades should be used for personal reference and collection management</li>
              <li>We do not guarantee that GSA grades will match professional grading service results</li>
              <li>GSA is not liable for any financial decisions made based on our grades</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              The GSA platform, including all content, features, and functionality, is owned by Global Slab Authority and is protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              You retain ownership of the card images you upload. By uploading images, you grant GSA a worldwide, non-exclusive, royalty-free license to use, process, and display these images as necessary to provide our services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. User Content and Conduct</h2>
            <p className="text-muted-foreground mb-4">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Upload counterfeit, illegal, or infringing content</li>
              <li>Use the service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Abuse, harass, or harm other users</li>
              <li>Scrape, crawl, or automate access to the service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Public Profiles and Sharing</h2>
            <p className="text-muted-foreground">
              When you make your profile or cards public, you understand that this information will be accessible to anyone on the internet. You can control the visibility of your profile and individual cards through your account settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              GSA and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service. This includes but is not limited to damages for loss of profits, data, or other intangible losses.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Service Modifications</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify, suspend, or discontinue the service at any time without notice. We may also modify these terms at any time, and continued use of the service constitutes acceptance of the modified terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Termination</h2>
            <p className="text-muted-foreground">
              We may terminate or suspend your account and access to the service immediately, without prior notice, for any reason, including breach of these Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which GSA operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Contact Information</h2>
            <p className="text-muted-foreground">
              If you have any questions about these Terms, please contact us at legal@globalslabauthority.com
            </p>
          </section>
        </div>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Global Slab Authority. All rights reserved.</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link href="/terms" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="/privacy" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
