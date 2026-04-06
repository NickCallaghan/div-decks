# Slide Engine

Every deck MUST include this JavaScript at the end of the `<body>`. It handles navigation, scroll-spy, keyboard/touch input, and creates navigation chrome (progress bar, dots, counter, hints).

```javascript
function SlideEngine() {
  this.deck = document.querySelector(".deck");
  this.slides = [].slice.call(document.querySelectorAll(".slide"));
  this.current = 0;
  this.total = this.slides.length;
  this.buildChrome();
  this.bindEvents();
  this.observe();
  this.update();
}

SlideEngine.prototype.buildChrome = function () {
  var bar = document.createElement("div");
  bar.className = "deck-progress";
  document.body.appendChild(bar);
  this.bar = bar;

  var dots = document.createElement("div");
  dots.className = "deck-dots";
  var self = this;
  this.slides.forEach(function (_, i) {
    var d = document.createElement("button");
    d.className = "deck-dot";
    d.title = "Slide " + (i + 1);
    d.onclick = function () {
      self.goTo(i);
    };
    dots.appendChild(d);
  });
  document.body.appendChild(dots);
  this.dots = [].slice.call(dots.children);

  var ctr = document.createElement("div");
  ctr.className = "deck-counter";
  document.body.appendChild(ctr);
  this.counter = ctr;

  var hints = document.createElement("div");
  hints.className = "deck-hints";
  hints.textContent = "\u2190 \u2192 or scroll to navigate";
  document.body.appendChild(hints);
  this.hints = hints;
  this.hintTimer = setTimeout(function () {
    hints.classList.add("faded");
  }, 4000);
};

SlideEngine.prototype.bindEvents = function () {
  var self = this;
  document.addEventListener("keydown", function (e) {
    if (
      e.target.closest(
        ".mermaid-wrap,.table-scroll,.code-scroll,input,textarea,[contenteditable]",
      )
    )
      return;
    if (["ArrowDown", "ArrowRight", " ", "PageDown"].indexOf(e.key) > -1) {
      e.preventDefault();
      self.next();
    } else if (["ArrowUp", "ArrowLeft", "PageUp"].indexOf(e.key) > -1) {
      e.preventDefault();
      self.prev();
    } else if (e.key === "Home") {
      e.preventDefault();
      self.goTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      self.goTo(self.total - 1);
    }
    self.fadeHints();
  });
  var tY;
  this.deck.addEventListener(
    "touchstart",
    function (e) {
      tY = e.touches[0].clientY;
    },
    { passive: true },
  );
  this.deck.addEventListener("touchend", function (e) {
    var dy = tY - e.changedTouches[0].clientY;
    if (Math.abs(dy) > 50) {
      dy > 0 ? self.next() : self.prev();
    }
  });
};

SlideEngine.prototype.observe = function () {
  var self = this;
  var obs = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          self.current = self.slides.indexOf(entry.target);
          self.update();
        }
      });
    },
    { threshold: 0.5 },
  );
  this.slides.forEach(function (s) {
    obs.observe(s);
  });
};

SlideEngine.prototype.goTo = function (i) {
  this.slides[Math.max(0, Math.min(i, this.total - 1))].scrollIntoView({
    behavior: "smooth",
  });
};
SlideEngine.prototype.next = function () {
  if (this.current < this.total - 1) this.goTo(this.current + 1);
};
SlideEngine.prototype.prev = function () {
  if (this.current > 0) this.goTo(this.current - 1);
};
SlideEngine.prototype.update = function () {
  this.bar.style.width = ((this.current + 1) / this.total) * 100 + "%";
  var c = this.current;
  this.dots.forEach(function (d, i) {
    d.classList.toggle("active", i === c);
  });
  this.counter.textContent = this.current + 1 + " / " + this.total;
};
SlideEngine.prototype.fadeHints = function () {
  clearTimeout(this.hintTimer);
  this.hints.classList.add("faded");
};

new SlideEngine();
```

- Uses prototype-based syntax for broadest browser compatibility
- Uses IntersectionObserver with threshold 0.5 to detect which slide is in view
- Keyboard: arrows, space, page up/down, home, end
- Touch: vertical swipe > 50px
- Hints auto-fade after 4 seconds
- DO NOT modify this engine — it must match what div.deck expects
