import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient } from "@/lib/queryClient";
import { getAuthHeaders } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Check } from "lucide-react";
import { useLocation } from "wouter";

interface UserPreferences {
  defaultUniversityId: string | null;
  stateOfResidence: string | null;
  defaultEncounterType: string | null;
  defaultContractDuration: number | null;
}

interface University {
  id: string;
  name: string;
  state: string;
}

const preferencesSchema = z.object({
  defaultUniversityId: z.string().optional(),
  stateOfResidence: z.string().optional(),
  defaultEncounterType: z.string().optional(),
  defaultContractDuration: z.string().optional(),
});

type PreferencesFormData = z.infer<typeof preferencesSchema>;

const ENCOUNTER_TYPES = [
  { value: "casual", label: "Casual Encounter" },
  { value: "romantic", label: "Romantic Relationship" },
  { value: "committed", label: "Committed Partnership" },
];

const DURATION_PRESETS = [
  { value: "60", label: "1 Hour" },
  { value: "240", label: "4 Hours" },
  { value: "1440", label: "1 Day" },
  { value: "4320", label: "3 Days" },
  { value: "10080", label: "1 Week" },
];

export default function PreferencesPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: preferences, isLoading: loadingPreferences } = useQuery<UserPreferences>({
    queryKey: ['/api/profile/preferences'],
  });

  const { data: universities, isLoading: loadingUniversities } = useQuery<University[]>({
    queryKey: ['/api/universities'],
  });

  const form = useForm<PreferencesFormData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: {
      defaultUniversityId: "",
      stateOfResidence: "",
      defaultEncounterType: "",
      defaultContractDuration: "",
    },
  });

  useEffect(() => {
    if (preferences) {
      form.reset({
        defaultUniversityId: preferences.defaultUniversityId || "",
        stateOfResidence: preferences.stateOfResidence || "",
        defaultEncounterType: preferences.defaultEncounterType || "",
        defaultContractDuration: preferences.defaultContractDuration?.toString() || "",
      });
    }
  }, [preferences, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: PreferencesFormData) => {
      const payload = {
        defaultUniversityId: data.defaultUniversityId || null,
        stateOfResidence: data.stateOfResidence || null,
        defaultEncounterType: data.defaultEncounterType || null,
        defaultContractDuration: data.defaultContractDuration ? parseInt(data.defaultContractDuration) : null,
      };
      
      const authHeaders = await getAuthHeaders();
      const response = await fetch('/api/profile/preferences', {
        method: 'PATCH',
        body: JSON.stringify(payload),
        headers: { 
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/preferences'] });
      toast({
        title: "Preferences updated",
        description: "Your consent flow defaults have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update preferences",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PreferencesFormData) => {
    updateMutation.mutate(data);
  };

  if (loadingPreferences || loadingUniversities) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Consent Flow Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Set your default preferences to prepopulate consent forms. All fields are optional.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Default Settings</CardTitle>
              <CardDescription>
                These preferences will automatically prepopulate new consent flows to save you time.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="defaultUniversityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default University</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-default-university">
                          <SelectValue placeholder="Select a university" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {universities?.map((uni) => (
                          <SelectItem key={uni.id} value={uni.id}>
                            {uni.name} ({uni.state})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your university will be pre-selected in consent forms
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="stateOfResidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State of Residence</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-state-of-residence">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        <SelectItem value="AL">Alabama</SelectItem>
                        <SelectItem value="AK">Alaska</SelectItem>
                        <SelectItem value="AZ">Arizona</SelectItem>
                        <SelectItem value="AR">Arkansas</SelectItem>
                        <SelectItem value="CA">California</SelectItem>
                        <SelectItem value="CO">Colorado</SelectItem>
                        <SelectItem value="CT">Connecticut</SelectItem>
                        <SelectItem value="DE">Delaware</SelectItem>
                        <SelectItem value="FL">Florida</SelectItem>
                        <SelectItem value="GA">Georgia</SelectItem>
                        <SelectItem value="HI">Hawaii</SelectItem>
                        <SelectItem value="ID">Idaho</SelectItem>
                        <SelectItem value="IL">Illinois</SelectItem>
                        <SelectItem value="IN">Indiana</SelectItem>
                        <SelectItem value="IA">Iowa</SelectItem>
                        <SelectItem value="KS">Kansas</SelectItem>
                        <SelectItem value="KY">Kentucky</SelectItem>
                        <SelectItem value="LA">Louisiana</SelectItem>
                        <SelectItem value="ME">Maine</SelectItem>
                        <SelectItem value="MD">Maryland</SelectItem>
                        <SelectItem value="MA">Massachusetts</SelectItem>
                        <SelectItem value="MI">Michigan</SelectItem>
                        <SelectItem value="MN">Minnesota</SelectItem>
                        <SelectItem value="MS">Mississippi</SelectItem>
                        <SelectItem value="MO">Missouri</SelectItem>
                        <SelectItem value="MT">Montana</SelectItem>
                        <SelectItem value="NE">Nebraska</SelectItem>
                        <SelectItem value="NV">Nevada</SelectItem>
                        <SelectItem value="NH">New Hampshire</SelectItem>
                        <SelectItem value="NJ">New Jersey</SelectItem>
                        <SelectItem value="NM">New Mexico</SelectItem>
                        <SelectItem value="NY">New York</SelectItem>
                        <SelectItem value="NC">North Carolina</SelectItem>
                        <SelectItem value="ND">North Dakota</SelectItem>
                        <SelectItem value="OH">Ohio</SelectItem>
                        <SelectItem value="OK">Oklahoma</SelectItem>
                        <SelectItem value="OR">Oregon</SelectItem>
                        <SelectItem value="PA">Pennsylvania</SelectItem>
                        <SelectItem value="RI">Rhode Island</SelectItem>
                        <SelectItem value="SC">South Carolina</SelectItem>
                        <SelectItem value="SD">South Dakota</SelectItem>
                        <SelectItem value="TN">Tennessee</SelectItem>
                        <SelectItem value="TX">Texas</SelectItem>
                        <SelectItem value="UT">Utah</SelectItem>
                        <SelectItem value="VT">Vermont</SelectItem>
                        <SelectItem value="VA">Virginia</SelectItem>
                        <SelectItem value="WA">Washington</SelectItem>
                        <SelectItem value="WV">West Virginia</SelectItem>
                        <SelectItem value="WI">Wisconsin</SelectItem>
                        <SelectItem value="WY">Wyoming</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used for location-specific legal requirements
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultEncounterType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Encounter Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-default-encounter-type">
                          <SelectValue placeholder="Select encounter type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {ENCOUNTER_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Your preferred default for new consent contracts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultContractDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Contract Duration</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-default-duration">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Indefinite)</SelectItem>
                        {DURATION_PRESETS.map((preset) => (
                          <SelectItem key={preset.value} value={preset.value}>
                            {preset.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Default time period for consent contracts
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              data-testid="button-save-preferences"
              className="flex-1"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Save Preferences
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/profile")}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
