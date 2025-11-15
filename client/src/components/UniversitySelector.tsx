import { useState } from "react";
import { Check, ChevronDown, AlertCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface University {
  id: string;
  name: string;
  state: string;
  titleIXInfo: string;
  titleIXUrl: string | null;
  lastUpdated: string;
  verifiedAt: string | null;
}

interface UniversitySelectorProps {
  universities: University[];
  selectedUniversity: University | null;
  onSelect: (university: University) => void;
}

export default function UniversitySelector({
  universities,
  selectedUniversity,
  onSelect,
}: UniversitySelectorProps) {
  const [open, setOpen] = useState(false);
  const [showNotListedDialog, setShowNotListedDialog] = useState(false);
  const { toast } = useToast();
  
  // Compute the command value based on selected university
  const commandValue = selectedUniversity 
    ? `${selectedUniversity.name} ${selectedUniversity.state}` 
    : "";

  const handleNotListed = () => {
    setOpen(false);
    setShowNotListedDialog(true);
  };

  const handleDialogClose = () => {
    setShowNotListedDialog(false);
    toast({
      title: "Thank you for your interest",
      description: "We'll notify you when PMY expands to more universities.",
    });
  };

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 text-base"
          data-testid="button-select-university"
        >
          {selectedUniversity ? (
            <span className="truncate">
              {selectedUniversity.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select your university...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command value={commandValue}>
          <CommandInput placeholder="Search universities..." />
          <CommandList>
            <CommandEmpty>No university found.</CommandEmpty>
            <CommandGroup>
              {universities.map((university) => (
                <CommandItem
                  key={university.id}
                  value={`${university.name} ${university.state}`}
                  onSelect={() => {
                    onSelect(university);
                    setOpen(false);
                  }}
                  data-testid={`option-university-${university.id}`}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedUniversity?.id === university.id
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium">{university.name}</span>
                    <span className="text-xs text-muted-foreground">{university.state}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem
                value="my-university-isnt-listed"
                onSelect={handleNotListed}
                data-testid="option-not-listed"
                className="text-muted-foreground"
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                <span>My university isn't listed...</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>

    <Dialog open={showNotListedDialog} onOpenChange={setShowNotListedDialog}>
      <DialogContent data-testid="dialog-not-listed">
        <DialogHeader>
          <DialogTitle>University Not Listed</DialogTitle>
          <DialogDescription className="space-y-3 pt-2">
            <p>
              PMY is currently available only to students at the top universities in the United States.
            </p>
            <p>
              We're working to expand access to more institutions. If your university isn't listed, please contact us to express interest in bringing PMY to your campus.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => {
              window.location.href = "mailto:support@consentguard.app?subject=University%20Expansion%20Request";
            }}
            data-testid="button-contact-us"
          >
            <Mail className="w-4 h-4 mr-2" />
            Contact Us
          </Button>
          <Button onClick={handleDialogClose} data-testid="button-close-dialog">
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
