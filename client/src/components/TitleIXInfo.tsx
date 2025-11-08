import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { AlertCircle, BookOpen, Shield } from "lucide-react";

interface TitleIXInfoProps {
  universityName: string;
  lastUpdated?: string;
}

export default function TitleIXInfo({ universityName, lastUpdated }: TitleIXInfoProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Title IX at {universityName}</h3>
            {lastUpdated && (
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            )}
          </div>
        </div>
      </Card>

      <Accordion type="single" collapsible className="space-y-4">
        <AccordionItem value="consent" className="border rounded-lg px-4 bg-card" data-testid="accordion-consent">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <BookOpen className="h-4 w-4 text-primary" />
              <span className="font-semibold">Understanding Consent</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            <p className="mb-3">
              Consent must be clear, knowing, and voluntary. It is active, not passive, and can be
              withdrawn at any time. Silence or lack of resistance does not constitute consent.
            </p>
            <p className="mb-3">
              Both parties must be capable of giving consent. Incapacitation due to alcohol, drugs,
              or other factors negates the ability to consent.
            </p>
            <p>
              Documentation of consent, while helpful, does not replace the ongoing requirement for
              clear communication throughout any encounter.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="requirements" className="border rounded-lg px-4 bg-card" data-testid="accordion-requirements">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-primary" />
              <span className="font-semibold">Key Requirements</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            <ul className="space-y-2 list-disc list-inside">
              <li>Consent must be affirmative and ongoing</li>
              <li>Both parties must be of legal age and mentally capable</li>
              <li>Consent cannot be given under coercion or threat</li>
              <li>Prior relationship does not imply consent for future encounters</li>
              <li>Consent to one activity does not imply consent to others</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="resources" className="border rounded-lg px-4 bg-card" data-testid="accordion-resources">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-primary" />
              <span className="font-semibold">Campus Resources</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 pb-4 text-sm text-muted-foreground leading-relaxed">
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground mb-1">Title IX Coordinator</p>
                <p>Contact your university's Title IX office for guidance and support.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Health Services</p>
                <p>Confidential counseling and medical support available 24/7.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Campus Security</p>
                <p>Report incidents and access immediate assistance.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
