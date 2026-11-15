export interface WordItem {
  en: string;
  pt: string;
}

export interface GlossaryGroup {
  category: string;
  items: Array<{ term: string; pt: string; example?: string }>;
}

export interface GrammarRule {
  title: string;
  explanation: string;
  dontSay: string;
  sayInstead: string;
  audioExample: string;
}

export interface LessonPedagogy {
  quickWords: WordItem[];
  glossary: GlossaryGroup[];
  grammarRules: GrammarRule[];
}

export interface FixationChallenge {
  id: string;
  type: 'order' | 'listen' | 'cloze';
  promptPt: string;
  targetText: string;
  audioText?: string;
  tokens?: string[];
  options?: Array<{ label: string; isCorrect: boolean }>;
  clozeSentence?: string;
}

function getNativeInterferenceRules(
  targetLang: 'en' | 'es-ES',
  nativeLang: 'pt-BR' | 'es' | 'en'
): GrammarRule[] {
  if (targetLang === 'en' && nativeLang === 'es') {
    return [
      {
        title: 'Dica para Hispanofalantes: Sujeito obrigatório ("It is")',
        explanation:
          'En español puedes omitir el sujeto ("Es importante" / "Está lloviendo"), pero en inglés SIEMPRE debes incluir "It" antes del verbo.',
        dontSay: 'Is very important. / Is raining.',
        sayInstead: 'It is very important. / It is raining.',
        audioExample: 'It is very important to start on time.',
      },
      {
        title: 'Dica para Hispanofalantes: "I agree" e "People are"',
        explanation:
          'Evita traducir literal del español: en inglés "agree" es verbo (no lleva "am") y "people" siempre es plural ("are", no "is").',
        dontSay: 'I am agree. / People is busy.',
        sayInstead: 'I agree. / People are busy.',
        audioExample: 'I agree with you, people are very busy today.',
      },
    ];
  }

  if (targetLang === 'es-ES' && nativeLang === 'pt-BR') {
    return [
      {
        title: 'Alerta de Portunhol: Falsos Cognatos (Oficina / Exquisito)',
        explanation:
          'Para brasileiros: "oficina" em espanhol significa ESCRITÓRIO (não oficina mecânica), e "exquisito" significa DELICIOSO (não estranho).',
        dontSay: 'Trabajo en un escritório. / La comida está deliciosa (estranha).',
        sayInstead: 'Trabajo en una oficina. / La comida está exquisita.',
        audioExample: 'Trabajo en una oficina en el centro de Madrid.',
      },
    ];
  }

  if (targetLang === 'es-ES' && nativeLang === 'en') {
    return [
      {
        title: 'Tip for English Speakers: SER (identity) vs. ESTAR (state)',
        explanation:
          'Use SER for permanent traits, profession, and origin ("Soy fundador"), and ESTAR for location or temporary states ("Estoy en Madrid").',
        dontSay: 'Estoy ingeniero. / Soy en la oficina.',
        sayInstead: 'Soy ingeniero. / Estoy en la oficina.',
        audioExample: 'Soy ingeniero y hoy estoy en la oficina.',
      },
    ];
  }

  return [];
}

export function getLessonPedagogy(
  lessonTitle: string,
  targetLang: 'en' | 'es-ES',
  nativeLang: 'pt-BR' | 'es' | 'en' = 'pt-BR'
): LessonPedagogy {
  const base = getBaseLessonPedagogy(lessonTitle, targetLang);
  const extraRules = getNativeInterferenceRules(targetLang, nativeLang);
  return {
    ...base,
    grammarRules: [...extraRules, ...base.grammarRules],
  };
}

function getBaseLessonPedagogy(
  lessonTitle: string,
  targetLang: 'en' | 'es-ES'
): LessonPedagogy {
  const title = lessonTitle.toLowerCase();
  const isEs = targetLang === 'es-ES';

  if (isEs) {
    if (title.includes('presentaci') || title.includes('saludo') || title.includes('empresa')) {
      return {
        quickWords: [
          { en: 'mucho gusto', pt: 'muito prazer' },
          { en: 'mi empresa', pt: 'minha empresa' },
          { en: 'trabajo en', pt: 'trabalho em' },
          { en: 'soy de Brasil', pt: 'sou do Brasil' },
          { en: 'encantado', pt: 'prazer em conhecer' },
          { en: 'socio', pt: 'sócio' },
        ],
        glossary: [
          {
            category: 'Cumprimentos & Cortesia',
            items: [
              { term: '¡Buenos días!', pt: 'Bom dia!', example: '¡Buenos días, equipo!' },
              { term: '¡Buenas tardes!', pt: 'Boa tarde!', example: '¡Buenas tardes, señor García!' },
              { term: 'Encantado / Encantada', pt: 'Muito prazer', example: 'Encantado de conocerle.' },
              { term: '¿Cómo estás? / ¿Cómo está usted?', pt: 'Como vai? (informal / formal)' },
            ],
          },
          {
            category: 'Profissão & Empresa',
            items: [
              { term: 'fundador / fundadora', pt: 'fundador(a)', example: 'Soy fundador de una startup.' },
              { term: 'gerente / director', pt: 'gerente / diretor' },
              { term: 'tecnología', pt: 'tecnologia' },
              { term: 'cliente', pt: 'cliente' },
              { term: 'equipo', pt: 'equipe' },
              { term: 'reunión', pt: 'reunião' },
            ],
          },
        ],
        grammarRules: [
          {
            title: 'Tú (informal) vs. Usted (formal na Espanha)',
            explanation:
              'Na Espanha, use "tú" com colegas e jovens, e "usted" com clientes novos ou pessoas mais velhas em contextos formais.',
            dontSay: '¿Cómo te llamas usted?',
            sayInstead: '¿Cómo se llama usted? / ¿Cómo te llamas?',
            audioExample: '¿Cómo se llama usted? Mucho gusto.',
          },
          {
            title: 'Verbo SER para profissão e origem (sem artigo)',
            explanation:
              'Em espanhol, ao dizer sua profissão com o verbo "ser", não se usa "un/una" antes do cargo.',
            dontSay: 'Yo soy un ingeniero.',
            sayInstead: 'Soy ingeniero. / Soy fundador.',
            audioExample: 'Soy fundador de una empresa de tecnología.',
          },
        ],
      };
    }

    return {
      quickWords: [
        { en: 'por la mañana', pt: 'de manhã' },
        { en: 'por la tarde', pt: 'à tarde' },
        { en: 'todos los días', pt: 'todos os dias' },
        { en: 'reunión', pt: 'reunião' },
        { en: 'correo', pt: 'e-mail' },
        { en: 'proyecto', pt: 'projeto' },
      ],
      glossary: [
        {
          category: 'Tempo & Rotina (Espanha)',
          items: [
            { term: 'por la mañana', pt: 'pela manhã', example: 'Trabajo por la mañana.' },
            { term: 'por la tarde', pt: 'à tarde' },
            { term: 'a las nueve', pt: 'às nove horas' },
            { term: 'normalmente', pt: 'normalmente' },
            { term: 'siempre / nunca', pt: 'sempre / nunca' },
          ],
        },
        {
          category: 'Ações & Vocabulário Útil',
          items: [
            { term: 'empezar', pt: 'começar', example: 'Empiezo a trabajar a las ocho.' },
            { term: 'revisar el correo', pt: 'checar os e-mails' },
            { term: 'hablar con el equipo', pt: 'falar com a equipe' },
            { term: 'descansar', pt: 'descansar' },
          ],
        },
      ],
      grammarRules: [
        {
          title: 'Horas com "a la / a las"',
          explanation:
            'Para dizer a que horas algo acontece em espanhol, use "a la una" (1h, singular) e "a las..." para todas as outras horas.',
          dontSay: 'Empiezo en las ocho.',
          sayInstead: 'Empiezo a las ocho.',
          audioExample: 'Normalmente empiezo a las ocho de la mañana.',
        },
        {
          title: 'Períodos do dia usam "por la"',
          explanation:
            'Diferente do português ("de manhã"), na Espanha o mais natural para rotina é "por la mañana / por la tarde / por la noche".',
          dontSay: 'En la mañana tengo reuniones.',
          sayInstead: 'Por la mañana tengo reuniones.',
          audioExample: 'Por la mañana tengo reuniones con el equipo.',
        },
      ],
    };
  }

  // Inglês CEFR
  if (title.includes('contato') || title.includes('apresent') || title.includes('empresa') || title.includes('cidade')) {
    return {
      quickWords: [
        { en: 'founder', pt: 'fundador(a)' },
        { en: 'company', pt: 'empresa' },
        { en: 'software', pt: 'software' },
        { en: 'from Brazil', pt: 'do Brasil' },
        { en: 'manager', pt: 'gerente' },
        { en: 'pleased to meet you', pt: 'prazer em conhecê-lo' },
      ],
      glossary: [
        {
          category: 'Apresentações & Networking',
          items: [
            { term: 'Nice to meet you', pt: 'Prazer em conhecê-lo(a)', example: 'Hi, I am Valter. Nice to meet you!' },
            { term: 'What do you do?', pt: 'O que você faz? / Qual sua profissão?' },
            { term: 'I am based in...', pt: 'Eu moro / fico baseado em...', example: 'I am based in São Paulo.' },
            { term: 'Let’s keep in touch', pt: 'Vamos manter contato' },
          ],
        },
        {
          category: 'Cargos & Áreas de Negócio',
          items: [
            { term: 'founder / CEO', pt: 'fundador(a) / diretor(a) executivo(a)' },
            { term: 'business owner', pt: 'empresário(a)' },
            { term: 'sales / marketing', pt: 'vendas / marketing' },
            { term: 'software / technology', pt: 'software / tecnologia' },
            { term: 'colleague / partner', pt: 'colega / sócio(a)' },
          ],
        },
      ],
      grammarRules: [
        {
          title: 'Use "a / an" antes da profissão',
          explanation:
            'Em inglês, diferente do português, você sempre precisa colocar "a" ou "an" antes da profissão ou cargo.',
          dontSay: 'I am manager. / I am engineer.',
          sayInstead: 'I am a manager. / I am an engineer.',
          audioExample: 'I am a founder and I work with software.',
        },
        {
          title: 'Perguntando a profissão com "What do you do?"',
          explanation:
            'Nativos raramente perguntam "What is your profession?". A forma natural no dia a dia e em eventos é "What do you do?".',
          dontSay: 'What is your work?',
          sayInstead: 'What do you do?',
          audioExample: 'Nice to meet you! What do you do?',
        },
      ],
    };
  }

  if (title.includes('viagem') || title.includes('aeroporto') || title.includes('hotel')) {
    return {
      quickWords: [
        { en: 'reservation', pt: 'reserva' },
        { en: 'passport', pt: 'passaporte' },
        { en: 'boarding pass', pt: 'cartão de embarque' },
        { en: 'check-in', pt: 'check-in' },
        { en: 'room key', pt: 'chave do quarto' },
        { en: 'gate', pt: 'portão de embarque' },
      ],
      glossary: [
        {
          category: 'Aeroporto & Voo',
          items: [
            { term: 'boarding pass', pt: 'cartão de embarque', example: 'Here is my boarding pass.' },
            { term: 'departure gate', pt: 'portão de embarque' },
            { term: 'luggage / baggage', pt: 'bagagem / mala' },
            { term: 'delayed / on time', pt: 'atrasado / no horário' },
          ],
        },
        {
          category: 'Hotel & Pedidos Educados',
          items: [
            { term: 'I have a reservation under...', pt: 'Tenho uma reserva em nome de...' },
            { term: 'Could I have...?', pt: 'Eu poderia pegar/ter...?', example: 'Could I have my room key, please?' },
            { term: 'breakfast included', pt: 'café da manhã incluso' },
            { term: 'late check-out', pt: 'saída após o horário' },
          ],
        },
      ],
      grammarRules: [
        {
          title: 'Pedidos educados: use "Could I..." ou "I’d like..."',
          explanation:
            'Em hotéis e aeroportos, evite pedir de forma direta como "Give me". Use "Could I have...?" ou "I would like..." para soar educado.',
          dontSay: 'Give me the room key.',
          sayInstead: 'Could I have the room key, please?',
          audioExample: 'Hello, I have a reservation. Could I have my room key, please?',
        },
        {
          title: '"Reservation under + nome"',
          explanation:
            'Para dizer em nome de quem está a reserva de hotel ou mesa, a preposição correta em inglês é "under".',
          dontSay: 'Reservation in name of Silva.',
          sayInstead: 'I have a reservation under Silva.',
          audioExample: 'I have a reservation under Valter.',
        },
      ],
    };
  }

  if (title.includes('passad') || title.includes('ontem') || title.includes('evento')) {
    return {
      quickWords: [
        { en: 'yesterday', pt: 'ontem' },
        { en: 'last week', pt: 'semana passada' },
        { en: 'we finished', pt: 'nós terminamos' },
        { en: 'I sent', pt: 'eu enviei' },
        { en: 'we had a meeting', pt: 'tivemos uma reunião' },
        { en: 'it went well', pt: 'correu bem' },
      ],
      glossary: [
        {
          category: 'Marcadores de Passado',
          items: [
            { term: 'yesterday', pt: 'ontem', example: 'I called the client yesterday.' },
            { term: 'last week / last month', pt: 'semana passada / mês passado' },
            { term: 'two days ago', pt: 'dois dias atrás' },
          ],
        },
        {
          category: 'Verbos Muito Usados no Passado',
          items: [
            { term: 'worked / finished / started', pt: 'trabalhei / terminei / comecei (regulares -ed)' },
            { term: 'went (go)', pt: 'fui / foi' },
            { term: 'had (have)', pt: 'tive / tivemos' },
            { term: 'sent (send)', pt: 'enviei / enviou' },
          ],
        },
      ],
      grammarRules: [
        {
          title: 'Verbos regulares no passado terminam em "-ed"',
          explanation:
            'Para ações concluídas no passado, a maioria dos verbos recebe "-ed" no final (work -> worked, finish -> finished) para todas as pessoas.',
          dontSay: 'Yesterday I finish the report.',
          sayInstead: 'Yesterday I finished the report.',
          audioExample: 'Yesterday we finished the project on time.',
        },
        {
          title: 'Nas perguntas no passado, o verbo volta ao normal',
          explanation:
            'Quando usar "Did" na pergunta ou "didn’t" na negativa, não coloque "-ed" no verbo principal.',
          dontSay: 'Did you worked yesterday?',
          sayInstead: 'Did you work yesterday?',
          audioExample: 'Did you send the email yesterday?',
        },
      ],
    };
  }

  // Padrão para Rotinas, Trabalho, Agenda e E-mails (Inglês)
  return {
    quickWords: [
      { en: 'at 8 a.m.', pt: 'às 8h' },
      { en: 'in the morning', pt: 'de manhã' },
      { en: 'in the afternoon', pt: 'à tarde' },
      { en: 'usually', pt: 'geralmente' },
      { en: 'client', pt: 'cliente' },
      { en: 'team', pt: 'equipe' },
      { en: 'deadline', pt: 'prazo' },
    ],
    glossary: [
      {
        category: 'Horários & Frequência',
        items: [
          { term: 'usually / always / sometimes', pt: 'geralmente / sempre / às vezes' },
          { term: 'every day / every week', pt: 'todos os dias / toda semana' },
          { term: 'at 8 a.m. / at noon', pt: 'às 8h / ao meio-dia' },
          { term: 'in the morning / afternoon', pt: 'de manhã / à tarde' },
        ],
      },
      {
        category: 'Rotina Profissional',
        items: [
          { term: 'check my emails', pt: 'checar meus e-mails', example: 'I check my emails every morning.' },
          { term: 'have a meeting', pt: 'ter uma reunião' },
          { term: 'work with a team', pt: 'trabalhar com uma equipe' },
          { term: 'meet a deadline', pt: 'cumprir um prazo' },
        ],
      },
    ],
    grammarRules: [
      {
        title: 'Posição do advérbio de frequência (usually, always)',
        explanation:
          'Palavras como "usually", "always" e "never" ficam sempre ANTES do verbo de ação principal (e depois de am/is/are).',
        dontSay: 'I start usually work at 8.',
        sayInstead: 'I usually start work at 8.',
        audioExample: 'I usually start work at 8 a.m.',
      },
      {
        title: 'Preposições de tempo: AT (hora) vs. IN (período)',
        explanation:
          'Use "AT" para horários exatos (at 8 a.m., at noon) e "IN" para partes do dia (in the morning, in the afternoon). Exceção: "at night".',
        dontSay: 'I work in 8 a.m. / on the morning.',
        sayInstead: 'I work at 8 a.m. in the morning.',
        audioExample: 'In the morning, I have meetings at 9 a.m.',
      },
    ],
  };
}

export function buildFixationChallenges(
  chunks: Array<{ chunk: string; pt: string }>,
  quickWords: WordItem[]
): FixationChallenge[] {
  const challenges: FixationChallenge[] = [];
  const first = chunks[0];
  const second = chunks[1] ?? chunks[0];
  const third = chunks[2] ?? chunks[0];

  if (first) {
    const cleanWords = first.chunk.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    const shuffled = [...cleanWords].sort((a, b) => a.localeCompare(b));
    if (shuffled.join(' ') === cleanWords.join(' ') && shuffled.length > 1) {
      shuffled.reverse();
    }
    challenges.push({
      id: 'order-1',
      type: 'order',
      promptPt: `Monte a frase que significa: "${first.pt}"`,
      targetText: cleanWords.join(' '),
      audioText: first.chunk,
      tokens: shuffled,
    });
  }

  if (second) {
    const distractors = chunks
      .filter((c) => c.chunk !== second.chunk)
      .slice(0, 2)
      .map((c) => ({ label: c.pt, isCorrect: false }));
    if (distractors.length < 2 && quickWords[0]) {
      distractors.push({ label: quickWords[0].pt, isCorrect: false });
    }
    const opts = [{ label: second.pt, isCorrect: true }, ...distractors].sort((a, b) =>
      a.label.localeCompare(b.label)
    );
    challenges.push({
      id: 'listen-1',
      type: 'listen',
      promptPt: 'Ouça o áudio e escolha a tradução correta:',
      targetText: second.pt,
      audioText: second.chunk,
      options: opts,
    });
  }

  if (third) {
    const words = third.chunk.replace(/[.,!?]/g, '').split(/\s+/).filter(Boolean);
    const targetIdx = Math.min(Math.max(1, Math.floor(words.length / 2)), words.length - 1);
    const missing = words[targetIdx] ?? words[0];
    const clozeSentence = words.map((w, i) => (i === targetIdx ? '_____' : w)).join(' ');
    const extraWords = quickWords
      .map((w) => w.en.split(' ')[0])
      .filter((w) => w.toLowerCase() !== missing.toLowerCase())
      .slice(0, 2);
    const clozeOptions = [
      { label: missing, isCorrect: true },
      ...extraWords.map((w) => ({ label: w, isCorrect: false })),
    ].sort((a, b) => a.label.localeCompare(b.label));

    challenges.push({
      id: 'cloze-1',
      type: 'cloze',
      promptPt: `Complete a lacuna (${third.pt}):`,
      targetText: missing,
      audioText: third.chunk,
      clozeSentence,
      options: clozeOptions,
    });
  }

  return challenges;
}
