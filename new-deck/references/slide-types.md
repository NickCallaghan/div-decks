# Slide Types

Each slide is a `<section class="slide slide--{type}">`. Content children should use `.reveal` for staggered entrance animation.

## slide--title

Hero opening slide. Centered display text.

```html
<section class="slide slide--title">
  <p class="slide__label reveal">CATEGORY · DATE</p>
  <h1 class="slide__display reveal">Main Title Here</h1>
  <p class="slide__body reveal">Subtitle or tagline</p>
</section>
```

## slide--divider

Section break. Large background number, heading, subtitle.

```html
<section class="slide slide--divider">
  <div class="slide__number">01</div>
  <h2 class="slide__heading reveal">Section Title</h2>
  <p class="slide__body reveal">Brief description of this section</p>
</section>
```

Note: `.slide__number` is a large decorative number (opacity: 0.06, font-size: clamp(200px, 30vw, 400px)).

## slide--content

Asymmetric 3fr/2fr grid. Text left, aside right.

```html
<section class="slide slide--content">
  <div class="slide__inner">
    <div class="slide__text">
      <p class="slide__label reveal">THE TOPIC</p>
      <h2 class="slide__heading reveal">Heading</h2>
      <ul class="slide__bullets">
        <li class="reveal">First point — with explanation</li>
        <li class="reveal">Second point — keep to 6 max</li>
      </ul>
    </div>
    <div class="slide__aside reveal">
      <!-- SVG, image, or decorative element -->
    </div>
  </div>
</section>
```

Density: max 6 bullets.

## slide--split

Two equal panels side by side.

```html
<section class="slide slide--split">
  <div class="slide__panels">
    <div class="slide__panel slide__panel--primary reveal">
      <h2 class="slide__heading">Left Panel</h2>
      <p class="slide__body">Content here</p>
    </div>
    <div class="slide__panel slide__panel--secondary reveal">
      <h2 class="slide__heading">Right Panel</h2>
      <p class="slide__body">Content here</p>
    </div>
  </div>
</section>
```

## slide--dashboard

KPI grid with hero numbers.

```html
<section class="slide slide--dashboard">
  <h2 class="slide__heading reveal">Dashboard Title</h2>
  <div class="slide__kpis">
    <div class="slide__kpi reveal">
      <div class="slide__kpi-val">42ms</div>
      <div class="slide__kpi-label">LATENCY</div>
      <div class="slide__kpi-trend slide__kpi-trend--down">↓ 58%</div>
    </div>
    <!-- more KPIs, auto-fit grid -->
  </div>
</section>
```

Trends: `.slide__kpi-trend--up` (green), `.slide__kpi-trend--down` (red/green depending on context).

## slide--table

Data table with sticky header.

```html
<section class="slide slide--table">
  <h2 class="slide__heading reveal">Table Title</h2>
  <div class="table-wrap reveal">
    <div class="table-scroll">
      <table class="data-table">
        <thead>
          <tr>
            <th>Col 1</th>
            <th>Col 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Data</td>
            <td>Data</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</section>
```

Density: max 8 rows.

## slide--code

Centered code block.

```html
<section class="slide slide--code">
  <p class="slide__code-filename reveal">filename.ts</p>
  <pre class="slide__code-block reveal"><code>// max 10 lines
function example() {
  return true;
}</code></pre>
</section>
```

Density: max 10 lines.

## slide--quote

Large blockquote with attribution.

```html
<section class="slide slide--quote">
  <div class="slide__quote-mark reveal">"</div>
  <blockquote class="slide__body reveal">
    The quote text goes here, keep under 150 characters.
  </blockquote>
  <cite class="slide__body reveal">— Attribution</cite>
</section>
```

## slide--bleed

Full-background image with dark scrim overlay.

```html
<section class="slide slide--bleed">
  <div class="slide__bg" style="background-image: url('...')"></div>
  <div class="slide__scrim"></div>
  <div class="slide__content reveal">
    <h2 class="slide__heading">Overlay Text</h2>
  </div>
</section>
```
