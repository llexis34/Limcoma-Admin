const typingSpeed = 50;
const particleCount = 70;

/* ===========================
   02) HELPERS
   =========================== */
const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const smoothstep = (t) => t * t * (3 - 2 * t);

/* ===========================
   03) TYPEWRITER
   =========================== */
function typeWriter(text, el, speed){
  if(!el) return;
  let i = 0;
  el.textContent = "";
  el.style.whiteSpace = "pre-line";
  (function tick(){
    if(i < text.length){
      el.textContent += text.charAt(i++);
      setTimeout(tick, speed);
    }
  })();
}

/* ===========================
   04) PARTICLES
   =========================== */
const canvas = $("#particle-canvas");
const ctx = canvas?.getContext("2d");
let particles = [];

function resizeCanvas(){
  if(!canvas) return;
  canvas.width = innerWidth;
  canvas.height = innerHeight;
}
addEventListener("resize", resizeCanvas);

class Particle{
  constructor(){
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.size = Math.random() * 1.5 + 0.5;
    this.vx = Math.random() * 0.3 - 0.15;
    this.vy = Math.random() * 0.3 - 0.15;
    this.a  = Math.random() * 0.4;
  }
  update(){
    this.x += this.vx; this.y += this.vy;
    if(this.x > canvas.width) this.x = 0;
    else if(this.x < 0) this.x = canvas.width;
    if(this.y > canvas.height) this.y = 0;
    else if(this.y < 0) this.y = canvas.height;
  }
  draw(){
    ctx.fillStyle = `rgba(255,255,255,${this.a})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initParticles(){
  if(!canvas || !ctx) return;
  particles = Array.from({length: particleCount}, () => new Particle());
}

function animateParticles(){
  if(!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for(const p of particles){ p.update(); p.draw(); }
  requestAnimationFrame(animateParticles);
}

/* ===========================
   05) REVEALS (Replay on re-enter)
   =========================== */
function makeReplayObserver(selector, options={}, onEnter){
  const targets = $$(selector);
  if(!targets.length) return;

  const {
    threshold = 0.18,
    rootMargin = "0px 0px -10% 0px"
  } = options;

  const obs = new IntersectionObserver((entries) => {
    for(const entry of entries){
      if(entry.isIntersecting){
        entry.target.classList.remove("in-view");
        requestAnimationFrame(() => {
          entry.target.classList.add("in-view");
          onEnter?.(entry.target);
        });
      } else {
        entry.target.classList.remove("in-view");
      }
    }
  }, { threshold, rootMargin });

  targets.forEach(t => obs.observe(t));
}

/* stagger helpers */
function staggerChildren(root, selector, base=120, step=110){
  const kids = $$(selector, root);
  kids.forEach((el, i) => el.style.transitionDelay = `${base + i*step}ms`);
}
const applyAboutStagger = () => {
  const about = $(".about-content");
  if(about) staggerChildren(about, ".about-anim");
};
const applySectionChildStagger = (section) => staggerChildren(section, ".reveal-child");

/* ===========================
   06) ABOUT IMAGE SCROLL MOTION
   =========================== */
function setupAboutImageMotion(){
  const prefersReduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const aboutSection = $("#about");
  const aboutImg = $(".about-image");
  if(!aboutSection || !aboutImg) return;

  const parent = aboutImg.parentElement;
  if(parent?.classList.contains("about-image-frame")) parent.classList.remove("about-image-frame");

  let ticking = false;

  const update = () => {
    ticking = false;
    if(prefersReduced) return;

    const rect = aboutSection.getBoundingClientRect();
    const vh = innerHeight || document.documentElement.clientHeight;

    const startPoint = vh * 0.95;
    const endPoint   = vh * 0.55;

    const raw = (startPoint - rect.top) / (startPoint - endPoint);
    const ease = smoothstep(clamp(raw, 0, 1));

    const from = { x:240, y:140, r:10, o:0 };
    const to   = { x:0,   y:0,   r:0,  o:1 };

    aboutImg.style.setProperty("--about-enter-x", `${(from.x + (to.x-from.x)*ease).toFixed(2)}px`);
    aboutImg.style.setProperty("--about-enter-y", `${(from.y + (to.y-from.y)*ease).toFixed(2)}px`);
    aboutImg.style.setProperty("--about-enter-rot", `${(from.r + (to.r-from.r)*ease).toFixed(2)}deg`);
    aboutImg.style.setProperty("--about-enter-opacity", `${(from.o + (to.o-from.o)*ease).toFixed(3)}`);

    const imgRect = aboutImg.getBoundingClientRect();
    const delta = ((imgRect.top + imgRect.height/2) - vh/2) / (vh/2);
    const max = 14;
    aboutImg.style.setProperty("--about-parallax", `${clamp(-delta * max, -max, max)}px`);
  };

  const onScroll = () => {
    if(!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  update();
  addEventListener("scroll", onScroll, {passive:true});
  addEventListener("resize", update);
}

/* ===========================
   07) HERO BUTTON RIPPLE
   =========================== */
function setupHeroButton(){
  const btn = $(".btn-primary-custom");
  if(!btn) return;

  btn.addEventListener("click", function(e){
    const rect = this.getBoundingClientRect();
    const ripple = document.createElement("span");
    const size = Math.max(rect.width, rect.height);

    ripple.style.width = ripple.style.height = size + "px";
    ripple.style.left = (e.clientX - rect.left - size/2) + "px";
    ripple.style.top  = (e.clientY - rect.top  - size/2) + "px";
    ripple.className = "ripple-effect";

    this.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });

  btn.addEventListener("mouseenter", () => btn.style.transform = "scale(1.07)");
  btn.addEventListener("mouseleave", () => btn.style.transform = "");
}

/* ===========================
   08) PRODUCTS SLIDER
   =========================== */
function setupProductSlider(){
  const track = $(".product-track");
  const slides = $$(".product-slide");
  const btnLeft  = $(".product-arrow.left");
  const btnRight = $(".product-arrow.right");
  if(!track || !slides.length || !btnLeft || !btnRight) return;

  const perView = () => (innerWidth <= 768 ? 1 : innerWidth <= 992 ? 2 : 3);
  let index = 0;

  const maxIndex = () => Math.max(0, Math.ceil(slides.length / perView()) - 1);
  const apply = () => {
    const viewport = track.closest(".products-viewport");
    const shift = viewport
      ? getComputedStyle(viewport).getPropertyValue("--cards-shift").trim()
      : "0px";

    track.style.transform = `translateX(calc(-${index * 100}% + ${shift || "0px"}))`;
  };

  const wrapClamp = () => {
    const m = maxIndex();
    if(index < 0) index = m;
    else if(index > m) index = 0;
  };

  btnRight.addEventListener("click", () => { index++; wrapClamp(); apply(); });
  btnLeft.addEventListener("click",  () => { index--; wrapClamp(); apply(); });

  addEventListener("resize", () => {
    const m = maxIndex();
    if(index > m) index = m;
    apply();
  });

  apply();
}

/* ===========================
   09) LOANS SHOWCASE (Filter ONLY)
   =========================== */
function setupLoansShowcase(){
  const filters = $$(".loan-filter");
  const cards = $$(".loan-card");
  if(!filters.length || !cards.length) return;

  const setActive = (btn) => {
    filters.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
  };

  const applyFilter = (key) => {
    cards.forEach(card => {
      const cat = card.getAttribute("data-cat");
      card.classList.toggle("is-hidden", !(key === "all" || cat === key));
    });
  };

  filters.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const key = btn.getAttribute("data-filter") || "all";
      setActive(btn);
      applyFilter(key);
    });
  });

  cards.forEach(card => {
    card.style.cursor = "default";
    card.setAttribute("aria-disabled", "true");
    card.setAttribute("tabindex", "-1");
  });

  applyFilter("all");
}

/* ===========================
   10) PRODUCTS MODAL
   =========================== */
function setupProductModal(){
  const modal = $("#productModal");
  if(!modal) return;

  const pmImage = $("#pmImage");
  const pmTitle = $("#pmTitle");
  const pmDesc  = $("#pmDesc");
  const pmBestFor = $("#pmBestFor");
  const pmHighlights = $("#pmHighlights");

  let lastFocus = null;

  const productExtras = (name) => {
    const map = {
      "Cattle Feeds": {
        bestFor: "Calves to mature cattle",
        highlights: "Growth support • Balanced nutrients • Farm-ready formulation"
      },
      "Premium Broiler Feeds": {
        bestFor: "Broilers and layers",
        highlights: "Balanced protein • Health support • Optimized daily intake"
      },
      "Fish Floater Feeds": {
        bestFor: "Tilapia and milkfish",
        highlights: "Floating formula • Better feeding control • Yield-focused"
      },
      "Hog Feeds": {
        bestFor: "Piglets to finishing hogs",
        highlights: "Digestive support • Strong growth • Consistent energy"
      },
      "Titanium at Balisong Feeds": {
        bestFor: "Laying hens",
        highlights: "Egg production support • Shell quality • Hen wellness"
      },
      "Duck Feeds": {
        bestFor: "Growing ducks",
        highlights: "High-protein starter • Strong early development • Clean mix"
      }
    };
    return map[name] || { bestFor: "Livestock / poultry", highlights: "Quality feed • Balanced nutrition • Farm-tested" };
  };

  const openModal = ({title, desc, imgSrc, imgAlt}) => {
    lastFocus = document.activeElement;

    const extras = productExtras(title);

    if(pmImage){
      pmImage.src = imgSrc || "";
      pmImage.alt = imgAlt || title || "Product image";
    }
    if(pmTitle) pmTitle.textContent = title || "Product";
    if(pmDesc)  pmDesc.textContent  = desc || "Product details preview.";
    if(pmBestFor) pmBestFor.textContent = extras.bestFor;
    if(pmHighlights) pmHighlights.textContent = extras.highlights;

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("pm-lock");

    const closeBtn = modal.querySelector("[data-pm-close='true']");
    closeBtn?.focus({preventScroll:true});
  };

  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("pm-lock");
    if(lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  };

  modal.addEventListener("click", (e) => {
    const target = e.target;
    const close = target?.closest?.("[data-pm-close='true']");
    if(close) closeModal();
  });

  addEventListener("keydown", (e) => {
    if(e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  const productsSection = $(".products-section");
  if(!productsSection) return;

  productsSection.addEventListener("click", (e) => {
    const link = e.target?.closest?.("a.view-product");
    if(!link) return;

    e.preventDefault();

    const card = link.closest(".product-card");
    if(!card) return;

    const title = card.querySelector("h5")?.textContent?.trim() || "Product";
    const desc  = card.querySelector("p")?.textContent?.trim() || "";
    const img   = card.querySelector("img.product-img");
    const imgSrc = img?.getAttribute("src") || "";
    const imgAlt = img?.getAttribute("alt") || title;

    openModal({ title, desc, imgSrc, imgAlt });
  });
}

/* ===========================
   11) FOOTER BRANCHES CAROUSEL
   =========================== */
function setupFooterBranchesCarousel(){
  const carousels = $$(".footer-branches-carousel");
  if(!carousels.length) return;

  carousels.forEach((carousel) => {
    const items = $$(".branch-chip", carousel);
    if(!items.length) return;

    let current = 0;

    const showItem = (index) => {
      items.forEach((item, i) => {
        item.classList.toggle("is-active", i === index);
      });
    };

    showItem(current);

    setInterval(() => {
      current = (current + 1) % items.length;
      showItem(current);
    }, 2200);
  });
}

/* ===========================
   11) DOM READY
   =========================== */
addEventListener("DOMContentLoaded", () => {
  if(!$(".bg-zoom-container")){
    const bg = document.createElement("div");
    bg.className = "bg-zoom-container";
    document.body.prepend(bg);
  }

  if(canvas && ctx){
    resizeCanvas();
    initParticles();
    animateParticles();
  }

  const hero = $(".hero-container");
  if(hero) setTimeout(() => hero.classList.add("enter"), 120);
  typeWriter("LIMCOMA MULTI-PURPOSE COOPERATIVE", $("#typing-effect"), typingSpeed);

  makeReplayObserver(".reveal-on-scroll",
    { threshold:0.18, rootMargin:"0px 0px -10% 0px" },
    (el) => { if(el.classList.contains("about-content")) applyAboutStagger(); }
  );

  makeReplayObserver(".section-reveal",
    { threshold:0.16, rootMargin:"0px 0px -12% 0px" },
    applySectionChildStagger
  );

  applyAboutStagger();
  setupAboutImageMotion();
  setupHeroButton();
  setupProductSlider();
  setupLoansShowcase();
  setupProductModal();
  setupFooterBranchesCarousel();
});