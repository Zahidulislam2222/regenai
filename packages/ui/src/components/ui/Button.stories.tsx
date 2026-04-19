import type {Meta, StoryObj} from '@storybook/react';
import {Button} from './Button';
import {Heart, ShoppingCart} from './Icon';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {control: 'select', options: ['primary', 'accent', 'sage', 'outline', 'ghost', 'link', 'danger']},
    size: {control: 'select', options: ['sm', 'md', 'lg', 'icon']},
  },
};
export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {args: {children: 'Buy now'}};
export const Accent: Story = {args: {variant: 'accent', children: 'Start quiz'}};
export const Sage: Story = {args: {variant: 'sage', children: 'View protocol'}};
export const Outline: Story = {args: {variant: 'outline', children: 'Learn more'}};
export const Ghost: Story = {args: {variant: 'ghost', children: 'Cancel'}};
export const Link: Story = {args: {variant: 'link', children: 'Read the study'}};
export const Danger: Story = {args: {variant: 'danger', children: 'Delete account'}};
export const Loading: Story = {args: {loading: true, children: 'Processing…'}};
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <ShoppingCart className="h-4 w-4" /> Add to cart
      </>
    ),
  },
};
export const IconOnly: Story = {
  args: {
    size: 'icon',
    'aria-label': 'Favorite',
    children: <Heart className="h-4 w-4" />,
  } as never,
};
export const FullWidth: Story = {args: {fullWidth: true, children: 'Continue to checkout'}};
