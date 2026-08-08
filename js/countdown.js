/* ihijri.online — كم باقي على المناسبات الإسلامية */
(function () {
  function arDays(n){ if(n===1) return "يوم واحد"; if(n===2) return "يومان"; if(n>=3&&n<=10) return n+" أيام"; return n+" يومًا"; }

  "use strict";
  var H = window.Hijri;
  // [key, arabic name, hijri month, hijri day, note]
  var EVENTS = [
    ["ramadan", "شهر رمضان المبارك", 9, 1, "بداية شهر الصيام", "🌙"],
    ["fitr", "عيد الفطر المبارك", 10, 1, "أول أيام شوال", "🎉"],
    ["arafah", "يوم عرفة", 12, 9, "يُستحب صيامه لغير الحاج", "🕋"],
    ["adha", "عيد الأضحى المبارك", 12, 10, "يوم النحر", "🐑"],
    ["hijri_new", "رأس السنة الهجرية", 1, 1, "غرة شهر محرم", "📅"],
    ["ashura", "يوم عاشوراء", 1, 10, "العاشر من محرم", "✨"],
    ["hajj", "بداية أشهر الحج", 10, 1, "من شوال إلى عشر ذي الحجة", "🧭"],
    ["shaban", "شهر شعبان", 8, 1, "استعداداً لرمضان", "🌘"]
  ];

  function nextOccurrence(hm, hd, todayJdn, hy) {
    // find the next time this hijri month/day occurs on or after today
    for (var y = hy; y <= hy + 2 && y <= H.MAX_YEAR; y++) {
      if (!H.isValidHijri(y, hm, hd)) continue;
      var j = H.hijriToJdn(y, hm, hd);
      if (j >= todayJdn) return { jdn: j, hy: y };
    }
    return null;
  }

  window.initCountdown = function () {
    var t = H.todayKSA();
    var todayJdn = H.gregToJdn(t.year, t.month, t.day);
    var th = H.gregorianToHijri(t.year, t.month, t.day);
    var rows = [], cards = "";

    for (var i = 0; i < EVENTS.length; i++) {
      var e = EVENTS[i];
      var nx = nextOccurrence(e[2], e[3], todayJdn, th.year);
      if (!nx) continue;
      var days = nx.jdn - todayJdn;
      var g = H.jdnToGreg(nx.jdn);
      var wd = H.WEEKDAYS[H.weekdayOfJdn(nx.jdn)];
      rows.push({ name: e[1], days: days, g: g, hy: nx.hy, wd: wd, note: e[4], icon: e[5], hm: e[2], hd: e[3] });
    }
    rows.sort(function (a, b) { return a.days - b.days; });

    for (var k = 0; k < rows.length; k++) {
      var r = rows[k];
      var label = r.days === 0 ? "اليوم!" : r.days === 1 ? "غداً" : "باقي " + arDays(r.days);
      cards += '<div class="cd-card' + (k === 0 ? " cd-next" : "") + '">' +
        '<div class="cd-ic">' + r.icon + "</div>" +
        '<div class="cd-name">' + r.name + "</div>" +
        '<div class="cd-days">' + label + "</div>" +
        '<div class="cd-date">' + r.hd + " " + H.HIJRI_MONTHS[r.hm - 1] + " " + r.hy + " هـ</div>" +
        '<div class="cd-date">' + r.wd + "، " + window.formatGreg(r.g) + "</div>" +
        '<div class="cd-note">' + r.note + "</div></div>";
    }
    window.$i("cdGrid").innerHTML = cards;

    // detail table
    var tb = "";
    for (var m = 0; m < rows.length; m++) {
      var x = rows[m];
      tb += "<tr><td><strong>" + x.name + "</strong></td>" +
        '<td class="num">' + x.hd + " " + H.HIJRI_MONTHS[x.hm - 1] + " " + x.hy + " هـ</td>" +
        "<td>" + x.wd + "</td>" +
        '<td class="num">' + window.formatGreg(x.g) + "</td>" +
        '<td class="num">' + (x.days === 0 ? "اليوم" : arDays(x.days)) + "</td></tr>";
    }
    window.$i("cdBody").innerHTML = tb;

    var first = rows[0];
    window.$i("cdLead").innerHTML = "أقرب مناسبة قادمة هي <strong>" + first.name + "</strong> — " +
      (first.days === 0 ? "وهي اليوم!" : "يتبقى عليها <strong>" + arDays(first.days) + "</strong>، وتوافق " +
        first.wd + " " + window.formatGreg(first.g) + ".");
  };
})();
