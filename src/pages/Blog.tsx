import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface Article {
  id: string;
  titre: string;
  contenu: string;
  mot_cle: string;
  ville: string;
  type_article: string;
  slug: string;
  created_at: string;
}

function getReadingTime(content: string): number {
  const words = content.replace(/<[^>]*>/g, '').split(/\s+/).length;
  return Math.ceil(words / 200);
}

function getExcerpt(content: string, length = 160): string {
  const cleaned = content
    .replace(/```html?/g, '')
    .replace(/```/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return cleaned.substring(0, length).trim() + '...';
}

function cleanTitle(title: string): string {
  return title
    .replace(/```html?/g, '')
    .replace(/```/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

const TYPE_COLORS: Record<string, string> = {
  Guide: 'bg-blue-100 text-blue-700',
  Comparatif: 'bg-purple-100 text-purple-700',
  Local: 'bg-green-100 text-green-700',
  Prix: 'bg-orange-100 text-orange-700',
  Checklist: 'bg-yellow-100 text-yellow-700',
  FAQ: 'bg-pink-100 text-pink-700',
};

export default function Blog() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    document.title = 'Blog Déménagement — Conseils & Guides | TrouveTonDéménageur';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Guides, conseils et comparatifs pour réussir votre déménagement en France. Trouvez les meilleurs déménageurs professionnels sur TrouveTonDéménageur.fr');
    } else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = 'Guides, conseils et comparatifs pour réussir votre déménagement en France.';
      document.head.appendChild(m);
    }

    fetchArticles();
  }, []);

  async function fetchArticles() {
    const { data, error } = await supabase
      .from('articles')
      .select('id, titre, contenu, mot_cle, ville, type_article, slug, created_at')
      .order('created_at', { ascending: false });

    if (!error && data) setArticles(data);
    setLoading(false);
  }

  const types = ['Tous', ...Array.from(new Set(articles.map(a => a.type_article).filter(Boolean)))];

  const filtered = articles.filter(a => {
    const matchSearch = search === '' ||
      cleanTitle(a.titre || '').toLowerCase().includes(search.toLowerCase()) ||
      a.mot_cle?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tous' || a.type_article === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">
            Blog Déménagement
          </h1>
          <p className="text-blue-100 text-lg max-w-2xl mx-auto">
            Guides pratiques, comparatifs et conseils pour réussir votre déménagement en France.
          </p>
          <div className="mt-8 max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-5 py-3 rounded-full text-gray-800 text-base focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Filtres */}
        <div className="flex flex-wrap gap-2 mb-8">
          {types.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p className="text-sm text-gray-500 mb-6">
          {filtered.length} article{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
        </p>

        {/* Articles */}
        {loading ? (
          <div className="grid gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-full mb-1" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Aucun article trouvé.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filtered.map(article => (
              <Link
                key={article.id}
                to={`/blog/${article.slug}`}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 mb-3">
                  {article.type_article && (
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${TYPE_COLORS[article.type_article] || 'bg-gray-100 text-gray-600'}`}>
                      {article.type_article}
                    </span>
                  )}
                  {article.ville && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      📍 {article.ville}
                    </span>
                  )}
                  <span className="text-xs text-gray-400 ml-auto">
                    {getReadingTime(article.contenu || '')} min de lecture
                  </span>
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                  {cleanTitle(article.titre)}
                </h2>

                <p className="text-gray-500 text-sm leading-relaxed mb-4">
                  {getExcerpt(article.contenu || '', 200)}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{formatDate(article.created_at)}</span>
                  <span className="text-sm text-blue-600 font-medium group-hover:underline">
                    Lire l'article →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-12 bg-blue-600 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Prêt à déménager ?</h3>
          <p className="text-blue-100 mb-6">Comparez gratuitement les devis de déménageurs professionnels vérifiés.</p>
          <Link
            to="/"
            className="inline-block bg-white text-blue-600 font-semibold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors"
          >
            Obtenir mon devis gratuit →
          </Link>
        </div>
      </div>
    </div>
  );
}
