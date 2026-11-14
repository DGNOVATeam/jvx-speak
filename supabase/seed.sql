-- ============================================================================
-- AI LANGUAGE SCHOOL — Seed Piloto (CEFR A1/A2 + Negócios)
-- ============================================================================

-- Planos iniciais
INSERT INTO core_billing.plans (code, name, price_cents, currency, monthly_ai_token_limit)
VALUES
  ('pilot_free', 'Plano Piloto (Aluno Zero)', 0, 'BRL', 250000),
  ('pro_business', 'Pro Business 30+', 12900, 'BRL', 1500000)
ON CONFLICT (code) DO NOTHING;

-- Curso Piloto
INSERT INTO core_curriculum.courses (id, slug, title, description, target_cefr_level, focus_area, is_published)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'english-cefr-foundations-business',
  'Inglês Estruturado CEFR — Fundação & Negócios (A1–A2)',
  'Trilha estruturada por competências CEFR com foco em comunicação prática e contexto profissional.',
  'A2',
  'business_entrepreneur',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Descritores de referência CEFR (marcados como referência resumida, não texto integral oficial)
INSERT INTO core_curriculum.cefr_descriptors (id, cefr_level, skill_category, source_name, source_version, official_code, descriptor_text, is_official_reference)
VALUES
  ('22222222-2222-2222-2222-222222222201', 'A1', 'spoken_interaction', 'Council of Europe CEFR Companion Volume (Summary Mapping)', '2020', 'CEFR-A1-SI-01', 'Can introduce him/herself and others and can ask and answer questions about personal details.', true),
  ('22222222-2222-2222-2222-222222222202', 'A1', 'spoken_production', 'Council of Europe CEFR Companion Volume (Summary Mapping)', '2020', 'CEFR-A1-SP-01', 'Can use simple phrases and sentences to describe daily routines and familiar activities.', true),
  ('22222222-2222-2222-2222-222222222203', 'A2', 'spoken_interaction', 'Council of Europe CEFR Companion Volume (Summary Mapping)', '2020', 'CEFR-A2-SI-01', 'Can communicate in simple and routine tasks requiring a simple and direct exchange of information on work and familiar matters.', true)
ON CONFLICT DO NOTHING;

-- Competências Piloto
INSERT INTO core_curriculum.competencies (id, code, cefr_level, skill_category, title, description, cefr_descriptor_id, mastery_threshold, min_evidences_required)
VALUES
  ('33333333-3333-3333-3333-333333333301', 'A1.SI.GREETINGS', 'A1', 'spoken_interaction', 'Apresentações e Cumprimentos Profissionais', 'Cumprimentar, apresentar-se e dizer sua função ou empresa de forma simples.', '22222222-2222-2222-2222-222222222201', 75.00, 3),
  ('33333333-3333-3333-3333-333333333302', 'A1.SP.ROUTINES', 'A1', 'spoken_production', 'Rotinas e Atividades Diárias', 'Descrever horários, agenda diária e hábitos de trabalho no presente simples.', '22222222-2222-2222-2222-222222222202', 75.00, 3),
  ('33333333-3333-3333-3333-333333333303', 'A2.SI.WORK_TASKS', 'A2', 'spoken_interaction', 'Trabalho e Atividades Profissionais', 'Explicar responsabilidades, confirmar prazos e alinhar tarefas simples no trabalho.', '22222222-2222-2222-2222-222222222203', 75.00, 3)
ON CONFLICT (code) DO NOTHING;

-- Pré-requisitos: A2.SI.WORK_TASKS exige A1.SI.GREETINGS e A1.SP.ROUTINES
INSERT INTO core_curriculum.competency_prerequisites (competency_id, prerequisite_id)
VALUES
  ('33333333-3333-3333-3333-333333333303', '33333333-3333-3333-3333-333333333301'),
  ('33333333-3333-3333-3333-333333333303', '33333333-3333-3333-3333-333333333302')
ON CONFLICT DO NOTHING;

-- Unidades Piloto
INSERT INTO core_curriculum.units (id, course_id, order_index, cefr_level, title, description, objectives, completion_criteria, is_published)
VALUES
  (
    '44444444-4444-4444-4444-444444444401',
    '11111111-1111-1111-1111-111111111111',
    1, 'A1',
    'A1 — Apresentações e cumprimentos',
    'Primeiros contatos em reuniões, eventos e chamadas online.',
    '["Apresentar nome, cargo e empresa", "Perguntar o nome e a área de atuação", "Encerrar um contato educadamente"]'::jsonb,
    '{"min_mastery": 75, "min_evidences": 3}'::jsonb,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444402',
    '11111111-1111-1111-1111-111111111111',
    2, 'A1',
    'A1 — Rotinas e atividades diárias',
    'Como falar sobre sua rotina diária e agenda de trabalho.',
    '["Descrever horários de trabalho", "Usar expressões de frequência", "Explicar o que faz pela manhã e à tarde"]'::jsonb,
    '{"min_mastery": 75, "min_evidences": 3}'::jsonb,
    true
  ),
  (
    '44444444-4444-4444-4444-444444444403',
    '11111111-1111-1111-1111-111111111111',
    3, 'A2',
    'A2 — Trabalho e atividades profissionais',
    'Comunicação direta sobre projetos, prazos e reuniões.',
    '["Confirmar prazos de entrega", "Pedir esclarecimentos em reuniões", "Descrever projetos em andamento"]'::jsonb,
    '{"min_mastery": 75, "min_evidences": 3}'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

-- Aulas iniciais
INSERT INTO core_curriculum.lessons (id, unit_id, order_index, title, lesson_type, estimated_minutes, vocabulary_chunks, content_blocks, is_published)
VALUES
  (
    '55555555-5555-5555-5555-555555555501',
    '44444444-4444-4444-4444-444444444401',
    1,
    'Primeiro contato profissional',
    'mixed',
    15,
    '[
      {"chunk": "Nice to meet you.", "pt": "Prazer em conhecê-lo(a)."},
      {"chunk": "I am the founder of...", "pt": "Eu sou o(a) fundador(a) da..."},
      {"chunk": "What do you do?", "pt": "O que você faz / qual sua área?"},
      {"chunk": "I work with software / business.", "pt": "Eu trabalho com software / negócios."}
    ]'::jsonb,
    '[
      {"type": "explanation", "title": "Apresentação direta", "body": "Em contextos de negócios, seja direto e claro: diga seu nome, sua função e sua empresa usando blocos prontos (chunks)."}
    ]'::jsonb,
    true
  ),
  (
    '55555555-5555-5555-5555-555555555502',
    '44444444-4444-4444-4444-444444444402',
    1,
    'Minha rotina de trabalho',
    'mixed',
    15,
    '[
      {"chunk": "I usually start work at 8 a.m.", "pt": "Eu geralmente começo a trabalhar às 8h."},
      {"chunk": "In the morning, I have meetings.", "pt": "De manhã, eu tenho reuniões."},
      {"chunk": "I check my emails every day.", "pt": "Eu verifico meus e-mails todos os dias."}
    ]'::jsonb,
    '[
      {"type": "explanation", "title": "Rotinas no Present Simple", "body": "Use advérbios como usually e every day para descrever sua agenda habitual."}
    ]'::jsonb,
    true
  ),
  (
    '55555555-5555-5555-5555-555555555503',
    '44444444-4444-4444-4444-444444444403',
    1,
    'Alinhando prazos e entregas',
    'mixed',
    20,
    '[
      {"chunk": "Could you send it by Friday?", "pt": "Você poderia enviar até sexta-feira?"},
      {"chunk": "We are working on the new system.", "pt": "Estamos trabalhando no novo sistema."},
      {"chunk": "Let me double-check the deadline.", "pt": "Deixe-me conferir o prazo."}
    ]'::jsonb,
    '[
      {"type": "explanation", "title": "Prazos em equipe", "body": "Use by + dia/horário para indicar prazo limite e Could you... para pedidos educados."}
    ]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lesson_competencies (lesson_id, competency_id)
VALUES
  ('55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333301'),
  ('55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333302'),
  ('55555555-5555-5555-5555-555555555503', '33333333-3333-3333-3333-333333333303')
ON CONFLICT DO NOTHING;
