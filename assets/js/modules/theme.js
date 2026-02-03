/**
 * Módulo de Tema
 * Gerencia toggle entre tema claro e escuro
 */

class Theme {
  constructor() {
    this.themeToggle = document.querySelector('.header__theme-toggle');
    this.currentTheme = localStorage.getItem('theme') || 'dark';
    this.init();
  }

  init() {
    this.setTheme(this.currentTheme);
    this.setupToggle();
    this.updateIcon();
  }

  /**
   * Configura toggle do tema
   */
  setupToggle() {
    if (!this.themeToggle) return;

    this.themeToggle.addEventListener('click', () => {
      this.toggleTheme();
    });
  }

  /**
   * Alterna entre temas
   */
  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(this.currentTheme);
    this.updateIcon();
    localStorage.setItem('theme', this.currentTheme);
  }

  /**
   * Define tema
   */
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    this.currentTheme = theme;
  }

  /**
   * Atualiza ícone do toggle
   */
  updateIcon() {
    if (!this.themeToggle) return;

    const icon = this.themeToggle.querySelector('span, i, svg') || this.themeToggle;
    
    if (this.currentTheme === 'dark') {
      icon.textContent = '☀️';
      icon.setAttribute('aria-label', 'Alternar para tema claro');
    } else {
      icon.textContent = '🌙';
      icon.setAttribute('aria-label', 'Alternar para tema escuro');
    }
  }
}

export default Theme;
