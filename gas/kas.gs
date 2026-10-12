/****** KONFIGURASI ******/
const SH = {
  MHS: 'Mahasiswa',        // NIM | Nama | Kelas
  KEB: 'Kebutuhan',        // ID | Judul | Nominal | MinCicilan | Status | Dibuat | Dibuat Oleh
  BAYAR: 'Pembayaran',     // ledger pemasukan (iuran + dana masuk lain)
  KELUAR: 'Pengeluaran',
  PINDAH: 'PerpindahanDana',
  ADMIN: 'Admin'           // Nama | Username | Password | Role (KETUA / BENDAHARA)
};
const HEAD = {
  MHS: ['NIM', 'Nama', 'Kelas'],
  KEB: ['ID', 'Judul', 'Nominal', 'MinCicilan', 'Status', 'Dibuat', 'Dibuat Oleh'],
  BAYAR: ['ID', 'Timestamp', 'Tanggal', 'Jam', 'KebutuhanID', 'NIM', 'Nama', 'Kelas', 'Nominal', 'Metode', 'Dicatat Oleh'],
  KELUAR: ['ID', 'Timestamp', 'Tanggal', 'Jam', 'Keterangan', 'Nominal', 'Metode', 'Dicatat Oleh', 'KebutuhanID'],
  PINDAH: ['ID', 'Timestamp', 'Tanggal', 'Jam', 'Dari', 'Ke', 'Nominal', 'Dicatat Oleh'],
  ADMIN: ['Nama', 'Username', 'Password', 'Role']
};
const TZ = 'Asia/Jakarta';
const KELAS = ['A', 'B', 'C'];
const ROLE_KETUA = 'KETUA', ROLE_BENDAHARA = 'BENDAHARA';
const LAIN = 'LAIN'; // KebutuhanID untuk dana masuk di luar iuran (donasi, sponsor, dll)
const METODE = ['CASH', 'TRANSFER'];
const SESI_DETIK = 6 * 60 * 60;

/****** SETUP (jalankan sekali dari editor Apps Script) ******/
function setupAwal() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(SH).forEach(k => {
    let s = ss.getSheetByName(SH[k]);
    if (!s) s = ss.insertSheet(SH[k]);
    if (s.getLastRow() === 0) {
      s.appendRow(HEAD[k]);
      s.getRange(1, 1, 1, HEAD[k].length).setFontWeight('bold').setBackground('#7d1831').setFontColor('#ffffff');
      s.setFrozenRows(1);
    }
  });
  const admin = ss.getSheetByName(SH.ADMIN);
  if (admin.getLastRow() < 2) {
    admin.appendRow(['Ketua Angkatan', 'ketua', 'GANTI-PASSWORD', ROLE_KETUA]);
    admin.appendRow(['Bendahara', 'bendahara', 'GANTI-PASSWORD', ROLE_BENDAHARA]);
  }
  // NIM harus tersimpan sebagai teks agar angka 0 di depan tidak hilang
  ss.getSheetByName(SH.MHS).getRange('A:A').setNumberFormat('@');
  ss.getSheetByName(SH.BAYAR).getRange('F:F').setNumberFormat('@');
}

/****** ENTRY POINT ******/
// Admin   : <url-web-app>             -> file HTML bernama "index"  (KAS.html)
// Mahasiswa: <url-web-app>?p=publik   -> file HTML bernama "publik" (hanya-baca)
function doGet(e) {
  const publik = !!(e && e.parameter && e.parameter.p === 'publik');
  return HtmlService.createHtmlOutputFromFile(publik ? 'publik' : 'index')
    .setTitle(publik ? "Transparansi Kas MD'26" : "Saku Angkatan MD'26")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
}

/****** UTIL ******/
function sheet_(name) {
  const s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!s) throw new Error('Sheet "' + name + '" belum ada. Jalankan setupAwal() dulu.');
  return s;
}
function rows_(name) { // array of objects, header-based; Date -> teks
  const s = sheet_(name);
  if (s.getLastRow() < 2) return [];
  const v = s.getDataRange().getValues();
  const h = v[0].map(x => String(x).trim());
  return v.slice(1).map((r, i) => {
    const o = { _row: i + 2 };
    h.forEach((k, j) => o[k] = r[j] instanceof Date ? Utilities.formatDate(r[j], TZ, 'yyyy-MM-dd HH:mm:ss') : r[j]);
    return o;
  });
}
function append_(name, obj) {
  const s = sheet_(name);
  const h = HEAD[Object.keys(SH).find(k => SH[k] === name)];
  s.appendRow(h.map(k => obj[k] === undefined ? '' : obj[k]));
}
function wib_() {
  const n = new Date();
  return {
    Timestamp: Utilities.formatDate(n, TZ, 'yyyy-MM-dd HH:mm:ss'),
    Tanggal: Utilities.formatDate(n, TZ, 'dd/MM/yyyy'),
    Jam: Utilities.formatDate(n, TZ, 'HH:mm:ss')
  };
}
const idBaru_ = p => p + new Date().getTime() + Math.floor(Math.random() * 100);
const str_ = v => String(v === null || v === undefined ? '' : v).trim();
const rp_ = n => 'Rp ' + (Number(n) || 0).toLocaleString('id-ID');
function metode_(m) {
  const v = str_(m || 'CASH').toUpperCase();
  if (METODE.indexOf(v) === -1) throw new Error('Metode harus CASH atau TRANSFER');
  return v;
}
function nominal_(n, label) {
  n = Math.round(Number(n));
  if (!n || n <= 0) throw new Error((label || 'Nominal') + ' harus lebih dari 0');
  return n;
}
function kunci_(fn) { // lock + try/catch seragam
  const lock = LockService.getDocumentLock();
  try { lock.waitLock(30000); const r = fn(); if (r && r.success) naikVersi_(); return r; }
  catch (e) { return { success: false, message: e.message }; }
  finally { if (lock.hasLock()) lock.releaseLock(); }
}

/****** VERSI DATA (penanda perubahan untuk sinkron realtime) ******/
// Klien cukup menanyakan versi (sangat murah). Data penuh hanya diambil bila versinya berubah.
function versi_() {
  const cache = CacheService.getScriptCache();
  let v = cache.get('versi');
  if (v) return v;
  const props = PropertiesService.getScriptProperties();
  v = props.getProperty('VERSI');
  if (!v) { v = String(Date.now()); props.setProperty('VERSI', v); }
  cache.put('versi', v, 21600);
  return v;
}
function naikVersi_() {
  const v = Date.now() + '' + Math.floor(Math.random() * 1000);
  PropertiesService.getScriptProperties().setProperty('VERSI', v);
  CacheService.getScriptCache().put('versi', v, 21600);
}

/****** AUTH & ROLE ******/
// Token disimpan di cache server; role SELALU dicek di server, bukan dari klien.
function login(username, password) {
  try {
    const admin = rows_(SH.ADMIN).find(a => str_(a.Username) === str_(username) && str_(a.Password) === str_(password));
    if (!admin) return { success: false, message: 'Username atau password salah' };
    const role = str_(admin.Role).toUpperCase() === ROLE_KETUA ? ROLE_KETUA : ROLE_BENDAHARA;
    const token = Utilities.getUuid();
    const user = { nama: str_(admin.Nama), username: str_(admin.Username), role: role };
    CacheService.getScriptCache().put('sesi_' + token, JSON.stringify(user), SESI_DETIK);
    return { success: true, token: token, user: user };
  } catch (e) { return { success: false, message: e.message }; }
}
function cekSesi(token) {
  try { return { success: true, user: auth_(token) }; }
  catch (e) { return { success: false, message: e.message }; }
}
function logout(token) { CacheService.getScriptCache().remove('sesi_' + token); return { success: true }; }
function auth_(token, wajibKetua) {
  const raw = token && CacheService.getScriptCache().get('sesi_' + token);
  if (!raw) throw new Error('Sesi berakhir, silakan login lagi');
  const user = JSON.parse(raw);
  if (wajibKetua && user.role !== ROLE_KETUA) throw new Error('Hanya Ketua Angkatan yang boleh melakukan ini');
  return user;
}

/****** MAHASISWA (Ketua) ******/
function tambahMahasiswa(token, daftar) { // daftar: [{nim, nama, kelas}]
  return kunci_(() => {
    auth_(token, true);
    if (!Array.isArray(daftar) || !daftar.length) throw new Error('Data mahasiswa kosong');
    const ada = new Set(rows_(SH.MHS).map(m => str_(m.NIM)));
    const baru = [];
    daftar.forEach(d => {
      const nim = str_(d.nim), nama = str_(d.nama), kelas = str_(d.kelas).toUpperCase();
      if (!nim || !nama) throw new Error('NIM dan nama wajib diisi');
      if (KELAS.indexOf(kelas) === -1) throw new Error('Kelas harus A, B, atau C (' + nama + ')');
      if (ada.has(nim)) throw new Error('NIM sudah terdaftar: ' + nim);
      ada.add(nim);
      baru.push([nim, nama, kelas]);
    });
    const s = sheet_(SH.MHS);
    s.getRange(s.getLastRow() + 1, 1, baru.length, 3).setNumberFormat('@').setValues(baru);
    return { success: true, message: baru.length + ' mahasiswa ditambahkan' };
  });
}
function hapusMahasiswa(token, nim) {
  return kunci_(() => {
    auth_(token, true);
    if (rows_(SH.BAYAR).some(p => str_(p.NIM) === str_(nim))) {
      throw new Error('Mahasiswa sudah punya riwayat pembayaran. Batalkan transaksinya dulu.');
    }
    const m = rows_(SH.MHS).find(x => str_(x.NIM) === str_(nim));
    if (!m) throw new Error('Mahasiswa tidak ditemukan');
    sheet_(SH.MHS).deleteRow(m._row);
    return { success: true, message: 'Mahasiswa dihapus' };
  });
}

/****** KEBUTUHAN / IURAN (Ketua) ******/
function simpanKebutuhan(token, data) { // data: {id?, judul, nominal, minCicilan}
  return kunci_(() => {
    const user = auth_(token, true);
    const judul = str_(data.judul);
    if (!judul) throw new Error('Judul kebutuhan wajib diisi');
    const nominal = nominal_(data.nominal, 'Nominal per mahasiswa');
    const min = Math.round(Number(data.minCicilan) || 0);
    if (min < 0 || min > nominal) throw new Error('Minimal cicilan harus antara 0 dan nominal iuran');
    if (data.id) {
      const k = rows_(SH.KEB).find(x => str_(x.ID) === str_(data.id));
      if (!k) throw new Error('Kebutuhan tidak ditemukan');
      const dibayar = rows_(SH.BAYAR).filter(p => str_(p.KebutuhanID) === str_(data.id));
      // nominal tidak boleh lebih kecil dari yang sudah dibayar seorang mahasiswa
      const total = {};
      dibayar.forEach(p => total[p.NIM] = (total[p.NIM] || 0) + Number(p.Nominal));
      const tertinggi = Object.keys(total).reduce((m, n) => Math.max(m, total[n]), 0);
      if (nominal < tertinggi) throw new Error('Nominal tidak boleh di bawah ' + rp_(tertinggi) + ' (sudah ada yang membayar sebesar itu)');
      sheet_(SH.KEB).getRange(k._row, 2, 1, 3).setValues([[judul, nominal, min]]);
      return { success: true, message: 'Kebutuhan diperbarui' };
    }
    append_(SH.KEB, { ID: idBaru_('B'), Judul: judul, Nominal: nominal, MinCicilan: min, Status: 'AKTIF',
      Dibuat: wib_().Timestamp, 'Dibuat Oleh': user.nama });
    return { success: true, message: 'Kebutuhan "' + judul + '" dibuat' };
  });
}
function ubahStatusKebutuhan(token, id, status) {
  return kunci_(() => {
    auth_(token, true);
    const k = rows_(SH.KEB).find(x => str_(x.ID) === str_(id));
    if (!k) throw new Error('Kebutuhan tidak ditemukan');
    const st = status === 'ARSIP' ? 'ARSIP' : 'AKTIF';
    sheet_(SH.KEB).getRange(k._row, 5).setValue(st);
    return { success: true, message: st === 'ARSIP' ? 'Kebutuhan diarsipkan' : 'Kebutuhan diaktifkan lagi' };
  });
}

/****** PEMBAYARAN (Ketua & Bendahara) ******/
function totalDibayar_(kebutuhanId, nim) {
  return rows_(SH.BAYAR)
    .filter(p => str_(p.KebutuhanID) === str_(kebutuhanId) && str_(p.NIM) === str_(nim))
    .reduce((t, p) => t + (Number(p.Nominal) || 0), 0);
}
function barisBayar_(user, k, m, nominal, metode, idx) {
  return Object.assign({ ID: idBaru_('P') + (idx === undefined ? '' : '-' + idx), KebutuhanID: k.ID, NIM: m.NIM, Nama: m.Nama,
    Kelas: m.Kelas, Nominal: nominal, Metode: metode, 'Dicatat Oleh': user.nama }, wib_());
}
function catatPembayaran(token, kebutuhanId, nim, nominal, metode) {
  return kunci_(() => {
    const user = auth_(token);
    nominal = nominal_(nominal);
    metode = metode_(metode);
    const k = rows_(SH.KEB).find(x => str_(x.ID) === str_(kebutuhanId));
    if (!k) throw new Error('Kebutuhan tidak ditemukan');
    if (str_(k.Status) === 'ARSIP') throw new Error('Kebutuhan ini sudah diarsipkan');
    const m = rows_(SH.MHS).find(x => str_(x.NIM) === str_(nim));
    if (!m) throw new Error('Mahasiswa tidak ditemukan');

    const sisa = Number(k.Nominal) - totalDibayar_(k.ID, nim);
    if (sisa <= 0) throw new Error(m.Nama + ' sudah lunas untuk ' + k.Judul);
    if (nominal > sisa) throw new Error('Nominal melebihi sisa tagihan. Maksimal ' + rp_(sisa));
    const min = Number(k.MinCicilan) || 0;
    // Setoran boleh di bawah minimal hanya jika itu pelunasan sisa terakhir
    if (nominal < min && nominal < sisa) throw new Error('Minimal setoran untuk ' + k.Judul + ' adalah ' + rp_(Math.min(min, sisa)));

    append_(SH.BAYAR, barisBayar_(user, k, m, nominal, metode));
    sheet_(SH.BAYAR).getRange(sheet_(SH.BAYAR).getLastRow(), 9).setNumberFormat('[$Rp]#,##0');
    return { success: true, message: 'Pembayaran ' + m.Nama + ' ' + rp_(nominal) + ' dicatat' };
  });
}
// Pelunasan banyak mahasiswa sekaligus (nominal otomatis = sisa tagihan)
function catatPelunasanBulk(token, kebutuhanId, daftarNim, metode) {
  return kunci_(() => {
    const user = auth_(token);
    metode = metode_(metode);
    if (!Array.isArray(daftarNim) || !daftarNim.length) throw new Error('Pilih minimal satu mahasiswa');
    if (daftarNim.length > 100) throw new Error('Maksimal 100 mahasiswa per input');
    const k = rows_(SH.KEB).find(x => str_(x.ID) === str_(kebutuhanId));
    if (!k) throw new Error('Kebutuhan tidak ditemukan');
    if (str_(k.Status) === 'ARSIP') throw new Error('Kebutuhan ini sudah diarsipkan');
    const mhs = rows_(SH.MHS);
    const bayar = rows_(SH.BAYAR).filter(p => str_(p.KebutuhanID) === str_(k.ID));
    const baris = [], dilewati = [];
    [...new Set(daftarNim.map(str_))].forEach((nim, i) => {
      const m = mhs.find(x => str_(x.NIM) === nim);
      if (!m) throw new Error('Mahasiswa tidak ditemukan: ' + nim);
      const sisa = Number(k.Nominal) - bayar.filter(p => str_(p.NIM) === nim).reduce((t, p) => t + (Number(p.Nominal) || 0), 0);
      if (sisa <= 0) { dilewati.push(m.Nama); return; } // sudah lunas (mis. dibayar bersamaan oleh bendahara lain): lewati, jangan gagalkan semuanya
      baris.push(barisBayar_(user, k, m, sisa, metode, i + 1));
    });
    if (!baris.length) throw new Error('Semua mahasiswa yang dipilih sudah lunas');
    const s = sheet_(SH.BAYAR);
    const start = s.getLastRow() + 1;
    s.getRange(start, 1, baris.length, HEAD.BAYAR.length)
      .setValues(baris.map(b => HEAD.BAYAR.map(h => b[h])));
    s.getRange(start, 9, baris.length, 1).setNumberFormat('[$Rp]#,##0');
    const total = baris.reduce((t, b) => t + b.Nominal, 0);
    return { success: true, message: baris.length + ' pelunasan dicatat: ' + rp_(total) + (dilewati.length ? ' (' + dilewati.length + ' sudah lunas, dilewati)' : '') };
  });
}
// Dana masuk di luar iuran (donasi, sponsor, sisa dana, dll) - Ketua saja
function catatDanaMasukLain(token, keterangan, nominal, metode) {
  return kunci_(() => {
    const user = auth_(token, true);
    if (!str_(keterangan)) throw new Error('Keterangan wajib diisi');
    append_(SH.BAYAR, Object.assign({ ID: idBaru_('P'), KebutuhanID: LAIN, NIM: '', Nama: str_(keterangan), Kelas: '-',
      Nominal: nominal_(nominal), Metode: metode_(metode), 'Dicatat Oleh': user.nama }, wib_()));
    return { success: true, message: 'Dana masuk dicatat' };
  });
}

/****** PENGELUARAN & PERPINDAHAN ******/
function catatPengeluaran(token, keterangan, nominal, metode, kebutuhanId) { // Ketua & Bendahara
  return kunci_(() => {
    const user = auth_(token);
    if (!str_(keterangan)) throw new Error('Keterangan wajib diisi');
    nominal = nominal_(nominal);
    metode = metode_(metode);
    const saldo = hitungSaldo_();
    if (nominal > saldo[metode]) throw new Error('Saldo ' + lbl_(metode) + ' tidak cukup. Tersedia ' + rp_(saldo[metode]));
    append_(SH.KELUAR, Object.assign({ ID: idBaru_('K'), Keterangan: str_(keterangan), Nominal: nominal, Metode: metode,
      'Dicatat Oleh': user.nama, KebutuhanID: str_(kebutuhanId) }, wib_()));
    return { success: true, message: 'Pengeluaran dari saldo ' + metode + ' dicatat' };
  });
}
function pindahDana(token, dari, ke, nominal) { // Ketua saja
  return kunci_(() => {
    const user = auth_(token, true);
    dari = metode_(dari); ke = metode_(ke); nominal = nominal_(nominal);
    if (dari === ke) throw new Error('Sumber dan tujuan harus berbeda');
    const saldo = hitungSaldo_();
    if (nominal > saldo[dari]) throw new Error('Saldo ' + lbl_(dari) + ' tidak cukup. Tersedia ' + rp_(saldo[dari]));
    append_(SH.PINDAH, Object.assign({ ID: idBaru_('M'), Dari: dari, Ke: ke, Nominal: nominal, 'Dicatat Oleh': user.nama }, wib_()));
    return { success: true, message: 'Dana dipindahkan dari ' + dari + ' ke ' + ke };
  });
}
function lbl_(m) { return m === 'TRANSFER' ? 'TRANSFER/QRIS' : m; }
function saldoDari_(bayar, keluar, pindah) {
  const s = { CASH: 0, TRANSFER: 0 };
  bayar.forEach(p => s[str_(p.Metode).toUpperCase()] += Number(p.Nominal) || 0);
  keluar.forEach(p => s[str_(p.Metode).toUpperCase()] -= Number(p.Nominal) || 0);
  pindah.forEach(p => { s[str_(p.Dari).toUpperCase()] -= Number(p.Nominal) || 0; s[str_(p.Ke).toUpperCase()] += Number(p.Nominal) || 0; });
  return s;
}
function hitungSaldo_() { return saldoDari_(rows_(SH.BAYAR), rows_(SH.KELUAR), rows_(SH.PINDAH)); }

/****** KOREKSI & PEMBATALAN (Ketua saja) ******/
function koreksiTransaksi(token, tipe, id, nominalBaru) {
  return kunci_(() => {
    auth_(token, true);
    nominalBaru = nominal_(nominalBaru);
    if (tipe === 'in') {
      const p = rows_(SH.BAYAR).find(x => str_(x.ID) === str_(id));
      if (!p) throw new Error('Transaksi tidak ditemukan');
      if (str_(p.KebutuhanID) !== LAIN) {
        const k = rows_(SH.KEB).find(x => str_(x.ID) === str_(p.KebutuhanID));
        const lain = totalDibayar_(p.KebutuhanID, p.NIM) - Number(p.Nominal);
        if (k && lain + nominalBaru > Number(k.Nominal)) throw new Error('Koreksi melebihi iuran mahasiswa ini');
      }
      sheet_(SH.BAYAR).getRange(p._row, 9).setValue(nominalBaru).setNumberFormat('[$Rp]#,##0');
    } else if (tipe === 'out') {
      const p = rows_(SH.KELUAR).find(x => str_(x.ID) === str_(id));
      if (!p) throw new Error('Transaksi tidak ditemukan');
      const tambah = nominalBaru - Number(p.Nominal);
      if (tambah > 0 && tambah > hitungSaldo_()[str_(p.Metode).toUpperCase()]) throw new Error('Koreksi melebihi saldo tersedia');
      sheet_(SH.KELUAR).getRange(p._row, 6).setValue(nominalBaru).setNumberFormat('[$Rp]#,##0');
    } else throw new Error('Tipe transaksi tidak valid');
    return { success: true, message: 'Nominal dikoreksi' };
  });
}
function batalkanTransaksi(token, tipe, id) {
  return kunci_(() => {
    auth_(token, true);
    const nama = tipe === 'in' ? SH.BAYAR : tipe === 'out' ? SH.KELUAR : tipe === 'move' ? SH.PINDAH : null;
    if (!nama) throw new Error('Tipe transaksi tidak valid');
    const p = rows_(nama).find(x => str_(x.ID) === str_(id));
    if (!p) throw new Error('Transaksi tidak ditemukan');
    const s = hitungSaldo_();
    // Pembatalan tidak boleh membuat saldo salah satu metode menjadi negatif
    if (tipe === 'in') s[str_(p.Metode).toUpperCase()] -= Number(p.Nominal);
    if (tipe === 'move') { s[str_(p.Dari).toUpperCase()] += Number(p.Nominal); s[str_(p.Ke).toUpperCase()] -= Number(p.Nominal); }
    if (s.CASH < 0 || s.TRANSFER < 0) throw new Error('Tidak bisa dibatalkan: saldo akan menjadi minus');
    sheet_(nama).deleteRow(p._row);
    return { success: true, message: 'Transaksi dibatalkan' };
  });
}

/****** DATA UNTUK KLIEN ******/
function getVersi(token) { auth_(token); return versi_(); }
function getAppData(token) {
  const user = auth_(token);
  const versi = versi_(); // dibaca SEBELUM data: bila ada perubahan saat membaca, polling berikutnya menangkapnya
  const mahasiswa = rows_(SH.MHS).map(m => ({ nim: str_(m.NIM), nama: str_(m.Nama), kelas: str_(m.Kelas).toUpperCase() }));
  const bayar = rows_(SH.BAYAR);
  const kebutuhan = rows_(SH.KEB).map(k => ({
    id: str_(k.ID), judul: str_(k.Judul), nominal: Number(k.Nominal) || 0, minCicilan: Number(k.MinCicilan) || 0,
    status: str_(k.Status) || 'AKTIF', dibuat: str_(k.Dibuat), dibuatOleh: str_(k['Dibuat Oleh'])
  }));
  // paid[kebutuhanId][nim] = total yang sudah dibayar
  const paid = {};
  bayar.forEach(p => {
    const kid = str_(p.KebutuhanID);
    if (kid === LAIN) return;
    paid[kid] = paid[kid] || {};
    paid[kid][str_(p.NIM)] = (paid[kid][str_(p.NIM)] || 0) + (Number(p.Nominal) || 0);
  });
  const judulById = {};
  kebutuhan.forEach(k => judulById[k.id] = k.judul);
  const keluarRows = rows_(SH.KELUAR), pindahRows = rows_(SH.PINDAH);
  const saldo = saldoDari_(bayar, keluarRows, pindahRows);
  const masuk = bayar.map(p => ({
    id: str_(p.ID), timestamp: str_(p.Timestamp), tanggal: str_(p.Tanggal), jam: str_(p.Jam),
    kebutuhanId: str_(p.KebutuhanID), kebutuhan: str_(p.KebutuhanID) === LAIN ? 'Dana masuk lain' : (judulById[str_(p.KebutuhanID)] || '-'),
    nim: str_(p.NIM), nama: str_(p.Nama), kelas: str_(p.Kelas), nominal: Number(p.Nominal) || 0,
    metode: str_(p.Metode).toUpperCase(), dicatatOleh: str_(p['Dicatat Oleh'])
  })).reverse();
  const keluar = keluarRows.map(p => ({
    id: str_(p.ID), timestamp: str_(p.Timestamp), tanggal: str_(p.Tanggal), jam: str_(p.Jam), keterangan: str_(p.Keterangan),
    nominal: Number(p.Nominal) || 0, metode: str_(p.Metode).toUpperCase(), dicatatOleh: str_(p['Dicatat Oleh']),
    kebutuhanId: str_(p.KebutuhanID), kebutuhan: judulById[str_(p.KebutuhanID)] || ''
  })).reverse();
  const pindah = pindahRows.map(p => ({
    id: str_(p.ID), timestamp: str_(p.Timestamp), tanggal: str_(p.Tanggal), jam: str_(p.Jam), dari: str_(p.Dari).toUpperCase(),
    ke: str_(p.Ke).toUpperCase(), nominal: Number(p.Nominal) || 0, dicatatOleh: str_(p['Dicatat Oleh'])
  })).reverse();
  const sum = a => a.reduce((t, x) => t + x.nominal, 0);
  return {
    versi: versi, user: user, kelas: KELAS, mahasiswa: mahasiswa, kebutuhan: kebutuhan, paid: paid,
    saldoMetode: saldo,
    rekap: { totalPemasukan: sum(masuk), totalPengeluaran: sum(keluar), saldo: saldo.CASH + saldo.TRANSFER },
    pemasukan: masuk, pengeluaran: keluar, perpindahan: pindah
  };
}

/****** HALAMAN PUBLIK (mahasiswa, hanya-baca, tanpa login) ******/
// Hanya data yang perlu untuk transparansi: nama, kelas, NIM tersamar, dan status bayar per iuran.
// TIDAK ada: saldo, pengeluaran, metode, nama pencatat, akun admin.
function getVersiPublik() { return versi_(); }
function nimSamar_(nim) {
  nim = str_(nim);
  return nim.length > 5 ? nim.slice(0, 2) + new Array(nim.length - 4).join('•') + nim.slice(-3) : nim;
}
function getDataPublik() {
  try {
    const versi = versi_();
    const cache = CacheService.getScriptCache(), key = 'pub_' + versi;
    const hit = cache.get(key);
    if (hit) return JSON.parse(hit);

    const kebutuhan = rows_(SH.KEB).filter(k => str_(k.ID)).map(k => ({
      id: str_(k.ID), judul: str_(k.Judul), nominal: Number(k.Nominal) || 0,
      minCicilan: Number(k.MinCicilan) || 0, status: str_(k.Status) || 'AKTIF'
    }));
    const paid = {}; // paid[nim][kebutuhanId] = total
    rows_(SH.BAYAR).forEach(p => {
      const kid = str_(p.KebutuhanID), nim = str_(p.NIM);
      if (kid === LAIN || !nim) return;
      paid[nim] = paid[nim] || {};
      paid[nim][kid] = (paid[nim][kid] || 0) + (Number(p.Nominal) || 0);
    });
    const mahasiswa = rows_(SH.MHS).filter(m => str_(m.NIM) && str_(m.Nama)).map(m => ({
      n: str_(m.Nama), k: str_(m.Kelas).toUpperCase(), i: nimSamar_(m.NIM), p: paid[str_(m.NIM)] || {}
    }));
    const out = { versi: versi, kelas: KELAS, kebutuhan: kebutuhan, mahasiswa: mahasiswa };
    try { cache.put(key, JSON.stringify(out), 600); } catch (e) {} // dibagi ke semua pengunjung
    return out;
  } catch (e) { return { error: 'Data belum tersedia' }; }
}
// Daftar nama + kelas saja, untuk alat bantu (Group Maker, Random Picker). Tanpa NIM dan tanpa data bayar.
function getRosterPublik() {
  try {
    const versi = versi_();
    const cache = CacheService.getScriptCache(), key = 'ros_' + versi;
    const hit = cache.get(key);
    if (hit) return JSON.parse(hit);
    const mahasiswa = rows_(SH.MHS).filter(m => str_(m.NIM) && str_(m.Nama))
      .map(m => ({ n: str_(m.Nama), k: str_(m.Kelas).toUpperCase() }));
    const out = { versi: versi, kelas: KELAS, mahasiswa: mahasiswa };
    try { cache.put(key, JSON.stringify(out), 600); } catch (e) {}
    return out;
  } catch (e) { return { error: 'Data belum tersedia' }; }
}
function getUrlPublik() { return ScriptApp.getService().getUrl() + '?p=publik'; }

/****** SINKRON UNTUK EDIT MANUAL DI SPREADSHEET ******/
// Edit sel biasa langsung terdeteksi (simple trigger). Untuk tambah/hapus baris manual,
// jalankan pasangTriggerSinkron() sekali dari editor Apps Script.
function onEdit() { naikVersi_(); }
function onUbahSheet() { naikVersi_(); }
function pasangTriggerSinkron() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'onUbahSheet').forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('onUbahSheet').forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet()).onChange().create();
}

/****** API UNTUK VERCEL (doPost) ******/
// Isi Script Property RPC_SECRET (Project Settings > Script properties) dengan string acak panjang.
// Nilai yang sama harus dipasang di Vercel sebagai GAS_SECRET.
const RPC = {
  login, cekSesi, logout,
  tambahMahasiswa, hapusMahasiswa,
  simpanKebutuhan, ubahStatusKebutuhan,
  catatPembayaran, catatPelunasanBulk, catatDanaMasukLain,
  catatPengeluaran, pindahDana,
  koreksiTransaksi, batalkanTransaksi,
  getVersi, getAppData, getVersiPublik, getDataPublik, getRosterPublik
};
function doPost(e) {
  let out;
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('RPC_SECRET');
    if (!secret || body.secret !== secret) throw new Error('Akses ditolak');
    const fn = RPC[body.fn];
    if (typeof fn !== 'function') throw new Error('Fungsi tidak dikenal');
    const r = fn.apply(null, Array.isArray(body.args) ? body.args : []);
    out = { ok: true, data: r === undefined ? null : r };
  } catch (err) {
    out = { ok: false, error: err.message };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
