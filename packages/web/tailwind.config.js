/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/javascripts/**/*.tsx'],
  theme: {
    extend: {
      zIndex: {
        'editor-content': 'var(--z-index-editor-content)',
        'editor-title-bar': 'var(--z-index-editor-title-bar)',
        'resizer-overlay': 'var(--z-index-resizer-overlay)',
        'component-view': 'var(--z-index-component-view)',
        'panel-resizer': 'var(--z-index-panel-resizer)',
        'dropdown-menu': 'var(--z-index-dropdown-menu)',
        'footer-bar': 'var(--z-index-footer-bar)',
        'footer-bar-item': 'var(--z-index-footer-bar-item)',
        'footer-bar-item-panel': 'var(--z-index-footer-bar-item-panel)',
        preferences: 'var(--z-index-preferences)',
        'purchase-flow': 'var(--z-index-purchase-flow)',
        'lock-screen': 'var(--z-index-lock-screen)',
        modal: 'var(--z-index-modal)',
      },
    },
    colors: {
      neutral: 'var(--sn-stylekit-neutral-color)',
      'neutral-contrast': 'var(--sn-stylekit-neutral-contrast-color)',
      transparent: 'transparent',
    },
  },
  plugins: [],
}
