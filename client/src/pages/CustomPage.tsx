import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export default function CustomPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Custom Templates</h1>
        <p className="text-muted-foreground">
          Create consent contracts from customizable templates
        </p>
      </div>

      <Card className="p-12">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold">Custom Templates Coming Soon</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Generate consent documentation using AI-powered templates tailored to your specific needs, 
              independent of any particular institution.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
