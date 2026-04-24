// ========== CHAPTER 2: LINES AND ANGLES ==========
window.chapters[2] = {
  title: "Lines and Angles",
  color: "#0d9488",
  sections: [
    "2.1 Point", "2.2 Line Segment", "2.3 Line", "2.4 Ray", "2.5 Angle",
    "2.6 Comparing Angles", "2.7 Making Angles", "2.8 Special Types of Angles",
    "2.9 Measuring Angles", "2.10 Using a Protractor", "2.11 Types of Angles and their Measures"
  ],
  content: {
    "2.1": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x1F4CD; 2.1 Point</div>
<p>Mark a tiny dot on paper with the sharp tip of a pencil. The sharper the tip, the thinner the dot. This tiny dot gives you an idea of a <strong>point</strong>.</p>
<div class="concept-box">
  <div class="cb-title">What is a Point?</div>
  <p>A point is a <strong>precise location</strong>. It has no length, no breadth, no height — it is just a position! We name a point with a capital letter like A, B, or P.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>Think of a <strong>bindi</strong> on the forehead — it marks one exact spot. Or the tip of a <strong>compass</strong> (divider) that we use in geometry. Or the tip of a <strong>needle</strong> used in sewing. All these are models of a point!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 120" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Models of a Point</text>
  <rect x="20" y="28" width="88" height="70" rx="10" fill="#ccfbf1"/>
  <circle cx="64" cy="56" r="5" fill="#0d9488"/>
  <text x="64" y="88" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0f766e">Tip of compass</text>
  <rect x="126" y="28" width="88" height="70" rx="10" fill="#ccfbf1"/>
  <circle cx="170" cy="56" r="4" fill="#0d9488"/>
  <text x="170" y="88" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0f766e">Tip of pencil</text>
  <rect x="232" y="28" width="88" height="70" rx="10" fill="#ccfbf1"/>
  <circle cx="276" cy="56" r="3" fill="#0d9488"/>
  <text x="276" y="88" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0f766e">Tip of needle</text>
  <text x="64" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#0d9488">Z</text>
  <text x="170" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#0d9488">P</text>
  <text x="276" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#0d9488">T</text>
</svg>
</div>
<p>If you mark three points on paper, you can name them Z, P and T. We read them as "Point Z", "Point P" and "Point T".</p>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Rihan marked one point on paper. How many lines can he draw through that one point?</li>
    <li>Sheetal marked two points on paper. How many different lines can she draw through both points?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A point has:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Some length</button><button class="choice-btn" data-correct="true">No length or size</button><button class="choice-btn" data-correct="false">A small area</button><button class="choice-btn" data-correct="false">A shape</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. We name a point using a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Small letter (a, b)</button><button class="choice-btn" data-correct="true">Capital letter (A, B)</button><button class="choice-btn" data-correct="false">Number (1, 2)</button><button class="choice-btn" data-correct="false">Symbol (+, -)</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. The tip of a compass is a model of a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Line</button><button class="choice-btn" data-correct="false">Ray</button><button class="choice-btn" data-correct="true">Point</button><button class="choice-btn" data-correct="false">Angle</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.2": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x1F4CF; 2.2 Line Segment</div>
<p>Fold a piece of paper and unfold it. Do you see a <strong>crease</strong>? That crease gives you the idea of a <strong>line segment</strong>!</p>
<div class="concept-box">
  <div class="cb-title">What is a Line Segment?</div>
  <p>A line segment is the <strong>shortest path</strong> between two points A and B. It has two end points. We write it as <strong>AB</strong> (with a bar on top). Points A and B are called the <strong>end points</strong>.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>The edge of your <strong>geometry box ruler</strong> is a line segment — it starts at one end and stops at the other. The side of a <strong>cricket bat</strong> is also a line segment. The crease line on a <strong>cricket pitch</strong> is a line segment!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 130" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Line Segment AB — has two end points</text>
  <circle cx="60" cy="65" r="6" fill="#0d9488"/>
  <text x="60" y="88" text-anchor="middle" font-family="Baloo 2,cursive" font-size="14" font-weight="800" fill="#0d9488">A</text>
  <line x1="60" y1="65" x2="280" y2="65" stroke="#0d9488" stroke-width="3"/>
  <circle cx="280" cy="65" r="6" fill="#0d9488"/>
  <text x="280" y="88" text-anchor="middle" font-family="Baloo 2,cursive" font-size="14" font-weight="800" fill="#0d9488">B</text>
  <text x="170" y="58" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0f766e">Line segment AB</text>
  <text x="60" y="106" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">End point</text>
  <text x="280" y="106" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">End point</text>
  <text x="170" y="124" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0d9488">Shortest path from A to B — it does NOT extend beyond A or B!</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">Key Idea</div>
  <p>The <strong>shortest route</strong> from point A to point B is the line segment AB. Any other path (curved, zigzag) would be longer!</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Mark two points A and B on paper. Try connecting them by a curved path and a straight path. Which is shorter?</li>
    <li>Name all the line segments you can see in your geometry box lid.</li>
    <li>How many line segments does a triangle have? A square? A pentagon?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A line segment has:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">No end points</button><button class="choice-btn" data-correct="false">One end point</button><button class="choice-btn" data-correct="true">Two end points</button><button class="choice-btn" data-correct="false">Three end points</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. The crease on a folded paper is a model of a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Point</button><button class="choice-btn" data-correct="true">Line segment</button><button class="choice-btn" data-correct="false">Ray</button><button class="choice-btn" data-correct="false">Angle</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. A triangle has how many line segments (sides)?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">2</button><button class="choice-btn" data-correct="true">3</button><button class="choice-btn" data-correct="false">4</button><button class="choice-btn" data-correct="false">5</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. The cricket pitch crease from point A to B is best described as a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Ray AB</button><button class="choice-btn" data-correct="false">Line AB</button><button class="choice-btn" data-correct="true">Line segment AB</button><button class="choice-btn" data-correct="false">Point A</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.3": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x27A1; 2.3 Line</div>
<p>Imagine taking a line segment AB and extending it <strong>beyond A</strong> in one direction AND <strong>beyond B</strong> in the other direction — going on forever in both directions. This gives you a <strong>line</strong>!</p>
<div class="concept-box">
  <div class="cb-title">What is a Line?</div>
  <p>A line extends <strong>forever in both directions</strong>. It has no end points. We write it as <strong>AB</strong> (with arrows on both ends). A line can also be named by a single small letter like <em>l</em> or <em>m</em>. Any two points determine a unique line.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>Imagine a <strong>railway track</strong> that goes on forever in both directions — that is a model of a line! Or think of the <strong>horizon</strong> where the sea meets the sky — it looks like it goes on forever both left and right!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 130" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Difference: Line Segment vs Line</text>
  <text x="20" y="42" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0d9488">Line Segment AB:</text>
  <circle cx="90" cy="58" r="5" fill="#0d9488"/>
  <text x="90" y="76" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#0d9488">A</text>
  <line x1="90" y1="58" x2="250" y2="58" stroke="#0d9488" stroke-width="2.5"/>
  <circle cx="250" cy="58" r="5" fill="#0d9488"/>
  <text x="250" y="76" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#0d9488">B</text>
  <text x="170" y="90" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Stops at A and B</text>
  <text x="20" y="108" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#f97316">Line AB:</text>
  <line x1="20" y1="118" x2="320" y2="118" stroke="#f97316" stroke-width="2.5"/>
  <polygon points="14,118 24,114 24,122" fill="#f97316"/>
  <polygon points="326,118 316,114 316,122" fill="#f97316"/>
  <circle cx="110" cy="118" r="4" fill="#f97316"/>
  <text x="110" y="112" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#f97316">A</text>
  <circle cx="230" cy="118" r="4" fill="#f97316"/>
  <text x="230" y="112" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#f97316">B</text>
</svg>
</div>
<div class="math-talk">&#x1F4AC; <strong>Think:</strong>&nbsp; Can you draw a complete picture of a line? No! Because it never ends. We show arrows at both ends to show it goes on forever.</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>What is the difference between a line and a line segment?</li>
    <li>Can two lines intersect (cross) at more than one point? Think and discuss.</li>
    <li>Name a real-life example of a line from your surroundings.</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A line extends in:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">One direction only</button><button class="choice-btn" data-correct="true">Both directions forever</button><button class="choice-btn" data-correct="false">No direction</button><button class="choice-btn" data-correct="false">A curved path</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Railway track going on forever both ways is a model of a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Point</button><button class="choice-btn" data-correct="false">Line segment</button><button class="choice-btn" data-correct="true">Line</button><button class="choice-btn" data-correct="false">Ray</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. How many end points does a line have?</div><div class="answer-choices"><button class="choice-btn" data-correct="true">0</button><button class="choice-btn" data-correct="false">1</button><button class="choice-btn" data-correct="false">2</button><button class="choice-btn" data-correct="false">3</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.4": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x2192; 2.4 Ray</div>
<p>A <strong>ray</strong> starts at one point and goes on forever in <strong>one direction only</strong>. It is like half a line!</p>
<div class="concept-box">
  <div class="cb-title">What is a Ray?</div>
  <p>A ray has one <strong>starting point</strong> (called the initial point) and goes on endlessly in one direction. We write ray AP as <strong>AP</strong> (with an arrow on top pointing towards P). Note: Ray AP and Ray PA are different — direction matters!</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p><strong>Sunlight</strong> coming from the sun — it starts at the sun and goes on forever in one direction! A <strong>torch/flashlight</strong> beam starts at the torch and goes forward. The <strong>beam from a lighthouse</strong> that guides ships — all are rays!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 145" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Point, Line Segment, Line, Ray — Comparison</text>
  <text x="16" y="40" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#64748b">Point:</text>
  <circle cx="100" cy="36" r="5" fill="#0d9488"/>
  <text x="100" y="52" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#0d9488">A</text>
  <text x="200" y="40" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">No size, just location</text>
  <text x="16" y="72" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#64748b">Seg:</text>
  <circle cx="70" cy="68" r="4" fill="#2563eb"/><line x1="70" y1="68" x2="200" y2="68" stroke="#2563eb" stroke-width="2.5"/><circle cx="200" cy="68" r="4" fill="#2563eb"/>
  <text x="70" y="82" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#2563eb">A</text><text x="200" y="82" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#2563eb">B</text>
  <text x="270" y="72" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">2 end points</text>
  <text x="16" y="104" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#64748b">Line:</text>
  <line x1="50" y1="100" x2="290" y2="100" stroke="#f97316" stroke-width="2.5"/>
  <polygon points="44,100 54,96 54,104" fill="#f97316"/>
  <polygon points="296,100 286,96 286,104" fill="#f97316"/>
  <text x="170" y="114" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">No end points, goes both ways</text>
  <text x="16" y="136" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#64748b">Ray:</text>
  <circle cx="70" cy="132" r="4" fill="#7c3aed"/>
  <line x1="70" y1="132" x2="290" y2="132" stroke="#7c3aed" stroke-width="2.5"/>
  <polygon points="296,132 286,128 286,136" fill="#7c3aed"/>
  <text x="70" y="145" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#7c3aed">A</text>
  <text x="200" y="145" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#7c3aed">P</text>
  <text x="270" y="136" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">1 start point</text>
</svg>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Ray AP and Ray PA — are they the same? Why or why not?</li>
    <li>Can a ray have an end point? Where?</li>
    <li>Name 3 real-life examples of rays from around you.</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A ray has how many end points?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">0</button><button class="choice-btn" data-correct="true">1 (starting point only)</button><button class="choice-btn" data-correct="false">2</button><button class="choice-btn" data-correct="false">Infinite</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Sunlight from the sun is a model of a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Line segment</button><button class="choice-btn" data-correct="false">Line</button><button class="choice-btn" data-correct="true">Ray</button><button class="choice-btn" data-correct="false">Point</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Ray AP starts at A and goes through P. Ray PA starts at:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">A</button><button class="choice-btn" data-correct="true">P</button><button class="choice-btn" data-correct="false">Both A and P</button><button class="choice-btn" data-correct="false">Neither</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. Which has NO starting point and NO ending point?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Ray</button><button class="choice-btn" data-correct="false">Line segment</button><button class="choice-btn" data-correct="true">Line</button><button class="choice-btn" data-correct="false">Point</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.5": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x2220; 2.5 Angle</div>
<p>When <strong>two rays start from the same point</strong>, they form an <strong>angle</strong>!</p>
<div class="concept-box">
  <div class="cb-title">What is an Angle?</div>
  <p>An angle is formed by two rays having a <strong>common starting point</strong>. The common point is called the <strong>vertex</strong>. The two rays are called the <strong>arms</strong> of the angle. The size of an angle = the amount of <strong>rotation/turn</strong> from one arm to the other.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>When you open a <strong>geometry box</strong> (compass/divider), the two arms form an angle — the more you open it, the bigger the angle! A <strong>cricket bat</strong> hitting a ball changes direction — the change makes an angle. The hands of a <strong>clock</strong> form angles!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Angle DBE — vertex B, arms BD and BE</text>
  <circle cx="130" cy="100" r="6" fill="#0d9488"/>
  <text x="118" y="108" font-family="Baloo 2,cursive" font-size="14" font-weight="800" fill="#0d9488">B</text>
  <text x="118" y="120" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">vertex</text>
  <line x1="130" y1="100" x2="200" y2="40" stroke="#0d9488" stroke-width="2.5"/>
  <polygon points="204,37 196,44 203,50" fill="#0d9488"/>
  <text x="210" y="36" font-family="Baloo 2,cursive" font-size="14" font-weight="800" fill="#0d9488">D</text>
  <text x="168" y="62" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#64748b">arm</text>
  <line x1="130" y1="100" x2="220" y2="120" stroke="#0d9488" stroke-width="2.5"/>
  <polygon points="225,122 216,114 221,125" fill="#0d9488"/>
  <text x="228" y="126" font-family="Baloo 2,cursive" font-size="14" font-weight="800" fill="#0d9488">E</text>
  <text x="185" y="118" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#64748b">arm</text>
  <path d="M 148 90 A 22 22 0 0 1 152 112" fill="none" stroke="#f97316" stroke-width="2"/>
  <text x="158" y="95" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#f97316">angle</text>
  <text x="260" y="65" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#1e293b">Name:</text>
  <text x="260" y="80" font-family="Nunito,sans-serif" font-size="11" fill="#0d9488">Angle DBE</text>
  <text x="260" y="94" font-family="Nunito,sans-serif" font-size="11" fill="#0d9488">or Angle EBD</text>
  <text x="260" y="108" font-family="Nunito,sans-serif" font-size="11" fill="#f97316">or &#x2220;DBE</text>
  <text x="260" y="122" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">vertex B is always</text>
  <text x="260" y="134" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">the middle letter!</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">Size of an Angle</div>
  <p>The size of an angle = the <strong>amount of rotation</strong> needed to move one arm to reach the other arm. More rotation = bigger angle! The length of the arms does NOT matter — only the rotation matters.</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Open your geometry compass a little. Name the angle, its vertex and its arms.</li>
    <li>Open it more. Is the new angle bigger or smaller? Why?</li>
    <li>Find 3 angles in your classroom right now. Name the vertex and arms of each.</li>
    <li>The clock shows 3 o&#39;clock. What angle do the hands make?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. An angle is formed by:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Two line segments</button><button class="choice-btn" data-correct="true">Two rays from same point</button><button class="choice-btn" data-correct="false">Two points</button><button class="choice-btn" data-correct="false">One ray only</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. In angle DBE, the vertex is:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">D</button><button class="choice-btn" data-correct="true">B</button><button class="choice-btn" data-correct="false">E</button><button class="choice-btn" data-correct="false">DB</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Opening a compass more makes the angle:</div><div class="answer-choices"><button class="choice-btn" data-correct="true">Bigger</button><button class="choice-btn" data-correct="false">Smaller</button><button class="choice-btn" data-correct="false">Same size</button><button class="choice-btn" data-correct="false">Zero</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. The size of an angle depends on:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Length of arms</button><button class="choice-btn" data-correct="true">Amount of rotation</button><button class="choice-btn" data-correct="false">Colour of arms</button><button class="choice-btn" data-correct="false">Name of vertex</button></div><div class="feedback"></div></div>
</div>
<div class="math-talk">&#x1F4A1; <strong>Sections 2.1–2.5 Complete!</strong>&nbsp; You now know: Point, Line Segment, Line, Ray and Angle — the building blocks of geometry!</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.6": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x2194; 2.6 Comparing Angles</div>
<p>How do we know which angle is <strong>bigger</strong>? Just like we compare lengths, we can compare angles too!</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>Look at animals opening their mouths — a <strong>crocodile</strong> opens its mouth very wide (big angle!), a <strong>fish</strong> opens it a little (small angle!). The more the jaws open, the bigger the angle — just like a <strong>compass</strong> opened wide vs barely open!</p>
</div>
<div class="concept-box">
  <div class="cb-title">Two ways to compare angles</div>
  <p><strong>1. By looking:</strong> Sometimes it is easy to just see which is bigger.<br/>
  <strong>2. By superimposition:</strong> Place one angle exactly over the other — match the vertices and one arm. The angle whose other arm sticks out more is the bigger angle!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Comparing by Superimposition</text>
  <text x="60" y="38" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#0d9488">Angle ABC</text>
  <circle cx="30" cy="100" r="5" fill="#0d9488"/>
  <text x="22" y="115" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#0d9488">B</text>
  <line x1="30" y1="100" x2="90" y2="55" stroke="#0d9488" stroke-width="2.5"/>
  <text x="94" y="52" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#0d9488">A</text>
  <line x1="30" y1="100" x2="100" y2="100" stroke="#0d9488" stroke-width="2.5"/>
  <text x="104" y="104" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#0d9488">C</text>
  <path d="M 50 100 A 20 20 0 0 1 52 83" fill="none" stroke="#0d9488" stroke-width="1.5"/>
  <text x="170" y="90" text-anchor="middle" font-family="Baloo 2,cursive" font-size="22" font-weight="800" fill="#94a3b8">vs</text>
  <text x="270" y="38" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#f97316">Angle PQR</text>
  <circle cx="240" cy="100" r="5" fill="#f97316"/>
  <text x="232" y="115" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#f97316">Q</text>
  <line x1="240" y1="100" x2="270" y2="45" stroke="#f97316" stroke-width="2.5"/>
  <text x="274" y="42" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#f97316">P</text>
  <line x1="240" y1="100" x2="320" y2="100" stroke="#f97316" stroke-width="2.5"/>
  <text x="324" y="104" font-family="Baloo 2,cursive" font-size="12" font-weight="800" fill="#f97316">R</text>
  <path d="M 260 100 A 20 20 0 0 1 263 80" fill="none" stroke="#f97316" stroke-width="1.5"/>
  <text x="170" y="135" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#1e293b">Superimpose both — whichever arm sticks out more = bigger angle!</text>
  <text x="170" y="150" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Here angle PQR is bigger than angle ABC</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">Equal Angles</div>
  <p>If you superimpose two angles and BOTH arms overlap perfectly — the angles are <strong>equal in size</strong>! The length of the arms does NOT matter — only the rotation matters.</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Draw two angles. By looking, guess which is bigger. Then superimpose to check!</li>
    <li>Open your compass to two different positions. Which angle is bigger? How can you tell?</li>
    <li>Can two angles be equal even if their arms have different lengths? Think and discuss.</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. To compare two angles by superimposition, we must match the:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Arms only</button><button class="choice-btn" data-correct="true">Vertices first, then one arm</button><button class="choice-btn" data-correct="false">Arm lengths</button><button class="choice-btn" data-correct="false">Names of angles</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. A crocodile opens its mouth wider than a fish. So the crocodile&#39;s jaw angle is:</div><div class="answer-choices"><button class="choice-btn" data-correct="true">Bigger</button><button class="choice-btn" data-correct="false">Smaller</button><button class="choice-btn" data-correct="false">Equal</button><button class="choice-btn" data-correct="false">Cannot say</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Two angles are equal when superimposed. This means their:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Arms have same length</button><button class="choice-btn" data-correct="false">Names are same</button><button class="choice-btn" data-correct="true">Rotation amount is same</button><button class="choice-btn" data-correct="false">Vertices are same point</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.7": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x270F; 2.7 Making Angles</div>
<p>We can make angles and compare them using simple tools — even a <strong>piece of paper</strong>!</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>When you fold a <strong>roti</strong> in half, the fold creates a straight angle (180°)! When you fold it again into quarters, you get a right angle (90°)! A folded <strong>paper boat</strong> has many angles you can compare by superimposition.</p>
</div>
<div class="concept-box">
  <div class="cb-title">Comparing without superimposition — using a circle!</div>
  <p>Place a transparent circle so its <strong>centre is at the vertex</strong> of an angle. Mark where each arm crosses the circle edge. Now move the circle to another angle the same way. Compare the arc lengths — the bigger arc = bigger angle!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 130" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Using a circle to compare angles</text>
  <circle cx="85" cy="80" r="45" fill="none" stroke="#0d9488" stroke-width="1.5" stroke-dasharray="4,3"/>
  <circle cx="85" cy="80" r="4" fill="#0d9488"/>
  <text x="78" y="94" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#0d9488">O</text>
  <line x1="85" y1="80" x2="118" y2="38" stroke="#0d9488" stroke-width="2"/>
  <line x1="85" y1="80" x2="130" y2="80" stroke="#0d9488" stroke-width="2"/>
  <circle cx="118" cy="38" r="3" fill="#f97316"/>
  <text x="122" y="36" font-family="Baloo 2,cursive" font-size="10" font-weight="700" fill="#f97316">B</text>
  <circle cx="130" cy="80" r="3" fill="#f97316"/>
  <text x="134" y="84" font-family="Baloo 2,cursive" font-size="10" font-weight="700" fill="#f97316">A</text>
  <path d="M 130 80 A 45 45 0 0 1 118 38" fill="none" stroke="#f97316" stroke-width="2.5"/>
  <text x="85" y="118" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Arc AB shows size of angle</text>
  <text x="255" y="60" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#1e293b">Bigger arc</text>
  <text x="255" y="74" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#f97316">= Bigger angle!</text>
  <text x="255" y="90" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Smaller arc</text>
  <text x="255" y="104" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#0d9488">= Smaller angle</text>
</svg>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Fold a rectangular paper in half. What angle does the fold make?</li>
    <li>Fold it in half again. What angle do you get now? How does it compare to the first fold?</li>
    <li>Make 3 different angles by folding paper. Put them in order from smallest to largest.</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. When comparing using a circle, the centre of the circle must be at the angle&#39;s:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Arm</button><button class="choice-btn" data-correct="true">Vertex</button><button class="choice-btn" data-correct="false">Midpoint</button><button class="choice-btn" data-correct="false">Edge</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Folding a roti in half gives a fold angle of:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">90°</button><button class="choice-btn" data-correct="true">180° (straight angle)</button><button class="choice-btn" data-correct="false">360°</button><button class="choice-btn" data-correct="false">45°</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. A bigger arc on the circle means the angle is:</div><div class="answer-choices"><button class="choice-btn" data-correct="true">Bigger</button><button class="choice-btn" data-correct="false">Smaller</button><button class="choice-btn" data-correct="false">Equal</button><button class="choice-btn" data-correct="false">Zero</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.8": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x26D4; 2.8 Special Types of Angles</div>
<p>Some angles are so important and so common that we give them <strong>special names</strong>!</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>The corner of your <strong>notebook</strong> is a right angle (90°)! The edges of a <strong>door frame</strong> make right angles. A <strong>straight road</strong> going left and right is a straight angle (180°). When you stand straight — your body makes a right angle with the ground!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 175" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">4 Special Types of Angles</text>
  <rect x="8" y="26" width="74" height="68" rx="8" fill="#dbeafe"/>
  <line x1="45" y1="82" x2="75" y2="82" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="45" y1="82" x2="45" y2="50" stroke="#2563eb" stroke-width="2.5"/>
  <circle cx="45" cy="82" r="3" fill="#2563eb"/>
  <rect x="45" y="70" width="10" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
  <text x="45" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#2563eb">Right</text>
  <text x="45" y="118" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#1d4ed8">= 90°</text>
  <text x="45" y="130" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#64748b">like 'L' shape</text>
  <rect x="90" y="26" width="74" height="68" rx="8" fill="#dcfce7"/>
  <line x1="127" y1="82" x2="157" y2="82" stroke="#16a34a" stroke-width="2.5"/>
  <line x1="97" y1="82" x2="127" y2="82" stroke="#16a34a" stroke-width="2.5"/>
  <path d="M 137 82 A 10 10 0 0 1 127 72" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  <circle cx="127" cy="82" r="3" fill="#16a34a"/>
  <text x="127" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#16a34a">Straight</text>
  <text x="127" y="118" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#15803d">= 180°</text>
  <text x="127" y="130" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#64748b">flat line</text>
  <rect x="172" y="26" width="74" height="68" rx="8" fill="#fef3c7"/>
  <line x1="209" y1="82" x2="239" y2="82" stroke="#d97706" stroke-width="2.5"/>
  <line x1="209" y1="82" x2="230" y2="58" stroke="#d97706" stroke-width="2.5"/>
  <path d="M 225 82 A 16 16 0 0 1 218 68" fill="none" stroke="#d97706" stroke-width="1.5"/>
  <circle cx="209" cy="82" r="3" fill="#d97706"/>
  <text x="209" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#d97706">Acute</text>
  <text x="209" y="118" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#92400e">less than 90°</text>
  <text x="209" y="130" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#64748b">sharp!</text>
  <rect x="254" y="26" width="78" height="68" rx="8" fill="#fee2e2"/>
  <line x1="293" y1="82" x2="325" y2="82" stroke="#ef4444" stroke-width="2.5"/>
  <line x1="293" y1="82" x2="302" y2="48" stroke="#ef4444" stroke-width="2.5"/>
  <path d="M 315 82 A 22 22 0 0 1 303 62" fill="none" stroke="#ef4444" stroke-width="1.5"/>
  <circle cx="293" cy="82" r="3" fill="#ef4444"/>
  <text x="293" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#ef4444">Obtuse</text>
  <text x="293" y="118" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#b91c1c">90° to 180°</text>
  <text x="293" y="130" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#64748b">blunt!</text>
  <text x="170" y="152" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#1e293b">Acute &lt; 90° &lt; Right = 90° &lt; Obtuse &lt; 180° = Straight</text>
  <text x="170" y="168" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Two right angles = one straight angle. Perpendicular lines meet at 90°.</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">Key Words</div>
  <p><strong>Acute</strong> means "sharp" in Latin — acute angles are sharp/small.<br/>
  <strong>Obtuse</strong> means "blunt" — obtuse angles are wider/blunt.<br/>
  <strong>Perpendicular</strong> lines meet at exactly 90° (right angle).</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Find 3 right angles in your classroom right now.</li>
    <li>The hands of a clock at 3 o&#39;clock — what type of angle?</li>
    <li>Acute means sharp, obtuse means blunt. Why are these good names for these angles?</li>
    <li>A triangle has 3 angles — can it have 2 obtuse angles? Try drawing it!</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. The corner of a notebook is a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Acute angle</button><button class="choice-btn" data-correct="true">Right angle (90°)</button><button class="choice-btn" data-correct="false">Obtuse angle</button><button class="choice-btn" data-correct="false">Straight angle</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. An angle of 120° is called:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Acute</button><button class="choice-btn" data-correct="false">Right</button><button class="choice-btn" data-correct="true">Obtuse</button><button class="choice-btn" data-correct="false">Straight</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. A straight angle = how many right angles?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">1</button><button class="choice-btn" data-correct="true">2</button><button class="choice-btn" data-correct="false">3</button><button class="choice-btn" data-correct="false">4</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. Two lines meeting at 90° are called:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Parallel lines</button><button class="choice-btn" data-correct="false">Equal lines</button><button class="choice-btn" data-correct="true">Perpendicular lines</button><button class="choice-btn" data-correct="false">Straight lines</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.9": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x1F4D0; 2.9 Measuring Angles</div>
<p>We can compare angles, but can we give them an exact <strong>number</strong>? Yes! We use <strong>degrees</strong>!</p>
<div class="concept-box">
  <div class="cb-title">What is a Degree?</div>
  <p>Mathematicians divided a full circle (one full turn) into <strong>360 equal parts</strong>. Each part is called <strong>1 degree</strong>, written as <strong>1°</strong>. The measure of an angle = how many of these 1° parts fit inside it.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>The <strong>clock</strong> makes a full circle in 12 hours. At 3 o&#39;clock, the minute and hour hand make a <strong>90° angle</strong> (quarter turn). At 6 o&#39;clock they make <strong>180°</strong> (half turn). A full turn of a <strong>chakkar (merry-go-round)</strong> = 360°!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 170" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Key Angle Measures in Degrees</text>
  <circle cx="55" cy="95" r="38" fill="#dbeafe" stroke="#2563eb" stroke-width="1.5"/>
  <line x1="55" y1="95" x2="93" y2="95" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="55" y1="95" x2="93" y2="95" stroke="#2563eb" stroke-width="2.5"/>
  <line x1="55" y1="95" x2="55" y2="57" stroke="#f97316" stroke-width="2.5"/>
  <circle cx="55" cy="95" r="4" fill="#2563eb"/>
  <rect x="55" y="83" width="10" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
  <text x="55" y="148" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#2563eb">90°</text>
  <text x="55" y="162" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Right angle</text>
  <circle cx="170" cy="95" r="38" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5"/>
  <line x1="132" y1="95" x2="208" y2="95" stroke="#16a34a" stroke-width="2.5"/>
  <circle cx="170" cy="95" r="4" fill="#16a34a"/>
  <path d="M 185 95 A 15 15 0 0 1 170 80" fill="none" stroke="#16a34a" stroke-width="2"/>
  <text x="170" y="148" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#16a34a">180°</text>
  <text x="170" y="162" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Straight angle</text>
  <circle cx="285" cy="95" r="38" fill="#fef3c7" stroke="#d97706" stroke-width="1.5"/>
  <circle cx="285" cy="95" r="4" fill="#d97706"/>
  <line x1="285" y1="95" x2="323" y2="95" stroke="#d97706" stroke-width="2.5"/>
  <path d="M 323 95 A 38 38 0 1 1 322 94" fill="none" stroke="#f97316" stroke-width="2" stroke-dasharray="3,2"/>
  <text x="285" y="148" text-anchor="middle" font-family="Baloo 2,cursive" font-size="13" font-weight="800" fill="#d97706">360°</text>
  <text x="285" y="162" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Full turn</text>
</svg>
</div>
<div class="num-table" style="background:#f0fdf4; border-color:#86efac;">
  <div class="nt-title" style="color:#15803d;">Important Angle Measures</div>
  <div class="seq-row"><span class="seq-nums">Full turn (chakkar)</span><span class="seq-name" style="background:#bbf7d0;color:#15803d;">360°</span></div>
  <div class="seq-row"><span class="seq-nums">Straight angle (flat line)</span><span class="seq-name" style="background:#bbf7d0;color:#15803d;">180°</span></div>
  <div class="seq-row"><span class="seq-nums">Right angle (corner of notebook)</span><span class="seq-name" style="background:#bbf7d0;color:#15803d;">90°</span></div>
  <div class="seq-row"><span class="seq-nums">Acute angle</span><span class="seq-name" style="background:#bbf7d0;color:#15803d;">less than 90°</span></div>
  <div class="seq-row"><span class="seq-nums">Obtuse angle</span><span class="seq-name" style="background:#bbf7d0;color:#15803d;">90° to 180°</span></div>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>A full turn = 360°. A straight angle = half turn. So straight angle = how many degrees?</li>
    <li>A right angle = half of straight angle. So right angle = how many degrees?</li>
    <li>Clock at 3 o&#39;clock — what is the angle between the hands?</li>
    <li>Clock at 6 o&#39;clock — what is the angle between the hands?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A full turn (chakkar) = how many degrees?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">90°</button><button class="choice-btn" data-correct="false">180°</button><button class="choice-btn" data-correct="false">270°</button><button class="choice-btn" data-correct="true">360°</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. A straight angle = ?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">90°</button><button class="choice-btn" data-correct="true">180°</button><button class="choice-btn" data-correct="false">270°</button><button class="choice-btn" data-correct="false">360°</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Clock hands at 3 o&#39;clock make an angle of:</div><div class="answer-choices"><button class="choice-btn" data-correct="true">90°</button><button class="choice-btn" data-correct="false">180°</button><button class="choice-btn" data-correct="false">45°</button><button class="choice-btn" data-correct="false">360°</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. An angle of 75° is:</div><div class="answer-choices"><button class="choice-btn" data-correct="true">Acute (less than 90°)</button><button class="choice-btn" data-correct="false">Right (= 90°)</button><button class="choice-btn" data-correct="false">Obtuse (90°-180°)</button><button class="choice-btn" data-correct="false">Straight (= 180°)</button></div><div class="feedback"></div></div>
</div>
<div class="math-talk">&#x1F4A1; <strong>Chapter 2 Complete!</strong>&nbsp; You now know: Point, Line Segment, Line, Ray, Angle, Comparing Angles, Making Angles, Special Types and Measuring in Degrees. Chapter 2 done! &#x1F3C6;</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.10": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x1F4D0; 2.10 Using a Protractor</div>
<p>We know angles are measured in degrees. But how do we actually <strong>measure</strong> or <strong>draw</strong> an exact angle? We use a tool called a <strong>protractor</strong>!</p>
<div class="concept-box">
  <div class="cb-title">What is a Protractor?</div>
  <p>A protractor is a semicircular tool divided into <strong>180 equal parts</strong>. Each part = 1°. It has two scales — inner and outer — both starting from 0° but going in opposite directions.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>The <strong>Ashoka Chakra</strong> on our national flag has 24 spokes. Each spoke divides the circle equally. The angle between two spokes = 360° ÷ 24 = <strong>15°</strong>! A protractor helps us measure and draw such precise angles.</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 150" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">How to Measure an Angle with Protractor</text>
  <rect x="10" y="26" width="148" height="110" rx="8" fill="#ccfbf1"/>
  <text x="84" y="44" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#0f766e">Step 1</text>
  <text x="84" y="56" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">Place centre of</text>
  <text x="84" y="68" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">protractor on</text>
  <text x="84" y="80" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">the vertex</text>
  <circle cx="84" cy="110" r="8" fill="#0d9488"/>
  <text x="84" y="114" text-anchor="middle" font-family="Nunito,sans-serif" font-size="8" font-weight="700" fill="white">O</text>
  <rect x="182" y="26" width="148" height="110" rx="8" fill="#ccfbf1"/>
  <text x="256" y="44" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#0f766e">Step 2</text>
  <text x="256" y="56" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">Align one arm</text>
  <text x="256" y="68" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">with the 0° line</text>
  <text x="256" y="80" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">of protractor</text>
  <line x1="210" y1="118" x2="302" y2="118" stroke="#0d9488" stroke-width="2.5"/>
  <circle cx="210" cy="118" r="5" fill="#0d9488"/>
  <text x="256" y="135" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#065f46">0° aligned here</text>
  <text x="170" y="145" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#0d9488">Step 3: Read the degree where the other arm crosses the scale!</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">How to Draw an Angle of given degrees</div>
  <p>1. Draw a ray IN.<br/>
  2. Place protractor centre on I, align IN with 0°.<br/>
  3. Mark point T at the required degree on the scale.<br/>
  4. Join I to T — angle TIN is your required angle!</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Use your protractor to measure angles of 30°, 90°, 120°, 180°.</li>
    <li>Draw angles of: 40°, 75°, 110°, 134°.</li>
    <li>The Ashoka Chakra has 24 spokes. What is the angle between adjacent spokes?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A protractor is shaped like a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Full circle</button><button class="choice-btn" data-correct="true">Semicircle (half circle)</button><button class="choice-btn" data-correct="false">Triangle</button><button class="choice-btn" data-correct="false">Square</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. When measuring an angle with protractor, we place its centre on the angle&#39;s:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Arm</button><button class="choice-btn" data-correct="true">Vertex</button><button class="choice-btn" data-correct="false">Midpoint</button><button class="choice-btn" data-correct="false">Endpoint</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Ashoka Chakra has 24 spokes equally spaced. Angle between 2 spokes = ?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">24°</button><button class="choice-btn" data-correct="true">15°</button><button class="choice-btn" data-correct="false">20°</button><button class="choice-btn" data-correct="false">30°</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. A protractor has how many equal divisions?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">90</button><button class="choice-btn" data-correct="false">360</button><button class="choice-btn" data-correct="true">180</button><button class="choice-btn" data-correct="false">270</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "2.11": function() { return `
<div class="sec-heading" style="color:#0d9488">&#x2606; 2.11 Types of Angles and their Measures</div>
<p>Let us bring together <strong>all types of angles</strong> with their exact degree ranges — the complete picture!</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>A <strong>kite</strong> (patang) has both acute and obtuse angles. The <strong>Eiffel Tower-like structures</strong> in Indian bridges use reflex angles in their design. When you open a <strong>door fully flat against a wall</strong> — that is a reflex angle (more than 180°)!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 200" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">All 5 Types of Angles</text>
  <rect x="6" y="24" width="62" height="78" rx="8" fill="#dbeafe"/>
  <line x1="37" y1="88" x2="61" y2="88" stroke="#2563eb" stroke-width="2"/>
  <line x1="37" y1="88" x2="37" y2="62" stroke="#2563eb" stroke-width="2"/>
  <rect x="37" y="76" width="9" height="12" fill="none" stroke="#2563eb" stroke-width="1.5"/>
  <circle cx="37" cy="88" r="3" fill="#2563eb"/>
  <text x="37" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#2563eb">Right</text>
  <text x="37" y="120" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#1d4ed8">= 90°</text>
  <rect x="74" y="24" width="62" height="78" rx="8" fill="#fef3c7"/>
  <line x1="105" y1="88" x2="129" y2="88" stroke="#d97706" stroke-width="2"/>
  <line x1="105" y1="88" x2="122" y2="65" stroke="#d97706" stroke-width="2"/>
  <path d="M 119 88 A 14 14 0 0 1 114 76" fill="none" stroke="#d97706" stroke-width="1.5"/>
  <circle cx="105" cy="88" r="3" fill="#d97706"/>
  <text x="105" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#d97706">Acute</text>
  <text x="105" y="120" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#92400e">0°–90°</text>
  <rect x="142" y="24" width="62" height="78" rx="8" fill="#fee2e2"/>
  <line x1="173" y1="88" x2="197" y2="88" stroke="#ef4444" stroke-width="2"/>
  <line x1="173" y1="88" x2="178" y2="58" stroke="#ef4444" stroke-width="2"/>
  <path d="M 189 88 A 16 16 0 0 1 178 73" fill="none" stroke="#ef4444" stroke-width="1.5"/>
  <circle cx="173" cy="88" r="3" fill="#ef4444"/>
  <text x="173" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#ef4444">Obtuse</text>
  <text x="173" y="120" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#b91c1c">90°–180°</text>
  <rect x="210" y="24" width="62" height="78" rx="8" fill="#dcfce7"/>
  <line x1="241" y1="75" x2="265" y2="75" stroke="#16a34a" stroke-width="2"/>
  <line x1="217" y1="75" x2="241" y2="75" stroke="#16a34a" stroke-width="2"/>
  <circle cx="241" cy="75" r="3" fill="#16a34a"/>
  <path d="M 252 75 A 11 11 0 0 1 241 64" fill="none" stroke="#16a34a" stroke-width="1.5"/>
  <text x="241" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#16a34a">Straight</text>
  <text x="241" y="120" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#15803d">= 180°</text>
  <rect x="278" y="24" width="56" height="78" rx="8" fill="#f3e8ff"/>
  <circle cx="306" cy="70" r="3" fill="#7c3aed"/>
  <line x1="306" y1="70" x2="328" y2="70" stroke="#7c3aed" stroke-width="2"/>
  <path d="M 322 70 A 16 16 0 1 0 306 54" fill="none" stroke="#7c3aed" stroke-width="2"/>
  <text x="306" y="108" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#7c3aed">Reflex</text>
  <text x="306" y="120" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#6d28d9">180°–360°</text>
  <rect x="6" y="136" width="328" height="56" rx="10" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1.5"/>
  <text x="170" y="154" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="800" fill="#1e293b">Complete Order: Acute &lt; Right &lt; Obtuse &lt; Straight &lt; Reflex</text>
  <text x="170" y="169" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#475569">0° ........... 90° ........... 180° ........... 360°</text>
  <text x="37" y="184" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#d97706">Acute</text>
  <text x="105" y="184" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#2563eb">Right</text>
  <text x="173" y="184" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#ef4444">Obtuse</text>
  <text x="241" y="184" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#16a34a">Straight</text>
  <text x="306" y="184" text-anchor="middle" font-family="Nunito,sans-serif" font-size="9" fill="#7c3aed">Reflex</text>
</svg>
</div>
<div class="num-table" style="background:#f5f3ff; border-color:#c4b5fd;">
  <div class="nt-title" style="color:#5b21b6;">All Angle Types — Quick Summary</div>
  <div class="seq-row"><span class="seq-nums">Acute angle</span><span class="seq-name" style="background:#ede9fe;color:#5b21b6;">0° to 90° (not including)</span></div>
  <div class="seq-row"><span class="seq-nums">Right angle</span><span class="seq-name" style="background:#ede9fe;color:#5b21b6;">exactly 90°</span></div>
  <div class="seq-row"><span class="seq-nums">Obtuse angle</span><span class="seq-name" style="background:#ede9fe;color:#5b21b6;">90° to 180° (not including)</span></div>
  <div class="seq-row"><span class="seq-nums">Straight angle</span><span class="seq-name" style="background:#ede9fe;color:#5b21b6;">exactly 180°</span></div>
  <div class="seq-row"><span class="seq-nums">Reflex angle</span><span class="seq-name" style="background:#ede9fe;color:#5b21b6;">180° to 360° (not including)</span></div>
  <div class="seq-row"><span class="seq-nums">Full turn</span><span class="seq-name" style="background:#ede9fe;color:#5b21b6;">exactly 360°</span></div>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>A door opened past 180° — what type of angle does it make?</li>
    <li>Name the type of angle: 45°, 90°, 135°, 180°, 270°.</li>
    <li>Can a triangle have a reflex angle? Why or why not?</li>
    <li>Puzzle: I am an acute angle. Double me = still acute. Triple me = still acute. Quadruple me = still acute. But 5 times me = obtuse! What could I be?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A reflex angle is:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Less than 90°</button><button class="choice-btn" data-correct="false">Exactly 180°</button><button class="choice-btn" data-correct="true">Between 180° and 360°</button><button class="choice-btn" data-correct="false">Exactly 90°</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. An angle of 200° is a:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Obtuse angle</button><button class="choice-btn" data-correct="false">Straight angle</button><button class="choice-btn" data-correct="true">Reflex angle</button><button class="choice-btn" data-correct="false">Right angle</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. A kite (patang) has a sharp tip angle of 35°. This is a:</div><div class="answer-choices"><button class="choice-btn" data-correct="true">Acute angle</button><button class="choice-btn" data-correct="false">Right angle</button><button class="choice-btn" data-correct="false">Obtuse angle</button><button class="choice-btn" data-correct="false">Reflex angle</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. Which angle type comes between Obtuse and Reflex?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Acute</button><button class="choice-btn" data-correct="false">Right</button><button class="choice-btn" data-correct="true">Straight (180°)</button><button class="choice-btn" data-correct="false">Full turn</button></div><div class="feedback"></div></div>
</div>
<div class="math-talk">&#x1F3C6; <strong>Chapter 2 — 100% Complete!</strong>&nbsp; Point, Line Segment, Line, Ray, Angle, Comparing, Making, Special Types, Measuring, Protractor, All Angle Types — badhu cover thayu! Chapter 2 done! &#x1F4AF;</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; }
  }
};
