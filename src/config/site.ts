export const photo = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`
export const site = {
  brandName: "wander",
  authorName: "Alex Morgan",
  tagline: "A curious mind. An open road.",
  bio: "A writer, slow traveler, and collector of little moments. Finding the extraordinary in the everyday, one story at a time.",
  avatar: photo("photo-1472099645785-5658abf4ff4e", 160),
  portrait: photo("photo-1500648767791-00dcc994a43e"),
  navBackground: photo("photo-1441974231531-c6227db76b6e"),
  email: "hello@alexwanders.com",
  location: "Portland, Oregon · Often elsewhere",
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  countries: 24,
  years: 8,
  about:
    "I took the long way home, and never really stopped. This journal is a collection of places that changed me, people who inspired me, and the small things worth slowing down for.",
  timeline: [
    {
      year: "2018",
      title: "A one-way ticket",
      text: "Left the familiar behind with a backpack and a notebook.",
    },
    {
      year: "2020",
      title: "Finding a slower rhythm",
      text: "Learned that adventure can begin right outside your door.",
    },
    {
      year: "2023",
      title: "Stories worth sharing",
      text: "Started this little corner of the internet.",
    },
    {
      year: "2026",
      title: "Still wandering",
      text: "Twenty-four countries later, the curiosity only grows.",
    },
  ],
}
