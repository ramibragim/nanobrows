/* Страница курса: окно заявки и ролики приложений.
   Любая кнопка с data-course-form открывает окно; data-package — пакет,
   который сразу отмечен. «Müraciətimi göndər» собирает ответы в готовое
   сообщение и открывает WhatsApp академии. Ничего не хранится и никуда,
   кроме WhatsApp, не отправляется. Без скрипта кнопки ведут к пакетам. */
(function () {
    var dlg = document.getElementById("courseForm");
    if (!dlg || typeof dlg.showModal !== "function") return;
    var form = dlg.querySelector(".kc-form");
    var done = dlg.querySelector(".kc-done");
    var err = dlg.querySelector(".kc-error");
    var phone = dlg.dataset.phone;
    var lastFocus = null;

    function open(pkg) {
        lastFocus = document.activeElement;
        form.hidden = false;
        done.hidden = true;
        err.hidden = true;
        [].forEach.call(form.querySelectorAll("[aria-invalid]"), function (x) { x.removeAttribute("aria-invalid"); });
        if (pkg) {
            var r = form.querySelector('input[name="package"][value="' + pkg.replace(/"/g, '\\"') + '"]');
            if (r) r.checked = true;
        }
        dlg.showModal();
        document.documentElement.classList.add("book-open");
        form.querySelector('input[name="name"]').focus();
    }
    function close() {
        dlg.close();
    }
    dlg.addEventListener("close", function () {
        document.documentElement.classList.remove("book-open");
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    });

    document.addEventListener("click", function (e) {
        var t = e.target.closest("[data-course-form]");
        if (t) { e.preventDefault(); open(t.getAttribute("data-package") || ""); return; }
        if (e.target.closest("#courseForm [data-close]")) close();
    });
    /* клик по затемнению вокруг окна */
    dlg.addEventListener("click", function (e) {
        if (e.target === dlg) close();
    });

    function fail(input, text) {
        err.textContent = text;
        err.hidden = false;
        if (input) { input.setAttribute("aria-invalid", "true"); input.focus(); }
    }

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        [].forEach.call(form.querySelectorAll("[aria-invalid]"), function (x) { x.removeAttribute("aria-invalid"); });
        var name = form.elements.name, tel = form.elements.phone, time = form.elements.time;
        var pkg = form.querySelector('input[name="package"]:checked');
        if (!name.value.trim()) return fail(name, "Adınızı və soyadınızı yazın.");
        if (tel.value.replace(/\D/g, "").length < 9) return fail(tel, "Telefon nömrənizi tam yazın.");
        if (!pkg) return fail(form.querySelector('input[name="package"]'), "Kurs paketini seçin.");
        err.hidden = true;

        var lines = [
            "Salam! Saytdan PhiBrows Nano kursuna müraciət edirəm.",
            "Ad və soyad: " + name.value.trim(),
            "Telefon: " + tel.value.trim(),
            "Paket: " + pkg.value + " (" + pkg.dataset.price + " AZN)"
        ];
        if (time.value.trim()) lines.push("Əlaqə üçün uyğun vaxt: " + time.value.trim());
        var url = "https://wa.me/" + phone.replace("+", "") + "?text=" + encodeURIComponent(lines.join("\n"));
        var w = window.open(url, "_blank", "noopener");
        if (!w) location.href = url;
        form.hidden = true;
        done.hidden = false;
        done.querySelector("button").focus();
    });

    /* ролики приложений играют, только пока видны на экране */
    var still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var vids = [].slice.call(document.querySelectorAll(".kc-phone video"));
    if (still || !("IntersectionObserver" in window)) {
        vids.forEach(function (v) { v.controls = true; });
        return;
    }
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
            if (en.isIntersecting) { en.target.play().catch(function () {}); }
            else { en.target.pause(); }
        });
    }, { threshold: 0.4 });
    vids.forEach(function (v) { io.observe(v); });
})();
