/**
 * Contratos e resolvedor de mídia pedagógica contextualizada por cenário.
 * Não altera banco de dados nem depende de URLs externas provisórias:
 * quando `heroImageUrl` não estiver definido, o componente visual usa
 * o `fallback` temático institucional com `altText` acessível.
 */
export type ScenarioMediaKey =
  | 'business_intro'
  | 'daily_routine'
  | 'travel_airport'
  | 'past_events'
  | 'written_communication';

export interface LessonMediaIllustration {
  url: string;
  alt: string;
  caption?: string;
}

export interface LessonMediaAsset {
  scenarioKey: ScenarioMediaKey;
  scenarioLabel: string;
  altText: string;
  heroImageUrl?: string;
  illustrations?: LessonMediaIllustration[];
  introVideoUrl?: string;
  fallbackGradient: string;
  accentColor: string;
}

const MEDIA_REGISTRY: Record<ScenarioMediaKey, Omit<LessonMediaAsset, 'scenarioKey'>> = {
  business_intro: {
    scenarioLabel: 'Networking & Apresentações Profissionais',
    altText: 'Ilustração contextual de apresentação profissional em ambiente de negócios',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  daily_routine: {
    scenarioLabel: 'Rotina & Atividades Diárias',
    altText: 'Ilustração contextual de rotina diária, agenda e horários de trabalho',
    fallbackGradient: 'from-[#07182E] via-[#0F2D4A] to-[#16375B]',
    accentColor: '#22C9A4',
  },
  travel_airport: {
    scenarioLabel: 'Viagens, Aeroporto & Hotel',
    altText: 'Ilustração contextual de embarque em aeroporto e recepção de hotel',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1D4ED8]',
    accentColor: '#3B82F6',
  },
  past_events: {
    scenarioLabel: 'Relato de Experiências & Eventos Passados',
    altText: 'Ilustração contextual de linha do tempo e apresentação de resultados',
    fallbackGradient: 'from-[#07182E] via-[#122D4C] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  written_communication: {
    scenarioLabel: 'E-mails & Mensagens Profissionais',
    altText: 'Ilustração contextual de comunicação escrita corporativa',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#0F4C5C]',
    accentColor: '#22C9A4',
  },
};

export function resolveLessonMedia(lessonTitle: string): LessonMediaAsset {
  const title = lessonTitle.toLowerCase();

  let scenarioKey: ScenarioMediaKey = 'daily_routine';
  if (
    title.includes('contato') ||
    title.includes('apresent') ||
    title.includes('presentaci') ||
    title.includes('empresa') ||
    title.includes('saludo')
  ) {
    scenarioKey = 'business_intro';
  } else if (title.includes('viagem') || title.includes('aeroporto') || title.includes('hotel')) {
    scenarioKey = 'travel_airport';
  } else if (title.includes('passad') || title.includes('ontem') || title.includes('evento')) {
    scenarioKey = 'past_events';
  } else if (title.includes('e-mail') || title.includes('email') || title.includes('mensagen')) {
    scenarioKey = 'written_communication';
  }

  return {
    scenarioKey,
    ...MEDIA_REGISTRY[scenarioKey],
  };
}
