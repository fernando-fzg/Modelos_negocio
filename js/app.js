(function () {
  "use strict";

  const BLOQUE = 10;
  const STORE_KEY = "bancoPreguntas.v1";
  const THEME_KEY = "bancoPreguntas.theme";
  const LETRAS = ["A", "B", "C", "D", "E"];
  const app = document.getElementById("app");

  let state = null; // sesión actual

  // ───────── utilidades ─────────
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

  function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }
  function load() { try { const s = JSON.parse(localStorage.getItem(STORE_KEY)); return s && Array.isArray(s.order) ? s : null; } catch (e) { return null; } }
  function clear() { try { localStorage.removeItem(STORE_KEY); } catch (e) {} }

  function nivel(p) {
    if (p >= 90) return { txt: "¡Excelente!", cls: "lv-ok", msg: "Dominas estos contenidos. Sigue así." };
    if (p >= 70) return { txt: "Muy bien", cls: "lv-ok", msg: "Buen nivel; revisa las preguntas falladas para afianzar." };
    if (p >= 50) return { txt: "Puedes mejorar", cls: "lv-mid", msg: "Tienes una base, pero conviene repasar los temas señalados." };
    return { txt: "Necesitas repasar", cls: "lv-bad", msg: "Vuelve al material de los temas señalados antes de continuar." };
  }

  function ring(p) {
    const r = 46, c = 2 * Math.PI * r, off = c * (1 - p / 100);
    const color = p >= 70 ? "var(--ok)" : p >= 50 ? "var(--warn)" : "var(--bad)";
    return `<svg class="ring" viewBox="0 0 110 110" aria-hidden="true">
      <circle class="track" cx="55" cy="55" r="${r}"></circle>
      <circle class="val" cx="55" cy="55" r="${r}" stroke="${color}" stroke-dasharray="${c}" stroke-dashoffset="${off}"></circle>
      <text x="55" y="62" text-anchor="middle">${p}%</text></svg>`;
  }

  // ───────── sesión ─────────
  function nuevaSesion(temas, modo, soloIds) {
    let ids = soloIds || PREGUNTAS.map((_, i) => i).filter((i) => temas.includes(PREGUNTAS[i][0]));
    if (modo === "aleatorio") ids = shuffle(ids);
    const opts = {};
    ids.forEach((i) => { opts[i] = shuffle(PREGUNTAS[i][2].map((_, k) => k)); });
    state = { order: ids, opts, block: 0, answers: {}, phase: "quiz", temas, modo, repaso: !!soloIds };
    save();
    render();
  }

  const totalBloques = () => Math.ceil(state.order.length / BLOQUE);
  const idsBloque = (b) => state.order.slice(b * BLOQUE, (b + 1) * BLOQUE);
  const esCorrecta = (i) => state.answers[i] === 0;

  // ───────── pantallas ─────────
  function render() {
    if (!state) return renderInicio();
    if (state.phase === "quiz") return renderQuiz();
    if (state.phase === "result") return renderResultado();
    if (state.phase === "final") return renderFinal();
  }

  function renderInicio() {
    const previo = load();
    const conteo = {};
    PREGUNTAS.forEach((q) => { conteo[q[0]] = (conteo[q[0]] || 0) + 1; });
    const chips = Object.keys(TEMAS).map((k) => `
      <label class="chip on"><input type="checkbox" name="tema" value="${k}" checked>
        ${esc(TEMAS[k].nombre)} <small>(${conteo[k] || 0})</small></label>`).join("");

    app.innerHTML = `
      <section class="card">
        <h1>Pon a prueba lo aprendido</h1>
        <p class="muted">${PREGUNTAS.length} preguntas de opción múltiple sobre los temas del curso. Cada ${BLOQUE} preguntas verás tu resultado con la retroalimentación de cada respuesta.</p>
        <div class="stats">
          <div class="stat"><b>${PREGUNTAS.length}</b><span>preguntas</span></div>
          <div class="stat"><b>${Object.keys(TEMAS).length}</b><span>temas</span></div>
          <div class="stat"><b>${Math.ceil(PREGUNTAS.length / BLOQUE)}</b><span>bloques de ${BLOQUE}</span></div>
        </div>
        ${previo && previo.phase !== "final" ? `
          <div class="warn" style="margin-bottom:14px">Tienes un intento en curso: bloque ${previo.block + 1} de ${Math.ceil(previo.order.length / BLOQUE)}.
            <div class="row" style="margin-top:8px"><button class="btn btn-primary" id="continuar">Continuar</button></div></div>` : ""}
        <h3>Temas a incluir</h3>
        <div class="chips" id="chips">${chips}</div>
        <div class="row" style="margin:6px 0 18px">
          <button class="btn btn-ghost" id="todos" type="button">Todos</button>
          <button class="btn btn-ghost" id="ninguno" type="button">Ninguno</button>
          <span class="muted" id="sel-info"></span>
        </div>
        <h3>Orden de las preguntas</h3>
        <div class="seg" style="margin-bottom:20px">
          <label><input type="radio" name="modo" value="aleatorio" checked><span>Aleatorio</span></label>
          <label><input type="radio" name="modo" value="temas"><span>Por temas</span></label>
        </div>
        <div class="row"><button class="btn btn-primary" id="empezar">Comenzar</button></div>
      </section>`;

    const chipsEl = document.getElementById("chips");
    const info = document.getElementById("sel-info");
    const btn = document.getElementById("empezar");
    const actualizar = () => {
      const sel = [...chipsEl.querySelectorAll("input:checked")].map((x) => x.value);
      chipsEl.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", c.querySelector("input").checked));
      const n = sel.reduce((s, k) => s + (conteo[k] || 0), 0);
      info.textContent = `${n} preguntas · ${Math.ceil(n / BLOQUE)} bloques`;
      btn.disabled = n === 0;
      return sel;
    };
    chipsEl.addEventListener("change", actualizar);
    document.getElementById("todos").onclick = () => { chipsEl.querySelectorAll("input").forEach((x) => (x.checked = true)); actualizar(); };
    document.getElementById("ninguno").onclick = () => { chipsEl.querySelectorAll("input").forEach((x) => (x.checked = false)); actualizar(); };
    actualizar();
    btn.onclick = () => {
      const modo = document.querySelector("input[name=modo]:checked").value;
      nuevaSesion(actualizar(), modo);
    };
    const cont = document.getElementById("continuar");
    if (cont) cont.onclick = () => { state = previo; render(); };
  }

  function renderQuiz() {
    const ids = idsBloque(state.block);
    const inicio = state.block * BLOQUE;
    const total = state.order.length;
    const html = ids.map((i, n) => {
      const q = PREGUNTAS[i];
      const opciones = state.opts[i].map((k, pos) => {
        const sel = state.answers[i] === k;
        return `<label class="opt${sel ? " sel" : ""}">
          <input type="radio" name="q${i}" value="${k}" ${sel ? "checked" : ""}>
          <span class="letter">${LETRAS[pos]}</span><span>${esc(q[2][k])}</span></label>`;
      }).join("");
      return `<article class="card q" data-id="${i}">
        <div class="q-meta"><span class="q-num">Pregunta ${inicio + n + 1}</span><span class="tag">${esc(TEMAS[q[0]].nombre)}</span></div>
        <div class="q-text">${esc(q[1])}</div>
        <div class="opts">${opciones}</div></article>`;
    }).join("");

    app.innerHTML = `
      <div class="progress-head">
        <h2 style="margin:0">Bloque ${state.block + 1} de ${totalBloques()}${state.repaso ? " · Repaso" : ""}</h2>
        <span class="muted">Preguntas ${inicio + 1}–${inicio + ids.length} de ${total}</span>
      </div>
      <div class="bar"><i style="width:${pct(inicio, total)}%"></i></div>
      <div id="qs">${html}</div>
      <div class="sticky-actions">
        <button class="btn btn-primary" id="ver">Ver resultados del bloque</button>
        <span class="muted" id="faltan"></span>
        <span class="spacer"></span>
        <button class="btn btn-ghost" id="salir">Salir</button>
      </div>`;

    const faltan = document.getElementById("faltan");
    const contar = () => {
      const n = ids.filter((i) => state.answers[i] === undefined).length;
      faltan.textContent = n ? `Te faltan ${n} por responder` : "¡Todas respondidas!";
    };
    document.getElementById("qs").addEventListener("change", (e) => {
      const card = e.target.closest(".q");
      if (!card) return;
      const id = +card.dataset.id;
      state.answers[id] = +e.target.value;
      card.querySelectorAll(".opt").forEach((o) => o.classList.toggle("sel", o.querySelector("input").checked));
      save(); contar();
    });
    contar();
    document.getElementById("ver").onclick = () => {
      const n = ids.filter((i) => state.answers[i] === undefined).length;
      if (n && !confirm(`Tienes ${n} pregunta(s) sin responder; contarán como incorrectas. ¿Ver resultados de todos modos?`)) return;
      state.phase = "result"; save(); render(); window.scrollTo(0, 0);
    };
    document.getElementById("salir").onclick = () => { state = null; render(); window.scrollTo(0, 0); };
    window.scrollTo(0, 0);
  }

  function resumenTemas(ids) {
    const t = {};
    ids.forEach((i) => {
      const k = PREGUNTAS[i][0];
      t[k] = t[k] || { ok: 0, n: 0 };
      t[k].n++; if (esCorrecta(i)) t[k].ok++;
    });
    return t;
  }

  function consejos(t) {
    const debiles = Object.keys(t).filter((k) => t[k].ok / t[k].n < 0.7)
      .sort((a, b) => t[a].ok / t[a].n - t[b].ok / t[b].n);
    if (!debiles.length) return `<p>No hay temas débiles en este bloque. ¡Buen trabajo!</p>`;
    return `<ul class="tips">${debiles.map((k) => `<li><b>${esc(TEMAS[k].nombre)}</b> — ${t[k].ok}/${t[k].n} correctas. Repasa: <i>${esc(TEMAS[k].fuente)}</i>.</li>`).join("")}</ul>`;
  }

  function renderResultado() {
    const ids = idsBloque(state.block);
    const ok = ids.filter(esCorrecta).length;
    const p = pct(ok, ids.length);
    const lv = nivel(p);
    const inicio = state.block * BLOQUE;
    const ultimo = state.block >= totalBloques() - 1;

    const revision = ids.map((i, n) => {
      const q = PREGUNTAS[i];
      const r = state.answers[i];
      const bien = r === 0;
      const tuya = r === undefined ? "Sin responder" : q[2][r];
      return `<article class="card review ${bien ? "ok" : "bad"}">
        <div class="q-meta"><span class="q-num">Pregunta ${inicio + n + 1}</span>
          <span class="badge ${bien ? "ok" : "bad"}">${bien ? "Correcta" : "Incorrecta"}</span>
          <span class="tag">${esc(TEMAS[q[0]].nombre)}</span></div>
        <div class="q-text">${esc(q[1])}</div>
        ${bien ? `<div class="ans ok">✓ ${esc(q[2][0])}</div>`
               : `<div class="ans bad">✗ Tu respuesta: ${esc(tuya)}</div><div class="ans ok">✓ Correcta: ${esc(q[2][0])}</div>`}
        <div class="explain"><b>Retroalimentación:</b> ${esc(q[3])}</div></article>`;
    }).join("");

    app.innerHTML = `
      <div class="progress-head">
        <h2 style="margin:0">Resultado del bloque ${state.block + 1} de ${totalBloques()}</h2>
        <span class="muted">Preguntas ${inicio + 1}–${inicio + ids.length}</span>
      </div>
      <div class="bar"><i style="width:${pct(inicio + ids.length, state.order.length)}%"></i></div>
      <section class="card">
        <div class="score">
          ${ring(p)}
          <div>
            <div class="level ${lv.cls}">${lv.txt}</div>
            <p style="margin:0 0 4px"><b>${ok} de ${ids.length}</b> respuestas correctas.</p>
            <p class="muted" style="margin:0">${lv.msg}</p>
          </div>
        </div>
      </section>
      <section class="card"><h3>Qué repasar</h3>${consejos(resumenTemas(ids))}</section>
      <h2>Revisión pregunta por pregunta</h2>
      ${revision}
      <div class="sticky-actions">
        <button class="btn btn-primary" id="sig">${ultimo ? "Ver resumen final" : "Siguiente bloque →"}</button>
        <button class="btn btn-ghost" id="rep">Repetir este bloque</button>
        <span class="spacer"></span>
        <button class="btn btn-ghost" id="salir">Salir</button>
      </div>`;

    document.getElementById("sig").onclick = () => {
      if (ultimo) state.phase = "final"; else { state.block++; state.phase = "quiz"; }
      save(); render(); window.scrollTo(0, 0);
    };
    document.getElementById("rep").onclick = () => {
      ids.forEach((i) => { delete state.answers[i]; state.opts[i] = shuffle(state.opts[i]); });
      state.phase = "quiz"; save(); render();
    };
    document.getElementById("salir").onclick = () => { state = null; render(); window.scrollTo(0, 0); };
  }

  function renderFinal() {
    const ids = state.order;
    const ok = ids.filter(esCorrecta).length;
    const p = pct(ok, ids.length);
    const lv = nivel(p);
    const t = resumenTemas(ids);
    const fallas = ids.filter((i) => !esCorrecta(i));

    const barras = Object.keys(TEMAS).filter((k) => t[k]).map((k) => {
      const v = pct(t[k].ok, t[k].n);
      const color = v >= 70 ? "var(--ok)" : v >= 50 ? "var(--warn)" : "var(--bad)";
      return `<div class="tbar"><span>${esc(TEMAS[k].nombre)} <span class="muted">(${t[k].ok}/${t[k].n})</span></span>
        <div class="b"><i style="width:${v}%;background:${color}"></i></div><span class="p">${v}%</span></div>`;
    }).join("");

    const bloques = [];
    for (let b = 0; b < totalBloques(); b++) {
      const bi = idsBloque(b);
      bloques.push(`<span class="tag">B${b + 1}: ${bi.filter(esCorrecta).length}/${bi.length}</span>`);
    }

    app.innerHTML = `
      <section class="card">
        <h1>Resumen final</h1>
        <div class="score" style="margin-top:10px">
          ${ring(p)}
          <div>
            <div class="level ${lv.cls}">${lv.txt}</div>
            <p style="margin:0 0 4px"><b>${ok} de ${ids.length}</b> respuestas correctas.</p>
            <p class="muted" style="margin:0">${lv.msg}</p>
          </div>
        </div>
      </section>
      <section class="card"><h3>Desempeño por tema</h3>${barras}</section>
      <section class="card"><h3>Recomendaciones</h3>${consejos(t)}</section>
      <section class="card"><h3>Resultados por bloque</h3><div class="row">${bloques.join("")}</div></section>
      <div class="row" style="margin-top:8px">
        ${fallas.length ? `<button class="btn btn-primary" id="repaso">Repasar las ${fallas.length} falladas</button>` : ""}
        <button class="btn btn-ghost" id="nuevo">Nuevo intento</button>
      </div>`;

    const rep = document.getElementById("repaso");
    if (rep) rep.onclick = () => nuevaSesion(state.temas, "aleatorio", shuffle(fallas));
    document.getElementById("nuevo").onclick = () => { clear(); state = null; render(); };
  }

  // ───────── tema claro/oscuro ─────────
  (function tema() {
    let t = null;
    try { t = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (t) document.documentElement.setAttribute("data-theme", t);
    document.getElementById("themeBtn").onclick = () => {
      const actual = document.documentElement.getAttribute("data-theme")
        || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const nuevo = actual === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", nuevo);
      try { localStorage.setItem(THEME_KEY, nuevo); } catch (e) {}
    };
  })();

  render();
})();
