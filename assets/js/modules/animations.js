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
   * Configura animações baseadas em scroll
   */
  setupScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');
    
    if (elements.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(element => {
      observer.observe(element);
    });
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
   * Configura efeitos de hover
   */
  setupHoverEffects() {
    // Cards com efeito de elevação
    const cards = document.querySelectorAll('.card, .projects__card, .about__stat-card');
    
    cards.forEach(card => {
      card.addEventListener('mouseenter', function() {
        this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
      });
    });

    // Links com efeito de underline
    const links = document.querySelectorAll('a[data-hover-effect]');
    
    links.forEach(link => {
      link.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px)';
      });
      
      link.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
      });
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
