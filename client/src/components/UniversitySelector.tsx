import { useState } from "react";
import { Check, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const handleNotListed = () => {
    setOpen(false);
    setShowNotListedDialog(true);
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
        <Command>
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
              ConsentGuard is currently available only to students at the top universities in the United States.
            </p>
            <p>
              We're working to expand access to more institutions. If your university isn't listed, please check back soon or contact us to express interest in bringing ConsentGuard to your campus.
            </p>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setShowNotListedDialog(false)} data-testid="button-close-dialog">
            Understood
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
