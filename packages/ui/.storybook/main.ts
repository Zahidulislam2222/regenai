import type {StorybookConfig} from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|mdx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: {name: '@storybook/react-vite', options: {}},
  typescript: {check: false, reactDocgen: 'react-docgen-typescript'},
  docs: {autodocs: 'tag'},
  core: {disableTelemetry: true},
};

export default config;
