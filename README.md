# Banco de Preguntas · Modelos de Negocio en Bioingeniería

Cuestionario web de **200 preguntas de opción múltiple** basado en el material del curso. Cada **10 preguntas** se muestra el resultado del bloque con la retroalimentación de cada respuesta y los temas a repasar. Al final aparece un resumen por tema y la opción de repasar solo las preguntas falladas.

## Temas

| Tema | Preguntas | Material |
|---|---|---|
| Innovación biomédica y Design Thinking | 24 | Clase 1 |
| Propiedad intelectual (patentes, marcas, derechos de autor) | 30 | Clase 2 |
| Propuesta de valor y competencia | 10 | Clase 2 |
| Lean Startup y Lean Canvas | 30 | Clase 3 |
| Metodologías ágiles (Scrum y Kanban) | 30 | Clase 4 |
| Estrategias de marketing | 20 | Sesión 01 · Prof. Barrenechea |
| Perfil del cliente y estudio de mercado | 20 | Sesión 02 · Prof. Barrenechea |
| Estrategia y gestión por procesos | 20 | Clase 8 |
| Marketing digital | 16 | Introducción al Marketing Digital |

## Funciones

- Filtrar por temas y elegir orden aleatorio o por temas.
- Las alternativas se barajan en cada intento.
- Resultado y retroalimentación cada 10 preguntas; opción de repetir el bloque.
- Resumen final por tema y repaso de las preguntas falladas.
- El progreso se guarda en el navegador (`localStorage`).
- Modo claro/oscuro y diseño adaptable a celular.

## Publicar en GitHub Pages

1. Crea un repositorio nuevo en GitHub (por ejemplo `banco-preguntas`).
2. Sube el contenido de esta carpeta (`index.html`, `css/`, `js/`, `README.md`, `.nojekyll`) a la raíz del repositorio:
   ```bash
   git init
   git add .
   git commit -m "Banco de preguntas"
   git branch -M main
   git remote add origin https://github.com/TU-USUARIO/banco-preguntas.git
   git push -u origin main
   ```
   También puedes arrastrar los archivos en GitHub con **Add file → Upload files**.
3. En el repositorio ve a **Settings → Pages**, en *Source* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`, y guarda.
4. En uno o dos minutos el sitio estará en `https://TU-USUARIO.github.io/banco-preguntas/`.

## Editar o agregar preguntas

Las preguntas están en `js/preguntas.js` con este formato:

```js
["TEMA", "Enunciado", ["Respuesta correcta", "Distractor 1", "Distractor 2", "Distractor 3"], "Retroalimentación"]
```

La respuesta correcta siempre va **primera** en el arreglo; la aplicación baraja las alternativas al mostrarlas. Los códigos de tema (`INN`, `PI`, `PV`, `LEAN`, `AGIL`, `MKT`, `CLI`, `PROC`, `DIG`) están definidos en `TEMAS` al inicio del archivo.

## Probar localmente

Basta con abrir `index.html` en el navegador; no requiere servidor ni dependencias.
