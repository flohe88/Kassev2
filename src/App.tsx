import { Provider } from 'react-redux';
import { store } from './store';
import { ArticleList } from './components/ArticleManagement/ArticleList';
import { ShoppingCart } from './components/ShoppingCart/ShoppingCart';
import { PaymentProcessor } from './components/PaymentProcessor/PaymentProcessor';
import { SalesAnalytics } from './components/SalesAnalytics/SalesAnalytics';
import { LoginScreen } from './components/Auth/LoginScreen';
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem('pos-auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  if (!isAuthenticated) {
    return <LoginScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-pos-primary text-pos-text pb-16 lg:pb-0">
      <header className="bg-pos-secondary shadow-lg border-b border-pos-accent/20">
        <div className="max-w-7xl mx-auto py-4 px-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">POS System</h1>
            <div className="flex items-center space-x-4">
              <span className="text-pos-muted">Kasse 1</span>
              <span className="bg-pos-success/20 text-pos-success px-3 py-1 rounded-full text-sm">
                Online
              </span>
              <button
                onClick={() => {
                  localStorage.removeItem('pos-auth');
                  setIsAuthenticated(false);
                }}
                className="text-red-600 hover:text-red-700"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="lg:w-2/3 space-y-6">
            <ArticleList />
          </div>
          
          <div className="lg:w-1/3 space-y-6">
            <div className="sticky top-6">
              <ShoppingCart />
              <PaymentProcessor />
            </div>
          </div>
        </div>
        
        <div className="mt-8">
          <SalesAnalytics />
        </div>
      </main>

      <MobileMenu />
    </div>
  );
}

// Separate Komponente für die mobile Menüleiste
function MobileMenu() {
  const { total, items } = useSelector((state: RootState) => state.cart);
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Wenn der "Verkauf abschließen" Button sichtbar ist, blenden wir die Leiste aus
        setIsVisible(!entry.isIntersecting);
      },
      {
        threshold: 0.1 // Reagiert, wenn 10% des Elements sichtbar sind
      }
    );

    const completeButton = document.getElementById('complete-sale-button');
    if (completeButton) {
      observer.observe(completeButton);
    }

    return () => {
      if (completeButton) {
        observer.unobserve(completeButton);
      }
    };
  }, []);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 lg:hidden">
      <div className="flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Warenkorb:</span>
          <span className="text-lg font-bold text-blue-600">{total.toFixed(2)} €</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white px-2 py-1 rounded-full text-sm">
            {items.length}
          </div>
          <button 
            onClick={() => {
              const cart = document.getElementById('shopping-cart');
              cart?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Zur Kasse
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrapper-Komponente mit Provider
function AppWrapper() {
  return (
    <Provider store={store}>
      <App />
    </Provider>
  );
}

export default AppWrapper; 