var makeVideoPlayableInline = function () {
    "use strict";
    function e(e) {
        var r = void 0;
        var n = void 0;
        function i(t) {
            r = requestAnimationFrame(i);
            e(t - (n || t));
            n = t
        }
        this.start = function () {
            if (!r) {
                i(0)
            }
        };
        this.stop  = function () {
            cancelAnimationFrame(r);
            r = null;
            n = 0
        }
    }
    function r(e, r, n, i) {
        function t(r) {
            if (Boolean(e[n]) === Boolean(i)) {
                r.stopImmediatePropagation()
            }
            delete e[n]
        }
        e.addEventListener(r, t, false);
        return t
    }
    function n(e, r, n, i) {
        function t() {
            return n[r]
        }
        function u(e) {
            n[r] = e
        }
        if (i) {
            u(e[r])
        }
        Object.defineProperty(e, r, {
            get: t,
            set: u
        })
    }
    var i = typeof Symbol === "undefined"
        ? function (e) {
            return "@" + (e || "@") + Math.random()
        }
        : Symbol;
    var t = /iPhone|iPod/i.test(navigator.userAgent);
    var u = i();
    var a = i();
    var d = i("nativeplay");
    var o = i("nativepause");
    function s(e) {
        var r = new Audio;
        r.src = e.currentSrc || e.src;
        return r
    }
    var v = [];
    v.i = 0;
    function f(e, r) {
        if ((v.tue || 0) + 200 < Date.now()) {
            e[a]  = true;
            v.tue = Date.now()
        }
        e.currentTime = r;
        v[++v.i % 3]  = r * 100 | 0 / 100
    }
    function c(e) {
        return e.driver.currentTime >= e.video.duration
    }
    function l(e) {
        var r = this;
        if (r.video.readyState >= r.video.HAVE_FUTURE_DATA) {
            if (!r.hasAudio) {
                r.driver.currentTime = r.video.currentTime + e * r.video.playbackRate / 1e3;
                if (r.video.loop && c(r)) {
                    r.driver.currentTime = 0
                }
            }
            f(r.video, r.driver.currentTime)
        }
        if (r.video.ended) {
            r
                .video
                .pause(true)
        }
    }
    function p() {
        var e = this;
        var r = e[u];
        if (e.webkitDisplayingFullscreen) {
            e[d]();
            return
        }
        if (!e.paused) {
            return
        }
        r.paused = false;
        if (!e.buffered.length) {
            e.load()
        }
        r
            .driver
            .play();
        r
            .updater
            .start();
        e.dispatchEvent(new Event("play"));
        e.dispatchEvent(new Event("playing"))
    }
    function m(e) {
        var r = this;
        var n = r[u];
        n
            .driver
            .pause();
        n
            .updater
            .stop();
        if (r.webkitDisplayingFullscreen) {
            r[o]()
        }
        if (n.paused && !e) {
            return
        }
        n.paused = true;
        r.dispatchEvent(new Event("pause"));
        if (r.ended) {
            r[a] = true;
            r.dispatchEvent(new Event("ended"))
        }
    }
    function y(r, n) {
        var i = r[u] = {};
        i.paused   = true;
        i.hasAudio = n;
        i.video    = r;
        i.updater  = new e(l.bind(i));
        if (n) {
            i.driver = s(r)
        } else {
            i.driver = {
                get ended() {
                    return c(i)
                },
                muted : true,
                pause : function t() {
                    i.driver.paused = true
                },
                paused: true,
                play  : function a() {
                    i.driver.paused = false;
                    if (c(i)) {
                        f(r, 0)
                    }
                }
            }
        }
        r
            .addEventListener("emptied", function () {
                if (i.driver.src && i.driver.src !== r.currentSrc) {
                    f(r, 0);
                    r.pause();
                    i.driver.src = r.currentSrc
                }
            }, false);
        r.addEventListener("webkitbeginfullscreen", function () {
            if (!r.paused) {
                r.pause();
                r[d]()
            } else if (n && !i.driver.buffered.length) {
                i
                    .driver
                    .load()
            }
        });
        if (n) {
            r
                .addEventListener("webkitendfullscreen", function () {
                    i.driver.currentTime = r.currentTime
                });
            r.addEventListener("seeking", function () {
                if (v.indexOf(r.currentTime * 100 | 0 / 100) < 0) {
                    i.driver.currentTime = r.currentTime
                }
            })
        }
    }
    function h(e) {
        var i = e[u];
        e[d]    = e.play;
        e[o]    = e.pause;
        e.play  = p;
        e.pause = m;
        n(e, "paused", i.driver);
        n(e, "muted", i.driver, true);
        n(e, "playbackRate", i.driver, true);
        n(e, "ended", i.driver);
        n(e, "loop", i.driver, true);
        r(e, "seeking");
        r(e, "seeked");
        r(e, "timeupdate", a, false);
        r(e, "ended", a, false)
    }
    function b(e) {
        var r = arguments.length <= 1 || arguments[1] === undefined
            ? true
            : arguments[1];
        var n = arguments.length <= 2 || arguments[2] === undefined
            ? true
            : arguments[2];
        if (n && !t || e[u]) {
            return
        }
        y(e, r);
        h(e);
        e
            .classList
            .add("IIV");
        if (!r && e.autoplay) {
            e.play()
        }
    }
    return b
}();
