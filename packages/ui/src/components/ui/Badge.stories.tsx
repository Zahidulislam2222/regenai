import type {Meta, StoryObj} from '@storybook/react';
import {Badge} from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'Components/Badge',
  component: Badge,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Badge>;

export const Primary: Story = {args: {children: 'FDA class II', variant: 'primary'}};
export const Accent: Story = {args: {children: 'New', variant: 'accent'}};
export const Sage: Story = {args: {children: 'Clinician-reviewed', variant: 'sage'}};
export const Outline: Story = {args: {children: 'Research-referenced', variant: 'outline'}};
export const Success: Story = {args: {children: 'In stock', variant: 'success'}};
export const Warning: Story = {args: {children: 'Contraindications', variant: 'warning'}};
export const ErrorState: Story = {args: {children: 'Out of stock', variant: 'error'}};
export const Info: Story = {args: {children: 'Evidence level A', variant: 'info'}};
