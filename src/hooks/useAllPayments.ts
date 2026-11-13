import * as React from "react";
import { useApp } from "@/store";

/**
 * Loads payments for every dues month in parallel. `ready` stays false until all
 * months have loaded, so screens never show "unpaid" for data that simply hasn't arrived.
 */
export function useAllPayments() {
  const { db, loadPayments } = useApp();
  const ids = db.dues.map((d) => d.id).join(",");
  const [loadedFor, setLoadedFor] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!ids) return;
    let cancelled = false;
    Promise.all(ids.split(",").map((id) => loadPayments(id))).catch(() => undefined).finally(() => {
      if (!cancelled) setLoadedFor(ids);
    });
    return () => {
      cancelled = true;
    };
  }, [ids, loadPayments]);

  return { ready: !!ids && loadedFor === ids, hasMonths: !!ids };
}
