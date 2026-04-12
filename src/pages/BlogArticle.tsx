import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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
  // Supprimer l'ancien schema si existant
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
    author: {
      '@type': 'Organization',
      name: 'TrouveTonDéménageur',
      url: 'https://www.trouvetondemenageur.fr',
    },
    publisher: {
      '@type': 'Organization',
      name: 'TrouveTonDéménageur',
      url: 'https://www.trouvetondemenageur.fr',
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.trouvetondemenageur.fr/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://www.trouvetondemenageur.fr/blog/${article.slug}`,
    },
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

  // Extraire les Q/R de la section FAQ du HTML
  const faqMatches = content.matchAll(/<h[23][^>]*>(.*?)<\/h[23]>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/gi);
  const items: { question: string; answer: string }[] = [];

  for (const match of faqMatches) {
    const q = match[1].replace(/<[^>]*>/g, '').trim();
    const a = match[2].replace(/<[^>]*>/g, '').trim();
    if (q.endsWith('?') && a.length > 20) {
      items.push({ question: q, answer: a });
    }
  }

  if (items.length === 0) return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
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

  // Canonical
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;
}

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

    if (error || !data) {
      navigate('/blog');
      return;
    }

    setArticle(data);
    setMetaTags(data);
    injectSchemaOrg(data);
    injectFAQSchema(data.contenu || '');

    // Articles liés (même type ou même ville)
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-500">Chargement de l'article...</p>
        </div>
      </div>
    );
  }

  if (!article) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <nav className="text-sm text-gray-500 flex items-center gap-2">
            <Link to="/" className="hover:text-blue-600">Accueil</Link>
            <span>›</span>
            <Link to="/blog" className="hover:text-blue-600">Blog</Link>
            <span>›</span>
            <span className="text-gray-800 truncate max-w-xs">{cleanTitle(article.titre)}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* En-tête article */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            {article.type_article && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-blue-700">
                {article.type_article}
              </span>
            )}
            {article.ville && (
              <span className="text-xs text-gray-400">📍 {article.ville}</span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {cleanTitle(article.titre)}
          </h1>

          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>📅 {formatDate(article.created_at)}</span>
            <span>⏱ {getReadingTime(article.contenu || '')} min de lecture</span>
            {article.mot_cle && <span className="hidden md:block">🔑 {article.mot_cle}</span>}
          </div>
        </header>

        {/* Contenu article */}
        <article
          className="prose prose-lg prose-blue max-w-none
            prose-headings:font-bold prose-headings:text-gray-900
            prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-5
            prose-li:text-gray-700 prose-li:mb-1
            prose-strong:text-gray-900
            prose-blockquote:border-blue-400 prose-blockquote:bg-blue-50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-lg
            prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline"
          dangerouslySetInnerHTML={{ __html: cleanHTML(article.contenu) }}
        />

        {/* CTA après l'article */}
        <div className="mt-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
          <h3 className="text-2xl font-bold mb-2">Prêt à déménager ?</h3>
          <p className="text-blue-100 mb-6 text-sm">
            Comparez gratuitement les devis de déménageurs professionnels certifiés près de chez vous.
            Réponse en moins de 24h.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/"
              className="bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-blue-50 transition-colors"
            >
              Obtenir mon devis gratuit →
            </Link>
            <Link
              to="/blog"
              className="border border-blue-300 text-white font-medium px-6 py-3 rounded-full hover:bg-blue-500 transition-colors"
            >
              Lire d'autres articles
            </Link>
          </div>
        </div>

        {/* Articles liés */}
        {related.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Articles similaires</h3>
            <div className="grid gap-4">
              {related.map(rel => (
                <Link
                  key={rel.id}
                  to={`/blog/${rel.slug}`}
                  className="flex items-center gap-4 bg-white rounded-xl p-4 border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all group"
                >
                  <div className="flex-1">
                    <p className="text-xs text-gray-400 mb-1">{rel.type_article} {rel.ville ? `• ${rel.ville}` : ''}</p>
                    <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors text-sm leading-snug">
                      {rel.titre}
                    </p>
                  </div>
                  <span className="text-blue-400 text-lg">→</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Partage */}
        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
          <Link to="/blog" className="text-sm text-gray-500 hover:text-blue-600 transition-colors">
            ← Retour au blog
          </Link>
          <div className="flex gap-3">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(cleanTitle(article.titre))}&url=${encodeURIComponent(`https://www.trouvetondemenageur.fr/blog/${article.slug}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-gray-400 hover:text-blue-500 transition-colors"
            >
              Partager →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}