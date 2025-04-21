import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Update the mock to make it accessible
jest.mock('@radix-ui/react-dropdown-menu', () => ({
  Root: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-root">{children}</div>,
  Trigger: ({ children, ...props }: any) => (
    <button data-testid="dropdown-trigger" {...props}>
      {children}
    </button>
  ),
  Content: ({ children, ...props }: any) => (
    <div data-testid="dropdown-content" {...props}>
      {children}
    </div>
  ),
  Item: ({ children, onClick, ...props }: any) => (
    // Change div to button for accessibility
    <button 
      data-testid="dropdown-item" 
      onClick={onClick} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick?.(e);
        }
      }}
      role="menuitem"
      tabIndex={0}
      {...props}
    >
      {children}
    </button>
  ),
  Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-portal">{children}</div>,
}));

// Lalu import komponen setelah mocking
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../../../app/components/ui-profile/dropdown-menu';

describe('Dropdown Menu Components', () => {
  it('renders DropdownMenu with trigger and content', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open Menu</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Item 1</DropdownMenuItem>
          <DropdownMenuItem>Item 2</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-root')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-trigger')).toBeInTheDocument();
    expect(screen.getByText('Open Menu')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-portal')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-content')).toBeInTheDocument();
    expect(screen.getAllByTestId('dropdown-item')).toHaveLength(2);
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('applies custom className to dropdown components', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger className="trigger-class">Open</DropdownMenuTrigger>
        <DropdownMenuContent className="content-class">
          <DropdownMenuItem className="item-class">Test Item</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );

    expect(screen.getByTestId('dropdown-trigger')).toHaveClass('trigger-class');
    expect(screen.getByTestId('dropdown-content')).toHaveClass('content-class');
    expect(screen.getByTestId('dropdown-item')).toHaveClass('item-class');
  });

  it('calls onClick when dropdown item is clicked', () => {
    const handleClick = jest.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleClick}>Click Me</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
    
    // Klik item dropdown
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});