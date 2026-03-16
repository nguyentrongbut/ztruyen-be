export function extractMentions(content: string): string[] {

  const regex = /@([a-zA-Z0-9_]+)/g;

  const matches = content.match(regex);

  if (!matches) return [];

  return matches.map((m) => m.replace('@', ''));
}