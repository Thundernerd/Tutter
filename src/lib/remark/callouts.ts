/**
 * `:::tip[Optional title]` … `:::` → <aside class="callout callout-tip">.
 * Requires `remark-directive` to run first.
 */
import type { Paragraph, Root, Text } from 'mdast';
import type { ContainerDirective, LeafDirective, TextDirective } from 'mdast-util-directive';
import { visit, SKIP } from 'unist-util-visit';

export const CALLOUT_KINDS = ['tip', 'note', 'info', 'warning', 'danger'] as const;
const KINDS = new Set<string>(CALLOUT_KINDS);

const DEFAULT_TITLES: Record<string, string> = {
  tip: 'Tip',
  note: 'Note',
  info: 'Info',
  warning: 'Warning',
  danger: 'Danger',
};

type Directive = ContainerDirective | LeafDirective | TextDirective;

export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (node.type !== 'containerDirective' && node.type !== 'leafDirective' && node.type !== 'textDirective') {
        return;
      }
      const directive = node as Directive;

      if (directive.type === 'containerDirective' && KINDS.has(directive.name)) {
        const first = directive.children[0];
        let title = DEFAULT_TITLES[directive.name]!;
        let children = directive.children;
        if (first?.type === 'paragraph' && first.data && 'directiveLabel' in first.data && first.data.directiveLabel) {
          title = first.children.map((c) => ('value' in c ? c.value : '')).join('') || title;
          children = directive.children.slice(1);
        }
        const titleNode: Paragraph = {
          type: 'paragraph',
          data: { hName: 'p', hProperties: { className: ['callout-title'] } },
          children: [{ type: 'text', value: title }],
        };
        directive.children = [titleNode, ...children];
        directive.data = {
          hName: 'aside',
          hProperties: { className: ['callout', `callout-${directive.name}`] },
        };
        return;
      }

      // Unknown directives: restore the source text so prose like "Note:this"
      // or "12:30:00" is not silently swallowed by remark-directive.
      if (!parent || index === undefined) return;
      const label = directive.children
        .map((c) => ('value' in c ? String(c.value) : ''))
        .join('');
      const prefix = directive.type === 'textDirective' ? ':' : directive.type === 'leafDirective' ? '::' : ':::';
      const text: Text = { type: 'text', value: `${prefix}${directive.name}${label ? `[${label}]` : ''}` };
      if (directive.type === 'textDirective') {
        parent.children.splice(index, 1, text as never);
      } else {
        parent.children.splice(index, 1, { type: 'paragraph', children: [text] } as never);
      }
      return [SKIP, index];
    });
  };
}
