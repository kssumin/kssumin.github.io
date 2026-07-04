import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeSlug from 'rehype-slug';
import rehypePrettyCode from 'rehype-pretty-code';
import rehypeReact from 'rehype-react';
import * as prod from 'react/jsx-runtime';
import { visit } from 'unist-util-visit';
import type { Root } from 'mdast';

function remarkRewritePostLinks() {
  return (tree: Root) => {
    visit(tree, 'link', (node) => {
      const match = /^\.\/([\w-]+)\.md$/.exec(node.url);
      if (match) {
        node.url = `/posts/${match[1]}/`;
      }
    });
  };
}

export async function MarkdownRenderer({ content }: { content: string }) {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRewritePostLinks)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, { theme: 'github-light' })
    .use(rehypeReact, {
      Fragment: prod.Fragment,
      jsx: prod.jsx,
      jsxs: prod.jsxs,
    })
    .process(content);

  return (
    <div className="max-w-none text-body [&_h2]:text-h2 [&_h2]:mt-s-8 [&_h2]:mb-s-5 [&_h3]:text-h3 [&_h3]:mt-s-7 [&_h3]:mb-s-4 [&_p]:mb-s-5 [&_pre]:rounded-md [&_pre]:p-s-5 [&_pre]:overflow-x-auto [&_pre]:my-s-6 [&_code]:text-code [&_ul]:list-disc [&_ul]:pl-s-5 [&_ul]:mb-s-5 [&_ol]:list-decimal [&_ol]:pl-s-5 [&_ol]:mb-s-5 [&_blockquote]:border-l-2 [&_blockquote]:border-ink-300 [&_blockquote]:pl-s-4 [&_blockquote]:text-ink-600 [&_blockquote]:mb-s-5 [&_table]:w-full [&_table]:mb-s-5 [&_th]:text-left [&_th]:border-b [&_th]:border-ink-300 [&_th]:pb-s-3 [&_td]:border-b [&_td]:border-ink-100 [&_td]:py-s-3 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-md [&_img]:my-s-6">
      {file.result}
    </div>
  );
}
