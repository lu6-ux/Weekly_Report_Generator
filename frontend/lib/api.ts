export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api${path}`,
    {
      ...options,
      credentials: "include",
      headers: { "Content-Type": "application/json", ...options.headers },
    },
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data as T;
}
export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Unable to connect to backend";
