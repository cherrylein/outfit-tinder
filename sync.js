(() => {
  const REVIEW_KEY = "outfit-selection-v1";
  const USER_KEY = "outfit-selection-user-v1";
  const PROJECT_KEY = "outfit-selection-project-v1";
  const API_URL = "/api/state";

  const params = new URLSearchParams(window.location.search);
  const project = normalizeProject(params.get("project") || localStorage.getItem(PROJECT_KEY) || "vader");
  const userFromUrl = cleanName(params.get("user"));
  let userName = cleanName(userFromUrl || localStorage.getItem(USER_KEY));
  let onlineReady = false;
  let posting = false;
  let postTimer = 0;
  let originalSetItem = localStorage.setItem.bind(localStorage);

  boot().catch(error => {
    console.warn("Outfit sync inactive:", error);
    renderSyncPanel("Nur lokal", "Datenbank noch nicht verbunden");
  });

  async function boot() {
    localStorage.setItem(PROJECT_KEY, project);
    userName = await requireUserName();
    localStorage.setItem(USER_KEY, userName);

    patchLocalStorage();
    renderSyncPanel("Verbinde...", `${userName} · ${project}`);

    const remote = await fetchState(userName);
    const local = readLocalState();
    const hasRemote = remote && Object.keys(remote.state || {}).length > 0;
    const hasLocal = Object.keys(local).length > 0;

    if (hasRemote && JSON.stringify(remote.state) !== JSON.stringify(local)) {
      originalSetItem(REVIEW_KEY, JSON.stringify(remote.state));
      sessionStorage.setItem(hydrationKey(), "1");
      location.reload();
      return;
    }

    onlineReady = true;
    renderSyncPanel("Online", `${userName} · ${project}`);

    if (hasLocal && !hasRemote) {
      queuePost();
    }
  }

  function normalizeProject(value) {
    return String(value || "default")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "default";
  }

  function cleanName(value) {
    return String(value || "")
      .trim()
      .replace(/\s+/g, " ")
      .slice(0, 60);
  }

  async function requireUserName() {
    if (userName) return userName;

    let entered = "";
    while (!entered) {
      entered = cleanName(window.prompt("Wer bewertet gerade? Bitte Namen eingeben, z. B. Rosa oder Gerrit."));
      if (!entered) {
        const continueLocal = window.confirm("Ohne Namen funktioniert die gemeinsame Speicherung nicht. Erstmal nur lokal weitermachen?");
        if (continueLocal) throw new Error("No user name selected");
      }
    }
    return entered;
  }

  function hydrationKey() {
    return `outfit-sync-hydrated:${project}:${userName}`;
  }

  function readLocalState() {
    try {
      return JSON.parse(localStorage.getItem(REVIEW_KEY)) || {};
    } catch {
      return {};
    }
  }

  function patchLocalStorage() {
    localStorage.setItem = function patchedSetItem(key, value) {
      originalSetItem(key, value);
      if (key === REVIEW_KEY && onlineReady && !posting) queuePost();
    };
  }

  function queuePost() {
    window.clearTimeout(postTimer);
    renderSyncPanel("Speichere...", `${userName} · ${project}`);
    postTimer = window.setTimeout(postState, 450);
  }

  async function fetchState(user) {
    const response = await fetch(`${API_URL}?project=${encodeURIComponent(project)}&user=${encodeURIComponent(user)}`, {
      headers: { "accept": "application/json" }
    });
    if (!response.ok) throw new Error(`State GET failed: ${response.status}`);
    return response.json();
  }

  async function postState() {
    posting = true;
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "content-type": "application/json", "accept": "application/json" },
        body: JSON.stringify({ project, userName, state: readLocalState() })
      });
      if (!response.ok) throw new Error(`State POST failed: ${response.status}`);
      renderSyncPanel("Gespeichert", `${userName} · ${project}`);
    } catch (error) {
      console.warn("Outfit sync failed:", error);
      renderSyncPanel("Lokal", "Sync fehlgeschlagen");
    } finally {
      posting = false;
    }
  }

  async function fetchParticipants() {
    const response = await fetch(`${API_URL}?project=${encodeURIComponent(project)}`, {
      headers: { "accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Participants GET failed: ${response.status}`);
    return response.json();
  }

  function renderSyncPanel(status, detail) {
    let panel = document.getElementById("syncPanel");
    if (!panel) {
      panel = document.createElement("div");
      panel.id = "syncPanel";
      panel.innerHTML = `
        <button type="button" id="syncIdentity"></button>
        <button type="button" id="syncResults">Alle Ergebnisse</button>
      `;
      document.body.appendChild(panel);
      injectStyles();
      document.getElementById("syncIdentity").addEventListener("click", switchUser);
      document.getElementById("syncResults").addEventListener("click", showResults);
    }

    const identity = document.getElementById("syncIdentity");
    identity.textContent = `${status}: ${detail}`;
    identity.title = "Name wechseln";
  }

  function injectStyles() {
    if (document.getElementById("syncStyles")) return;
    const style = document.createElement("style");
    style.id = "syncStyles";
    style.textContent = `
      #syncPanel {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 80;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        justify-content: flex-end;
        max-width: calc(100vw - 24px);
        pointer-events: none;
      }
      #syncPanel button {
        pointer-events: auto;
        border: 1px solid rgba(29, 23, 21, 0.16);
        border-radius: 999px;
        padding: 9px 12px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 8px 24px rgba(29, 23, 21, 0.12);
        color: #1d1715;
        font: 700 12px/1.15 Inter, ui-sans-serif, system-ui, sans-serif;
      }
      #syncResults {
        background: #1d1715 !important;
        color: #fff !important;
      }
      .sync-modal {
        position: fixed;
        inset: 0;
        z-index: 120;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(29, 23, 21, 0.72);
      }
      .sync-dialog {
        width: min(760px, 100%);
        max-height: min(760px, 88dvh);
        overflow: auto;
        border-radius: 8px;
        background: #fff;
        color: #1d1715;
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.35);
      }
      .sync-dialog header {
        position: sticky;
        top: 0;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        align-items: center;
        padding: 14px;
        background: #fff;
        border-bottom: 1px solid #ddd3cc;
      }
      .sync-dialog h2 {
        margin: 0;
        font-size: 18px;
      }
      .sync-content {
        padding: 14px;
      }
      .sync-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 13px;
      }
      .sync-table th,
      .sync-table td {
        border-bottom: 1px solid #eee5de;
        padding: 8px 6px;
        text-align: left;
        vertical-align: top;
      }
      .sync-table th {
        color: #756b65;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: .04em;
      }
      .sync-muted {
        color: #756b65;
      }
      @media (max-width: 700px) {
        #syncPanel {
          left: 8px;
          right: 8px;
          bottom: 8px;
        }
        #syncPanel button {
          flex: 1 1 auto;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function switchUser() {
    const next = cleanName(window.prompt("Name fuer diese Bewertung", userName));
    if (!next || next === userName) return;
    localStorage.setItem(USER_KEY, next);
    sessionStorage.removeItem(hydrationKey());
    location.reload();
  }

  async function showResults() {
    try {
      renderResultsModal("Lade Ergebnisse...", "");
      const data = await fetchParticipants();
      renderResults(data.participants || []);
    } catch (error) {
      console.warn(error);
      renderResultsModal("Ergebnisse", "Konnte die gemeinsamen Ergebnisse nicht laden. Ist die D1-Datenbank schon verbunden?");
    }
  }

  function renderResults(participants) {
    if (!participants.length) {
      renderResultsModal("Ergebnisse", "Noch keine gespeicherten Bewertungen fuer dieses Projekt.");
      return;
    }

    const rowsByOutfit = new Map();
    participants.forEach(participant => {
      Object.entries(participant.state || {}).forEach(([outfitId, review]) => {
        if (!rowsByOutfit.has(outfitId)) {
          rowsByOutfit.set(outfitId, {
            outfitId,
            name: outfitName(outfitId),
            favorites: [],
            ratings: [],
            stars: 0,
            comments: []
          });
        }
        const row = rowsByOutfit.get(outfitId);
        if (review.favorite) row.favorites.push(participant.userName);
        if (Number(review.rating)) row.ratings.push(Number(review.rating));
        if (Number(review.tinderStars)) row.stars += Number(review.tinderStars);
        if (String(review.comment || "").trim()) row.comments.push(`${participant.userName}: ${review.comment.trim()}`);
      });
    });

    const rows = [...rowsByOutfit.values()]
      .filter(row => row.favorites.length || row.ratings.length || row.stars || row.comments.length)
      .sort((a, b) => {
        const scoreA = a.favorites.length * 10 + average(a.ratings) + a.stars;
        const scoreB = b.favorites.length * 10 + average(b.ratings) + b.stars;
        return scoreB - scoreA;
      });

    const participantNames = participants.map(item => item.userName).join(", ");
    const table = `
      <p class="sync-muted">Projekt: ${escapeHtml(project)} · Teilnehmer: ${escapeHtml(participantNames)}</p>
      <table class="sync-table">
        <thead>
          <tr>
            <th>Outfit</th>
            <th>Favoriten</th>
            <th>Rating</th>
            <th>Sterne</th>
            <th>Kommentare</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              <td>${escapeHtml(row.name)}</td>
              <td>${escapeHtml(row.favorites.join(", ") || "-")}</td>
              <td>${row.ratings.length ? average(row.ratings).toFixed(1) : "-"}</td>
              <td>${row.stars || "-"}</td>
              <td>${row.comments.length ? row.comments.map(escapeHtml).join("<br>") : "-"}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
    renderResultsModal("Gemeinsame Ergebnisse", table);
  }

  function outfitName(id) {
    const card = document.querySelector(`.card[data-id="${CSS.escape(id)}"] .name`);
    return card ? card.textContent.trim() : id;
  }

  function average(values) {
    if (!values.length) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  function renderResultsModal(title, body) {
    let modal = document.getElementById("syncResultsModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "syncResultsModal";
      modal.className = "sync-modal";
      document.body.appendChild(modal);
      modal.addEventListener("click", event => {
        if (event.target === modal) modal.remove();
      });
    }
    modal.innerHTML = `
      <div class="sync-dialog" role="dialog" aria-modal="true">
        <header>
          <h2>${escapeHtml(title)}</h2>
          <button type="button" id="syncCloseResults">Schliessen</button>
        </header>
        <div class="sync-content">${body}</div>
      </div>
    `;
    document.getElementById("syncCloseResults").addEventListener("click", () => modal.remove());
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }
})();
