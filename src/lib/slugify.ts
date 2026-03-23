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
  return `/person/${id}-${slugify(name)}`;
};

export const parsePersonId = (slug: string | undefined) => {
  if (!slug) return null;
  // Extract UUID (first 36 chars)
  return slug.substring(0, 36);
};