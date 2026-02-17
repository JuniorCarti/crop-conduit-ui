import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { InternationalSimulationOutput } from "@/services/internationalSimulationService";

export function InternationalResultsPanel({ result }: { result: InternationalSimulationOutput | null }) {
  if (!result) {
    return (
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Results</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">Run simulation to view projected trend, drivers, and recommendations.</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Projected trend</CardTitle></CardHeader>
        <CardContent className="h-64">
          {result.series.length === 0 ? (
            <p className="text-sm text-muted-foreground">No projection yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={result.series}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Line dataKey="min" stroke="hsl(var(--destructive))" strokeWidth={1.8} dot={false} />
                <Line dataKey="mid" stroke="hsl(var(--primary))" strokeWidth={2.2} />
                <Line dataKey="max" stroke="hsl(var(--chart-2))" strokeWidth={1.8} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Key drivers</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {result.drivers.map((driver, index) => <p key={`${driver}_${index}`}>- {driver}</p>)}
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-base">Recommended actions</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {result.recommendedActions.map((action, index) => (
            <div key={`${action.title}_${index}`} className="rounded border border-border/60 px-3 py-2">
              <p className="font-medium">{action.title}</p>
              <p className="text-muted-foreground">{action.reason}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Accordion type="single" collapsible className="rounded-lg border border-border/60 bg-card px-3">
        <AccordionItem value="assumptions">
          <AccordionTrigger>Risks & assumptions</AccordionTrigger>
          <AccordionContent>
            <ul className="space-y-1 text-sm text-muted-foreground">
              {result.assumptions.map((item, index) => <li key={`${item}_${index}`}>- {item}</li>)}
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
