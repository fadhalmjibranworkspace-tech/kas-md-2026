/* Pengganti google.script.run: meneruskan panggilan ke /api/rpc (Vercel) -> Apps Script.
   Frontend tidak perlu diubah; semua google.script.run.withSuccessHandler(...).fn(...) tetap jalan. */
(function () {
  function call(fn, args, ok, fail) {
    ok = ok || function () {};
    fail = fail || function (e) { console.error(e); };
    // Link halaman publik sekarang ada di domain Vercel sendiri
    if (fn === 'getUrlPublik') { setTimeout(function () { ok(location.origin + '/publik'); }, 0); return; }
    fetch('/api/rpc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fn: fn, args: args })
    })
      .then(function (r) { return r.json(); })
      .then(
        function (j) { return j && j.ok ? { ok: true, d: j.data } : { ok: false, e: new Error((j && j.error) || 'Server error') }; },
        function (e) { return { ok: false, e: e }; }
      )
      .then(function (r) { r.ok ? ok(r.d) : fail(r.e); });
  }
  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, prop) {
        if (prop === 'withSuccessHandler') return function (f) { return runner(f, fail); };
        if (prop === 'withFailureHandler') return function (f) { return runner(ok, f); };
        if (typeof prop !== 'string') return undefined;
        return function () { call(prop, Array.prototype.slice.call(arguments), ok, fail); };
      }
    });
  }
  window.google = window.google || {};
  window.google.script = { run: runner() };
})();
