import type {Meta, StoryObj} from '@storybook/react';
import {Input} from './Input';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = {args: {placeholder: 'email@example.com'}};
export const WithValue: Story = {args: {defaultValue: 'zahidul@example.com'}};
export const Disabled: Story = {args: {disabled: true, placeholder: 'Disabled'}};
export const Error: Story = {args: {error: true, defaultValue: 'invalid-email', 'aria-describedby': 'err'} as never};
