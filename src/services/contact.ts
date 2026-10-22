import { apiFetch } from "../lib/api"

export async function sendMessage(data: Record<string, string>) {
  return apiFetch("contact", {
    method: "POST",
    body: { ...data, website: undefined },
  })
}
