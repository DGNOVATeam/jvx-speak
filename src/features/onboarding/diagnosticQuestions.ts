import type { UiLocale } from '@/lib/i18n';

export type TargetChoice = 'en' | 'es-ES' | 'both';
export type FocusArea = 'business_entrepreneur' | 'travel' | 'study' | 'tech' | 'general';

export interface DiagnosticQuestion {
  id: string;
  lang: 'en' | 'es-ES';
  level: string;
  question: Record<UiLocale, string>;
  options: Array<{ label: string; correct: boolean }>;
}

const EN_BY_FOCUS: Record<FocusArea, DiagnosticQuestion[]> = {
  business_entrepreneur: [
    {
      id: 'en-biz-1',
      lang: 'en',
      level: 'A1',
      question: {
        'pt-BR': 'Como você se apresenta em inglês dizendo que é fundador de uma empresa?',
        es: '¿Cómo te presentas en inglés diciendo que eres fundador de una empresa?',
        en: 'How do you introduce yourself in English as a company founder?',
      },
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
      question: {
        'pt-BR': 'Qual frase descreve corretamente sua rotina de trabalho?',
        es: '¿Qué frase describe correctamente tu rutina habitual de trabajo?',
        en: 'Which sentence correctly describes your usual work routine?',
      },
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
      question: {
        'pt-BR': 'Como pedir educadamente que alguém envie um relatório até sexta-feira?',
        es: '¿Cómo pedir educadamente que alguien envíe un informe antes del viernes?',
        en: 'How do you politely ask someone to send a report by Friday?',
      },
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
      question: {
        'pt-BR': 'Como você diz no balcão do hotel que tem uma reserva?',
        es: '¿Cómo dices en la recepción del hotel que tienes una reserva?',
        en: 'How do you say at a hotel desk that you have a reservation?',
      },
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
      question: {
        'pt-BR': 'Como perguntar educadamente onde fica o portão de embarque no aeroporto?',
        es: '¿Cómo preguntar educadamente dónde está la puerta de embarque en el aeropuerto?',
        en: 'How do you politely ask where the boarding gate is at the airport?',
      },
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
      question: {
        'pt-BR': 'Como pedir a conta de forma educada em um restaurante?',
        es: '¿Cómo pedir la cuenta educadamente en un restaurante?',
        en: 'How do you politely ask for the bill at a restaurant?',
      },
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
      question: {
        'pt-BR': 'Como você se apresenta para um professor ou colega de curso?',
        es: '¿Cómo te presentas a un profesor o compañero de clase?',
        en: 'How do you introduce yourself to a teacher or classmate?',
      },
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
      question: {
        'pt-BR': 'Como dizer que você não entendeu uma explicação na aula?',
        es: '¿Cómo decir que no entendiste una explicación en clase?',
        en: 'How do you ask a teacher to repeat an explanation?',
      },
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
      question: {
        'pt-BR': 'Como perguntar qual é a data de entrega de um trabalho?',
        es: '¿Cómo preguntar cuál es la fecha límite de entrega de un trabajo?',
        en: 'How do you ask when an assignment is due?',
      },
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
      question: {
        'pt-BR': 'Como você explica sua área em uma equipe de tecnologia?',
        es: '¿Cómo explicas tu área en un equipo de tecnología?',
        en: 'How do you explain your role in a tech team?',
      },
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
      question: {
        'pt-BR': 'Como dizer na daily que você está corrigindo um problema hoje?',
        es: '¿Cómo decir en la reunión diaria que hoy estás corrigiendo un error?',
        en: 'How do you say in a daily stand-up that you are fixing a bug today?',
      },
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
      question: {
        'pt-BR': 'Como avisar o time que você terminou a tarefa ontem?',
        es: '¿Cómo avisar al equipo que terminaste el despliegue ayer?',
        en: 'How do you tell the team you finished a task yesterday?',
      },
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
      question: {
        'pt-BR': 'Como você cumprimenta alguém e pergunta como a pessoa está?',
        es: '¿Cómo saludas a alguien y le preguntas cómo está?',
        en: 'How do you greet someone and ask how they are?',
      },
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
      question: {
        'pt-BR': 'Qual frase expressa corretamente algo que você costuma fazer todo dia?',
        es: '¿Qué frase expresa correctamente algo que sueles hacer cada mañana?',
        en: 'Which sentence correctly expresses a daily habit?',
      },
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
      question: {
        'pt-BR': 'Como convidar um amigo para tomar um café no fim de semana?',
        es: '¿Cómo invitar a un amigo a tomar un café este fin de semana?',
        en: 'How do you invite a friend for coffee this weekend?',
      },
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
      question: {
        'pt-BR': 'Como você se apresenta no espanhol da Espanha dizendo sua profissão?',
        es: '¿Cuál es la forma correcta de presentarte diciendo tu profesión en España?',
        en: 'How do you introduce your profession in Peninsular Spanish?',
      },
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
      question: {
        'pt-BR': 'Qual frase está natural na Espanha para falar da rotina de reuniões?',
        es: '¿Qué frase es más natural en España para hablar de tu rutina de reuniones?',
        en: 'Which sentence is natural in Spain for describing morning meetings?',
      },
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
      question: {
        'pt-BR': 'Como pedir formalmente confirmação de uma reunião (Espanha)?',
        es: '¿Cómo pedir formalmente confirmación de una reunión en España?',
        en: 'How do you formally ask to confirm a meeting time in Spain?',
      },
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
      question: {
        'pt-BR': 'Como você diz na recepção de um hotel em Madrid que tem reserva?',
        es: '¿Cómo dices en la recepción de un hotel en Madrid que tienes reserva?',
        en: 'How do you say at a Madrid hotel desk that you have a reservation?',
      },
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
      question: {
        'pt-BR': 'Como perguntar onde fica a estação de metrô mais próxima na Espanha?',
        es: '¿Cómo preguntar dónde está la estación de metro más cercana en España?',
        en: 'How do you ask where the nearest metro station is in Spain?',
      },
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
      question: {
        'pt-BR': 'Como pedir a conta em um restaurante na Espanha?',
        es: '¿Cómo pedir la cuenta en un restaurante en España?',
        en: 'How do you ask for the check at a restaurant in Spain?',
      },
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
      question: {
        'pt-BR': 'Como você se apresenta em uma aula de espanhol?',
        es: '¿Cómo te presentas en una clase de español?',
        en: 'How do you introduce yourself in a Spanish class?',
      },
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
      question: {
        'pt-BR': 'Como pedir ao professor para falar mais devagar?',
        es: '¿Cómo pedir al profesor que hable más despacio?',
        en: 'How do you ask the teacher to speak more slowly?',
      },
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
      question: {
        'pt-BR': 'Como perguntar qual é a data de entrega de um trabalho acadêmico?',
        es: '¿Cómo preguntar cuál es la fecha límite para entregar un trabajo?',
        en: 'How do you ask what the deadline is for an academic assignment?',
      },
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
      question: {
        'pt-BR': 'Como dizer que você trabalha com desenvolvimento de software na Espanha?',
        es: '¿Cómo decir que trabajas en desarrollo de software en España?',
        en: 'How do you say you work in software development in Spanish?',
      },
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
      question: {
        'pt-BR': 'Como dizer em uma reunião técnica que hoje você revisa o projeto?',
        es: '¿Cómo decir en una reunión técnica que hoy revisas el proyecto?',
        en: 'How do you say in a tech meeting that you are reviewing the project today?',
      },
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
      question: {
        'pt-BR': 'Como informar que a equipe finalizou a entrega ontem?',
        es: '¿Cómo informar que el equipo finalizó la entrega ayer?',
        en: 'How do you report that the team finished the delivery yesterday?',
      },
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
      question: {
        'pt-BR': 'Como cumprimentar alguém educadamente e dizer muito prazer na Espanha?',
        es: '¿Cómo saludar educadamente y decir "mucho gusto" en España?',
        en: 'How do you greet someone politely and say nice to meet you in Spain?',
      },
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
      question: {
        'pt-BR': 'Qual frase está natural para falar do que você faz todos os dias?',
        es: '¿Qué frase es natural para hablar de tu rutina diaria?',
        en: 'Which sentence is natural for talking about your daily routine?',
      },
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
      question: {
        'pt-BR': 'Como convidar um amigo para tomar um café no fim de semana na Espanha?',
        es: '¿Cómo invitar a un amigo a tomar un café este fin de semana en España?',
        en: 'How do you invite a friend for coffee this weekend in Spain?',
      },
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
