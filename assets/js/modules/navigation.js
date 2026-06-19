/**
 * Módulo de Navegação
 * Gerencia scroll suave, highlight de seção ativa e menu mobile
 */

import { debounce } from '../utils/helpers.js';

class Navigation {
  constructor() {
    this.header = document.querySelector('.header');
    this.navLinks = document.querySelectorAll('.header__nav-link, .header__mobile-nav-link');
    this.menuToggle = document.querySelector('.header__menu-toggle');
    this.mobileMenu = document.querySelector('.header__mobile-menu');
    this.sections = document.querySelectorAll('section[id]');
    this.scrollToTopBtn = document.querySelector('.scroll-to-top');
    
    this.init();
  }

  init() {
    this.setupScrollListener();
    this.setupSmoothScroll();
    this.setupMobileMenu();
    this.setupScrollToTop();
    this.setupHeaderScroll();
  }

  /**
   * Configura listener de scroll para highlight de seção ativa
   */
  setupScrollListener() {
    const handleScroll = debounce(() => {
      this.updateActiveSection();
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
    this.updateActiveSection(); // Atualiza na carga inicial
  }

  /**
   * Atualiza seção ativa baseada na posição do scroll
   */
  updateActiveSection() {
    const scrollPosition = window.scrollY + 150;

    this.sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        this.navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  /**
   * Configura scroll suave para âncoras
   */
  setupSmoothScroll() {
    this.navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        
        if (href.startsWith('#')) {
          e.preventDefault();
          const targetId = href.substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            const headerHeight = this.header.offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            window.scrollTo({
              top: targetPosition,
              behavior: 'smooth'
            });

            // Fecha menu mobile se estiver aberto
            if (this.mobileMenu.classList.contains('active')) {
              this.closeMobileMenu();
            }
          }
        }
      });
    });
  }

  /**
   * Configura menu mobile
   */
  setupMobileMenu() {
    if (!this.menuToggle || !this.mobileMenu) return;

    this.menuToggle.addEventListener('click', () => {
      this.toggleMobileMenu();
    });

    // Fecha menu ao clicar fora
    document.addEventListener('click', (e) => {
      if (
        this.mobileMenu.classList.contains('active') &&
        !this.mobileMenu.contains(e.target) &&
        !this.menuToggle.contains(e.target)
      ) {
        this.closeMobileMenu();
      }
    });

    // Fecha menu ao pressionar ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.mobileMenu.classList.contains('active')) {
        this.closeMobileMenu();
      }
    });
  }

  /**
   * Alterna menu mobile
   */
  toggleMobileMenu() {
    this.menuToggle.classList.toggle('active');
    this.mobileMenu.classList.toggle('active');
    document.body.style.overflow = this.mobileMenu.classList.contains('active') ? 'hidden' : '';
  }

  /**
   * Fecha menu mobile
   */
  closeMobileMenu() {
    this.menuToggle.classList.remove('active');
    this.mobileMenu.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Configura botão scroll to top
   */
  setupScrollToTop() {
    if (!this.scrollToTopBtn) return;

    const handleScroll = debounce(() => {
      if (window.scrollY > 300) {
        this.scrollToTopBtn.classList.add('visible');
      } else {
        this.scrollToTopBtn.classList.remove('visible');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });

    this.scrollToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  /**
   * Configura efeito de scroll no header
   */
  setupHeaderScroll() {
    const handleScroll = debounce(() => {
      if (window.scrollY > 50) {
        this.header.classList.add('scrolled');
      } else {
        this.header.classList.remove('scrolled');
      }
    }, 100);

    window.addEventListener('scroll', handleScroll, { passive: true });
  }
}

export default Navigation;
