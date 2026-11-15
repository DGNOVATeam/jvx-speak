export type TargetChoice = 'en' | 'es-ES' | 'both';
export type FocusArea = 'business_entrepreneur' | 'travel' | 'study' | 'tech' | 'general';

export interface DiagnosticQuestion {
  id: string;
  lang: 'en' | 'es-ES';
  level: string;
  question: string;
  options: Array<{ label: string; correct: boolean }>;
}

const EN_BY_FOCUS: Record<FocusArea, DiagnosticQuestion[]> = {
  business_entrepreneur: [
    {
      id: 'en-biz-1',
      lang: 'en',
      level: 'A1',
      question: 'Como você se apresenta em inglês dizendo que é fundador de uma empresa?',
      options: [
        { label: 'I am the founder of my company.', correct: true },
        { label: 'I have founder in my company.', correct: false },
        { label: 'Me founder of company.', correct: false },
      ],
    },
    {
      id: 'en-biz-2',
      lang: 'en',
      level: 'A1',
      question: 'Qual frase descreve corretamente sua rotina de trabalho?',
      options: [
        { label: 'I usually start work at 8 a.m.', correct: true },
        { label: 'I starting work at 8 a.m. usually.', correct: false },
        { label: 'I am start work at 8 a.m.', correct: false },
      ],
    },
    {
      id: 'en-biz-3',
      lang: 'en',
      level: 'A2',
      question: 'Como pedir educadamente que alguém envie um relatório até sexta-feira?',
      options: [
        { label: 'Could you send the report by Friday?', correct: true },
        { label: 'You send report in Friday.', correct: false },
        { label: 'Can you sending report until Friday?', correct: false },
      ],
    },
  ],
  travel: [
    {
      id: 'en-trv-1',
      lang: 'en',
      level: 'A1',
      question: 'Como você diz no balcão do hotel que tem uma reserva?',
      options: [
        { label: 'Hello, I have a reservation under Silva.', correct: true },
        { label: 'Hello, I am with reserve in Silva.', correct: false },
        { label: 'I want my room key now, give me.', correct: false },
      ],
    },
    {
      id: 'en-trv-2',
      lang: 'en',
      level: 'A1',
      question: 'Como perguntar educadamente onde fica o portão de embarque no aeroporto?',
      options: [
        { label: 'Excuse me, where is gate 12?', correct: true },
        { label: 'Where stay the door of airplane?', correct: false },
        { label: 'You tell me where gate 12 is?', correct: false },
      ],
    },
    {
      id: 'en-trv-3',
      lang: 'en',
      level: 'A2',
      question: 'Como pedir a conta ou um café de forma educada em um restaurante?',
      options: [
        { label: 'Could I have the bill, please?', correct: true },
        { label: 'Give to me the account please.', correct: false },
        { label: 'I wanting pay now.', correct: false },
      ],
    },
  ],
  study: [
    {
      id: 'en-std-1',
      lang: 'en',
      level: 'A1',
      question: 'Como você se apresenta para um professor ou colega de curso?',
      options: [
        { label: 'Hi, I am studying business and I am from Brazil.', correct: true },
        { label: 'Hi, I study in business and am of Brazil.', correct: false },
        { label: 'Me studying business Brazil.', correct: false },
      ],
    },
    {
      id: 'en-std-2',
      lang: 'en',
      level: 'A1',
      question: 'Como dizer que você não entendeu uma explicação na aula?',
      options: [
        { label: 'Sorry, could you repeat that, please?', correct: true },
        { label: 'No understand, speak again.', correct: false },
        { label: 'I am not understanding nothing.', correct: false },
      ],
    },
    {
      id: 'en-std-3',
      lang: 'en',
      level: 'A2',
      question: 'Como perguntar qual é a data de entrega de um trabalho?',
      options: [
        { label: 'When is the deadline for this assignment?', correct: true },
        { label: 'What day finish the homework?', correct: false },
        { label: 'When we must to deliver the work?', correct: false },
      ],
    },
  ],
  tech: [
    {
      id: 'en-tch-1',
      lang: 'en',
      level: 'A1',
      question: 'Como você explica sua área em uma equipe de tecnologia?',
      options: [
        { label: 'I work with software development and product.', correct: true },
        { label: 'I working in software and products.', correct: false },
        { label: 'My work is software develop.', correct: false },
      ],
    },
    {
      id: 'en-tch-2',
      lang: 'en',
      level: 'A1',
      question: 'Como dizer na daily que você está corrigindo um problema hoje?',
      options: [
        { label: 'Today I am fixing a bug in the login screen.', correct: true },
        { label: 'Today I fix bug in screen login.', correct: false },
        { label: 'I am fix the bug today.', correct: false },
      ],
    },
    {
      id: 'en-tch-3',
      lang: 'en',
      level: 'A2',
      question: 'Como avisar o time que você terminou a tarefa ontem?',
      options: [
        { label: 'I finished the deployment yesterday afternoon.', correct: true },
        { label: 'I finish the deployment yesterday.', correct: false },
        { label: 'Yesterday I was finish the deployment.', correct: false },
      ],
    },
  ],
  general: [
    {
      id: 'en-gen-1',
      lang: 'en',
      level: 'A1',
      question: 'Como você cumprimenta alguém e pergunta como a pessoa está?',
      options: [
        { label: 'Hi! Nice to meet you. How are you?', correct: true },
        { label: 'Hi! Good meet you. How you is?', correct: false },
        { label: 'Hello, what is your stay?', correct: false },
      ],
    },
    {
      id: 'en-gen-2',
      lang: 'en',
      level: 'A1',
      question: 'Qual frase expressa corretamente algo que você costuma fazer todo dia?',
      options: [
        { label: 'I usually drink coffee in the morning.', correct: true },
        { label: 'I drink coffee in morning usually.', correct: false },
        { label: 'I am drink coffee every morning.', correct: false },
      ],
    },
    {
      id: 'en-gen-3',
      lang: 'en',
      level: 'A2',
      question: 'Como convidar um amigo para tomar um café no fim de semana?',
      options: [
        { label: 'Would you like to grab a coffee this weekend?', correct: true },
        { label: 'You want take coffee in weekend?', correct: false },
        { label: 'Let’s to go drink coffee weekend.', correct: false },
      ],
    },
  ],
};

const ES_BY_FOCUS: Record<FocusArea, DiagnosticQuestion[]> = {
  business_entrepreneur: [
    {
      id: 'es-biz-1',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como você se apresenta no espanhol da Espanha dizendo sua profissão?',
      options: [
        { label: 'Soy fundador de una empresa de tecnología.', correct: true },
        { label: 'Yo soy un fundador en empresa.', correct: false },
        { label: 'Estoy fundador de una empresa.', correct: false },
      ],
    },
    {
      id: 'es-biz-2',
      lang: 'es-ES',
      level: 'A1',
      question: 'Qual frase está natural na Espanha para falar da rotina de reuniões?',
      options: [
        { label: 'Por la mañana tengo reuniones con mi equipo.', correct: true },
        { label: 'En la mañana yo tengo reunión en las nueve.', correct: false },
        { label: 'De mañana estoy teniendo reuniones.', correct: false },
      ],
    },
    {
      id: 'es-biz-3',
      lang: 'es-ES',
      level: 'A2',
      question: 'Como pedir formalmente confirmação de uma reunião (Espanha)?',
      options: [
        { label: '¿Podría confirmarme la hora de la reunión, por favor?', correct: true },
        { label: '¿Tú puedes confirmar para mí la hora ahora?', correct: false },
        { label: 'Confirma usted la reunión en viernes.', correct: false },
      ],
    },
  ],
  travel: [
    {
      id: 'es-trv-1',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como você diz na recepção de um hotel em Madrid que tem reserva?',
      options: [
        { label: 'Buenos días, tengo una reserva a nombre de Silva.', correct: true },
        { label: 'Buen día, yo tengo reservación en nombre Silva.', correct: false },
        { label: 'Quiero mi habitación ahora, por favor.', correct: false },
      ],
    },
    {
      id: 'es-trv-2',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como perguntar onde fica a estação de metrô mais próxima na Espanha?',
      options: [
        { label: 'Disculpe, ¿dónde está la estación de metro más cercana?', correct: true },
        { label: '¿Dónde queda el tren de abajo cerca?', correct: false },
        { label: 'Habla para mí dónde está el metro.', correct: false },
      ],
    },
    {
      id: 'es-trv-3',
      lang: 'es-ES',
      level: 'A2',
      question: 'Como pedir a conta em um restaurante na Espanha?',
      options: [
        { label: '¿Nos trae la cuenta, por favor?', correct: true },
        { label: 'Me da la nota para pagar.', correct: false },
        { label: 'Yo quiero pagar la propina ahora.', correct: false },
      ],
    },
  ],
  study: [
    {
      id: 'es-std-1',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como você se apresenta em uma aula de espanhol?',
      options: [
        { label: 'Hola, soy de Brasil y estudio español.', correct: true },
        { label: 'Hola, estoy de Brasil y estudiando español.', correct: false },
        { label: 'Yo soy brasileño, estudio en español.', correct: false },
      ],
    },
    {
      id: 'es-std-2',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como pedir ao professor para falar mais devagar?',
      options: [
        { label: 'Perdón, ¿puede hablar más despacio, por favor?', correct: true },
        { label: 'Habla más devagar, no entiendo.', correct: false },
        { label: 'Repite otra vez más lento.', correct: false },
      ],
    },
    {
      id: 'es-std-3',
      lang: 'es-ES',
      level: 'A2',
      question: 'Como perguntar qual é a data de entrega de um trabalho acadêmico?',
      options: [
        { label: '¿Cuál es la fecha límite para entregar el trabajo?', correct: true },
        { label: '¿Cuándo nosotros damos el trabajo?', correct: false },
        { label: '¿Qué día termina la tarea en escuela?', correct: false },
      ],
    },
  ],
  tech: [
    {
      id: 'es-tch-1',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como dizer que você trabalha com desenvolvimento de software na Espanha?',
      options: [
        { label: 'Trabajo en desarrollo de software y producto.', correct: true },
        { label: 'Yo trabajo con desenvolver software.', correct: false },
        { label: 'Mi trabajo es en una oficina mecánica de software.', correct: false },
      ],
    },
    {
      id: 'es-tch-2',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como dizer em uma reunião técnica que hoje você revisa o projeto?',
      options: [
        { label: 'Hoy reviso los correos y el estado del proyecto.', correct: true },
        { label: 'Hoy estoy mirando los emails de proyecto.', correct: false },
        { label: 'Yo revisando el proyecto hoy.', correct: false },
      ],
    },
    {
      id: 'es-tch-3',
      lang: 'es-ES',
      level: 'A2',
      question: 'Como informar que a equipe finalizou a entrega ontem?',
      options: [
        { label: 'Ayer terminamos la entrega a tiempo.', correct: true },
        { label: 'Ayer nosotros terminamos en tiempo.', correct: false },
        { label: 'Ayer hemos terminar la entrega.', correct: false },
      ],
    },
  ],
  general: [
    {
      id: 'es-gen-1',
      lang: 'es-ES',
      level: 'A1',
      question: 'Como cumprimentar alguém educadamente e dizer muito prazer na Espanha?',
      options: [
        { label: '¡Hola! Encantado de conocerte. ¿Qué tal?', correct: true },
        { label: '¡Hola! Muy prazer en conocer tú.', correct: false },
        { label: 'Buenos días, ¿cómo tú estás?', correct: false },
      ],
    },
    {
      id: 'es-gen-2',
      lang: 'es-ES',
      level: 'A1',
      question: 'Qual frase está natural para falar do que você faz todos os dias?',
      options: [
        { label: 'Normalmente desayuno a las ocho de la mañana.', correct: true },
        { label: 'Normalmente tomo café en las ocho.', correct: false },
        { label: 'Yo desayuno siempre en la mañana.', correct: false },
      ],
    },
    {
      id: 'es-gen-3',
      lang: 'es-ES',
      level: 'A2',
      question: 'Como convidar um amigo para tomar um café no fim de semana na Espanha?',
      options: [
        { label: '¿Te apetece tomar un café este fin de semana?', correct: true },
        { label: '¿Tú quieres beber café en el final de semana?', correct: false },
        { label: 'Vamos tomar café en sábado.', correct: false },
      ],
    },
  ],
};

export function getDiagnosticQuestions(
  targetChoice: TargetChoice,
  focusArea: FocusArea
): DiagnosticQuestion[] {
  const enList = EN_BY_FOCUS[focusArea];
  const esList = ES_BY_FOCUS[focusArea];
  if (targetChoice === 'en') return enList;
  if (targetChoice === 'es-ES') return esList;
  return [enList[0], enList[2], esList[0], esList[2]];
}
