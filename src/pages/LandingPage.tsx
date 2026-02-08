import { Truck, LogIn, Shield, Camera, FileCheck, CheckCircle, ArrowRight, Sparkles, Star, Award, Zap, Phone, Mail, MessageCircle, Facebook, Twitter, Linkedin, Instagram, Youtube } from 'lucide-react';
import { SupportChat } from '../components/SupportChat';
import { Logo } from '../components/Logo';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const [showSupportChat, setShowSupportChat] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="glass-effect border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="animate-slideInLeft">
                <Logo variant="blue" size="md" />
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3 animate-slideInRight">
                <button
                  onClick={() => navigate('/client/auth-choice')}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 text-gray-700 hover:text-blue-600 transition-all duration-300 rounded-lg hover:bg-white/50"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium text-sm sm:text-base">Connexion</span>
                </button>
                <button
                  onClick={() => navigate('/mover/login')}
                  className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm sm:text-base"
                >
                  <span>Espace Pro</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
        style={{
          backgroundImage: 'url(https://images.pexels.com/photos/7464230/pexels-photo-7464230.jpeg?auto=compress&cs=tinysrgb&w=1920)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-blue-900/70 to-slate-800/75"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-400/25 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl">
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 backdrop-blur-md px-6 py-3 rounded-full mb-8 animate-fadeIn border border-blue-400/30 shadow-lg">
              <Sparkles className="w-5 h-5 text-blue-300 animate-pulse" />
              <span className="text-sm font-bold tracking-wide text-blue-50">IA de Protection Avancée</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] animate-fadeInUp">
              <span className="block text-white mb-3 drop-shadow-2xl">Votre déménagement,</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
                100% sécurisé par l'IA
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-50/95 mb-12 leading-relaxed max-w-2xl animate-fadeInUp font-normal" style={{ animationDelay: '0.2s' }}>
              <span className="font-bold text-white">Zéro stress. Zéro litige.</span> La première plateforme qui protège réellement clients et déménageurs avec une intelligence artificielle impartiale.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 mb-12 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={() => navigate('/client/auth-choice')}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-emerald-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">Devis gratuit en 2 min</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative" />
              </button>
              <button
                onClick={() => navigate('/mover/signup')}
                className="glass-effect text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-3 border-2 border-white/40 backdrop-blur-xl"
              >
                <Award className="w-5 h-5" />
                <span>Devenir partenaire</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-8 max-w-2xl animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
              <div className="text-center">
                <div className="text-4xl font-black mb-1 text-blue-300">2 847</div>
                <div className="text-blue-100 text-sm font-medium">Déménagements protégés</div>
              </div>
              <div className="text-center border-x border-white/20">
                <div className="text-4xl font-black mb-1 flex items-center justify-center gap-1 text-blue-300">
                  4.8<span className="text-lg">/5</span>
                  <Star className="w-5 h-5 fill-yellow-300 text-yellow-300" />
                </div>
                <div className="text-blue-100 text-sm font-medium">Satisfaction client</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-black mb-1 text-blue-300">157</div>
                <div className="text-blue-100 text-sm font-medium">Pros certifiés IA</div>
              </div>
            </div>

            <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md p-5 rounded-2xl border border-blue-400/30 max-w-3xl animate-fadeInUp shadow-xl" style={{ animationDelay: '0.8s' }}>
              <div className="flex items-center gap-4 text-sm text-white font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Analyse IA instantanée</span>
                </div>
                <div className="w-px h-4 bg-white/20"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Arbitrage automatique</span>
                </div>
                <div className="w-px h-4 bg-white/20 hidden sm:block"></div>
                <div className="flex items-center gap-2 hidden sm:flex">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Protection juridique</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-100/30 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl animate-float">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Une protection <span className="gradient-text">intelligente</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Notre technologie IA révolutionne le déménagement en protégeant équitablement clients et professionnels à chaque étape
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-blue-200 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full mb-4">
                ÉTAPE 1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Photos avant départ</h3>
              <p className="text-gray-600 leading-relaxed">
                Le client documente l'état initial de tous ses biens lors de la demande de devis. Preuves irréfutables.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-green-200 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-4">
                ÉTAPE 2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Photos au chargement</h3>
              <p className="text-gray-600 leading-relaxed">
                Le déménageur photographie chaque bien au moment du chargement. Protection contre les fausses réclamations.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-orange-200 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full mb-4">
                ÉTAPE 3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Photos au déchargement</h3>
              <p className="text-gray-600 leading-relaxed">
                Le client inspecte et documente l'arrivée de ses biens. Rapport de dommages instantané si nécessaire.
              </p>
            </div>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden shadow-premium animate-fadeInUp bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900"
            style={{
              animationDelay: '0.4s'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-blue-900/85"></div>
            <div className="relative p-10 md:p-16">
              <div className="max-w-4xl">
                <div className="flex items-center space-x-4 mb-8">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-xl animate-float">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full mb-2">
                      TECHNOLOGIE AVANCÉE
                    </div>
                    <h3 className="text-3xl md:text-4xl font-extrabold text-white">
                      Intelligence Artificielle
                    </h3>
                  </div>
                </div>
                <p className="text-xl text-gray-200 mb-10 leading-relaxed font-light">
                  Notre IA analyse et compare automatiquement les photos prises à chaque étape pour déterminer avec précision l'origine des dommages éventuels.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="glass-effect p-6 rounded-2xl border border-white/10">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg mb-1">Protection Client</p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          Dommages préexistants automatiquement identifiés et documentés
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="glass-effect p-6 rounded-2xl border border-white/10">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-bold text-lg mb-1">Protection Pro</p>
                        <p className="text-gray-300 text-sm leading-relaxed">
                          Rapport complet pour votre assurance généré instantanément
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-blue-50 to-cyan-50 rounded-full blur-3xl opacity-40"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Pourquoi nous choisir ?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              L'excellence à chaque étape de votre déménagement
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Protection totale</h3>
              <p className="text-gray-600 leading-relaxed">Tous nos déménageurs possèdent une assurance professionnelle vérifiée</p>
            </div>

            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <FileCheck className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Star className="w-5 h-5 text-white fill-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pros certifiés</h3>
              <p className="text-gray-600 leading-relaxed">100% des déménageurs vérifiés et assurés</p>
            </div>

            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">IA avancée</h3>
              <p className="text-gray-600 leading-relaxed">Technologie de pointe pour votre sécurité maximale</p>
            </div>

            <div className="text-center group animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl group-hover:scale-110 transition-transform duration-300">
                  <Award className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Sans engagement</h3>
              <p className="text-gray-600 leading-relaxed">Devis gratuits, aucune obligation d'achat</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Ils nous font <span className="gradient-text">confiance</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Découvrez les témoignages de nos clients satisfaits
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover-lift animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                "Le système de photos avec IA m'a sauvé ! Un meuble était abîmé avant le déménagement et l'IA l'a clairement identifié. Aucun litige avec le déménageur."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div>
                  <p className="font-bold text-gray-900">Sophie Martin</p>
                  <p className="text-sm text-gray-500">Paris → Lyon • Déc 2025</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover-lift animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                "En tant que déménageur, cette plateforme me protège des fausses accusations. L'IA est impartiale et les rapports sont acceptés par les assurances."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <p className="font-bold text-gray-900">Jean Dupont</p>
                  <p className="text-sm text-gray-500">Déménageur professionnel</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 hover-lift animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="flex items-center gap-1 mb-4">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
              </div>
              <p className="text-gray-700 leading-relaxed mb-6">
                "Service exceptionnel ! Les 3 devis reçus en 24h, choix facile grâce aux avis vérifiés. Le suivi photo est génial pour la tranquillité d'esprit."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  ML
                </div>
                <div>
                  <p className="font-bold text-gray-900">Marie Lefebvre</p>
                  <p className="text-sm text-gray-500">Marseille → Bordeaux • Nov 2025</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <div className="inline-flex items-center gap-8 bg-white px-8 py-4 rounded-2xl shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">98%</div>
                <div className="text-sm text-gray-600">Taux de satisfaction</div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">4.8/5</div>
                <div className="text-sm text-gray-600">Note moyenne</div>
              </div>
              <div className="w-px h-12 bg-gray-200"></div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 mb-1">1 247</div>
                <div className="text-sm text-gray-600">Avis clients</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="relative py-32 overflow-hidden bg-gradient-to-br from-blue-900 via-slate-900 to-blue-800"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-slate-900/90 to-blue-800/95"></div>
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <div className="inline-flex items-center space-x-2 glass-effect px-5 py-2.5 rounded-full mb-8 animate-fadeIn border border-white/20">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-sm font-semibold tracking-wide">COMMENCEZ MAINTENANT</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight animate-fadeInUp">
            Prêt à déménager en toute
            <span className="block mt-2 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              confiance ?
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-blue-50/90 mb-12 leading-relaxed max-w-3xl mx-auto font-light animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Recevez jusqu'à 3 devis gratuits de déménageurs professionnels vérifiés et protégés par IA
          </p>

          <button
            onClick={() => navigate('/client/auth-choice')}
            className="group bg-white text-blue-600 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 inline-flex items-center space-x-3 shadow-premium animate-fadeInUp"
            style={{ animationDelay: '0.4s' }}
          >
            <span>Demander mes devis gratuits</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-sm text-blue-200/80 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            Sans engagement • Réponse sous 24h • 100% sécurisé
          </p>
        </div>
      </section>

      <footer className="bg-gradient-to-b from-gray-900 to-black text-gray-300 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-500 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="py-16 border-b border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-3 rounded-xl shadow-xl">
                    <Truck className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white block">TrouveTonDemenageur</span>
                    <span className="text-xs text-gray-400">Protection IA nouvelle génération</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  La première plateforme française de déménagement qui protège équitablement clients et professionnels grâce à l'intelligence artificielle. Déménagez en toute sérénité.
                </p>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">2 847</div>
                    <div className="text-xs text-gray-500">Déménagements</div>
                  </div>
                  <div className="w-px h-10 bg-gray-800"></div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white flex items-center gap-1">
                      4.8 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <div className="text-xs text-gray-500">Satisfaction</div>
                  </div>
                  <div className="w-px h-10 bg-gray-800"></div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">157</div>
                    <div className="text-xs text-gray-500">Professionnels</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-6">Entreprise</h3>
                <ul className="space-y-3">
                  <li>
                    <button onClick={() => navigate('/about')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Qui sommes-nous
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/mission')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Notre mission
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/press')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Presse
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-6">Services</h3>
                <ul className="space-y-3">
                  <li>
                    <button onClick={() => navigate('/client/auth-choice')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Pour les clients
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/mover/signup')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Pour les déménageurs
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/technology')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Technologie IA
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/pricing')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Tarifs
                    </button>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-6">Support</h3>
                <ul className="space-y-3">
                  <li>
                    <button onClick={() => navigate('/faq')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Centre d'aide
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/faq')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      FAQ
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/contact')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Contact
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/moving-guide')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Guide du déménagement
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/blog')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Blog
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <a
                href="tel:+33123456789"
                className="flex items-start gap-4 hover:bg-white/5 p-3 rounded-xl transition-all group"
              >
                <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-all">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Téléphone</h4>
                  <p className="text-gray-400 text-sm">01 234 567 89</p>
                  <p className="text-xs text-gray-500 mt-1">Lun-Ven 9h-19h, Sam 9h-17h</p>
                </div>
              </a>

              <button
                onClick={() => navigate('/contact')}
                className="flex items-start gap-4 hover:bg-white/5 p-3 rounded-xl transition-all group text-left"
              >
                <div className="bg-green-500/10 p-3 rounded-xl group-hover:bg-green-500/20 transition-all">
                  <Mail className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Email</h4>
                  <p className="text-gray-400 text-sm">contact@trouveton.fr</p>
                  <p className="text-xs text-gray-500 mt-1">Réponse sous 24h</p>
                </div>
              </button>

              <div className="flex items-start gap-4">
                <button
                  onClick={() => setShowSupportChat(true)}
                  className="flex items-start gap-4 w-full hover:bg-white/5 p-3 rounded-xl transition-all group"
                >
                  <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-all">
                    <MessageCircle className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-white font-semibold text-sm mb-1">Chat en direct</h4>
                    <p className="text-gray-400 text-sm">Support instantané</p>
                    <p className="text-xs text-gray-500 mt-1">7j/7 - 24h/24</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <div className="py-8">
            <div className="flex flex-col items-center gap-6">
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-gray-500 text-center">
                  © 2026 TrouveTonDemenageur. Tous droits réservés.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs">
                  <button
                    onClick={() => navigate('/legal/mentions')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Mentions légales
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate('/legal/privacy-policy')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Politique de confidentialité
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate('/legal/terms-of-service')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    CGU
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate('/legal/sales-terms')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    CGV
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate('/legal/privacy-policy')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Cookies
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate('/admin/login')}
                    className="text-gray-600 hover:text-gray-400 transition-colors"
                  >
                    Admin
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 mr-2">Suivez-nous</span>

                {/* Google */}
                {/* <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  aria-label="Google"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </a> */}

                {/* Facebook */}
                {/* <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  aria-label="Facebook"
                >
                  <Facebook className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a> */}

                {/* Instagram */}
                <a
                  href="https://www.instagram.com/trouvetondemenageur?igsh=azB3c3gwd21ranA4"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  aria-label="Instagram"
                >
                  <Instagram className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>

                {/* TikTok */}
                <a
                  href="https://www.tiktok.com/@trouvetondemenageur.fr?_r=1&_t=ZS-93jG8yXnWQz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-black rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  aria-label="TikTok"
                >
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>

                {/* YouTube */}
                <a
                  href="https://www.youtube.com/@trouvetondemenageur"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-gray-800 hover:bg-red-600 rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  aria-label="YouTube"
                >
                  <Youtube className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
                </a>

                {/* X (Twitter) */}
                {/* <a
                  href="#"
                  className="w-10 h-10 bg-gray-800 hover:bg-black rounded-lg flex items-center justify-center transition-all duration-300 transform hover:scale-110 group"
                  aria-label="X (Twitter)"
                >
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a> */}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showSupportChat && (
        <SupportChat
          isOpen={showSupportChat}
          onClose={() => setShowSupportChat(false)}
          hideButton={true}
        />
      )}
    </div>
  );
}
