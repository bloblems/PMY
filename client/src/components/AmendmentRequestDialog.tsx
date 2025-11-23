import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface AmendmentRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: string;
  currentActs: {
    touching: boolean;
    kissing: boolean;
    oral: boolean;
    anal: boolean;
    vaginal: boolean;
  };
  currentStartTime?: string;
  currentEndTime?: string;
  isLoading?: boolean;
  onSubmit: (amendment: {
    amendmentType: 'add_acts' | 'remove_acts' | 'extend_duration' | 'shorten_duration';
    changes: string;
    reason: string;
  }) => Promise<void>;
}

export function AmendmentRequestDialog({
  open,
  onOpenChange,
  currentActs,
  currentStartTime,
  currentEndTime,
  isLoading,
  onSubmit,
}: AmendmentRequestDialogProps) {
  const [amendmentType, setAmendmentType] = useState<'acts' | 'duration'>('acts');
  const [actsChangeType, setActsChangeType] = useState<'add' | 'remove'>('add');
  const [durationChangeType, setDurationChangeType] = useState<'extend' | 'shorten'>('extend');
  const [selectedActs, setSelectedActs] = useState({
    touching: false,
    kissing: false,
    oral: false,
    anal: false,
    vaginal: false,
  });
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(
    currentEndTime ? new Date(currentEndTime) : undefined
  );
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when dialog opens - selectedActs always starts empty (user picks what to add/remove)
  useEffect(() => {
    if (open) {
      setSelectedActs({
        touching: false,
        kissing: false,
        oral: false,
        anal: false,
        vaginal: false,
      });
      setNewEndDate(currentEndTime ? new Date(currentEndTime) : undefined);
      setReason("");
      setIsSubmitting(false);
      setAmendmentType('acts');
      setActsChangeType('add');
      setDurationChangeType('extend');
    }
  }, [open, currentEndTime]);

  const handleActToggle = (act: keyof typeof selectedActs) => {
    setSelectedActs(prev => ({
      ...prev,
      [act]: !prev[act],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let finalAmendmentType: 'add_acts' | 'remove_acts' | 'extend_duration' | 'shorten_duration';
      let changes: any = {};

      if (amendmentType === 'acts') {
        finalAmendmentType = actsChangeType === 'add' ? 'add_acts' : 'remove_acts';
        const changedActs = Object.keys(selectedActs).filter(
          act => selectedActs[act as keyof typeof selectedActs]
        );
        changes = actsChangeType === 'add' 
          ? { addedActs: changedActs }
          : { removedActs: changedActs };
      } else {
        finalAmendmentType = durationChangeType === 'extend' ? 'extend_duration' : 'shorten_duration';
        changes = { newEndTime: newEndDate?.toISOString() };
      }

      await onSubmit({
        amendmentType: finalAmendmentType,
        changes: JSON.stringify(changes),
        reason,
      });

      // Reset form
      setSelectedActs({
        touching: false,
        kissing: false,
        oral: false,
        anal: false,
        vaginal: false,
      });
      setReason("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting amendment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = () => {
    if (!reason.trim()) return false;
    
    if (amendmentType === 'acts') {
      const hasSelectedActs = Object.values(selectedActs).some(val => val);
      return hasSelectedActs;
    } else {
      return newEndDate !== undefined;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-amendment-request">
        <DialogHeader>
          <DialogTitle>Request Amendment</DialogTitle>
          <DialogDescription>
            Propose changes to this contract. All parties must approve the amendment for it to take effect.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Amendment Type Selection */}
          <div className="space-y-3">
            <Label>What would you like to change?</Label>
            <RadioGroup value={amendmentType} onValueChange={(val) => setAmendmentType(val as 'acts' | 'duration')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="acts" id="acts" data-testid="radio-acts" />
                <Label htmlFor="acts" className="font-normal cursor-pointer">
                  Intimate Acts (add or remove consent for specific acts)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="duration" id="duration" data-testid="radio-duration" />
                <Label htmlFor="duration" className="font-normal cursor-pointer">
                  Contract Duration (extend or shorten end time)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Acts Amendment Options */}
          {amendmentType === 'acts' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Action</Label>
                <RadioGroup value={actsChangeType} onValueChange={(val) => setActsChangeType(val as 'add' | 'remove')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="add" id="add" data-testid="radio-add-acts" />
                    <Label htmlFor="add" className="font-normal cursor-pointer">
                      Add new acts (requires mutual approval)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="remove" id="remove" data-testid="radio-remove-acts" />
                    <Label htmlFor="remove" className="font-normal cursor-pointer">
                      Remove acts (withdraw consent)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Select Acts to {actsChangeType === 'add' ? 'Add' : 'Remove'}</Label>
                <div className="space-y-2">
                  {Object.entries({
                    touching: 'Touching',
                    kissing: 'Kissing',
                    oral: 'Oral',
                    anal: 'Anal',
                    vaginal: 'Vaginal',
                  }).map(([key, label]) => {
                    const currentlySelected = currentActs[key as keyof typeof currentActs];
                    const isDisabled = actsChangeType === 'add' ? currentlySelected : !currentlySelected;
                    
                    return (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={selectedActs[key as keyof typeof selectedActs]}
                          onCheckedChange={() => handleActToggle(key as keyof typeof selectedActs)}
                          disabled={isDisabled}
                          data-testid={`checkbox-${key}`}
                        />
                        <Label
                          htmlFor={key}
                          className={cn(
                            "font-normal cursor-pointer",
                            isDisabled && "text-muted-foreground"
                          )}
                        >
                          {label} {isDisabled && `(${actsChangeType === 'add' ? 'already selected' : 'not selected'})`}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Duration Amendment Options */}
          {amendmentType === 'duration' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>Action</Label>
                <RadioGroup value={durationChangeType} onValueChange={(val) => setDurationChangeType(val as 'extend' | 'shorten')}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="extend" id="extend" data-testid="radio-extend" />
                    <Label htmlFor="extend" className="font-normal cursor-pointer">
                      Extend contract duration
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="shorten" id="shorten" data-testid="radio-shorten" />
                    <Label htmlFor="shorten" className="font-normal cursor-pointer">
                      Shorten contract duration
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>New End Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEndDate && "text-muted-foreground"
                      )}
                      data-testid="button-select-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newEndDate ? format(newEndDate, "PPP p") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newEndDate}
                      onSelect={setNewEndDate}
                      disabled={(date) => date < new Date()}
                    />
                  </PopoverContent>
                </Popover>
                {currentEndTime && (
                  <p className="text-sm text-muted-foreground">
                    Current end time: {format(new Date(currentEndTime), "PPP p")}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-3">
            <Label htmlFor="reason">
              Reason for Amendment <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Explain why you're requesting this amendment..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[100px]"
              data-testid="textarea-reason"
            />
            <p className="text-xs text-muted-foreground">
              Provide context for why you're proposing this change. This will be visible to all parties.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isLoading}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || isSubmitting || isLoading}
            data-testid="button-submit-amendment"
          >
            {(isSubmitting || isLoading) ? "Submitting..." : "Request Amendment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
