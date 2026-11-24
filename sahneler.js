'use strict';

const main = document.querySelector('#ilgiler');
const stage = main.querySelector('.sahneler');
const scenes = [...stage.querySelectorAll('figure')];
const dots = [...stage.querySelectorAll('.noktalar i')];
const progressBar = document.querySelector('.ilerleme');
const mascot = document.querySelector('.kose-maskotu');
const finale = document.querySelector('.aksam');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const desktop = matchMedia('(min-width: 768px) and (prefers-reduced-motion: no-preference)');
const clamp = n => Math.max(0, Math.min(1, n));
let timeline;
let frame = 0;
let jumped = false;
let jump;

function renderScenes(position) {
  const active = Math.min(2, Math.floor(position));
  scenes.forEach((scene, i) => {
    const enter = i === 0 ? 1 : clamp((position - i + 0.12) / 0.24);
    const leave = i === 2 ? 0 : clamp((position - i - 0.88) / 0.24);
    const opacity = enter * (1 - leave);
    scene.style.opacity = opacity;
    scene.style.visibility = opacity > 0 ? 'visible' : 'hidden';
    scene.querySelector('img').style.transform = 'scale(' + (0.95 + enter * 0.05) + ')';
    scene.querySelector('figcaption').style.transform = 'translateY(' + (1 - enter) * 24 + 'px)';
    scene.setAttribute('aria-hidden', String(i !== active));
    dots[i].classList.toggle('secili', active === i);
  });
}

function configure() {
  timeline?.scrollTrigger.kill();
  timeline?.kill();
  timeline = null;
  main.classList.remove('etkin', 'yerel');
  scenes.forEach(scene => {
    for (const el of [scene, scene.querySelector('img'), scene.querySelector('figcaption')]) {
      el.removeAttribute('style');
    }
    scene.removeAttribute('aria-hidden');
  });
  if (desktop.matches) {
    main.classList.add('etkin');
    renderScenes(0);
    if (window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      const state = { position: 0 };
      timeline = gsap.to(state, {
        position: scenes.length, ease: 'none', duration: 3,
        onUpdate: () => renderScenes(state.position),
        scrollTrigger: {
          trigger: stage, start: 'top top', end: () => '+=' + innerHeight * scenes.length,
          pin: true, scrub: true, invalidateOnRefresh: true
        }
      });
    } else {
      main.classList.add('yerel');
    }
  }
  if (reduced.matches) jump?.cancel();
  update();
}

function mix(from, to, t) {
  return 'rgb(' + from.map((v, i) => Math.round(v + (to[i] - v) * t)).join(',') + ')';
}

function update() {
  frame = 0;
  const max = document.documentElement.scrollHeight - innerHeight;
  const progress = max > 0 ? clamp(scrollY / max) : 0;
  if (main.classList.contains('yerel')) {
    renderScenes(3 * clamp(-main.getBoundingClientRect().top / (3 * innerHeight)));
  }
  const night = reduced.matches ? Number(progress >= 0.7) : clamp((progress - 0.47) / 0.47);
  document.body.style.setProperty('--zemin', mix([255,243,223], [11,24,48], night));
  document.body.style.setProperty('--yazi', night < 0.35 ? '#184d3b' : night < 0.56 ? '#081528' : '#fff3df');
  finale.style.setProperty('--ay', reduced.matches ? 1 : clamp((progress - 0.76) / 0.22));
  if (reduced.matches) {
    progressBar.style.removeProperty('transform');
    mascot.firstElementChild.style.removeProperty('transform');
    return;
  }
  progressBar.style.transform = 'scaleX(' + progress + ')';
  mascot.firstElementChild.style.transform = 'rotate(' + Math.sin(scrollY / 100) * 5 + 'deg)';
  if (!jumped && max > 0 && scrollY >= max - 2) {
    jumped = true;
    jump = mascot.animate([
      { transform: 'translateY(0)' }, { transform: 'translateY(-15px)', offset: 0.45 },
      { transform: 'translateY(0)' }
    ], { duration: 420, easing: 'ease-in-out' });
  }
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}
desktop.addEventListener('change', configure);
reduced.addEventListener('change', configure);
window.addEventListener('scroll', schedule, { passive: true });
window.addEventListener('resize', schedule);
window.addEventListener('load', () => { window.ScrollTrigger?.refresh(); schedule(); });
configure();

const biteOverlay = document.querySelector('.isirik');
const crunch = document.querySelector('#citirti');
const beep = document.querySelector('#bip');
let wobble;
function playCue(audio, volume) {
  audio.currentTime = 0;
  audio.volume = volume;
  audio.play().catch(() => {});
}
reduced.addEventListener('change', () => { if (reduced.matches) wobble?.cancel(); });
let clicks = 0;
let lastClick = -Infinity;
mascot.addEventListener('click', () => {
  if (!biteOverlay.hidden) return;
  const now = performance.now();
  clicks = now - lastClick <= 400 ? clicks + 1 : 1;
  lastClick = now;
  if (!reduced.matches) {
    wobble?.cancel();
    const direction = clicks % 2 ? 1 : -1;
    wobble = mascot.firstElementChild.animate([
      { transform: 'rotate(0)' },
      { transform: `translateX(${3 * direction}px) rotate(${16 * direction}deg)`, offset: 0.3 },
      { transform: `rotate(${-9 * direction}deg)`, offset: 0.65 },
      { transform: 'rotate(0)' }
    ], { duration: 200, easing: 'ease-out' });
  }
  if (clicks < 10) {
    playCue(beep, 0.22);
    return;
  }
  clicks = 0;
  biteOverlay.hidden = false;
  beep.pause();
  playCue(crunch, 0.55);
  window.setTimeout(() => biteOverlay.classList.add('isirdi'), 380);
  window.setTimeout(() => {
    biteOverlay.hidden = true;
    biteOverlay.classList.remove('isirdi');
  }, 850);
});
