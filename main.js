(function () {
  "use strict";

  /* ─── Env detection ─── */
  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var isMobile = window.innerWidth <= 768;
  var hasFinePointer = window.matchMedia(
    "(hover: hover) and (pointer: fine)"
  ).matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ─── Lenis smooth scroll ─── */
  var lenis = null;
  if (!prefersReducedMotion) {
    lenis = new Lenis({
      duration: 1.4,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);
  }

  function initBackgroundStars() {
    var canvas = document.getElementById("bg-stars");
    if (!canvas) return;

    var ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    var stars = [];
    var width = 0;
    var height = 0;
    var dpr = 1;
    var rafId = null;
    var resizeTimer = 0;

    function buildStars() {
      var maxStars = isMobile ? 50 : 130;
      var count = Math.max(
        isMobile ? 20 : 36,
        Math.min(maxStars, Math.floor((width * height) / (isMobile ? 20000 : 13000)))
      );
      stars = [];
      for (var i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.4 + 0.35,
          twinkle: Math.random() * 1.4 + 0.5,
          phase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.08,
          vy: (Math.random() - 0.5) * 0.08,
        });
      }
    }

    function sizeCanvas() {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildStars();
    }

    function draw(now) {
      ctx.clearRect(0, 0, width, height);
      for (var i = 0; i < stars.length; i++) {
        var star = stars[i];

        if (!prefersReducedMotion) {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x < -6) star.x = width + 6;
          if (star.x > width + 6) star.x = -6;
          if (star.y < -6) star.y = height + 6;
          if (star.y > height + 6) star.y = -6;
        }

        var twinkle =
          0.22 + (Math.sin(now * 0.001 * star.twinkle + star.phase) + 1) * 0.16;
        var alpha = prefersReducedMotion ? 0.2 : twinkle;
        ctx.beginPath();
        ctx.fillStyle = "rgba(201, 162, 39, " + alpha.toFixed(3) + ")";
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function frame(now) {
      draw(now || 0);
      if (!prefersReducedMotion) {
        rafId = window.requestAnimationFrame(frame);
      }
    }

    sizeCanvas();
    draw(0);

    if (!prefersReducedMotion) {
      rafId = window.requestAnimationFrame(frame);
    }

    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(function () {
        if (rafId) {
          window.cancelAnimationFrame(rafId);
          rafId = null;
        }
        sizeCanvas();
        draw(0);
        if (!prefersReducedMotion) {
          rafId = window.requestAnimationFrame(frame);
        }
      }, 120);
    });
  }

  initBackgroundStars();

  function initHeroAmbientPointer() {
    if (!hasFinePointer || prefersReducedMotion) return;

    var hero = document.getElementById("hero");
    var ambient = hero ? hero.querySelector(".hero__ambient") : null;
    if (!hero || !ambient) return;

    hero.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      var nx = (event.clientX - rect.left) / rect.width - 0.5;
      var ny = (event.clientY - rect.top) / rect.height - 0.5;
      gsap.to(ambient, {
        x: nx * 34,
        y: ny * 22,
        duration: 0.8,
        ease: "power3.out",
        overwrite: true,
      });
    });

    hero.addEventListener("pointerleave", function () {
      gsap.to(ambient, {
        x: 0,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
      });
    });
  }

  initHeroAmbientPointer();

  function initMagneticButtons() {
    if (prefersReducedMotion || !hasFinePointer) return;

    var buttons = document.querySelectorAll(".btn");
    buttons.forEach(function (button) {
      button.addEventListener("pointermove", function (event) {
        var rect = button.getBoundingClientRect();
        var x = event.clientX - rect.left - rect.width / 2;
        var y = event.clientY - rect.top - rect.height / 2;
        var maxX = Math.max(-8, Math.min(8, x * 0.16));
        var maxY = Math.max(-6, Math.min(6, y * 0.2));

        button.style.setProperty("--btn-x", maxX.toFixed(2) + "px");
        button.style.setProperty("--btn-y", maxY.toFixed(2) + "px");
      });

      button.addEventListener("pointerleave", function () {
        button.style.setProperty("--btn-x", "0px");
        button.style.setProperty("--btn-y", "0px");
      });
    });
  }

  initMagneticButtons();

  /* ─── Text splitter utility ─── */
  function splitTextIntoWords(element) {
    var text = element.textContent.trim();
    if (!text) return [];
    element.innerHTML = "";
    var words = text.split(/\s+/);
    var spans = [];
    words.forEach(function (word, i) {
      var wrapper = document.createElement("span");
      wrapper.className = "split-line";

      var inner = document.createElement("span");
      inner.className = "split-word";
      inner.textContent = word;

      wrapper.appendChild(inner);
      element.appendChild(wrapper);

      if (i < words.length - 1) {
        element.appendChild(document.createTextNode(" "));
      }
      spans.push(inner);
    });
    return spans;
  }

  /* Split characters for more dramatic reveals */
  function splitTextIntoChars(element) {
    var text = element.textContent.trim();
    if (!text) return [];
    element.innerHTML = "";
    var chars = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (ch === " ") {
        element.appendChild(document.createTextNode(" "));
        continue;
      }
      var wrapper = document.createElement("span");
      wrapper.className = "split-line";

      var inner = document.createElement("span");
      inner.className = "split-char";
      inner.textContent = ch;

      wrapper.appendChild(inner);
      element.appendChild(wrapper);
      chars.push(inner);
    }
    return chars;
  }

  /* ─── Hero entrance animation (cinematic) ─── */
  function heroEntrance() {
    if (prefersReducedMotion) return;

    var titleTop = document.querySelector(".hero__title-top");
    var titleBottom = document.querySelector(".hero__title-bottom");
    if (!titleTop || !titleBottom) return;

    var topWords = splitTextIntoWords(titleTop);
    var bottomWords = splitTextIntoWords(titleBottom);
    var allWords = topWords.concat(bottomWords);
    var proofItems = document.querySelectorAll(".hero__proof-item");
    var storyCard = document.querySelector(".hero__card--story");
    var storyItems = Array.prototype.slice.call(
      document.querySelectorAll(".hero__story-item")
    );
    var storyMetrics = Array.prototype.slice.call(
      document.querySelectorAll(".hero__story-metric")
    );

    /* Safety net: if animation doesn't complete within 3s, force everything visible.
       Covers bfcache, CDN lag, and any GSAP timing edge cases. */
    var safetyTimer = setTimeout(function () {
      gsap.set(allWords, { y: 0, rotateX: 0, clearProps: "all" });
      gsap.set(
        [".hero__eyebrow", ".hero__subtitle", ".hero__actions", ".hero__scroll-hint"],
        { opacity: 1, y: 0, clearProps: "all" }
      );
      gsap.set(proofItems, { opacity: 1, y: 0, scale: 1, clearProps: "all" });
      if (storyCard) gsap.set(storyCard, { opacity: 1, y: 0, x: 0, clearProps: "all" });
      gsap.set(storyItems.concat(storyMetrics), { opacity: 1, y: 0, clearProps: "all" });
    }, 3000);

    /* Hide everything initially */
    gsap.set(
      [
        ".hero__eyebrow",
        ".hero__subtitle",
        ".hero__actions",
        ".hero__scroll-hint",
      ],
      { opacity: 0, y: 28 }
    );
    gsap.set(proofItems, { opacity: 0, y: 20, scale: 0.97 });
    gsap.set(storyCard, { opacity: 0, y: 34, x: 26 });
    gsap.set(storyItems.concat(storyMetrics), { opacity: 0, y: 20 });

    var tl = gsap.timeline({
      defaults: { ease: "power4.out" },
      delay: 0.12,
      onComplete: function () { clearTimeout(safetyTimer); },
    });

    tl.to(".hero__eyebrow", {
      opacity: 1,
      y: 0,
      duration: 0.45,
      ease: "power2.out",
    })
      /* Title: staggered word reveal with slight rotation */
      .from(topWords, {
        y: "118%",
        rotateX: 28,
        duration: 0.95,
        stagger: 0.045,
      }, 0.02)
      .from(
        bottomWords,
        {
          y: "118%",
          rotateX: 28,
          duration: 0.95,
          stagger: 0.045,
        },
        0.14
      )
      .to(
        storyCard,
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.85,
          ease: "power3.out",
        },
        0.18
      )
      /* Subtitle line fades up */
      .to(
        ".hero__subtitle",
        { opacity: 1, y: 0, duration: 0.65, ease: "power2.out" },
        0.34
      )
      .to(
        proofItems,
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.42,
          stagger: 0.06,
          ease: "power2.out",
        },
        0.42
      )
      /* Buttons */
      .to(
        ".hero__actions",
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" },
        0.52
      )
      .to(
        storyItems,
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.08,
          ease: "power2.out",
        },
        0.56
      )
      .to(
        storyMetrics,
        {
          opacity: 1,
          y: 0,
          duration: 0.42,
          stagger: 0.08,
          ease: "power2.out",
        },
        0.84
      )
      /* Scroll hint */
      .to(
        ".hero__scroll-hint",
        { opacity: 1, y: 0, duration: 0.4 },
        0.88
      );
  }

  heroEntrance();

  /* ─── Hero parallax on scroll (title drifts up, fades) ─── */
  function initHeroParallax() {
    if (prefersReducedMotion || isMobile) return;

    gsap.to(".hero__inner", {
      y: -120,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    gsap.to(".hero__showcase", {
      y: -48,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });

    /* Scroll hint fades out fast */
    gsap.to(".hero__scroll-hint", {
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: ".hero",
        start: "70% bottom",
        end: "bottom top",
        scrub: true,
      },
    });
  }

  initHeroParallax();

  /* ─── Horizontal scroll ─── */
  var hScrollTween = null;
  var hScrollTriggerInstance = null;

  function getHorizontalScrollDistance(track) {
    return Math.max(track.scrollWidth - window.innerWidth, 0);
  }

  function initHorizontalScroll() {
    if (isMobile || prefersReducedMotion) return null;

    var section = document.querySelector(".hscroll");
    var track = document.querySelector(".hscroll__track");
    var panels = document.querySelectorAll(".hscroll__panel");
    if (!section || !track || panels.length === 0) return null;

    function syncSectionHeight() {
      var distance = getHorizontalScrollDistance(track);
      section.style.height = distance + window.innerHeight + "px";
      return distance;
    }

    syncSectionHeight();

    var tween = gsap.to(track, {
      x: function () {
        return -syncSectionHeight();
      },
      ease: "none",
      scrollTrigger: {
        trigger: section,
        scrub: 1.2,
        start: "top top",
        end: function () {
          return "+=" + syncSectionHeight();
        },
        invalidateOnRefresh: true,
        onRefreshInit: syncSectionHeight,
      },
    });

    hScrollTriggerInstance = tween.scrollTrigger;

    /* Progress bar */
    var progressBar = document.querySelector(".hscroll-progress");
    if (progressBar) {
      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: function () {
          return "+=" + syncSectionHeight();
        },
        onUpdate: function (self) {
          progressBar.style.width = self.progress * 100 + "%";
        },
      });
    }

    return tween;
  }

  hScrollTween = initHorizontalScroll();


  /* ─── Panel heading animations (character-level for --xl, word-level for others) ─── */
  function initPanelHeadings() {
    if (prefersReducedMotion) return;

    document.querySelectorAll(".panel__heading").forEach(function (heading) {
      var isXL = heading.classList.contains("panel__heading--xl");
      var parts = isXL ? splitTextIntoChars(heading) : splitTextIntoWords(heading);
      var panel = heading.closest(".hscroll__panel");

      var triggerConfig;
      if (isMobile || !hScrollTween) {
        triggerConfig = {
          trigger: panel || heading,
          start: "top 80%",
          toggleActions: "play none none none",
        };
      } else {
        triggerConfig = {
          trigger: panel,
          containerAnimation: hScrollTween,
          start: "left 70%",
          toggleActions: "play none none none",
        };
      }

      if (isXL) {
        /* Character reveal for big titles: more dramatic */
        gsap.from(parts, {
          y: "110%",
          opacity: 0,
          rotateX: 50,
          duration: 0.9,
          stagger: 0.02,
          ease: "power4.out",
          scrollTrigger: triggerConfig,
        });
      } else {
        gsap.from(parts, {
          y: "120%",
          rotateX: 40,
          duration: 1.1,
          stagger: 0.06,
          ease: "power4.out",
          scrollTrigger: triggerConfig,
        });
      }
    });
  }

  initPanelHeadings();

  /* ─── Panel body/content fade-in (staggered cascade) ─── */
  function initPanelContent() {
    if (prefersReducedMotion) return;

    document.querySelectorAll(".hscroll__panel").forEach(function (panel) {
      var els = panel.querySelectorAll(
        ".panel__label, .panel__body, .panel-empire__gallery, .panel-empire__stats, .panel-empire__tech, .panel-empire__links, .rit-features, .rit-compare, .rit-cta"
      );
      if (!els.length) return;

      var triggerConfig;
      if (isMobile || !hScrollTween) {
        triggerConfig = {
          trigger: panel,
          start: "top 75%",
          toggleActions: "play none none none",
        };
      } else {
        triggerConfig = {
          trigger: panel,
          containerAnimation: hScrollTween,
          start: "left 60%",
          toggleActions: "play none none none",
        };
      }

      gsap.from(els, {
        y: 50,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: triggerConfig,
      });
    });
  }

  initPanelContent();

  /* ─── Work cards: individual staggered entrance with scale ─── */
  function initWorkCards() {
    if (prefersReducedMotion) return;

    var cards = Array.prototype.slice.call(document.querySelectorAll(".work-card"));
    if (!cards.length) return;

    var panel = cards[0].closest(".hscroll__panel");
    if (!panel) return;

    var icons = [];
    var textBlocks = [];
    var tags = [];
    var listItems = Array.prototype.slice.call(panel.querySelectorAll(".work-card__list li"));

    cards.forEach(function (card) {
      var icon = card.querySelector(".work-card__icon");
      var title = card.querySelector(".work-card__title");
      var desc = card.querySelector(".work-card__desc");
      var tag = card.querySelector(".work-card__tag");

      if (icon) icons.push(icon);
      if (title) textBlocks.push(title);
      if (desc) textBlocks.push(desc);
      if (tag) tags.push(tag);
    });

    gsap.set(cards, {
      transformOrigin: "50% 50%",
      backfaceVisibility: "hidden",
      force3D: true,
    });
    gsap.set(icons.concat(textBlocks, tags), {
      backfaceVisibility: "hidden",
      force3D: true,
    });

    var triggerConfig = isMobile || !hScrollTween
      ? {
          trigger: panel,
          start: "top 82%",
          end: "top 38%",
          scrub: 0.85,
          invalidateOnRefresh: true,
        }
      : {
          trigger: panel,
          containerAnimation: hScrollTween,
          start: "left 92%",
          end: "left 38%",
          scrub: 0.85,
          invalidateOnRefresh: true,
        };

    var tl = gsap.timeline({
      defaults: {
        ease: "power2.out",
        duration: 1,
      },
      scrollTrigger: triggerConfig,
    });

    tl.fromTo(
      cards,
      {
        autoAlpha: 0,
        y: 36,
        xPercent: 6,
        scale: 0.985,
      },
      {
        autoAlpha: 1,
        y: 0,
        xPercent: 0,
        scale: 1,
        stagger: 0.16,
      },
      0
    ).fromTo(
      icons,
      {
        autoAlpha: 0,
        y: 14,
        scale: 0.92,
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.72,
        stagger: 0.12,
      },
      0.08
    ).fromTo(
      textBlocks,
      {
        autoAlpha: 0,
        y: 16,
      },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.72,
        stagger: 0.04,
      },
      0.16
    ).fromTo(
      tags,
      {
        autoAlpha: 0,
        y: 10,
        scale: 0.96,
      },
      {
        autoAlpha: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.12,
      },
      0.3
    ).fromTo(
      listItems,
      { autoAlpha: 0, x: -10 },
      {
        autoAlpha: 1,
        x: 0,
        duration: 0.5,
        stagger: 0.04,
        ease: "power2.out",
      },
      0.4
    );
  }

  initWorkCards();

  /* ─── About video: cinematic clip-path wipe + parallax + autoplay ─── */
  function initAboutVideo() {
    var videoWrap = document.querySelector(".about-video-wrap");
    var video = document.querySelector(".about-video");
    if (!videoWrap || !video) return;

    /* Defer video loading on mobile until needed */
    if (isMobile) {
      video.setAttribute("preload", "none");
    }

    /* Scroll-triggered play/pause: play when visible, pause when not */
    var playTriggerConfig;
    if (isMobile || !hScrollTween) {
      playTriggerConfig = {
        trigger: videoWrap,
        start: "top 90%",
        end: "bottom 10%",
        onEnter: function () { video.play(); },
        onLeave: function () { video.pause(); },
        onEnterBack: function () { video.play(); },
        onLeaveBack: function () { video.pause(); },
      };
    } else {
      playTriggerConfig = {
        trigger: ".panel-about",
        containerAnimation: hScrollTween,
        start: "left 90%",
        end: "right 10%",
        onEnter: function () { video.play(); },
        onLeave: function () { video.pause(); },
        onEnterBack: function () { video.play(); },
        onLeaveBack: function () { video.pause(); },
      };
    }
    ScrollTrigger.create(playTriggerConfig);

    if (prefersReducedMotion) return;

    /* Cinematic clip-path reveal + parallax */
    gsap.set(video, { scale: 1.2, yPercent: 0 });
    gsap.set(videoWrap, {
      clipPath: "inset(10% 100% 10% 0)",
      autoAlpha: 0.35,
      xPercent: 8,
    });

    var revealTriggerConfig;
    var parallaxTriggerConfig;
    if (isMobile || !hScrollTween) {
      revealTriggerConfig = {
        trigger: videoWrap,
        start: "top 78%",
        toggleActions: "play reverse play reverse",
      };
      parallaxTriggerConfig = {
        trigger: videoWrap,
        start: "top 82%",
        end: "bottom 20%",
        scrub: 1,
      };
    } else {
      revealTriggerConfig = {
        trigger: ".panel-about",
        containerAnimation: hScrollTween,
        start: "left 62%",
        toggleActions: "play reverse play reverse",
      };
      parallaxTriggerConfig = {
        trigger: ".panel-about",
        containerAnimation: hScrollTween,
        start: "left 82%",
        end: "right left",
        scrub: 1,
      };
    }

    gsap.timeline({
      defaults: { duration: 1, ease: "power3.out" },
      scrollTrigger: revealTriggerConfig,
    }).to(videoWrap, {
      clipPath: "inset(0% 0% 0% 0%)",
      autoAlpha: 1,
      xPercent: 0,
    });

    /* Parallax zoom-out */
    gsap.to(video, {
      scale: 1.02,
      y: "-10%",
      ease: "none",
      scrollTrigger: parallaxTriggerConfig,
    });
  }

  initAboutVideo();

  /* ─── Empire background: subtle zoom only (no horizontal translate) ───
     Horizontal x-parallax on a full-bleed object-fit image shifts the bitmap
     inside overflow:hidden and exposes empty panel at one edge — a visible
     strip when scrolling between Empire and Methlang. Scale-only keeps
     full coverage. */
  function initEmpireParallax() {
    if (prefersReducedMotion || isMobile || !hScrollTween) return;

    var bgImg = document.querySelector(".panel-empire__bg-img");
    if (!bgImg) return;

    gsap.fromTo(
      bgImg,
      { scale: 1.1 },
      {
        scale: 1.02,
        ease: "none",
        scrollTrigger: {
          trigger: ".panel-empire",
          containerAnimation: hScrollTween,
          start: "left right",
          end: "right left",
          scrub: true,
        },
      }
    );
  }

  initEmpireParallax();

  /* ─── Empire stats: counter animation ─── */
  function initStatCounters() {
    if (prefersReducedMotion) return;

    var statNums = document.querySelectorAll(".panel-empire__stat-num");
    statNums.forEach(function (el) {
      var finalText = el.textContent.trim();
      var numMatch = finalText.match(/[\d.]+/);
      if (!numMatch) return;

      var num = parseFloat(numMatch[0]);
      var prefix = finalText.substring(0, finalText.indexOf(numMatch[0]));
      var suffix = finalText.substring(
        finalText.indexOf(numMatch[0]) + numMatch[0].length
      );
      var isFloat = numMatch[0].includes(".");
      var panel = el.closest(".hscroll__panel");

      var obj = { val: 0 };

      var triggerConfig;
      if (isMobile || !hScrollTween) {
        triggerConfig = {
          trigger: panel || el,
          start: "top 75%",
          toggleActions: "play none none none",
        };
      } else {
        triggerConfig = {
          trigger: panel,
          containerAnimation: hScrollTween,
          start: "left 50%",
          toggleActions: "play none none none",
        };
      }

      gsap.to(obj, {
        val: num,
        duration: 2,
        ease: "power2.out",
        scrollTrigger: triggerConfig,
        onUpdate: function () {
          var display = isFloat ? obj.val.toFixed(1) : Math.round(obj.val);
          el.textContent = prefix + display + suffix;
        },
      });
    });
  }

  initStatCounters();

  /* ─── Parallax on panel labels ─── */
  function initLabelParallax() {
    if (prefersReducedMotion || isMobile || !hScrollTween) return;

    document.querySelectorAll(".panel__label").forEach(function (label) {
      var panel = label.closest(".hscroll__panel");
      if (!panel) return;

      gsap.fromTo(
        label,
        { x: 50 },
        {
          x: -50,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: hScrollTween,
            start: "left right",
            end: "right left",
            scrub: true,
          },
        }
      );
    });
  }

  initLabelParallax();

  /* ─── Panel border glow: panels get a subtle glow line on their left as they enter ─── */
  function initPanelGlow() {
    if (prefersReducedMotion || isMobile || !hScrollTween) return;

    document.querySelectorAll(".hscroll__panel").forEach(function (panel) {
      var glow = panel.querySelector(".panel__glow");
      if (!glow) return;

      gsap.fromTo(
        glow,
        { scaleY: 0, opacity: 0 },
        {
          scaleY: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: panel,
            containerAnimation: hScrollTween,
            start: "left 80%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  }

  initPanelGlow();

  /* ─── Contact section reveal ─── */
  function initContactReveal() {
    if (prefersReducedMotion) return;

    var contactHeading = document.querySelector("#contact-title");
    if (contactHeading) {
      var label = contactHeading.querySelector(".section__heading-label");

      if (label) {
        gsap.from(label, {
          opacity: 0,
          y: 20,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#contact",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      }

      /* Find and split the bare text nodes */
      var textNodes = [];
      contactHeading.childNodes.forEach(function (node) {
        if (node.nodeType === 3 && node.textContent.trim()) {
          textNodes.push(node);
        }
      });

      textNodes.forEach(function (node) {
        var span = document.createElement("span");
        span.className = "contact-heading-text";
        span.textContent = node.textContent;
        node.parentNode.replaceChild(span, node);
        var words = splitTextIntoWords(span);

        gsap.from(words, {
          y: "120%",
          rotateX: 40,
          duration: 1.1,
          stagger: 0.06,
          ease: "power4.out",
          scrollTrigger: {
            trigger: "#contact",
            start: "top 80%",
            toggleActions: "play none none none",
          },
        });
      });
    }

    gsap.from(".contact__card", {
      y: 80,
      opacity: 0,
      scale: 0.96,
      duration: 1.2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".contact__card",
        start: "top 85%",
        toggleActions: "play none none none",
      },
    });
  }

  initContactReveal();


  /* ─── Active nav highlighting ─── */
  function initNavHighlight() {
    var navLinks = document.querySelectorAll(".site-nav a");

    function setActive(id) {
      navLinks.forEach(function (link) {
        var href = link.getAttribute("href");
        if (href === "#" + id) {
          link.classList.add("is-active");
        } else {
          link.classList.remove("is-active");
        }
      });
    }

    /* Hero */
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "bottom top",
      onEnter: function () { setActive("hero"); },
      onEnterBack: function () { setActive("hero"); },
    });

    /* Horizontal panels */
    if (hScrollTween && !isMobile) {
      var panelIds = ["work", "projects", "rit", "methlang", "about"];
      document.querySelectorAll(".hscroll__panel").forEach(function (panel, i) {
        var id = panel.id || panelIds[i] || "";
        if (!id) return;

        ScrollTrigger.create({
          trigger: panel,
          containerAnimation: hScrollTween,
          start: "left 60%",
          end: "right 40%",
          onEnter: function () { setActive(id); },
          onEnterBack: function () { setActive(id); },
        });
      });
    }

    /* Contact */
    ScrollTrigger.create({
      trigger: "#contact",
      start: "top 60%",
      onEnter: function () { setActive("contact"); },
      onEnterBack: function () { setActive("contact"); },
    });
  }

  initNavHighlight();

  /* ─── Header scroll state ─── */
  var header = document.getElementById("site-header");
  function updateHeader() {
    if (!header) return;
    header.classList.toggle("site-header--scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", updateHeader, { passive: true });
  updateHeader();

  /* ─── Year ─── */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─── Copy Discord ─── */
  var copyBtn = document.getElementById("copy-discord");
  var copyToast = document.getElementById("copy-toast");
  var copyToastTimer;
  if (copyBtn && copyToast) {
    var discordUser = "@marqsailer";
    copyBtn.addEventListener("click", function () {
      function show(msg) {
        copyToast.textContent = msg;
        copyToast.hidden = false;
        window.clearTimeout(copyToastTimer);
        copyToastTimer = window.setTimeout(function () {
          copyToast.textContent = "";
          copyToast.hidden = true;
        }, 2600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(discordUser).then(
          function () {
            show("Copied \u2014 paste it in Discord.");
          },
          function () {
            show("Couldn't copy \u2014 select @marqsailer above.");
          }
        );
      } else {
        show("Select @marqsailer and copy (\u2318C / Ctrl+C).");
      }
    });
  }

  /* ═══════════════════════════════════════════
     NAV ANCHOR SCROLLING (fixed)
     ═══════════════════════════════════════════ */
  function getHeaderOffset() {
    if (!header) return -80;
    return -(header.getBoundingClientRect().height + 14);
  }

  function scrollToElementWithOffset(el) {
    if (!el) return;
    var top =
      el.getBoundingClientRect().top + window.pageYOffset + getHeaderOffset();
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var href = anchor.getAttribute("href");
      if (!href || href === "#") return;

      var targetId = href.substring(1);
      var target = document.getElementById(targetId);
      if (!target) return;
      e.preventDefault();

      /* Is the target inside (or is) a horizontal panel? */
      var panel = target.classList.contains("hscroll__panel")
        ? target
        : target.closest(".hscroll__panel");

      if (panel && hScrollTriggerInstance && !isMobile) {
        /* Calculate this panel's left offset within the track */
        var track = document.querySelector(".hscroll__track");
        var panelLeft = panel.offsetLeft;
        var totalTrackScroll = getHorizontalScrollDistance(track);

        /* Map the panel's horizontal position to vertical scroll position */
        var progress = totalTrackScroll
          ? Math.min(panelLeft / totalTrackScroll, 1)
          : 0;
        var scrollTarget =
          hScrollTriggerInstance.start +
          progress * totalTrackScroll;

        if (lenis) {
          lenis.scrollTo(scrollTarget, { duration: 2, easing: function(t) { return 1 - Math.pow(1 - t, 4); } });
        } else {
          window.scrollTo({ top: scrollTarget, behavior: "smooth" });
        }
      } else {
        /* Normal vertical target (hero, contact) */
        if (lenis) {
          lenis.scrollTo(target, {
            offset: getHeaderOffset(),
            duration: 2,
            easing: function (t) {
              return 1 - Math.pow(1 - t, 4);
            },
          });
        } else {
          scrollToElementWithOffset(target);
        }
      }
    });
  });

  /* ─── bfcache: force split-word elements visible on back/forward nav ─── */
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) {
      document.querySelectorAll(".split-word, .split-char").forEach(function (el) {
        el.style.transform = "none";
        el.style.opacity = "1";
      });
    }
  });

  /* ─── Resize handler ─── */
  var resizeTimer;
  var currentIsMobile = isMobile;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var nowMobile = window.innerWidth <= 768;
      if (nowMobile !== currentIsMobile) {
        location.reload();
      }
    }, 250);
  });
})();
