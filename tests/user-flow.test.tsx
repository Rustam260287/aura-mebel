
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/pages/index';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { Product } from '@/types';

// --- Mocks ---

const mockRouterPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
    isFallback: false,
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => <img {...props} />,
}));

// --- Mock Data ---
const mockProducts: Product[] = [
  {
    id: 'prod-1',
    name: 'Тестовый диван "Интеграция"',
    price: 50000,
    category: 'Тестовая мебель',
    imageUrls: ['/test-sofa.jpg'],
    rating: 5,
    reviews: [],
    description: 'A very testable sofa.',
  },
  {
    id: 'prod-2',
    name: 'Тестовый стул',
    price: 15000,
    category: 'Тестовая мебель',
    imageUrls: ['/test-chair.jpg'],
    rating: 4,
    reviews: [],
    description: 'A nice chair.',
  },
];

const renderHomePage = () => {
  return render(
    <ToastProvider>
      <WishlistProvider>
        <CartProvider>
          <HomePage allProducts={mockProducts} />
        </CartProvider>
      </WishlistProvider>
    </ToastProvider>
  );
};

describe('User Shopping Flow Integration Test', () => {
  
  beforeEach(() => {
    mockRouterPush.mockClear();
    const mockIntersectionObserver = jest.fn();
    mockIntersectionObserver.mockReturnValue({
      observe: () => null,
      unobserve: () => null,
      disconnect: () => null
    });
    window.IntersectionObserver = mockIntersectionObserver;
  });

  it('should allow a user to add a product to the cart and see it in the cart sidebar', async () => {
    renderHomePage();
    const user = userEvent.setup();

    const productCard = screen.getByText('Тестовый диван "Интеграция"').closest('div');
    expect(productCard).toBeInTheDocument();

    const quickViewButton = screen.getAllByRole('button', { name: /Быстрый просмотр/i })[0];
    await user.click(quickViewButton);

    const addToCartButton = await screen.findByRole('button', { name: /Добавить в корзину/i });
    await user.click(addToCartButton);

    const cartCounter = await screen.findByLabelText(/Корзина, 1 товар/i);
    expect(cartCounter).toBeInTheDocument();

    await user.click(cartCounter);
    
    await waitFor(() => {
      const sidebar = screen.getByLabelText(/Корзина покупок/i);
      expect(sidebar).toHaveTextContent('Тестовый диван "Интеграция"');
      expect(sidebar).toHaveTextContent('50 000 ₽');
    });
  });
});
