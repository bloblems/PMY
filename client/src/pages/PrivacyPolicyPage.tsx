import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function PrivacyPolicyPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/profile")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Privacy Policy</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Policy</CardTitle>
              <CardDescription>Last Updated: November 23, 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <section>
                <h2 className="font-semibold text-base mb-2">Introduction</h2>
                <p className="text-muted-foreground">
                  PMY ("Press Means Yes") is committed to protecting your privacy. This Privacy Policy
                  explains how we collect, use, disclose, and safeguard your information when you use
                  our mobile application for documenting consent in compliance with Title IX regulations.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Information We Collect</h2>
                <div className="space-y-3 text-muted-foreground">
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Personal Information</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Name and email address (for account creation)</li>
                      <li>Party names entered in consent contracts</li>
                      <li>University affiliation (optional)</li>
                      <li>State location (optional)</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-foreground mb-1">Consent Documentation</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Digital signatures</li>
                      <li>Audio recordings (with explicit consent)</li>
                      <li>Photos and selfies (with explicit consent)</li>
                      <li>Biometric authentication data (stored locally on device)</li>
                      <li>Contract details (encounter type, duration, parties involved)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground mb-1">Payment Information</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Payment details processed securely through Stripe (we do not store credit card numbers)</li>
                      <li>Identity verification documents (processed through Stripe Identity)</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-foreground mb-1">Usage Information</h3>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Device information (type, operating system version)</li>
                      <li>App usage patterns and preferences</li>
                      <li>Error logs and diagnostic data</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">How We Use Your Information</h2>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>To provide and maintain consent documentation services</li>
                  <li>To authenticate users and verify identities</li>
                  <li>To process payments for premium features</li>
                  <li>To provide Title IX and state law educational resources</li>
                  <li>To improve app functionality and user experience</li>
                  <li>To comply with legal obligations</li>
                  <li>To prevent fraud and ensure security</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Data Storage and Security</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    We implement industry-standard security measures to protect your data:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>End-to-end encryption for sensitive data transmission</li>
                    <li>Secure database storage with encryption at rest</li>
                    <li>Biometric data stored locally on your device using iOS Keychain/Android Keystore</li>
                    <li>Regular security audits and updates</li>
                    <li>Limited employee access to personal data</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Data Retention</h2>
                <p className="text-muted-foreground">
                  We retain your consent contracts and recordings for as long as your account is active.
                  You may delete individual contracts or recordings at any time through the app. Upon account
                  deletion, all personal data, contracts, and recordings are permanently removed from our
                  servers within 30 days, unless required by law to retain certain information.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Third-Party Services</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>We use the following third-party services:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Stripe:</strong> Payment processing and identity verification</li>
                    <li><strong>Supabase:</strong> Authentication services</li>
                    <li><strong>OpenAI:</strong> Title IX policy verification (optional)</li>
                    <li><strong>Resend:</strong> Email delivery for sharing and notifications</li>
                  </ul>
                  <p>
                    Each service has its own privacy policy governing how they handle your data.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Your Rights</h2>
                <p className="text-muted-foreground mb-2">You have the right to:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Access your personal data</li>
                  <li>Correct inaccurate data</li>
                  <li>Delete your data and account</li>
                  <li>Export your consent contracts and recordings</li>
                  <li>Opt out of non-essential data collection</li>
                  <li>Withdraw consent for data processing</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Children's Privacy</h2>
                <p className="text-muted-foreground">
                  PMY is not intended for users under 18 years of age. We do not knowingly collect
                  personal information from minors. If we discover that a minor has provided personal
                  information, we will delete it immediately.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Changes to This Policy</h2>
                <p className="text-muted-foreground">
                  We may update this Privacy Policy from time to time. We will notify you of any changes
                  by posting the new policy in the app and updating the "Last Updated" date. Your continued
                  use of PMY after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Contact Us</h2>
                <p className="text-muted-foreground">
                  If you have questions about this Privacy Policy or our data practices, please contact us at:
                </p>
                <div className="mt-2 text-muted-foreground">
                  <p>Email: privacy@pressmeansyes.com</p>
                  <p>Website: pressmeansyes.com</p>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Legal Compliance</h2>
                <p className="text-muted-foreground">
                  PMY complies with applicable data protection laws, including GDPR, CCPA, and other
                  regional privacy regulations. We are committed to maintaining the highest standards
                  of data protection and user privacy.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
