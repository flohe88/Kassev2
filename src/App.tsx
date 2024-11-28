import { Provider } from 'react-redux';
import { store } from './store';
import { ArticleList } from './components/ArticleManagement/ArticleList';
import { ShoppingCart } from './components/ShoppingCart/ShoppingCart';
import { PaymentProcessor } from './components/PaymentProcessor/PaymentProcessor';
import { SalesAnalytics } from './components/SalesAnalytics/SalesAnalytics';
import { LoginScreen } from './components/Auth/LoginScreen';
import { useState, useEffect } from 'react';

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
    <Provider store={store}>
      <div className="min-h-screen bg-pos-primary text-pos-text">
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
            {/* Linke Seite - Artikelliste */}
            <div className="lg:w-2/3 space-y-6">
              <ArticleList />
            </div>
            
            {/* Rechte Seite - Warenkorb und Zahlung */}
            <div className="lg:w-1/3 space-y-6">
              <div className="sticky top-6">
                <ShoppingCart />
                <PaymentProcessor />
              </div>
            </div>
          </div>
          
          {/* Analytics am unteren Rand */}
          <div className="mt-8">
            <SalesAnalytics />
          </div>
        </main>
      </div>
    </Provider>
  );
}

export default App; 