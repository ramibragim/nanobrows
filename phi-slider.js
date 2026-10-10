/* Веер работ: геометрия взята из TemplateMo 630 Helix Drift, оформление — наше */
(function () {
    var stage = document.getElementById("phiStage");
    if (!stage) return;

    var plates = [].slice.call(stage.querySelectorAll(".phi-plate")).map(function (el) {
        return { el: el, zi: 0 };
    });
    var N = plates.length;
    if (!N) return;

    var STEP = 0.52, RX = 300, RY = 34, COIL = 0.9, FALL = 0.52;
    var range = window.innerWidth < 900 ? 2 : 3;
    var pos = 0, target = 0, raf = null, running = false;
    var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var caption = document.getElementById("phiCaption");
    var settled = -1;

    function render() {
        var near = 999, nearI = 0;
        for (var i = 0; i < N; i++) {
            var p = plates[i];
            var d = ((i - pos + N / 2 + N * 2) % N) - N / 2;
            var a = Math.abs(d);
            if (a > range + 0.5) { if (p.el.style.display !== "none") p.el.style.display = "none"; continue; }
            if (p.el.style.display === "none") p.el.style.display = "";
            if (a < near) { near = a; nearI = i; }

            var th = d * STEP;
            var x = Math.sin(th) * RX;
            var y = -Math.sin(d * COIL) * RY;
            var rotY = -th * 57.2958 * 0.85;
            var rotZ = d * 1.4;
            var sc = Math.max(0.36, 1 / (1 + FALL * Math.pow(a, 1.15)));
            var op = Math.max(0.14, 1 - 0.34 * a);

            p.el.style.transform = "translate(-50%,-50%) translate3d(" + x.toFixed(2) + "px," + y.toFixed(2) +
                "px,0) rotateY(" + rotY.toFixed(2) + "deg) rotateZ(" + rotZ.toFixed(2) + "deg) scale(" + sc.toFixed(4) + ")";
            p.el.style.opacity = op.toFixed(3);
            var zi = Math.round(1000 - a * 10);
            if (zi !== p.zi) { p.el.style.zIndex = zi; p.zi = zi; }
            p.el.classList.toggle("is-centre", a < 0.5);
        }
        if (nearI !== settled) {
            settled = nearI;
            if (caption) {
                var el = plates[nearI].el;
                caption.querySelector(".phi-caption-title").textContent = el.getAttribute("data-title") || "";
                caption.querySelector(".phi-caption-note").textContent = el.getAttribute("data-note") || "";
                caption.querySelector(".phi-caption-no").textContent =
                    String(nearI + 1).padStart(2, "0") + " / " + String(N).padStart(2, "0");
            }
        }
    }

    function loop() {
        pos += (target - pos) * 0.14;
        if (Math.abs(target - pos) < 0.0004) { pos = target; running = false; render(); return; }
        render();
        raf = requestAnimationFrame(loop);
    }

    function kick() {
        if (REDUCED) { pos = target; render(); return; }
        if (!running) { running = true; raf = requestAnimationFrame(loop); }
    }

    function go(step) { target += step; kick(); }

    /* перетаскивание пальцем и мышью */
    var dragging = false, startX = 0, startTarget = 0;
    function down(e) {
        dragging = true; stage.classList.add("is-grabbing");
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        startTarget = target;
        stopAuto();
    }
    function move(e) {
        if (!dragging) return;
        var x = (e.touches ? e.touches[0].clientX : e.clientX);
        target = startTarget - (x - startX) / 150;
        kick();
    }
    function up() {
        if (!dragging) return;
        dragging = false; stage.classList.remove("is-grabbing");
        target = Math.round(target); kick(); startAuto();
    }
    stage.addEventListener("mousedown", down);
    stage.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("mousemove", move);
    window.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);

    stage.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { go(1); e.preventDefault(); }
        if (e.key === "ArrowLeft") { go(-1); e.preventDefault(); }
    });

    var prev = document.getElementById("phiPrev"), next = document.getElementById("phiNext");
    if (prev) prev.addEventListener("click", function () { go(-1); stopAuto(); startAuto(); });
    if (next) next.addEventListener("click", function () { go(1); stopAuto(); startAuto(); });

    var timer = null;
    function startAuto() { if (REDUCED) return; stopAuto(); timer = setInterval(function () { go(1); }, 4200); }
    function stopAuto() { if (timer) { clearInterval(timer); timer = null; } }

    window.addEventListener("resize", function () { range = window.innerWidth < 900 ? 2 : 3; render(); });

    render();
    startAuto();
})();
