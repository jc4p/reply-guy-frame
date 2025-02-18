const CACHE_TTL = 60 * 60 * 24; // 24 hours in seconds

async function kvGet(key) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.KV_BINDING}/values/${key}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get KV value: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching from KV:', error);
    return null;
  }
}

async function kvSet(key, value, expirationTtl = CACHE_TTL) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.KV_BINDING}/values/${key}`;
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${process.env.CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
      query: {
        expiration_ttl: expirationTtl,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to set KV value: ${response.statusText}`);
    }

    return true;
  } catch (error) {
    console.error('Error setting KV value:', error);
    return false;
  }
}

// Helper function to generate cache keys
function generateCacheKey(type, params) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  return `${type}:${sortedParams}`;
}

export async function getCachedData(type, params, fetchFn) {
  const cacheKey = generateCacheKey(type, params);
  
  // Try to get from cache first
  const cachedData = await kvGet(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // If not in cache, fetch fresh data
  const freshData = await fetchFn();
  
  // Store in cache
  await kvSet(cacheKey, freshData);
  
  return freshData;
}

// Specific cache functions for our use cases
export async function getCachedProfile(fid) {
  return getCachedData('profile', { fid }, async () => {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYAR_API_KEY
        }
      }
    );
    return response.json();
  });
}

export async function getCachedCasts(fid, cursor = null) {
  return getCachedData('casts', { fid, cursor }, async () => {
    const url = `https://api.neynar.com/v2/farcaster/feed/user/casts?fid=${fid}&limit=150&include_replies=true${cursor ? `&cursor=${cursor}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYAR_API_KEY
      }
    });
    return response.json();
  });
}

export async function getCachedReactions(fid, cursor = null) {
  return getCachedData('reactions', { fid, cursor }, async () => {
    const url = `https://api.neynar.com/v2/farcaster/reactions/user?fid=${fid}&type=all&limit=100${cursor ? `&cursor=${cursor}` : ''}`;
    const response = await fetch(url, {
      headers: {
        'accept': 'application/json',
        'api_key': process.env.NEYAR_API_KEY
      }
    });
    return response.json();
  });
} 