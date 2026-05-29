import { NextResponse } from 'next/server';

export const revalidate = 3600;

const SOURCE_URL = 'https://reactorprompt.vercel.app/gallery-data.json';
const BASE_URL = 'https://reactorprompt.vercel.app';

function fullUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return `${BASE_URL}${path}`;
  return `${BASE_URL}/${path}`;
}

function normalizePost(post) {
  const caption = (post.caption || '').trim();
  const prompt = (post.prompt || '').trim();
  const title = caption.split('\n').map((line) => line.trim()).find(Boolean) || `Reactor Prompt ${post.id}`;
  const rawImages = Array.isArray(post.images) ? post.images : [];
  const images = rawImages.map(fullUrl).filter(Boolean);
  const tags = Array.isArray(post.tags) ? post.tags.map(String).map((tag) => tag.trim()).filter(Boolean) : [];
  const finalTags = Array.from(new Set(['reactor', ...tags, images.length > 1 ? 'multi-image' : null].filter(Boolean)));

  return {
    id: `reactor-${post.id}`,
    title,
    caption,
    images,
    thumbnail: fullUrl(post.thumbnail || rawImages[0]),
    prompt,
    tags: finalTags,
    source: 'Reactor Prompt',
    threadsUrl: post.threadsUrl || '',
    date: post.date_display || (post.date || '').slice(0, 10),
    reactorId: post.id,
    shortcode: post.shortcode || post.source_thread_id || '',
    promptShortcode: post.promptShortcode || ''
  };
}

export async function GET() {
  try {
    const response = await fetch(SOURCE_URL, { next: { revalidate: 3600 } });
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch Reactor data' }, { status: 502 });
    }

    const data = await response.json();
    const sourcePosts = Array.isArray(data.posts) ? data.posts : [];
    const posts = sourcePosts
      .filter((post) => (post.prompt || '').trim().length > 0)
      .map(normalizePost);

    return NextResponse.json({
      meta: {
        sourceUrl: SOURCE_URL,
        importMode: 'prompt-only-live-fetch',
        totalSourcePosts: sourcePosts.length,
        importedPosts: posts.length,
        skippedWithoutPrompt: sourcePosts.length - posts.length,
        totalImages: posts.reduce((sum, post) => sum + post.images.length, 0),
        cachedForSeconds: 3600
      },
      posts
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
