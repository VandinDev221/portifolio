/**
 * Estatísticas persistentes de projetos (visualizações e curtidas)
 * Usa API /api/stats na Vercel com fallback local
 */

const API_URL = '/api/stats';
const VISITOR_KEY = 'portfolio_visitor_id';
const LIKED_PREFIX = 'portfolio_liked_';
const LOCAL_STATS_PREFIX = 'portfolio_stats_';

let statsPollTimer = null;
let statsAvailable = null;

export function getVisitorId() {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function hasLikedLocally(slug) {
  return localStorage.getItem(`${LIKED_PREFIX}${slug}`) === 'true';
}

function saveLocalStats(slug, stats) {
  localStorage.setItem(`${LOCAL_STATS_PREFIX}${slug}`, JSON.stringify(stats));
}

function readLocalStats(slug) {
  try {
    const raw = localStorage.getItem(`${LOCAL_STATS_PREFIX}${slug}`);
    return raw ? JSON.parse(raw) : { likes: 0, views: 0 };
  } catch {
    return { likes: 0, views: 0 };
  }
}

async function requestStats(method, body) {
  const response = await fetch(API_URL, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });

  if (response.status === 503) {
    statsAvailable = false;
    return null;
  }

  if (!response.ok) {
    throw new Error(`Stats API error: ${response.status}`);
  }

  statsAvailable = true;
  return response.json();
}

export async function fetchAllStats() {
  try {
    const data = await requestStats('GET');
    if (!data) return null;

    Object.entries(data).forEach(([slug, stats]) => {
      saveLocalStats(slug, stats);
    });

    return data;
  } catch (error) {
    console.warn('Não foi possível carregar estatísticas remotas.', error);
    statsAvailable = false;
    return null;
  }
}

export async function recordView(slug) {
  try {
    const result = await requestStats('POST', { slug, action: 'view' });
    if (result) {
      saveLocalStats(slug, { likes: result.likes, views: result.views });
      return result;
    }
  } catch (error) {
    console.warn(`Falha ao registrar view de ${slug}`, error);
  }

  const local = readLocalStats(slug);
  local.views = (local.views || 0) + 1;
  saveLocalStats(slug, local);
  statsAvailable = false;
  return { slug, ...local, fallback: true };
}

export async function recordLike(slug) {
  if (hasLikedLocally(slug)) {
    return { slug, ...readLocalStats(slug), alreadyLiked: true };
  }

  try {
    const result = await requestStats('POST', {
      slug,
      action: 'like',
      visitorId: getVisitorId()
    });

    if (result) {
      saveLocalStats(slug, { likes: result.likes, views: result.views });
      if (result.success !== false) {
        localStorage.setItem(`${LIKED_PREFIX}${slug}`, 'true');
      }
      return result;
    }
  } catch (error) {
    console.warn(`Falha ao registrar like de ${slug}`, error);
  }

  const local = readLocalStats(slug);
  local.likes = (local.likes || 0) + 1;
  saveLocalStats(slug, local);
  localStorage.setItem(`${LIKED_PREFIX}${slug}`, 'true');
  statsAvailable = false;
  return { slug, ...local, fallback: true };
}

export function applyStatsToProjects(projects, remoteStats = null) {
  return projects.map(project => {
    const slug = project.slug || String(project.id);
    const stats = remoteStats?.[slug] || readLocalStats(slug);

    return {
      ...project,
      likes: stats.likes ?? project.likes ?? 0,
      views: stats.views ?? project.views ?? 0
    };
  });
}

export function startStatsPolling(onUpdate, intervalMs = 15000) {
  stopStatsPolling();

  const poll = async () => {
    if (document.hidden) return;
    const stats = await fetchAllStats();
    if (stats) onUpdate(stats);
  };

  statsPollTimer = setInterval(poll, intervalMs);
  return statsPollTimer;
}

export function stopStatsPolling() {
  if (statsPollTimer) {
    clearInterval(statsPollTimer);
    statsPollTimer = null;
  }
}

export function isStatsServerAvailable() {
  return statsAvailable;
}
