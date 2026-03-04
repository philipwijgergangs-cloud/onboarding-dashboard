const { put, list } = require('@vercel/blob');

const BLOB_NAME = 'onboarding-data.json';
const META_NAME = 'onboarding-meta.json';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    if (req.method === 'GET') {
      const dataList = await list({ prefix: BLOB_NAME });
      const metaList = await list({ prefix: META_NAME });

      let data = null;
      let meta = {};

      if (dataList.blobs.length > 0) {
        const resp = await fetch(dataList.blobs[0].downloadUrl);
        data = await resp.json();
      }
      if (metaList.blobs.length > 0) {
        const resp = await fetch(metaList.blobs[0].downloadUrl);
        meta = await resp.json();
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

      await put(BLOB_NAME, JSON.stringify(data), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      });

      const now = new Date().toISOString();
      await put(META_NAME, JSON.stringify({
        updatedAt: now,
        updatedBy: updatedBy || 'Unknown'
      }), {
        access: 'private',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      });

      return res.status(200).json({ success: true, updatedAt: now });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('API error:', err);
    return res.status(500).json({ error: err.message });
  }
};      const putResult = await blobPut(BLOB_NAME, JSON.stringify(data));

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
