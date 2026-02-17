import { AlertTriangle } from "lucide-react";

export function SimulationEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <AlertTriangle className="mr-2 inline h-4 w-4" />
      {message}
    </div>
  );
}
