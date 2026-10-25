import { defineHastPlugin } from 'satteri';

/** Opens off-site links in Markdown content in a new tab. */
export const hastExternalLinks = defineHastPlugin({
	name: 'hast-external-links',
	element: {
		filter: ['a'],
		visit(node, context) {
			const href = node.properties.href;
			if (typeof href === 'string' && /^https?:\/\//.test(href)) {
				context.setProperty(node, 'target', '_blank');
				context.setProperty(node, 'rel', ['noopener', 'noreferrer']);
			}
		},
	},
});
