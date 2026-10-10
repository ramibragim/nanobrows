/* Меню услуг: переключатель салона и переход к мастерам выбранной услуги */
(function () {
    var menu = document.getElementById("xidMenu");
    if (!menu) return;

    var rows = [].slice.call(menu.querySelectorAll(".menu-row"));
    var groups = [].slice.call(menu.querySelectorAll(".menu-group"));
    var segs = [].slice.call(document.querySelectorAll(".seg-btn"));
    var salon = "all";

    function apply() {
        rows.forEach(function (r) {
            var c = JSON.parse(r.dataset.counts);
            var n = salon === "all" ? c.all : (c[salon] || 0);
            r.hidden = n === 0;
            var b = r.querySelector(".menu-n b");
            if (b) b.textContent = n;
        });
        groups.forEach(function (g) {
            g.hidden = !g.querySelector(".menu-row:not([hidden])");
        });
    }

    /* салон общий для страницы: выбор здесь сообщаем мастерам и окну записи, и наоборот */
    function setSalon(s, announce) {
        salon = s;
        segs.forEach(function (b) {
            var on = b.dataset.salon === s;
            b.classList.toggle("is-active", on);
            b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply();
        if (announce) document.dispatchEvent(new CustomEvent("nb:salon", { detail: s }));
    }

    segs.forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");
        btn.addEventListener("click", function () { setSalon(btn.dataset.salon, true); });
    });
    document.addEventListener("nb:salon", function (e) {
        if (e.detail !== salon && segs.some(function (b) { return b.dataset.salon === e.detail; })) setSalon(e.detail, false);
    });

    /* нажатие на услугу: открываем раздел мастеров с этой услугой и этим салоном */
    menu.addEventListener("click", function (e) {
        var link = e.target.closest(".menu-link");
        if (!link) return;
        var sel = document.getElementById("serviceFilter");
        var target = document.getElementById("masters");
        if (!sel || !target) return;
        e.preventDefault();
        var branchBtn = document.querySelector('.m-filter[data-branch="' + salon + '"]');
        if (branchBtn) branchBtn.click();
        sel.value = link.dataset.service;
        sel.dispatchEvent(new Event("change"));
        target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });

    var q = new URLSearchParams(location.search).get("salon");
    if (q && segs.some(function (b) { return b.dataset.salon === q; })) setSalon(q, false);
    else apply();
})();

/* «Ustalara bax» в карточке салона: открываем мастеров этого салона, услугу сбрасываем */
(function () {
    document.addEventListener("click", function (e) {
        var link = e.target.closest(".salon-go");
        if (!link) return;
        var target = document.getElementById("masters");
        var sel = document.getElementById("serviceFilter");
        var btn = document.querySelector('.m-filter[data-branch="' + link.dataset.branch + '"]');
        if (!target || !btn) return;
        e.preventDefault();
        if (sel && sel.value !== "all") {
            sel.value = "all";
            sel.dispatchEvent(new Event("change"));
        }
        btn.click();
        target.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    });
})();

/* Фото салона: стрелки и счётчик «1 / 3»; пальцем лента листается сама */
(function () {
    [].forEach.call(document.querySelectorAll(".salon-ph"), function (box) {
        var strip = box.querySelector(".salon-ph-strip");
        var prev = box.querySelector(".salon-ph-prev"), next = box.querySelector(".salon-ph-next");
        var count = box.querySelector(".salon-ph-count");
        if (!strip || !prev || !next) return;
        var n = strip.children.length;
        var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
        function index() { return Math.round(strip.scrollLeft / strip.clientWidth); }
        function update() {
            var i = index();
            if (count) count.textContent = (i + 1) + " / " + n;
            prev.disabled = i <= 0;
            next.disabled = i >= n - 1;
        }
        function go(d) { strip.scrollTo({ left: (index() + d) * strip.clientWidth, behavior: still ? "auto" : "smooth" }); }
        prev.addEventListener("click", function () { go(-1); });
        next.addEventListener("click", function () { go(1); });
        strip.addEventListener("scroll", update, { passive: true });
        update();
    });
})();
