import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchLogisticsRoute } from "@/services/logisticsService";
import type { LogisticsRoute } from "@/types/logistics";

export function useLogisticsRoute(params?: {
  crop?: string | null;
  origin?: string | null;
  destination?: string | null;
}) {
  const { currentUser } = useAuth();
  const [data, setData] = useState<LogisticsRoute | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const crop = params?.crop?.trim() || "";
    const origin = params?.origin?.trim() || "";
    const destination = params?.destination?.trim() || "";

    if (!crop || !origin || !destination) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const token = currentUser ? await currentUser.getIdToken() : undefined;
        const response = await fetchLogisticsRoute({ crop, origin, destination }, token);
        if (!active) return;
        if (response.ok) {
          setData(response.data || null);
          setError(null);
        } else {
          setData(null);
          setError(response.error || "No transport data available for this route");
        }
      } catch (err: any) {
        if (!active) return;
        setData(null);
        setError(err?.message || "No transport data available for this route");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentUser, params?.crop, params?.origin, params?.destination]);

  return { data, loading, error };
}
