import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import ApartmentCard from "../components/ApartmentCard";
import favoriteService from "../services/favoriteService";
import { useFavorites } from "../context/FavoritesContext";
import { Heart } from "lucide-react";

export default function Favorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isFavorite } = useFavorites();

  // Prikazujemo samo one koji su i dalje u wishlisti (globalno stanje),
  // tako da se kartica odmah skloni kad se srce isprazni.
  const visibleFavorites = favorites.filter((a) => isFavorite(a.id));

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const data = await favoriteService.getAll();
      setFavorites(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div style={styles.loading}>
          Loading favorites...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          

          <div>
            <h1 style={styles.title}>
              My Favorites
            </h1>

            <p style={styles.subtitle}>
              {visibleFavorites.length} saved apartments
            </p>
          </div>
        </div>

        {visibleFavorites.length === 0 ? (
          <div style={styles.empty}>
            <Heart
              size={60}
              color="#d1d5db"
            />

            <h2>No favorite apartments yet</h2>

            <p>
              Click the heart icon on any apartment to save it here.
            </p>
          </div>
        ) : (
          <div style={styles.grid}>
            {visibleFavorites.map((apartment, i) => (
              <ApartmentCard
                key={apartment.id}
                apartment={apartment}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

const styles = {
  container: {
    maxWidth: 1280,
    margin: "40px auto",
    padding: "0 32px"
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: 16,
    marginBottom: 35
  },

  title: {
    margin: 0,
    color: "#0F4C5C",
    fontSize: 32,
    fontWeight: 700
  },

  subtitle: {
    marginTop: 6,
    color: "#666"
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))",
    gap: 24
  },

  empty: {
    height: "55vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    color: "#666",
    textAlign: "center"
  },

  loading: {
    height: "70vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    fontSize: 22,
    color: "#0F4C5C"
  }
};