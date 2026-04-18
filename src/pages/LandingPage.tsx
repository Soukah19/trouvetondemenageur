import { Truck, LogIn, Shield, Camera, FileCheck, CheckCircle, ArrowRight, Sparkles, Star, Award, Zap, Phone, Mail, MessageCircle, Facebook, Twitter, Linkedin, Instagram, Youtube, Users, Building2, ChevronRight, Lightbulb } from 'lucide-react';
import { SupportChat } from '../components/SupportChat';
import { Logo } from '../components/Logo';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export function LandingPage() {
  const [showSupportChat, setShowSupportChat] = useState(false);
  const navigate = useNavigate();
  const howItWorksRef = useRef<HTMLDivElement>(null);

  const scrollToHowItWorks = () => {
    howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
        <div className="glass-effect border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-2">
              <div className="animate-slideInLeft">
                <img src="/logo.png" alt="TrouveTonDemenageur" className="h-10 sm:hidden" />
                <img src="/ttd-logo.png" alt="TrouveTonDemenageur" className="hidden sm:block h-36" />
              </div>

              <div className="flex items-center gap-1 sm:gap-2 animate-slideInRight">
                {/* ✅ Fix 4: Always shows text — shortened to "C'est quoi ?" on mobile */}
                <button
                  onClick={scrollToHowItWorks}
                  title="Comment ça marche"
                  className="flex items-center gap-1 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-xs sm:text-sm whitespace-nowrap"
                >
                  <Lightbulb className="w-4 h-4 flex-shrink-0" />
                  <span className="sm:hidden">Fonctionnement</span>
                  <span className="hidden sm:inline">Comment ça marche</span>
                </button>

                {/* ✅ Fix 2: No icon on mobile, text only */}
                <button
                  onClick={() => navigate('/client/auth-choice')}
                  className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-xs sm:text-sm whitespace-nowrap"
                >
                  <LogIn className="hidden sm:block w-4 h-4 flex-shrink-0" />
                  <span className="sm:hidden">Client</span>
                  <span className="hidden sm:inline">Espace Client</span>
                </button>

                {/* ✅ Fix 2 & 3: No icon on mobile, "Déménageur" instead of "Pro" */}
                <button
                  onClick={() => navigate('/mover/login')}
                  className="flex items-center gap-1 sm:gap-2 px-2.5 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-xs sm:text-sm whitespace-nowrap"
                >
                  <Truck className="hidden sm:block w-4 h-4 flex-shrink-0" />
                  <span className="sm:hidden">Déménageur</span>
                  <span className="hidden sm:inline">Espace Déménageur</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-20"
        style={{
          backgroundImage: "url(/Capture_d'écran_2026-03-31_à_20.09.20.png)",
          backgroundSize: 'cover',
          backgroundPosition: 'center 30%',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/75 via-blue-900/70 to-slate-800/75"></div>
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-cyan-400/25 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-blue-400/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-7xl font-black mb-6 leading-[1.1] animate-fadeInUp">
              <span className="block text-white mb-3 drop-shadow-2xl">Déménagez sereinement.</span>
              <span className="block bg-gradient-to-r from-emerald-300 via-cyan-200 to-blue-300 bg-clip-text text-transparent drop-shadow-lg">
                Vos affaires protégées par l'IA
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-blue-50/95 mb-12 leading-relaxed max-w-2xl mx-auto animate-fadeInUp font-normal" style={{ animationDelay: '0.2s' }}>
              La seule plateforme française qui analyse vos photos de déménagement pour protéger les clients et les pros des litiges grâce à une intelligence artificielle impartiale.
            </p>

            <div className="flex justify-center mb-12 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
              <button
                onClick={() => navigate('/client/auth-choice')}
                className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 text-white px-14 py-6 rounded-2xl font-bold text-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center justify-center space-x-3 shadow-2xl hover:shadow-emerald-500/50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <span className="relative">Obtenir mon devis gratuit en 2 minutes</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform relative" />
              </button>
            </div>

            {/* ✅ Fix 5: Removed "hidden sm:flex" from "Zéro litige" — now visible on mobile */}
            <div className="mt-12 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-md p-5 rounded-2xl border border-blue-400/30 max-w-3xl mx-auto animate-fadeInUp shadow-xl" style={{ animationDelay: '0.8s' }}>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-white font-medium">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Analyse photo par IA</span>
                </div>
                <div className="w-px h-4 bg-white/20 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Arbitrage impartial</span>
                </div>
                <div className="w-px h-4 bg-white/20 hidden sm:block"></div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-300" />
                  <span>Zéro litige</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-50 to-transparent"></div>
      </section>

      <section ref={howItWorksRef} className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-100/20 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">2 847</div>
              <div className="text-xs text-gray-500">Déménagements</div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900 flex items-center gap-1 justify-center">
                4.8 <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
              </div>
              <div className="text-xs text-gray-500">Satisfaction</div>
            </div>
            <div className="w-px h-10 bg-gray-200"></div>
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">157</div>
              <div className="text-xs text-gray-500">Professionnels</div>
            </div>
          </div>

          <div className="text-center mb-16 animate-fadeInUp">
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-full mb-6">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-700 tracking-wide">CONFIANCE GARANTIE</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Un tiers de confiance<br />
              <span className="gradient-text">entre vous et votre déménageur</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto font-light leading-relaxed">
              Nous sélectionnons, vérifions et encadrons chaque professionnel. Vous déménagez, nous sécurisons.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-4 mb-16 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col items-center text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-100 w-full md:w-80 hover-lift transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Users className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vous</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Décrivez votre projet en quelques clics. Volume, adresses, date : c'est tout.</p>
            </div>

            <div className="hidden md:flex items-center">
              <div className="w-16 h-0.5 bg-gradient-to-r from-blue-300 to-cyan-400"></div>
              <ChevronRight className="w-6 h-6 text-cyan-500 -mx-1" />
            </div>
            <div className="md:hidden flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-blue-300 to-cyan-400"></div>
              <ChevronRight className="w-6 h-6 text-cyan-500 rotate-90 -my-1" />
            </div>

            <div className="flex flex-col items-center text-center bg-gradient-to-br from-slate-900 to-blue-900 rounded-3xl p-8 shadow-2xl border border-blue-800 w-full md:w-80 hover-lift transition-all duration-300 relative">
              <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">Certifié</div>
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center mb-5 shadow-lg">
                <span className="text-white font-black text-lg">TTD</span>
                <span className="text-white/80 text-xs">.fr</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">TrouveTonDemenageur</h3>
              <p className="text-blue-200 text-sm leading-relaxed">Vérifie, accompagne et arbitre. Avant, pendant et après votre déménagement.</p>
            </div>

            <div className="hidden md:flex items-center">
              <div className="w-16 h-0.5 bg-gradient-to-r from-cyan-400 to-green-400"></div>
              <ChevronRight className="w-6 h-6 text-green-500 -mx-1" />
            </div>
            <div className="md:hidden flex flex-col items-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-cyan-400 to-green-400"></div>
              <ChevronRight className="w-6 h-6 text-green-500 rotate-90 -my-1" />
            </div>

            <div className="flex flex-col items-center text-center bg-white rounded-3xl p-8 shadow-xl border border-gray-100 w-full md:w-80 hover-lift transition-all duration-300">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Votre déménageur</h3>
              <p className="text-gray-600 text-sm leading-relaxed">Certifié, assuré et noté. Il vous envoie un devis sur-mesure.</p>
            </div>
          </div>

          <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => navigate('/client/auth-choice')}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Estimer mon déménagement
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-100/30 rounded-full blur-3xl"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-20 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl mb-6 shadow-xl animate-float">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Trois preuves. <span className="gradient-text">Zéro doute.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed font-light">
              Un protocole photo en trois étapes qui protège équitablement le client et le professionnel.
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
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Avant le départ</h3>
              <p className="text-gray-600 leading-relaxed">
                Vous photographiez vos biens. L'IA enregistre leur état d'origine.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-green-200 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="inline-block px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full mb-4">
                ÉTAPE 2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Au chargement</h3>
              <p className="text-gray-600 leading-relaxed">
                Le déménageur documente la prise en charge. Chaque bien est tracé.
              </p>
            </div>

            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-orange-200 transition-all duration-300 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <div className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full mb-4">
                ÉTAPE 3
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">A l'arrivée</h3>
              <p className="text-gray-600 leading-relaxed">
                Vous vérifiez, l'IA compare. En cas de dommage, le verdict est instantané.
              </p>
            </div>
          </div>

          <div
            className="relative rounded-3xl overflow-hidden shadow-premium animate-fadeInUp bg-gradient-to-br from-slate-900 via-gray-900 to-blue-900"
            style={{ animationDelay: '0.4s' }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-gray-900/90 to-blue-900/85"></div>
            <div className="relative p-10 md:p-16">
              <div className="max-w-5xl mx-auto text-center">
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-4 rounded-2xl shadow-xl animate-float">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-full mb-4 tracking-wider">
                  TECHNOLOGIE PROPRIÉTAIRE
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-6">
                  Une IA qui tranche, pas qui devine.
                </h3>
                <p className="text-lg md:text-xl text-gray-200 mb-12 leading-relaxed font-light max-w-3xl mx-auto">
                  Comparaison photo par photo, verdict objectif, traçabilité totale. Ni le client ni le pro ne peuvent contester les faits.
                </p>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="glass-effect p-6 rounded-2xl border border-white/10 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-blue-300 bg-blue-500/20 px-3 py-1 rounded-full">99.2%</span>
                    </div>
                    <p className="text-white font-bold text-lg mb-1">Détection en temps réel</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Chaque rayure, chaque impact identifié avec une précision de 99.2%
                    </p>
                  </div>
                  <div className="glass-effect p-6 rounded-2xl border border-white/10 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-cyan-300 bg-cyan-500/20 px-3 py-1 rounded-full">100%</span>
                    </div>
                    <p className="text-white font-bold text-lg mb-1">Verdict impartial</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Décision fondée sur les preuves, pas sur les déclarations
                    </p>
                  </div>
                  <div className="glass-effect p-6 rounded-2xl border border-white/10 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <FileCheck className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-green-300 bg-green-500/20 px-3 py-1 rounded-full">Certifié</span>
                    </div>
                    <p className="text-white font-bold text-lg mb-1">Traçabilité certifiée</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      Date, heure, géolocalisation. Chaque photo a valeur de preuve.
                    </p>
                  </div>
                  <div className="glass-effect p-6 rounded-2xl border border-white/10 text-left">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Shield className="w-6 h-6 text-white" />
                      </div>
                      <span className="text-sm font-bold text-orange-300 bg-orange-500/20 px-3 py-1 rounded-full">-87%</span>
                    </div>
                    <p className="text-white font-bold text-lg mb-1">Litiges quasi éliminés</p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      -87% de litiges. Les faits parlent, les conflits disparaissent.
                    </p>
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
              Ce qui fait la <span className="gradient-text">différence</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Une exigence de qualité à chaque étape, sans exception.
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Assurance vérifiée</h3>
              <p className="text-gray-600 leading-relaxed">Chaque professionnel est couvert. Nous le vérifions avant toute mise en relation.</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Pros triés sur le volet</h3>
              <p className="text-gray-600 leading-relaxed">Documents, avis, antécédents : rien n'est laissé au hasard.</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">IA propriétaire</h3>
              <p className="text-gray-600 leading-relaxed">Une technologie exclusive qui protège vos biens et vos droits.</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-3">Gratuit, sans engagement</h3>
              <p className="text-gray-600 leading-relaxed">Recevez vos devis librement. Vous choisissez, sans pression.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              La confiance, <span className="gradient-text">ça se prouve.</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Clients et professionnels témoignent.
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
                "Un meuble était déjà abîmé avant le départ. L'IA l'a détecté immédiatement. Résultat : aucun litige, aucun stress. Je recommande les yeux fermés."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                  SM
                </div>
                <div>
                  <p className="font-bold text-gray-900">S. Martin</p>
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
                "Fini les accusations injustifiées. Les photos sont là, l'IA tranche. Mes clients ont confiance et moi aussi. C'est du sérieux."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white font-bold">
                  JD
                </div>
                <div>
                  <p className="font-bold text-gray-900">J. Dupont</p>
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
                "3 devis en 24h, des avis vérifiés, un suivi photo complet. J'ai déménagé en toute sérénité. Le niveau de service est rare."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold">
                  ML
                </div>
                <div>
                  <p className="font-bold text-gray-900">M. Lefebvre</p>
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

      {/* Nos Partenaires Section */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-100/20 rounded-full blur-3xl"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-16 animate-fadeInUp">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
              Nos <span className="gradient-text">partenaires</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
              Des leaders technologiques au service de votre sécurité.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Stripe */}
            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-blue-200 transition-all duration-300 text-center animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl font-black">S</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Stripe</h3>
              <p className="text-sm text-gray-500 mb-3">Paiements sécurisés</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Norme PCI-DSS. Vos paiements sont chiffrés et protégés au plus haut niveau.
              </p>
            </div>

            {/* Dropbox Sign */}
            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-green-200 transition-all duration-300 text-center animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl font-black">D</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Dropbox Sign</h3>
              <p className="text-sm text-gray-500 mb-3">Signature électronique</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Conforme eIDAS. Vos contrats signés en ligne ont pleine valeur juridique.
              </p>
            </div>

            {/* Vercel */}
            <div className="group bg-white rounded-3xl p-8 hover-lift shadow-xl border border-gray-100/50 hover:border-cyan-200 transition-all duration-300 text-center animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
              <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-white text-2xl font-black">▲</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Vercel</h3>
              <p className="text-sm text-gray-500 mb-3">Hébergement sécurisé</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Infrastructure cloud haute disponibilité. Vos données accessibles et protégées 24h/24.
              </p>
            </div>
          </div>

          <div className="text-center animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
            <button
              onClick={() => navigate('/partners')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              Découvrir nos partenaires
              <ArrowRight className="w-5 h-5" />
            </button>
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
          <h2 className="text-4xl md:text-6xl font-extrabold mb-8 leading-tight animate-fadeInUp">
            Votre prochain déménagement
            <span className="block mt-2 bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
              mérite mieux.
            </span>
          </h2>

          <p className="text-xl md:text-2xl text-blue-50/90 mb-12 leading-relaxed max-w-3xl mx-auto font-light animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
            Recevez plusieurs devis de professionnels vérifiés. Sans engagement.
          </p>

          <button
            onClick={() => navigate('/client/auth-choice')}
            className="group bg-white text-blue-600 px-12 py-6 rounded-2xl font-bold text-xl hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 inline-flex items-center space-x-3 shadow-premium animate-fadeInUp"
            style={{ animationDelay: '0.4s' }}
          >
            <span>Commencer maintenant</span>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="mt-6 text-sm text-blue-200/80 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            Gratuit -- Réponse sous 24h -- 100% sécurisé
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
                  <img src="/logo.png" alt="TrouveTonDemenageur" className="h-12 w-auto" />
                  <div>
                    <span className="text-2xl font-bold text-white block">TrouveTonDemenageur</span>
                    <span className="text-xs text-gray-400">Le déménagement de confiance</span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  La plateforme premium qui sécurise chaque déménagement grâce à l'IA. Protection équitable pour les clients et les professionnels.
                </p>
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
                </ul>
              </div>

              <div>
                <h3 className="text-white font-bold text-lg mb-6">Services</h3>
                <ul className="space-y-3">
                  <li>
                    <button onClick={() => navigate('/for-clients')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Pour les clients
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/for-movers')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
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
                  {/* ✅ Fix 6: Blog link added in Services section */}
                  <li>
                    <button onClick={() => navigate('/blog')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Blog
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
                      Centre d'aide & FAQ
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/contact')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Contact
                    </button>
                  </li>
                  <li>
                    <button onClick={() => navigate('/guide')} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                      Guide du déménagement
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="py-8 border-b border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <a
                href="tel:0189707881"
                className="flex items-start gap-4 hover:bg-white/5 p-3 rounded-xl transition-all group"
              >
                <div className="bg-blue-500/10 p-3 rounded-xl group-hover:bg-blue-500/20 transition-all">
                  <Phone className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-white font-semibold text-sm mb-1">Téléphone</h4>
                  <p className="text-gray-400 text-sm">01 89 70 78 81</p>
                  <p className="text-xs text-gray-500 mt-1">Lun-Ven 9h-18h</p>
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
                  <p className="text-gray-400 text-sm">support@trouvetondemenageur.fr</p>
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
                    CGU & CGV
                  </button>
                  <span className="text-gray-700">•</span>
                  <button
                    onClick={() => navigate('/legal/cookies')}
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    Cookies
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 mr-2">Suivez-nous</span>

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