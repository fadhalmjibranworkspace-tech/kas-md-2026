(function(){try{var t=localStorage.getItem('kasangk_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})();
/* iOS Safari mengabaikan user-scalable=no: blok cubit-zoom secara manual (zoom dua-ketuk sudah dicegah touch-action) */
['gesturestart','gesturechange','gestureend'].forEach(function(n){document.addEventListener(n,function(e){e.preventDefault()},{passive:false})});
var I={group:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.3c3 0 6 1.7 6 5.7"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',task:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.6 1.6L12.5 7.5M8 15h8"/>',dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01"/>',calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',swap:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',shrink:'<path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7"/>',qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4"/>',cert:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 9h8M8 13h4M9 17l-1 4 4-2 4 2-1-4"/>',ref:'<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h4"/>',msg:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',sum:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01"/>',slides:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',extract:'<path d="M6 3h9l4 4v14H6z"/><path d="m9 14 2 2 4-4"/>',write:'<path d="M4 20l1-4L16 5l3 3L8 19z"/>',cap:'<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5"/>',doc:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',spark:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',chev:'<path d="m9 18 6-6-6-6"/>',back:'<path d="m15 18-6-6 6-6"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'};
var HUB={
academic:{name:'MD Academic',sub:'Alat bantu kuliah dan kerja kelompok',lead:'Bagi kelompok, atur waktu belajar, dan acak giliran langsung dari data angkatan.',logo:'/brand/academic-160.png',ico:'cap',ac:'var(--c-academic)',acs:'var(--c-academic-s)',tools:[
 {n:'Group Maker',d:'Bagi kelompok otomatis dari data mahasiswa.',i:'group',h:'/tools/group-maker'},
 {n:'Presentation Scheduler',d:'Atur giliran dan jam presentasi tiap kelompok.',i:'cal'},
 {n:'Study Timer',d:'Timer belajar dengan mode fokus layar penuh.',i:'timer',h:'/tools/study-timer'},
 {n:'Task Planner',d:'Catat tugas, deadline, dan prioritas.',i:'task'},
 {n:'Random Name Picker',d:'Acak satu nama dari mahasiswa yang ikut.',i:'dice',h:'/tools/random-picker'},
 {n:'Konverter Satuan',d:'Panjang, berat, suhu, volume, dan lainnya.',i:'swap'},
 {n:'Kalkulator',d:'Kalkulator biasa dan ilmiah.',i:'calc'}]},
document:{name:'MD Documents',sub:'Olah file dan dokumen di browser',lead:'Convert, compress, QR, dan sertifikat massal tanpa install aplikasi.',logo:'/brand/documents-160.png',ico:'doc',ac:'var(--c-document)',acs:'var(--c-document-s)',tools:[
 {n:'Convert File',d:'Ubah format gambar dan dokumen.',i:'swap'},
 {n:'Compress File',d:'Perkecil ukuran file tanpa banyak kehilangan kualitas.',i:'shrink'},
 {n:'QR Generator',d:'Buat QR untuk formulir atau tautan.',i:'qr'},
 {n:'Certificate Generator',d:'Buat sertifikat massal dari daftar nama.',i:'cert'},
 {n:'Reference Formatter',d:'Rapikan referensi dan daftar pustaka.',i:'ref'}]},
ai:{name:'Nalar MD',sub:'Asisten AI untuk kuliah dan kegiatan',lead:'Rangkum materi, buat soal latihan, dan rapikan tulisan dengan bantuan AI.',logo:'/brand/nalar-160.png',ico:'spark',ac:'var(--c-ai)',acs:'var(--c-ai-s)',tools:[
 {n:'Jarkom AI',d:'Susun pesan dari screenshot atau teks.',i:'msg'},
 {n:'Lecture Summarizer',d:'Rangkum PDF dan catatan kuliah.',i:'sum'},
 {n:'Quiz Generator',d:'Buat latihan soal dari materi.',i:'quiz'},
 {n:'Presentation Assistant',d:'Susun outline presentasi.',i:'slides'},
 {n:'Document Extractor',d:'Ambil tanggal dan detail kegiatan dari dokumen.',i:'extract'},
 {n:'Writing Assistant',d:'Perbaiki bahasa dan struktur tulisan.',i:'write'}]}};
function catIc(H){return H.logo?'<span class="ic lg"><img src="'+H.logo+'" alt=""></span>':'<span class="ic">'+svg(H.ico)+'</span>'}
function svg(k){return '<svg viewBox="0 0 24 24" aria-hidden="true">'+I[k]+'</svg>'}
var TC={academic:['#0c3c35','#031a16'],document:['#0e3470','#050f2a'],ai:['#3e1a78','#170a33']};
function setTC(){var c=document.documentElement.dataset.cat,m=document.querySelector('meta[name=theme-color]');if(!m||!TC[c])return;m.content=TC[c][document.documentElement.getAttribute('data-theme')==='dark'?1:0]}
function isDark(){return document.documentElement.getAttribute('data-theme')==='dark'}
function paintTheme(spin){document.querySelectorAll('[data-tbtn]').forEach(function(b){b.innerHTML=svg(isDark()?'sun':'moon');b.setAttribute('aria-label',isDark()?'Pakai tema terang':'Pakai tema gelap');if(spin&&b.animate)b.firstChild.animate([{transform:'rotate(-90deg) scale(.6)',opacity:0},{transform:'none',opacity:1}],{duration:480,easing:'cubic-bezier(.34,1.56,.64,1)'})})}
function toggleTheme(){var d=document.documentElement,x=isDark()?'light':'dark';x==='dark'?d.setAttribute('data-theme','dark'):d.removeAttribute('data-theme');try{localStorage.setItem('kasangk_theme',x)}catch(e){}setTC();paintTheme(1)}
document.addEventListener('DOMContentLoaded',function(){
 var t=document.getElementById('top');if(!t)return;
 var b=t.dataset.back,title=t.dataset.title||'Portal MD 2026',sub=t.dataset.sub||(b?'':'Manajemen Dakwah • Kelas A, B & C');
 t.className='app-header';
 t.innerHTML='<div class="header-top">'+(b?'<a class="hbtn" href="'+b+'" aria-label="Kembali">'+svg('back')+'</a>':'<span class="brand-stamp"><img src="/brand/portal-mark.png" alt=""></span>')+'<div class="header-text"><div class="header-title">'+title+'</div>'+(sub?'<div class="header-sub">'+sub+'</div>':'')+'</div><button class="hbtn" type="button" data-tbtn onclick="toggleTheme()"></button></div>';
});

document.addEventListener('DOMContentLoaded',function(){setTC();paintTheme(0)});
