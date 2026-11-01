(function () {
  // Glides an agent cursor to {x, y} (viewport CSS pixels) and optionally shows a click ripple.
  // Set window.__safariAgentCursor = { x, y, click } first. Requires control_indicator.js to be shown.
  var indicator = window.__safariAgentControlIndicator;
  if (!indicator || indicator.isConnected === false) return "indicator not shown";

  var options = window.__safariAgentCursor || {};
  var x = Number(options.x);
  var y = Number(options.y);
  if (!isFinite(x) || !isFinite(y)) return "invalid coordinates";

  var accent = "#D97757";
  var key = "__safariAgentCursorElement";
  var cursor = window[key];
  var fresh = !cursor || cursor.isConnected === false;
  if (fresh) {
    cursor = document.createElement("div");
    cursor.id = "__safari_agent_cursor";
    var arrow = document.createElement("div");
    arrow.setAttribute(
      "style",
      "width:22px;height:26px;background:" + accent + ";" +
        "-webkit-clip-path:polygon(0 0,0 100%,30% 75%,52% 100%,68% 91%,46% 66%,82% 66%);" +
        "clip-path:polygon(0 0,0 100%,30% 75%,52% 100%,68% 91%,46% 66%,82% 66%);"
    );
    var tag = document.createElement("div");
    tag.textContent = "AI agent";
    tag.setAttribute(
      "style",
      "position:absolute;left:18px;top:24px;padding:1px 6px;border-radius:5px;" +
        "background:" + accent + ";color:#fff;font:600 10px/1.5 -apple-system,sans-serif;white-space:nowrap;"
    );
    cursor.appendChild(arrow);
    cursor.appendChild(tag);
    indicator.appendChild(cursor);
    window[key] = cursor;
  }
  cursor.setAttribute(
    "style",
    "position:fixed;left:0;top:0;pointer-events:none;z-index:2147483647;" +
      "filter:drop-shadow(0 2px 3px rgba(0,0,0,.35));" +
      (fresh ? "" : "transition:transform .55s cubic-bezier(.22,.8,.28,1);") +
      "transform:translate(" + Math.round(x) + "px," + Math.round(y) + "px);"
  );

  if (!options.click) return "moved";
  var ripple = document.createElement("div");
  ripple.setAttribute(
    "style",
    "position:fixed;left:" + Math.round(x) + "px;top:" + Math.round(y) + "px;width:34px;height:34px;" +
      "margin:-17px 0 0 -17px;border-radius:50%;border:2px solid " + accent + ";" +
      "background:rgba(217,119,87,.25);pointer-events:none;z-index:2147483647;"
  );
  indicator.appendChild(ripple);
  try {
    if (typeof ripple.animate === "function") {
      ripple.animate(
        [{ opacity: 0.9, transform: "scale(.3)" }, { opacity: 0, transform: "scale(1.5)" }],
        { duration: 520, easing: "ease-out" }
      );
    }
  } catch (_) {}
  if (typeof setTimeout === "function") {
    setTimeout(function () { if (typeof ripple.remove === "function") ripple.remove(); }, 600);
  }
  return "clicked";
})();
