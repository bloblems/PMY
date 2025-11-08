import { useState } from "react";
import FileList from "@/components/FileList";
import { useToast } from "@/hooks/use-toast";

const mockFiles = [
  {
    id: "1",
    name: "consent-11-08-2025.webm",
    type: "audio" as const,
    date: "Nov 8, 2025",
    duration: "2:34",
  },
  {
    id: "2",
    name: "consent-contract-11-07-2025.pdf",
    type: "contract" as const,
    date: "Nov 7, 2025",
  },
  {
    id: "3",
    name: "consent-11-05-2025.webm",
    type: "audio" as const,
    date: "Nov 5, 2025",
    duration: "1:45",
  },
];

export default function FilesPage() {
  const [files, setFiles] = useState(mockFiles);
  const { toast } = useToast();

  const handleDownload = (id: string) => {
    const file = files.find((f) => f.id === id);
    toast({
      title: "Download started",
      description: `Downloading ${file?.name}`,
    });
    console.log("Download file:", id);
  };

  const handleDelete = (id: string) => {
    const file = files.find((f) => f.id === id);
    setFiles(files.filter((f) => f.id !== id));
    toast({
      title: "File deleted",
      description: `${file?.name} has been removed`,
    });
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
