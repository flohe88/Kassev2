import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Article, Category } from '../../types';
import { MdAdd } from 'react-icons/md';

interface ArticleFormProps {
  article?: Article;
  onSave: () => void;
  onCancel: () => void;
}

export const ArticleForm = ({ article, onSave, onCancel }: ArticleFormProps) => {
  const [name, setName] = useState(article?.name || '');
  const [price, setPrice] = useState(article?.price?.toString() || '');
  const [categoryId, setCategoryId] = useState(article?.category_id || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

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
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategoryName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setCategories([...categories, data]);
      setCategoryId(data.id);
      setNewCategoryName('');
      setShowNewCategory(false);
    } catch (error) {
      console.error('Fehler beim Erstellen der Kategorie:', error);
      alert('Fehler beim Erstellen der Kategorie');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const articleData = {
        name,
        price: price ? parseFloat(price) : null,
        category_id: categoryId || null
      };

      if (article?.id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', article.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('articles')
          .insert([articleData]);

        if (error) throw error;
      }

      onSave();
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
      alert('Fehler beim Speichern des Artikels');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Preis (€) - Optional
        </label>
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          step="0.01"
          min="0"
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Kategorie</label>
        <div className="flex gap-2">
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-lg"
          >
            <option value="">Keine Kategorie</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setShowNewCategory(true)}
            className="px-3 py-2 border rounded-lg hover:bg-gray-50"
            title="Neue Kategorie"
          >
            <MdAdd className="text-xl" />
          </button>
        </div>
      </div>

      {showNewCategory && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Neue Kategorie
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg"
              placeholder="Kategoriename"
            />
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Hinzufügen
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300"
        >
          {saving ? 'Speichert...' : article ? 'Aktualisieren' : 'Erstellen'}
        </button>
      </div>
    </form>
  );
}; 