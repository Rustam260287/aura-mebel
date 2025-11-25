
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { useCart } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

// --- Mocks ---
jest.mock('../contexts/CartContext', () => ({
  useCart: jest.fn(),
}));

jest.mock('../contexts/WishlistContext', () => ({
  useWishlist: jest.fn(),
}));

const mockRouterPush = jest.fn();
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

// --- Test Suite ---
describe('Header Component', () => {
  let mockUseCart: jest.Mock;
  let mockUseWishlist: jest.Mock;

  beforeEach(() => {
    mockUseCart = useCart as jest.Mock;
    mockUseWishlist = useWishlist as jest.Mock;
    mockRouterPush.mockClear();

    mockUseCart.mockReturnValue({
      cartCount: 0,
      toggleCart: jest.fn(),
    });
    mockUseWishlist.mockReturnValue({
      wishlistCount: 0,
    });
  });

  it('renders logo and navigation links', () => {
    render(<Header />);
    
    expect(screen.getByText('Aura')).toBeInTheDocument();
    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('Блог')).toBeInTheDocument();
    expect(screen.getByText('О нас')).toBeInTheDocument();
  });

  it('displays correct item counts in cart and wishlist', () => {
    mockUseCart.mockReturnValue({ cartCount: 3, toggleCart: jest.fn() });
    mockUseWishlist.mockReturnValue({ wishlistCount: 5 });

    render(<Header />);
    
    expect(screen.getByLabelText(/Корзина, 3 товаров/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    expect(screen.getByLabelText(/Избранное, 5 товаров/i)).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls toggleCart when cart button is clicked', async () => {
    const mockToggleCart = jest.fn();
    mockUseCart.mockReturnValue({ cartCount: 0, toggleCart: mockToggleCart });

    render(<Header />);
    
    const cartButton = screen.getByLabelText(/Корзина, 0 товаров/i);
    await userEvent.click(cartButton);
    
    expect(mockToggleCart).toHaveBeenCalledTimes(1);
  });

  it('navigates to search results page on search submit', async () => {
    render(<Header />);

    const user = userEvent.setup();
    const searchIcon = screen.getByLabelText(/Поиск/i);
    await user.click(searchIcon);

    const searchInput = screen.getByPlaceholderText('Поиск...');
    expect(searchInput).toBeInTheDocument();

    const searchQuery = 'деревянный стул';
    await user.type(searchInput, searchQuery);
    
    fireEvent.submit(searchInput);

    const expectedUrl = `/products?search=${encodeURIComponent(searchQuery)}`;
    expect(mockRouterPush).toHaveBeenCalledWith(expectedUrl);
  });
});
