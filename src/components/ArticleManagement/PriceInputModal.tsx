import { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Article } from '../../types';

interface PriceInputModalProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
  onSave: (article: Article, price: number) => void;
  title?: string;
}

export const PriceInputModal = ({ article, isOpen, onClose, onSave, title = "Preis eingeben" }: PriceInputModalProps) => {
  const [displayValue, setDisplayValue] = useState('0');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(displayValue.replace(',', '.'));
    if (numPrice > 0) {
      onSave(article, numPrice);
      onClose();
      setDisplayValue('0');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="border rounded-lg p-3 bg-gray-50">
          <div className="text-right text-2xl font-bold">
            {displayValue} €
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Erste Reihe */}
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('7')}
          >
            7
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('8')}
          >
            8
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('9')}
          >
            9
          </button>

          {/* Zweite Reihe */}
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('4')}
          >
            4
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('5')}
          >
            5
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('6')}
          >
            6
          </button>

          {/* Dritte Reihe */}
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('1')}
          >
            1
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('2')}
          >
            2
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('3')}
          >
            3
          </button>

          {/* Vierte Reihe */}
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={() => handleNumberClick('0')}
          >
            0
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50"
            onClick={handleCommaClick}
          >
            ,
          </button>
          <button
            className="p-4 text-xl font-bold border rounded-lg hover:bg-gray-50 text-red-600"
            onClick={handleDelete}
          >
            ←
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleClear}
            className="p-3 border rounded-lg hover:bg-gray-50 font-medium"
          >
            Löschen
          </button>
          <button
            onClick={handleSubmit}
            className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Bestätigen
          </button>
        </div>
      </div>
    </Modal>
  );
}; 