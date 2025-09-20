"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Advocate } from "../types/advocate";
import type { UseAdvocatesResult } from "../types/advocate";

const DEFAULT_API_PATH = "/api/advocates";

export default function useAdvocates(): UseAdvocatesResult {
  const [data, setData] = useState<Advocate[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const isFetchingRef = useRef(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // don't start a new fetch if one is already in progress
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const res = await fetch(DEFAULT_API_PATH);
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const json = await res.json();
      setData(json?.data ?? null);
    } catch (err: any) {
      // no AbortController used: handle errors normally
      setError(err instanceof Error ? err : new Error(String(err)));
      setData(null);
    } finally {
      isFetchingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    return;
  }, [fetchData]);

  return { data, isLoading, error  };
}
