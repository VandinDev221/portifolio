/**
 * Agrega linguagens dos projetos (GitHub) e monta a seção de habilidades
 */

import { fetchJSON } from '../utils/helpers.js';

const TECH_ALIASES = {
  HTML5: 'HTML',
  CSS3: 'CSS',
  'Node': 'Node.js',
  Tailwind: 'Tailwind CSS'
};

function normalizeTech(name) {
  if (!name) return '';
  const trimmed = String(name).trim();
  return TECH_ALIASES[trimmed] || trimmed;
}

function collectProjectTechs(project) {
  const techs = new Set();

  (project.technologies || []).forEach(tech => techs.add(normalizeTech(tech)));

  Object.keys(project.languages || {}).forEach(lang => techs.add(normalizeTech(lang)));

  return [...techs];
}

function projectUsesGroup(techs, group) {
  return group.match.some(token => techs.includes(normalizeTech(token)));
}

function projectUsesManual(techs, manual) {
  return (manual.match || [manual.name]).some(token => techs.includes(normalizeTech(token)));
}

function calcPercentage(projectCount, totalProjects, fallback = 70) {
  if (!projectCount) return fallback;
  const ratio = projectCount / Math.max(totalProjects, 1);
  return Math.min(95, Math.max(55, Math.round(ratio * 100)));
}

function buildUsageMap(projects, config) {
  const totalProjects = projects.length;
  const usage = new Map();
  const hidden = new Set(config.hiddenLanguages || []);
  const groups = config.groups || {};
  const languageMeta = config.languageMeta || {};

  const register = (key, entry) => {
    if (!usage.has(key)) {
      usage.set(key, { ...entry, projectSlugs: new Set() });
    }
    return usage.get(key);
  };

  for (const project of projects) {
    const techs = collectProjectTechs(project);
    const slug = project.slug || project.title;

    for (const [groupKey, group] of Object.entries(groups)) {
      if (!projectUsesGroup(techs, group)) continue;
      const item = register(`group:${groupKey}`, {
        name: group.name,
        category: group.category,
        tooltip: group.tooltip
      });
      item.projectSlugs.add(slug);
    }

    for (const tech of techs) {
      if (hidden.has(tech)) continue;

      const grouped = Object.entries(groups).find(([, group]) =>
        projectUsesGroup([tech], group)
      );
      if (grouped) continue;

      const meta = languageMeta[tech] || {};
      const item = register(`lang:${tech}`, {
        name: meta.name || tech,
        category: meta.category || 'frontend',
        tooltip: meta.tooltip || `${tech} detectado nos repositórios`
      });
      item.projectSlugs.add(slug);
    }
  }

  for (const manual of config.manualSkills || []) {
    const matchedSlugs = new Set();

    for (const project of projects) {
      const techs = collectProjectTechs(project);
      if (projectUsesManual(techs, manual)) {
        matchedSlugs.add(project.slug || project.title);
      }
    }

    const item = register(`manual:${manual.name}`, {
      name: manual.name,
      category: manual.category,
      tooltip: manual.tooltip,
      fallbackPercentage: manual.percentage
    });
    matchedSlugs.forEach(slug => item.projectSlugs.add(slug));
  }

  const skills = [...usage.values()].map(item => {
    const count = item.projectSlugs.size;
    const percentage = count
      ? calcPercentage(count, totalProjects)
      : (item.fallbackPercentage || 70);

    const projectsLabel = count
      ? `Usado em ${count} de ${totalProjects} projetos`
      : 'Competência complementar';

    return {
      name: item.name,
      category: item.category,
      percentage,
      tooltip: count
        ? `${item.tooltip} · ${projectsLabel}`
        : item.tooltip,
      auto: count > 0
    };
  });

  return skills;
}

export function buildSkillsFromProjects(projects, config) {
  const skills = buildUsageMap(projects, config);
  const categoryMap = new Map(
    (config.categories || []).map(category => [
      category.id,
      { ...category, skills: [] }
    ])
  );

  for (const skill of skills) {
    const bucket = categoryMap.get(skill.category);
    if (bucket) bucket.skills.push(skill);
  }

  for (const category of categoryMap.values()) {
    category.skills.sort((a, b) => {
      if (b.percentage !== a.percentage) return b.percentage - a.percentage;
      return a.name.localeCompare(b.name, 'pt-BR');
    });
  }

  return [...categoryMap.values()].filter(category => category.skills.length > 0);
}

export function renderSkillsGrid(container, categories) {
  if (!container) return;

  if (!categories.length) {
    container.innerHTML = `
      <p class="skills__loading" style="grid-column: 1 / -1; text-align: center; color: var(--color-text-secondary);">
        Nenhuma habilidade detectada nos projetos.
      </p>
    `;
    return;
  }

  container.innerHTML = categories.map(category => `
    <div class="skills__category" data-animate-stagger>
      <h3 class="skills__category-title">
        <span class="skills__category-icon">${category.icon}</span>
        ${category.title}
      </h3>
      <div class="skills__list">
        ${category.skills.map(skill => `
          <div class="skills__item">
            <div class="skills__item-header">
              <span class="skills__item-name">${skill.name}</span>
              <span class="skills__item-percentage">${skill.percentage}%</span>
            </div>
            <div class="skills__item-bar">
              <div class="skills__item-progress" data-percentage="${skill.percentage}" style="width: 0%"></div>
            </div>
            <span class="skills__item-tooltip">${skill.tooltip}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');
}

export async function syncSkillsFromProjects(projects) {
  const config = await fetchJSON('/data/skills.json');
  return buildSkillsFromProjects(projects, config);
}
