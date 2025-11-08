import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FileList from "@/components/FileList";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Recording {
  id: string;
  filename: string;
  fileUrl: string;
  duration: string;
  createdAt: string;
}

interface Contract {
  id: string;
  contractText: string;
  signature1: string;
  signature2: string;
  createdAt: string;
}

export default function FilesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings = [] } = useQuery<Recording[]>({
    queryKey: ["/api/recordings"],
  });

  const { data: contracts = [] } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/recordings/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/recordings"] });
      toast({
        title: "File deleted",
        description: "Recording has been removed",
      });
    },
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/contracts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "File deleted",
        description: "Contract has been removed",
      });
    },
  });

  // Combine and format files
  const files = [
    ...recordings.map((r) => ({
      id: r.id,
      name: r.filename,
      type: "audio" as const,
      date: new Date(r.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      duration: r.duration,
      fileUrl: r.fileUrl,
    })),
    ...contracts.map((c) => ({
      id: c.id,
      name: `contract-${new Date(c.createdAt).toLocaleDateString().replace(/\//g, "-")}.pdf`,
      type: "contract" as const,
      date: new Date(c.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      signature1: c.signature1,
      signature2: c.signature2,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownload = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    if (file.type === "audio" && "fileUrl" in file) {
      // Download audio file
      const a = document.createElement("a");
      a.href = file.fileUrl;
      a.download = file.name;
      a.click();
      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      });
    } else if (file.type === "contract") {
      // For contracts, we could generate a PDF or download signatures
      toast({
        title: "Download started",
        description: `Downloading ${file.name}`,
      });
      console.log("Download contract:", id);
    }
  };

  const handleDelete = (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    if (file.type === "audio") {
      deleteRecordingMutation.mutate(id);
    } else {
      deleteContractMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Files</h1>
        <p className="text-muted-foreground">
          Manage your recordings and contracts
        </p>
      </div>

      <FileList files={files} onDownload={handleDownload} onDelete={handleDelete} />
    </div>
  );
}
