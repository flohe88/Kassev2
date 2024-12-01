import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Article, Category, ProductVariant } from '../../types';
import { MdAdd, MdDelete } from 'react-icons/md';

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
  const [variants, setVariants] = useState<ProductVariant[]>(article?.variants || []);

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

  const handleAddVariant = () => {
    setVariants([...variants, { name: '', price: 0 }]);
  };

  const handleRemoveVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleVariantChange = (index: number, field: 'name' | 'price', value: string) => {
    const newVariants = [...variants];
    if (field === 'price') {
      newVariants[index][field] = parseFloat(value) || 0;
    } else {
      newVariants[index][field] = value;
    }
    setVariants(newVariants);
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

      let articleId = article?.id;

      if (article?.id) {
        const { error } = await supabase
          .from('articles')
          .update(articleData)
          .eq('id', article.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('articles')
          .insert([articleData])
          .select()
          .single();

        if (error) throw error;
        articleId = data.id;
      }

      if (articleId) {
        const { error: deleteError } = await supabase
          .from('product_variants')
          .delete()
          .eq('article_id', articleId);

        if (deleteError) throw deleteError;

        if (variants.length > 0) {
          const variantsData = variants.map(variant => ({
            article_id: articleId,
            name: variant.name,
            price: variant.price
          }));

          const { error: variantsError } = await supabase
            .from('product_variants')
            .insert(variantsData);

          if (variantsError) throw variantsError;
        }
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

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">Produktvarianten</label>
          <button
            type="button"
            onClick={handleAddVariant}
            className="px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1"
          >
            <MdAdd /> Variante hinzufügen
          </button>
        </div>
        
        {variants.map((variant, index) => (
          <div key={index} className="flex gap-2 items-start p-4 border rounded-lg bg-gray-50">
            <div className="flex-1">
              <input
                type="text"
                value={variant.name}
                onChange={(e) => handleVariantChange(index, 'name', e.target.value)}
                placeholder="Variantenname"
                className="w-full px-3 py-2 border rounded-lg mb-2"
                required
              />
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={variant.price}
                  onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                  step="0.01"
                  min="0"
                  placeholder="Preis"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <span className="text-gray-500">€</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRemoveVariant(index)}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Variante entfernen"
            >
              <MdDelete size={20} />
            </button>
          </div>
        ))}
      </div>

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