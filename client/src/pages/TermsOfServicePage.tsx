import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function TermsOfServicePage() {
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
          <h1 className="text-xl font-semibold">Terms of Service</h1>
        </div>
      </header>

      <ScrollArea className="h-[calc(100vh-8rem)]">
        <div className="max-w-3xl mx-auto p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Terms of Service</CardTitle>
              <CardDescription>Last Updated: November 23, 2025</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 text-sm">
              <section>
                <h2 className="font-semibold text-base mb-2">Agreement to Terms</h2>
                <p className="text-muted-foreground">
                  By accessing or using the PMY ("Press Means Yes") mobile application, you agree to be
                  bound by these Terms of Service. If you do not agree to these terms, please do not use
                  the application.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Description of Service</h2>
                <p className="text-muted-foreground mb-2">
                  PMY is a consent documentation platform that provides:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Digital signature capture for consent agreements</li>
                  <li>Audio recording capabilities (with explicit consent)</li>
                  <li>Photo documentation (with explicit consent)</li>
                  <li>Biometric authentication for identity verification</li>
                  <li>Educational resources on Title IX regulations and state consent laws</li>
                  <li>Secure storage and management of consent contracts</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Important Disclaimers</h2>
                <div className="space-y-3 text-muted-foreground">
                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="font-medium text-destructive mb-2">Legal Notice</p>
                    <p>
                      PMY is a documentation tool and does NOT constitute legal advice. Consent documentation
                      created through this app does not guarantee legal protection or compliance with all
                      applicable laws. Users should consult with legal professionals for advice specific to
                      their situation.
                    </p>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="font-medium text-destructive mb-2">No Substitute for Communication</p>
                    <p>
                      PMY does not replace ongoing, enthusiastic, and affirmative consent throughout any
                      encounter. Consent must be freely given, can be withdrawn at any time, and requires
                      continuous communication between all parties.
                    </p>
                  </div>

                  <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                    <p className="font-medium text-destructive mb-2">Recording Laws</p>
                    <p>
                      Users are responsible for complying with all applicable recording laws, including
                      two-party consent laws for audio recording. PMY provides educational information
                      but users must ensure compliance with their local jurisdiction.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">User Responsibilities</h2>
                <p className="text-muted-foreground mb-2">By using PMY, you agree to:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Provide accurate and truthful information</li>
                  <li>Obtain explicit consent from all parties before recording audio or taking photos</li>
                  <li>Comply with all applicable local, state, and federal laws</li>
                  <li>Use the service only for lawful purposes</li>
                  <li>Not misrepresent consent or create fraudulent documentation</li>
                  <li>Maintain the confidentiality of your account credentials</li>
                  <li>Respect the privacy and rights of all parties involved</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Age Requirements</h2>
                <p className="text-muted-foreground">
                  You must be at least 18 years old to use PMY. By using this application, you represent
                  and warrant that you are at least 18 years of age. We reserve the right to terminate
                  accounts of users who are found to be under 18.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Account Security</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>You are responsible for:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Maintaining the security of your account</li>
                    <li>All activities that occur under your account</li>
                    <li>Notifying us immediately of any unauthorized access</li>
                    <li>Keeping your contact information current</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Paid Features</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>PMY offers paid features including:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Account verification ($5 one-time fee via Stripe Identity)</li>
                    <li>Advanced AI verification of Title IX policies</li>
                  </ul>
                  <p className="mt-2">
                    All payments are processed securely through Stripe. Fees are non-refundable except
                    as required by law. We reserve the right to modify pricing with notice to users.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Data Ownership and Usage</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>
                    You retain ownership of all content you create in PMY, including consent contracts,
                    signatures, recordings, and photos. By using our service, you grant PMY a limited
                    license to store, process, and display this content solely for providing the service.
                  </p>
                  <p className="mt-2">
                    We will never share, sell, or distribute your consent documentation to third parties
                    without your explicit permission, except as required by law.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Prohibited Activities</h2>
                <p className="text-muted-foreground mb-2">You may not:</p>
                <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                  <li>Create false or fraudulent consent documentation</li>
                  <li>Harass, threaten, or harm other users</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Attempt to access other users' accounts or data</li>
                  <li>Reverse engineer or compromise the app's security</li>
                  <li>Use the service to coerce or manipulate others</li>
                  <li>Share your account with others</li>
                </ul>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Intellectual Property</h2>
                <p className="text-muted-foreground">
                  PMY and its original content, features, and functionality are owned by PMY and are
                  protected by international copyright, trademark, and other intellectual property laws.
                  You may not copy, modify, distribute, or create derivative works without our express
                  written permission.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Limitation of Liability</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p className="font-medium text-foreground">
                    PMY IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND.
                  </p>
                  <p>
                    To the maximum extent permitted by law, PMY and its affiliates shall not be liable
                    for any indirect, incidental, special, consequential, or punitive damages, including
                    but not limited to loss of profits, data, or use, arising from:
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your use or inability to use the service</li>
                    <li>Legal disputes or claims related to consent documentation</li>
                    <li>Reliance on information provided by the app</li>
                    <li>Unauthorized access to your data</li>
                    <li>Service interruptions or errors</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Indemnification</h2>
                <p className="text-muted-foreground">
                  You agree to indemnify and hold harmless PMY and its affiliates from any claims,
                  damages, losses, liabilities, and expenses arising from your use of the service,
                  violation of these terms, or violation of any rights of another party.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Termination</h2>
                <div className="space-y-2 text-muted-foreground">
                  <p>We may terminate or suspend your account immediately, without notice, for:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Violation of these Terms of Service</li>
                    <li>Fraudulent or illegal activity</li>
                    <li>At our sole discretion for any reason</li>
                  </ul>
                  <p className="mt-2">
                    You may terminate your account at any time through the app settings. Upon termination,
                    your data will be deleted in accordance with our Privacy Policy.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Governing Law</h2>
                <p className="text-muted-foreground">
                  These Terms shall be governed by and construed in accordance with the laws of the
                  United States and the State of [STATE], without regard to conflict of law provisions.
                  Any disputes shall be resolved through binding arbitration in accordance with the
                  American Arbitration Association rules.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Changes to Terms</h2>
                <p className="text-muted-foreground">
                  We reserve the right to modify these Terms at any time. We will notify users of
                  material changes via the app or email. Your continued use of PMY after changes
                  constitutes acceptance of the new terms.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Severability</h2>
                <p className="text-muted-foreground">
                  If any provision of these Terms is found to be unenforceable or invalid, that
                  provision shall be limited or eliminated to the minimum extent necessary, and the
                  remaining provisions shall remain in full force and effect.
                </p>
              </section>

              <section>
                <h2 className="font-semibold text-base mb-2">Contact Information</h2>
                <p className="text-muted-foreground">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <div className="mt-2 text-muted-foreground">
                  <p>Email: legal@pressmeansyes.com</p>
                  <p>Website: pressmeansyes.com</p>
                </div>
              </section>

              <section className="bg-muted/50 rounded-md p-4">
                <p className="text-sm text-muted-foreground">
                  By using PMY, you acknowledge that you have read, understood, and agree to be bound
                  by these Terms of Service and our Privacy Policy.
                </p>
              </section>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
