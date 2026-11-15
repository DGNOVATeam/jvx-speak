/**
 * Contratos e resolvedor de mídia pedagógica contextualizada por cenário.
 * Não altera banco de dados nem depende de URLs externas provisórias:
 * quando `heroImageUrl` não estiver definido ou falhar no carregamento,
 * o componente visual usa o `fallback` temático institucional com `altText` acessível.
 */
export type ScenarioMediaKey =
  | 'business_intro'
  | 'daily_routine'
  | 'travel_airport'
  | 'restaurant_dining'
  | 'hotel_reception'
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
    heroImageUrl: '/media/scenarios/business-networking.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  daily_routine: {
    scenarioLabel: 'Rotina & Atividades Diárias',
    altText: 'Ilustração contextual de rotina diária, agenda e horários de trabalho',
    heroImageUrl: '/media/scenarios/daily-routine-office.webp',
    fallbackGradient: 'from-[#07182E] via-[#0F2D4A] to-[#16375B]',
    accentColor: '#22C9A4',
  },
  travel_airport: {
    scenarioLabel: 'Viagens & Aeroporto',
    altText: 'Ilustração contextual de check-in, bagagens e embarque em aeroporto',
    heroImageUrl: '/media/scenarios/airport-checkin.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1D4ED8]',
    accentColor: '#3B82F6',
  },
  restaurant_dining: {
    scenarioLabel: 'Restaurante & Pedidos',
    altText: 'Ilustração contextual de atendimento e pedidos em restaurante',
    heroImageUrl: '/media/scenarios/restaurant-ordering.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#16375B]',
    accentColor: '#D4AF37',
  },
  hotel_reception: {
    scenarioLabel: 'Hotel & Recepção',
    altText: 'Ilustração contextual de check-in, reservas e recepção de hotel',
    heroImageUrl: '/media/scenarios/hotel-reception.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  past_events: {
    scenarioLabel: 'Reuniões, Projetos & Eventos Passados',
    altText: 'Ilustração contextual de reunião em equipe e apresentação de resultados',
    heroImageUrl: '/media/scenarios/team-meeting.webp',
    fallbackGradient: 'from-[#07182E] via-[#122D4C] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  written_communication: {
    scenarioLabel: 'E-mails & Mensagens Profissionais',
    altText: 'Ilustração contextual de comunicação escrita corporativa',
    heroImageUrl: '/media/scenarios/daily-routine-office.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#0F4C5C]',
    accentColor: '#22C9A4',
  },
};

export function resolveLessonMedia(lessonTitle: string): LessonMediaAsset {
  const title = lessonTitle.toLowerCase();

  let scenarioKey: ScenarioMediaKey = 'daily_routine';
  if (
    title.includes('restaurante') ||
    title.includes('café') ||
    title.includes('cafe') ||
    title.includes('pedido') ||
    title.includes('comida') ||
    title.includes('almoço') ||
    title.includes('jantar') ||
    title.includes('desayuno') ||
    title.includes('almuerzo')
  ) {
    scenarioKey = 'restaurant_dining';
  } else if (
    title.includes('hotel') ||
    title.includes('reserva') ||
    title.includes('hospedag') ||
    title.includes('check-in') ||
    title.includes('alojamiento')
  ) {
    scenarioKey = 'hotel_reception';
  } else if (
    title.includes('viagem') ||
    title.includes('viaje') ||
    title.includes('aeroporto') ||
    title.includes('aeropuerto') ||
    title.includes('voo') ||
    title.includes('vuelo') ||
    title.includes('embarque') ||
    title.includes('transporte')
  ) {
    scenarioKey = 'travel_airport';
  } else if (
    title.includes('contato') ||
    title.includes('contacto') ||
    title.includes('apresent') ||
    title.includes('presentaci') ||
    title.includes('empresa') ||
    title.includes('saludo') ||
    title.includes('networking') ||
    title.includes('profission')
  ) {
    scenarioKey = 'business_intro';
  } else if (
    title.includes('passad') ||
    title.includes('pasad') ||
    title.includes('ontem') ||
    title.includes('ayer') ||
    title.includes('evento') ||
    title.includes('reuni') ||
    title.includes('projeto') ||
    title.includes('proyecto') ||
    title.includes('prazo')
  ) {
    scenarioKey = 'past_events';
  } else if (
    title.includes('e-mail') ||
    title.includes('email') ||
    title.includes('mensagen') ||
    title.includes('correo')
  ) {
    scenarioKey = 'written_communication';
  }

  return {
    scenarioKey,
    ...MEDIA_REGISTRY[scenarioKey],
  };
}
