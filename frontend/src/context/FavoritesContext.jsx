import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import favoriteService from '../services/favoriteService';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      setLoaded(false);
      return;
    }

    favoriteService.getIds()
      .then((ids) => setFavoriteIds(new Set(ids.map(Number))))
      .catch((err) => console.error(err))
      .finally(() => setLoaded(true));
  }, [user]);

  const isFavorite = useCallback(
    (apartmentId) => favoriteIds.has(Number(apartmentId)),
    [favoriteIds]
  );

  // Vraca novo stanje (true = sad je omiljen, false = uklonjen)
  const toggleFavorite = useCallback(async (apartmentId) => {
    const id = Number(apartmentId);
    const wasFavorite = favoriteIds.has(id);

    // Optimisticki azuriramo UI odmah, pa tek onda zovemo API
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      wasFavorite ? next.delete(id) : next.add(id);
      return next;
    });

    try {
      if (wasFavorite) {
        await favoriteService.remove(id);
      } else {
        await favoriteService.add(id);
      }
      return !wasFavorite;
    } catch (err) {
      // Ako API pozicija ne uspije, vracamo staro stanje nazad
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        wasFavorite ? next.add(id) : next.delete(id);
        return next;
      });
      throw err;
    }
  }, [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isFavorite, toggleFavorite, loaded }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export const useFavorites = () => {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites mora biti koristen unutar FavoritesProvider-a');
  return ctx;
};
