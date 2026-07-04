import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import { visit } from 'unist-util-visit';
import { toString as hastToString } from 'hast-util-to-string';
import type { Element, Root } from 'hast';

export interface TocHeading {
  depth: 2 | 3;
  text: string;
  id: string;
}

const HEADING_TAGS = new Set(['h2', 'h3']);

// Runs the SAME unified pipeline as MarkdownRenderer up through `rehypeSlug`
// (remarkParse -> remarkGfm -> remarkRehype -> rehypeSlug), then walks the
// resulting hast tree collecting h2/h3 nodes. This guarantees the `id`s
// extracted here are byte-for-byte identical to the ids rehype-slug assigns
// when MarkdownRenderer renders the actual post body — there is no separate
// slug implementation to drift out of sync.
export async function extractHeadings(content: string): Promise<TocHeading[]> {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug);

  const mdastTree = processor.parse(content);
  const hastTree = (await processor.run(mdastTree)) as Root;

  const headings: TocHeading[] = [];

  visit(hastTree, 'element', (node: Element) => {
    if (!HEADING_TAGS.has(node.tagName)) return;

    const id = typeof node.properties?.id === 'string' ? node.properties.id : '';
    const text = hastToString(node).trim();
    if (!id || !text) return;

    headings.push({
      depth: node.tagName === 'h2' ? 2 : 3,
      text,
      id,
    });
  });

  return headings;
}
