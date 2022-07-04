module.exports = {
  mainSidebar: {
    Developers: [
      {
        'Self Hosting': [
          'self-hosting/getting-started',
          'self-hosting/infrastructure-overview',
          'self-hosting/docker',
          'self-hosting/configuration-options',
          'self-hosting/legacy-migration',
          'self-hosting/https-support',
          'self-hosting/updating',
          'self-hosting/subscriptions',
          'self-hosting/file-uploads',
        ],
      },
      {
        API: [
          'specification/encryption',
          'specification/sync',
          'specification/auth',
        ],
      },
      {
        Extensions: [
          'extensions/intro',
          {
            type: 'category',
            label: 'Editors',
            items: [
              'extensions/editors',
              'extensions/editors-getting-started',
              'extensions/editorkit',
              'extensions/stylekit',
            ],
          },
          'extensions/local-setup',
          'extensions/themes',
          'extensions/actions',
          'extensions/publishing',
        ],
      },
    ],
    Editors: [
      'usage/bold-editor',
      'usage/markdown-basic',
      'usage/markdown-math',
      'usage/markdown-pro',
      'usage/secure-spreadsheets',
      'usage/task-editor',
    ],
  },
  secondSidebar: {
    Troubleshooting: [
      'troubleshooting/reset-apps',
      'troubleshooting/import-backups',
    ],
  },
};
