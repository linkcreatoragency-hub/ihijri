/* ihijri.online — shared UI logic */
(function () {
  "use strict";
  var H = window.Hijri;
  var AR = { d: function (n) { return String(n); } };

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function $(id) { return document.getElementById(id); }
  window.$i = $;

  /* ---------- fill selects ---------- */
  function fillSelect(el, from, to, val, labels) {
    if (!el) return;
    var h = "";
    for (var i = from; i <= to; i++) {
      var lab = labels ? labels[i - from] : i;
      h += '<option value="' + i + '"' + (i === val ? " selected" : "") + ">" + lab + "</option>";
    }
    el.innerHTML = h;
  }
  window.fillSelect = fillSelect;

  function formatHijri(h) {
    return h.day + " " + H.HIJRI_MONTHS[h.month - 1] + " " + h.year + " هـ";
  }
  function formatGreg(g) {
    return g.day + " " + H.GREG_MONTHS[g.month - 1] + " " + g.year + " م";
  }
  window.formatHijri = formatHijri;
  window.formatGreg = formatGreg;

  /* ---------- today banner (on every page that has it) ---------- */
  function paintToday() {
    var t = H.todayKSA();
    var h = H.gregorianToHijri(t.year, t.month, t.day);
    var jdn = H.gregToJdn(t.year, t.month, t.day);
    var wd = H.WEEKDAYS[H.weekdayOfJdn(jdn)];
    var hEl = document.querySelectorAll("[data-today-hijri]");
    var gEl = document.querySelectorAll("[data-today-greg]");
    var i;
    for (i = 0; i < hEl.length; i++) hEl[i].textContent = wd + "، " + formatHijri(h);
    for (i = 0; i < gEl.length; i++) gEl[i].textContent = "الموافق " + formatGreg({ year: t.year, month: t.month, day: t.day });
    return { g: t, h: h, wd: wd, jdn: jdn };
  }
  window.paintToday = paintToday;
  document.addEventListener("DOMContentLoaded", function () {
    if (document.querySelector("[data-today-hijri]")) paintToday();
  });

  /* ---------- converter (homepage) ---------- */
  window.initConverter = function () {
    var t = H.todayKSA();
    var htoday = H.gregorianToHijri(t.year, t.month, t.day);
    var mode = "h2g";

    fillSelect($("hDay"), 1, 30, htoday.day);
    fillSelect($("hMonth"), 1, 12, htoday.month, H.HIJRI_MONTHS);
    fillSelect($("hYear"), H.MIN_YEAR, H.MAX_YEAR, htoday.year);
    fillSelect($("gDay"), 1, 31, t.day);
    fillSelect($("gMonth"), 1, 12, t.month, H.GREG_MONTHS);
    fillSelect($("gYear"), 1883, 2172, t.year);

    function setMode(m) {
      mode = m;
      $("tabH2G").classList.toggle("active", m === "h2g");
      $("tabG2H").classList.toggle("active", m === "g2h");
      $("boxH").style.display = m === "h2g" ? "" : "none";
      $("boxG").style.display = m === "g2h" ? "" : "none";
      $("result").classList.remove("show");
      $("err").classList.remove("show");
    }
    $("tabH2G").addEventListener("click", function () { setMode("h2g"); });
    $("tabG2H").addEventListener("click", function () { setMode("g2h"); });

    function showErr(msg) {
      $("err").textContent = msg;
      $("err").classList.add("show");
      $("result").classList.remove("show");
    }

    function convert() {
      $("err").classList.remove("show");
      var big, sub, jdn, chips = [];
      if (mode === "h2g") {
        var hy = +$("hYear").value, hm = +$("hMonth").value, hd = +$("hDay").value;
        if (!H.isValidHijri(hy, hm, hd)) {
          return showErr("تاريخ هجري غير صحيح: شهر " + H.HIJRI_MONTHS[hm - 1] + " " + hy + " هـ يتكون من " + H.monthLength(hy, hm) + " يومًا فقط.");
        }
        var g = H.hijriToGregorian(hy, hm, hd);
        jdn = H.hijriToJdn(hy, hm, hd);
        big = formatGreg(g);
        sub = "يوافق " + formatHijri({ year: hy, month: hm, day: hd });
        chips.push("عدد أيام الشهر: " + H.monthLength(hy, hm) + " يومًا");
      } else {
        var gy = +$("gYear").value, gm = +$("gMonth").value, gd = +$("gDay").value;
        if (!H.isValidGregorian(gy, gm, gd)) return showErr("تاريخ ميلادي غير صحيح، يرجى التحقق من اليوم والشهر.");
        var h = H.gregorianToHijri(gy, gm, gd);
        if (!h) return showErr("التاريخ خارج نطاق تقويم أم القرى المعتمد (1300 – 1600 هـ).");
        jdn = H.gregToJdn(gy, gm, gd);
        big = formatHijri(h);
        sub = "يوافق " + formatGreg({ year: gy, month: gm, day: gd });
        chips.push("عدد أيام الشهر: " + H.monthLength(h.year, h.month) + " يومًا");
      }
      var wd = H.WEEKDAYS[H.weekdayOfJdn(jdn)];
      chips.unshift("اليوم: " + wd);
      $("resBig").textContent = big;
      $("resSub").textContent = sub;
      $("resMeta").innerHTML = chips.map(function (c) { return '<span class="chip">' + c + "</span>"; }).join("");
      $("result").classList.add("show");
    }
    $("btnConvert").addEventListener("click", convert);
    var sels = document.querySelectorAll("#boxH select, #boxG select");
    for (var i = 0; i < sels.length; i++) sels[i].addEventListener("change", convert);
    $("btnToday").addEventListener("click", function () {
      var n = H.todayKSA(), nh = H.gregorianToHijri(n.year, n.month, n.day);
      $("hDay").value = nh.day; $("hMonth").value = nh.month; $("hYear").value = nh.year;
      $("gDay").value = n.day; $("gMonth").value = n.month; $("gYear").value = n.year;
      convert();
    });
    convert();
  };

  /* ---------- monthly calendar ---------- */
  window.initMonthCal = function () {
    var t = H.todayKSA(), th = H.gregorianToHijri(t.year, t.month, t.day);
    var cy = th.year, cm = th.month;
    var todayJdn = H.gregToJdn(t.year, t.month, t.day);

    fillSelect($("cMonth"), 1, 12, cm, H.HIJRI_MONTHS);
    fillSelect($("cYear"), H.MIN_YEAR, H.MAX_YEAR, cy);

    function render() {
      cy = +$("cYear").value; cm = +$("cMonth").value;
      var len = H.monthLength(cy, cm);
      var first = H.hijriToJdn(cy, cm, 1);
      var startCol = H.weekdayOfJdn(first); // 0=Sunday
      var html = "<thead><tr>";
      for (var w = 0; w < 7; w++) html += "<th>" + H.WEEKDAYS[w] + "</th>";
      html += "</tr></thead><tbody><tr>";
      for (var i = 0; i < startCol; i++) html += '<td class="empty"></td>';
      var col = startCol;
      for (var d = 1; d <= len; d++) {
        var jdn = first + d - 1, g = H.jdnToGreg(jdn);
        var cls = [];
        if (jdn === todayJdn) cls.push("today");
        if (col === 5) cls.push("fri");
        html += '<td class="' + cls.join(" ") + '"><div class="hd">' + d + '</div><div class="gd">' + g.day + " " + H.GREG_MONTHS[g.month - 1] + "</div></td>";
        col++;
        if (col === 7 && d < len) { html += "</tr><tr>"; col = 0; }
      }
      while (col > 0 && col < 7) { html += '<td class="empty"></td>'; col++; }
      html += "</tr></tbody>";
      $("calTable").innerHTML = html;
      var gs = H.jdnToGreg(first), ge = H.jdnToGreg(first + len - 1);
      $("calTitle").textContent = H.HIJRI_MONTHS[cm - 1] + " " + cy + " هـ";
      $("calRange").textContent = "من " + formatGreg(gs) + " إلى " + formatGreg(ge) + " — عدد الأيام: " + len;
    }
    function shift(n) {
      var m = cm + n, y = cy;
      if (m > 12) { m = 1; y++; } if (m < 1) { m = 12; y--; }
      if (y < H.MIN_YEAR || y > H.MAX_YEAR) return;
      $("cYear").value = y; $("cMonth").value = m; render();
    }
    $("cMonth").addEventListener("change", render);
    $("cYear").addEventListener("change", render);
    $("prevM").addEventListener("click", function () { shift(-1); });
    $("nextM").addEventListener("click", function () { shift(1); });
    $("curM").addEventListener("click", function () {
      var n = H.todayKSA(), nh = H.gregorianToHijri(n.year, n.month, n.day);
      $("cYear").value = nh.year; $("cMonth").value = nh.month; render();
    });
    render();
  };

  /* ---------- yearly calendar ---------- */
  window.initYearCal = function () {
    var t = H.todayKSA(), th = H.gregorianToHijri(t.year, t.month, t.day);
    fillSelect($("yYear"), H.MIN_YEAR, H.MAX_YEAR, th.year);
    function render() {
      var y = +$("yYear").value;
      var rows = "", total = 0;
      for (var m = 1; m <= 12; m++) {
        var len = H.monthLength(y, m), j1 = H.hijriToJdn(y, m, 1);
        var gs = H.jdnToGreg(j1), ge = H.jdnToGreg(j1 + len - 1);
        total += len;
        rows += "<tr><td>" + m + "</td><td><strong>" + H.HIJRI_MONTHS[m - 1] + "</strong></td>" +
          '<td class="num">' + len + "</td>" +
          "<td>" + H.WEEKDAYS[H.weekdayOfJdn(j1)] + "</td>" +
          "<td>" + formatGreg(gs) + "</td><td>" + formatGreg(ge) + "</td></tr>";
      }
      $("yBody").innerHTML = rows;
      var s = H.jdnToGreg(H.hijriToJdn(y, 1, 1)), e = H.jdnToGreg(H.hijriToJdn(y, 12, H.monthLength(y, 12)));
      $("yTitle").textContent = "التقويم الهجري لعام " + y + " هـ";
      $("yInfo").textContent = "يبدأ عام " + y + " هـ في " + formatGreg(s) + " وينتهي في " + formatGreg(e) + "، وعدد أيامه " + total + " يومًا.";
    }
    $("yYear").addEventListener("change", render);
    $("prevY").addEventListener("click", function () { var v = +$("yYear").value - 1; if (v >= H.MIN_YEAR) { $("yYear").value = v; render(); } });
    $("nextY").addEventListener("click", function () { var v = +$("yYear").value + 1; if (v <= H.MAX_YEAR) { $("yYear").value = v; render(); } });
    render();
  };

  /* ---------- age calculator ---------- */
  window.initAge = function () {
    var t = H.todayKSA(), th = H.gregorianToHijri(t.year, t.month, t.day);
    var mode = "g";
    fillSelect($("bgDay"), 1, 31, 1);
    fillSelect($("bgMonth"), 1, 12, 1, H.GREG_MONTHS);
    fillSelect($("bgYear"), 1900, t.year, 2000);
    fillSelect($("bhDay"), 1, 30, 1);
    fillSelect($("bhMonth"), 1, 12, 1, H.HIJRI_MONTHS);
    fillSelect($("bhYear"), 1320, th.year, 1420);

    function setMode(m) {
      mode = m;
      $("tabAgeG").classList.toggle("active", m === "g");
      $("tabAgeH").classList.toggle("active", m === "h");
      $("ageBoxG").style.display = m === "g" ? "" : "none";
      $("ageBoxH").style.display = m === "h" ? "" : "none";
      $("ageResult").classList.remove("show");
      $("ageErr").classList.remove("show");
    }
    $("tabAgeG").addEventListener("click", function () { setMode("g"); });
    $("tabAgeH").addEventListener("click", function () { setMode("h"); });

    function diff(y1, m1, d1, y2, m2, d2, lenOf) {
      var y = y2 - y1, m = m2 - m1, d = d2 - d1;
      if (d < 0) { m--; var pm = m2 - 1, py = y2; if (pm < 1) { pm = 12; py--; } d += lenOf(py, pm); }
      if (m < 0) { m += 12; y--; }
      return { y: y, m: m, d: d };
    }
    function gLen(y, m) { return new Date(Date.UTC(y, m, 0)).getUTCDate(); }

    function calc() {
      $("ageErr").classList.remove("show");
      var bjdn, gb, hb;
      if (mode === "g") {
        var gy = +$("bgYear").value, gm = +$("bgMonth").value, gd = +$("bgDay").value;
        if (!H.isValidGregorian(gy, gm, gd)) { $("ageErr").textContent = "تاريخ ميلاد غير صحيح."; $("ageErr").classList.add("show"); $("ageResult").classList.remove("show"); return; }
        bjdn = H.gregToJdn(gy, gm, gd);
      } else {
        var hy = +$("bhYear").value, hm = +$("bhMonth").value, hd = +$("bhDay").value;
        if (!H.isValidHijri(hy, hm, hd)) { $("ageErr").textContent = "تاريخ هجري غير صحيح، شهر " + H.HIJRI_MONTHS[hm - 1] + " " + hy + " هـ فيه " + H.monthLength(hy, hm) + " يومًا."; $("ageErr").classList.add("show"); $("ageResult").classList.remove("show"); return; }
        bjdn = H.hijriToJdn(hy, hm, hd);
      }
      var now = H.todayKSA();
      var njdn = H.gregToJdn(now.year, now.month, now.day);
      if (bjdn > njdn) { $("ageErr").textContent = "تاريخ الميلاد في المستقبل! يرجى اختيار تاريخ صحيح."; $("ageErr").classList.add("show"); $("ageResult").classList.remove("show"); return; }
      gb = H.jdnToGreg(bjdn); hb = H.jdnToHijri(bjdn);
      var nh = H.gregorianToHijri(now.year, now.month, now.day);
      var ag = diff(gb.year, gb.month, gb.day, now.year, now.month, now.day, gLen);
      var ah = diff(hb.year, hb.month, hb.day, nh.year, nh.month, nh.day, H.monthLength);
      var days = njdn - bjdn;

      $("ageBig").textContent = ag.y + " سنة و " + ag.m + " شهرًا و " + ag.d + " يومًا";
      $("ageSub").textContent = "عمرك بالتقويم الهجري: " + ah.y + " سنة و " + ah.m + " شهرًا و " + ah.d + " يومًا";
      var wd = H.WEEKDAYS[H.weekdayOfJdn(bjdn)];
      // next birthday (gregorian)
      var nby = now.year, nbj = H.gregToJdn(nby, gb.month, Math.min(gb.day, gLen(nby, gb.month)));
      if (nbj < njdn) { nby++; nbj = H.gregToJdn(nby, gb.month, Math.min(gb.day, gLen(nby, gb.month))); }
      var toBday = nbj - njdn;
      var chips = [
        "يوم ميلادك: " + wd,
        "ميلادك بالهجري: " + formatHijri(hb),
        "ميلادك بالميلادي: " + formatGreg(gb),
        "عدد الأيام التي عشتها: " + days.toLocaleString("ar-EG") + " يومًا",
        "عدد الأسابيع: " + Math.floor(days / 7).toLocaleString("ar-EG"),
        "عدد الساعات: " + (days * 24).toLocaleString("ar-EG"),
        toBday === 0 ? "🎉 عيد ميلادك اليوم!" : "يتبقى على عيد ميلادك: " + toBday + " يومًا"
      ];
      $("ageMeta").innerHTML = chips.map(function (c) { return '<span class="chip">' + c + "</span>"; }).join("");
      $("ageResult").classList.add("show");
    }
    $("btnAge").addEventListener("click", calc);
  };
})();
