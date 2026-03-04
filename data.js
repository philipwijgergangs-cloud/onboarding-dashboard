const BLOB_NAME = 'onboarding-data.json';
const META_NAME = 'onboarding-meta.json';

async function blobList(prefix) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN not set');
  const res = await fetch('https://blob.vercel-storage.com?' + new URLSearchParams({ prefix }), {
    headers: { Authorization: 'Bearer ' + token }
  });
  if (!res.ok) throw new Error('Blob list failed: ' + res.status + ' ' + await res.text());
  const json = await res.json();
  return json.blobs || [];
}

async function blobGet(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Blob get failed: ' + res.status);
  return res.json();
}

async function blobPut(pathname, body) {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error('BLOB_READ_WRITE_TOKEN not set');
  const res = await fetch('https://blob.vercel-storage.com/' + pathname, {
    method: 'PUT',
    headers: {
      Authorization: 'Bearer ' + token,
      'x-content-type': 'application/json',
      'x-add-random-suffix': '0',
      'x-allow-overwrite': '1'
    },
    body: body
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error('Blob put failed: ' + res.status + ' ' + errText);
  }
  return res.json();
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const dataBlobs = await blobList(BLOB_NAME);
      const metaBlobs = await blobList(META_NAME);

      let data = null;
      let meta = {};

      if (dataBlobs.length > 0) {
        data = await blobGet(dataBlobs[0].url);
      }
      if (metaBlobs.length > 0) {
        meta = await blobGet(metaBlobs[0].url);
      }

      return res.status(200).json({
        data,
        updatedAt: meta.updatedAt || null,
        updatedBy: meta.updatedBy || null
      });
    }

    if (req.method === 'POST') {
      const { data, updatedBy } = req.body;
      if (!Array.isArray(data)) {
        return res.status(400).json({ error: 'Data must be an array.' });
      }

      const putResult = await blobPut(BLOB_NAME, JSON.stringify(data));

      const now = new Date().toISOString();
      await blobPut(META_NAME, JSON.stringify({
        updatedAt: now,
        updatedBy: updatedBy || 'Unknown'
      }));

      return res.status(200).json({ success: true, updatedAt: now, debug: putResult });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
};
