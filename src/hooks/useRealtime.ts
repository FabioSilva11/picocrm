import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRealtime(table: string, queryKeys: string[][]) {
  const qc = useQueryClient();
  useEffect(() => {
    const ch = supabase
      .channel(`rt-${table}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        queryKeys.forEach((k) => qc.invalidateQueries({ queryKey: k }));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);
}
