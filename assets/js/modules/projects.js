/**
 * Módulo de Projetos
 * Gerencia filtragem, modal e carrossel de projetos
 */

import { fetchJSON } from '../utils/helpers.js';

class Projects {
  constructor() {
    this.projectsContainer = document.querySelector('.projects__grid');
    this.filterButtons = document.querySelectorAll('.projects__filter-btn');
    this.modal = document.querySelector('.projects__modal');
    this.modalContent = document.querySelector('.projects__modal-content');
    this.modalClose = document.querySelector('.projects__modal-close');
    this.projects = [];
    this.activeFilter = 'all';

    this.init();
  }

  async init() {
    await this.loadProjects();
    this.setupFilters();
    this.setupModal();
    this.renderProjects();
  }

  /**
   * Carrega projetos do JSON
   */
  async loadProjects() {
    const data = await fetchJSON('/data/projects.json');
    if (data) {
      this.projects = data;
      // Carrega likes/views do localStorage
      this.projects.forEach(project => {
        const stored = localStorage.getItem(`project_${project.id}`);
        if (stored) {
          const data = JSON.parse(stored);
          project.likes = data.likes || project.likes;
          project.views = data.views || project.views;
        }
      });
    }
  }

  /**
   * Configura filtros
   */
  setupFilters() {
    this.filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.dataset.filter;
        this.setActiveFilter(filter);
        this.renderProjects();
      });
    });
  }

  /**
   * Define filtro ativo
   */
  setActiveFilter(filter) {
    this.activeFilter = filter;
    this.filterButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });
  }

  /**
   * Renderiza projetos filtrados
   */
  renderProjects() {
    if (!this.projectsContainer) return;

    const filteredProjects = this.activeFilter === 'all'
      ? this.projects
      : this.projects.filter(p => p.category === this.activeFilter);

    if (filteredProjects.length === 0) {
      this.projectsContainer.innerHTML = `
        <div class="projects__empty" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
          <p style="color: var(--color-text-secondary);">Nenhum projeto encontrado nesta categoria.</p>
        </div>
      `;
      return;
    }

    this.projectsContainer.innerHTML = filteredProjects.map(project => {
      return this.createProjectCard(project);
    }).join('');

    // Adiciona event listeners aos cards
    this.projectsContainer.querySelectorAll('.projects__card').forEach(card => {
      card.addEventListener('click', () => {
        const projectId = parseInt(card.dataset.projectId);
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
          this.openModal(project);
        }
      });
    });

    // Adiciona animações
    this.animateCards();
  }

  /**
   * Cria card de projeto
   */
  createProjectCard(project) {
    const imageUrl = project.image || './assets/images/projects/placeholder.jpg';
    const technologies = project.technologies || [];
    
    return `
      <div class="projects__card ${project.featured ? 'projects__card-featured' : ''}" 
           data-project-id="${project.id}">
        <div class="projects__card-image-wrapper">
          <img src="${imageUrl}" 
               alt="${project.title}" 
               class="projects__card-image"
               loading="lazy">
          <div class="projects__card-overlay">
            <a href="${project.liveUrl || '#'}" 
               class="projects__card-overlay-link" 
               target="_blank" 
               rel="noopener noreferrer"
               onclick="event.stopPropagation()">
              🔗
            </a>
            <a href="${project.githubUrl || '#'}" 
               class="projects__card-overlay-link" 
               target="_blank" 
               rel="noopener noreferrer"
               onclick="event.stopPropagation()">
              📂
            </a>
          </div>
        </div>
        <div class="projects__card-content">
          <div class="projects__card-header">
            <div>
              <h3 class="projects__card-title">${project.title}</h3>
              <span class="projects__card-category">${project.category}</span>
            </div>
          </div>
          <p class="projects__card-description">${project.description}</p>
          <div class="projects__card-tech">
            ${technologies.slice(0, 4).map(tech => 
              `<span class="projects__card-tech-item">${tech}</span>`
            ).join('')}
          </div>
          <div class="projects__card-footer">
            <div class="projects__card-stats">
              <span class="projects__card-stat">
                ❤️ ${project.likes || 0}
              </span>
              <span class="projects__card-stat">
                👁️ ${project.views || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Anima cards ao aparecer
   */
  animateCards() {
    const cards = this.projectsContainer.querySelectorAll('.projects__card');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '0';
            entry.target.style.transform = 'translateY(30px)';
            entry.target.style.transition = 'all 0.6s ease-out';
            
            requestAnimationFrame(() => {
              entry.target.style.opacity = '1';
              entry.target.style.transform = 'translateY(0)';
            });
          }, index * 100);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => observer.observe(card));
  }

  /**
   * Configura modal
   */
  setupModal() {
    if (!this.modal || !this.modalClose) return;

    // Fecha modal
    this.modalClose.addEventListener('click', () => this.closeModal());
    
    // Fecha ao clicar no backdrop
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('projects__modal-backdrop')) {
        this.closeModal();
      }
    });

    // Fecha com ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  /**
   * Abre modal com detalhes do projeto
   */
  openModal(project) {
    if (!this.modal) return;

    // Incrementa views
    project.views = (project.views || 0) + 1;
    this.saveProjectData(project);

    const imageUrl = project.image || './assets/images/projects/placeholder.jpg';
    const technologies = project.technologies || [];

    this.modalContent.innerHTML = `
      <button class="projects__modal-close" aria-label="Fechar modal">×</button>
      <div class="projects__modal-body">
        <img src="${imageUrl}" 
             alt="${project.title}" 
             class="projects__modal-image">
        <h2 class="projects__modal-title">${project.title}</h2>
        <p class="projects__modal-description">${project.longDescription || project.description}</p>
        <div class="projects__modal-tech">
          ${technologies.map(tech => 
            `<span class="projects__card-tech-item">${tech}</span>`
          ).join('')}
        </div>
        <div class="projects__modal-links">
          ${project.liveUrl ? `
            <a href="${project.liveUrl}" 
               class="btn btn-primary" 
               target="_blank" 
               rel="noopener noreferrer">
              Ver Projeto
            </a>
          ` : ''}
          ${project.githubUrl ? `
            <a href="${project.githubUrl}" 
               class="btn" 
               target="_blank" 
               rel="noopener noreferrer">
              Ver Código
            </a>
          ` : ''}
        </div>
      </div>
    `;

    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Reconfigura close button
    this.modalClose = this.modal.querySelector('.projects__modal-close');
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }
  }

  /**
   * Fecha modal
   */
  closeModal() {
    if (!this.modal) return;
    
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  /**
   * Salva dados do projeto no localStorage
   */
  saveProjectData(project) {
    localStorage.setItem(`project_${project.id}`, JSON.stringify({
      likes: project.likes,
      views: project.views
    }));
  }
}

export default Projects;
