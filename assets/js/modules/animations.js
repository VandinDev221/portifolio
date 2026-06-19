/**
 * Módulo de Animações
 * Gerencia animações baseadas em scroll e efeitos parallax
 */

class Animations {
  constructor() {
    this.animatedElements = [];
    this.init();
  }

  init() {
    this.setupScrollAnimations();
    this.setupParallax();
    this.setupHoverEffects();
  }

  /**
   * Configura animações baseadas em scroll (elementos com .animate-on-scroll)
   */
  setupScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    elements.forEach(el => observer.observe(el));

    /* Seções: ao entrar na tela, animar filhos com atraso (stagger) */
    const sections = document.querySelectorAll('.section:not(.hero)');
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const section = entry.target;
        section.classList.add('section-visible');
        const staggerItems = section.querySelectorAll('[data-animate-stagger]');
        staggerItems.forEach((el, i) => {
          el.style.animationDelay = `${i * 80}ms`;
          el.classList.add('animated');
        });
        sectionObserver.unobserve(section);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });
    sections.forEach(s => sectionObserver.observe(s));
  }

  /**
   * Configura efeitos parallax
   */
  setupParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;

    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      
      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const yPos = -(scrolled * speed);
        element.style.transform = `translateY(${yPos}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
  }

  /**
   * Configura efeitos de hover (reforçados)
   */
  setupHoverEffects() {
    const cards = document.querySelectorAll('.card, .projects__card, .about__stat-card, .contact__info-item');
    cards.forEach(card => {
      card.style.transition = 'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease';
    });

    document.querySelectorAll('a[data-hover-effect]').forEach(link => {
      link.addEventListener('mouseenter', () => { link.style.transform = 'translateY(-3px)'; });
      link.addEventListener('mouseleave', () => { link.style.transform = 'translateY(0)'; });
    });
  }

  /**
   * Anima contador numérico
   */
  animateCounter(element, target, duration = 2000) {
    const start = 0;
    const increment = target / (duration / 16);
    let current = start;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = Math.floor(target);
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 16);
  }

  /**
   * Anima barra de progresso
   */
  animateProgressBar(bar, target, duration = 1000) {
    bar.style.width = '0%';
    
    setTimeout(() => {
      bar.style.transition = `width ${duration}ms ease-out`;
      bar.style.width = `${target}%`;
    }, 100);
  }

  /**
   * Adiciona classe de animação com delay
   */
  animateWithDelay(element, className, delay = 0) {
    setTimeout(() => {
      element.classList.add(className);
    }, delay);
  }
}

export default Animations;
