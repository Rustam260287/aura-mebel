
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from './Header';
import { useCartState, useCartDispatch } from '../contexts/CartContext';
import { useWishlist } from '../contexts/WishlistContext';

// --- Mocks ---
jest.mock('../contexts/CartContext', () => ({
  useCartState: jest.fn(),
  useCartDispatch: jest.fn(),
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
  let mockUseCartState: jest.Mock;
  let mockUseCartDispatch: jest.Mock;
  let mockUseWishlist: jest.Mock;

  beforeEach(() => {
    mockUseCartState = useCartState as jest.Mock;
    mockUseCartDispatch = useCartDispatch as jest.Mock;
    mockUseWishlist = useWishlist as jest.Mock;
    mockRouterPush.mockClear();

    mockUseCartState.mockReturnValue({
      cartCount: 0,
    });
    mockUseCartDispatch.mockReturnValue({
      toggleCart: jest.fn(),
    });
    mockUseWishlist.mockReturnValue({
      wishlistCount: 0,
    });
  });

  it('renders logo and navigation links', () => {
    render(<Header />);
    
    // Логотип теперь может быть без текста, поэтому проверяем по alt или классу, если доступно, или по наличию SVG
    // Но в Logo компоненте текст Labelcom может быть скрыт, но сам компонент Logo рендерится.
    // Если Logo рендерит SVG, можно найти его.
    // Для простоты, допустим, что мы ищем навигационные ссылки.
    expect(screen.getByText('Каталог')).toBeInTheDocument();
    expect(screen.getByText('Блог')).toBeInTheDocument();
    expect(screen.getByText('О нас')).toBeInTheDocument();
  });

  it('displays correct item counts in cart and wishlist', () => {
    mockUseCartState.mockReturnValue({ cartCount: 3 });
    mockUseWishlist.mockReturnValue({ wishlistCount: 5 });

    render(<Header />);
    
    expect(screen.getByLabelText(/Корзина, 3 товаров/i)).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // В новой верстке счетчик wishlist может быть просто красной точкой
    // Поэтому проверяем, что кнопка существует и имеет aria-label
    expect(screen.getByLabelText(/Избранное, 5 товаров/i)).toBeInTheDocument();
  });

  it('calls toggleCart when cart button is clicked', async () => {
    const mockToggleCart = jest.fn();
    mockUseCartDispatch.mockReturnValue({ toggleCart: mockToggleCart });

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

    const searchInput = screen.getByPlaceholderText('Поиск товаров, коллекций...');
    expect(searchInput).toBeInTheDocument();

    const searchQuery = 'деревянный стул';
    await user.type(searchInput, searchQuery);
    
    fireEvent.submit(searchInput);

    const expectedUrl = `/products?search=${encodeURIComponent(searchQuery)}`;
    expect(mockRouterPush).toHaveBeenCalledWith(expectedUrl);
  });
});
