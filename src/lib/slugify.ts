export const slugify = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};

export const getPersonUrl = (id: string, name: string) => {
  // Use only the first name for a much shorter, cleaner URL
  const firstName = name.split(' ')[0];
  const nameSlug = slugify(firstName);
  const shortId = id.substring(0, 8);
  const url = `/person/${shortId}-${nameSlug}`;
  console.log(`[slugify] Generated short URL for ${name}:`, url);
  return url;
};

export const parsePersonIdFromSlug = (slug: string | undefined) => {
  if (!slug) return null;
  // Extract the short ID (first 8 chars)
  const shortId = slug.split('-')[0];
  console.log(`[slugify] Parsed short ID from slug "${slug}":`, shortId);
  return shortId;
};