/* Запись в WhatsApp: окно выбора салона.
   Открывается закреплённой кнопкой внизу экрана телефона и любым элементом
   с атрибутом data-book. Значение data-book — услуга для текста сообщения;
   если оно начинается с «#», услугу берём из текста элемента по этому селектору
   (так «Bu qaşları istəyirəm» берёт название текущего слайда).
   Салон, выбранный в фильтрах страницы (событие nb:salon), встаёт первым. */
(function () {
    var dataEl = document.getElementById("bookData");
    if (!dataEl) return;
    var data = JSON.parse(dataEl.textContent);
    var current = null;
    var lastFocus = null;

    var WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="' + data.waPath + '"/></svg>';
    var TEL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>';
    var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }
    function wa(phone, text) {
        return "https://wa.me/" + phone.replace("+", "") + "?text=" + encodeURIComponent(text);
    }

    var sheet = document.createElement("div");
    sheet.className = "book-sheet";
    sheet.hidden = true;
    sheet.innerHTML =
        '<div class="book-backdrop" data-close></div>' +
        '<div class="book-panel" role="dialog" aria-modal="true" aria-labelledby="bookTitle">' +
        '<div class="book-head"><p class="book-title" id="bookTitle">Salonu seçin</p>' +
        '<button class="book-x" type="button" data-close aria-label="Bağla">' + X + '</button></div>' +
        '<p class="book-svc" hidden></p>' +
        '<ul class="book-list"></ul>' +
        '<p class="book-note">Qaşlarınızın şəklini göndərin — qiyməti və uyğun ustanı yazaq.</p>' +
        '<a class="book-academy" target="_blank" rel="noopener" href="' +
        esc(wa(data.academy.phone, "Salam! Saytdan yazıram. Kurslar haqqında məlumat istəyirəm.")) +
        '">Kurs üçün yazın — Akademiya</a>' +
        '</div>';
    document.body.appendChild(sheet);
    var list = sheet.querySelector(".book-list");
    var svcLine = sheet.querySelector(".book-svc");

    function render(service) {
        var salons = data.salons.slice();
        if (current) salons.sort(function (a, b) { return (b.slug === current) - (a.slug === current); });
        list.innerHTML = salons.map(function (s) {
            var text = "Salam! Saytdan yazıram. " + s.name + " salonuna " +
                (service ? service + " üçün " : "") + "qeydiyyat istəyirəm.";
            var mine = s.slug === current;
            return '<li class="book-row' + (mine ? " is-current" : "") + '">' +
                '<a class="book-salon" target="_blank" rel="noopener" href="' + esc(wa(s.phone, text)) + '">' +
                '<span class="book-salon-txt"><span class="book-salon-name">' + esc(s.name) +
                (mine ? ' <span class="book-mine">seçdiyiniz</span>' : "") + '</span>' +
                '<span class="book-salon-meta">' + esc(s.meta) + '</span></span>' +
                '<span class="book-salon-go">' + WA + '</span></a>' +
                '<a class="book-tel" href="tel:' + s.phone + '" aria-label="Zəng — ' + esc(s.name) + '">' + TEL + '</a></li>';
        }).join("");
        svcLine.hidden = !service;
        svcLine.textContent = service ? "Xidmət: " + service : "";
    }

    function open(service) {
        lastFocus = document.activeElement;
        render(service);
        sheet.hidden = false;
        document.documentElement.classList.add("book-open");
        // плавное появление без ожидания кадра: окно не должно остаться прозрачным, если кадр задержится
        void sheet.offsetWidth;
        sheet.classList.add("is-in");
        var first = sheet.querySelector(".book-salon");
        if (first) first.focus();
    }
    function close() {
        sheet.classList.remove("is-in");
        sheet.hidden = true;
        document.documentElement.classList.remove("book-open");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener("click", function (e) {
        var t = e.target.closest("[data-book]");
        if (t) {
            e.preventDefault();
            var v = t.getAttribute("data-book") || "";
            if (v.charAt(0) === "#") {
                var src = document.querySelector(v);
                v = src ? src.textContent.trim() : "";
            }
            var mobileNav = document.getElementById("mobileNav");
            if (mobileNav && mobileNav.classList.contains("active")) {
                mobileNav.classList.remove("active");
                var tg = document.getElementById("menuToggle");
                if (tg) tg.classList.remove("active");
            }
            open(v);
            return;
        }
        if (!sheet.hidden && e.target.closest("[data-close]")) close();
    });
    /* после перехода в WhatsApp окно больше не нужно */
    sheet.addEventListener("click", function (e) {
        if (e.target.closest(".book-salon, .book-academy")) setTimeout(close, 300);
    });
    document.addEventListener("keydown", function (e) {
        if (sheet.hidden) return;
        if (e.key === "Escape") { close(); return; }
        if (e.key !== "Tab") return;
        var f = [].slice.call(sheet.querySelectorAll("a, button"));
        var i = f.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    });

    document.addEventListener("nb:salon", function (e) { current = e.detail === "all" ? null : e.detail; });
    var q = new URLSearchParams(location.search).get("salon");
    if (q && data.salons.some(function (s) { return s.slug === q; })) current = q;
})();

/* Переход на раздел с другой страницы (index.html#masters). Браузер прыгает
   к разделу сразу, а потом догружаются шрифты и картинки, страница вытягивается,
   и человек оказывается выше нужного места. После загрузки доводим ещё раз —
   если он сам ещё не начал листать. */
(function () {
    if (!location.hash) return;
    var target;
    try { target = document.querySelector(location.hash); } catch (e) { return; }
    if (!target) return;
    var touched = false;
    ["wheel", "touchstart", "keydown", "mousedown"].forEach(function (ev) {
        addEventListener(ev, function () { touched = true; }, { once: true, passive: true });
    });
    function go() { if (!touched) target.scrollIntoView({ block: "start", behavior: "instant" }); }
    addEventListener("load", function () {
        go();
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(go);
        setTimeout(go, 500);
    });
})();
