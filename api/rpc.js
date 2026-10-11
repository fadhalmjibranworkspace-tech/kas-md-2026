// Proxy server-side: browser -> /api/rpc -> Google Apps Script (doPost)
// GAS_URL dan GAS_SECRET diisi di Vercel > Settings > Environment Variables (tidak pernah terlihat browser).
const ALLOW = new Set([
  'login', 'cekSesi', 'logout',
  'tambahMahasiswa', 'hapusMahasiswa',
  'simpanKebutuhan', 'ubahStatusKebutuhan',
  'catatPembayaran', 'catatPelunasanBulk', 'catatDanaMasukLain',
  'catatPengeluaran', 'pindahDana',
  'koreksiTransaksi', 'batalkanTransaksi',
  'getVersi', 'getAppData', 'getVersiPublik', 'getDataPublik'
]);

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const body = req.body || {};
  const fn = body.fn, args = Array.isArray(body.args) ? body.args : [];
  if (!ALLOW.has(fn)) return res.status(400).json({ ok: false, error: 'Fungsi tidak dikenal' });
  if (!process.env.GAS_URL || !process.env.GAS_SECRET) {
    return res.status(500).json({ ok: false, error: 'Server belum dikonfigurasi (GAS_URL / GAS_SECRET)' });
  }

  try {
    const r = await fetch(process.env.GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // text/plain: GAS tidak butuh preflight
      body: JSON.stringify({ secret: process.env.GAS_SECRET, fn, args }),
      redirect: 'follow' // GAS membalas 302 ke googleusercontent.com, hasil JSON ada di sana
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); }
    catch (e) { return res.status(502).json({ ok: false, error: 'Respons Apps Script tidak valid. Cek deployment & akses "Anyone".' }); }
    return res.status(200).json(json);
  } catch (e) {
    return res.status(502).json({ ok: false, error: 'Tidak dapat menghubungi Apps Script: ' + e.message });
  }
};
