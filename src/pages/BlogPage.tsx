import { Truck, ArrowLeft, Calendar, User, ArrowRight, Clock, Tag } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type BlogPost = {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  image: string;
};

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Comment bien préparer son déménagement : le guide complet',
    excerpt: 'Découvrez toutes les étapes essentielles pour organiser votre déménagement sans stress, de la planification à l\'installation dans votre nouveau logement.',
    content: 'Un déménagement réussi commence par une bonne préparation. Commencez par établir un calendrier précis et anticipez chaque étape. N\'hésitez pas à faire appel à des professionnels certifiés pour vous accompagner.',
    author: 'Marie Dubois',
    date: '15 Décembre 2025',
    readTime: '8 min',
    category: 'Conseils',
    image: 'https://images.pexels.com/photos/4569340/pexels-photo-4569340.jpeg'
  },
  {
    id: '2',
    title: '10 erreurs à éviter lors d\'un déménagement',
    excerpt: 'Les pièges les plus courants qui peuvent transformer votre déménagement en cauchemar et comment les éviter facilement.',
    content: 'Parmi les erreurs fréquentes : ne pas trier avant d\'emballer, sous-estimer le volume, oublier de prévenir les administrations, ou encore mal protéger les objets fragiles. Anticipez pour éviter ces écueils.',
    author: 'Thomas Martin',
    date: '10 Décembre 2025',
    readTime: '6 min',
    category: 'Conseils',
    image: 'https://images.pexels.com/photos/4246120/pexels-photo-4246120.jpeg'
  },
  {
    id: '3',
    title: 'L\'IA au service de la protection de vos biens',
    excerpt: 'Comment notre technologie d\'intelligence artificielle révolutionne la sécurité lors des déménagements en analysant automatiquement l\'état de vos biens.',
    content: 'Notre système d\'IA compare les photos prises à différentes étapes du déménagement pour identifier les changements et protéger à la fois clients et déménageurs. Une révolution dans le secteur.',
    author: 'Sophie Laurent',
    date: '5 Décembre 2025',
    readTime: '5 min',
    category: 'Technologie',
    image: 'https://images.pexels.com/photos/8728382/pexels-photo-8728382.jpeg'
  },
  {
    id: '4',
    title: 'Déménagement écologique : réduire son empreinte carbone',
    excerpt: 'Des astuces pratiques pour déménager tout en respectant l\'environnement : recyclage des cartons, optimisation des trajets et choix responsables.',
    content: 'Privilégiez les cartons réutilisables, donnez ou vendez ce dont vous n\'avez plus besoin, choisissez un déménageur qui optimise ses trajets. Chaque geste compte pour un déménagement plus vert.',
    author: 'Julien Petit',
    date: '1 Décembre 2025',
    readTime: '7 min',
    category: 'Écologie',
    image: 'https://images.pexels.com/photos/5025639/pexels-photo-5025639.jpeg'
  },
  {
    id: '5',
    title: 'Budget déménagement : comment estimer et optimiser vos coûts',
    excerpt: 'Tous nos conseils pour établir un budget réaliste et trouver les meilleures offres sans sacrifier la qualité du service.',
    content: 'Le coût d\'un déménagement dépend de nombreux facteurs : volume, distance, période, services additionnels. Comparez plusieurs devis et n\'hésitez pas à négocier. La transparence est essentielle.',
    author: 'Claire Bernard',
    date: '25 Novembre 2025',
    readTime: '6 min',
    category: 'Budget',
    image: 'https://images.pexels.com/photos/259200/pexels-photo-259200.jpeg'
  },
  {
    id: '6',
    title: 'Déménager avec des enfants : le guide pour les parents',
    excerpt: 'Comment impliquer vos enfants dans le déménagement et les aider à vivre cette transition en douceur.',
    content: 'Expliquez le projet, impliquez-les dans les décisions adaptées à leur âge, visitez ensemble le nouveau quartier et la future école. Le dialogue est la clé pour un déménagement familial réussi.',
    author: 'Marie Dubois',
    date: '20 Novembre 2025',
    readTime: '8 min',
    category: 'Famille',
    image: 'https://images.pexels.com/photos/4545208/pexels-photo-4545208.jpeg'
  },
  {
    id: '7',
    title: 'Assurance déménagement : ce qu\'il faut savoir',
    excerpt: 'Comprendre les différentes garanties, ce qui est couvert et comment bien protéger vos biens pendant le transport.',
    content: 'Tout déménageur professionnel doit être assuré. Vérifiez les garanties, les exclusions et les plafonds. Notre système IA facilite grandement les déclarations de sinistre en cas de dommage.',
    author: 'Thomas Martin',
    date: '15 Novembre 2025',
    readTime: '5 min',
    category: 'Assurance',
    image: 'https://images.pexels.com/photos/4386467/pexels-photo-4386467.jpeg'
  },
  {
    id: '8',
    title: 'Check-list ultime du déménagement : rien n\'oublie pas',
    excerpt: 'Téléchargez notre check-list complète pour suivre toutes les étapes de votre déménagement, semaine par semaine.',
    content: 'De 8 semaines avant à après l\'installation, notre check-list détaillée vous accompagne. Cochez au fur et à mesure pour ne rien oublier et garder le contrôle de votre projet.',
    author: 'Sophie Laurent',
    date: '10 Novembre 2025',
    readTime: '4 min',
    category: 'Organisation',
    image: 'https://images.pexels.com/photos/7014337/pexels-photo-7014337.jpeg'
  }
];

export function BlogPage() {
  const navigate = useNavigate();
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (selectedPost) {
    return (
      <div
        className="min-h-screen relative"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/7464230/pexels-photo-7464230.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
      <button
        onClick={() => navigate('/')}
        className="fixed top-4 left-4 z-50 hover:opacity-80 transition-opacity bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2"
      >
        
      </button>
        <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
        <div className="relative">
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Retour</span>
        </button>
<header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
                  <Truck className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  TrouveTonDemenageur
                </h1>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-white/50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-medium">Retour au blog</span>
              </button>
            </div>
          </div>
        </header>

        <main className="pt-32 pb-20">
          <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold mb-4">
                {selectedPost.category}
              </span>
              <h1 className="text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
                {selectedPost.title}
              </h1>
              <div className="flex items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  <span>{selectedPost.author}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span>{selectedPost.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{selectedPost.readTime} de lecture</span>
                </div>
              </div>
            </div>

            <img
              src={selectedPost.image}
              alt={selectedPost.title}
              className="w-full h-96 object-cover rounded-3xl shadow-2xl mb-12"
            />

            <div className="prose prose-lg max-w-none">
              <p className="text-xl text-gray-700 leading-relaxed mb-6">
                {selectedPost.excerpt}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                {selectedPost.content}
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Pour en savoir plus sur nos services et bénéficier de notre technologie de protection IA,
                n'hésitez pas à demander vos devis gratuits dès maintenant.
              </p>
            </div>

            <div className="mt-12 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
              <h2 className="text-3xl font-bold mb-4">Prêt à déménager en toute sérénité ?</h2>
              <p className="text-xl text-blue-100 mb-8">
                Demandez vos devis gratuits et bénéficiez de notre protection IA
              </p>
              <button
                onClick={() => navigate(-1)}
                className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 transform hover:scale-105"
              >
                Obtenir mes devis
              </button>
            </div>
          </article>
        </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen relative"
      style={{
        backgroundImage: 'url(https://images.pexels.com/photos/4246266/pexels-photo-4246266.jpeg?auto=compress&cs=tinysrgb&w=1920)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/88 via-blue-50/85 to-cyan-50/88"></div>
      <div className="relative">
      <header className="fixed top-0 left-0 right-0 z-50 glass-effect border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg">
                <Truck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                TrouveTonDemenageur
              </h1>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 px-5 py-2.5 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-white/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-medium">Retour</span>
            </button>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl">
              <Tag className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
              Blog & Actualités
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Conseils, astuces et nouveautés pour un déménagement réussi
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post) => (
              <article
                key={post.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{post.author}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {post.date}
                    </span>
                  </div>
                  <button className="mt-4 flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all group">
                    Lire l'article
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-20 bg-gradient-to-br from-blue-900 to-slate-900 rounded-3xl p-12 text-white text-center">
            <h2 className="text-3xl font-bold mb-4">Restez informé</h2>
            <p className="text-xl text-blue-100 mb-8">
              Abonnez-vous à notre newsletter pour recevoir nos derniers articles et conseils
            </p>
            <div className="max-w-md mx-auto flex gap-3">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 px-6 py-4 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <button className="bg-white text-blue-600 px-8 py-4 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300">
                S'abonner
              </button>
            </div>
          </div>
        </div>
      </main>
      </div>
    </div>
  );
}
