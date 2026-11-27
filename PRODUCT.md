# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

(Installable web app / PWA, used mostly on iPhone and iPad, also on laptops. Static Next.js export on GitHub Pages, data in Supabase.)

## Users

The whole Grade 11 year at one school (classes 11a–11d), currently in half-year 11.1. Students use it on their phones and iPads during the school day and at home: to look up an explanation before a test, practise with exam-style tasks, check when the next Klausur is, and see their grades and NC.

Students take a common core plus electives: Art or Music, and two of Physics / Arabic / Biology (Chemistry is for everyone). Each student only sees their own subjects.

Interface languages: German, English and Arabic (right-to-left). Study content itself is in German, the language of instruction.

## Product Purpose

One place for the school year. Three jobs matter equally:

1. **Learn and pass the next exam.** Clear explanations per subject and topic, plus practice (Schulaufgaben, Klapptests, mini tests, mock exams, flashcards) whose solutions follow exactly the method and layout the teacher uses.
2. **Keep track of school.** The school's official exam plan (Klausurplan) with a countdown and calendar, and a grade book: written exam points (0–15) plus up to two oral grades per subject, each half the result, and the NC calculated like the school's grade sheet: NC = (17 − average points) ÷ 3.
3. **Learn together.** Communities (friend groups joined by code) with a chat and leaderboards; an opt-in public leaderboard per subject and NC.

Success: a student opens the app before a test and finds the right explanation and practice immediately, always knows their next exam and current NC, and studies with friends.

## Positioning

Made by a student of this year, for this year: the content is built directly from the class's own worksheets, textbook pages and teacher solutions (same tasks, same step-by-step layout, same terminology). The exam plan, grading rules, NC formula and subject choices are exactly this school's. A generic study app cannot truthfully copy that.

## Operating Context

- Material comes from class: photos and PDFs of worksheets, textbook pages, board notes, the teacher's Klausurplan (Excel) and grade sheet. The owner turns these into study pages with Claude.
- Students mostly open the app on a phone between lessons or on an iPad at home; Goodnotes and paper worksheets are used alongside it.
- Exams are "Klausuren" on fixed dates per subject; some subjects (Art/Music) have class-specific dates (e.g. 11a–11c vs 11d).
- German school terms are kept as they are: Klausur, Schulaufgabe, mündliche Note, Halbjahr, NC, Punkte 0–15.

## Capabilities and Constraints

- **Content authoring:** only the owner adds study content and the exam plan (with Claude). Students do not create content; admins can edit the exam plan.
- Study pages are self-contained HTML files shown inside the app (sandboxed iframe); they follow the app's light/dark mode. Formulas use bundled KaTeX.
- Accounts via Supabase (email + password); everyone picks a display name. Grades are private unless shared (public board per subject) or inside a community (members see each other's averages, never single grades).
- Students cannot add their own exams; grades can only be entered for exams in the plan, plus the oral slots.
- Light, dark and system appearance must keep working; the app must work on phone widths without sideways scrolling.
- Undecided: Grade 12 content (shown as "soon"); whether other grades or schools join later.

## Brand Commitments

- Name: **Study Hub**.
- Subjects are represented as books, each with its own colour and icon.
- The owner changes visual direction often and wants it study-friendly, clear and readable first, with personality second.

## Evidence on Hand

- Real class material in the app: Biology (Klausur study page, quiz), Physics (Elektrische Stromstärke), Religion (Klausur page), Math 11.1 (Extremalprobleme, Funktionsgleichungen gesucht, two Schulaufgaben, Klapptest 32), Deutsch Lyrik (in progress).
- The school's Klausurplan for 11.1 (Herbst 2026/27) and the NC grade sheet (Notenrechner).
- No testimonials, usage numbers or outside endorsements exist; do not invent them.

## Product Principles

1. **Exactly like class.** Explanations and solutions use the teacher's method, steps and terms, not a generic version.
2. **Correct before pretty.** Every solution, date and grade calculation is verified; wrong study content is the worst failure.
3. **Only what's mine.** Each student sees their subjects, their exams, their grades, without clutter from others.
4. **Fast on a phone.** The next exam, a topic or a solution is a tap or a search away.
5. **Private by default, social by choice.** Grades are shared only when the student opts in or joins a community.

## Accessibility & Inclusion

- Arabic right-to-left layout must work; German, English and Arabic UI.
- Readable text sizes and contrast in both light and dark mode; respect reduced-motion settings.
