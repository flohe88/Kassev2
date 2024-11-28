import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Category } from '../../types';
import { IoShirtOutline } from "react-icons/io5"; // Mode
import { MdOutlineDiamond } from "react-icons/md"; // Accessoires
import { MdOutlineHome } from "react-icons/md"; // Deko
import { BiStore } from "react-icons/bi"; // Alle
import { IconType } from 'react-icons';

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

// Icon-Map für Kategorien mit korrigierten Icons
const CATEGORY_ICONS: { [key: string]: IconType } = {
  'Mode': IoShirtOutline,        // T-Shirt Icon
  'Deko': MdOutlineHome,         // Haus/Deko Icon
  'Accessoires': MdOutlineDiamond // Diamant/Schmuck Icon
};

export const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (error) throw error;
        setCategories(data || []);
      } catch (error) {
        console.error('Fehler beim Laden der Kategorien:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) return <div>Lade Kategorien...</div>;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
          selectedCategory === null
            ? 'bg-gray-200'
            : 'bg-white hover:bg-gray-50'
        }`}
        onClick={() => onCategoryChange(null)}
      >
        <BiStore className="text-xl" />
        <span>Alle</span>
      </button>
      {categories.map((category) => {
        const Icon = CATEGORY_ICONS[category.name];
        return (
          <button
            key={category.id}
            className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
              selectedCategory === category.id
                ? 'bg-gray-200'
                : 'bg-white hover:bg-gray-50'
            }`}
            onClick={() => onCategoryChange(category.id)}
          >
            {Icon && <Icon className="text-xl" />}
            <span>{category.name}</span>
          </button>
        )
      })}
    </div>
  );
}; 