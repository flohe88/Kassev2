import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Article } from '../../types';
import { useDispatch } from 'react-redux';
import { addItem } from '../../store/cartSlice';
import { CategoryFilter } from './CategoryFilter';
import { Modal } from '../shared/Modal';
import { ArticleForm } from './ArticleForm';
import { PriceInputModal } from './PriceInputModal';
import { IoShirtOutline } from "react-icons/io5";
import { MdOutlineDiamond } from "react-icons/md";
import { MdOutlineHome } from "react-icons/md";
import { IconType } from 'react-icons';
import { MdDelete } from "react-icons/md";

const CATEGORY_ICONS: { [key: string]: IconType } = {
  'Mode': IoShirtOutline,
  'Deko': MdOutlineHome,
  'Accessoires': MdOutlineDiamond
};

export const ArticleList = () => {
  const dispatch = useDispatch();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | undefined>();
  const [selectedPriceArticle, setSelectedPriceArticle] = useState<Article | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteArticleId, setDeleteArticleId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState(false);

  useEffect(() => {
    fetchArticles();
    
    const channel = supabase
      .channel('articles')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'articles' },
          () => {
            fetchArticles();
          }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCategory, searchQuery]);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select('*, categories(*)')
        .order('name');

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Artikel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArticle = () => {
    setSelectedArticle(undefined);
    setIsFormOpen(true);
  };

  const handleArticleClick = (article: Article) => {
    if (article.price === null) {
      setSelectedPriceArticle(article);
    } else {
      dispatch(addItem(article));
    }
  };

  const handlePriceSave = (article: Article, price: number) => {
    dispatch(addItem({ ...article, price }));
  };

  const handleDeleteClick = (articleId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setDeleteArticleId(articleId);
    setShowDeleteConfirm(true);
    setDeletePassword('');
    setDeleteError(false);
  };

  const handleDeleteConfirm = async () => {
    if (deletePassword !== '123456') {
      setDeleteError(true);
      return;
    }

    if (!deleteArticleId) return;

    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', deleteArticleId);

      if (error) throw error;
      
      setShowDeleteConfirm(false);
      setDeleteArticleId(null);
      setDeletePassword('');
      // Artikel wird automatisch durch den Realtime-Listener aktualisiert
    } catch (error) {
      console.error('Fehler beim Löschen des Artikels:', error);
      alert('Fehler beim Löschen des Artikels');
    }
  };

  if (loading) return <div>Laden...</div>;

  return (
    <div>
      <div className="mb-4">
        <div className="flex gap-2 items-center mb-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Artikel suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <span className="absolute right-3 top-2.5">🔍</span>
          </div>
          <button
            onClick={handleAddArticle}
            className="px-3 py-2 border rounded hover:bg-gray-100"
          >
            +Neu
          </button>
        </div>

        <CategoryFilter
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => {
          const Icon = article.categories ? CATEGORY_ICONS[article.categories.name] : null;
          
          return (
            <div 
              key={article.id} 
              className="p-4 border rounded-lg shadow-sm hover:shadow-md cursor-pointer 
                       transition-shadow duration-200 bg-white relative"
              onClick={() => handleArticleClick(article)}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{article.name}</h3>
                {Icon && <Icon className="text-xl text-gray-500" />}
              </div>
              {article.categories && (
                <div className="text-gray-600 mb-2">{article.categories.name}</div>
              )}
              <div className="text-lg font-semibold text-blue-600">
                {article.price ? `${article.price.toFixed(2)} €` : 'Preis variabel'}
              </div>
              
              <button
                onClick={(e) => handleDeleteClick(article.id, e)}
                className="absolute bottom-2 right-2 p-2 text-red-600
                         hover:bg-red-50 rounded-full"
                title="Artikel löschen"
              >
                <MdDelete className="text-xl" />
              </button>
            </div>
          );
        })}
      </div>

      <PriceInputModal
        article={selectedPriceArticle!}
        isOpen={!!selectedPriceArticle}
        onClose={() => setSelectedPriceArticle(null)}
        onSave={handlePriceSave}
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Neuer Artikel"
      >
        <ArticleForm
          article={selectedArticle}
          onSave={() => {
            setIsFormOpen(false);
            fetchArticles();
          }}
          onCancel={() => setIsFormOpen(false)}
        />
      </Modal>

      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Artikel löschen"
      >
        <div className="space-y-4">
          <p>Bitte geben Sie das Passwort ein, um den Artikel zu löschen.</p>
          <input
            type="password"
            value={deletePassword}
            onChange={(e) => {
              setDeletePassword(e.target.value);
              setDeleteError(false);
            }}
            className={`w-full px-4 py-2 border rounded-lg ${
              deleteError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Passwort eingeben"
          />
          {deleteError && (
            <p className="text-red-500 text-sm">Falsches Passwort</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleDeleteConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Löschen
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 