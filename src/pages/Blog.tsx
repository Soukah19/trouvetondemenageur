import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Search, Clock, MapPin, ChevronRight } from 'lucide-react';

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
  return cleaned.substring(0, length).trim() + '…';
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

const TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  Guide:      { color: 'bg-blue-50 text-blue-700 border border-blue-100',     dot: 'bg-blue-400' },
  Comparatif: { color: 'bg-violet-50 text-violet-700 border border-violet-100', dot: 'bg-violet-400' },
  Local:      { color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-400' },
  Prix:       { color: 'bg-amber-50 text-amber-700 border border-amber-100',   dot: 'bg-amber-400' },
  Checklist:  { color: 'bg-yellow-50 text-yellow-700 border border-yellow-100', dot: 'bg-yellow-400' },
  FAQ:        { color: 'bg-rose-50 text-rose-700 border border-rose-100',      dot: 'bg-rose-400' },
};

const DEFAULT_TYPE = { color: 'bg-gray-50 text-gray-600 border border-gray-100', dot: 'bg-gray-400' };

export default function Blog() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('Tous');

  useEffect(() => {
    document.title = 'Blog Déménagement — Conseils & Guides | TrouveTonDéménageur';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Guides, conseils et comparatifs pour réussir votre déménagement en France.');
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
    const matchSearch =
      search === '' ||
      cleanTitle(a.titre || '').toLowerCase().includes(search.toLowerCase()) ||
      a.mot_cle?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'Tous' || a.type_article === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => navigate('/')}
            >
              <img src="/logo.png" alt="TrouveTonDemenageur" className="h-9 w-auto object-contain" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">
                TrouveTonDemenageur
              </span>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Retour</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="pt-16">
        <div
          className="relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #3b82f6 100%)',
          }}
        >
          {/* Decorative blobs */}
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />
          <div
            className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full opacity-5"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-20">
            <p className="text-blue-200 text-sm font-medium uppercase tracking-widest mb-3">
              Le blog
            </p>
            <h1
              className="text-4xl sm:text-5xl font-extrabold text-white mb-4 leading-tight"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
            >
              Conseils &amp; Guides<br />
              <span className="text-blue-200">Déménagement</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-xl leading-relaxed">
              Tout ce qu'il faut savoir pour déménager sereinement, comparer les offres et économiser.
            </p>

            {/* Search */}
            <div className="mt-8 relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un article…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-12 pr-5 py-3.5 rounded-2xl text-gray-800 text-sm bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300 placeholder-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {types.map(type => {
            const cfg = TYPE_CONFIG[type];
            const active = filter === type;
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600'
                }`}
              >
                {cfg && !active && (
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                )}
                {type}
              </button>
            );
          })}
        </div>

        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-8">
          {filtered.length} article{filtered.length > 1 ? 's' : ''}
        </p>

        {/* Articles grid */}
        {loading ? (
          <div className="grid gap-5">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-6 animate-pulse shadow-sm">
                <div className="h-3 bg-gray-100 rounded-full w-1/5 mb-4" />
                <div className="h-5 bg-gray-100 rounded-full w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded-full w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded-full w-2/3" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-500 font-medium">Aucun article trouvé.</p>
            <p className="text-gray-400 text-sm mt-1">Essayez un autre mot-clé ou filtre.</p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filtered.map((article, idx) => {
              const cfg = TYPE_CONFIG[article.type_article] || DEFAULT_TYPE;
              return (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row sm:items-start gap-4"
                  style={{ animationDelay: `${idx * 40}ms` }}
                >
                  {/* Left accent bar */}
                  <div
                    className="hidden sm:block w-1 self-stretch rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ background: 'linear-gradient(to bottom, #2563eb, #3b82f6)' }}
                  />

                  <div className="flex-1 min-w-0">
                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {article.type_article && (
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {article.type_article}
                        </span>
                      )}
                      {article.ville && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="w-3 h-3" />
                          {article.ville}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400 sm:ml-auto">
                        <Clock className="w-3 h-3" />
                        {getReadingTime(article.contenu || '')} min
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors leading-snug">
                      {cleanTitle(article.titre)}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 mb-4">
                      {getExcerpt(article.contenu || '', 200)}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{formatDate(article.created_at)}</span>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        Lire <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* ── CTA ── */}
        <div
          className="mt-16 rounded-3xl p-10 text-center relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
          }}
        >
          <div
            className="absolute -top-10 -right-10 w-60 h-60 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
            Vous avez un projet ?
          </p>
          <h3
            className="text-3xl font-extrabold text-white mb-3"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Prêt à déménager ?
          </h3>
          <p className="text-blue-100 mb-8 max-w-md mx-auto">
            Comparez gratuitement les devis de déménageurs professionnels vérifiés en quelques minutes.
          </p>
          <Link
            to="/client/auth-choice"
            className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold px-8 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
          >
            Obtenir mon devis gratuit
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}