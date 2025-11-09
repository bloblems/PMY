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
  universityId?: string;
  encounterType?: string;
  parties?: string[];
}

interface Contract {
  id: string;
  contractText: string;
  signature1: string;
  signature2: string;
  createdAt: string;
  universityId?: string;
  encounterType?: string;
  parties?: string[];
  method?: string;
  photoUrl?: string;
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
      encounterType: r.encounterType,
      parties: r.parties,
    })),
    ...contracts.map((c) => ({
      id: c.id,
      name: c.method === "photo" 
        ? `photo-consent-${new Date(c.createdAt).toLocaleDateString().replace(/\//g, "-")}`
        : `contract-${new Date(c.createdAt).toLocaleDateString().replace(/\//g, "-")}.pdf`,
      type: "contract" as const,
      date: new Date(c.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      signature1: c.signature1,
      signature2: c.signature2,
      encounterType: c.encounterType,
      parties: c.parties,
      method: c.method,
      photoUrl: c.photoUrl,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDownload = async (id: string) => {
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
      try {
        // Fetch the contract data
        const response = await fetch(`/api/contracts/${id}`);
        if (!response.ok) throw new Error("Failed to fetch contract");
        
        const contractData = await response.json();
        
        // Build encounter details section
        const encounterDetails = contractData.encounterType || contractData.parties?.length > 0 ? `
  <div class="encounter-details">
    ${contractData.encounterType ? `<p><strong>Encounter Type:</strong> ${contractData.encounterType}</p>` : ''}
    ${contractData.parties?.length > 0 ? `<p><strong>Parties Involved:</strong> ${contractData.parties.join(', ')}</p>` : ''}
    ${contractData.method ? `<p><strong>Method:</strong> ${contractData.method}</p>` : ''}
  </div>` : '';

        // Create a simple HTML representation of the contract
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Consent Contract - ${file.date}</title>
  <style>
    body { font-family: Georgia, serif; max-width: 800px; margin: 40px auto; padding: 20px; line-height: 1.6; }
    h1 { text-align: center; margin-bottom: 30px; }
    .encounter-details { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .encounter-details p { margin: 5px 0; }
    .signatures { display: flex; gap: 40px; margin-top: 40px; }
    .signature { flex: 1; }
    .signature img { border: 2px solid #ccc; width: 100%; max-width: 300px; }
    .signature-label { font-weight: bold; margin-bottom: 10px; }
    .photo { text-align: center; margin-top: 30px; }
    .photo img { max-width: 100%; border: 2px solid #ccc; }
    .timestamp { text-align: center; margin-top: 20px; font-size: 14px; color: #666; }
    pre { white-space: pre-wrap; }
  </style>
</head>
<body>
  ${encounterDetails}
  <pre>${contractData.contractText}</pre>
  ${contractData.photoUrl ? `
  <div class="photo">
    <div class="signature-label">Consent Photo:</div>
    <img src="${contractData.photoUrl}" alt="Consent Photo" />
  </div>` : `
  <div class="signatures">
    <div class="signature">
      <div class="signature-label">Signature 1:</div>
      <img src="${contractData.signature1}" alt="Signature 1" />
    </div>
    <div class="signature">
      <div class="signature-label">Signature 2:</div>
      <img src="${contractData.signature2}" alt="Signature 2" />
    </div>
  </div>`}
  <div class="timestamp">
    Signed on ${new Date(contractData.createdAt).toLocaleString()}
  </div>
</body>
</html>`;
        
        // Create blob and download
        const blob = new Blob([htmlContent], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name.replace(".pdf", ".html");
        a.click();
        URL.revokeObjectURL(url);
        
        toast({
          title: "Download started",
          description: `Downloading ${file.name}`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to download contract",
          variant: "destructive",
        });
      }
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
        <h1 className="text-3xl font-bold tracking-tight mb-2">Saved Files and Contracts</h1>
        <p className="text-muted-foreground">
          Manage your records
        </p>
      </div>

      <FileList files={files} onDownload={handleDownload} onDelete={handleDelete} />
    </div>
  );
}
