import axios from "axios";
import type {
  PranaHealthResponse,
  PranaSystemHealthResponse,
  PranaPropagationLogResponse,
} from "@/types/prana";

const PRANA_BASE_URL =
  import.meta.env.VITE_PRANA_SERVICE_URL ?? import.meta.env.VITE_PRANA_URL ?? "";

export const pranaClient = axios.create({
  baseURL: PRANA_BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

export async function fetchPranaHealth(): Promise<PranaHealthResponse> {
  const { data } = await pranaClient.get<PranaHealthResponse>("/health");
  return data;
}

export async function fetchPranaSystemHealth(): Promise<PranaSystemHealthResponse> {
  const { data } = await pranaClient.get<PranaSystemHealthResponse>("/prana/system/health");
  return data;
}

export async function fetchPranaPropagationLog(limit = 50): Promise<PranaPropagationLogResponse> {
  const { data } = await pranaClient.get<any>("/prana/propagation-log", { params: { limit } });

  if (Array.isArray(data)) {
    return { logs: data, total: data.length, count: data.length };
  }
  return {
    ...data,
    logs: Array.isArray(data?.logs) ? data.logs : [],
  };
}
