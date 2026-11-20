/* ============================================================================
 * UAE CAPITALISM LAB  -  NEON CANVAS CHARTS (no library)
 *   UI.chart(canvas, [{label, data:[numbers], color}], {fmt, labels})
 *   UI.spark(canvas, data, color)
 * ==========================================================================*/
var UI = window.UI || (window.UI = {});

UI.COLORS = ['#00f0ff', '#ff2bd6', '#b8ff2c', '#ffd24d', '#8f7bff', '#ff8a3d'];

UI.chart = function (cv, series, opt) {
  opt = opt || {};
  var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 600, h = cv.clientHeight || 190;
  cv.width = w * dpr; cv.height = h * dpr;
  var g = cv.getContext('2d'); g.scale(dpr, dpr); g.clearRect(0, 0, w, h);
  var all = []; series.forEach(function (s) { s.data.forEach(function (v) { if (isFinite(v)) all.push(v); }); });
  if (!all.length) { g.fillStyle = '#3d4f5f'; g.font = '12px Inter'; g.fillText('No data yet - let time run.', 12, h / 2); return; }
  var min = Math.min.apply(null, all), max = Math.max.apply(null, all);
  if (opt.zero) min = Math.min(0, min);
  if (min === max) { max += Math.abs(max) * 0.05 + 1; min -= Math.abs(min) * 0.05 + 1; }
  var padL = 64, padR = 10, padT = 18, padB = 20, W = w - padL - padR, H = h - padT - padB;
  var fmt = opt.fmt || function (v) { return UAE.fmt.num(v, 1); };
  // grid
  g.strokeStyle = 'rgba(0,240,255,0.10)'; g.lineWidth = 1; g.fillStyle = '#7d93a6'; g.font = '10px JetBrains Mono';
  for (var i = 0; i <= 4; i++) {
    var y = padT + H * i / 4, v = max - (max - min) * i / 4;
    g.beginPath(); g.moveTo(padL, y); g.lineTo(w - padR, y); g.stroke();
    g.fillText(fmt(v), 4, y + 3);
  }
  if (min < 0 && max > 0) {
    var y0 = padT + H * (max / (max - min));
    g.strokeStyle = 'rgba(255,43,214,0.45)'; g.beginPath(); g.moveTo(padL, y0); g.lineTo(w - padR, y0); g.stroke();
  }
  series.forEach(function (s, si) {
    var n = s.data.length; if (!n) return;
    var col = s.color || UI.COLORS[si % UI.COLORS.length];
    var X = function (k) { return padL + (n === 1 ? W / 2 : W * k / (n - 1)); };
    var Y = function (v) { return padT + H * (max - v) / (max - min); };
    if (opt.bars) {
      var bw = Math.max(2, W / n / series.length - 2);
      s.data.forEach(function (v, k) {
        var x = padL + W * k / n + si * bw, yv = Y(v), yz = Y(Math.max(min, 0));
        g.fillStyle = v >= 0 ? col : '#ff4d6d'; g.shadowColor = g.fillStyle; g.shadowBlur = 6;
        g.fillRect(x, Math.min(yv, yz), bw, Math.abs(yz - yv));
      });
      g.shadowBlur = 0;
    } else {
      // area fill
      var grad = g.createLinearGradient(0, padT, 0, padT + H);
      grad.addColorStop(0, col + '55'); grad.addColorStop(1, col + '00');
      g.beginPath(); g.moveTo(X(0), Y(s.data[0]));
      s.data.forEach(function (v, k) { g.lineTo(X(k), Y(v)); });
      g.lineTo(X(n - 1), padT + H); g.lineTo(X(0), padT + H); g.closePath(); g.fillStyle = grad; g.fill();
      // glowing line
      g.beginPath(); g.moveTo(X(0), Y(s.data[0]));
      s.data.forEach(function (v, k) { g.lineTo(X(k), Y(v)); });
      g.strokeStyle = col; g.lineWidth = 1.8; g.shadowColor = col; g.shadowBlur = 10; g.stroke(); g.shadowBlur = 0;
    }
    // legend
    g.fillStyle = col; g.font = '10.5px Inter';
    g.fillText('■ ' + (s.label || ''), padL + 6 + si * 150, 11);
  });
  if (opt.labels && opt.labels.length) {
    g.fillStyle = '#7d93a6'; g.font = '9.5px JetBrains Mono';
    var L = opt.labels, step = Math.max(1, Math.ceil(L.length / 6));
    for (var j = 0; j < L.length; j += step) g.fillText(L[j], padL + W * j / Math.max(1, L.length - 1) - 14, h - 5);
  }
};

UI.spark = function (cv, data, color) {
  var dpr = window.devicePixelRatio || 1, w = cv.clientWidth || 120, h = cv.clientHeight || 28;
  cv.width = w * dpr; cv.height = h * dpr;
  var g = cv.getContext('2d'); g.scale(dpr, dpr);
  if (!data || data.length < 2) return;
  var min = Math.min.apply(null, data), max = Math.max.apply(null, data); if (min === max) { max += 1; min -= 1; }
  var col = color || (data[data.length - 1] >= data[0] ? '#b8ff2c' : '#ff4d6d');
  g.beginPath();
  data.forEach(function (v, k) { var x = w * k / (data.length - 1), y = h - 2 - (h - 4) * (v - min) / (max - min); k ? g.lineTo(x, y) : g.moveTo(x, y); });
  g.strokeStyle = col; g.lineWidth = 1.4; g.shadowColor = col; g.shadowBlur = 6; g.stroke();
};
