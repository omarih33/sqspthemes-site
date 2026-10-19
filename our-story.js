/* SQSPThemes Our Story. Uses homepage-style panel system. */
(function(){
"use strict";
var root=document.getElementById("sqt-our-story");if(!root)return;
// Move the rendered site page out of Squarespace's narrow Code Block and fluid section.
// Only do this on the public site, leaving the editor's native blocks intact.
if(document.documentElement.classList.contains("sqt-on")){
  var page=document.getElementById("page");
  if(page&&page.parentNode){page.parentNode.insertBefore(root,page.nextSibling);document.documentElement.classList.add("sqt-story-active");}
}
root.innerHTML=`<div class="sqt-story-wrap" id="sqt-content" tabindex="-1">
 <header class="sqt-story-intro"><p class="sqt-story-kicker">SQSPTHEMES / INDEPENDENT SINCE 2015</p>
 <h1>Our Story</h1><p>How an unfinished theme shop became an independent guide to the Squarespace ecosystem.</p></header>
 <div class="sqt-story-layout">
  <article class="sqt-story-main" aria-label="Our Story">
   <section class="sqt-story-panel sqt-story-panel--lead"><div class="sqt-story-panel-head">THE SHORT VERSION <span>2015 — TODAY</span></div>
    <div class="sqt-story-panel-body"><h2 class="sqt-story-lead">I started SQSPThemes to sell Squarespace themes.</h2>
    <p class="sqt-story-turn">We never launched a single one.</p>
    <p class="sqt-story-summary">Eleven years later, the little business that came out of that false start has become an independent guide to the Squarespace ecosystem. Here's how that happened.</p></div>
   </section>
   <section class="sqt-story-panel sqt-story-section" id="beginning"><div class="sqt-story-panel-head">01 / The beginning</div><div class="sqt-story-panel-body">
    
    <h2>It started with a problem I couldn't Google.</h2>
    <p>Back in 2015, I was trying to make Squarespace do something it didn't do out of the box. I remember late nights with a crying baby in one arm, a laptop on my knee, and a dozen browser tabs that got me close to an answer but never quite there.</p>
    <p>I'd left my corporate job the year before. I wasn't sitting around trying to invent the next big software company. I was making things, figuring things out, and looking for a way to turn what I knew into something useful.</p>
    <p>The idea was to start a Squarespace theme shop. That's where the name SQSPThemes came from. I never got around to launching the themes.</p>
    <p>What I <em>did</em> have were solutions to small, frustrating Squarespace problems. And it turned out other people needed those too.</p>
   </div></section>
<section class="sqt-story-panel sqt-story-section" id="plugins"><div class="sqt-story-panel-head">02 / The plugin years</div><div class="sqt-story-panel-body">
    
    <h2>One fix led to another. Then another.</h2>
    <p>Those early tweaks turned into plugins. The plugins attracted designers and developers who were trying to get better work out the door. Then came studio owners, business owners, and companies building things for the same audience.</p>
    <p>Over time, more than 17,000 customers found their way to SQSPThemes. We built products, answered support questions, shared what we were learning, and got to know a lot of the people making a living with this platform.</p>
    <p>The funny part is that the best thing about running the shop wasn't always the products. It was getting a front-row seat to the problems people were trying to solve—and to the incredibly resourceful people solving them.</p>
   </div></section>
<aside class="sqt-story-panel"><div class="sqt-story-panel-head">A THOUGHT FROM THE JOURNEY</div><blockquote class="sqt-story-quote">Sometimes the most useful thing you can do is tell someone they don't need to buy anything.</blockquote></aside>
<section class="sqt-story-panel sqt-story-section" id="evolution"><div class="sqt-story-panel-head">03 / A bigger picture</div><div class="sqt-story-panel-body">
    
    <h2>The Squarespace ecosystem got bigger. So did my curiosity.</h2>
    <p>At some point, the conversation stopped being just about plugins. People wanted to know which template was worth buying. Who could build a particular feature. Whether a new app was any good. How to find better clients. What was changing on the platform—and what actually mattered.</p>
    <p>And the answers didn't all come from Squarespace, or from us. They came from independent developers, designers, educators, agencies, and small companies building useful things around the platform.</p>
    <p>I realized that was the part I most wanted to explore. Not just selling the next solution, but helping people find the <strong>right</strong> one.</p>
   </div></section>
<section class="sqt-story-panel sqt-story-section" id="today"><div class="sqt-story-panel-head">04 / SQSPThemes today</div><div class="sqt-story-panel-body">
    
    <h2>So we stopped being the shop.</h2>
    <p>In 2026, we retired our own plugin storefront and gave SQSPThemes a different job.</p>
    <p>Today, it's an independent guide for people building with Squarespace. We find and share templates, tools, developers, designers, ideas, and opportunities across the ecosystem. Sometimes that's a product. Sometimes it's a tutorial, a person to hire, or a feature you already have access to.</p>
    <p>I still like getting into the weeds. I still enjoy figuring out how things work. The difference is that now I get to point readers toward solutions whether we made them or not.</p>
    <p>And the name? It no longer describes everything we do. But after eleven years, it feels like a pretty good reminder of where this all began.</p>
   </div></section>
<section class="sqt-story-panel sqt-story-section" id="independence"><div class="sqt-story-panel-head">05 / How this works</div><div class="sqt-story-panel-body">
    
    <h2>Useful first. Commercial second.</h2>
    <p>Some links on SQSPThemes earn affiliate commissions, and we work with sponsors. Those relationships help support the research, writing, testing, and maintenance that go into keeping this site useful.</p>
    <p>But a recommendation only matters if you can trust the reasoning behind it. So I want to explain who something is for, where it makes sense, and where it doesn't—not pretend every new product is a must-have.</p>
    <p>There are a lot of ways to build a great Squarespace site. My job is to help you find the one that makes sense for <em>your</em> project.</p>
   </div></section>
<section class="sqt-story-panel sqt-story-section" id="explore"><div class="sqt-story-panel-head">06 / Make yourself at home</div><div class="sqt-story-panel-body">
    
    <h2>Here's where to start.</h2>
    <p>Whether you've been working with Squarespace for years or are figuring out your very first site, there should be something worth your attention here.</p>
    <ul class="sqt-story-links">
     <li><a href="/find-templates">Find a template →</a><span>Search the options without digging through dozens of separate shops.</span></li>
     <li><a href="/best-squarespace-designers">Find a designer →</a><span>Explore independent designers and studios working in the ecosystem.</span></li>
     <li><a href="/squarespace-integrations">Explore tools →</a><span>Apps, plugins, and integrations that extend what you can build.</span></li>
     <li><a href="/blog">Read the latest →</a><span>Ideas, reporting, experiments, and practical Squarespace finds.</span></li>
     <li><a href="/rfps">Find bigger projects →</a><span>Website opportunities for studios and agencies ready for more.</span></li>
    </ul>
   </div></section>
<section class="sqt-story-panel sqt-story-section" id="founder"><div class="sqt-story-panel-head">07 / A note from the founder</div><div class="sqt-story-panel-body">
    
    <h2>I'm still the person asking, “Is there a better way to do this?”</h2>
    <p>I'm Omari Harebin. I founded SQSPThemes in 2015, and I've spent much of the last decade learning from the people who build businesses and websites with Squarespace.</p>
    <p>I haven't done it alone. Developers, collaborators, support teammates, partners, and readers have shaped what this became. If you've ever bought something from us, sent me an email, pointed out a better solution, or shared one of our resources—thank you.</p>
    <p>I started this because I wished somebody would just point me toward the right answer. Eleven years later, that still feels like a worthwhile thing to do.</p>
    <div class="sqt-story-signature">
     <strong>Omari Harebin</strong>
     <span>FOUNDER, SQSPTHEMES</span>
    </div>
   </div></section>
   <section class="sqt-story-panel sqt-story-newsletter"><div class="sqt-story-panel-head">GET THE GOOD STUFF BY EMAIL</div><div class="sqt-story-panel-body"><div><h2>Useful Squarespace finds, delivered.</h2><p>Without having to go looking for them.</p></div><a href="/newsletter">Get the newsletter →</a></div></section>
  </article>
  <aside class="sqt-story-sidebar" aria-label="Our Story navigation">
    <section class="sqt-story-panel"><div class="sqt-story-panel-head">IN THIS STORY</div><nav class="sqt-story-side-body sqt-story-toc" aria-label="Jump to chapter"><a href="#beginning">01. The beginning</a>
<a href="#plugins">02. The plugin years</a>
<a href="#evolution">03. A bigger picture</a>
<a href="#today">04. SQSPThemes today</a>
<a href="#independence">05. How this works</a>
<a href="#explore">06. Start here</a>
<a href="#founder">07. From Omari</a></nav></section>
    <section class="sqt-story-panel"><div class="sqt-story-panel-head">ELSEWHERE ON THE SITE</div><div class="sqt-story-side-body"><p><a href="/blog">Latest articles →</a></p><p><a href="/newsletter">Newsletter →</a></p><p><a href="/contact">Get in touch →</a></p></div></section>
    <section class="sqt-story-panel"><div class="sqt-story-panel-head">INDEPENDENT PUBLICATION</div><div class="sqt-story-side-body"><p>SQSPThemes is not affiliated with Squarespace. Some links are affiliate links and we work with sponsors.</p></div></section>
  </aside>
 </div>
</div>`;
root.removeAttribute("aria-busy");
var skip=document.querySelector("#sqt-header .sqt-skip");if(skip)skip.href="#sqt-content";
})();
