const GITHUB_API = 'https://api.github.com';
const CACHE_SECONDS = 300;

function githubHeaders() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'VandinDev221-Portfolio'
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
}

async function githubFetch(path) {
  const response = await fetch(`${GITHUB_API}${path}`, {
    headers: githubHeaders()
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`GitHub API ${response.status}: ${body.slice(0, 200)}`);
  }

  return response.json();
}

function slimRepo(repo) {
  return {
    id: repo.id,
    name: repo.name,
    full_name: repo.full_name,
    description: repo.description,
    homepage: repo.homepage,
    html_url: repo.html_url,
    language: repo.language,
    updated_at: repo.updated_at,
    fork: repo.fork,
    private: repo.private
  };
}

async function fetchUserRepos(username) {
  const repos = [];
  let page = 1;

  while (page <= 5) {
    const batch = await githubFetch(
      `/users/${encodeURIComponent(username)}/repos?per_page=100&page=${page}&sort=updated`
    );

    if (!Array.isArray(batch) || batch.length === 0) break;

    repos.push(...batch.map(slimRepo));
    if (batch.length < 100) break;
    page += 1;
  }

  return repos;
}

async function fetchLanguagesMap(repos) {
  const languages = {};
  const targets = repos.filter(repo => !repo.fork && !repo.private);

  await Promise.all(
    targets.map(async (repo) => {
      try {
        const data = await githubFetch(`/repos/${repo.full_name}/languages`);
        languages[repo.name] = data || {};
      } catch (error) {
        console.warn(`Falha ao buscar linguagens de ${repo.full_name}:`, error.message);
        languages[repo.name] = {};
      }
    })
  );

  return languages;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=600`);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const username = String(req.query.username || 'VandinDev221').trim();

  if (!username) {
    return res.status(400).json({ error: 'username obrigatório' });
  }

  try {
    const repos = await fetchUserRepos(username);
    const languages = await fetchLanguagesMap(repos);

    return res.status(200).json({
      username,
      repos,
      languages,
      cachedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erro no proxy GitHub:', error);

    const isRateLimit = /403|429/.test(error.message);

    return res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit ? 'Limite da API GitHub atingido' : 'Erro ao consultar GitHub',
      message: error.message
    });
  }
}
