import { ClientLayout } from '../components/ClientLayout';
import { FavoritesList } from '../components/FavoritesList';

export default function ClientFavoritesPage() {
  return (
    <ClientLayout title="Mes déménageurs favoris">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <FavoritesList />
        </div>
      </div>
    </ClientLayout>
  );
}
