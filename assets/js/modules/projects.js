/**
 * Módulo de Projetos
 * Gerencia filtragem, modal e carrossel de projetos
 */

import {
  syncProjectsFromVercel,
  updateProjectStats,
  startProjectsAutoSync
} from './projectSync.js';
import {
  fetchAllStats,
  applyStatsToProjects,
  recordView,
  recordLike,
  hasLikedLocally,
  startStatsPolling
} from './projectStats.js';

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
    this.projectsSyncTimer = null;
    this.statsPollTimer = null;

    this.init();
  }

  async init() {
    this.showLoading();
    await this.loadProjects();
    this.setupFilters();
    this.setupModal();
    this.setupDevOverlay();
    this.renderProjects();
    this.setupLiveUpdates();
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
    const remoteStats = await fetchAllStats();
    this.projects = applyStatsToProjects(projects, remoteStats);
    await this.incrementViewsOnPageAccess();
    updateProjectStats(this.projects.length);
  }

  setupLiveUpdates() {
    this.projectsSyncTimer = startProjectsAutoSync((freshProjects) => {
      const previousCount = this.projects.length;
      this.projects = applyStatsToProjects(freshProjects, null);
      updateProjectStats(this.projects.length);

      if (freshProjects.length !== previousCount) {
        this.renderProjects();
      }
    });

    this.statsPollTimer = startStatsPolling((remoteStats) => {
      this.projects = applyStatsToProjects(this.projects, remoteStats);
      this.refreshStatsInCards();
    });

    this.showLiveBadge();
  }

  showLiveBadge() {
    const container = document.querySelector('.projects__container');
    if (!container || document.getElementById('projects-live-badge')) return;

    const badge = document.createElement('p');
    badge.id = 'projects-live-badge';
    badge.className = 'projects__live-badge';
    badge.setAttribute('aria-live', 'polite');
    badge.textContent = 'Projetos e estatísticas atualizados em tempo real';
    container.insertBefore(badge, container.querySelector('.projects__filters'));
  }

  refreshStatsInCards() {
    if (!this.projectsContainer) return;

    this.projects.forEach(project => {
      const slug = project.slug || String(project.id);
      const card = this.projectsContainer.querySelector(`[data-project-slug="${slug}"]`);
      if (!card) return;

      const likeSpan = card.querySelector('.projects__card-like-btn span');
      const viewsStat = card.querySelector('[data-views-count]');

      if (likeSpan) likeSpan.textContent = project.likes || 0;
      if (viewsStat) viewsStat.textContent = `👁️ ${project.views || 0}`;
    });
  }

  /**
   * Registra visualizações na API (1x por sessão por projeto)
   */
  async incrementViewsOnPageAccess() {
    const sessionKey = 'portfolio_views_counted_v2';
    if (sessionStorage.getItem(sessionKey) === 'true') return;

    await Promise.all(
      this.projects.map(async project => {
        const slug = project.slug || String(project.id);
        const result = await recordView(slug);
        if (result) {
          project.views = result.views;
          project.likes = result.likes ?? project.likes;
        }
      })
    );

    sessionStorage.setItem(sessionKey, 'true');
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
    return hasLikedLocally(projectSlug);
  }

  async toggleLike(projectSlug, buttonEl) {
    if (this.hasLiked(projectSlug)) return;

    const project = this.projects.find(p => (p.slug || String(p.id)) === projectSlug);
    if (!project) return;

    const result = await recordLike(projectSlug);
    if (!result) return;

    project.likes = result.likes ?? project.likes;
    project.views = result.views ?? project.views;

    const span = buttonEl.querySelector('span');
    if (span) span.textContent = project.likes;
    if (result.success !== false) {
      buttonEl.classList.add('projects__card-like-btn--liked');
    }
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
              <span class="projects__card-stat" data-views-count>
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

  async openModal(project) {
    if (!this.modal) return;

    const slug = project.slug || String(project.id);
    const result = await recordView(slug);
    if (result) {
      project.views = result.views;
      project.likes = result.likes ?? project.likes;
      this.refreshStatsInCards();
    }

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
}

export default Projects;
