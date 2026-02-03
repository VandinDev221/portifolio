/**
 * Utilitários de performance
 */

/**
 * Lazy load de imagens
 */
export function lazyLoadImages() {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
            observer.unobserve(img);
          }
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback para navegadores antigos
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  }
}

/**
 * Preload de recursos críticos
 */
export function preloadCriticalResources() {
  const criticalResources = [
    '/assets/css/main.css',
    '/assets/fonts/inter.woff2',
    '/assets/fonts/montserrat.woff2'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = resource.endsWith('.css') ? 'style' : 'font';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Mede performance
 */
export function measurePerformance() {
  if ('PerformanceObserver' in window) {
    try {
      const perfObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            console.log('Performance Metrics:', {
              domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
              loadComplete: entry.loadEventEnd - entry.loadEventStart,
              totalTime: entry.loadEventEnd - entry.fetchStart
            });
          }
        }
      });
      perfObserver.observe({ entryTypes: ['navigation'] });
    } catch (e) {
      console.warn('Performance Observer não suportado');
    }
  }
}

/**
 * Otimiza animações com requestAnimationFrame
 */
export function optimizeAnimations() {
  let ticking = false;

  function updateAnimations() {
    // Atualiza animações baseadas em scroll
    ticking = false;
  }

  function requestTick() {
    if (!ticking) {
      requestAnimationFrame(updateAnimations);
      ticking = true;
    }
  }

  window.addEventListener('scroll', requestTick, { passive: true });
}
