-- Physik 11.1: two random multiple-choice mini tests (Ladung & Coulomb-Gesetz, Elektrisches Feld).
-- 8 questions drawn per attempt from a pool of 14 each. Safe to run more than once.

insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q01', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'In welcher Einheit misst man die elektrische Ladung?', '["Volt (V)", "Newton (N)", "Coulomb (1 C = 1 A·s)", "Ampere (A)"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['Die Ladung Q hat die Einheit Coulomb: 1 C = 1 A·s (Strom mal Zeit).']::text[] from public.questions where key = 'phys111-lc-q01'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q02', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Wie groß ist die Elementarladung e?', '["1,602 · 10¹⁹ C", "1,602 · 10⁻¹⁹ C", "9,11 · 10⁻³¹ C", "8,854 · 10⁻¹² C"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['e = 1,602 · 10⁻¹⁹ C ist die Ladung eines Protons (bzw. minus die eines Elektrons).', '9,11 · 10⁻³¹ kg ist die Elektronenmasse, 8,854 · 10⁻¹² As/(Vm) ist ε₀.']::text[] from public.questions where key = 'phys111-lc-q02'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q03', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Was passiert mit zwei gleichnamigen Ladungen?', '["Sie stoßen sich ab.", "Sie ziehen sich an.", "Es wirkt keine Kraft.", "Sie neutralisieren sich sofort."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 0}'::jsonb, array['Gleichnamige Ladungen (+/+ oder −/−) stoßen sich ab, ungleichnamige ziehen sich an.']::text[] from public.questions where key = 'phys111-lc-q03'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q04', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Ein Körper ist positiv geladen. Was bedeutet das?', '["Er hat zusätzliche Protonen bekommen.", "Er hat Elektronen zu viel.", "Er enthält keine Elektronen mehr.", "Ihm fehlen Elektronen."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 3}'::jsonb, array['Nur Elektronen können wandern. Positiv geladen heißt: Es fehlen Elektronen; die Protonen bleiben im Kern.']::text[] from public.questions where key = 'phys111-lc-q04'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q05', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Wie lautet das Coulomb-Gesetz?', '["F = 1/(4π·ε₀·εᵣ) · Q₁·Q₂ / r", "F = 4π·ε₀ · Q₁·Q₂ · r²", "F = 1/(4π·ε₀·εᵣ) · Q₁·Q₂ / r²", "F = Q₁·Q₂ / (4π·ε₀)"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['Die Kraft ist proportional zum Produkt der Ladungen und umgekehrt proportional zum Quadrat des Abstands.']::text[] from public.questions where key = 'phys111-lc-q05'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q06', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Der Abstand zweier Ladungen wird verdoppelt. Wie ändert sich die Kraft?', '["Sie halbiert sich.", "Sie wird ein Viertel so groß.", "Sie verdoppelt sich.", "Sie bleibt gleich."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['F ~ 1/r²: doppelter Abstand → (1/2)² = 1/4 der Kraft.']::text[] from public.questions where key = 'phys111-lc-q06'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q07', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Beide Ladungen werden verdoppelt, der Abstand bleibt gleich. Die Kraft wird …', '["4-mal so groß", "2-mal so groß", "gleich groß", "halb so groß"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 0}'::jsonb, array['F ~ Q₁·Q₂: 2 · 2 = 4.']::text[] from public.questions where key = 'phys111-lc-q07'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q08', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Zwei Ladungen liegen in Wasser (εᵣ = 81) statt in Luft. Die Kraft ist dann …', '["81-mal größer", "9-mal kleiner", "gleich groß", "81-mal kleiner"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 3}'::jsonb, array['F ~ 1/εᵣ: In Wasser wird die Kraft durch 81 geteilt.']::text[] from public.questions where key = 'phys111-lc-q08'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q09', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Wie viel sind 10 nC in Coulomb?', '["1 · 10⁻⁹ C", "1 · 10⁻⁷ C", "1 · 10⁻⁸ C", "10 · 10⁻⁶ C"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['n (nano) = 10⁻⁹: 10 · 10⁻⁹ C = 1 · 10⁻⁸ C.']::text[] from public.questions where key = 'phys111-lc-q09'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q10', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Ein Körper trägt Q = −1,602 · 10⁻¹⁸ C. Wie viele Elektronen hat er zu viel?', '["1", "10", "100", "10¹⁸"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['N = |Q| / e = 1,602 · 10⁻¹⁸ C / 1,602 · 10⁻¹⁹ C = 10.']::text[] from public.questions where key = 'phys111-lc-q10'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q11', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Welchen Wert hat die elektrische Feldkonstante ε₀?', '["8,854 · 10⁻¹² As/(Vm)", "8,99 · 10⁹ As/(Vm)", "1,602 · 10⁻¹⁹ As/(Vm)", "6,674 · 10⁻¹¹ As/(Vm)"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 0}'::jsonb, array['ε₀ = 8,854 · 10⁻¹² As/(Vm). 1/(4πε₀) ≈ 8,99 · 10⁹ Nm²/C² ist der Vorfaktor im Coulomb-Gesetz.']::text[] from public.questions where key = 'phys111-lc-q11'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q12', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Was besagt die Ladungserhaltung?', '["Ein Körper behält seine Ladung für immer.", "Positive Ladung wandelt sich in negative um.", "Beim Reiben entsteht neue Ladung.", "Ladung kann nicht erzeugt oder vernichtet, nur getrennt werden."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 3}'::jsonb, array['Beim Reiben wandern Elektronen von einem Körper zum anderen. Die Gesamtladung bleibt gleich.']::text[] from public.questions where key = 'phys111-lc-q12'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q13', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Was versteht man unter Influenz?', '["Aufladen durch Reiben", "Entladen über die Erde", "Ladungstrennung in einem Leiter durch Annäherung eines geladenen Körpers", "Die Kraft zwischen zwei Massen"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['Ohne Berührung verschieben sich die freien Elektronen im Leiter: zugewandte Seite ungleichnamig, abgewandte Seite gleichnamig geladen.']::text[] from public.questions where key = 'phys111-lc-q13'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-lc-q14', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'single', 'Zwei Kugeln mit je 10 nC sind 5 cm voneinander entfernt (Luft). Wie groß ist die Kraft ungefähr?', '["3,6 · 10⁻⁶ N", "3,6 · 10⁻⁴ N", "1,8 · 10⁻³ N", "7,2 · 10⁻⁴ N"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['F = 8,99 · 10⁹ Nm²/C² · (1 · 10⁻⁸ C)² / (0,05 m)² ≈ 3,6 · 10⁻⁴ N.', '3,6 · 10⁻⁶ N erhält man, wenn man 10 nC fälschlich als 10⁻⁹ C einsetzt.']::text[] from public.questions where key = 'phys111-lc-q14'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q01', 'physik', 'Das elektrische Feld', 'single', 'Wo beginnen und enden elektrische Feldlinien?', '["Sie beginnen an negativen und enden an positiven Ladungen.", "Sie bilden immer geschlossene Kreise.", "Sie beginnen an positiven und enden an negativen Ladungen.", "Sie beginnen und enden an derselben Ladung."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['Feldlinien laufen von + nach −. Diese Richtung ist so festgelegt.']::text[] from public.questions where key = 'phys111-ef-q01'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q02', 'physik', 'Das elektrische Feld', 'single', 'Können sich zwei Feldlinien schneiden?', '["Ja, an jeder Ladung.", "Nein, niemals.", "Ja, im homogenen Feld.", "Nur zwischen zwei negativen Ladungen."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['An jedem Punkt hat die Kraft auf die Probeladung nur eine Richtung, deshalb können sich Feldlinien nicht schneiden.']::text[] from public.questions where key = 'phys111-ef-q02'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q03', 'physik', 'Das elektrische Feld', 'single', 'Was gibt die Dichte der Feldlinien an?', '["Die Stärke des Feldes", "Die Richtung des Feldes", "Die Größe der Probeladung", "Die Spannung der Quelle"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 0}'::jsonb, array['Je dichter die Feldlinien, desto stärker ist das Feld an dieser Stelle.']::text[] from public.questions where key = 'phys111-ef-q03'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q04', 'physik', 'Das elektrische Feld', 'single', 'Wie treffen Feldlinien auf eine Leiteroberfläche?', '["Parallel zur Oberfläche", "Unter 45°", "Gar nicht, sie enden vorher", "Senkrecht"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 3}'::jsonb, array['Feldlinien stehen immer senkrecht auf Leiteroberflächen.']::text[] from public.questions where key = 'phys111-ef-q04'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q05', 'physik', 'Das elektrische Feld', 'single', 'Woran erkennt man ein homogenes Feld?', '["Die Feldlinien laufen sternförmig auseinander.", "Die Feldlinien sind kreisförmig.", "Die Feldlinien sind parallel und gleich dicht.", "Es gibt keine Feldlinien."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['Im homogenen Feld (z. B. Plattenkondensator) ist die Feldstärke überall gleich groß und gleich gerichtet.']::text[] from public.questions where key = 'phys111-ef-q05'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q06', 'physik', 'Das elektrische Feld', 'single', 'In welche Richtung wirkt die Kraft auf ein Elektron im elektrischen Feld?', '["In Feldlinienrichtung", "Entgegen der Feldlinienrichtung", "Senkrecht zu den Feldlinien", "Es wirkt keine Kraft"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['Feldlinien zeigen die Kraftrichtung auf positive Ladungen. Das Elektron ist negativ, also wirkt die Kraft entgegengesetzt.']::text[] from public.questions where key = 'phys111-ef-q06'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q07', 'physik', 'Das elektrische Feld', 'single', 'Wie ist die elektrische Feldstärke definiert?', '["E = F / q", "E = F · q", "E = q / F", "E = U · d"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 0}'::jsonb, array['Die Feldstärke ist die Kraft pro Probeladung: E = F/q.']::text[] from public.questions where key = 'phys111-ef-q07'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q08', 'physik', 'Das elektrische Feld', 'single', 'Welche Einheit hat die elektrische Feldstärke?', '["N·C", "V·m", "C/N", "N/C (= V/m)"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 3}'::jsonb, array['[E] = 1 N/C = 1 V/m.']::text[] from public.questions where key = 'phys111-ef-q08'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q09', 'physik', 'Das elektrische Feld', 'single', 'Eine Probeladung q = 2 nC erfährt die Kraft F = 6 · 10⁻⁵ N. Wie groß ist E?', '["1,2 · 10⁻¹³ N/C", "3 · 10⁻⁴ N/C", "3 · 10⁴ N/C", "1,2 · 10⁴ N/C"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['E = F/q = 6 · 10⁻⁵ N / 2 · 10⁻⁹ C = 3 · 10⁴ N/C.']::text[] from public.questions where key = 'phys111-ef-q09'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q10', 'physik', 'Das elektrische Feld', 'single', 'Ein Plattenkondensator hat U = 100 V und d = 0,5 cm. Wie groß ist die Feldstärke?', '["200 V/m", "2 · 10⁴ V/m", "50 V/m", "2 · 10² V/m"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['E = U/d = 100 V / 0,005 m = 2 · 10⁴ V/m. d muss in Metern eingesetzt werden.']::text[] from public.questions where key = 'phys111-ef-q10'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q11', 'physik', 'Das elektrische Feld', 'single', 'Der Abstand zu einer Punktladung wird verdreifacht. Die Feldstärke wird …', '["ein Neuntel so groß", "ein Drittel so groß", "dreimal so groß", "gleich groß"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 0}'::jsonb, array['E ~ 1/r²: (1/3)² = 1/9.']::text[] from public.questions where key = 'phys111-ef-q11'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q12', 'physik', 'Das elektrische Feld', 'single', 'Wer hat das Modell der Feldlinien eingeführt?', '["Charles Augustin de Coulomb", "Isaac Newton", "Robert Millikan", "Michael Faraday"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 3}'::jsonb, array['Faraday führte die Feldlinien als Modell ein. Coulomb maß die Kraft zwischen Ladungen, Millikan die Elementarladung.']::text[] from public.questions where key = 'phys111-ef-q12'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q13', 'physik', 'Das elektrische Feld', 'single', 'Man verdoppelt die Probeladung an einem Punkt im Feld. Was passiert mit E?', '["E verdoppelt sich.", "E halbiert sich.", "E bleibt gleich, nur F verdoppelt sich.", "E wird vierfach so groß."]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 2}'::jsonb, array['E = F/q beschreibt das Feld selbst. Doppelte Ladung → doppelte Kraft → gleicher Quotient.']::text[] from public.questions where key = 'phys111-ef-q13'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;
insert into public.questions (key, subject, topic, type, prompt, options, points) values ('phys111-ef-q14', 'physik', 'Das elektrische Feld', 'single', 'Womit kann man die Struktur eines elektrischen Feldes sichtbar machen?', '["Mit Eisenfeilspänen auf Papier", "Mit Grießkörnern in Öl", "Mit einem Amperemeter", "Mit einem Thermometer"]'::jsonb, 1)
  on conflict (key) do update set subject = excluded.subject, topic = excluded.topic, type = excluded.type, prompt = excluded.prompt, options = excluded.options, points = excluded.points;
insert into public.question_solutions (question_id, answer, explanation) select id, '{"choice": 1}'::jsonb, array['Grießkörner richten sich im elektrischen Feld entlang der Feldlinien aus. Eisenfeilspäne zeigen Magnetfelder.']::text[] from public.questions where key = 'phys111-ef-q14'
  on conflict (question_id) do update set answer = excluded.answer, explanation = excluded.explanation;

insert into public.quizzes (key, kind, subject, topic, title, description, duration_minutes, draw_count)
values ('phys111-mini-coulomb', 'mini', 'physik', 'Elektrische Ladung und Coulomb-Gesetz', 'Mini-Test: Ladung und Coulomb-Gesetz', '8 zufällige Multiple-Choice-Fragen – bei jedem Versuch neu gemischt.', 10, 8)
on conflict (key) do update set kind = excluded.kind, subject = excluded.subject, topic = excluded.topic,
  title = excluded.title, description = excluded.description, duration_minutes = excluded.duration_minutes,
  draw_count = excluded.draw_count;
delete from public.quiz_questions where quiz_id = (select id from public.quizzes where key = 'phys111-mini-coulomb');
insert into public.quiz_questions (quiz_id, question_id, position)
select (select id from public.quizzes where key = 'phys111-mini-coulomb'), q.id, k.pos - 1
from unnest(array['phys111-lc-q01', 'phys111-lc-q02', 'phys111-lc-q03', 'phys111-lc-q04', 'phys111-lc-q05', 'phys111-lc-q06', 'phys111-lc-q07', 'phys111-lc-q08', 'phys111-lc-q09', 'phys111-lc-q10', 'phys111-lc-q11', 'phys111-lc-q12', 'phys111-lc-q13', 'phys111-lc-q14']) with ordinality as k(key, pos)
join public.questions q on q.key = k.key;

insert into public.quizzes (key, kind, subject, topic, title, description, duration_minutes, draw_count)
values ('phys111-mini-feld', 'mini', 'physik', 'Das elektrische Feld', 'Mini-Test: Das elektrische Feld', '8 zufällige Multiple-Choice-Fragen – bei jedem Versuch neu gemischt.', 10, 8)
on conflict (key) do update set kind = excluded.kind, subject = excluded.subject, topic = excluded.topic,
  title = excluded.title, description = excluded.description, duration_minutes = excluded.duration_minutes,
  draw_count = excluded.draw_count;
delete from public.quiz_questions where quiz_id = (select id from public.quizzes where key = 'phys111-mini-feld');
insert into public.quiz_questions (quiz_id, question_id, position)
select (select id from public.quizzes where key = 'phys111-mini-feld'), q.id, k.pos - 1
from unnest(array['phys111-ef-q01', 'phys111-ef-q02', 'phys111-ef-q03', 'phys111-ef-q04', 'phys111-ef-q05', 'phys111-ef-q06', 'phys111-ef-q07', 'phys111-ef-q08', 'phys111-ef-q09', 'phys111-ef-q10', 'phys111-ef-q11', 'phys111-ef-q12', 'phys111-ef-q13', 'phys111-ef-q14']) with ordinality as k(key, pos)
join public.questions q on q.key = k.key;
