/**
 * Sincroniza projetos automaticamente a partir do GitHub (deploys na Vercel)
 */

import { fetchJSON } from '../utils/helpers.js';

const VERCEL_PATTERN = /vercel\.app|vercel\.com/i;
const IMAGE_CACHE = new Map();
const PREVIEW_CACHE_KEY = 'portfolio_vercel_previews_v1';
const PREVIEW_CACHE_TTL = 1000 * 60 * 60 * 12; // 12 horas

const LANGUAGE_TECH = {
  JavaScript: ['JavaScript', 'HTML', 'CSS'],
  TypeScript: ['TypeScript', 'JavaScript'],
  HTML: ['HTML', 'CSS', 'JavaScript'],
  CSS: ['HTML', 'CSS'],
  PHP: ['PHP', 'MySQL'],
  Python: ['Python'],
  Vue: ['Vue.js', 'JavaScript'],
  React: ['React', 'JavaScript']
};

const GRADIENTS = [
  'linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%)',
  'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)',
  'linear-gradient(135deg, #0891b2 0%, #164e63 100%)',
  'linear-gradient(135deg, #0d9488 0%, #064e3b 100%)',
  'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
  'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
];

function formatRepoTitle(name) {
  return name
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, char => char.toUpperCase());
}

function inferCategory(repoName, homepage) {
  const value = `${repoName} ${homepage}`.toLowerCase();
  if (/dashboard|analytics|habit|metric/.test(value)) return 'dashboard';
  if (/landing|page|carros|alpha/.test(value)) return 'landing';
  return 'web';
}

function buildTechnologies(language, overrideTech) {
  if (overrideTech?.length) return overrideTech;
  if (!language) return ['Vercel'];
  const base = LANGUAGE_TECH[language] || [language];
  return base.includes('Vercel') ? base : [...base, 'Vercel'];
}

function gradientForRepo(repoName) {
  let hash = 0;
  for (let i = 0; i < repoName.length; i++) {
    hash = repoName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

async function imageExists(url) {
  if (IMAGE_CACHE.has(url)) return IMAGE_CACHE.get(url);
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const exists = response.ok;
    IMAGE_CACHE.set(url, exists);
    return exists;
  } catch {
    IMAGE_CACHE.set(url, false);
    return false;
  }
}

function normalizeUrl(url) {
  if (!url) return '';
  return url.replace(/\/$/, '');
}

function readPreviewCache() {
  try {
    const raw = sessionStorage.getItem(PREVIEW_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePreviewCache(cache) {
  try {
    sessionStorage.setItem(PREVIEW_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignora quota excedida
  }
}

function getCachedPreview(liveUrl) {
  const cache = readPreviewCache();
  const entry = cache[normalizeUrl(liveUrl)];
  if (!entry) return null;
  if (Date.now() - entry.ts > PREVIEW_CACHE_TTL) return null;
  return entry.url;
}

function setCachedPreview(liveUrl, previewUrl) {
  const cache = readPreviewCache();
  cache[normalizeUrl(liveUrl)] = { url: previewUrl, ts: Date.now() };
  writePreviewCache(cache);
}

/**
 * Gera URL de screenshot do site (fallback direto para <img>)
 */
function buildScreenshotUrl(liveUrl) {
  const normalized = normalizeUrl(liveUrl);
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(`${normalized}/`)}?w=800`;
}

/**
 * Busca prévia Open Graph / screenshot do deploy na Vercel via Microlink
 */
async function fetchVercelPreviewImage(liveUrl) {
  const cached = getCachedPreview(liveUrl);
  if (cached) return cached;

  const normalized = normalizeUrl(liveUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const endpoint = `https://api.microlink.io?url=${encodeURIComponent(normalized)}&screenshot=true&meta=false&viewport=1280x720`;
    const response = await fetch(endpoint, { signal: controller.signal });

    if (response.ok) {
      const payload = await response.json();
      const previewUrl = payload?.data?.screenshot?.url
        || payload?.data?.image?.url
        || null;

      if (previewUrl) {
        setCachedPreview(liveUrl, previewUrl);
        return previewUrl;
      }
    }
  } catch {
    // Usa fallback abaixo
  } finally {
    clearTimeout(timeout);
  }

  const fallbackUrl = buildScreenshotUrl(liveUrl);
  setCachedPreview(liveUrl, fallbackUrl);
  return fallbackUrl;
}

async function resolveProjectImage(repoName, overrideImage, liveUrl) {
  if (overrideImage) {
    return {
      image: overrideImage,
      imageGradient: null,
      imageSource: 'local'
    };
  }

  const candidates = [
    `./assets/images/projects/${repoName}.png`,
    `./assets/images/projects/${repoName}.jpg`,
    `./assets/images/projects/${repoName}.webp`
  ];

  for (const candidate of candidates) {
    if (await imageExists(candidate)) {
      return {
        image: candidate,
        imageGradient: null,
        imageSource: 'local'
      };
    }
  }

  if (liveUrl && isVercelDeploy(liveUrl)) {
    const previewImage = await fetchVercelPreviewImage(liveUrl);
    return {
      image: previewImage,
      imageGradient: gradientForRepo(repoName),
      imageSource: 'vercel'
    };
  }

  return {
    image: './assets/images/projects/placeholder.jpg',
    imageGradient: gradientForRepo(repoName),
    imageSource: 'gradient'
  };
}

function isVercelDeploy(homepage) {
  return Boolean(homepage && VERCEL_PATTERN.test(homepage));
}

function buildOverrideMap(overrides = []) {
  return new Map(overrides.map(item => [item.repo.toLowerCase(), item]));
}

function mergeProject(repo, override, index) {
  const repoName = repo.name;
  const liveUrl = override?.liveUrl || repo.homepage;
  const title = override?.title || formatRepoTitle(repoName);
  const description = override?.description
    || repo.description
    || `Projeto ${title} publicado na Vercel com deploy contínuo via GitHub.`;

  return {
    id: repo.id || index + 1,
    slug: repoName,
    title,
    description,
    longDescription: override?.longDescription || description,
    category: override?.category || inferCategory(repoName, liveUrl),
    technologies: buildTechnologies(repo.language, override?.technologies),
    image: override?.image || null,
    imageGradient: override?.imageGradient || null,
    liveUrl,
    githubUrl: repo.html_url,
    featured: override?.featured ?? index < 3,
    likes: 0,
    views: 0,
    updatedAt: repo.updated_at
  };
}

async function fetchGithubRepos(username) {
  const repos = [];
  let page = 1;

  while (page <= 5) {
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`
    );

    if (!response.ok) {
      throw new Error(`GitHub API: ${response.status}`);
    }

    const batch = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) break;

    repos.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

/**
 * Carrega projetos com deploy na Vercel e mescla metadados locais
 */
export async function syncProjectsFromVercel() {
  const config = await fetchJSON('/data/projects.json');
  const username = config?.githubUsername || 'VandinDev221';
  const excludeRepos = new Set(
    (config?.excludeRepos || ['portifolio', 'portfolio']).map(name => name.toLowerCase())
  );
  const overrideMap = buildOverrideMap(config?.overrides || []);

  try {
    const repos = await fetchGithubRepos(username);

    const deployed = repos
      .filter(repo => !repo.fork && !repo.private)
      .filter(repo => !excludeRepos.has(repo.name.toLowerCase()))
      .filter(repo => isVercelDeploy(repo.homepage))
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

    const projects = await Promise.all(
      deployed.map(async (repo, index) => {
        const override = overrideMap.get(repo.name.toLowerCase());
        const project = mergeProject(repo, override, index);
        const media = await resolveProjectImage(repo.name, project.image, project.liveUrl);
        project.image = media.image;
        project.imageSource = media.imageSource;
        if (!override?.imageGradient && media.imageGradient) {
          project.imageGradient = media.imageGradient;
        }
        return project;
      })
    );

    return { projects, source: 'github', error: null };
  } catch (error) {
    console.warn('Sincronização automática indisponível, usando overrides locais.', error);
    return buildFallbackProjects(config, overrideMap);
  }
}

async function buildFallbackProjects(config, overrideMap) {
  const overrides = config?.overrides || [];

  const projects = await Promise.all(
    overrides.map(async (override, index) => {
      const project = {
        id: index + 1,
        slug: override.repo,
        title: override.title,
        description: override.description,
        longDescription: override.longDescription || override.description,
        category: override.category || 'web',
        technologies: override.technologies || [],
        image: override.image || null,
        imageGradient: override.imageGradient || null,
        liveUrl: override.liveUrl || null,
        githubUrl: override.githubUrl || `https://github.com/${config?.githubUsername || 'VandinDev221'}/${override.repo}`,
        featured: override.featured ?? false,
        likes: 0,
        views: 0
      };

      const media = await resolveProjectImage(
        override.repo,
        project.image,
        project.liveUrl
      );
      project.image = media.image;
      project.imageSource = media.imageSource;
      if (!project.imageGradient && media.imageGradient) {
        project.imageGradient = media.imageGradient;
      }

      return project;
    })
  );

  return { projects, source: 'fallback', error: null };
}

/**
 * Atualiza contador de projetos na seção Sobre
 */
export function updateProjectStats(count) {
  const stat = document.querySelector('.about__stat-card .about__stat-number');
  const cards = document.querySelectorAll('.about__stat-card');

  cards.forEach(card => {
    const label = card.querySelector('.about__stat-label');
    const number = card.querySelector('.about__stat-number');
    if (label?.textContent?.includes('Projetos Publicados') && number) {
      number.textContent = String(count);
    }
  });
}
