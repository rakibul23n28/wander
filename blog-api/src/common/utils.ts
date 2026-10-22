import sanitizeHtml from 'sanitize-html';

export function slugify(input: string): string {
  return (input ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function readingTime(content: string): number {
  const words = (content ?? '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function excerptFromHtml(html: string, maxLength = 160): string {
  const stripped = (html ?? '').replace(/<[^>]+>/g, ' ');
  const plain = stripped.replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  if (plain.length <= maxLength) return plain;
  const cut = plain.slice(0, maxLength).lastIndexOf(' ');
  return `${plain.slice(0, cut > 0 ? cut : maxLength).trim()}…`;
}

export function sanitizeHtmlContent(raw: string): string {
  return sanitizeHtml(raw ?? '', {
    allowedTags: [
      'p', 'h2', 'h3', 'h4', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'blockquote', 'pre', 'code', 'hr', 'br', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'rel', 'target'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      iframe: ['src', 'allowfullscreen', 'allow', 'title'],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: '_blank',
        },
      }),
      img: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          loading: 'lazy',
        },
      }),
      iframe: (tagName, attribs) => ({
        tagName,
        attribs: {
          ...attribs,
          src: attribs.src && /https:\/\/www\.youtube(-nocookie)?\.com\/embed\//.test(attribs.src) ? attribs.src.replace('youtube.com/embed/', 'youtube-nocookie.com/embed/') : '',
          allowfullscreen: 'true',
          allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        },
      }),
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['http', 'https'],
      a: ['http', 'https', 'mailto'],
      iframe: ['https'],
    },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com'],
    disallowedTagsMode: 'discard',
  });
}

export async function visitorHash(input: string, salt: string, day: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(`${input}:${salt}:${day}`));
  return Array.from(new Uint8Array(hashBuffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function parseYouTubeId(value: string): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtu.be')) return url.pathname.split('/').filter(Boolean)[0] ?? null;
    if (url.hostname.includes('youtube.com')) {
      if (url.searchParams.get('v')) return url.searchParams.get('v');
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts[0] === 'embed') return pathParts[1] ?? null;
      if (['shorts', 'live', 'watch'].includes(pathParts[0])) return pathParts[1] ?? null;
    }
  } catch {
    return null;
  }
  return null;
}
