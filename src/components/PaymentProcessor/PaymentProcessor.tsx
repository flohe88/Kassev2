import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../store/cartSlice';
import { supabase } from '../../lib/supabaseClient';
import type { RootState } from '../../store';
import { PriceInputModal } from '../ArticleManagement/PriceInputModal';

const PRESET_AMOUNTS = [5, 10, 20, 25, 30, 50];

export const PaymentProcessor = () => {
  const dispatch = useDispatch();
  const { items, total } = useSelector((state: RootState) => state.cart);
  const [displayValue, setDisplayValue] = useState('0');
  const [processing, setProcessing] = useState(false);
  const [showNumpad, setShowNumpad] = useState(false);

  const receivedAmount = parseFloat(displayValue.replace(',', '.')) || 0;
  const change = receivedAmount - total;
  const canComplete = receivedAmount >= total && items.length > 0;

  const handlePresetAmount = (amount: number) => {
    setDisplayValue(amount.toFixed(2));
  };

  const handleNumberClick = (num: string) => {
    if (displayValue === '0') {
      setDisplayValue(num);
    } else {
      setDisplayValue(displayValue + num);
    }
  };

  const handleCommaClick = () => {
    if (!displayValue.includes(',')) {
      setDisplayValue(displayValue + ',');
    }
  };

  const handleClear = () => {
    setDisplayValue('0');
  };

  const handleDelete = () => {
    if (displayValue.length > 1) {
      setDisplayValue(displayValue.slice(0, -1));
    } else {
      setDisplayValue('0');
    }
  };

  const handleCompleteSale = async () => {
    if (!canComplete) return;
    
    setProcessing(true);
    try {
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert([{
          total,
          payment_received: receivedAmount,
          change_given: change,
          payment_method: 'cash'
        }])
        .select()
        .single();

      if (saleError) throw saleError;

      const saleItems = items.map(item => ({
        sale_id: sale.id,
        article_id: item.id,
        quantity: 1,
        price_at_sale: item.price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      await supabase
        .channel('custom-all-channel')
        .send({
          type: 'broadcast',
          event: 'sale-completed',
          payload: { sale_id: sale.id }
        });

      dispatch(clearCart());
      setDisplayValue('0');
      setShowNumpad(false);
      
      window.location.reload();
      
    } catch (error) {
      console.error('Fehler beim Speichern des Verkaufs:', error);
      alert('Fehler beim Speichern des Verkaufs');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mt-4">
      <h2 className="text-2xl font-bold mb-4">Zahlung</h2>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {PRESET_AMOUNTS.map(amount => (
          <button
            key={amount}
            onClick={() => handlePresetAmount(amount)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50 
                     transition-colors duration-150 font-medium"
          >
            {amount.toFixed(2)} €
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-2">
          <span className="text-lg font-medium">Erhaltener Betrag:</span>
          <button
            onClick={() => setShowNumpad(true)}
            className={`w-full py-4 px-6 border-2 rounded-lg 
                     transition-all duration-200 text-2xl font-bold 
                     flex items-center justify-between
                     ${receivedAmount === 0 
                       ? 'border-red-500 hover:border-red-600 hover:bg-red-50/50' 
                       : 'border-dashed border-gray-300 hover:border-blue-500 hover:bg-blue-50/50'
                     }`}
          >
            <span className={`text-base ${receivedAmount === 0 ? 'text-red-500' : 'text-gray-400'}`}>
              Klicken zum Eingeben
            </span>
            <span className={receivedAmount === 0 ? 'text-red-500' : 'text-blue-600'}>
              {displayValue} €
            </span>
          </button>
        </div>

        <div className="flex justify-between items-center border-t pt-4">
          <span className="text-lg font-bold">Rückgeld:</span>
          <span className={`text-lg font-bold ${change >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            {change.toFixed(2)} €
          </span>
        </div>

        <button
          id="complete-sale-button"
          onClick={handleCompleteSale}
          disabled={!canComplete || processing}
          className={`w-full p-3 rounded-lg font-medium
                  ${canComplete && !processing
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  } transition-colors duration-150`}
        >
          {processing ? 'Verarbeite...' : 'Verkauf abschließen'}
        </button>
      </div>

      <PriceInputModal
        isOpen={showNumpad}
        onClose={() => setShowNumpad(false)}
        onSave={(_, price) => {
          setDisplayValue(price.toFixed(2).replace('.', ','));
          setShowNumpad(false);
        }}
        article={{ id: '', name: '', price: null, category_id: null, created_at: '' }}
        title="Betrag eingeben"
      />
    </div>
  );
}; 