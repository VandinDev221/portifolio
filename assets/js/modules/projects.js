/**
 * Módulo de Projetos
 * Gerencia filtragem, modal e carrossel de projetos
 */

import { syncProjectsFromVercel, updateProjectStats } from './projectSync.js';

class Projects {
  constructor() {
    this.projectsContainer = document.querySelector('.projects__grid');
    this.filterButtons = document.querySelectorAll('.projects__filter-btn');
    this.modal = document.querySelector('.projects__modal');
    this.modalContent = document.querySelector('.projects__modal-content');
    this.modalClose = document.querySelector('.projects__modal-close');
    this.devOverlay = document.getElementById('projects-dev-overlay');
    this.devOverlayClose = document.getElementById('projects-dev-overlay-close');
    this.projects = [];
    this.activeFilter = 'all';

    this.init();
  }

  async init() {
    this.showLoading();
    await this.loadProjects();
    this.setupFilters();
    this.setupModal();
    this.setupDevOverlay();
    this.renderProjects();
  }

  showLoading() {
    if (!this.projectsContainer) return;
    this.projectsContainer.innerHTML = `
      <div class="projects__loading" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <p style="color: var(--color-text-secondary);">Sincronizando projetos da Vercel...</p>
      </div>
    `;
  }

  /**
   * Carrega projetos automaticamente do GitHub (deploys Vercel)
   */
  async loadProjects() {
    const { projects } = await syncProjectsFromVercel();
    this.projects = projects;

    this.projects.forEach(project => {
      const stored = localStorage.getItem(this.storageKey(project));
      if (stored) {
        const parsed = JSON.parse(stored);
        project.likes = parsed.likes ?? project.likes;
        project.views = parsed.views ?? project.views;
      }
    });

    this.incrementViewsOnPageAccess();
    updateProjectStats(this.projects.length);
  }

  storageKey(project) {
    return `project_${project.slug || project.id}`;
  }

  /**
   * Incrementa visualizações de todos os projetos ao acessar a página (1x por sessão)
   */
  incrementViewsOnPageAccess() {
    if (sessionStorage.getItem('portfolio_views_counted') === 'true') return;
    this.projects.forEach(project => {
      project.views = (project.views || 0) + 1;
      this.saveProjectData(project);
    });
    sessionStorage.setItem('portfolio_views_counted', 'true');
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

    this.projectsContainer.querySelectorAll('.projects__card').forEach(card => {
      card.addEventListener('click', () => {
        const projectSlug = card.dataset.projectSlug;
        const project = this.projects.find(p => (p.slug || String(p.id)) === projectSlug);
        if (project) {
          this.openModal(project);
        }
      });
    });

    this.projectsContainer.querySelectorAll('[data-dev-trigger]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDevOverlay();
      });
    });

    this.projectsContainer.querySelectorAll('.projects__card-like-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const projectSlug = btn.dataset.projectSlug;
        this.toggleLike(projectSlug, btn);
      });
    });

    this.animateCards();
    this.setupImageFallbacks();
  }

  setupImageFallbacks() {
    this.projectsContainer.querySelectorAll('.projects__card-image').forEach(img => {
      img.addEventListener('error', () => {
        const card = img.closest('.projects__card');
        const projectSlug = card?.dataset.projectSlug;
        const project = this.projects.find(p => (p.slug || String(p.id)) === projectSlug);
        const wrapper = img.closest('.projects__card-image-wrapper');

        if (!project?.imageGradient || !wrapper) return;

        img.remove();
        wrapper.classList.add('projects__card-image-wrapper--gradient');
        wrapper.style.setProperty('--card-gradient', project.imageGradient);
      }, { once: true });
    });
  }

  hasLiked(projectSlug) {
    return localStorage.getItem(`project_${projectSlug}_liked`) === 'true';
  }

  toggleLike(projectSlug, buttonEl) {
    if (this.hasLiked(projectSlug)) return;
    const project = this.projects.find(p => (p.slug || String(p.id)) === projectSlug);
    if (!project) return;
    project.likes = (project.likes || 0) + 1;
    this.saveProjectData(project);
    localStorage.setItem(`project_${projectSlug}_liked`, 'true');
    const span = buttonEl.querySelector('span');
    if (span) span.textContent = project.likes;
    buttonEl.classList.add('projects__card-like-btn--liked');
  }

  createProjectCard(project) {
    const imageUrl = project.image || '/assets/images/projects/placeholder.jpg';
    const technologies = project.technologies || [];
    const projectKey = project.slug || project.id;
    const hasGradient = project.imageGradient && (
      project.imageSource === 'gradient'
      || project.image?.includes('placeholder')
    );
    const gradientStyle = hasGradient ? `style="--card-gradient: ${project.imageGradient}"` : '';
    const wrapperClass = hasGradient ? 'projects__card-image-wrapper projects__card-image-wrapper--gradient' : 'projects__card-image-wrapper';
    
    return `
      <div class="projects__card ${project.featured ? 'projects__card-featured' : ''}" 
           data-project-slug="${projectKey}">
        <div class="${wrapperClass}" ${gradientStyle}>
          ${hasGradient ? '' : `<img src="${imageUrl}" 
               alt="${project.title}" 
               class="projects__card-image"
               loading="lazy"
               decoding="async"
               referrerpolicy="no-referrer"
               data-image-source="${project.imageSource || 'local'}">`}
          <div class="projects__card-overlay">
            ${project.inDevelopment
              ? `<button type="button" class="projects__card-overlay-link projects__card-overlay-link--dev" data-dev-trigger onclick="event.stopPropagation()" aria-label="Ver projeto">🔗</button>`
              : `<a href="${project.liveUrl || '#'}" 
               class="projects__card-overlay-link" 
               target="_blank" 
               rel="noopener noreferrer"
               onclick="event.stopPropagation()">🔗</a>`
            }
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
          ${technologies.length ? `
          <p class="projects__card-tech-label">Tecnologias utilizadas:</p>
          <div class="projects__card-tech">
            ${technologies.slice(0, 6).map(tech => 
              `<span class="projects__card-tech-item">${tech}</span>`
            ).join('')}
            ${technologies.length > 6 ? `<span class="projects__card-tech-item">+${technologies.length - 6}</span>` : ''}
          </div>
          ` : ''}
          <div class="projects__card-footer">
            <div class="projects__card-stats">
              <button type="button" 
                      class="projects__card-stat projects__card-like-btn ${this.hasLiked(projectKey) ? 'projects__card-like-btn--liked' : ''}" 
                      data-project-slug="${projectKey}" 
                      data-likes-count
                      onclick="event.stopPropagation()"
                      aria-label="Curtir projeto">
                ❤️ <span>${project.likes || 0}</span>
              </button>
              <span class="projects__card-stat">
                👁️ ${project.views || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

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

  setupModal() {
    if (!this.modal || !this.modalClose) return;

    this.modalClose.addEventListener('click', () => this.closeModal());
    
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal || e.target.classList.contains('projects__modal-backdrop')) {
        this.closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  setupDevOverlay() {
    if (!this.devOverlay || !this.devOverlayClose) return;
    this.devOverlayClose.addEventListener('click', () => this.closeDevOverlay());
    this.devOverlay.addEventListener('click', (e) => {
      if (e.target === this.devOverlay) this.closeDevOverlay();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.devOverlay.classList.contains('active')) {
        this.closeDevOverlay();
      }
    });
  }

  openDevOverlay() {
    if (!this.devOverlay) return;
    this.devOverlay.classList.add('active');
    this.devOverlay.setAttribute('aria-hidden', 'false');
    this.devOverlayClose?.focus();
  }

  closeDevOverlay() {
    if (!this.devOverlay) return;
    this.devOverlay.classList.remove('active');
    this.devOverlay.setAttribute('aria-hidden', 'true');
  }

  openModal(project) {
    if (!this.modal) return;

    project.views = (project.views || 0) + 1;
    this.saveProjectData(project);

    const imageUrl = project.image || '/assets/images/projects/placeholder.jpg';
    const technologies = project.technologies || [];
    const hasGradient = project.imageGradient && (
      project.imageSource === 'gradient'
      || project.image?.includes('placeholder')
    );

    this.modalContent.innerHTML = `
      <button class="projects__modal-close" aria-label="Fechar modal">×</button>
      <div class="projects__modal-body">
        ${hasGradient
          ? `<div class="projects__modal-image projects__modal-image--gradient" style="background: ${project.imageGradient}"></div>`
          : `<img src="${imageUrl}" 
             alt="${project.title}" 
             class="projects__modal-image">`
        }
        <h2 class="projects__modal-title">${project.title}</h2>
        ${technologies.length ? `
        <p class="projects__modal-tech-label">Tecnologias utilizadas: <strong>${technologies.join(', ')}</strong></p>
        ` : ''}
        <p class="projects__modal-description">${project.longDescription || project.description}</p>
        ${technologies.length ? `
        <div class="projects__modal-tech">
          ${technologies.map(tech => 
            `<span class="projects__card-tech-item">${tech}</span>`
          ).join('')}
        </div>
        ` : ''}
        <div class="projects__modal-links">
          ${project.liveUrl ? (project.inDevelopment
            ? `
            <button type="button" 
                    class="btn btn-primary projects__modal-btn-dev" 
                    data-dev-trigger>
              Ver Projeto
            </button>
          `
            : `
            <a href="${project.liveUrl}" 
               class="btn btn-primary" 
               target="_blank" 
               rel="noopener noreferrer">
              Ver Projeto
            </a>
          `) : ''}
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

    this.modalClose = this.modal.querySelector('.projects__modal-close');
    if (this.modalClose) {
      this.modalClose.addEventListener('click', () => this.closeModal());
    }

    const devTrigger = this.modal.querySelector('[data-dev-trigger]');
    if (devTrigger) {
      devTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        this.openDevOverlay();
      });
    }
  }

  closeModal() {
    if (!this.modal) return;
    
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  saveProjectData(project) {
    localStorage.setItem(this.storageKey(project), JSON.stringify({
      likes: project.likes,
      views: project.views
    }));
  }
}

export default Projects;
