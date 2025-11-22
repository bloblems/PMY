import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown } from "lucide-react";
import { US_STATES } from "@/lib/constants";

interface StateSelectorProps {
  selectedState: { code: string; name: string } | null;
  onSelect: (state: { code: string; name: string }) => void;
}

export default function StateSelector({ selectedState, onSelect }: StateSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-12 text-base"
          data-testid="button-select-state"
        >
          {selectedState ? (
            <span className="truncate">
              {selectedState.name}
            </span>
          ) : (
            <span className="text-muted-foreground">Select your state...</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search states..." />
          <CommandList className="max-h-[200px]">
            <CommandEmpty>No state found.</CommandEmpty>
            <CommandGroup>
              {US_STATES.map((state) => (
                <CommandItem
                  key={state.code}
                  value={state.name}
                  onSelect={() => {
                    onSelect(state);
                    setOpen(false);
                  }}
                  data-testid={`option-state-${state.code}`}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selectedState?.code === state.code
                        ? "opacity-100"
                        : "opacity-0"
                    }`}
                  />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="truncate font-medium">{state.name}</span>
                    <span className="text-xs text-muted-foreground">{state.code}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
