/* ihijri.online — مشغل القرآن الكريم */
(function () {
  "use strict";
  var CDN = "https://cdn.islamic.network/quran/audio-surah/128/";
  var RECITERS = [
    { id: "ar.alafasy", ar: "مشاري راشد العفاسي" },
    { id: "ar.abdurrahmaansudais", ar: "عبد الرحمن السديس" },
    { id: "ar.mahermuaiqly", ar: "ماهر المعيقلي" },
    { id: "ar.abdulbasitmurattal", ar: "عبد الباسط عبد الصمد (مرتل)" },
    { id: "ar.husary", ar: "محمود خليل الحصري" },
    { id: "ar.minshawi", ar: "محمد صديق المنشاوي" },
    { id: "ar.hudhaify", ar: "علي الحذيفي" },
    { id: "ar.saoodshuraym", ar: "سعود الشريم" }
  ];
  function $q(id){ return document.getElementById(id); }
  window.initQuran = function () {
    var S = window.SURAHS, cur = 1;
    var list = $q("surahList"), rec = $q("reciter");
    var audio = $q("player"), nowEl = $q("nowPlaying"), search = $q("surahSearch");

    rec.innerHTML = RECITERS.map(function (r) { return '<option value="' + r.id + '">' + r.ar + "</option>"; }).join("");

    function render(filter) {
      var f = (filter || "").trim();
      var html = "";
      for (var i = 0; i < S.length; i++) {
        var s = S[i];
        if (f && s.ar.indexOf(f) === -1 && String(s.n).indexOf(f) !== 0) continue;
        html += '<button class="surah' + (s.n === cur ? " playing" : "") + '" data-n="' + s.n + '" type="button">' +
          '<span class="n">' + s.n + "</span><span><span class=\"nm\">سورة " + s.ar + "</span><br>" +
          '<span class="inf">' + s.t + " · " + s.a + " آية</span></span></button>";
      }
      list.innerHTML = html || '<p style="color:#5c6b66">لا توجد نتائج مطابقة.</p>';
    }
    function play(n, auto) {
      cur = n;
      var s = S[n - 1];
      audio.src = CDN + rec.value + "/" + n + ".mp3";
      nowEl.innerHTML = "<strong>سورة " + s.ar + "</strong> — " + s.t + " · " + s.a + " آية · بصوت " +
        rec.options[rec.selectedIndex].text;
      render(search.value);
      if (auto !== false) { var p = audio.play(); if (p && p.catch) p.catch(function () {}); }
    }
    list.addEventListener("click", function (e) {
      var b = e.target.closest ? e.target.closest(".surah") : null;
      if (b) play(+b.getAttribute("data-n"));
    });
    rec.addEventListener("change", function () { play(cur, false); });
    search.addEventListener("input", function () { render(search.value); });
    audio.addEventListener("ended", function () { if (cur < 114) play(cur + 1); });
    render("");
    play(1, false);
  };
})();
