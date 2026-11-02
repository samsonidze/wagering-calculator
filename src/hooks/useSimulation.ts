import { useEffect, useRef, useState } from "react";
import type { SimInputs, SimResult } from "../lib/simulate";
import type { SimRequest, SimResponse } from "../worker/sim.worker";

/**
 * Runs the Monte Carlo in a Web Worker, debounced, and ignores stale replies
 * so a slow large run can never overwrite a newer small one.
 */
export function useSimulation(inputs: SimInputs | null, delayMs = 250) {
  const workerRef = useRef<Worker | null>(null);
  const idRef = useRef(0);
  const [result, setResult] = useState<SimResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL("../worker/sim.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (e: MessageEvent<SimResponse>) => {
      if (e.data.id !== idRef.current) return;
      setResult(e.data.result);
      setRunning(false);
    };
    workerRef.current = worker;
    return () => worker.terminate();
  }, []);

  const key = inputs ? JSON.stringify(inputs) : "";
  useEffect(() => {
    if (!inputs || !workerRef.current) return;
    setRunning(true);
    const id = ++idRef.current;
    const timer = setTimeout(() => {
      workerRef.current?.postMessage({ id, inputs } satisfies SimRequest);
    }, delayMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delayMs]);

  return { result, running };
}
