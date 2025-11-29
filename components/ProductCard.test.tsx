
import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductCard } from './ProductCard';
import { WishlistProvider, useWishlist } from '../contexts/WishlistContext';
import { ToastProvider, useToast } from '../contexts/ToastContext';

// --- Mocks ---
jest.mock('../contexts/WishlistContext', () => ({
  ...jest.requireActual('../contexts/WishlistContext'), // Keep actual provider
  useWishlist: jest.fn(),
}));

jest.mock('../contexts/ToastContext', () => ({
    ...jest.requireActual('../contexts/ToastContext'),
    useToast: jest.fn(),
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // Filter out 'fill' and other Next.js specific props that <img> doesn't support
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { fill, ...rest } = props;
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} />;
  },
}));

const mockProduct = {
  id: 'test-product-1',
  name: 'Элегантный диван "Классика"',
  price: 75000,
  originalPrice: 100000, // For discount testing
  category: 'Мягкая мебель',
  imageUrls: ['/test-image.jpg'],
  rating: 4,
  reviews: [],
  description: 'A beautiful sofa.',
  details: {
      dimensions: '200x100x90',
      material: 'Velvet',
      care: 'Dry clean'
  }
};

// A helper component to wrap ProductCard with necessary providers
const renderWithProviders = (component: React.ReactElement) => {
    return render(
        <ToastProvider>
            <WishlistProvider>
                {component}
            </WishlistProvider>
        </ToastProvider>
    );
}

describe('ProductCard Component', () => {
    const mockAddToWishlist = jest.fn();
    const mockRemoveFromWishlist = jest.fn();
    const mockAddToast = jest.fn();
    const mockOnProductSelect = jest.fn();
    const mockOnQuickView = jest.fn();

    beforeEach(() => {
        (useWishlist as jest.Mock).mockReturnValue({
            isInWishlist: () => false,
            addToWishlist: mockAddToWishlist,
            removeFromWishlist: mockRemoveFromWishlist,
        });
        (useToast as jest.Mock).mockReturnValue({
            addToast: mockAddToast,
        });
        // Clear mock history before each test
        jest.clearAllMocks();
    });

    it('renders product information correctly', () => {
        renderWithProviders(
            <ProductCard product={mockProduct} onProductSelect={mockOnProductSelect} />
        );

        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
        expect(screen.getByText(mockProduct.category)).toBeInTheDocument();
        expect(screen.getByText('75 000 ₽')).toBeInTheDocument(); // Price with formatting
    });

    it('displays a discount badge if originalPrice exists', () => {
        renderWithProviders(
            <ProductCard product={mockProduct} onProductSelect={mockOnProductSelect} />
        );
        // Discount is ((100000 - 75000) / 100000) * 100 = 25%
        expect(screen.getByText('-25%')).toBeInTheDocument();
    });

    it('calls onProductSelect when the card is clicked', async () => {
        renderWithProviders(
            <ProductCard product={mockProduct} onProductSelect={mockOnProductSelect} />
        );
        
        await userEvent.click(screen.getByText(mockProduct.name));
        expect(mockOnProductSelect).toHaveBeenCalledWith(mockProduct.id);
    });

    it('calls addToWishlist when the wishlist button is clicked and item is not in wishlist', async () => {
        renderWithProviders(
            <ProductCard product={mockProduct} onProductSelect={mockOnProductSelect} />
        );

        const wishlistButton = screen.getByLabelText(/Добавить в избранное/i);
        await userEvent.click(wishlistButton);

        expect(mockAddToWishlist).toHaveBeenCalledWith(mockProduct.id);
        expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('добавлен в избранное'), 'success');
    });

    it('calls removeFromWishlist when the wishlist button is clicked and item is already in wishlist', async () => {
        // Override mock for this specific test
        (useWishlist as jest.Mock).mockReturnValue({
            isInWishlist: () => true,
            addToWishlist: mockAddToWishlist,
            removeFromWishlist: mockRemoveFromWishlist,
        });

        renderWithProviders(
            <ProductCard product={mockProduct} onProductSelect={mockOnProductSelect} />
        );

        const wishlistButton = screen.getByLabelText(/Удалить из избранного/i);
        await userEvent.click(wishlistButton);

        expect(mockRemoveFromWishlist).toHaveBeenCalledWith(mockProduct.id);
        expect(mockAddToast).toHaveBeenCalledWith(expect.stringContaining('удален из избранного'), 'info');
    });

    it('calls onQuickView when the "Быстрый просмотр" button is clicked', async () => {
        renderWithProviders(
            <ProductCard product={mockProduct} onProductSelect={mockOnProductSelect} onQuickView={mockOnQuickView} />
        );
        
        // The button is initially hidden and appears on hover/focus.
        // We'll click it directly since simulating hover is complex.
        const quickViewButton = screen.getByRole('button', { name: /Быстрый просмотр/i });
        await userEvent.click(quickViewButton);

        expect(mockOnQuickView).toHaveBeenCalledWith(mockProduct);
        // Ensure the main card click handler was NOT called
        expect(mockOnProductSelect).not.toHaveBeenCalled();
    });
});
