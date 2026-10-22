// Frontend demo only. Replace with EmailJS, Formspree, or your own API here.
export async function sendMessage(data: Record<string, string>) {
  await new Promise((r) => setTimeout(r, 700))
  const messages = JSON.parse(localStorage.getItem("wander:messages") || "[]")
  localStorage.setItem(
    "wander:messages",
    JSON.stringify([...messages, { ...data, date: new Date().toISOString() }]),
  )
}
