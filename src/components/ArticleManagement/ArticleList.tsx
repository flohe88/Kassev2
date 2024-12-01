import { useEffect, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TouchBackend } from 'react-dnd-touch-backend';
import { supabase } from '../../lib/supabaseClient';
import { Article, ProductVariant } from '../../types';
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

interface DraggableArticleCardProps {
  article: Article;
  index: number;
  moveCard: (dragIndex: number, hoverIndex: number) => void;
  onArticleClick: (article: Article) => void;
  onDeleteClick: (articleId: string, event: React.MouseEvent) => void;
}

const DraggableArticleCard = ({ article, index, moveCard, onArticleClick, onDeleteClick }: DraggableArticleCardProps) => {
  const Icon = article.categories ? CATEGORY_ICONS[article.categories.name] : null;
  
  const [{ isDragging }, drag] = useDrag({
    type: 'article',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: 'article',
    hover: (item: { index: number }) => {
      if (item.index !== index) {
        moveCard(item.index, index);
        item.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="p-4 border rounded-lg shadow-sm hover:shadow-md cursor-move 
                 transition-shadow duration-200 bg-white relative"
      onClick={() => onArticleClick(article)}
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
        onClick={(e) => onDeleteClick(article.id, e)}
        className="absolute bottom-2 right-2 p-2 text-red-600
                 hover:bg-red-50 rounded-full"
        title="Artikel löschen"
      >
        <MdDelete className="text-xl" />
      </button>
    </div>
  );
};

// Funktion zur Erkennung des Gerätetyps
const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// Multi-Backend Setup
const DndProviderWithBackend = ({ children }: { children: React.ReactNode }) => {
  const backend = isMobile() ? TouchBackend : HTML5Backend;
  
  return (
    <DndProvider backend={backend}>
      {children}
    </DndProvider>
  );
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
  const [selectedVariantArticle, setSelectedVariantArticle] = useState<Article | null>(null);
  const [orderedArticles, setOrderedArticles] = useState<Article[]>([]);

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

  useEffect(() => {
    setOrderedArticles(articles);
  }, [articles]);

  const fetchArticles = async () => {
    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          categories(*),
          variants:product_variants(*)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (selectedCategory) {
        query = query.eq('category_id', selectedCategory);
      }

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setArticles(data || []);
      setOrderedArticles(data || []);
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

  const handleArticleClick = async (article: Article) => {
    if (article.variants && article.variants.length > 0) {
      setSelectedVariantArticle(article);
    } else if (article.price === null) {
      setSelectedPriceArticle(article);
    } else {
      dispatch(addItem(article));
    }
  };

  const handleVariantSelect = (article: Article, variant: ProductVariant) => {
    dispatch(addItem({
      ...article,
      name: `${article.name} - ${variant.name}`,
      price: variant.price
    }));
    setSelectedVariantArticle(null);
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

  const moveCard = async (dragIndex: number, hoverIndex: number) => {
    const newCards = [...orderedArticles];
    const dragCard = newCards[dragIndex];
    newCards.splice(dragIndex, 1);
    newCards.splice(hoverIndex, 0, dragCard);
    setOrderedArticles(newCards);

    try {
      // Aktualisiere die sort_order für alle Artikel
      const updates = newCards.map((article, index) => ({
        id: article.id,
        name: article.name,
        price: article.price,
        category_id: article.category_id,
        sort_order: index * 10
      }));

      const { error } = await supabase
        .from('articles')
        .upsert(updates, { 
          onConflict: 'id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Fehler beim Speichern der Reihenfolge:', error);
      // Bei einem Fehler die ursprüngliche Reihenfolge wiederherstellen
      setOrderedArticles([...articles]);
    }
  };

  if (loading) return <div>Laden...</div>;

  return (
    <DndProviderWithBackend>
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
          {orderedArticles.map((article, index) => (
            <DraggableArticleCard
              key={article.id}
              article={article}
              index={index}
              moveCard={moveCard}
              onArticleClick={handleArticleClick}
              onDeleteClick={handleDeleteClick}
            />
          ))}
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

        <Modal
          isOpen={!!selectedVariantArticle}
          onClose={() => setSelectedVariantArticle(null)}
          title="Variante auswählen"
        >
          <div className="space-y-4">
            {selectedVariantArticle?.variants?.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleVariantSelect(selectedVariantArticle, variant)}
                className="w-full p-4 text-left border rounded-lg hover:bg-gray-50 
                         transition-colors duration-150 space-y-1"
              >
                <div className="font-bold text-lg">{variant.name}</div>
                <div className="text-blue-600 font-semibold">
                  {variant.price.toFixed(2)} €
                </div>
              </button>
            ))}
          </div>
        </Modal>
      </div>
    </DndProviderWithBackend>
  );
}; 