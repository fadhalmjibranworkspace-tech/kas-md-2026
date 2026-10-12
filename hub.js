(function(){try{var t=localStorage.getItem('kasangk_theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');if(t==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}})();
var I={group:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.4"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.3c3 0 6 1.7 6 5.7"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',timer:'<circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2M9.5 2h5"/>',task:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.6 1.6L12.5 7.5M8 15h8"/>',dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h.01M15 9h.01M9 15h.01M15 15h.01"/>',calc:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01"/>',swap:'<path d="M7 7h12l-3-3M17 17H5l3 3"/>',shrink:'<path d="M4 14h6v6M20 10h-6V4M10 14l-7 7M14 10l7-7"/>',qr:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4"/>',cert:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 9h8M8 13h4M9 17l-1 4 4-2 4 2-1-4"/>',ref:'<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M9 9h6M9 13h4"/>',msg:'<path d="M4 5h16v11H9l-5 4z"/><path d="M8 9h8M8 12h5"/>',sum:'<path d="M6 3h9l4 4v14H6z"/><path d="M9 11h7M9 15h7M9 7h3"/>',quiz:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8M12 17h.01"/>',slides:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M12 16v4M8 20h8"/>',extract:'<path d="M6 3h9l4 4v14H6z"/><path d="m9 14 2 2 4-4"/>',write:'<path d="M4 20l1-4L16 5l3 3L8 19z"/>'};
var HUB={
academic:{name:'Academic Tools',sub:'Alat bantu kuliah dan kerja kelompok',ac:'#0f766e',acs:'rgba(15,118,110,.14)',tools:[
 {n:'Group Maker',d:'Bagi kelompok otomatis dengan aturan pembagian yang bisa diatur.',i:'group',h:'/tools/group-maker'},
 {n:'Presentation Scheduler',d:'Atur giliran dan jam presentasi tiap kelompok.',i:'cal'},
 {n:'Study Timer',d:'Timer belajar dengan mode fokus layar penuh.',i:'timer',h:'/tools/study-timer'},
 {n:'Task Planner',d:'Catat tugas, deadline, dan prioritas.',i:'task'},
 {n:'Random Name Picker',d:'Pilih nama secara acak, adil, dan seru.',i:'dice',h:'/tools/random-picker'},
 {n:'Konverter Satuan',d:'Panjang, berat, suhu, volume, dan lainnya.',i:'swap'},
 {n:'Kalkulator',d:'Kalkulator biasa dan ilmiah.',i:'calc'}]},
document:{name:'Document Tools',sub:'Olah file dan dokumen langsung di browser',ac:'#b8650a',acs:'rgba(184,101,10,.14)',tools:[
 {n:'Convert File',d:'Ubah format gambar dan dokumen.',i:'swap'},
 {n:'Compress File',d:'Perkecil ukuran file tanpa banyak kehilangan kualitas.',i:'shrink'},
 {n:'QR Generator',d:'Buat QR untuk formulir atau tautan.',i:'qr'},
 {n:'Certificate Generator',d:'Buat sertifikat massal dari daftar nama.',i:'cert'},
 {n:'Reference Formatter',d:'Rapikan referensi dan daftar pustaka.',i:'ref'}]},
ai:{name:'MD Intelligence',sub:'Asisten AI untuk kuliah dan kegiatan angkatan',ac:'#6d4bd8',acs:'rgba(109,75,216,.14)',tools:[
 {n:'Jarkom AI',d:'Susun pesan dari screenshot atau teks.',i:'msg'},
 {n:'Lecture Summarizer',d:'Rangkum PDF dan catatan kuliah.',i:'sum'},
 {n:'Quiz Generator',d:'Buat latihan soal dari materi.',i:'quiz'},
 {n:'Presentation Assistant',d:'Susun outline presentasi.',i:'slides'},
 {n:'Document Extractor',d:'Ambil tanggal, deadline, dan detail kegiatan dari dokumen.',i:'extract'},
 {n:'Writing Assistant',d:'Perbaiki bahasa dan struktur tulisan.',i:'write'}]}};
function svg(k){return '<svg viewBox="0 0 24 24">'+I[k]+'</svg>'}
function toggleTheme(){var d=document.documentElement,x=d.getAttribute('data-theme')==='dark'?'light':'dark';x==='dark'?d.setAttribute('data-theme','dark'):d.removeAttribute('data-theme');try{localStorage.setItem('kasangk_theme',x)}catch(e){}}
document.addEventListener('DOMContentLoaded',function(){
 var t=document.getElementById('top');if(!t)return;
 var b=t.dataset.back,moon='<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
 t.className='top';
 t.innerHTML=(b?'<a class="back" href="'+b+'"><svg viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg><span>'+(t.dataset.title||'')+'</span></a>':'<a class="brand" href="/"><i><img src="/logo-mark.png" alt=""></i>MD 2026</a>')+'<span class="sp"></span><button class="ibtn" onclick="toggleTheme()" aria-label="Ganti tema">'+moon+'</button>';
});
