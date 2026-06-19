import { Redis } from '@upstash/redis';

const STATS_HASH = 'portfolio:project_stats';
const LIKES_SET_PREFIX = 'portfolio:likes:';

function getRedis() {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  return Redis.fromEnv();
}

function parseStatsHash(hash = {}) {
  const stats = {};

  for (const [key, value] of Object.entries(hash)) {
    const separator = key.lastIndexOf(':');
    if (separator === -1) continue;

    const slug = key.slice(0, separator);
    const field = key.slice(separator + 1);

    if (!stats[slug]) {
      stats[slug] = { likes: 0, views: 0 };
    }

    if (field === 'likes' || field === 'views') {
      stats[slug][field] = Number(value) || 0;
    }
  }

  return stats;
}

async function readStatsForSlug(redis, slug) {
  const [likes, views] = await Promise.all([
    redis.hget(STATS_HASH, `${slug}:likes`),
    redis.hget(STATS_HASH, `${slug}:views`)
  ]);

  return {
    slug,
    likes: Number(likes) || 0,
    views: Number(views) || 0
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const redis = getRedis();

  if (!redis) {
    return res.status(503).json({
      error: 'Storage not configured',
      message: 'Conecte o Upstash Redis ao projeto na Vercel para persistir visualizações e curtidas.'
    });
  }

  try {
    if (req.method === 'GET') {
      const hash = await redis.hgetall(STATS_HASH);
      return res.status(200).json(parseStatsHash(hash));
    }

    if (req.method === 'POST') {
      const { slug, action, visitorId } = req.body || {};

      if (!slug || typeof slug !== 'string') {
        return res.status(400).json({ error: 'Slug inválido' });
      }

      if (action === 'view') {
        await redis.hincrby(STATS_HASH, `${slug}:views`, 1);
        const stats = await readStatsForSlug(redis, slug);
        return res.status(200).json({ success: true, ...stats });
      }

      if (action === 'like') {
        if (!visitorId || typeof visitorId !== 'string') {
          return res.status(400).json({ error: 'visitorId obrigatório' });
        }

        const dedupKey = `${LIKES_SET_PREFIX}${slug}`;
        const added = await redis.sadd(dedupKey, visitorId);

        if (!added) {
          const stats = await readStatsForSlug(redis, slug);
          return res.status(200).json({
            success: false,
            alreadyLiked: true,
            ...stats
          });
        }

        await redis.hincrby(STATS_HASH, `${slug}:likes`, 1);
        const stats = await readStatsForSlug(redis, slug);
        return res.status(200).json({ success: true, ...stats });
      }

      return res.status(400).json({ error: 'Ação inválida' });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    console.error('Erro na API de stats:', error);
    return res.status(500).json({ error: 'Erro interno ao processar estatísticas' });
  }
}
