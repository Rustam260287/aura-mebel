
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders correctly with default props (primary variant)', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('bg-brand-brown text-white');
  });

  it('renders outline variant correctly', () => {
    render(<Button variant="outline">Outline Button</Button>);
    const button = screen.getByRole('button', { name: /outline button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('border border-brand-brown/50 text-brand-brown');
  });

  it('renders ghost variant correctly', () => {
    render(<Button variant="ghost">Ghost Button</Button>);
    const button = screen.getByRole('button', { name: /ghost button/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('text-brand-charcoal hover:bg-brand-cream-dark');
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    
    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole('button', { name: /disabled/i });
    expect(button).toBeDisabled();
  });
});
