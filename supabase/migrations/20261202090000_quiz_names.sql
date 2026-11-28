-- Quizzes are named after their topic ("Extremalprobleme-Quiz") with a short description.
update public.quizzes q set title = v.title, description = v.description
from (values
  ('bio111-mini-block1',                'Zelle-und-Membran-Quiz',     '10 Fragen · jedes Mal neu gemischt'),
  ('bio111-mini-block2',                'Proteine-und-Enzyme-Quiz',   '10 Fragen · jedes Mal neu gemischt'),
  ('bio111-mini-transfer',              'Transfer-Quiz',              '10 Fragen · jedes Mal neu gemischt'),
  ('math111-mini-extremal',             'Extremalprobleme-Quiz',      '8 Fragen · jedes Mal neu gemischt'),
  ('math111-mini-funktionsgleichungen', 'Funktionsgleichungen-Quiz',  '8 Fragen · jedes Mal neu gemischt'),
  ('phys111-mini-coulomb',              'Coulomb-Gesetz-Quiz',        '8 Fragen · jedes Mal neu gemischt'),
  ('phys111-mini-feld',                 'Elektrisches-Feld-Quiz',     '8 Fragen · jedes Mal neu gemischt')
) as v(key, title, description)
where q.key = v.key;
