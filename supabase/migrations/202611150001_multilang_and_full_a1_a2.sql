-- ============================================================================
-- JVX SPEAK — Migration 0003: Multi-idioma (EN + ES-ES Cervantes) & Grade A1/A2
-- ============================================================================

-- 1. Suporte multi-idioma no currículo e perfil
ALTER TABLE core_curriculum.courses
  ADD COLUMN IF NOT EXISTS target_language text NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'es-ES')),
  ADD COLUMN IF NOT EXISTS pedagogical_framework text NOT NULL DEFAULT 'CEFR' CHECK (pedagogical_framework IN ('CEFR', 'CEFR_CERVANTES'));

ALTER TABLE core_curriculum.competencies
  ADD COLUMN IF NOT EXISTS target_language text NOT NULL DEFAULT 'en' CHECK (target_language IN ('en', 'es-ES'));

ALTER TABLE core_identity.profiles
  ADD COLUMN IF NOT EXISTS active_course_id uuid REFERENCES core_curriculum.courses(id) ON DELETE SET NULL;

-- Expandir focus_area para incluir 'study'
ALTER TABLE core_identity.learning_goals DROP CONSTRAINT IF EXISTS learning_goals_focus_area_check;
ALTER TABLE core_identity.learning_goals
  ADD CONSTRAINT learning_goals_focus_area_check
  CHECK (focus_area IN ('general', 'business_entrepreneur', 'tech', 'travel', 'study'));

-- Atualizar curso piloto existente de Inglês
UPDATE core_curriculum.courses
SET target_language = 'en',
    pedagogical_framework = 'CEFR',
    title = 'Inglês Estruturado CEFR (A1–C2)',
    description = 'Academia completa de inglês no padrão CEFR com prática guiada, fala, escrita e revisão espaçada.'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Criar Curso de Espanhol (Espanha — Padrão Cervantes)
INSERT INTO core_curriculum.courses (id, slug, title, description, target_cefr_level, focus_area, target_language, pedagogical_framework, is_published)
VALUES (
  '11111111-1111-1111-1111-111111111122',
  'spanish-spain-cervantes',
  'Espanhol da Espanha — Padrão Cervantes (A1–C2)',
  'Treinamento estruturado segundo o mapeamento pedagógico do Instituto Cervantes (PCIC/CEFR), com foco no espanhol peninsular.',
  'A2',
  'general',
  'es-ES',
  'CEFR_CERVANTES',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- 2. NOVAS COMPETÊNCIAS (INGLÊS A1/A2 + ESPANHOL A1/A2)
-- ============================================================================
INSERT INTO core_curriculum.competencies (id, code, cefr_level, skill_category, target_language, title, description, mastery_threshold, min_evidences_required)
VALUES
  -- Inglês A1 extra + A2
  ('33333333-3333-3333-3333-333333333304', 'A1.SI.TRAVEL_BASICS', 'A1', 'spoken_interaction', 'en', 'Viagens, Aeroporto e Hotel', 'Fazer check-in, pedir informações simples e resolver situações básicas em viagem.', 75.00, 3),
  ('33333333-3333-3333-3333-333333333305', 'A2.SP.PAST_EVENTS', 'A2', 'spoken_production', 'en', 'Relatar Eventos Passados e Experiências', 'Contar o que aconteceu ontem, na semana passada ou em projetos anteriores.', 75.00, 3),
  ('33333333-3333-3333-3333-333333333306', 'A2.WR.EMAIL_MESSAGES', 'A2', 'writing', 'en', 'Mensagens e E-mails Profissionais Curtos', 'Escrever mensagens objetivas para confirmar horários, pedidos e próximos passos.', 75.00, 3),

  -- Espanhol (Espanha - Cervantes) A1 & A2
  ('33333333-3333-3333-3333-333333333401', 'ES.A1.SI.SALUDOS', 'A1', 'spoken_interaction', 'es-ES', 'Saludos e Presentaciones (España)', 'Cumprimentar, apresentar-se e usar tratamento formal/informal (tú / usted) na Espanha.', 75.00, 3),
  ('33333333-3333-3333-3333-333333333402', 'ES.A1.SP.RUTINA', 'A1', 'spoken_production', 'es-ES', 'Rutina Diaria e Horarios', 'Descrever a rotina diária, horários comerciais e atividades na Espanha.', 75.00, 3),
  ('33333333-3333-3333-3333-333333333403', 'ES.A1.SI.CIUDAD_VIAJE', 'A1', 'spoken_interaction', 'es-ES', 'En la Ciudad, Bar y Transporte', 'Pedir em bares/restaurantes, pegar transporte e pedir direções na Espanha.', 75.00, 3),
  ('33333333-3333-3333-3333-333333333404', 'ES.A2.SI.TRABAJO', 'A2', 'spoken_interaction', 'es-ES', 'Trabajo, Reuniones y Quedar', 'Combinar reuniões (quedar), falar de tarefas profissionais e prazos.', 75.00, 3),
  ('33333333-3333-3333-3333-333333333405', 'ES.A2.SP.PASADO', 'A2', 'spoken_production', 'es-ES', 'Experiencias y Pretérito Perfecto', 'Relatar acontecimentos recentes usando o Pretérito Perfecto típico da Espanha.', 75.00, 3)
ON CONFLICT (code) DO NOTHING;

-- Pré-requisitos encadeados
INSERT INTO core_curriculum.competency_prerequisites (competency_id, prerequisite_id)
VALUES
  ('33333333-3333-3333-3333-333333333304', '33333333-3333-3333-3333-333333333301'),
  ('33333333-3333-3333-3333-333333333305', '33333333-3333-3333-3333-333333333302'),
  ('33333333-3333-3333-3333-333333333306', '33333333-3333-3333-3333-333333333303'),
  ('33333333-3333-3333-3333-333333333404', '33333333-3333-3333-3333-333333333401'),
  ('33333333-3333-3333-3333-333333333405', '33333333-3333-3333-3333-333333333402')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 3. GRADE COMPLETA A1/A2 — INGLÊS (6 Unidades, 12+ Lições)
-- ============================================================================
-- Primeiro libera o order_index 3 movendo a unidade A2 Trabalho para 4
UPDATE core_curriculum.units SET order_index = 4 WHERE id = '44444444-4444-4444-4444-444444444403';

INSERT INTO core_curriculum.units (id, course_id, order_index, cefr_level, title, description, objectives, is_published)
VALUES
  ('44444444-4444-4444-4444-444444444404', '11111111-1111-1111-1111-111111111111', 3, 'A1', 'A1 — Viagens, Aeroporto e Hotel', 'Situações reais de embarque, hotel e deslocamento.', '["Fazer check-in no hotel", "Pedir informações no aeroporto", "Solicitar ajuda educadamente"]'::jsonb, true),
  ('44444444-4444-4444-4444-444444444405', '11111111-1111-1111-1111-111111111111', 5, 'A2', 'A2 — Relatando Eventos Passados', 'Como contar resultados da semana e experiências anteriores.', '["Usar verbos no passado simples", "Explicar o que foi feito ontem"]'::jsonb, true),
  ('44444444-4444-4444-4444-444444444406', '11111111-1111-1111-1111-111111111111', 6, 'A2', 'A2 — E-mails e Mensagens Rápidas', 'Comunicação escrita objetiva para WhatsApp, Slack e e-mail.', '["Confirmar reuniões por escrito", "Pedir retorno de forma profissional"]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lessons (id, unit_id, order_index, title, lesson_type, estimated_minutes, vocabulary_chunks, is_published)
VALUES
  -- Lições extras na Unidade 1 (A1 Apresentações)
  ('55555555-5555-5555-5555-555555555504', '44444444-4444-4444-4444-444444444401', 2, 'Falando da sua empresa e cidade', 'mixed', 15,
   '[{"chunk":"My company is based in Brazil.","pt":"Minha empresa fica no Brasil."},{"chunk":"We help clients with...","pt":"Nós ajudamos clientes com..."},{"chunk":"Where are you from?","pt":"De onde você é?"}]'::jsonb, true),
  -- Lições extras na Unidade 2 (A1 Rotinas)
  ('55555555-5555-5555-5555-555555555505', '44444444-4444-4444-4444-444444444402', 2, 'Agenda semanal e compromissos', 'mixed', 15,
   '[{"chunk":"On Mondays, I review the goals.","pt":"Às segundas, eu reviso as metas."},{"chunk":"I finish work at 6 p.m.","pt":"Eu termino o trabalho às 18h."},{"chunk":"At night, I study English.","pt":"À noite, eu estudo inglês."}]'::jsonb, true),
  -- Unidade 3 A1 (Viagens)
  ('55555555-5555-5555-5555-555555555506', '44444444-4444-4444-4444-444444444404', 1, 'Check-in no hotel e reservas', 'mixed', 15,
   '[{"chunk":"I have a reservation under...","pt":"Tenho uma reserva em nome de..."},{"chunk":"What time is breakfast?","pt":"Que horas é o café da manhã?"},{"chunk":"Could I have the Wi-Fi password?","pt":"Poderia me passar a senha do Wi-Fi?"}]'::jsonb, true),
  ('55555555-5555-5555-5555-555555555507', '44444444-4444-4444-4444-444444444404', 2, 'No aeroporto e transporte', 'mixed', 15,
   '[{"chunk":"Where is the boarding gate?","pt":"Onde fica o portão de embarque?"},{"chunk":"I need to go to the city center.","pt":"Preciso ir para o centro da cidade."},{"chunk":"How much does it cost?","pt":"Quanto custa?"}]'::jsonb, true),
  -- Lição extra A2 Trabalho
  ('55555555-5555-5555-5555-555555555508', '44444444-4444-4444-4444-444444444403', 2, 'Pedindo esclarecimentos em calls', 'mixed', 20,
   '[{"chunk":"Could you repeat that, please?","pt":"Você poderia repetir isso, por favor?"},{"chunk":"What do you mean by...?","pt":"O que você quer dizer com...?"},{"chunk":"Let''s schedule a quick call.","pt":"Vamos agendar uma call rápida."}]'::jsonb, true),
  -- Unidade 5 A2 (Passado)
  ('55555555-5555-5555-5555-555555555509', '44444444-4444-4444-4444-444444444405', 1, 'O que fizemos ontem e na semana passada', 'mixed', 20,
   '[{"chunk":"Yesterday, I met a new partner.","pt":"Ontem, eu conheci um novo parceiro."},{"chunk":"Last week, we launched the update.","pt":"Semana passada, lançamos a atualização."},{"chunk":"Everything went well.","pt":"Tudo correu bem."}]'::jsonb, true),
  -- Unidade 6 A2 (Escrita)
  ('55555555-5555-5555-5555-555555555510', '44444444-4444-4444-4444-444444444406', 1, 'Confirmando reuniões por mensagem', 'mixed', 20,
   '[{"chunk":"Hi, just confirming our meeting at 3 p.m.","pt":"Oi, apenas confirmando nossa reunião às 15h."},{"chunk":"Please let me know if you need anything.","pt":"Por favor, me avise se precisar de algo."},{"chunk":"Looking forward to speaking with you.","pt":"Aguardo ansioso para falar com você."}]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lesson_competencies (lesson_id, competency_id)
VALUES
  ('55555555-5555-5555-5555-555555555504', '33333333-3333-3333-3333-333333333301'),
  ('55555555-5555-5555-5555-555555555505', '33333333-3333-3333-3333-333333333302'),
  ('55555555-5555-5555-5555-555555555506', '33333333-3333-3333-3333-333333333304'),
  ('55555555-5555-5555-5555-555555555507', '33333333-3333-3333-3333-333333333304'),
  ('55555555-5555-5555-5555-555555555508', '33333333-3333-3333-3333-333333333303'),
  ('55555555-5555-5555-5555-555555555509', '33333333-3333-3333-3333-333333333305'),
  ('55555555-5555-5555-5555-555555555510', '33333333-3333-3333-3333-333333333306')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. GRADE COMPLETA A1/A2 — ESPANHOL DA ESPANHA (CERVANTES)
-- ============================================================================
INSERT INTO core_curriculum.units (id, course_id, order_index, cefr_level, title, description, objectives, is_published)
VALUES
  ('44444444-4444-4444-4444-444444444501', '11111111-1111-1111-1111-111111111122', 1, 'A1', 'A1 — Saludos y Presentaciones (España)', 'Primeros contactos en España: tú vs. usted y expresiones cotidianas.', '["Presentarse y decir la profesión", "Usar expresiones naturales de España"]'::jsonb, true),
  ('44444444-4444-4444-4444-444444444502', '11111111-1111-1111-1111-111111111122', 2, 'A1', 'A1 — Rutina Diaria y Horarios', 'Cómo hablar de tu jornada y horarios en España.', '["Describir horarios diarios", "Usar expresiones de frecuencia"]'::jsonb, true),
  ('44444444-4444-4444-4444-444444444503', '11111111-1111-1111-1111-111111111122', 3, 'A1', 'A1 — En el Bar, Ciudad y Transporte', 'Vocabulario peninsular real: la cuenta, el móvil, el metro.', '["Pedir en un bar o restaurante", "Preguntar direcciones en la ciudad"]'::jsonb, true),
  ('44444444-4444-4444-4444-444444444504', '11111111-1111-1111-1111-111111111122', 4, 'A2', 'A2 — Trabajo, Reuniones y Quedar', 'Comunicación profesional y uso de "quedar" en España.', '["Concertar citas y reuniones", "Confirmar plazos de entrega"]'::jsonb, true),
  ('44444444-4444-4444-4444-444444444505', '11111111-1111-1111-1111-111111111122', 5, 'A2', 'A2 — Experiencias Recientes (Pretérito Perfecto)', 'Uso del Pretérito Perfecto compuesto muy frecuente en España.', '["Contar lo que has hecho hoy o esta semana"]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lessons (id, unit_id, order_index, title, lesson_type, estimated_minutes, vocabulary_chunks, is_published)
VALUES
  ('55555555-5555-5555-5555-555555555601', '44444444-4444-4444-4444-444444444501', 1, 'Encantado de conocerte', 'mixed', 15,
   '[{"chunk":"¡Hola! Encantado de conocerte.","pt":"Olá! Prazer em conhecê-lo(a)."},{"chunk":"Soy fundador de una empresa.","pt":"Sou fundador de uma empresa."},{"chunk":"¿A qué te dedicas?","pt":"Com o que você trabalha?"}]'::jsonb, true),
  ('55555555-5555-5555-5555-555555555602', '44444444-4444-4444-4444-444444444502', 1, 'Mi jornada laboral', 'mixed', 15,
   '[{"chunk":"Normalmente empiezo a trabajar a las nueve.","pt":"Normalmente começo a trabalhar às nove."},{"chunk":"Por la mañana tengo reuniones.","pt":"De manhã tenho reuniões."},{"chunk":"Vale, perfecto.","pt":"Certo / combinado, perfeito (muito usado na Espanha)."}]'::jsonb, true),
  ('55555555-5555-5555-5555-555555555603', '44444444-4444-4444-4444-444444444503', 1, 'Pidiendo en un bar en Madrid', 'mixed', 15,
   '[{"chunk":"¿Me pones un café con leche, por favor?","pt":"Me vê um café com leite, por favor?"},{"chunk":"¿Nos trae la cuenta cuando pueda?","pt":"Nos traz a conta quando puder?"},{"chunk":"¿Dónde está la estación de metro?","pt":"Onde fica a estação de metrô?"}]'::jsonb, true),
  ('55555555-5555-5555-5555-555555555604', '44444444-4444-4444-4444-444444444504', 1, 'Quedar para una reunión', 'mixed', 20,
   '[{"chunk":"¿Cuándo quedamos para hablar del proyecto?","pt":"Quando nos reunimos/marcamos para falar do projeto?"},{"chunk":"Te envío el informe desde el ordenador.","pt":"Te envio o relatório do computador (ordenador na Espanha)."},{"chunk":"¿Te viene bien el jueves?","pt":"Fica bom para você na quinta-feira?"}]'::jsonb, true),
  ('55555555-5555-5555-5555-555555555605', '44444444-4444-4444-4444-444444444505', 1, 'Lo que hemos hecho esta semana', 'mixed', 20,
   '[{"chunk":"Esta semana he hablado con varios clientes.","pt":"Esta semana falei com vários clientes."},{"chunk":"Hoy hemos cerrado un acuerdo.","pt":"Hoje fechamos um acordo."},{"chunk":"¿Has recibido mi correo?","pt":"Você recebeu meu e-mail?"}]'::jsonb, true)
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lesson_competencies (lesson_id, competency_id)
VALUES
  ('55555555-5555-5555-5555-555555555601', '33333333-3333-3333-3333-333333333401'),
  ('55555555-5555-5555-5555-555555555602', '33333333-3333-3333-3333-333333333402'),
  ('55555555-5555-5555-5555-555555555603', '33333333-3333-3333-3333-333333333403'),
  ('55555555-5555-5555-5555-555555555604', '33333333-3333-3333-3333-333333333404'),
  ('55555555-5555-5555-5555-555555555605', '33333333-3333-3333-3333-333333333405')
ON CONFLICT DO NOTHING;
