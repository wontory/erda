import type { PotentialData } from "@erda/core";
import { useQuery } from "@tanstack/react-query";

export function usePotentialData() {
  return useQuery<PotentialData>({
    queryKey: ["simulators", "potential-data"],
    queryFn: () => import("@erda/core/simulators/data/potential-tables"),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
