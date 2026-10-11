export const DISALLOWED_MIME_TYPES = [
  "application/x-msdownload",
  "application/x-sh",
  "application/x-bat",
  "application/x-executable",
  "application/vnd.microsoft.portable-executable",
  "application/java-archive",
];

export const DISALLOWED_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".sh",
  ".msi",
  ".com",
  ".js",
  ".jar",
  ".dll",
  ".ps1",
];

export function sanitizeFilename(filename: string): string {
  const trimmed = filename.trim().replace(/[/\\]/g, "_");
  return trimmed.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}
