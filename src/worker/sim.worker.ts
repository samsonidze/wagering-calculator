import { simulate, type SimInputs, type SimResult } from "../lib/simulate";

export interface SimRequest { id: number; inputs: SimInputs }
export interface SimResponse { id: number; result: SimResult }

self.onmessage = (e: MessageEvent<SimRequest>) => {
  const { id, inputs } = e.data;
  const result = simulate(inputs);
  (self as unknown as Worker).postMessage({ id, result } satisfies SimResponse);
};
