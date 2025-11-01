

import React, { useState } from 'react';
import type { Product } from '../../types';
import { Button } from '../../components/Button';
import { PencilSquareIcon, TrashIcon } from '../../components/Icons';
import { ConfirmationModal } from '../../components/ConfirmationModal';
import { useToast } from '../../contexts/ToastContext';

interface AdminProductsProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: number) => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({ products, onEditProduct, onDeleteProduct }) => {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { addToast } = useToast();

  const handleConfirmDelete = () => {
    if (productToDelete) {
      setIsDeleting(true);
      // Simulate API call
      setTimeout(() => {
        onDeleteProduct(productToDelete.id);
        addToast(`Товар "${productToDelete.name}" был удален.`, 'success');
        setProductToDelete(null);
        setIsDeleting(false);
      }, 500);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif text-brand-brown">Управление товарами</h1>
        <Button disabled>Добавить товар</Button>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3">Товар</th>
                <th scope="col" className="px-6 py-3">Категория</th>
                <th scope="col" className="px-6 py-3">Цена</th>
                <th scope="col" className="px-6 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map(product => (
                <tr key={product.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <img src={product.imageUrls[0]} alt={product.name} className="w-12 h-12 object-cover rounded-md" />
                    <span>{product.name}</span>
                  </td>
                  <td className="px-6 py-4">{product.category}</td>
                  <td className="px-6 py-4">{product.price.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => onEditProduct(product)}>
                            <PencilSquareIcon className="w-4 h-4 mr-2" />
                            Редактировать
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50" onClick={() => setProductToDelete(product)}>
                            <TrashIcon className="w-4 h-4" />
                        </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Подтвердите удаление"
        message={
          <>
            Вы уверены, что хотите удалить товар "<strong>{productToDelete?.name}</strong>"? Это действие необратимо.
          </>
        }
        isLoading={isDeleting}
      />
    </div>
  );
};