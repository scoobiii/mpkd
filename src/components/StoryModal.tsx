import React from 'react';
import { X, Flame, Sparkles, MapPin, Compass } from 'lucide-react';

interface StoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoryModal: React.FC<StoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl text-neutral-200 my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-semibold text-white tracking-tight">
              A Alma Culinária do Thai Mee & O DNA MPK Monolithe
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hero Image & Quote */}
        <div className="relative h-64 sm:h-72 w-full overflow-hidden">
          <img
            src="/src/assets/images/hero_monolithe_kitchen_1790899112677.jpg"
            alt="Cozinha Monolithe de Alta Performance"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-neutral-900/40 to-transparent" />
          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-mono">
              Fundação & Filosofia
            </span>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              "Comida de altíssima qualidade produzida em espaços mínimos."
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6 text-sm text-neutral-300 leading-relaxed max-h-[60vh] overflow-y-auto">
          {/* Question 1 */}
          <div className="space-y-2 border-b border-neutral-800 pb-5">
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <Compass className="w-4 h-4" />
              <span>1. Como tudo começou?</span>
            </div>
            <p className="text-neutral-300">
              <strong className="text-white">Por puro acaso.</strong> Muito jovem, eu revirava a Alemanha, onde trabalhei e vivi uma longa temporada. Resolvido a mudar de ares, a ideia de conhecer a Tailândia me atraiu — era considerada um destino exótico, e o bilhete aéreo cabia no meu orçamento.
            </p>
            <p className="text-neutral-400">
              Cheguei lá com <strong className="text-amber-300">US$ 500,00 no bolso</strong> e imensa curiosidade. Povo gentil, prestativo, 95% da população é budista, ajudar é algo natural. Minha alimentação era nas barraquinhas de rua, que serviam verdadeiras iguarias: comida de alta qualidade produzida em espaços mínimos.
            </p>
            <p className="text-neutral-400">
              Voltei ao Brasil e construí um prédio na <span className="text-white">Praia do Rosa</span>: morava no térreo e servia comida tailandesa no deck do andar de cima. Funcionou e continuou funcionando em <span className="text-white">Porto Alegre</span>, evoluindo até a consolidação do Thai Mee.
            </p>
          </div>

          {/* Question 2 with Dish Spotlight */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-neutral-800 pb-5">
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-medium">
                <Sparkles className="w-4 h-4" />
                <span>2. Você cozinha ou é gestor no Thai Mee?</span>
              </div>
              <p className="text-neutral-300">
                Para elaborar o menu do Thai Mee, <strong className="text-white">construí um bunker culinário no jardim atrás da minha casa</strong>. Passei meses cozinhando, criando, experimentando, até chegar à seleção rigorosa de pratos que servimos — o icônico <span className="text-amber-300 font-medium">Pad Talay Nam Prik Pao</span> (frutos do mar salteados com pasta artesanal de pimenta torrada e manjericão sagrado).
              </p>
              <p className="text-neutral-400">
                Enquanto isso, eu acompanhava cada detalhe da execução do projeto do novo restaurante — a moderníssima cozinha concebida para absorver volumes brutais sem colapsar a ergonomia. Depois, treinei a equipe exaustivamente. Hoje supervisiono o ecossistema que assimila o alto volume com precisão suíça.
              </p>
            </div>
            <div className="space-y-2">
              <div className="relative rounded-lg overflow-hidden border border-neutral-800 shadow-md aspect-4/3">
                <img
                  src="/src/assets/images/thai_mee_pad_talay_1790899122659.jpg"
                  alt="Pad Talay Nam Prik Pao"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs text-neutral-400 text-center font-mono">
                Pad Talay Nam Prik Pao · Forjado no bunker
              </p>
            </div>
          </div>

          {/* Question 3 & The Monolithe Connection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-medium">
              <MapPin className="w-4 h-4" />
              <span>3. Um pedacinho de seu coração ficou para trás?</span>
            </div>
            <p className="text-neutral-300 italic">
              "Não, eu o trouxe inteirinho comigo. Este novo empreendimento é tudo o que sonhei. E a inspiradora ilha de Koh Pee Pee, que conheci inóspita e fascinante, hoje é ocupada por gigantescos resorts. Para mim, o encanto mora na autenticidade do que construímos aqui."
            </p>

            <div className="p-4 rounded-lg bg-neutral-950/80 border border-neutral-800 space-y-2 mt-4">
              <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                O Padrão Angelo Po Monolithe na MPK
              </h4>
              <p className="text-xs text-neutral-300">
                Uma cozinha tailandesa de alto padrão não admite frestas onde resíduos de Nam Prik Pao, molhos de peixe ou óleos de wok se acumulem. O padrão Monolithe entrega um tampo único contínuo soldado a laser em aço AISI 304 de 3mm de espessura, integrando woks de indução de 8kW com curvatura côncava, frytops de cromo espelhado e bases refrigeradas sob medida. Higiene cirúrgica, emissão térmica reduzida em 60% e produtividade máxima para a equipe.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-950/80">
          <span className="text-xs text-neutral-500 font-mono">
            MPK Mellieri · Arquitetura Gastronômica com Alma
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-md transition-colors"
          >
            Explorar Projeto Monolithe
          </button>
        </div>
      </div>
    </div>
  );
};
