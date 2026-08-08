/* ihijri.online — مواقيت الصلاة (Aladhan API, Umm al-Qura method) */
(function () {
  "use strict";
  var H = window.Hijri;
  var API = "https://api.aladhan.com/v1/";
  var METHOD = 4; // Umm Al-Qura University, Makkah
  var NAMES = { Fajr: "الفجر", Sunrise: "الشروق", Dhuhr: "الظهر", Asr: "العصر", Maghrib: "المغرب", Isha: "العشاء" };
  var ORDER = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
  var CITIES = window.KSA_CITIES || [];

  function clean(t) { return (t || "").split(" ")[0]; }
  function to12(t) {
    var p = clean(t).split(":"), h = +p[0], m = p[1];
    var per = h < 12 ? "ص" : "م", hh = h % 12; if (hh === 0) hh = 12;
    return hh + ":" + m + " " + per;
  }
  function minutes(t) { var p = clean(t).split(":"); return +p[0] * 60 + +p[1]; }

  function fetchAny(urls) {
    var i = 0;
    function step() {
      if (i >= urls.length) return Promise.reject(new Error("all_failed"));
      return fetch(urls[i++]).then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        return r.json();
      }).then(function (j) {
        if (!j || !j.data) throw new Error("bad_payload");
        return j;
      }).catch(step);
    }
    return step();
  }

  function citySelect(el, sel) {
    var h = "";
    for (var i = 0; i < CITIES.length; i++)
      h += '<option value="' + i + '"' + (i === sel ? " selected" : "") + ">" + CITIES[i].ar + "</option>";
    el.innerHTML = h;
  }

  function saveCity(i) { try { window.__city = i; } catch (e) {} }
  function loadCity() { return typeof window.__city === "number" ? window.__city : 0; }

  /* ---------- daily ---------- */
  window.initPrayerDaily = function () {
    var sel = window.$i("pCity"), out = window.$i("pOut"), stat = window.$i("pStatus"), meta = window.$i("pMeta");
    citySelect(sel, loadCity());

    function load() {
      var c = CITIES[+sel.value]; saveCity(+sel.value);
      stat.textContent = "جارٍ تحميل مواقيت الصلاة في " + c.ar + "…";
      stat.style.display = "";
      out.innerHTML = "";
      var t = H.todayKSA();
      var qs = "latitude=" + c.lat + "&longitude=" + c.lng + "&method=" + METHOD + "&school=0";
      var urls = [
        API + "timings/" + t.day + "-" + t.month + "-" + t.year + "?" + qs,
        API + "timings?" + qs
      ];
      fetchAny(urls).then(function (j) {
        if (!j || !j.data || !j.data.timings) throw new Error("bad");
        var tm = j.data.timings;
        // determine next prayer using KSA local clock
        var now = new Date();
        var ksa = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
        var nowMin = ksa.getHours() * 60 + ksa.getMinutes();
        var nextKey = null;
        for (var i = 0; i < ORDER.length; i++) {
          if (ORDER[i] === "Sunrise") continue;
          if (minutes(tm[ORDER[i]]) > nowMin) { nextKey = ORDER[i]; break; }
        }
        var html = "";
        for (var k = 0; k < ORDER.length; k++) {
          var key = ORDER[k];
          html += '<div class="prayer-card' + (key === nextKey ? " next" : "") + '">' +
            '<div class="pname">' + NAMES[key] + "</div>" +
            '<div class="ptime">' + to12(tm[key]) + "</div></div>";
        }
        out.innerHTML = html;
        stat.style.display = "none";
        var hd = H.gregorianToHijri(t.year, t.month, t.day);
        meta.innerHTML = "مواقيت الصلاة اليوم " + H.WEEKDAYS[H.weekdayOfJdn(H.gregToJdn(t.year, t.month, t.day))] +
          " " + window.formatHijri(hd) + " في <strong>" + c.ar + "</strong>" +
          (nextKey ? " — الصلاة القادمة: <strong>" + NAMES[nextKey] + "</strong>" : " — انتهت صلوات اليوم") +
          ". طريقة الحساب: أم القرى (مكة المكرمة).";
      }).catch(function () {
        stat.textContent = "تعذّر تحميل المواقيت حالياً. يرجى المحاولة مرة أخرى بعد قليل.";
      });
    }
    sel.addEventListener("change", load);
    load();
  };

  /* ---------- monthly ---------- */
  window.initPrayerMonthly = function () {
    var sel = window.$i("mCity"), mSel = window.$i("mMonth"), ySel = window.$i("mYear");
    var body = window.$i("mBody"), stat = window.$i("mStatus"), title = window.$i("mTitle");
    var t = H.todayKSA();
    citySelect(sel, loadCity());
    window.fillSelect(mSel, 1, 12, t.month, H.GREG_MONTHS);
    window.fillSelect(ySel, t.year - 2, t.year + 2, t.year);

    function load() {
      var c = CITIES[+sel.value]; saveCity(+sel.value);
      var y = +ySel.value, m = +mSel.value;
      stat.textContent = "جارٍ تحميل المواقيت…"; stat.style.display = ""; body.innerHTML = "";
      var qs = "latitude=" + c.lat + "&longitude=" + c.lng + "&method=" + METHOD + "&school=0";
      var urls = [
        API + "calendar/" + y + "/" + m + "?" + qs,
        API + "calendar?" + qs + "&month=" + m + "&year=" + y
      ];
      fetchAny(urls).then(function (j) {
        if (!j || !j.data || !j.data.length) throw new Error("bad");
        var rows = "", todayJdn = H.gregToJdn(t.year, t.month, t.day);
        for (var i = 0; i < j.data.length; i++) {
          var d = j.data[i], tm = d.timings;
          var gd = (d.date && d.date.gregorian && +d.date.gregorian.day) || (i + 1);
          var jdn = H.gregToJdn(y, m, gd), hd = H.jdnToHijri(jdn);
          var isToday = jdn === todayJdn;
          rows += "<tr" + (isToday ? ' style="background:#eef8f3;font-weight:700"' : "") + ">" +
            '<td class="num">' + gd + " " + H.GREG_MONTHS[m - 1] + "</td>" +
            "<td>" + H.WEEKDAYS[H.weekdayOfJdn(jdn)] + "</td>" +
            '<td class="num">' + (hd ? hd.day + " " + H.HIJRI_MONTHS[hd.month - 1] : "—") + "</td>";
          for (var k = 0; k < ORDER.length; k++) rows += '<td class="num">' + to12(tm[ORDER[k]]) + "</td>";
          rows += "</tr>";
        }
        body.innerHTML = rows;
        stat.style.display = "none";
        title.textContent = "مواقيت الصلاة في " + c.ar + " — " + H.GREG_MONTHS[m - 1] + " " + y;
      }).catch(function () { stat.textContent = "تعذّر تحميل المواقيت حالياً، يرجى المحاولة لاحقاً."; });
    }
    sel.addEventListener("change", load);
    mSel.addEventListener("change", load);
    ySel.addEventListener("change", load);
    load();
  };
})();
