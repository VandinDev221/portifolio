/**
 * Módulo de Experiência
 * Gerencia timeline interativa
 */

import { fetchJSON } from '../utils/helpers.js';

class Experience {
  constructor() {
    this.timelineContainer = document.querySelector('.experience__timeline');
    this.experiences = [];
    this.init();
  }

  async init() {
    await this.loadExperiences();
    this.renderTimeline();
    this.setupAnimations();
  }

  /**
   * Carrega experiências do JSON
   */
  async loadExperiences() {
    const data = await fetchJSON('/data/experience.json');
    if (data) {
      this.experiences = data.sort((a, b) => {
        // Ordena por data (mais recente primeiro)
        return new Date(b.period.split(' - ')[0]) - new Date(a.period.split(' - ')[0]);
      });
    }
  }

  /**
   * Renderiza timeline
   */
  renderTimeline() {
    if (!this.timelineContainer) return;

    this.timelineContainer.innerHTML = this.experiences.map((exp, index) => {
      return this.createTimelineItem(exp, index);
    }).join('');

    // Adiciona event listeners
    this.timelineContainer.querySelectorAll('.experience__item').forEach(item => {
      item.addEventListener('click', () => {
        item.classList.toggle('expanded');
      });
    });
  }

  /**
   * Cria item da timeline
   */
  createTimelineItem(exp, index) {
    const technologies = exp.technologies || [];
    const typeLabel = exp.type === 'work' ? 'Trabalho' : 'Educação';
    const typeClass = exp.type === 'work' ? 'work' : 'education';

    return `
      <div class="experience__item animate-on-scroll" style="animation-delay: ${index * 100}ms">
        <div class="experience__item-marker"></div>
        <div class="experience__item-content">
          <span class="experience__item-type ${typeClass}">${typeLabel}</span>
          <h3 class="experience__item-title">${exp.title}</h3>
          <h4 class="experience__item-company">${exp.company}</h4>
          <p class="experience__item-period">${exp.period}</p>
          <p class="experience__item-description">${exp.description}</p>
          ${technologies.length > 0 ? `
            <div class="experience__item-tech">
              ${technologies.map(tech => 
                `<span class="experience__item-tech-item">${tech}</span>`
              ).join('')}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Configura animações
   */
  setupAnimations() {
    const items = this.timelineContainer.querySelectorAll('.experience__item');
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateX(-30px)';
            entry.target.style.transition = 'all 0.6s ease-out';
            
            requestAnimationFrame(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateX(0)';
            });
          }, index * 150);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.2
    });

    items.forEach(item => observer.observe(item));
  }
}

export default Experience;
