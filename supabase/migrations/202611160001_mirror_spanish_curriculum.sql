-- ============================================================================
-- Migration 0003: Padronização do Currículo de Espanhol (es-ES) espelhando Inglês
-- 6 Unidades e 10 Lições com competências, chunks e estrutura idêntica
-- ============================================================================

INSERT INTO core_curriculum.competencies (id, code, cefr_level, skill_category, title, description, target_language)
VALUES
  (
    '33333333-3333-3333-3333-333333333406',
    'ES.A2.WR.MENSAJES',
    'A2',
    'writing',
    'Mensajes y correos breves en español',
    'Confirmar reuniones y escribir mensajes profesionales breves en español peninsular.',
    'es-ES'
  )
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.units (id, course_id, order_index, cefr_level, title, description, objectives, is_published)
VALUES
  (
    '44444444-4444-4444-4444-444444444506',
    '11111111-1111-1111-1111-111111111122',
    6,
    'A2',
    'A2 — Correos y Mensajes Rápidos',
    'Comunicación escrita objetiva para WhatsApp, Slack y correo profesional en España.',
    '["Confirmar reuniones por escrito", "Pedir confirmación de forma profesional"]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lessons (id, unit_id, order_index, title, lesson_type, estimated_minutes, vocabulary_chunks, is_published)
VALUES
  -- Unidade 1 A1 (L2)
  (
    '55555555-5555-5555-5555-555555555606',
    '44444444-4444-4444-4444-444444444501',
    2,
    'Hablando de tu empresa y ciudad',
    'mixed',
    15,
    '[{"chunk":"Trabajo en una empresa de tecnología en Madrid.","pt":"Trabalho em uma empresa de tecnologia em Madrid."},{"chunk":"Nuestra oficina está en el centro de la ciudad.","pt":"Nosso escritório fica no centro da cidade."},{"chunk":"Colaboramos con clientes de toda Europa.","pt":"Colaboramos com clientes de toda a Europa."}]'::jsonb,
    true
  ),
  -- Unidade 2 A1 (L2)
  (
    '55555555-5555-5555-5555-555555555607',
    '44444444-4444-4444-4444-444444444502',
    2,
    'Agenda semanal y compromisos',
    'mixed',
    15,
    '[{"chunk":"Los lunes tengo reunión con el equipo.","pt":"Às segundas-feiras tenho reunião com a equipe."},{"chunk":"El miércoles por la tarde visito a un cliente.","pt":"Na quarta-feira à tarde visito um cliente."},{"chunk":"¿Tienes hueco en tu agenda esta semana?","pt":"Você tem horário livre na sua agenda esta semana?"}]'::jsonb,
    true
  ),
  -- Unidade 3 A1 (L2)
  (
    '55555555-5555-5555-5555-555555555608',
    '44444444-4444-4444-4444-444444444503',
    2,
    'En el aeropuerto y transporte',
    'mixed',
    15,
    '[{"chunk":"¿Dónde está el mostrador de facturación?","pt":"Onde fica o balcão de check-in?"},{"chunk":"Mi vuelo sale a las diez desde la puerta B4.","pt":"Meu voo sai às dez pelo portão B4."},{"chunk":"¿Cómo llego al centro desde el aeropuerto?","pt":"Como chego ao centro saindo do aeroporto?"}]'::jsonb,
    true
  ),
  -- Unidade 4 A2 (L2)
  (
    '55555555-5555-5555-5555-555555555609',
    '44444444-4444-4444-4444-444444444504',
    2,
    'Pedir aclaraciones en videollamadas',
    'mixed',
    20,
    '[{"chunk":"Perdona, ¿puedes repetir eso más despacio?","pt":"Desculpe, pode repetir isso mais devagar?"},{"chunk":"¿A qué te refieres exactamente con ese plazo?","pt":"O que você quer dizer exatamente com esse prazo?"},{"chunk":"Vamos a confirmar los siguientes pasos.","pt":"Vamos confirmar os próximos passos."}]'::jsonb,
    true
  ),
  -- Unidade 6 A2 (L1)
  (
    '55555555-5555-5555-5555-555555555610',
    '44444444-4444-4444-4444-444444444506',
    1,
    'Confirmando reuniones por mensaje',
    'mixed',
    20,
    '[{"chunk":"Hola, solo para confirmar nuestra reunión a las tres.","pt":"Oi, apenas para confirmar nossa reunião às 15h."},{"chunk":"Avísame si necesitas cambiar la hora.","pt":"Me avise se precisar mudar o horário."},{"chunk":"Quedo a la espera de tu confirmación.","pt":"Fico aguardando sua confirmação."}]'::jsonb,
    true
  )
ON CONFLICT DO NOTHING;

INSERT INTO core_curriculum.lesson_competencies (lesson_id, competency_id)
VALUES
  ('55555555-5555-5555-5555-555555555606', '33333333-3333-3333-3333-333333333401'),
  ('55555555-5555-5555-5555-555555555607', '33333333-3333-3333-3333-333333333402'),
  ('55555555-5555-5555-5555-555555555608', '33333333-3333-3333-3333-333333333403'),
  ('55555555-5555-5555-5555-555555555609', '33333333-3333-3333-3333-333333333404'),
  ('55555555-5555-5555-5555-555555555610', '33333333-3333-3333-3333-333333333406')
ON CONFLICT DO NOTHING;
