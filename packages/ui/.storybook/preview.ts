import type {Preview} from '@storybook/react';
import '../src/styles/preview.css';

const preview: Preview = {
  parameters: {
    actions: {argTypesRegex: '^on[A-Z].*'},
    controls: {
      matchers: {color: /(background|color)$/i, date: /Date$/i},
    },
    a11y: {
      // WCAG 2.2 AA
      config: {rules: [{id: 'color-contrast', enabled: true}]},
      options: {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag22aa']}},
    },
    backgrounds: {
      default: 'bone',
      values: [
        {name: 'bone', value: '#F8F6F1'},
        {name: 'card', value: '#FFFFFF'},
        {name: 'dark', value: '#0F1419'},
      ],
    },
    options: {
      storySort: {
        order: ['Docs', 'Foundations', ['Colors', 'Typography'], 'Components', ['Button', '*']],
      },
    },
  },
};

export default preview;
