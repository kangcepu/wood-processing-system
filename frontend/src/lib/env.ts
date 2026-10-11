export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3001/api/v1";
}

export function getRealtimeUrl(): string {
  return process.env.NEXT_PUBLIC_REALTIME_URL ?? "http://localhost:3001";
}

export function toAbsoluteUploadUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${getApiBaseUrl()}${url.startsWith("/") ? url : `/${url}`}`;
}
