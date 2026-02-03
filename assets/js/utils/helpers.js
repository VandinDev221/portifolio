/**
 * Funções auxiliares reutilizáveis
 */

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Verifica se elemento está visível no viewport
 */
export function isInViewport(element, threshold = 0) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth) + threshold
  );
}

/**
 * Obtém dados de um arquivo JSON
 */
export async function fetchJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar JSON:', error);
    return null;
  }
}

/**
 * Formata número com animação
 */
export function animateNumber(element, start, end, duration = 2000) {
  const startTime = performance.now();
  const isDecimal = end % 1 !== 0;
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const current = start + (end - start) * easeOutCubic(progress);
    element.textContent = isDecimal ? current.toFixed(1) : Math.floor(current);
    
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = isDecimal ? end.toFixed(1) : end;
    }
  }
  
  requestAnimationFrame(update);
}

/**
 * Easing function
 */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Gera ID único
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Sanitiza string para uso em HTML
 */
export function sanitizeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Detecta dispositivo móvel
 */
export function isMobile() {
  return window.innerWidth < 768;
}

/**
 * Detecta tablet
 */
export function isTablet() {
  return window.innerWidth >= 768 && window.innerWidth < 1024;
}

/**
 * Detecta desktop
 */
export function isDesktop() {
  return window.innerWidth >= 1024;
}
