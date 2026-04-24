// ========== CHAPTER 1: PATTERNS IN MATHEMATICS ==========
window.chapters[1] = {
  title: "Patterns in Mathematics",
  color: "#2563eb",
  sections: [
    "1.1 What is Mathematics?",
    "1.2 Patterns in Numbers",
    "1.3 Visualising Number Sequences",
    "1.4 Relations among Number Sequences",
    "1.5 Patterns in Shapes",
    "1.6 Relation to Number Sequences"
  ],
  content: {
    "1.1": function() { return `
<div class="sec-heading" style="color:#2563eb">&#x1F4A1; 1.1 What is Mathematics?</div>
<p>Mathematics is all about finding <strong>patterns</strong> — and understanding <em>why</em> those patterns exist.</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>Look at a <strong>Rangoli</strong> on the floor — shapes repeat, colours follow a rule. Or think of a <strong>cricket match</strong>: 6 balls = 1 over, always! Maths helps us understand all these patterns!</p>
</div>
<p>Patterns are everywhere — in nature, in our homes, in the sky. Look around you!</p>
<div class="visual-wrap">
<svg viewBox="0 0 340 155" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="96" height="62" rx="10" fill="#dbeafe"/>
  <text x="56" y="32" text-anchor="middle" font-family="Baloo 2,cursive" font-size="20" fill="#1d4ed8">&#x1F305;</text>
  <text x="56" y="52" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#1e40af">Sun rises daily</text>
  <text x="56" y="64" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#3b82f6">same pattern!</text>
  <rect x="120" y="8" width="96" height="62" rx="10" fill="#dcfce7"/>
  <text x="168" y="32" text-anchor="middle" font-family="Baloo 2,cursive" font-size="20" fill="#16a34a">&#x1F3CF;</text>
  <text x="168" y="52" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#15803d">Cricket: 6 balls</text>
  <text x="168" y="64" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#16a34a">= 1 over, always</text>
  <rect x="232" y="8" width="100" height="62" rx="10" fill="#fce7f3"/>
  <text x="282" y="32" text-anchor="middle" font-family="Baloo 2,cursive" font-size="20" fill="#db2777">&#x1F33C;</text>
  <text x="282" y="52" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#be185d">Flower petals</text>
  <text x="282" y="64" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#db2777">follow a rule!</text>
  <rect x="8" y="82" width="96" height="62" rx="10" fill="#fffbeb"/>
  <text x="56" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="20" fill="#d97706">&#x1F372;</text>
  <text x="56" y="126" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#92400e">Recipe steps</text>
  <text x="56" y="138" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#b45309">same order, always</text>
  <rect x="120" y="82" width="96" height="62" rx="10" fill="#ede9fe"/>
  <text x="168" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="20" fill="#7c3aed">&#x1F6A6;</text>
  <text x="168" y="126" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#5b21b6">Traffic lights</text>
  <text x="168" y="138" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#6d28d9">Red, Yellow, Green</text>
  <rect x="232" y="82" width="100" height="62" rx="10" fill="#fff0f5"/>
  <text x="282" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="20" fill="#e11d48">&#x1F4C5;</text>
  <text x="282" y="126" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#9f1239">Calendar</text>
  <text x="282" y="138" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#be123c">7 days, repeating</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">Remember this!</div>
  <p>Maths does not just find patterns — it also explains <em>why</em> the pattern works. That is what makes maths so powerful!</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Can you think of 2 more patterns from your daily life? (Think: seasons, festivals, bus timings, school timetable...)</li>
    <li>How has maths helped make things like mobile phones, trains, and bridges? Discuss with a friend.</li>
  </ol>
</div>
<div class="math-talk">&#x1F4AC; <strong>Think &amp; Talk:</strong>&nbsp;Ask your friend — do they see any pattern in their school timetable?</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "1.2": function() { return `
<div class="sec-heading" style="color:#2563eb">&#x1F522; 1.2 Patterns in Numbers</div>
<p>The most basic patterns in maths are <strong>patterns made with numbers</strong>. Let us look at whole numbers:</p>
<div style="text-align:center;font-family:'Baloo 2',cursive;font-size:22px;font-weight:800;color:#1e293b;margin:10px 0;letter-spacing:3px;">0, 1, 2, 3, 4, ...</div>
<div class="concept-box">
  <div class="cb-title">New Word: Number Theory &amp; Number Sequence</div>
  <p>The part of maths that studies patterns in whole numbers is called <strong>number theory</strong>. A list of numbers that follow a rule is called a <strong>number sequence</strong>.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p><strong>Diwali diyas:</strong> 1 diya, 2 diyas, 3 diyas, 4 diyas... each day you add one more — that is the counting numbers sequence! <strong>Cricket overs:</strong> 6, 12, 18, 24 balls — always adding 6. That is multiples of 6!</p>
</div>
<div class="num-table">
  <div class="nt-title">Table 1: Important Number Sequences</div>
  <div class="seq-row"><span class="seq-nums">1, 1, 1, 1, 1, ...</span><span class="seq-name">All 1s</span></div>
  <div class="seq-row"><span class="seq-nums">1, 2, 3, 4, 5, 6, ...</span><span class="seq-name">Counting numbers</span></div>
  <div class="seq-row"><span class="seq-nums">1, 3, 5, 7, 9, 11, ...</span><span class="seq-name">Odd numbers</span></div>
  <div class="seq-row"><span class="seq-nums">2, 4, 6, 8, 10, 12, ...</span><span class="seq-name">Even numbers</span></div>
  <div class="seq-row"><span class="seq-nums">1, 3, 6, 10, 15, 21, ...</span><span class="seq-name">Triangular numbers</span></div>
  <div class="seq-row"><span class="seq-nums">1, 4, 9, 16, 25, 36, ...</span><span class="seq-name">Square numbers</span></div>
  <div class="seq-row"><span class="seq-nums">1, 8, 27, 64, 125, ...</span><span class="seq-name">Cube numbers</span></div>
  <div class="seq-row"><span class="seq-nums">1, 2, 3, 5, 8, 13, 21, ...</span><span class="seq-name">Virahanka numbers</span></div>
  <div class="seq-row"><span class="seq-nums">1, 2, 4, 8, 16, 32, ...</span><span class="seq-name">Powers of 2</span></div>
  <div class="seq-row"><span class="seq-nums">1, 3, 9, 27, 81, 243, ...</span><span class="seq-name">Powers of 3</span></div>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Can you see the rule in each sequence? Write the next 3 numbers for each in your notebook.</li>
    <li>Write the rule in your own words for: Odd numbers, Square numbers, Virahanka numbers.</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. Next number in 2, 4, 6, 8, ... is:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">9</button><button class="choice-btn" data-correct="true">10</button><button class="choice-btn" data-correct="false">11</button><button class="choice-btn" data-correct="false">12</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Which of these is a square number?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">10</button><button class="choice-btn" data-correct="false">15</button><button class="choice-btn" data-correct="true">25</button><button class="choice-btn" data-correct="false">30</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. In cricket, 5 overs = how many balls? (1 over = 6 balls)</div><div class="answer-choices"><button class="choice-btn" data-correct="false">24</button><button class="choice-btn" data-correct="false">28</button><button class="choice-btn" data-correct="true">30</button><button class="choice-btn" data-correct="false">36</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q4. The sequence 1, 3, 6, 10, 15, ... is called:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Odd numbers</button><button class="choice-btn" data-correct="true">Triangular numbers</button><button class="choice-btn" data-correct="false">Square numbers</button><button class="choice-btn" data-correct="false">Powers of 2</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "1.3": function() { return `
<div class="sec-heading" style="color:#2563eb">&#x1F441; 1.3 Visualising Number Sequences</div>
<p>We can <strong>draw pictures</strong> for number sequences. Pictures help us understand them much better!</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>During <strong>Navratri</strong>, diyas are arranged in rows: 1, then 2, then 3 — making a triangle! Those are <strong>triangular numbers</strong>. In a <strong>rangoli</strong>, dots in a square grid are <strong>square numbers</strong>!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 225" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Counting Numbers: 1, 2, 3, 4, 5</text>
  <circle cx="28" cy="40" r="7" fill="#2563eb"/>
  <text x="28" y="60" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">1</text>
  <circle cx="68" cy="35" r="7" fill="#2563eb"/><circle cx="83" cy="35" r="7" fill="#2563eb"/>
  <text x="75" y="60" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">2</text>
  <circle cx="120" cy="35" r="7" fill="#2563eb"/><circle cx="135" cy="35" r="7" fill="#2563eb"/><circle cx="150" cy="35" r="7" fill="#2563eb"/>
  <text x="135" y="60" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">3</text>
  <circle cx="183" cy="35" r="6" fill="#2563eb"/><circle cx="197" cy="35" r="6" fill="#2563eb"/><circle cx="211" cy="35" r="6" fill="#2563eb"/><circle cx="225" cy="35" r="6" fill="#2563eb"/>
  <text x="204" y="60" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">4</text>
  <circle cx="252" cy="35" r="5" fill="#2563eb"/><circle cx="264" cy="35" r="5" fill="#2563eb"/><circle cx="276" cy="35" r="5" fill="#2563eb"/><circle cx="288" cy="35" r="5" fill="#2563eb"/><circle cx="300" cy="35" r="5" fill="#2563eb"/>
  <text x="276" y="60" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">5</text>
  <line x1="8" y1="70" x2="332" y2="70" stroke="#e2e8f0" stroke-width="1"/>
  <text x="170" y="86" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Triangular Numbers (Navratri diya rows!): 1, 3, 6, 10</text>
  <circle cx="28" cy="104" r="7" fill="#f97316"/>
  <text x="28" y="124" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">1</text>
  <circle cx="70" cy="97" r="7" fill="#f97316"/>
  <circle cx="62" cy="111" r="7" fill="#f97316"/><circle cx="78" cy="111" r="7" fill="#f97316"/>
  <text x="70" y="129" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">3</text>
  <circle cx="128" cy="92" r="7" fill="#f97316"/>
  <circle cx="120" cy="106" r="7" fill="#f97316"/><circle cx="136" cy="106" r="7" fill="#f97316"/>
  <circle cx="112" cy="120" r="7" fill="#f97316"/><circle cx="128" cy="120" r="7" fill="#f97316"/><circle cx="144" cy="120" r="7" fill="#f97316"/>
  <text x="128" y="138" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">6</text>
  <circle cx="205" cy="86" r="6" fill="#f97316"/>
  <circle cx="198" cy="98" r="6" fill="#f97316"/><circle cx="212" cy="98" r="6" fill="#f97316"/>
  <circle cx="191" cy="110" r="6" fill="#f97316"/><circle cx="205" cy="110" r="6" fill="#f97316"/><circle cx="219" cy="110" r="6" fill="#f97316"/>
  <circle cx="184" cy="122" r="6" fill="#f97316"/><circle cx="198" cy="122" r="6" fill="#f97316"/><circle cx="212" cy="122" r="6" fill="#f97316"/><circle cx="226" cy="122" r="6" fill="#f97316"/>
  <text x="205" y="140" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">10</text>
  <line x1="8" y1="150" x2="332" y2="150" stroke="#e2e8f0" stroke-width="1"/>
  <text x="170" y="166" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Square Numbers (Rangoli dot grid!): 1, 4, 9, 16</text>
  <circle cx="28" cy="190" r="7" fill="#7c3aed"/><text x="28" y="210" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">1</text>
  <circle cx="67" cy="183" r="6" fill="#7c3aed"/><circle cx="80" cy="183" r="6" fill="#7c3aed"/>
  <circle cx="67" cy="196" r="6" fill="#7c3aed"/><circle cx="80" cy="196" r="6" fill="#7c3aed"/>
  <text x="73" y="212" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">4</text>
  <circle cx="118" cy="178" r="5" fill="#7c3aed"/><circle cx="130" cy="178" r="5" fill="#7c3aed"/><circle cx="142" cy="178" r="5" fill="#7c3aed"/>
  <circle cx="118" cy="190" r="5" fill="#7c3aed"/><circle cx="130" cy="190" r="5" fill="#7c3aed"/><circle cx="142" cy="190" r="5" fill="#7c3aed"/>
  <circle cx="118" cy="202" r="5" fill="#7c3aed"/><circle cx="130" cy="202" r="5" fill="#7c3aed"/><circle cx="142" cy="202" r="5" fill="#7c3aed"/>
  <text x="130" y="216" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">9</text>
  <circle cx="180" cy="176" r="4" fill="#7c3aed"/><circle cx="190" cy="176" r="4" fill="#7c3aed"/><circle cx="200" cy="176" r="4" fill="#7c3aed"/><circle cx="210" cy="176" r="4" fill="#7c3aed"/>
  <circle cx="180" cy="186" r="4" fill="#7c3aed"/><circle cx="190" cy="186" r="4" fill="#7c3aed"/><circle cx="200" cy="186" r="4" fill="#7c3aed"/><circle cx="210" cy="186" r="4" fill="#7c3aed"/>
  <circle cx="180" cy="196" r="4" fill="#7c3aed"/><circle cx="190" cy="196" r="4" fill="#7c3aed"/><circle cx="200" cy="196" r="4" fill="#7c3aed"/><circle cx="210" cy="196" r="4" fill="#7c3aed"/>
  <circle cx="180" cy="206" r="4" fill="#7c3aed"/><circle cx="190" cy="206" r="4" fill="#7c3aed"/><circle cx="200" cy="206" r="4" fill="#7c3aed"/><circle cx="210" cy="206" r="4" fill="#7c3aed"/>
  <text x="195" y="220" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#1e293b">16</text>
</svg>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Copy these dot patterns in your notebook. Draw the next picture for each sequence.</li>
    <li>Why are 1, 3, 6, 10... called <strong>triangular numbers</strong>? Why are 1, 4, 9, 16... called <strong>square numbers</strong>?</li>
    <li>Is 36 both a triangular AND a square number? Try drawing it both ways!</li>
    <li>Numbers 1, 7, 19, 37... are called <strong>hexagonal numbers</strong>. Draw them! What is the next one?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. Navratri diyas: 1 row, 2 rows, 3 rows, 4 rows. Total diyas in 4 rows?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">8</button><button class="choice-btn" data-correct="true">10</button><button class="choice-btn" data-correct="false">12</button><button class="choice-btn" data-correct="false">6</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. A square rangoli has 5 dots on each side. Total dots?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">20</button><button class="choice-btn" data-correct="false">16</button><button class="choice-btn" data-correct="true">25</button><button class="choice-btn" data-correct="false">30</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Next triangular number after 10 is:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">12</button><button class="choice-btn" data-correct="false">14</button><button class="choice-btn" data-correct="true">15</button><button class="choice-btn" data-correct="false">16</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "1.4": function() { return `
<div class="sec-heading" style="color:#2563eb">&#x1F517; 1.4 Relations among Number Sequences</div>
<p>Sometimes, two different number sequences are <strong>secretly connected</strong>. Let us discover some beautiful connections!</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>In <strong>Ludo</strong>, imagine scores: 1, 1+3=4, 1+3+5=9, 1+3+5+7=16... Each time we add the next odd number, we get a perfect <strong>square number</strong>! This happens every single time — not by luck!</p>
</div>
<p><strong>Pattern 1: Adding odd numbers always gives square numbers!</strong></p>
<div class="pattern-box">
  <div class="pline">1 = <span class="res">1</span></div>
  <div class="pline">1 + 3 = <span class="res">4</span></div>
  <div class="pline">1 + 3 + 5 = <span class="res">9</span></div>
  <div class="pline">1 + 3 + 5 + 7 = <span class="res">16</span></div>
  <div class="pline">1 + 3 + 5 + 7 + 9 = <span class="res">25</span></div>
  <div class="pline">1 + 3 + 5 + 7 + 9 + 11 = <span class="res">36</span></div>
  <div class="pline" style="font-size:16px">&#x22EE;</div>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 145" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="18" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#1e293b">Why? Each L-shape adds the next odd number to make a bigger square!</text>
  <rect x="55" y="28" width="96" height="96" rx="4" fill="#dbeafe" stroke="#2563eb" stroke-width="1"/>
  <line x1="55" y1="112" x2="151" y2="112" stroke="#ef4444" stroke-width="2.5"/>
  <line x1="55" y1="112" x2="55" y2="28" stroke="#ef4444" stroke-width="2.5"/>
  <text x="36" y="124" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#dc2626">+1</text>
  <line x1="55" y1="96" x2="135" y2="96" stroke="#f97316" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="135" y1="112" x2="135" y2="96" stroke="#f97316" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="158" y="108" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#ea580c">+3</text>
  <line x1="55" y1="80" x2="119" y2="80" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="119" y1="96" x2="119" y2="80" stroke="#16a34a" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="158" y="92" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#15803d">+5</text>
  <line x1="55" y1="64" x2="103" y2="64" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4,2"/>
  <line x1="103" y1="80" x2="103" y2="64" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="4,2"/>
  <text x="158" y="76" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#6d28d9">+7</text>
  <text x="158" y="60" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#b91c1c">+9</text>
  <text x="158" y="44" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#0369a1">+11</text>
  <text x="103" y="138" text-anchor="middle" font-family="Baloo 2,cursive" font-size="11" font-weight="700" fill="#2563eb">6x6 = 36 !</text>
</svg>
</div>
<p><strong>Pattern 2: Adding counting numbers up and down also gives square numbers!</strong></p>
<div class="pattern-box">
  <div class="pline">1 = <span class="res">1</span></div>
  <div class="pline">1 + 2 + 1 = <span class="res">4</span></div>
  <div class="pline">1 + 2 + 3 + 2 + 1 = <span class="res">9</span></div>
  <div class="pline">1 + 2 + 3 + 4 + 3 + 2 + 1 = <span class="res">16</span></div>
  <div class="pline" style="font-size:16px">&#x22EE;</div>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Sum of first 10 odd numbers = ? (Hint: it is a square number!)</li>
    <li>What do you get when you add All 1s: 1, 1+1, 1+1+1...? Which sequence?</li>
    <li>Add pairs of triangular numbers: 1+3, 3+6, 6+10, 10+15... What do you get?</li>
    <li>Powers of 2 added up: 1, 1+2, 1+2+4, 1+2+4+8... Add 1 to each. What happens?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. 1+3+5+7 = ? (Ludo score with 4 odd numbers)</div><div class="answer-choices"><button class="choice-btn" data-correct="false">9</button><button class="choice-btn" data-correct="false">15</button><button class="choice-btn" data-correct="true">16</button><button class="choice-btn" data-correct="false">18</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Sum of first 5 odd numbers = ?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">20</button><button class="choice-btn" data-correct="true">25</button><button class="choice-btn" data-correct="false">30</button><button class="choice-btn" data-correct="false">36</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. 1+3, 3+6, 6+10 gives 4, 9, 16... These are:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Odd numbers</button><button class="choice-btn" data-correct="false">Triangular numbers</button><button class="choice-btn" data-correct="true">Square numbers</button><button class="choice-btn" data-correct="false">Powers of 2</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "1.5": function() { return `
<div class="sec-heading" style="color:#2563eb">&#x1F4D0; 1.5 Patterns in Shapes</div>
<p>Just like numbers, <strong>shapes also form patterns</strong>! Shapes can be 1D (line), 2D (flat), or 3D (solid).</p>
<div class="concept-box">
  <div class="cb-title">New Word: Geometry</div>
  <p>The part of maths that studies patterns in shapes is called <strong>geometry</strong>. A list of shapes that follow a rule is a <strong>shape sequence</strong>.</p>
</div>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>A <strong>honeycomb</strong> (madhumakhi ka chhatta) — all cells are hexagons! <strong>Floor tiles</strong> in a mosque or temple form shape sequences. <strong>Kolam patterns</strong> in South India use regular polygon sequences!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 175" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Regular Polygons — more sides each time!</text>
  <polygon points="38,52 52,28 66,52" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
  <text x="52" y="68" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#b91c1c">Triangle (3)</text>
  <rect x="88" y="26" width="32" height="32" fill="#ffedd5" stroke="#f97316" stroke-width="2"/>
  <text x="104" y="70" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#c2410c">Square (4)</text>
  <polygon points="158,24 172,20 184,28 184,42 172,50 158,42 152,32" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
  <text x="168" y="68" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#92400e">Hexagon (6)</text>
  <polygon points="222,30 233,22 246,24 252,35 248,47 234,52 222,46 217,36" fill="#f3e8ff" stroke="#7c3aed" stroke-width="2"/>
  <text x="234" y="68" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#5b21b6">Octagon (8)</text>
  <text x="302" y="46" text-anchor="middle" font-family="Baloo 2,cursive" font-size="26" font-weight="800" fill="#94a3b8">...</text>
  <text x="170" y="82" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Sides: 3, 4, 5, 6, 7, 8... = counting numbers starting at 3!</text>
  <line x1="8" y1="90" x2="332" y2="90" stroke="#e2e8f0" stroke-width="1"/>
  <text x="170" y="106" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Stacked Squares — area = square numbers!</text>
  <rect x="30" y="114" width="24" height="24" fill="none" stroke="#0284c7" stroke-width="2"/>
  <text x="42" y="150" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#1e293b">1</text>
  <rect x="78" y="114" width="16" height="16" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="94" y="114" width="16" height="16" fill="none" stroke="#0284c7" stroke-width="1.5"/>
  <rect x="78" y="130" width="16" height="16" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="94" y="130" width="16" height="16" fill="none" stroke="#0284c7" stroke-width="1.5"/>
  <text x="94" y="156" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#1e293b">4</text>
  <rect x="136" y="111" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="148" y="111" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="160" y="111" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
  <rect x="136" y="123" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="148" y="123" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="160" y="123" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
  <rect x="136" y="135" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="148" y="135" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/><rect x="160" y="135" width="12" height="12" fill="none" stroke="#0284c7" stroke-width="1.5"/>
  <text x="150" y="156" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" font-weight="700" fill="#1e293b">9</text>
  <text x="230" y="135" text-anchor="middle" font-family="Baloo 2,cursive" font-size="24" font-weight="800" fill="#94a3b8">...</text>
  <text x="295" y="128" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#64748b">1, 4, 9, 16, 25...</text>
  <text x="295" y="143" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#94a3b8">Square numbers!</text>
  <text x="170" y="170" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Honeycomb, kolam, tiles — all use shape sequences!</text>
</svg>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Can you see the pattern in each shape sequence? Draw the next shape.</li>
    <li>Count sides of regular polygons: 3, 4, 5... Which number sequence is this?</li>
    <li>Why is a 3-sided regular polygon called a "triangle"? Why is 4-sided called "quadrilateral"?</li>
    <li>Count small squares in stacked squares: 1, 4, 9, 16... Which sequence? Why?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A honeycomb cell has 6 sides. What is it called?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Pentagon</button><button class="choice-btn" data-correct="true">Hexagon</button><button class="choice-btn" data-correct="false">Heptagon</button><button class="choice-btn" data-correct="false">Octagon</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Floor tiles in square pattern: 1, 4, 9, 16, __. What comes next?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">20</button><button class="choice-btn" data-correct="false">22</button><button class="choice-btn" data-correct="false">24</button><button class="choice-btn" data-correct="true">25</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. A regular polygon has 8 sides. It is called:</div><div class="answer-choices"><button class="choice-btn" data-correct="false">Hexagon</button><button class="choice-btn" data-correct="false">Heptagon</button><button class="choice-btn" data-correct="true">Octagon</button><button class="choice-btn" data-correct="false">Nonagon</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; },
    "1.6": function() { return `
<div class="sec-heading" style="color:#2563eb">&#x1F9E9; 1.6 Relation to Number Sequences</div>
<p>Shape sequences and number sequences are often <strong>secretly connected</strong>! Studying one helps us understand the other.</p>
<div class="india-example">
  <div class="ie-label">&#x1F1EE;&#x1F1F3; Indian Example</div>
  <p>In <strong>kabaddi</strong>, imagine players standing in a polygon: 3 players = triangle (3 sides), 4 players = square (4 sides), 5 players = pentagon (5 sides). The number of sides = counting numbers starting at 3!</p>
</div>
<div class="visual-wrap">
<svg viewBox="0 0 340 115" xmlns="http://www.w3.org/2000/svg">
  <text x="170" y="16" text-anchor="middle" font-family="Baloo 2,cursive" font-size="12" font-weight="700" fill="#1e293b">Sides of Regular Polygons → Number Sequence</text>
  <polygon points="45,50 55,30 65,50" fill="#fee2e2" stroke="#ef4444" stroke-width="2"/>
  <text x="55" y="65" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#b91c1c">3 sides</text>
  <text x="55" y="78" text-anchor="middle" font-family="Baloo 2,cursive" font-size="16" font-weight="800" fill="#ef4444">3</text>
  <rect x="90" y="28" width="26" height="26" fill="#ffedd5" stroke="#f97316" stroke-width="2"/>
  <text x="103" y="65" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#c2410c">4 sides</text>
  <text x="103" y="78" text-anchor="middle" font-family="Baloo 2,cursive" font-size="16" font-weight="800" fill="#f97316">4</text>
  <polygon points="158,24 172,20 183,28 181,42 163,48 150,38" fill="#fefce8" stroke="#ca8a04" stroke-width="2"/>
  <text x="165" y="65" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#92400e">5 sides</text>
  <text x="165" y="78" text-anchor="middle" font-family="Baloo 2,cursive" font-size="16" font-weight="800" fill="#ca8a04">5</text>
  <polygon points="216,26 228,20 241,24 245,36 238,47 224,50 212,42" fill="#f3e8ff" stroke="#7c3aed" stroke-width="2"/>
  <text x="228" y="65" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#5b21b6">6 sides</text>
  <text x="228" y="78" text-anchor="middle" font-family="Baloo 2,cursive" font-size="16" font-weight="800" fill="#7c3aed">6</text>
  <polygon points="278,30 289,22 302,24 308,34 304,46 290,50 278,44 273,34" fill="#e0f2fe" stroke="#0284c7" stroke-width="2"/>
  <text x="290" y="65" text-anchor="middle" font-size="10" font-family="Nunito,sans-serif" font-weight="700" fill="#0369a1">7 sides</text>
  <text x="290" y="78" text-anchor="middle" font-family="Baloo 2,cursive" font-size="16" font-weight="800" fill="#0284c7">7</text>
  <text x="170" y="96" text-anchor="middle" font-family="Nunito,sans-serif" font-size="11" font-weight="700" fill="#1e293b">Sequence: 3, 4, 5, 6, 7... = Counting numbers starting at 3!</text>
  <text x="170" y="110" text-anchor="middle" font-family="Nunito,sans-serif" font-size="10" fill="#64748b">Corners also = sides! A triangle has 3 sides AND 3 corners.</text>
</svg>
</div>
<div class="concept-box">
  <div class="cb-title">Key Idea</div>
  <p>"<strong>Regular</strong>" means ALL sides are equal AND all corners are equal. We will study corners (angles) in Chapter 2!</p>
</div>
<div class="fig-out">
  <div class="fo-hdr">&#x2699; Figure it Out</div>
  <ol>
    <li>Count sides of regular polygons: 3, 4, 5... Which sequence? Count corners too — same sequence? Why?</li>
    <li>A decagon has 10 sides. How many corners? Why?</li>
    <li>Count small squares in stacked squares: 1, 4, 9, 16... Which sequence? Why?</li>
    <li>Can you find a regular hexagon shape in your school or home?</li>
  </ol>
</div>
<div class="practice-section">
  <div class="ps-hdr">&#x1F3AF; Practice Time!</div>
  <div class="practice-q"><div class="pq-text">Q1. A regular polygon has 9 sides. How many corners?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">8</button><button class="choice-btn" data-correct="true">9</button><button class="choice-btn" data-correct="false">10</button><button class="choice-btn" data-correct="false">18</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q2. Kabaddi players in a hexagon = how many sides?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">5</button><button class="choice-btn" data-correct="true">6</button><button class="choice-btn" data-correct="false">7</button><button class="choice-btn" data-correct="false">8</button></div><div class="feedback"></div></div>
  <div class="practice-q"><div class="pq-text">Q3. Polygon sides go 3, 4, 5, 6, 7, 8, 9, __. What comes next?</div><div class="answer-choices"><button class="choice-btn" data-correct="false">9</button><button class="choice-btn" data-correct="true">10</button><button class="choice-btn" data-correct="false">11</button><button class="choice-btn" data-correct="false">12</button></div><div class="feedback"></div></div>
</div>
<div class="nav-buttons"><button class="nav-btn" id="prevSectionBtn">◀ Previous</button><button class="nav-btn" id="nextSectionBtn">Next ▶</button></div>`; }
  }
};
