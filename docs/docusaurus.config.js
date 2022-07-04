const math = require('remark-math');
const katex = require('rehype-katex');

module.exports = {
  title: 'Standard Notes Documentation',
  tagline: 'Extend Your Notes App',
  url: 'https://docs.standardnotes.com',
  baseUrl: '/',
  favicon: 'img/favicon.png',
  organizationName: 'standardnotes',
  projectName: 'docs',
  themeConfig: {
    algolia: {
      apiKey: 'f2899fea0369aeea336963e48a0e46dc',
      indexName: 'standardnotes',
    },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
    hideableSidebar: true,
    image: 'img/logo.png',
    navbar: {
      hideOnScroll: true,
      title: 'Standard Notes',
      logo: {
        alt: 'Standard Notes Logo',
        src: 'img/logo.png',
      },
      items: [
        {
          label: 'Developers',
          position: 'left',
          items: [
            {
              to: '/self-hosting/getting-started',
              label: 'Self-Host a Sync Server',
              position: 'left',
            },
            {
              to: '/specification/encryption',
              label: 'Client Encryption API',
              position: 'left',
            },
            {
              to: '/specification/sync',
              label: 'Server API',
              position: 'left',
            },
            {
              to: '/extensions/intro',
              label: 'Build an Extension',
              position: 'left',
            },
            {
              to: '/extensions/editors',
              label: 'Build an Editor',
              position: 'left',
            },
          ],
        },
        {
          href: 'https://app.standardnotes.com',
          label: 'Encrypted Notes App',
          position: 'right',
        },
        {
          href: 'https://standardnotes.com',
          label: 'Standard Notes Website',
          position: 'right',
        },
        {
          href: 'https://standardnotes.com/help',
          label: 'Help',
          position: 'right',
        },
        {
          href: 'https://blog.standardnotes.com',
          label: 'Blog',
          position: 'right',
        },
        {
          href: 'https://github.com/standardnotes',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Developers',
          items: [
            {
              label: 'Self-Host a Sync Server',
              to: '/self-hosting/getting-started',
            },
            {
              label: 'Build an Extension',
              to: '/extensions/intro',
            },
            {
              label: 'Encryption Specification',
              to: '/specification/encryption',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Join our Slack',
              href: 'https://standardnotes.com/slack',
            },
            {
              label: 'Community Forum',
              href: 'https://forum.standardnotes.org',
            },
            {
              label: 'Listed Blogging Platform',
              href: 'https://listed.to',
            },
          ],
        },
        {
          title: 'Support',
          items: [
            {
              label: 'Help & Contact',
              href: 'https://standardnotes.com/help',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/standardnotes',
            },
            {
              label: 'Reddit',
              href: 'https://reddit.com/r/standardnotes',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} <a href="https://standardnotes.com">Standard Notes</a>`,
    },
  },
  stylesheets: [
    {
      href: '/katex/v0.12.0/katex.min.css',
      type: 'text/css',
      integrity:
        'sha384-AfEj0r4/OFrOo5t7NnNe46zW/tFgW6x/bCJG8FqQCEo3+Aro6EYUG4+cU+KJWu/X',
      crossorigin: 'anonymous',
    },
  ],
  scripts: [
    {
      src: `/matomo.js`,
      async: true,
      defer: true,
    },
  ],
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/standardnotes/docs/edit/main/',
          routeBasePath: '/',
          remarkPlugins: [math],
          rehypePlugins: [katex],
          showLastUpdateTime: true,
        },
        theme: {
          customCss: require.resolve('./src/css/custom.scss'),
        },
      },
    ],
  ],
  plugins: [
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          {
            to: '/extensions/intro',
            from: [
              '/extensions/introduction',
              '/extensions/components',
              '/extensions',
              '/extensions/intro-to-extensions',
            ],
          },
          {
            to: '/usage/filesafe/aws',
            from: ['/filesafe/aws'],
          },
          {
            to: '/self-hosting/getting-started',
            from: [
              '/self-hosting',
              '/self-hosting/getting-started-with-self-hosting',
            ],
          },
          {
            to: '/specification/encryption',
            from: ['/specification/'],
          },
        ],
      },
    ],
    'docusaurus-plugin-sass',
  ],
};
