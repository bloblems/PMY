import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { useLocation } from "wouter";

interface UserContact {
  id: string;
  userId: string;
  contactUsername: string;
  nickname: string | null;
  createdAt: string;
}

const addContactSchema = z.object({
  contactUsername: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  nickname: z.string().max(50).optional(),
});

type AddContactFormData = z.infer<typeof addContactSchema>;

export default function ContactsPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: contacts, isLoading } = useQuery<UserContact[]>({
    queryKey: ['/api/profile/contacts'],
  });

  const form = useForm<AddContactFormData>({
    resolver: zodResolver(addContactSchema),
    defaultValues: {
      contactUsername: "",
      nickname: "",
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: AddContactFormData) => {
      return await apiRequest('/api/profile/contacts', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/contacts'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Contact added",
        description: "Contact has been saved successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add contact",
        description: error.message || "Could not add contact",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/profile/contacts/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/profile/contacts'] });
      toast({
        title: "Contact deleted",
        description: "Contact has been removed successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete contact",
        description: error.message || "Could not delete contact",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AddContactFormData) => {
    addMutation.mutate(data);
  };

  return (
    <div className="w-full max-w-md md:max-w-2xl lg:max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold mb-2">Saved Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Save frequently used contacts for quick party selection during consent flow.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-contact">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
              <DialogDescription>
                Enter the username of the person you want to save as a contact.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactUsername"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="@username" 
                          {...field} 
                          data-testid="input-contact-username"
                        />
                      </FormControl>
                      <FormDescription>
                        The PMY username (without @)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Friendly name" 
                          {...field} 
                          data-testid="input-contact-nickname"
                        />
                      </FormControl>
                      <FormDescription>
                        A custom name to help you remember this contact
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={addMutation.isPending}
                    data-testid="button-save-contact"
                    className="flex-1"
                  >
                    {addMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Save Contact
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-contact"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : contacts && contacts.length > 0 ? (
        <div className="space-y-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="overflow-hidden" data-testid={`contact-card-${contact.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base">
                      @{contact.contactUsername}
                    </CardTitle>
                    {contact.nickname && (
                      <CardDescription className="mt-1">
                        {contact.nickname}
                      </CardDescription>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(contact.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${contact.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <UserPlus className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No contacts yet</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Add contacts to quickly select parties during consent flow
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-first-contact">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="mt-6">
        <Button
          variant="outline"
          onClick={() => navigate("/profile")}
          data-testid="button-back-to-profile"
        >
          Back to Profile
        </Button>
      </div>
    </div>
  );
}
