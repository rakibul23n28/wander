import type { Post } from "../services/posts"
import { photo } from "../config/site"
import { slugify } from "../lib/utils"
const stories = [
  [
    "The Art of Getting a Little Lost",
    "Travel",
    "photo-1464822759023-dda701c7f80b",
    "Somewhere between the wrong turn and the long way home, you find exactly where you’re meant to be.",
  ],
  [
    "A Loving Heart Is the Truest Wisdom",
    "Life & thoughts",
    "photo-1472396961693-142e6e269027",
    "A few quiet thoughts on kindness, connection, and the things that make a life feel full.",
  ],
  [
    "Where the Mountains Meet the Sky",
    "Adventure",
    "photo-1501785888041-af3ef285b470",
    "Early mornings, alpine air, and a reminder of just how small—and lucky—we are.",
  ],
  [
    "Chasing the Last Light",
    "Travel",
    "photo-1476514525535-07fb3b4ae5f1",
    "Golden hour has a way of turning an ordinary place into a memory you keep forever.",
  ],
  [
    "The Slow Days Are the Good Days",
    "Lifestyle",
    "photo-1441974231531-c6227db76b6e",
    "Less rushing. More noticing. A small guide to making room for the everyday magic.",
  ],
  [
    "Postcards from the Italian Coast",
    "Travel",
    "photo-1516483638261-f4dbaf036963",
    "Salt on your skin, espresso in the square, and no particular place to be.",
  ],
  [
    "A Cabin, a Lake, and Nothing Else",
    "Adventure",
    "photo-1449158743715-0a90ebb6d2d8",
    "Sometimes the most meaningful escape is the simplest one.",
  ],
  [
    "Little Rituals, Beautiful Mornings",
    "Lifestyle",
    "photo-1442512595331-e89e73853f31",
    "Finding a softer start, one cup and one page at a time.",
  ],
  [
    "A World Worth Wandering",
    "Travel",
    "photo-1469474968028-56623f02e42e",
    "A moving postcard from places that remind us to stay curious.",
  ],
  [
    "Finding Stillness in Motion",
    "Life & thoughts",
    "photo-1470770841072-f978cf4d019e",
    "On the road, I found a little space to listen to myself.",
  ],
  [
    "Under a Bigger Sky",
    "Adventure",
    "photo-1500534623283-312aade485b7",
    "Wide-open landscapes and the freedom to begin again.",
  ],
  [
    "A Few Seconds of Wonder",
    "Lifestyle",
    "photo-1500530855697-b586d89ba3ee",
    "The moments between destinations are sometimes the whole point.",
  ],
  [
    "The Ocean Has Its Own Rhythm",
    "Travel",
    "photo-1518837695005-2083093ee35b",
    "An afternoon on the water, without a plan or a clock.",
  ],
  [
    "Notes to My Younger Self",
    "Life & thoughts",
    "",
    "You don’t need to have it all figured out. Just keep your heart open.",
  ],
]
export const seedPosts: Post[] = stories.map((s, i) => {
  const date = new Date(
    2026,
    5 - Math.floor(i / 3),
    19 - (i % 3) * 5,
  ).toISOString()
  return {
    id: `sample-${i}`,
    slug: slugify(s[0]),
    title: s[0],
    excerpt: s[3],
    category: s[1],
    tags: ["Slow living", i % 2 ? "Inspiration" : "Wanderlust"],
    status: "published",
    views: [
      9800, 4380, 7250, 2840, 1960, 5620, 870, 1420, 3200, 650, 2340, 480, 120,
      310,
    ][i],
    isSample: true,
    featured: i === 0,
    createdAt: date,
    updatedAt: date,
    media: {
      type: [2, 5, 8].includes(i)
        ? "youtube"
        : i === 9 || i === 11
          ? "video"
          : "image",
      previewImage: s[2] ? { url: photo(s[2]), alt: s[0] } : undefined,
      ...([2, 5, 8].includes(i)
        ? {
            youtubeId: ["aqz-KE-bpKQ", "ScMzIvxBSi4", "ysz5S6PUM-U"][
              [2, 5, 8].indexOf(i)
            ],
          }
        : {}),
      ...(i === 9 || i === 11
        ? {
            video: {
              url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            },
          }
        : {}),
    },
    content: `<p>${s[3]} I have always believed that the best stories begin when we leave a little room for the unexpected. This was one of those days: no itinerary, just a notebook and the willingness to follow a quiet road.</p><h2>The beauty of taking your time</h2><p>There is a different kind of clarity that comes from stepping away. The landscape unfolds slowly, light settles over the hills, and for once there is nowhere else you need to be. I stopped trying to collect destinations and began collecting moments instead.</p><blockquote>“Not all those who wander are lost.” — J. R. R. Tolkien</blockquote><p>A conversation with a stranger. The smell of rain on warm stone. A small café opening its doors. These are the details that stay long after the photographs have faded.</p>${
      s[2]
        ? `<figure><img src="${photo(s[2])}" alt="${s[0]}"/><figcaption>A little moment worth remembering.</figcaption></figure>`
        : ""
    }<h2>A few things I’m taking home</h2><ul><li>Always leave space for a detour.</li><li>Listen more than you speak.</li><li>The small moments are the big ones.</li></ul><p>If you’re waiting for the perfect time to go, to start, or to try something new, consider this your gentle nudge. Take the first step. The rest of the road will meet you there.</p>${
      i === 8 || i === 9
        ? '<iframe src="https://www.youtube-nocookie.com/embed/ysz5S6PUM-U" title="A journey in motion" allowfullscreen></iframe>'
        : ""
    }`,
  }
})
