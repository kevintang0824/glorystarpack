(function () {
  "use strict";

  const legacyProductRoutes = {
    hot: "/products/",
    glass: "/products/glass-packaging/",
    "glass-oil": "/products/serum-dropper-bottles/",
    "glass-dropper": "/products/serum-dropper-bottles/",
    "glass-rollon": "/products/glass-cosmetic-bottles/",
    "glass-spray": "/products/glass-cosmetic-bottles/",
    "glass-ampoule": "/products/cosmetic-sample-packaging/",
    "glass-jar": "/products/cream-jars/",
    "glass-lotion": "/products/glass-cosmetic-bottles/",
    "glass-perfume": "/products/perfume-bottles/",
    "glass-diffuser": "/products/home-fragrance-packaging/",
    "glass-violet": "/products/glass-cosmetic-bottles/",
    "glass-nail": "/products/nail-polish-bottles/",
    beverage: "/products/beverage-bottles/",
    "wine-bottle": "/products/wine-bottles/",
    "spirit-bottle": "/products/liquor-bottles/",
    "beverage-closure": "/products/beverage-bottles/",
    plastic: "/products/plastic-packaging/",
    "plastic-airless": "/products/airless-pump-bottles/",
    "plastic-airless-jar": "/products/airless-bottles/",
    "plastic-dual": "/products/airless-bottles/",
    "plastic-jar": "/products/cosmetic-jars/",
    "plastic-tube": "/products/cosmetic-tubes/",
    "plastic-makeup": "/products/makeup-packaging/",
    "plastic-closure": "/products/cosmetic-pumps-closures/",
    "packaging-accessories": "/products/cosmetic-packaging-accessories/",
    "home-fragrance": "/products/home-fragrance-packaging/",
    "hotel-amenity": "/products/hotel-amenity-packaging/",
    "men-grooming": "/products/mens-grooming-packaging/",
    "personal-care": "/products/personal-care-packaging/",
    bamboo: "/products/bamboo-packaging/",
    alu: "/products/aluminum-packaging/",
    "alu-can": "/products/aluminum-cosmetic-cans/",
    "alu-bag": "/products/refill-pouch-packaging/",
    eco: "/products/eco-friendly-packaging/",
    "eco-refill": "/products/refill-packaging/",
    "paper-box": "/products/cosmetic-packaging-kits/"
  };

  function migrateLegacyHash() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw || raw === "home") return;
    const parts = raw.split("/");
    let target = "";
    if (parts[0] === "products") {
      target = legacyProductRoutes[parts[1] || "hot"] || "/products/";
    } else if (parts[0] === "detail") {
      target = "/products/";
    } else if (parts[0] === "about") {
      const section = {
        production: "#production",
        cert: "#quality",
        profile: "#profile"
      }[parts[1]] || "";
      target = `/about/${section}`;
    } else if (parts[0] === "contact") {
      target = "/contact/";
    } else if (parts[0] === "oem") {
      target = "/oem-cosmetic-packaging/";
    } else if (parts[0] === "news" || parts[0] === "newsdetail") {
      target = "/cosmetic-packaging-guides/";
    }
    if (target) window.location.replace(target);
  }

  migrateLegacyHash();

  const nav = document.getElementById("siteNav");
  const menuButton = document.getElementById("menuToggle");

  function closeDropdowns(except) {
    document.querySelectorAll(".nav-item.open").forEach(function (item) {
      if (item === except) return;
      item.classList.remove("open");
      const trigger = item.querySelector(".nav-link[aria-expanded]");
      if (trigger) trigger.setAttribute("aria-expanded", "false");
    });
  }

  window.toggleMobileNav = function () {
    if (!nav || !menuButton) return;
    nav.classList.toggle("mobile-open");
    menuButton.setAttribute("aria-expanded", nav.classList.contains("mobile-open") ? "true" : "false");
    closeDropdowns();
  };

  document.addEventListener("click", function (event) {
    const trigger = event.target.closest(".nav-item > .nav-link[aria-expanded]");
    if (trigger) {
      event.preventDefault();
      const item = trigger.closest(".nav-item");
      const willOpen = !item.classList.contains("open");
      closeDropdowns(item);
      item.classList.toggle("open", willOpen);
      trigger.setAttribute("aria-expanded", willOpen ? "true" : "false");
      return;
    }
    if (!event.target.closest(".nav-item")) closeDropdowns();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    closeDropdowns();
    if (nav) nav.classList.remove("mobile-open");
    if (menuButton) menuButton.setAttribute("aria-expanded", "false");
  });

  let carouselIndex = 0;
  const slides = Array.from(document.querySelectorAll(".cs-slide"));
  const dots = Array.from(document.querySelectorAll(".cs-dot"));
  const track = document.getElementById("carouselTrack");
  const progress = document.getElementById("csProgress");
  const duration = 5000;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const smallScreen = window.matchMedia("(max-width: 760px)").matches;
  let timer = null;

  function ensureSlideImage(index, userInitiated) {
    if ((smallScreen && !userInitiated) || !slides.length) return;
    const normalized = (index + slides.length) % slides.length;
    const background = slides[normalized].querySelector(".cs-bg");
    if (background) background.classList.add("is-loaded");
  }

  function activateSlide(index, userInitiated) {
    carouselIndex = (index + slides.length) % slides.length;
    ensureSlideImage(carouselIndex, userInitiated);
    if (track) track.style.transform = `translateX(-${carouselIndex * 100}%)`;
    dots.forEach(function (dot, dotIndex) {
      const active = dotIndex === carouselIndex;
      dot.classList.toggle("active", active);
      dot.setAttribute("aria-current", active ? "true" : "false");
    });
    if (progress) {
      progress.style.transition = "none";
      progress.style.transform = "scaleX(0)";
      if (!reducedMotion && !smallScreen) {
        requestAnimationFrame(function () {
          progress.style.transition = `transform ${duration}ms linear`;
          progress.style.transform = "scaleX(1)";
        });
      }
    }
  }

  function restartTimer() {
    window.clearInterval(timer);
    if (slides.length < 2 || reducedMotion || smallScreen || document.hidden) return;
    timer = window.setInterval(function () {
      activateSlide(carouselIndex + 1);
    }, duration);
  }

  window.csMove = function (direction) {
    activateSlide(carouselIndex + direction, true);
    restartTimer();
  };

  window.csGo = function (index) {
    activateSlide(index, true);
    restartTimer();
  };

  activateSlide(0, false);
  restartTimer();
  document.addEventListener("visibilitychange", restartTimer);

  const backTop = document.getElementById("backTop");
  let scrollTicking = false;
  window.addEventListener("scroll", function () {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(function () {
      if (backTop) backTop.classList.toggle("show", window.scrollY > 520);
      scrollTicking = false;
    });
  }, { passive: true });

  window.scrollTopSmooth = function () {
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };
})();
