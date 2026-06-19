/**
 * Módulo de Interações
 * Referência em sites de alto nível: barra de progresso, card tilt 3D, botões magnéticos, ripple
 */

class Interactions {
  constructor() {
    this.scrollProgress = document.getElementById('scroll-progress');
    this.magneticStrength = 0.2;
    this.tiltMax = 12;
    this.init();
  }

  init() {
    this.setupScrollProgress();
    this.setupCardTilt();
    this.setupMagneticButtons();
    this.setupRipple();
  }

  /**
   * Barra de progresso do scroll (topo da página)
   */
  setupScrollProgress() {
    if (!this.scrollProgress) return;
    const update = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      this.scrollProgress.style.width = `${percent}%`;
      this.scrollProgress.setAttribute('aria-valuenow', Math.round(percent));
    };
    window.addEventListener('scroll', update, { passive: true });
    update();
  }

  /**
   * Efeito tilt 3D nos cards (projetos e estatísticas)
   * Cards de projetos são criados dinamicamente; observamos o grid para anexar o efeito.
   */
  setupCardTilt() {
    const bindTilt = (card) => {
      if (card.dataset.tiltBound === '1') return;
      card.dataset.tiltBound = '1';
      card.style.transformStyle = 'preserve-3d';
      card.style.perspective = '1000px';
      card.addEventListener('mousemove', (e) => this.handleTilt(e, card));
      card.addEventListener('mouseleave', () => this.resetTilt(card));
    };

    document.querySelectorAll('.about__stat-card').forEach(bindTilt);

    const grid = document.querySelector('.projects__grid');
    if (grid) {
      grid.querySelectorAll('.projects__card').forEach(bindTilt);
      const observer = new MutationObserver(() => {
        grid.querySelectorAll('.projects__card').forEach(bindTilt);
      });
      observer.observe(grid, { childList: true, subtree: true });
    }
  }

  handleTilt(e, card) {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (y - 0.5) * -2 * this.tiltMax;
    const rotateY = (x - 0.5) * 2 * this.tiltMax;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px)`;
    card.style.transition = 'transform 0.1s ease-out';
  }

  resetTilt(card) {
    card.style.transform = '';
    card.style.transition = 'transform 0.4s ease-out';
  }

  /**
   * Botões magnéticos (hero e CTAs principais)
   */
  setupMagneticButtons() {
    const buttons = document.querySelectorAll('.hero__actions .btn, .btn[data-magnetic]');
    buttons.forEach(btn => {
      btn.addEventListener('mousemove', (e) => this.handleMagnetic(e, btn));
      btn.addEventListener('mouseleave', () => this.resetMagnetic(btn));
    });
  }

  handleMagnetic(e, btn) {
    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * this.magneticStrength;
    const y = (e.clientY - rect.top - rect.height / 2) * this.magneticStrength;
    btn.style.transform = `translate(${x}px, ${y}px) translateY(-3px) scale(1.02)`;
    btn.style.transition = 'transform 0.15s ease-out';
  }

  resetMagnetic(btn) {
    btn.style.transform = '';
    btn.style.transition = 'transform 0.3s ease-out';
  }

  /**
   * Efeito ripple ao clicar em botões/links principais
   */
  setupRipple() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.btn, .contact__form-submit, .projects__filter-btn');
      if (!btn) return;
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.cssText = `left:${x}px;top:${y}px;`;
      btn.style.position = 'relative';
      btn.style.overflow = 'hidden';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    });
  }
}

export default Interactions;
