# NASA Space Apps 2026 — Project page text (copy & paste)

> **ES:** Textos en inglés para la pestaña **Project** del portal oficial (spaceappschallenge.org/2026). Copiar cada bloque en su campo, aceptar los términos y pulsar **Submit** (guardar no es enviar). Plazo: 15 nov 2026, 23:59 (Ecuador, UTC−5).
> **EN:** English text for the **Project** tab of the official portal. Paste each block into its field, accept the terms and press **Submit**.

## Project name
ECOS — Stories that keep traveling

## High-level summary
ECOS is a free web app that turns NASA's records of the Spirit and Opportunity rovers on Mars and the Apollo 12 ALSEP station on the Moon into interactive stories for three ages (7–11, 12–17, 18+). Users explore each mission stop by stop on an illustrated route with minigames, sound and achievements. Every fact links to its official NASA source, and an AI analogy (always labeled) connects that fact to the user's own interests, without changing it. No sign-up, no personal data, no permissions.

## Link to Project Demo
https://github.com/Anyxg12/Ecos-space-apps/blob/main/docs/entregables/Presentation_EN.pdf
(7-slide deck in English, PDF.)

## Link to Final Project
https://anyxg12.github.io/Ecos-space-apps/
(Live prototype; source code: https://github.com/Anyxg12/Ecos-space-apps)

## Detailed description
**Problem.** Equipment NASA left on Mars and the Moon has remarkable stories, but they are spread across mission pages, catalogs and PDFs written for specialists. Personalized education, which adapts explanations to each learner, is usually hard to get and expensive.

**Approach.** We designed one story per artifact (Spirit, Opportunity, ALSEP) and three visual modes for three ages: Junior (2D illustrated storybook), Explorer (video-game look) and Discovery (cinematic digital museum). Facts come only from nasa.gov sources and are stored as short verified records with their URL. The app is a static React + TypeScript site (Vite, Tailwind, Motion, three.js, Canvas/WebGL, Web Audio) hosted on GitHub Pages. An optional backend on Supabase provides anonymous accounts, progress and a live leaderboard (Row Level Security), plus an Edge Function that asks Google Gemini for a short analogy linking a verified fact to the user's chosen interests. The Gemini key stays on the server.

**Development.** Working features: cinematic prologue; selection of up to 5 interests; Mars and Moon worlds; three interactive routes with minigames (assemble the rover, hold to launch, connect the ALSEP instruments, send Opportunity's last transmission); Sofi Collis's real voice (the girl who named the rovers) streamed from a NASA podcast; "Mis logros" achievements as a rocket ascent; "Top explorers" leaderboard; nickname profile with an optional secret key kept only on the device. The AI analogy is shown below the unchanged fact, labeled "generated with AI", and an automatic check rejects outputs with numbers not present in the fact, quotes or links. If the AI or the server fails, the app keeps working locally.

**Results and limitations.** The prototype runs in the browser on desktop and mobile without login. The AI analogy and leaderboard were tested on the live site. Limitations: route narrations are labeled "Contenido provisional" (provisional content) while the team reviews them; demo leaderboard rows are labeled; accounts cannot yet be recovered on another device; scenes are illustrative, not to scale. The interface is in Spanish (our local audience); the documentation is bilingual. Next steps: account recovery, new artifacts (shown today as locked "future signals"), and review of the narrations.

## NASA data & resources
We used NASA mission pages, NSSDCA catalog entries and NASA media. From each source we took dates, places, instruments and figures; each fact appears at its route stop with a link to the source, and it is the only input the AI analogy may use (it cannot add new numbers).
- NASA Science — Mars Exploration Rovers: https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/
- NASA Science — Spirit (MER-A): https://science.nasa.gov/mission/mer-spirit/
- NASA Science — Opportunity (MER-B): https://science.nasa.gov/mission/mer-opportunity/
- NASA JPL — end of the Opportunity mission: https://www.jpl.nasa.gov/news/nasas-opportunity-rover-mission-on-mars-comes-to-end/
- NASA — Apollo 12: https://www.nasa.gov/mission/apollo-12/
- NASA Science — Apollo 12 Experiments in Progress: https://science.nasa.gov/resource/apollo-12-experiments-in-progress/
- NSSDCA 1969-099C — Apollo 12 ALSEP: https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-099C
- Apollo 12 press kit (PDF): https://science.nasa.gov/wp-content/uploads/2023/09/Apollo_12.pdf
- NASA podcast "On a Mission" S4E3 (Sofi Collis's voice, streamed, not hosted): https://www.nasa.gov/podcasts/on-a-mission/rise-of-the-twins-spirit-and-opportunity-s4e3/
- NASA History — News & Notes 36-1 ("I'll Be Seeing You", mentioned only, not played): https://www.nasa.gov/wp-content/uploads/2023/01/NewsNotes-36-1-Spring-2019.pdf
- NASA Blue Marble (Earth texture, public domain): https://science.nasa.gov/earth/earth-observatory/the-blue-marble-true-color-global-imagery-at-1km-resolution/
Full list with where each link is used: https://github.com/Anyxg12/Ecos-space-apps/blob/main/docs/LINKS.md

**Other resources and licenses:** React and React DOM, three.js, Motion, supabase-js, Vite, Tailwind CSS (MIT); TypeScript (Apache 2.0); Supabase (backend service); Google Gemini API (analogies); Inter and Cormorant Garamond typefaces in the deck (SIL Open Font License). Sound effects are procedural (Web Audio). No NASA logos are used. ECOS code is MIT-licensed.

## Use of Artificial Intelligence (AI)
- **Grok Bot:** wrote and automated the app's code, QA test scripts and documentation, wrote and laid out the deck, the project sheet and these submission texts (reviewed by the team), and helped find and summarize NASA sources.
- **ChatGPT Work:** art and creative direction, narrative and coordination (no image generation); it also edited the demo video in DaVinci Resolve, delegated by the team.
- **Dola AI:** a few art-direction reference sketches; they are not used in the app or the deliverables.
- **Google Gemini (in the app):** generates the "analogy for you" text at runtime; always labeled "generated with AI", shown below the unchanged NASA fact.
- **What the team (The Last Neuron) did:** the idea, the purpose (a free, personalized educational web app), the features and design decisions; supervised and reviewed the generated code, tested the app and found and fixed bugs together with the AI.
- **Demo video:** the team (Antony Camacho) recorded the clips with the real app running; ChatGPT Work edited them in DaVinci Resolve; **the background music and sound effects were generated with AI**. Sofi's voice in it is NASA's official audio.
- **No AI-generated images or video** are used in the app, the deck or the demo video, and the app itself plays no AI audio (its sound is procedural Web Audio). Graphics are drawn by code (SVG/CSS/Canvas/WebGL). No NASA logos, flags or identifiers were created or altered with AI.
