import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Sale } from '../../types';
import { MdDelete } from "react-icons/md";

interface SalesStats {
  totalSales: number;
  totalRevenue: number;
  averageTransaction: number;
  categoryStats: {
    name: string;
    count: number;
    revenue: number;
  }[];
}

type TimeFilter = 'today' | 'yesterday' | 'week' | 'month';

export const SalesAnalytics = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [stats, setStats] = useState<SalesStats>({
    totalSales: 0,
    totalRevenue: 0,
    averageTransaction: 0,
    categoryStats: []
  });
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('today');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [startDate] = useState(new Date());
  const [endDate] = useState(new Date());

  useEffect(() => {
    fetchSales();
  }, [timeFilter]);

  const getDateRange = (filter: TimeFilter) => {
    const now = new Date();
    const start = new Date();
    
    switch (filter) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case 'week':
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        break;
    }

    return { start, end: filter === 'yesterday' ? now : new Date() };
  };

  const fetchSales = async () => {
    try {
      const { start, end } = getDateRange(timeFilter);

      let query = supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            article:articles (
              name,
              categories (
                name
              )
            )
          )
        `)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setSales(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Fehler beim Laden der Verkäufe:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (salesData: Sale[]) => {
    const totalRevenue = salesData.reduce((sum, sale) => sum + sale.total, 0);
    
    // Kategoriestatistik berechnen
    const categoryMap = new Map<string, { count: number; revenue: number }>();
    
    salesData.forEach(sale => {
      sale.sale_items?.forEach(item => {
        const categoryName = item.article?.categories?.name || 'Ohne Kategorie';
        const current = categoryMap.get(categoryName) || { count: 0, revenue: 0 };
        
        categoryMap.set(categoryName, {
          count: current.count + 1,
          revenue: current.revenue + item.price_at_sale
        });
      });
    });

    const categoryStats = Array.from(categoryMap.entries()).map(([name, stats]) => ({
      name,
      count: stats.count,
      revenue: stats.revenue
    })).sort((a, b) => b.revenue - a.revenue);

    setStats({
      totalSales: salesData.length,
      totalRevenue,
      averageTransaction: salesData.length ? totalRevenue / salesData.length : 0,
      categoryStats
    });
  };

  const exportToCSV = () => {
    const headers = ['Datum', 'Uhrzeit', 'Artikel (Kategorie)', 'Betrag', 'Rückgeld'];
    const csvData = sales.map(sale => {
      const articleInfo = sale.sale_items?.map(item => 
        `${item.article?.name}${item.article?.categories?.name ? ` (${item.article.categories.name})` : ''}`
      ).join(', ');

      return [
        formatDate(sale.created_at),
        formatTime(sale.created_at),
        articleInfo,
        sale.total.toFixed(2) + ' €',
        sale.change_given.toFixed(2) + ' €'
      ];
    });

    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `verkäufe_${startDate.toISOString()}_${endDate.toISOString()}.csv`;
    link.click();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDeleteSaleItem = async (saleId: string, saleItemId: string, itemPrice: number) => {
    if (window.confirm('Möchten Sie diesen Artikel wirklich aus dem Verkauf löschen?')) {
      try {
        // Hole zuerst den aktuellen Verkauf mit allen Items
        const { data: currentSale, error: fetchError } = await supabase
          .from('sales')
          .select(`
            *,
            sale_items (*)
          `)
          .eq('id', saleId)
          .single();

        if (fetchError) throw fetchError;

        // Lösche den Verkaufsartikel
        const { error: deleteError } = await supabase
          .from('sale_items')
          .delete()
          .eq('id', saleItemId);

        if (deleteError) throw deleteError;

        // Wenn dies der letzte Artikel war, lösche den gesamten Verkauf
        if (currentSale.sale_items.length === 1) {
          const { error: deleteSaleError } = await supabase
            .from('sales')
            .delete()
            .eq('id', saleId);

          if (deleteSaleError) throw deleteSaleError;
        } else {
          // Ansonsten aktualisiere nur den Gesamtbetrag
          const newTotal = currentSale.total - itemPrice;
          const { error: updateError } = await supabase
            .from('sales')
            .update({ total: newTotal })
            .eq('id', saleId);

          if (updateError) throw updateError;
        }

        // Aktualisiere die Anzeige
        fetchSales();
      } catch (error) {
        console.error('Fehler beim Löschen des Artikels:', error);
        alert('Fehler beim Löschen des Artikels');
      }
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '123456') {
      setIsUnlocked(true);
      setError(false);
    } else {
      setError(true);
      setPassword('');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="bg-pos-secondary p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-pos-text mb-4">Verkaufsanalyse</h2>
        <form onSubmit={handleUnlock} className="max-w-sm mx-auto space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              placeholder="Passwort eingeben"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 
                       ${error ? 'border-red-500' : 'border-gray-300'}`}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">Falsches Passwort</p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Entsperren
          </button>
        </form>
      </div>
    );
  }

  if (loading) return <div className="text-pos-muted text-center py-8">Lade Verkaufsdaten...</div>;

  return (
    <div className="bg-pos-secondary p-6 rounded-lg shadow-lg">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-pos-text">Verkaufsanalyse</h2>
          <button
            onClick={() => setIsUnlocked(false)}
            className="text-red-600 hover:text-red-700"
          >
            Sperren
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="flex gap-2">
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg ${
                timeFilter === 'today'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 border'
              }`}
            >
              Heute
            </button>
            <button
              onClick={() => setTimeFilter('yesterday')}
              className={`px-4 py-2 rounded-lg ${
                timeFilter === 'yesterday'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 border'
              }`}
            >
              Gestern
            </button>
            <button
              onClick={() => setTimeFilter('week')}
              className={`px-4 py-2 rounded-lg ${
                timeFilter === 'week'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 border'
              }`}
            >
              Woche
            </button>
            <button
              onClick={() => setTimeFilter('month')}
              className={`px-4 py-2 rounded-lg ${
                timeFilter === 'month'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-50 border'
              }`}
            >
              Monat
            </button>
          </div>
          <button
            onClick={exportToCSV}
            className="w-full sm:w-auto px-4 py-2 bg-pos-accent text-pos-text rounded-lg 
                     hover:bg-pos-accent/80 transition-colors duration-200 
                     flex items-center justify-center gap-2"
          >
            <span>📊</span>
            <span>CSV Export</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-pos-primary p-4 rounded-lg border border-pos-accent/10">
          <h3 className="text-pos-muted text-sm font-medium mb-1">Anzahl Verkäufe</h3>
          <p className="text-2xl font-bold text-pos-text">{stats.totalSales}</p>
        </div>
        <div className="bg-pos-primary p-4 rounded-lg border border-pos-accent/10">
          <h3 className="text-pos-muted text-sm font-medium mb-1">Gesamtumsatz</h3>
          <p className="text-2xl font-bold text-pos-accent">{stats.totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="bg-pos-primary p-4 rounded-lg border border-pos-accent/10">
          <h3 className="text-pos-muted text-sm font-medium mb-1">Durchschnitt/Verkauf</h3>
          <p className="text-2xl font-bold text-pos-success">{stats.averageTransaction.toFixed(2)} €</p>
        </div>
      </div>

      <div className="bg-pos-primary p-4 rounded-lg border border-pos-accent/10 mb-8">
        <h3 className="text-xl font-bold mb-4">Kategoriestatistik</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-2 px-4">Kategorie</th>
                <th className="text-right py-2 px-4">Anzahl Artikel</th>
                <th className="text-right py-2 px-4">Umsatz</th>
                <th className="text-right py-2 px-4">Anteil am Gesamtumsatz</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.categoryStats.map((category) => (
                <tr key={category.name} className="hover:bg-gray-50">
                  <td className="py-2 px-4">{category.name}</td>
                  <td className="text-right py-2 px-4">{category.count}</td>
                  <td className="text-right py-2 px-4 text-pos-accent">
                    {category.revenue.toFixed(2)} €
                  </td>
                  <td className="text-right py-2 px-4 text-pos-muted">
                    {((category.revenue / stats.totalRevenue) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-pos-primary">
            <tr>
              <th className="text-left py-3 px-4 rounded-tl-lg">Datum</th>
              <th className="text-left py-3 px-4">Uhrzeit</th>
              <th className="text-left py-3 px-4">Artikel (Kategorie)</th>
              <th className="text-right py-3 px-4">Betrag</th>
              <th className="text-right py-3 px-4 rounded-tr-lg">Rückgeld</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pos-accent/10">
            {sales.map((sale) => (
              <tr key={sale.id} className="hover:bg-pos-primary/50 transition-colors duration-150">
                <td className="py-3 px-4">
                  {formatDate(sale.created_at)}
                </td>
                <td className="py-3 px-4">
                  {formatTime(sale.created_at)}
                </td>
                <td className="py-3 px-4">
                  {sale.sale_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1 group">
                      <div className="flex-1">
                        <span className="text-pos-text">
                          {item.article?.name}
                        </span>
                        {item.article?.categories?.name && (
                          <span className="text-pos-accent ml-2">
                            ({item.article.categories.name})
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteSaleItem(sale.id, item.id, item.price_at_sale)}
                        className="ml-2 text-red-600 hover:bg-red-50 p-1.5 rounded-full
                                 transition-all duration-200"
                        title="Artikel löschen"
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  ))}
                </td>
                <td className="text-right py-3 px-4 text-pos-accent">
                  {sale.total.toFixed(2)} €
                </td>
                <td className="text-right py-3 px-4 text-pos-success">
                  {sale.change_given.toFixed(2)} €
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}; 