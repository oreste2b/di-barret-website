// ============================================================
// /clients/dubbu/clarity.js
// Microsoft Clarity tracking — heatmaps + scroll + session recordings.
// Only loaded on the Dubbu proposal page.
// Project ID: wyucwqg3f0 (Di Barret · Dubbu proposal)
// ============================================================
//
// Privacy:
//   - Chat input (#chat-field) is masked via data-clarity-mask
//   - Chat messages (#chat-messages) are masked via data-clarity-mask
//   - We never capture what visitors type or the agent's responses
//   - For chat conversations data, use /clients/dubbu/admin instead

(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
  t = l.createElement(r);
  t.async = 1;
  t.src = "https://www.clarity.ms/tag/" + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, "clarity", "script", "wyucwqg3f0");
