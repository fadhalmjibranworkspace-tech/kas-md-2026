/* Daftar mahasiswa untuk alat bantu: ambil dari data kas (nama + kelas), pilih siapa yang ikut dengan checklist.
   Pakai: var R = Roster.mount(el, {onChange: fn}); R.selected() -> [{n:'Nama', c:'A'}] */
(function () {
  var KEY = 'kasangk_roster_v1', TTL = 10 * 60 * 1000;
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function readCache() { try { var o = JSON.parse(localStorage.getItem(KEY)); return o && o.d ? o : null; } catch (e) { return null; } }
  function load(ok, fail, force) {
    var c = readCache();
    if (c && !force && Date.now() - c.t < TTL) { ok(c.d); return; }
    fetch('/api/rpc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fn: 'getRosterPublik', args: [] }) })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !j.data || j.data.error || !Array.isArray(j.data.mahasiswa)) throw new Error((j && (j.error || (j.data && j.data.error))) || 'Data tidak valid');
        try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), d: j.data })); } catch (e) {}
        ok(j.data);
      })
      .catch(function (e) { if (c) ok(c.d, true); else fail(e); }); // pakai cache lama bila offline
  }
  function mount(el, opt) {
    opt = opt || {};
    var all = [], sel = {}, kelas = '*', q = '', kls = ['A', 'B', 'C'];
    el.innerHTML = '<div class="rs-msg">Memuat data mahasiswa…</div>';
    function visible() {
      var k = q.toLowerCase();
      return all.filter(function (m) { return (kelas === '*' || m.k === kelas) && (!k || m.n.toLowerCase().indexOf(k) > -1); });
    }
    function selected() { return all.filter(function (m) { return sel[m.id]; }).map(function (m) { return { n: m.n, c: m.k }; }); }
    function emit() { opt.onChange && opt.onChange(selected()); }
    function paint() {
      var v = visible(), n = Object.keys(sel).length;
      el.querySelector('.rs-chips').innerHTML = [['*', 'Semua']].concat(kls.map(function (k) { return [k, k]; })).map(function (x) {
        var tot = all.filter(function (m) { return x[0] === '*' || m.k === x[0]; }), on = tot.filter(function (m) { return sel[m.id]; }).length;
        return '<button type="button" data-k="' + x[0] + '"' + (kelas === x[0] ? ' class="on"' : '') + '>' + x[1] + ' ' + on + '/' + tot.length + '</button>';
      }).join('');
      el.querySelector('.rs-list').innerHTML = v.length ? v.map(function (m) {
        return '<label><input type="checkbox" data-id="' + m.id + '"' + (sel[m.id] ? ' checked' : '') + '><span class="nm">' + esc(m.n) + '</span><i class="' + (/^[ABC]$/.test(m.k) ? 'k-' + m.k : '') + '">' + esc(m.k || '-') + '</i></label>';
      }).join('') : '<div class="rs-msg">Tidak ada nama yang cocok.</div>';
      el.querySelector('.rs-sum').textContent = n + ' dari ' + all.length + ' mahasiswa dipilih';
    }
    function build() {
      el.innerHTML = '<div class="rs-chips"></div><div class="rs-tools"><input class="in" type="search" placeholder="Cari nama…" aria-label="Cari nama"><button type="button" class="btn ghost" data-a="all">Pilih tampil</button><button type="button" class="btn ghost" data-a="none">Kosongkan</button></div><div class="rs-list"></div><p class="rs-sum"></p>';
      el.querySelector('.rs-chips').onclick = function (e) { var b = e.target.closest('button'); if (!b) return; kelas = b.dataset.k; paint(); };
      el.querySelector('input[type=search]').oninput = function () { q = this.value.trim(); paint(); };
      el.querySelector('.rs-tools').onclick = function (e) {
        var b = e.target.closest('button'); if (!b) return;
        if (b.dataset.a === 'all') visible().forEach(function (m) { sel[m.id] = 1; });
        else if (visible().length === all.length) sel = {}; else visible().forEach(function (m) { delete sel[m.id]; });
        paint(); emit();
      };
      el.querySelector('.rs-list').onchange = function (e) { var c = e.target; if (c.dataset.id == null) return; c.checked ? sel[c.dataset.id] = 1 : delete sel[c.dataset.id]; paint(); emit(); };
      paint();
    }
    function fail() {
      el.innerHTML = '<div class="rs-msg">Data mahasiswa belum bisa dimuat.<br><br><button type="button" class="btn ghost">Coba lagi</button></div>';
      el.querySelector('button').onclick = go;
    }
    function go() {
      el.innerHTML = '<div class="rs-msg">Memuat data mahasiswa…</div>';
      load(function (d) {
        kls = (d.kelas && d.kelas.length) ? d.kelas : ['A', 'B', 'C'];
        all = d.mahasiswa.map(function (m, i) { return { id: String(i), n: m.n, k: m.k }; })
          .sort(function (a, b) { return a.k < b.k ? -1 : a.k > b.k ? 1 : a.n.localeCompare(b.n, 'id'); });
        all.forEach(function (m, i) { m.id = String(i); });
        sel = {}; build(); emit();
      }, fail);
    }
    go();
    return {
      selected: selected,
      count: function () { return Object.keys(sel).length; }
    };
  }
  window.Roster = { mount: mount, load: load };
})();
