import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Icons } from '@/components/icons';

export default function PrivacyPage() {
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
        <h1 className="text-3xl sm:text-4xl font-bold font-headline mb-6 sm:mb-8">Privacy Policy</h1>
        <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">Last updated: February 1, 2026</p>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground">
              Global Slab Authority (&quot;GSA&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our trading card grading service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">2.1 Information You Provide</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Account Information:</strong> Email address, name, username, and password</li>
              <li><strong>Profile Information:</strong> Profile photo, bio, and public profile preferences</li>
              <li><strong>Card Images:</strong> Front and back images of trading cards you upload for grading</li>
              <li><strong>Collection Data:</strong> Card names, sets, grades, and collection organization</li>
              <li><strong>Portfolio Data:</strong> Purchase prices, investment information, and price alert settings</li>
              <li><strong>Trading Data:</strong> Trade proposals, offers, and transaction history</li>
              <li><strong>Social Data:</strong> Following relationships, likes, comments, and activity feed interactions</li>
              <li><strong>Notification Preferences:</strong> Your preferences for receiving alerts and notifications</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">2.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent on the platform</li>
              <li><strong>Device Information:</strong> Browser type, operating system, IP address</li>
              <li><strong>Cookies:</strong> Session cookies for authentication and preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-4">We use the collected information to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Provide and maintain our card grading service</li>
              <li>Process and analyze card images using AI algorithms</li>
              <li>Generate digital slabs, printable labels, and certificates</li>
              <li>Manage your account and collections</li>
              <li>Calculate portfolio values and provide analytics</li>
              <li>Send price alerts and notifications when thresholds are met</li>
              <li>Facilitate trading between users and calculate trade fairness</li>
              <li>Generate leaderboard rankings and award achievements</li>
              <li>Power social features including activity feeds and discover functionality</li>
              <li>Display public profiles when you choose to make them public</li>
              <li>Send service-related notifications and updates</li>
              <li>Improve our AI models and service quality</li>
              <li>Prevent fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">4. How We Share Your Information</h2>
            <p className="text-muted-foreground mb-4">We do not sell your personal information. We may share information in the following circumstances:</p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">4.1 Public Information</h3>
            <p className="text-muted-foreground">
              When you make your profile or cards public, that information becomes accessible to anyone on the internet. This includes your username, public cards, grades, collection values, leaderboard rankings, achievements, and any other information you choose to display publicly. Your activity (such as grading new cards) may appear in the activity feeds of users who follow you.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.2 Service Providers</h3>
            <p className="text-muted-foreground">
              We use third-party services to help operate our platform, including:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Firebase:</strong> Authentication, database, and file storage</li>
              <li><strong>Cloud Infrastructure:</strong> Hosting and computing services</li>
              <li><strong>AI Services:</strong> Machine learning and image analysis</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">4.3 Legal Requirements</h3>
            <p className="text-muted-foreground">
              We may disclose information if required by law, subpoena, or other legal process, or if we believe disclosure is necessary to protect our rights, your safety, or the safety of others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">5. Data Storage and Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement reasonable security measures to protect your information:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Encrypted data transmission using HTTPS/SSL</li>
              <li>Secure authentication via Firebase Auth</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular security updates and monitoring</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">6. Your Privacy Rights</h2>
            <p className="text-muted-foreground mb-4">You have the right to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct your information through account settings</li>
              <li><strong>Deletion:</strong> Delete your account and associated data</li>
              <li><strong>Privacy Controls:</strong> Control which cards, collections, and information are public vs. private</li>
              <li><strong>Leaderboard Opt-out:</strong> Choose whether to appear on public leaderboards</li>
              <li><strong>Trade Privacy:</strong> Control who can send you trade proposals</li>
              <li><strong>Notification Controls:</strong> Manage price alerts, trade notifications, and other alerts</li>
              <li><strong>Export:</strong> Download your collection data in CSV or PDF format</li>
              <li><strong>Opt-out:</strong> Opt out of non-essential communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">7. Children&apos;s Privacy</h2>
            <p className="text-muted-foreground">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">8. International Users</h2>
            <p className="text-muted-foreground">
              Your information may be transferred to and maintained on servers located outside of your jurisdiction. By using our service, you consent to this transfer. We will take steps to ensure your data receives adequate protection.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">9. Cookies and Tracking</h2>
            <p className="text-muted-foreground mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our service</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              You can control cookies through your browser settings, but this may limit some functionality of our service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">10. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information for as long as your account is active or as needed to provide services. When you delete your account, we will delete or anonymize your personal information within a reasonable timeframe, except where we are required to retain it for legal purposes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">11. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of significant changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">12. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-muted-foreground mt-4">
              Email: privacy@globalslabauthority.com
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
