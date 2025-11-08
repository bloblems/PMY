import ContractViewer from "@/components/ContractViewer";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function ContractPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Digital Contract</h1>
        <p className="text-muted-foreground">
          Execute and sign a mutual consent agreement
        </p>
      </div>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex gap-3">
          <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Important Notice</p>
            <p className="text-muted-foreground">
              Both parties must read and understand the entire contract before signing. 
              Signatures indicate mutual consent and understanding of all terms.
            </p>
          </div>
        </div>
      </Card>

      <ContractViewer />
    </div>
  );
}
