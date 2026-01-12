(function () {
  console.log("[APR Compare] Running...");

  // ===== CONFIG =====
  // You may need to adjust these selectors based on actual HTML structure
  const LEFT_TITLE_TEXT = "Last APR";
  const RIGHT_TITLE_TEXT = "APR"; // "2026 APR" contains "APR"
  const STOP_AT_SECTION = "Family info";

  // helper: normalize values
  const norm = (v) =>
    (v || "")
      .replace(/\s+/g, " ")
      .replace(/\u00a0/g, " ")
      .trim()
      .toLowerCase();

  function findPanelByHeaderText(text) {
    const headers = Array.from(document.querySelectorAll("*"))
      .filter((el) => el.children.length === 0)
      .filter((el) => el.textContent && el.textContent.includes(text));

    // choose the closest "panel-like" parent
    for (const h of headers) {
      const panel = h.closest("div");
      if (panel) return panel;
    }
    return null;
  }

  // locate left/right panels
  const leftPanel = findPanelByHeaderText(LEFT_TITLE_TEXT);
  const rightPanel = findPanelByHeaderText(RIGHT_TITLE_TEXT);

  if (!leftPanel || !rightPanel) {
    console.warn("[APR Compare] Panels not found. Update selectors.");
    return;
  }

  // Extract label/value pairs from a panel until stop section
  function extractPairs(panel) {
    const pairs = new Map();

    const allTextEls = Array.from(panel.querySelectorAll("div, span, td, p, label"))
      .filter((el) => el.children.length === 0);

    let stop = false;

    for (let i = 0; i < allTextEls.length; i++) {
      const el = allTextEls[i];
      const text = el.textContent?.trim();

      if (!text) continue;

      if (text.includes(STOP_AT_SECTION)) {
        stop = true;
      }
      if (stop) break;

      // heuristic: label fields often have * or end with ":" or are left aligned
      if (/^\*?[A-Za-z].{0,40}$/.test(text) && !/\d/.test(text)) {
        // try next element as value
        const next = allTextEls[i + 1];
        if (!next) continue;

        const label = norm(text.replace("*", ""));
        const value = next.textContent?.trim() || "";

        // ignore if value too long or same as label
        if (label && value && norm(value) !== label) {
          pairs.set(label, { value, valueEl: next });
        }
      }
    }
    return pairs;
  }

  const leftPairs = extractPairs(leftPanel);
  const rightPairs = extractPairs(rightPanel);

  console.log("[APR Compare] Left pairs:", leftPairs);
  console.log("[APR Compare] Right pairs:", rightPairs);

  // Compare and highlight right side
  for (const [label, right] of rightPairs.entries()) {
    const left = leftPairs.get(label);

    if (!left) {
      // no left match => skip (or could highlight as new)
      continue;
    }

    const lv = norm(left.value);
    const rv = norm(right.value);

    if (!right.valueEl) continue;

    // Remove previous classes
    right.valueEl.classList.remove("apr-same", "apr-changed");

    if (lv === rv) {
      right.valueEl.classList.add("apr-same");
    } else {
      right.valueEl.classList.add("apr-changed");
    }
  }

  console.log("[APR Compare] Done highlighting.");
})();
