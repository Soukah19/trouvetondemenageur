import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Clock, MapPin, Calendar, ChevronRight, Share2 } from 'lucide-react';

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function cleanTitle(title: string): string {
  return title
    .replace(/```html?/g, '')
    .replace(/```/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

function cleanHTML(content: string): string {
  return content
    .replace(/^```html?\n?/gm, '')
    .replace(/^```\s*$/gm, '')
    .trim();
}

function injectSchemaOrg(article: Article) {
  const existing = document.getElementById('schema-article');
  if (existing) existing.remove();
  const excerpt = article.contenu.replace(/<[^>]*>/g, '').substring(0, 200);
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: cleanTitle(article.titre),
    description: excerpt,
    datePublished: article.created_at,
    dateModified: article.created_at,
    author: { '@type': 'Organization', name: 'TrouveTonDéménageur', url: 'https://www.trouvetondemenageur.fr' },
    publisher: {
      '@type': 'Organization',
      name: 'TrouveTonDéménageur',
      url: 'https://www.trouvetondemenageur.fr',
      logo: { '@type': 'ImageObject', url: 'https://www.trouvetondemenageur.fr/logo.png' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://www.trouvetondemenageur.fr/blog/${article.slug}` },
    keywords: article.mot_cle,
    ...(article.ville && { locationCreated: { '@type': 'City', name: article.ville } }),
  };
  const script = document.createElement('script');
  script.id = 'schema-article';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function injectFAQSchema(content: string) {
  const existing = document.getElementById('schema-faq');
  if (existing) existing.remove();
  const faqMatches = content.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi);
  const items: { question: string; answer: string }[] = [];
  for (const match of faqMatches) {
    const q = match[1].replace(/<[^>]*>/g, '').trim();
    const a = match[2].replace(/<[^>]*>/g, '').trim();
    if (q.endsWith('?') && a.length > 20) items.push({ question: q, answer: a });
  }
  if (items.length === 0) return;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
  const script = document.createElement('script');
  script.id = 'schema-faq';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

function setMetaTags(article: Article) {
  const excerpt = article.contenu.replace(/<[^>]*>/g, '').substring(0, 155).trim();
  const url = `https://www.trouvetondemenageur.fr/blog/${article.slug}`;
  document.title = `${cleanTitle(article.titre)} | TrouveTonDéménageur`;
  const metas: Record<string, string> = {
    'description': excerpt,
    'og:title': cleanTitle(article.titre),
    'og:description': excerpt,
    'og:url': url,
    'og:type': 'article',
    'og:site_name': 'TrouveTonDéménageur',
    'twitter:card': 'summary_large_image',
    'twitter:title': cleanTitle(article.titre),
    'twitter:description': excerpt,
  };
  Object.entries(metas).forEach(([name, content]) => {
    let el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`) as HTMLMetaElement | null;
    if (!el) {
      el = document.createElement('meta');
      const attr = name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name';
      el.setAttribute(attr, name);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  });
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

const TYPE_CONFIG: Record<string, { color: string; dot: string }> = {
  Guide:      { color: 'bg-blue-50 text-blue-700 border border-blue-100',      dot: 'bg-blue-400' },
  Comparatif: { color: 'bg-violet-50 text-violet-700 border border-violet-100', dot: 'bg-violet-400' },
  Local:      { color: 'bg-emerald-50 text-emerald-700 border border-emerald-100', dot: 'bg-emerald-400' },
  Prix:       { color: 'bg-amber-50 text-amber-700 border border-amber-100',    dot: 'bg-amber-400' },
  Checklist:  { color: 'bg-yellow-50 text-yellow-700 border border-yellow-100', dot: 'bg-yellow-400' },
  FAQ:        { color: 'bg-rose-50 text-rose-700 border border-rose-100',       dot: 'bg-rose-400' },
};

export default function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [related, setRelated] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) fetchArticle(slug);
  }, [slug]);

  async function fetchArticle(articleSlug: string) {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', articleSlug)
      .single();

    if (error || !data) { navigate('/blog'); return; }

    setArticle(data);
    setMetaTags(data);
    injectSchemaOrg(data);
    injectFAQSchema(data.contenu || '');

    const { data: relatedData } = await supabase
      .from('articles')
      .select('id, titre, slug, type_article, ville, created_at')
      .neq('id', data.id)
      .or(`type_article.eq.${data.type_article},ville.eq.${data.ville || 'null'}`)
      .limit(3);

    if (relatedData) setRelated(relatedData);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8f7f4' }}>
        <div className="text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-400 text-sm">Chargement de l'article…</p>
        </div>
      </div>
    );
  }

  if (!article) return null;

  const typeCfg = TYPE_CONFIG[article.type_article] || { color: 'bg-gray-50 text-gray-600 border border-gray-100', dot: 'bg-gray-400' };
  const shareUrl = `https://www.trouvetondemenageur.fr/blog/${article.slug}`;

  return (
    <div className="min-h-screen" style={{ background: '#f8f7f4' }}>

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.png" alt="TrouveTonDemenageur" className="h-9 w-auto object-contain" />
              <span className="text-lg font-bold text-gray-900 tracking-tight">TrouveTonDemenageur</span>
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

      {/* ── Hero / Article header ── */}
      <div className="pt-16">
        <div
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #3b82f6 100%)' }}
        >
          <div
            className="absolute -top-20 -right-20 w-96 h-96 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />
          <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-14 pb-16">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs text-blue-200 mb-6">
              <Link to="/" className="hover:text-white transition-colors">Accueil</Link>
              <span className="opacity-50">›</span>
              <Link to="/blog" className="hover:text-white transition-colors">Blog</Link>
              <span className="opacity-50">›</span>
              <span className="text-white/70 truncate max-w-xs">{cleanTitle(article.titre)}</span>
            </nav>

            {/* Badge */}
            {article.type_article && (
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${typeCfg.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${typeCfg.dot}`} />
                {article.type_article}
              </span>
            )}

            <h1
              className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-5"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', letterSpacing: '-0.02em' }}
            >
              {cleanTitle(article.titre)}
            </h1>

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-blue-100">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 opacity-70" />
                {formatDate(article.created_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                {getReadingTime(article.contenu || '')} min de lecture
              </span>
              {article.ville && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 opacity-70" />
                  {article.ville}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Article body ── */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <article
            className="prose prose-lg prose-blue max-w-none
              prose-headings:font-bold prose-headings:text-gray-900
              prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-600 prose-p:leading-relaxed prose-p:mb-5
              prose-li:text-gray-600 prose-li:mb-1
              prose-strong:text-gray-900
              prose-blockquote:border-l-4 prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50/60 prose-blockquote:py-3 prose-blockquote:px-5 prose-blockquote:rounded-r-xl prose-blockquote:not-italic
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm"
            dangerouslySetInnerHTML={{ __html: cleanHTML(article.contenu) }}
          />
        </div>

        {/* Share + back */}
        <div className="mt-6 flex items-center justify-between px-1">
          <Link
            to="/blog"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au blog
          </Link>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanTitle(article.titre))}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-500 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Partager
          </a>
        </div>

        {/* ── CTA ── */}
        <div
          className="mt-10 rounded-3xl p-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)' }}
        >
          <div
            className="absolute -top-10 -right-10 w-60 h-60 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #fff 0%, transparent 70%)' }}
          />
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
            Vous avez un projet ?
          </p>
          <h3
            className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
            style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
          >
            Prêt à déménager ?
          </h3>
          <p className="text-blue-100 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Comparez gratuitement les devis de déménageurs professionnels certifiés près de chez vous. Réponse en moins de 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/client/auth-choice"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-700 font-bold px-7 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg shadow-blue-900/20"
            >
              Obtenir mon devis gratuit
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/blog"
              className="inline-flex items-center justify-center gap-1.5 border border-blue-300/60 text-white font-medium px-6 py-3.5 rounded-full hover:bg-blue-500/30 transition-colors"
            >
              Lire d'autres articles
            </Link>
          </div>
        </div>

        {/* ── Related articles ── */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Articles similaires
            </h3>
            <div className="grid gap-3">
              {related.map(rel => {
                const relCfg = TYPE_CONFIG[rel.type_article] || { color: 'bg-gray-50 text-gray-600 border border-gray-100', dot: 'bg-gray-300' };
                return (
                  <Link
                    key={rel.id}
                    to={`/blog/${rel.slug}`}
                    className="group flex items-center gap-4 bg-white rounded-2xl px-5 py-4 border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {rel.type_article && (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${relCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${relCfg.dot}`} />
                            {rel.type_article}
                          </span>
                        )}
                        {rel.ville && (
                          <span className="text-xs text-gray-400">{rel.ville}</span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors text-sm leading-snug truncate">
                        {cleanTitle(rel.titre)}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-400 transition-colors flex-shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}