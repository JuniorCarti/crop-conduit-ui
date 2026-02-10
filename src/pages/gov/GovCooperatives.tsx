import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { listCoopsIndex } from "@/services/govAggregatesService";
import { GovEmptyState } from "@/pages/gov/GovEmptyState";

export default function GovCooperatives() {
  const navigate = useNavigate();
  const [county, setCounty] = useState("all");
  const [status, setStatus] = useState("all");
  const [size, setSize] = useState("all");
  const [search, setSearch] = useState("");

  const query = useQuery({
    queryKey: ["govCoopsIndex"],
    queryFn: listCoopsIndex,
  });

  const rows = useMemo(() => {
    const source = query.data ?? [];
    return source.filter((row: any) => {
      const matchesCounty = county === "all" || String(row.county ?? "").toLowerCase() === county;
      const matchesStatus = status === "all" || String(row.status ?? "").toLowerCase() === status;
      const matchesSize = size === "all" || String(row.sizeCategory ?? "").toLowerCase() === size;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || String(row.orgName ?? row.name ?? "").toLowerCase().includes(q);
      return matchesCounty && matchesStatus && matchesSize && matchesSearch;
    });
  }, [query.data, county, status, size, search]);

  if (query.isLoading) {
    return <Card className="border-border/60"><CardContent className="p-6 text-sm text-muted-foreground">Loading cooperatives index...</CardContent></Card>;
  }
  if (!query.data || query.data.length === 0) return <GovEmptyState />;

  return (
    <div className="space-y-4">
      <Card className="border-border/60">
        <CardContent className="pt-6 grid gap-3 md:grid-cols-4">
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search cooperative" />
          <Select value={county} onValueChange={setCounty}>
            <SelectTrigger><SelectValue placeholder="County" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All counties</SelectItem>
              {[...new Set((query.data ?? []).map((item: any) => String(item.county ?? "").toLowerCase()).filter(Boolean))].map((item) => (
                <SelectItem key={item} value={item}>{item}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger><SelectValue placeholder="Size category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sizes</SelectItem>
              <SelectItem value="small">Small</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="large">Large</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card className="border-border/60">
        <CardHeader><CardTitle>Approved cooperatives</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {rows.length === 0 ? <p className="text-sm text-muted-foreground">No cooperatives match these filters.</p> : rows.map((row: any) => (
            <div key={row.id} className="flex flex-col gap-2 rounded border border-border/60 p-3 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium">{row.orgName ?? row.name ?? "Cooperative"}</p>
                <p className="text-muted-foreground">{row.county ?? "--"} • {row.status ?? "--"}</p>
              </div>
              <div className="text-xs text-muted-foreground md:text-right">
                <p>Verified members: {row.verifiedFarmers ?? 0}</p>
                <p>Seat usage: {row.paidUsed ?? 0}/{row.paidTotal ?? 0} paid • {row.sponsoredUsed ?? 0}/{row.sponsoredTotal ?? 0} sponsored</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => navigate(`/gov/cooperatives/${row.id}`)}>
                View summary
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

