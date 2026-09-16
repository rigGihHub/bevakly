# v3.25.0 – Bounded Refresh Runtime

- Ersätter synkron hämtning från samtliga 75 fasta källor med en tidsbegränsad 24-källorscykel per uppdatering.
- Skyddar alla verifierade konkurrentkällor i varje cykel och roterar övriga prioriterade, standard- och utforskningskällor per timme.
- Sätter separata deadlines för listningshämtning, artikelgranskning och extern discovery inom en total budget på 45 sekunder.
- Begränsar artikelgranskningen till 72 balanserade kandidatkluster och den primära discovery-körningen till åtta frågor.
- Nedprioriterar sekundär gap-discovery och webbplatsmonitorering när den återstående tidsbudgeten är liten.
- Exponerar faktisk källbudget och förbrukad körtid i utvecklardiagnostiken utan att lägga mer teknisk text i normalflödet.
