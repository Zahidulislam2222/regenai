import type {Meta, StoryObj} from '@storybook/react';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from './Card';
import {Button} from './Button';
import {Badge} from './Badge';

const meta: Meta<typeof Card> = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
};
export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
  render: () => (
    <Card className="w-96">
      <CardHeader>
        <CardTitle>Recovery Tracker</CardTitle>
        <CardDescription>HRV + SpO₂ + sleep, paired via BLE</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-[var(--text-secondary)]">
          Clinical-grade recovery metrics delivered to your wrist. Review trends over 90 days.
        </p>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="primary">Add to cart</Button>
        <Button variant="outline">Details</Button>
      </CardFooter>
    </Card>
  ),
};

export const ProductCard: Story = {
  render: () => (
    <Card className="w-80">
      <div className="aspect-square w-full bg-[var(--color-bone-muted)]" role="img" aria-label="Product image placeholder" />
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>Percussion Massage Gun</CardTitle>
          <Badge variant="sage">In stock</Badge>
        </div>
        <CardDescription>Clinical tier · 3 heads · FDA class II</CardDescription>
      </CardHeader>
      <CardFooter className="justify-between">
        <span className="text-lg font-semibold">$229</span>
        <Button size="sm">Add</Button>
      </CardFooter>
    </Card>
  ),
};
