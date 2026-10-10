/* Фильтр мастеров: салон и услуга.
   Числа у кнопок и в списке пересчитываются под второй выбранный фильтр,
   поэтому показывают ровно столько мастеров, сколько откроется по нажатию.
   Сначала видно 8 карточек, остальные — по кнопке «Hamısını göstər».
   Выбранная услуга встаёт первой меткой и попадает в текст сообщения мастеру.
   Салон общий для всей страницы: выбор здесь и в меню услуг — событие nb:salon. */
(function () {
    var grid = document.getElementById("mastersGrid");
    if (!grid) return;

    var FIRST = 8;
    var cards = [].slice.call(grid.querySelectorAll(".m-card"));
    var buttons = [].slice.call(document.querySelectorAll(".m-filter[data-branch]"));
    var select = document.getElementById("serviceFilter");
    var count = document.getElementById("mastersCount");
    var empty = document.getElementById("mastersEmpty");
    var more = document.getElementById("mastersMore");

    var branch = "all";
    var service = "all";
    var expanded = false;

    function hasService(card, s) {
        return s === "all" || (" " + card.dataset.services + " ").indexOf(" " + s + " ") !== -1;
    }
    function inBranch(card, b) {
        return b === "all" || card.dataset.branch === b;
    }
    function countFor(b, s) {
        return cards.filter(function (c) { return inBranch(c, b) && hasService(c, s); }).length;
    }
    function serviceLabel() {
        if (!select || service === "all") return "";
        var o = select.options[select.selectedIndex];
        return o ? o.dataset.label : "";
    }

    function recount() {
        buttons.forEach(function (btn) {
            var n = countFor(btn.dataset.branch, service);
            var span = btn.querySelector("span");
            if (span) span.textContent = n;
            btn.classList.toggle("is-zero", n === 0);
        });
        if (!select) return;
        [].slice.call(select.options).forEach(function (opt) {
            var n = countFor(branch, opt.value);
            var label = opt.value === "all" ? "Bütün xidmətlər" : opt.dataset.label;
            opt.textContent = label + " (" + n + ")";
            opt.disabled = n === 0 && opt.value !== service;
        });
    }

    /* метки: выбранная услуга первой, видны три, остальные под «+N» */
    function retag(card) {
        var box = card.querySelector(".m-tags");
        var tags = [].slice.call(box.querySelectorAll(".m-tag[data-s]"));
        var moreTag = box.querySelector(".m-tag--more");
        tags.sort(function (a, b) {
            var ma = a.dataset.s === service, mb = b.dataset.s === service;
            if (ma !== mb) return ma ? -1 : 1;
            return a.dataset.i - b.dataset.i;
        });
        tags.forEach(function (t, i) {
            box.insertBefore(t, moreTag);
            t.classList.toggle("is-x", i >= 3);
            t.classList.toggle("is-match", t.dataset.s === service);
        });
        if (moreTag) {
            moreTag.textContent = "+" + Math.max(0, tags.length - 3);
            moreTag.hidden = tags.length <= 3;
        }
    }
    cards.forEach(function (c) {
        [].forEach.call(c.querySelectorAll(".m-tag[data-s]"), function (t, i) { t.dataset.i = i; });
    });

    /* текст сообщения мастеру: с услугой, если она выбрана */
    function relink(card) {
        var a = card.querySelector(".m-book");
        if (!a || !a.dataset.phone) return;
        var svc = serviceLabel();
        var text = "Salam! Saytdan yazıram. " + a.dataset.name + " ilə " +
            (svc ? svc + " üçün " : "") + "qeydiyyat istəyirəm (" + a.dataset.branch + ").";
        a.href = "https://wa.me/" + a.dataset.phone.replace("+", "") + "?text=" + encodeURIComponent(text);
    }

    function apply() {
        var shown = 0;
        cards.forEach(function (c) {
            var match = inBranch(c, branch) && hasService(c, service);
            if (match) shown++;
            c.hidden = !match || (!expanded && shown > FIRST);
            retag(c);
            relink(c);
        });
        if (count) count.textContent = shown + " usta";
        if (empty) empty.hidden = shown !== 0;
        if (more) {
            more.hidden = expanded || shown <= FIRST;
            more.querySelector("span").textContent = "(" + shown + ")";
        }
        recount();
    }

    function setBranch(b, announce) {
        branch = b;
        expanded = false;
        buttons.forEach(function (x) {
            var on = x.dataset.branch === b;
            x.classList.toggle("is-active", on);
            x.setAttribute("aria-pressed", on ? "true" : "false");
        });
        apply();
        if (announce) document.dispatchEvent(new CustomEvent("nb:salon", { detail: b }));
    }

    buttons.forEach(function (btn) {
        btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");
        btn.addEventListener("click", function () { setBranch(btn.dataset.branch, true); });
    });
    document.addEventListener("nb:salon", function (e) {
        if (e.detail !== branch && buttons.some(function (x) { return x.dataset.branch === e.detail; })) setBranch(e.detail, false);
    });

    if (select) select.addEventListener("change", function () { service = select.value; expanded = false; apply(); });
    if (more) more.addEventListener("click", function () {
        var firstHidden = cards.filter(function (c) { return c.hidden && inBranch(c, branch) && hasService(c, service); })[0];
        expanded = true;
        apply();
        var link = firstHidden && firstHidden.querySelector(".m-book");
        if (link) link.focus({ preventScroll: true });
    });

    apply();
})();

/* переход со статьи блога или из профиля Instagram: index.html?xidmet=<услуга>&salon=<салон>#masters */
(function () {
    var q = new URLSearchParams(location.search);
    var svc = q.get("xidmet"), salon = q.get("salon");
    if (!svc && !salon) return;
    var sel = document.getElementById("serviceFilter");
    if (svc && sel && [].some.call(sel.options, function (o) { return o.value === svc; })) {
        sel.value = svc;
        sel.dispatchEvent(new Event("change"));
    }
    var btn = salon && document.querySelector('.m-filter[data-branch="' + salon + '"]');
    if (btn) btn.click();
})();
