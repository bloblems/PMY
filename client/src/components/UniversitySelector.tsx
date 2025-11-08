import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  return (
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
