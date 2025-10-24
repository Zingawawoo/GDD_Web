console.log('main.js 1 loaded')

// ---------- Footer year ----------
{
    const y = document.getElementById('y');
    if (y) y.textContent = new Date().getFullYear();
}

// ---------- Card tilt + spotlight (per-card) ----------
for (const el of document.querySelectorAll('[data-tilt]')) {
    el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        const rx = ((y / r.height) - 0.5) * -6;
        const ry = ((x / r.width)  - 0.5) *  8;
        el.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
        el.style.setProperty('--mx', `${(x / r.width  * 100).toFixed(2)}%`);
        el.style.setProperty('--my', `${(y / r.height * 100).toFixed(2)}%`);
    });
    el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx','0deg');
        el.style.setProperty('--ry','0deg');
    });
}

// ---------- Background: stars + constellation ----------
(function bg(){
    const canvas = document.querySelector('canvas.stars');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let W = canvas.width = innerWidth;
    let H = canvas.height = innerHeight;
    addEventListener('resize', () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; });

    const STAR_COUNT = 260, NODE_COUNT = 70, MAX_LINK = 120;

    const stars = Array.from({length: STAR_COUNT}, () => ({
        x: Math.random()*W, y: Math.random()*H,
        r: Math.random()*1.9 + .8, vy: Math.random()*0.25 + 0.15,
        phase: Math.random()*Math.PI*2, tw: Math.random()*0.02 + 0.006
    }));
    const nodes = Array.from({length: NODE_COUNT}, () => ({
        x: Math.random()*W, y: Math.random()*H, vx:(Math.random()-.5)*.18, vy:(Math.random()-.5)*.18
    }));

    addEventListener('scroll', () => { canvas.style.transform = `translateY(${scrollY*0.03}px)`; });

    function frame(){
        ctx.clearRect(0,0,W,H);
        for (const s of stars){
            s.y += s.vy; s.phase += s.tw;
            if (s.y > H+6) { s.y = -6; s.x = Math.random()*W; }
            const glow = 0.5 + 0.5 * Math.sin(s.phase);
            const b = Math.round(200 + 55*glow);
            ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
            ctx.fillStyle = `rgba(${b},${b},255,${0.70 + 0.30*glow})`; ctx.fill();
        }
        for (const n of nodes){
            n.x += n.vx; n.y += n.vy;
            if (n.x < -20 || n.x > W+20) n.vx *= -1;
            if (n.y < -20 || n.y > H+20) n.vy *= -1;
        }
        for (let i=0;i<NODE_COUNT;i++){
            const a = nodes[i];
            for (let j=i+1;j<NODE_COUNT;j++){
                const b = nodes[j];
                const dx=a.x-b.x, dy=a.y-b.y, d2=dx*dx+dy*dy;
                if (d2 < MAX_LINK*MAX_LINK){
                    const d = Math.sqrt(d2), alpha = 1 - d / MAX_LINK, mix = alpha*0.5 + 0.25;
                    const r = Math.round(124*mix + 34*(1-mix));
                    const g = Math.round(58*mix  + 211*(1-mix));
                    const bl= Math.round(237*mix + 238*(1-mix));
                    ctx.strokeStyle = `rgba(${r},${g},${bl},${0.08 + alpha*0.18})`;
                    ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
                }
            }
        }
        for (const n of nodes){ ctx.beginPath(); ctx.arc(n.x,n.y,1.9,0,Math.PI*2); ctx.fillStyle='rgba(34,211,238,0.9)'; ctx.fill(); }
        requestAnimationFrame(frame);
    }
    frame();
})();

// ---------- Only disable teaser links ----------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.card.soon .cta').forEach(a =>
        a.addEventListener('click', e => e.preventDefault())
    );
});

// ---------- Optional stats badge ----------
(async function statsBadge(){
    try{
        const r = await fetch('stats', { headers:{ 'Accept':'application/json' } });
        if (!r.ok) return;
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        const s = await r.json();
        const hero = document.querySelector('.hero p');
        if (hero) {
            const tag = document.createElement('span');
            tag.style.cssText = "margin-left:8px;padding:2px 8px;border-radius:9999px;border:1px solid #1f2a39;background:#0f1420;color:#9fb3c8;font-size:12px";
            tag.textContent = `online: ${s.Players ?? s.players ?? 0}`;
            hero.append(tag);
        }
    } catch {}
})();

// ---------- Homepage calendar ----------
(async function loadEvents(){
    const root = document.getElementById('eventsList') || document.getElementById('eventsListBottom');
    if (!root) return;
    try{
        const r = await fetch('api/events', { headers:{ 'Accept':'application/json' }});
        if (!r.ok) return;
        const ct = r.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;
        const events = await r.json();
        const fmt = new Intl.DateTimeFormat(undefined,{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'});
        root.innerHTML = '';
        (events||[]).forEach(ev=>{
            const title = ev.title || ev.Title || 'Untitled';
            const start = new Date(ev.starts_at || ev.StartsAt);
            const end   = ev.ends_at || ev.EndsAt ? new Date(ev.ends_at || ev.EndsAt) : null;
            const m = start.toLocaleString(undefined,{month:'short'});
            const d = start.getDate();
            const el = document.createElement('div');
            el.className = 'event';
            el.innerHTML = `
        <div class="date"><div class="d">${d}</div><div class="m">${m}</div></div>
        <div>
          <div class="title">${escapeHTML(title)}</div>
          <div class="meta">${fmt.format(start)}${end ? ' — ' + fmt.format(end) : ''}${ev.location ? ' · ' + escapeHTML(ev.location) : ''}</div>
          ${ev.link ? `<a class="cta" style="margin-top:8px" href="${ev.link}" target="_blank" rel="noopener">Details ↗</a>` : ''}
        </div>`;
            root.appendChild(el);
        });
    } catch {}

    function escapeHTML(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
})();

// ---------- Sticky footer glow + slide-in ----------
window.addEventListener('scroll', () => {
    const footer = document.querySelector('footer');
    if (!footer) return;

    // When user nears bottom, reveal the dock
    const trigger = window.innerHeight + window.scrollY >= document.body.offsetHeight - 50;
    footer.classList.toggle('visible', trigger);
});

// ---------- Sticky footer reveal (IntersectionObserver) ----------
(function footerDock(){
    const footer = document.querySelector('footer');
    if (!footer) return;

    // Add animation class after first paint (prevents initial flash)
    requestAnimationFrame(() => footer.classList.add('dock-animate'));

    const io = new IntersectionObserver(([entry]) => {
        footer.classList.toggle('visible', entry.isIntersecting);
    }, { threshold: 0.15 });

    io.observe(footer);
})();

