import type {StorybookConfig} from '@storybook/react-vite';
import tailwindcss from '@tailwindcss/vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {name: '@storybook/react-vite', options: {}},
  async viteFinal(config) {
    return {
      ...config,
      plugins: [...(config.plugins ?? []), tailwindcss()],
    };
  },
  typescript: {reactDocgen: 'react-docgen-typescript'},
  core: {disableTelemetry: true},
};

export default config;
