(() => {
  const VERSION = "v1.6 Mobile Sync";
  const REVIEW_KEY = "outfit-selection-v1";
  const USER_KEY = "outfit-selection-user-v1";
  const PROJECT_KEY = "outfit-selection-project-v1";
  const COMPACT_KEY = "outfit-detail-compact-image-v1";

  document.addEventListener("DOMContentLoaded", initEnhancements);
  if (document.readyState !== "loading") initEnhancements();

  function initEnhancements() {
    if (document.documentElement.dataset.enhancedV16) return;
    document.documentElement.dataset.enhancedV16 = "true";

    updateVersionBadge();
    restoreCompactMode();
    addUtilityActions();
    addDetailGestures();
  }

  function updateVersionBadge() {
    const badge = document.querySelector(".version-badge");
    if (badge) badge.textContent = VERSION;
  }

  function restoreCompactMode() {
    if (localStorage.getItem(COMPACT_KEY) === "1") {
      document.body.classList.add("compact-detail-image");
    }
  }

  function addUtilityActions() {
    const actions = document.querySelector(".actions");
    if (!actions || document.getElementById("copyShareLink")) return;

    const compactButton = document.createElement("button");
    compactButton.id = "toggleCompactImage";
    compactButton.type = "button";
    compactButton.textContent = document.body.classList.contains("compact-detail-image") ? "Bild groesser" : "Bild kleiner";
    compactButton.addEventListener("click", () => {
      const active = document.body.classList.toggle("compact-detail-image");
      localStorage.setItem(COMPACT_KEY, active ? "1" : "0");
      compactButton.textContent = active ? "Bild groesser" : "Bild kleiner";
    });

    const shareButton = document.createElement("button");
    shareButton.id = "copyShareLink";
    shareButton.type = "button";
    shareButton.textContent = "Link kopieren";
    shareButton.addEventListener("click", copyShareLink);

    const localTopButton = document.createElement("button");
    localTopButton.id = "localTopResults";
    localTopButton.type = "button";
    localTopButton.textContent = "Meine Topliste";
    localTopButton.addEventListener("click", showLocalToplist);

    actions.insertBefore(compactButton, actions.children[1] || null);
    actions.insertBefore(shareButton, actions.children[2] || null);
    actions.insertBefore(localTopButton, actions.children[3] || null);
  }

  async function copyShareLink() {
    const url = new URL(location.href);
    const project = localStorage.getItem(PROJECT_KEY) || url.searchParams.get("project") || "vader";
    const user = localStorage.getItem(USER_KEY) || url.searchParams.get("user") || "";
    url.searchParams.set("project", project);
    if (user) url.searchParams.set("user", user);

    try {
      await navigator.clipboard.writeText(url.toString());
      toast("Link kopiert");
    } catch {
      window.prompt("Link kopieren", url.toString());
    }
  }

  function showLocalToplist() {
    const reviews = readReviews();
    const rows = Object.entries(reviews)
      .map(([id, review]) => ({
        id,
        name: outfitName(id),
        favorite: Boolean(review.favorite),
        rating: Number(review.rating || 0),
        stars: Number(review.tinderStars || 0),
        comment: String(review.comment || "").trim()
      }))
      .filter(row => row.favorite || row.rating || row.stars || row.comment)
      .sort((a, b) => score(b) - score(a));

    const body = rows.length
      ? `<ol class="enh-list">${rows.map(row => `
          <li>
            <strong>${escapeHtml(row.name)}</strong>
            <span>${row.favorite ? "Favorit · " : ""}${row.rating ? row.rating + "/5 · " : ""}${row.stars ? row.stars + " Sterne" : ""}</span>
            ${row.comment ? `<em>${escapeHtml(row.comment)}</em>` : ""}
          </li>
        `).join("")}</ol>`
      : "<p>Noch keine lokale Auswahl vorhanden.</p>";

    renderModal("Meine Topliste", body);
  }

  function score(row) {
    return (row.favorite ? 100 : 0) + row.rating * 10 + row.stars;
  }

  function readReviews() {
    try {
      return JSON.parse(localStorage.getItem(REVIEW_KEY)) || {};
    } catch {
      return {};
    }
  }

  function outfitName(id) {
    const card = document.querySelector(`.card[data-id="${cssEscape(id)}"] .name`);
    return card ? card.textContent.trim() : id;
  }

  function addDetailGestures() {
    const detail = document.getElementById("detail");
    if (!detail) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    detail.addEventListener("touchstart", event => {
      if (!document.body.classList.contains("detail-open")) return;
      if (event.touches.length !== 1) return;
      const target = event.target;
      if (target.closest("textarea, input, button")) return;
      tracking = true;
      startX = event.touches[0].clientX;
      startY = event.touches[0].clientY;
    }, { passive: true });

    detail.addEventListener("touchend", event => {
      if (!tracking || !document.body.classList.contains("detail-open")) return;
      tracking = false;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < 90 || Math.abs(dx) < Math.abs(dy) * 1.4) return;

      const button = document.getElementById(dx < 0 ? "nextDetail" : "prevDetail");
      if (button) button.click();
    }, { passive: true });
  }

  function renderModal(title, body) {
    let modal = document.getElementById("enhModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "enhModal";
      modal.className = "enh-modal";
      document.body.appendChild(modal);
      injectEnhancementStyles();
      modal.addEventListener("click", event => {
        if (event.target === modal) modal.remove();
      });
    }

    modal.innerHTML = `
      <div class="enh-dialog" role="dialog" aria-modal="true">
        <header>
          <h2>${escapeHtml(title)}</h2>
          <button type="button" id="enhClose">Schliessen</button>
        </header>
        <div class="enh-content">${body}</div>
      </div>
    `;
    document.getElementById("enhClose").addEventListener("click", () => modal.remove());
  }

  function injectEnhancementStyles() {
    if (document.getElementById("enhStyles")) return;
    const style = document.createElement("style");
    style.id = "enhStyles";
    style.textContent = `
      .enh-modal {
        position: fixed;
        inset: 0;
        z-index: 125;
        display: grid;
        place-items: center;
        padding: 16px;
        background: rgba(29, 23, 21, 0.72);
      }
      .enh-dialog {
        width: min(680px, 100%);
        max-height: min(760px, 88dvh);
        overflow: auto;
        border-radius: 8px;
        background: #fff;
        color: #1d1715;
        box-shadow: 0 22px 70px rgba(0, 0, 0, 0.35);
      }
      .enh-dialog header {
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
      .enh-dialog h2 {
        margin: 0;
        font-size: 18px;
      }
      .enh-content {
        padding: 14px;
      }
      .enh-list {
        margin: 0;
        padding-left: 22px;
      }
      .enh-list li {
        margin-bottom: 12px;
      }
      .enh-list span,
      .enh-list em {
        display: block;
        margin-top: 3px;
        color: #756b65;
      }
      .enh-toast {
        position: fixed;
        left: 50%;
        bottom: max(18px, env(safe-area-inset-bottom));
        z-index: 130;
        transform: translateX(-50%);
        border-radius: 999px;
        padding: 10px 14px;
        background: #1d1715;
        color: #fff;
        font: 700 13px/1.1 Inter, ui-sans-serif, system-ui, sans-serif;
        box-shadow: 0 10px 28px rgba(0, 0, 0, .25);
      }
    `;
    document.head.appendChild(style);
  }

  function toast(message) {
    injectEnhancementStyles();
    const node = document.createElement("div");
    node.className = "enh-toast";
    node.textContent = message;
    document.body.appendChild(node);
    window.setTimeout(() => node.remove(), 1600);
  }

  function escapeHtml(value) {
    return String(value || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function cssEscape(value) {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }
})();
