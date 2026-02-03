/**
 * Intro / Apresentação
 * Exibe sequência de frases e depois esconde o overlay
 */

const INTRO_PHRASES = [
  'Já pensou em ter um site?',
  'Uma loja virtual?',
  'Gerenciar o estoque da sua loja?',
  'Automações?',
  'Controle financeiro?',
  'E muito mais...'
];

const PHRASE_DURATION = 2200;
const FADE_OUT_BEFORE_NEXT = 400;
const CTA_DURATION = 3500;
const FINAL_FADE_DURATION = 800;

export default class Intro {
  constructor() {
    this.overlay = document.getElementById('intro-overlay');
    this.phraseEl = document.getElementById('intro-phrase');
    this.ctaEl = document.getElementById('intro-cta');
    this.btnEl = document.getElementById('intro-btn');
    this.skipEl = document.getElementById('intro-skip');

    if (!this.overlay || !this.phraseEl) return;

    this.ctaEl?.setAttribute('aria-hidden', 'true');
    this.btnEl?.setAttribute('aria-hidden', 'true');
    document.body.classList.add('intro-active');

    this.skipEl?.addEventListener('click', () => this.close());

    this.run();
  }

  run() {
    let index = 0;

    const showNext = () => {
      if (index < INTRO_PHRASES.length) {
        this.phraseEl.classList.remove('intro-overlay__phrase--out');
        this.phraseEl.textContent = INTRO_PHRASES[index];
        this.phraseEl.classList.add('intro-overlay__phrase--active');
        this.phraseEl.setAttribute('data-index', String(index));

        index += 1;

        setTimeout(() => {
          this.phraseEl.classList.remove('intro-overlay__phrase--active');
          this.phraseEl.classList.add('intro-overlay__phrase--out');
          setTimeout(showNext, FADE_OUT_BEFORE_NEXT);
        }, PHRASE_DURATION);
      } else {
        this.showCta();
      }
    };

    showNext();
  }

  showCta() {
    this.phraseEl.classList.remove('intro-overlay__phrase--active', 'intro-overlay__phrase--out');
    this.phraseEl.textContent = '';
    this.phraseEl.style.display = 'none';

    this.ctaEl?.classList.add('intro-overlay__cta--visible');
    this.ctaEl?.removeAttribute('aria-hidden');

    this.btnEl?.classList.add('intro-overlay__btn--visible');
    this.btnEl?.removeAttribute('aria-hidden');

    const once = (fn) => (e) => {
      if (e) e.preventDefault();
      fn();
    };
    this.btnEl?.addEventListener('click', once(() => this.close()));

    this.ctaTimeout = setTimeout(() => this.close(), CTA_DURATION);
  }

  close() {
    if (this._closed) return;
    this._closed = true;
    if (this.ctaTimeout) clearTimeout(this.ctaTimeout);

    this.overlay.classList.add('intro-overlay--hidden');
    document.body.classList.remove('intro-active');

    setTimeout(() => {
      this.overlay.remove();
      document.getElementById('home')?.scrollIntoView({ behavior: 'smooth' });
    }, FINAL_FADE_DURATION);
  }
}
