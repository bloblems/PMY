import AudioRecorder from "@/components/AudioRecorder";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function RecordPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Audio Recording</h1>
        <p className="text-muted-foreground">
          Record verbal consent securely
        </p>
      </div>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Best Practices</p>
            <ul className="text-muted-foreground space-y-1 list-disc list-inside">
              <li>Ensure both parties can be clearly heard</li>
              <li>State the date, time, and both parties' consent verbally</li>
              <li>Confirm that both parties are of sound mind and not impaired</li>
              <li>Remember: consent can be withdrawn at any time</li>
            </ul>
          </div>
        </div>
      </Card>

      <AudioRecorder />
    </div>
  );
}
