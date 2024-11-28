import { useSelector, useDispatch } from 'react-redux';
import { removeItem } from '../../store/cartSlice';
import type { RootState } from '../../store';

export const ShoppingCart = () => {
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border">
      <h2 className="text-2xl font-bold mb-4">Warenkorb</h2>
      
      {items.length === 0 ? (
        <p className="text-gray-500 text-center py-8">Der Warenkorb ist leer</p>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div 
              key={item.cartId} 
              className="flex justify-between items-center border-b pb-3 last:border-b-0"
            >
              <div>
                <h3 className="font-bold text-lg">{item.name}</h3>
                <p className="text-blue-600">{item.price!.toFixed(2)} €</p>
              </div>
              <button
                className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-lg"
                onClick={() => dispatch(removeItem(item.cartId))}
              >
                ✕
              </button>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold">Gesamt:</span>
              <span className="text-xl font-bold text-blue-600">{total.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 