/* Выбор услуги в стиле сайта вместо системного списка.
   Источник правды — обычный <select id="serviceFilter">: фильтр мастеров
   пересчитывает в нём числа и недоступные пункты, а этот список при каждом
   открытии строится из него заново и при выборе меняет его значение.
   На компьютере — выпадающая панель, на телефоне — окно снизу.
   Клавиатура: стрелки, Home/End, Enter/пробел — выбрать, Esc — закрыть. */
(function () {
    var select = document.getElementById("serviceFilter");
    if (!select) return;
    var wrap = select.parentNode;
    var label = wrap.querySelector("label[for='serviceFilter']");
    var mobile = matchMedia("(max-width: 760px)");

    var CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
    var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
    var X = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

    if (label) label.id = "serviceFilterLabel";
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "m-pick";
    btn.id = "servicePick";
    btn.setAttribute("aria-haspopup", "listbox");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-labelledby", "serviceFilterLabel servicePick");
    btn.innerHTML = '<span class="m-pick-val"></span><span class="m-pick-n"></span>' + CHEV;

    var pop = document.createElement("div");
    pop.className = "m-pop";
    pop.hidden = true;
    pop.innerHTML = '<div class="m-pop-backdrop" data-close></div>' +
        '<div class="m-pop-panel"><div class="m-pop-head"><p class="m-pop-title">Xidmət seçin</p>' +
        '<button class="m-pop-x" type="button" data-close aria-label="Bağla">' + X + '</button></div>' +
        '<ul class="m-pop-list" role="listbox" tabindex="-1" aria-labelledby="serviceFilterLabel"></ul></div>';
    var list = pop.querySelector(".m-pop-list");

    select.classList.add("is-enhanced");
    select.setAttribute("tabindex", "-1");
    select.setAttribute("aria-hidden", "true");
    wrap.appendChild(btn);
    wrap.appendChild(pop);

    function parse(opt) {
        var m = opt.textContent.match(/\((\d+)\)\s*$/);
        return { value: opt.value, label: opt.dataset.label, n: m ? m[1] : "", disabled: opt.disabled };
    }
    function syncButton() {
        var o = parse(select.options[select.selectedIndex]);
        btn.querySelector(".m-pick-val").textContent = o.label;
        btn.querySelector(".m-pick-n").textContent = o.n;
    }

    function build() {
        var html = "", i = 0;
        [].forEach.call(select.children, function (node) {
            var opts = node.tagName === "OPTGROUP" ? [].slice.call(node.children) : [node];
            if (node.tagName === "OPTGROUP") html += '<li class="m-pop-group" role="presentation">' + node.label + "</li>";
            opts.forEach(function (opt) {
                var o = parse(opt), sel = o.value === select.value;
                html += '<li class="m-pop-opt' + (sel ? " is-sel" : "") + '" role="option" id="spo' + (i++) + '"' +
                    ' data-value="' + o.value + '" aria-selected="' + sel + '"' + (o.disabled ? ' aria-disabled="true"' : "") + ">" +
                    '<span class="m-pop-check">' + CHECK + '</span><span class="m-pop-name"></span><span class="m-pop-n">' + o.n + "</span></li>";
            });
        });
        list.innerHTML = html;
        // названия — текстом, а не разметкой
        [].forEach.call(list.querySelectorAll(".m-pop-opt"), function (li) {
            var opt = [].filter.call(select.options, function (o) { return o.value === li.dataset.value; })[0];
            li.querySelector(".m-pop-name").textContent = opt.dataset.label;
        });
    }

    function opts() { return [].slice.call(list.querySelectorAll(".m-pop-opt:not([aria-disabled])")); }
    function setActive(li) {
        [].forEach.call(list.querySelectorAll(".is-active"), function (x) { x.classList.remove("is-active"); });
        if (!li) return;
        li.classList.add("is-active");
        list.setAttribute("aria-activedescendant", li.id);
        li.scrollIntoView({ block: "nearest" });
    }

    function open() {
        build();
        pop.hidden = false;
        pop.classList.toggle("is-sheet", mobile.matches);
        btn.setAttribute("aria-expanded", "true");
        if (mobile.matches) document.documentElement.classList.add("book-open");
        void pop.offsetWidth;
        pop.classList.add("is-in");
        list.focus({ preventScroll: true });
        setActive(list.querySelector(".is-sel") || opts()[0]);
    }
    function close(focusBtn) {
        pop.classList.remove("is-in", "is-sheet");
        pop.hidden = true;
        btn.setAttribute("aria-expanded", "false");
        document.documentElement.classList.remove("book-open");
        if (focusBtn) btn.focus();
    }
    function choose(li) {
        if (!li || li.hasAttribute("aria-disabled")) return;
        select.value = li.dataset.value;
        select.dispatchEvent(new Event("change"));
        close(true);
    }

    btn.addEventListener("click", function () { pop.hidden ? open() : close(true); });
    btn.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); open(); }
    });
    list.addEventListener("click", function (e) { choose(e.target.closest(".m-pop-opt")); });
    list.addEventListener("mousemove", function (e) {
        var li = e.target.closest(".m-pop-opt:not([aria-disabled])");
        if (li && !li.classList.contains("is-active")) setActive(li);
    });
    list.addEventListener("keydown", function (e) {
        var all = opts(), cur = list.querySelector(".is-active"), i = all.indexOf(cur);
        if (e.key === "ArrowDown") { e.preventDefault(); setActive(all[Math.min(all.length - 1, i + 1)]); }
        else if (e.key === "ArrowUp") { e.preventDefault(); setActive(all[Math.max(0, i - 1)]); }
        else if (e.key === "Home") { e.preventDefault(); setActive(all[0]); }
        else if (e.key === "End") { e.preventDefault(); setActive(all[all.length - 1]); }
        else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(cur); }
        else if (e.key === "Escape" || e.key === "Tab") { if (e.key === "Escape") e.preventDefault(); close(e.key === "Escape"); }
    });
    pop.addEventListener("click", function (e) { if (e.target.closest("[data-close]")) close(true); });
    document.addEventListener("click", function (e) {
        if (!pop.hidden && !pop.classList.contains("is-sheet") && !wrap.contains(e.target)) close(false);
    });

    select.addEventListener("change", syncButton);
    /* смена салона меняет числа в списке — обновляем и кнопку */
    document.addEventListener("nb:salon", function () { setTimeout(syncButton); });
    syncButton();
})();
