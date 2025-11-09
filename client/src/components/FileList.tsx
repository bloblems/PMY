import { FileAudio, FileText, Download, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface FileItem {
  id: string;
  name: string;
  type: "audio" | "contract";
  date: string;
  duration?: string;
}

interface FileListProps {
  files: FileItem[];
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function FileList({ files, onDownload, onDelete }: FileListProps) {
  if (files.length === 0) {
    return (
      <Card className="p-12">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <FileAudio className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">No saved files</h3>
          <p className="text-sm text-muted-foreground">
            Your records and contracts will appear here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((file) => (
        <Card key={file.id} className="p-4 hover-elevate" data-testid={`file-item-${file.id}`}>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              {file.type === "audio" ? (
                <FileAudio className="h-5 w-5 text-primary" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate mb-1" data-testid={`text-filename-${file.id}`}>
                {file.name}
              </h4>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{file.date}</span>
                {file.duration && (
                  <>
                    <span>•</span>
                    <span>{file.duration}</span>
                  </>
                )}
              </div>
              <div className="mt-2">
                <Badge variant="secondary" className="text-xs">
                  {file.type === "audio" ? "Audio Recording" : "Signed Contract"}
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDownload(file.id)}
                data-testid={`button-download-${file.id}`}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onDelete(file.id)}
                data-testid={`button-delete-${file.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
