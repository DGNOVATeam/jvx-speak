/**
 * Contratos e resolvedor de mídia pedagógica contextualizada por cenário.
 * Cada lição possui sua própria imagem contextual única (sem repetições dentro do curso),
 * funcionando de forma padronizada tanto para Inglês quanto para Espanhol e futuras aulas.
 */
export type ScenarioMediaKey =
  | 'business_intro'
  | 'company_city'
  | 'daily_routine'
  | 'weekly_schedule'
  | 'travel_airport'
  | 'restaurant_dining'
  | 'hotel_reception'
  | 'team_deadlines'
  | 'video_call'
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
    scenarioLabel: 'Networking & Primeiro Contato',
    altText: 'Ilustração contextual de apresentação profissional em ambiente de negócios',
    heroImageUrl: '/media/scenarios/business-networking.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  company_city: {
    scenarioLabel: 'Empresa, Mercado & Cidade',
    altText: 'Executivo apresentando empresa e cidade em escritório corporativo',
    heroImageUrl: '/media/scenarios/company-city.jpg',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  daily_routine: {
    scenarioLabel: 'Rotina & Jornada de Trabalho',
    altText: 'Ilustração contextual de rotina diária e horários de trabalho',
    heroImageUrl: '/media/scenarios/daily-routine-office.webp',
    fallbackGradient: 'from-[#07182E] via-[#0F2D4A] to-[#16375B]',
    accentColor: '#22C9A4',
  },
  weekly_schedule: {
    scenarioLabel: 'Agenda Semanal & Compromissos',
    altText: 'Planejamento de agenda semanal e compromissos executivos',
    heroImageUrl: '/media/scenarios/weekly-schedule.jpg',
    fallbackGradient: 'from-[#07182E] via-[#0F2D4A] to-[#16375B]',
    accentColor: '#22C9A4',
  },
  hotel_reception: {
    scenarioLabel: 'Hotel & Recepção',
    altText: 'Ilustração contextual de check-in, reservas e recepção de hotel',
    heroImageUrl: '/media/scenarios/hotel-reception.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  restaurant_dining: {
    scenarioLabel: 'Bar, Restaurante & Pedidos',
    altText: 'Ilustração contextual de atendimento e pedidos em bar ou restaurante',
    heroImageUrl: '/media/scenarios/restaurant-ordering.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#16375B]',
    accentColor: '#D4AF37',
  },
  travel_airport: {
    scenarioLabel: 'Viagens, Aeroporto & Transporte',
    altText: 'Ilustração contextual de check-in, bagagens e embarque em aeroporto',
    heroImageUrl: '/media/scenarios/airport-checkin.webp',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#1D4ED8]',
    accentColor: '#3B82F6',
  },
  team_deadlines: {
    scenarioLabel: 'Reuniões & Prazos de Entrega',
    altText: 'Equipe alinhando prazos, metas e entregas em reunião presencial',
    heroImageUrl: '/media/scenarios/team-meeting.webp',
    fallbackGradient: 'from-[#07182E] via-[#122D4C] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  video_call: {
    scenarioLabel: 'Videoconferências & Esclarecimentos',
    altText: 'Profissional em videoconferência internacional pedindo esclarecimentos',
    heroImageUrl: '/media/scenarios/video-call.jpg',
    fallbackGradient: 'from-[#07182E] via-[#122D4C] to-[#1F4E79]',
    accentColor: '#3B82F6',
  },
  past_events: {
    scenarioLabel: 'Resultados & Eventos Passados',
    altText: 'Colegas analisando métricas e resultados recentes da semana',
    heroImageUrl: '/media/scenarios/past-results.jpg',
    fallbackGradient: 'from-[#07182E] via-[#122D4C] to-[#1F4E79]',
    accentColor: '#D4AF37',
  },
  written_communication: {
    scenarioLabel: 'E-mails & Mensagens Rápidas',
    altText: 'Profissional confirmando reuniões por mensagem e e-mail',
    heroImageUrl: '/media/scenarios/quick-messages.jpg',
    fallbackGradient: 'from-[#07182E] via-[#102A46] to-[#0F4C5C]',
    accentColor: '#22C9A4',
  },
};

export function resolveLessonMedia(lessonTitle: string): LessonMediaAsset {
  const title = lessonTitle.toLowerCase();

  let scenarioKey: ScenarioMediaKey = 'daily_routine';

  if (
    title.includes('empresa') ||
    title.includes('cidade') ||
    title.includes('ciudad')
  ) {
    scenarioKey = 'company_city';
  } else if (
    title.includes('contato') ||
    title.includes('apresenta') ||
    title.includes('encantado') ||
    title.includes('saludo') ||
    title.includes('networking')
  ) {
    scenarioKey = 'business_intro';
  } else if (
    title.includes('agenda') ||
    title.includes('compromisso') ||
    title.includes('compromiso') ||
    title.includes('semanal')
  ) {
    scenarioKey = 'weekly_schedule';
  } else if (
    title.includes('rotina') ||
    title.includes('jornada') ||
    title.includes('horario')
  ) {
    scenarioKey = 'daily_routine';
  } else if (
    title.includes('hotel') ||
    title.includes('reserva') ||
    title.includes('hospedag') ||
    title.includes('alojamiento')
  ) {
    scenarioKey = 'hotel_reception';
  } else if (
    title.includes('bar') ||
    title.includes('restaurante') ||
    title.includes('café') ||
    title.includes('cafe') ||
    title.includes('pidiendo') ||
    title.includes('pedido') ||
    title.includes('comida')
  ) {
    scenarioKey = 'restaurant_dining';
  } else if (
    title.includes('aeroporto') ||
    title.includes('aeropuerto') ||
    title.includes('viagem') ||
    title.includes('viaje') ||
    title.includes('voo') ||
    title.includes('vuelo') ||
    title.includes('transporte')
  ) {
    scenarioKey = 'travel_airport';
  } else if (
    title.includes('call') ||
    title.includes('videollamada') ||
    title.includes('esclarecimento') ||
    title.includes('aclaracion')
  ) {
    scenarioKey = 'video_call';
  } else if (
    title.includes('prazo') ||
    title.includes('entrega') ||
    title.includes('quedar')
  ) {
    scenarioKey = 'team_deadlines';
  } else if (
    title.includes('ontem') ||
    title.includes('passad') ||
    title.includes('pasad') ||
    title.includes('hemos hecho') ||
    title.includes('esta semana') ||
    title.includes('experi')
  ) {
    scenarioKey = 'past_events';
  } else if (
    title.includes('e-mail') ||
    title.includes('email') ||
    title.includes('correo') ||
    title.includes('mensagem') ||
    title.includes('mensaje') ||
    title.includes('confirmando')
  ) {
    scenarioKey = 'written_communication';
  }

  return {
    scenarioKey,
    ...MEDIA_REGISTRY[scenarioKey],
  };
}
