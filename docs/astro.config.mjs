// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  redirects: {
    "/": "/guides/example",
  },
	integrations: [
		starlight({
			title: 'sheetlog',
			social: {
				github: 'https://github.com/withastro/starlight',
      },
      // components: {
        // SiteTitle: "./src/components/SiteTitle.astro",
        // TwoColumnContent: "./src/components/TwoColumnContent.astro",
      // },
      customCss: ["./src/styles/global.css"],
			sidebar: [
				{
					label: 'Guides',
					items: [
						// Each item here is one entry in the navigation menu.
						{ label: 'Example Guide!', slug: 'guides/example' },
					],
				},
				{
					label: 'Reference',
					autogenerate: { directory: 'reference' },
				},
			],
    }),
    tailwind({ applyBaseStyles: true }),
	],
});
