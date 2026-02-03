/**
 * Módulo de Habilidades
 * Gerencia animação de barras de progresso e tooltips
 */

class Skills {
  constructor() {
    this.skillsContainer = document.querySelector('.skills__grid');
    this.progressBars = [];
    this.init();
  }

  init() {
    this.setupProgressBars();
    this.setupTooltips();
  }

  /**
   * Configura barras de progresso
   */
  setupProgressBars() {
    const progressBars = document.querySelectorAll('.skills__item-progress');
    
    if (progressBars.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const bar = entry.target;
          const percentage = bar.dataset.percentage || bar.closest('.skills__item').querySelector('.skills__item-percentage')?.textContent.replace('%', '');
          const target = parseInt(percentage) || 0;
          
          this.animateProgressBar(bar, target, 1500);
          observer.unobserve(bar);
        }
      });
    }, {
      threshold: 0.5
    });

    progressBars.forEach(bar => {
      observer.observe(bar);
    });
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
   * Configura tooltips
   */
  setupTooltips() {
    const skillItems = document.querySelectorAll('.skills__item');
    
    skillItems.forEach(item => {
      const tooltip = item.querySelector('.skills__item-tooltip');
      if (!tooltip) return;

      item.addEventListener('mouseenter', () => {
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
      });

      item.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
      });
    });
  }

  /**
   * Anima contador de estatísticas
   */
  animateStats() {
    const statNumbers = document.querySelectorAll('.about__stat-number');
    
    statNumbers.forEach(stat => {
      const target = parseInt(stat.textContent) || 0;
      if (target === 0) return;

      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.animateCounter(stat, target);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });

      observer.observe(stat);
    });
  }

  /**
   * Anima contador numérico
   */
  animateCounter(element, target) {
    const duration = 2000;
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
}

export default Skills;
