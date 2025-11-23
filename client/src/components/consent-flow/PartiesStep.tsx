import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserPlus, UserCheck } from "lucide-react";
import type { UserContact } from "@/lib/consentFlowConstants";
import type { ValidationErrors } from "@/hooks/useConsentFlowValidation";

interface PartiesStepProps {
  stepNumber: number;
  parties: string[];
  partyErrors: ValidationErrors;
  contacts: UserContact[];
  onUpdateParty: (index: number, value: string) => void;
  onRemoveParty: (index: number) => void;
  onAddParty: () => void;
  onAddContactAsParty: (contact: UserContact) => void;
}

export function PartiesStep({
  stepNumber,
  parties,
  partyErrors,
  contacts,
  onUpdateParty,
  onRemoveParty,
  onAddParty,
  onAddContactAsParty,
}: PartiesStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold mb-1">Step {stepNumber}: Parties Involved</h2>
        <p className="text-sm text-muted-foreground">
          Add participants by legal name or search PMY users with @username
        </p>
      </div>

      <Card className="bg-muted/30 border-muted" data-testid="card-party-help">
        <CardContent className="p-3 text-sm text-muted-foreground">
          <div className="flex gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <strong>Legal name</strong>: For partners without PMY accounts (e.g., "Jane Smith")<br />
              <strong>@username</strong>: Search our network of PMY users (e.g., "@jane_smith")
            </div>
          </div>
        </CardContent>
      </Card>

      {contacts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm font-medium">Quick Add from Contacts</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {contacts.map((contact) => {
              const canonicalUsername = `@${contact.contactUsername}`;
              const isAlreadyAdded = parties.some(party => 
                party.toLowerCase() === canonicalUsername.toLowerCase()
              );
              
              return (
                <Button
                  key={contact.id}
                  variant={isAlreadyAdded ? "outline" : "secondary"}
                  size="sm"
                  className={isAlreadyAdded ? "opacity-50" : ""}
                  onClick={() => onAddContactAsParty(contact)}
                  disabled={isAlreadyAdded}
                  data-testid={`badge-contact-${contact.id}`}
                >
                  <UserPlus className="h-3 w-3 mr-1.5" />
                  {contact.nickname || contact.contactUsername}
                  {isAlreadyAdded && " ✓"}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {parties.map((party, index) => (
          <div key={index} className="space-y-1">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder={index === 0 ? "@username (You)" : `Legal name or @username`}
                  value={party}
                  onChange={(e) => onUpdateParty(index, e.target.value)}
                  data-testid={`input-party-${index}`}
                  className={partyErrors[index] ? "border-destructive" : ""}
                  disabled={index === 0}
                />
              </div>
              {parties.length > 1 && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onRemoveParty(index)}
                  data-testid={`button-remove-party-${index}`}
                >
                  ×
                </Button>
              )}
            </div>
            {partyErrors[index] && (
              <p className="text-sm text-destructive" data-testid={`error-party-${index}`}>
                {partyErrors[index]}
              </p>
            )}
          </div>
        ))}
        <Button
          variant="outline"
          onClick={onAddParty}
          className="w-full"
          data-testid="button-add-party"
        >
          + Add Another Participant
        </Button>
      </div>

      {/* Incentive message when external participants are added */}
      {parties.some(party => party.trim() && !party.startsWith('@')) && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800" data-testid="card-external-participant-incentive">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <UserCheck className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Enhanced Digital Verification Available
                </p>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Invite your partner to create a PMY account for digital signatures, biometric verification, and collaborative contract features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
