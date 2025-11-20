
// components/admin/AdminOrders.tsx
import React, { useState } from 'react';
import type { Order } from '../../types';
import { Button } from '../Button';
import { CheckCircleIcon, XMarkIcon, ClockIcon } from '../Icons'; // Предполагаю наличие иконок, если нет - заменю текстом

interface AdminOrdersProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => Promise<void>;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, onUpdateStatus }) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingId(orderId);
    try {
      await onUpdateStatus(orderId, newStatus);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-semibold">Новый</span>;
      case 'processing': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-semibold">В обработке</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-semibold">Выполнен</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-semibold">Отменен</span>;
      default: return status;
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-serif text-brand-brown mb-8">Управление заказами</h1>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
              <tr>
                <th className="px-6 py-3">ID / Дата</th>
                <th className="px-6 py-3">Клиент</th>
                <th className="px-6 py-3">Состав заказа</th>
                <th className="px-6 py-3">Сумма</th>
                <th className="px-6 py-3">Статус</th>
                <th className="px-6 py-3 text-center">Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} className="bg-white border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">#{order.id.slice(0, 8)}</div>
                    <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{order.customer.name}</div>
                    <div className="text-xs text-gray-500">{order.customer.phone}</div>
                    <div className="text-xs text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside">
                        {order.items.map((item, idx) => (
                            <li key={idx} className="truncate max-w-xs text-xs">
                                {item.quantity}x {item.name}
                            </li>
                        ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 font-semibold">{order.total.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-6 py-4">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                        {order.status === 'new' && (
                             <Button size="sm" variant="outline" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, 'processing')}>
                                В обработку
                             </Button>
                        )}
                        {order.status === 'processing' && (
                             <Button size="sm" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, 'completed')}>
                                Завершить
                             </Button>
                        )}
                         {(order.status === 'new' || order.status === 'processing') && (
                             <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" disabled={updatingId === order.id} onClick={() => handleStatusChange(order.id, 'cancelled')}>
                                Отменить
                             </Button>
                        )}
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                  <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                          Заказов пока нет.
                      </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
