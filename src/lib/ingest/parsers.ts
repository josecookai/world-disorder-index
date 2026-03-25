function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function extractXmlTag(block: string, tagName: string): string | undefined {
  const match = block.match(new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)</${tagName}>`, "i"));
  return match ? stripTags(decodeEntities(match[1].trim())) : undefined;
}

export function parseSimpleRssItems(xml: string): Array<Record<string, string>> {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];

  return blocks.map((block) => ({
    title: extractXmlTag(block, "title") ?? "",
    link: extractXmlTag(block, "link") ?? "",
    pubDate: extractXmlTag(block, "pubDate") ?? "",
    description: extractXmlTag(block, "description") ?? "",
  }));
}
