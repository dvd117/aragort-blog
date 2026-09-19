---
title: "Por qué dejé los chatbots"
description: "La conversación es desechable; el archivo no."
resumen:
  - "Al chatbot le preguntas. Al agente lo diriges."
  - "Mi contexto vive en archivos que controlo, no dentro de la aplicación."
  - "Lo que me llevo es lo que quedó escrito."
---

## El primer problema

Las herramientas de inteligencia artificial cambian prácticamente cada mes, pero la mayoría de las personas las siguen usando igual que cuando salió ChatGPT: abren un chat, hacen una pregunta, iteran y copian la respuesta. Hasta el año pasado, los "agentes" eran cosa de programadores. Pero eso está cambiando rápidamente y quiero contarte por qué dejé de usar los chatbots y qué gané con ese cambio.

A principios de este año migré de ChatGPT a Claude y la experiencia no fue lo que esperaba. Después de años de uso, ChatGPT tenía mucho contexto sobre mí: mi trabajo, mis proyectos y la forma en que me gustaba trabajar con la herramienta. A pesar de que usé la función de Claude para importar la memoria desde otros proveedores, lo que llegó estaba incompleto, mezclaba temas que no tenían nada que ver entre sí y parte de la información era inexacta.

Ahí noté el primer problema. Cuando solo usas el chatbot, la empresa guarda en sus servidores tus memorias, tus preferencias y el contexto de tus conversaciones en formatos que no siempre puedes descargar para usarlos con otro proveedor, o al menos no de forma confiable. Esto importa y mucho, porque para obtener un buen resultado no basta con tener un modelo capaz. **El contexto es igual de importante** y sin él lo más probable es que recibas una respuesta genérica que no se ajusta a tus necesidades u objetivos.

## Preguntar o dirigir

Poco después, en un taller práctico sobre inteligencia artificial, uno de los mentores me recomendó probar [Superpowers](https://github.com/obra/superpowers#how-it-works), un conjunto de habilidades (*skills*, en inglés) que le enseñan al agente a planificar antes de actuar y a revisar su trabajo antes de decir que terminó. El detalle es que, en ese momento, solo funcionaba con agentes y yo solo usaba el chatbot.

Si te preguntas cuál es la diferencia, es sencilla. Un chatbot conversa contigo: tú preguntas, te responde y lo que hagas con esa respuesta depende de ti. Un agente trabaja: puede leer archivos de tu computadora, crear o editar documentos, usar otros programas y encadenar varios pasos hasta terminar una tarea. **Al chatbot le preguntas. Al agente lo diriges.**[^seguridad]

## El experimento

Así que decidí experimentar y migrar mi flujo de trabajo completamente desde el chatbot a un agente. Me inspiré sobre todo en dos ideas: ["archivos por encima de aplicaciones" de Steph Ango](https://stephango.com/file-over-app), uno de los desarrolladores de Obsidian; y la ["LLM wiki" de Andrej Karpathy](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f), uno de los miembros fundadores de OpenAI. Ango sostiene que, si quieres que lo que estás creando permanezca, tiene que estar en archivos que controlas y en formatos accesibles. Karpathy propone que un agente construya y mantenga una carpeta de archivos de texto, para que el conocimiento se acumule con el tiempo en vez de buscarse de nuevo cada vez que se necesite.

Con esas dos ideas entendí que, en vez de dejar que la plataforma generara y guardara las memorias de mis conversaciones, podía construir mi propia versión de ese sistema con archivos locales, que viven en mi computadora y no en los servidores de estas empresas. Y a diferencia del chatbot, un agente sí puede leerlos.[^local]

El experimento me ha llevado muchas iteraciones, sobre todo porque las herramientas siguen cambiando y cosas que no eran posibles cuando empecé hoy lo son. Aun así, el resultado fue mejor de lo que esperaba. Hoy tengo un sistema que sabe lo suficiente sobre mí para darme respuestas útiles en vez de genéricas y todo ese contexto vive en archivos de texto en mis propias carpetas: quién soy, qué hago, cómo trabajo y cuáles son mis objetivos.

Con archivos de instrucciones ([AGENTS.md](https://agents.md/) o [CLAUDE.md](https://code.claude.com/docs/es/glossary#claude-md), según la herramienta) le explico al agente cómo quiero que se comporte, en general o para un proyecto específico. Con las *skills* le enseño a hacer tareas concretas como yo las haría. Este tema da para otro texto, pero lo que quiero que te lleves es que **la personalización dejó de ser algo que la plataforma hace por mí y pasó a ser algo que controlo yo**.

Eso hace que mi contexto sea portable. Es decir, si mañana quiero cambiar de proveedor, pago una suscripción, instalo otra herramienta, selecciono la misma carpeta y sigo trabajando sin perder contexto y sin estar atado a una empresa en específico. Funciona por dos razones: todo es texto plano, en formato [Markdown](https://es.wikipedia.org/wiki/Markdown); y buena parte de estas herramientas son de [código abierto](https://es.wikipedia.org/wiki/C%C3%B3digo_abierto) y usan formatos abiertos. Los mismos archivos de instrucciones y las mismas *skills* funcionan en Claude Code, Codex y OpenCode.

## ¿Qué te llevas contigo?

Pero más allá de lo que yo opino, también hay una tendencia clara. Este año Anthropic y OpenAI desarrollaron herramientas para llevar los agentes a quienes no programan. Anthropic empezó con [Claude Cowork](https://claude.com/blog/cowork-is-now-claude) a principios de año y OpenAI lanzó [ChatGPT Work](https://openai.com/index/chatgpt-for-your-most-ambitious-work/) a mediados de año. Las dos llevan las capacidades de un agente a tareas de oficina y trabajan directamente con los archivos de tu computadora, incluidos PDF, Word, Excel y PowerPoint.

Hace unos días, además, Anthropic integró Cowork en el chat de Claude. Antes era una sección aparte que tenías que ir a buscar y ahora está ahí desde que abres Claude. Para quien ya lo usaba no cambió mucho y quien no lo usaba ahora lo estará usando por defecto. Todo apunta a que el agente se va a convertir en la forma estándar de usar estas herramientas en poco tiempo.

Te conté mi caso, pero el tuyo puede ser distinto. Yo trabajo sobre todo con Claude Code y sus equivalentes. No uso Claude Cowork ni ChatGPT Work, así que no puedo explicarte cómo funcionan por dentro. Pero te invito a hacerte una pregunta: si mañana te cambias a otro proveedor, ¿qué te llevas contigo? Si tus instrucciones y tu contexto viven dentro de la aplicación, se quedan ahí. **Si viven en archivos en tus carpetas, se van contigo.** Esa pregunta te va a servir hoy y dentro de seis meses, cuando estas herramientas hayan vuelto a cambiar.

Para ser justo, la portabilidad total de las conversaciones no la tiene nadie, yo incluido. Mis conversaciones también se quedan en los servidores del proveedor. Lo que me llevo es lo que quedó escrito: las memorias, las instrucciones y las decisiones que fui guardando en archivos mientras trabajaba.

> La conversación es desechable; el archivo no.

Esa disciplina de escribir el contexto en vez de confiar en que la plataforma lo recuerde es lo que hace la diferencia y no depende de qué herramienta uses.

Dejé los chatbots hace varios meses por algo más simple que la dirección que están tomando estas herramientas. Los modelos son los mismos en los dos casos; lo que cambia es qué puede hacer la herramienta y dónde queda el contexto. El chatbot responde y se queda con todo. Un agente puede trabajar sobre tus archivos, pero el contexto solo se queda contigo si lo escribes en ellos.

---

Esto es parte de lo que quiero enseñar con [Ateneo Abierto](https://ateneo-abierto.org), un proyecto para aprender a usar estas herramientas desde Venezuela con lo que tienes a mano, sin depender de una sola empresa y sin tener que saber programar. A largo plazo, la idea es conectar esto con la educación tradicional y con espacios físicos donde la gente pueda encontrarse y acceder a oportunidades educativas. Si quieres saber más, puedes ver mi presentación sobre Ateneo Abierto, un [Ignite Talk en el Oslo Freedom Forum 2026](https://youtu.be/oS2N8cz7p4w) (en inglés).

[^seguridad]: Y sí, un programa que puede leer y editar tus archivos merece una conversación aparte sobre seguridad y planeo abordar el tema en otro texto. Por ahora basta con saber que la pregunta es válida y tiene respuesta.

[^local]: Aclaro que no hablo de ejecutar modelos en local. El tema me interesa, pero hoy no es realista, especialmente por el costo, ejecutar en local algo que se acerque a los principales modelos comerciales. Lo que vive en mi computadora es el contexto, no el modelo. Las conversaciones siguen pasando por los servidores del proveedor, que es donde ocurre la inferencia, y cada proveedor aplica sus propias políticas de retención de datos.
