/* Um Al-Qura Hijri calendar engine — ihijri.online
   Month-length data derived from the official Umm al-Qura calendar (1300–1600 AH).
   Each year is stored as 3 hex chars: a 12-bit mask, bit i set => month i+1 has 30 days. */
(function (root) {
  "use strict";
  var UQ_START_JDN = 2408762;      // 1 Muharram 1300 AH
  var UQ_START_YEAR = 1300;
  var UQ_END_YEAR = 1600;
  var UQ_DATA = "5552ab9372b657636cb55aaa95649e95d2ba5b53aab4ba9652e2ad56db5a752f25e8ad16a56ab56b4da9b92b2564ba9b35a6d95d4da5d4aa955369752f46e96d46a953525d4bd9ba3b4b69b2aa554ada5d2da6d9eaae94d2ac564aea6d56ad55d4aa9352ba5b53a6b5ea9d52d29a554ad56daea6e4ed1da2aaa95a2da5b9bb27646c95552ab4dbaba5b4da9d52aa592d26d8ed2daad5aa5a4b4979372b6975d69d52c9592b25b4db9d55d2da5d4aa9554daad3aabd2bc4b89a9552d5adb6a6d4dc9d92aa69562ae56d36ab55aaa94d49d95d2ba5b55aad55a9a92e26e55dada6d46a5b27a4d4ad56db5a754f49e92d26a563566b5baab92b2568ba9b55aada5b4da9b52a9a536276575af26d46a95552ad4bd9ba574b69b52a9552da5d4daad96b2e95e2ac9692eaad56ad65d4ad1562bc5b53a6b5db2d64d29a554ad96daea6e8ed1da4d4aa6a2da5b9b72b686d16554ab95b2ba5b5da9d52ca694e46e95d4daad5aaaa4d49b9374b6975d6ad52aa594b2ab55bad95d2dc5d92b25555ab55b4ba97a2745593aab4d69d65d2ba5b4aa954ad15d2dd9da5b45a952d25b8b717656db6aacaa9652b15b2bb5b6daab94d46a8d52da9d55a755749f13e4aa965566b5baab94";

  function maskOf(hy) {
    var i = (hy - UQ_START_YEAR) * 3;
    return parseInt(UQ_DATA.substr(i, 3), 16);
  }
  function monthLength(hy, hm) {
    return (maskOf(hy) >> (hm - 1)) & 1 ? 30 : 29;
  }
  function yearLength(hy) {
    var m = maskOf(hy), n = 348;
    for (var i = 0; i < 12; i++) n += (m >> i) & 1;
    return n;
  }
  function inRange(hy) { return hy >= UQ_START_YEAR && hy <= UQ_END_YEAR; }

  // --- Julian Day Number helpers (proleptic Gregorian, integer JDN at 00:00) ---
  function gregToJdn(y, m, d) {
    var a = Math.floor((14 - m) / 12), yy = y + 4800 - a, mm = m + 12 * a - 3;
    return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4)
      - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
  }
  function jdnToGreg(jdn) {
    var a = jdn + 32044, b = Math.floor((4 * a + 3) / 146097), c = a - Math.floor(146097 * b / 4);
    var dd = Math.floor((4 * c + 3) / 1461), e = c - Math.floor(1461 * dd / 4);
    var mm = Math.floor((5 * e + 2) / 153);
    return {
      day: e - Math.floor((153 * mm + 2) / 5) + 1,
      month: mm + 3 - 12 * Math.floor(mm / 10),
      year: 100 * b + dd - 4800 + Math.floor(mm / 10)
    };
  }

  // --- Hijri -> JDN ---
  function hijriToJdn(hy, hm, hd) {
    if (!inRange(hy)) return null;
    var jdn = UQ_START_JDN;
    for (var y = UQ_START_YEAR; y < hy; y++) jdn += yearLength(y);
    for (var m = 1; m < hm; m++) jdn += monthLength(hy, m);
    return jdn + hd - 1;
  }
  // --- JDN -> Hijri ---
  function jdnToHijri(jdn) {
    if (jdn < UQ_START_JDN) return null;
    var y = UQ_START_YEAR, rem = jdn - UQ_START_JDN, yl;
    while (y <= UQ_END_YEAR && rem >= (yl = yearLength(y))) { rem -= yl; y++; }
    if (y > UQ_END_YEAR) return null;
    var m = 1, ml;
    while (m < 12 && rem >= (ml = monthLength(y, m))) { rem -= ml; m++; }
    return { year: y, month: m, day: rem + 1 };
  }

  // --- Public API ---
  function gregorianToHijri(y, m, d) { return jdnToHijri(gregToJdn(y, m, d)); }
  function hijriToGregorian(hy, hm, hd) {
    var j = hijriToJdn(hy, hm, hd);
    return j === null ? null : jdnToGreg(j);
  }
  function isValidHijri(hy, hm, hd) {
    return inRange(hy) && hm >= 1 && hm <= 12 && hd >= 1 && hd <= monthLength(hy, hm);
  }
  function isValidGregorian(y, m, d) {
    if (m < 1 || m > 12 || d < 1 || d > 31) return false;
    var dt = new Date(Date.UTC(y, m - 1, d));
    return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
  }
  // Weekday index 0=Sunday
  function weekdayOfJdn(j) { return (j + 1) % 7; }

  var HIJRI_MONTHS = ["محرم","صفر","ربيع الأول","ربيع الآخر","جمادى الأولى","جمادى الآخرة",
    "رجب","شعبان","رمضان","شوال","ذو القعدة","ذو الحجة"];
  var GREG_MONTHS = ["يناير","فبراير","مارس","أبريل","مايو","يونيو",
    "يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
  var WEEKDAYS = ["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"];

  // Today in Saudi Arabia (UTC+3), regardless of visitor timezone
  function todayKSA() {
    var now = new Date();
    var ksa = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
    return { year: ksa.getFullYear(), month: ksa.getMonth() + 1, day: ksa.getDate() };
  }

  root.Hijri = {
    gregorianToHijri: gregorianToHijri,
    hijriToGregorian: hijriToGregorian,
    monthLength: monthLength,
    yearLength: yearLength,
    gregToJdn: gregToJdn,
    jdnToGreg: jdnToGreg,
    hijriToJdn: hijriToJdn,
    jdnToHijri: jdnToHijri,
    weekdayOfJdn: weekdayOfJdn,
    isValidHijri: isValidHijri,
    isValidGregorian: isValidGregorian,
    todayKSA: todayKSA,
    MIN_YEAR: UQ_START_YEAR,
    MAX_YEAR: UQ_END_YEAR,
    HIJRI_MONTHS: HIJRI_MONTHS,
    GREG_MONTHS: GREG_MONTHS,
    WEEKDAYS: WEEKDAYS
  };
})(typeof window !== "undefined" ? window : globalThis);
