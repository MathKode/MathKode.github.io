(function(){

  /* ============================================================
     ⚙️ PERSONNALISATION
     Modifiez ces tableaux pour adapter le site à votre histoire.
     ============================================================ */

  // Chaque "vidéo" : remplacez videoSrc par le chemin d'une vraie
  // vidéo (ex: 'videos/1.mp4') pour l'utiliser à la place du fond
  // animé. Sinon, le dégradé "gradient" sert de visuel.
  const VIDEOS_DATA = [
    { id:1, videoSrc:"video/1.mov", gradient:'radial-gradient(120% 100% at 30% 20%, #c62655 0%, #2d131c 60%, #0d0509 100%)', caption:'Notre premier café, celui qui a tout changé ☕️💕', likes:1240, comments:38 },
    { id:2, videoSrc:"video/2.mov", gradient:'radial-gradient(120% 100% at 70% 15%, #f0c369 0%, #7a2a3c 55%, #170a10 100%)', caption:'Coucher de soleil, mains dans la main 🌅', likes:2310, comments:64 },
  ];

  const HANDLE = '@elinou.et.mathou';

  // Liste de commentaires piochés aléatoirement à l'ouverture du volet.
  const RANDOM_COMMENTS = [
    { user:'@gros-pinpin', text:'Trop mignon 😍 j\u2019adore ce moment' },
    { user:'@gougou', text:'Vous êtes le couple le plus chou que je connaisse' },
    { user:'@marmottes-aussois', text:'Ça donne envie de vivre la même histoire ❤️' },
    { user:'@gros-pinpin', text:'On voit clairement l\u2019amour à travers l\u2019écran' },
    { user:'@gougou', text:'Ptdrrr le regard à la fin 😂' },
    { user:'@amanite', text:'Je suis venu ici juste pour pleurer de joie' },
    { user:'@chatmanite', text:'Encore une pépite, merci de partager ça' },
    { user:'@pharma_noiseville', text:'Ce couple mérite tout le bonheur du monde 🥹' },
    { user:'@calinou', text:'J\u2019ai littéralement souri du début à la fin' },
    { user:'@fac_de_science', text:'On sent la complicité, magnifique' },
    { user:'@osmoz', text:'Vivement la suite de votre histoire' },
    { user:'@calisson', text:'Ce sourire à la fin... on craque' },
    { user:'@soon', text:'Postez-en plus svp c\u2019est trop beau' },
    { user:'@', text:'Ça réchauffe le cœur direct' },
    { user:'@', text:'Le meilleur couple d\u2019internet, aucun débat' }
  ];

  /* ============================================================
     UTILITAIRES
     ============================================================ */
  function shuffle(arr){
    const a = arr.slice();
    for(let i=a.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [a[i],a[j]] = [a[j],a[i]];
    }
    return a;
  }

  function formatCount(n){
    if(n >= 1000000) return (n/1000000).toFixed(1).replace('.0','')+'M';
    if(n >= 1000) return (n/1000).toFixed(1).replace('.0','')+'k';
    return String(n);
  }

  function hueFromString(str){
    let hash = 0;
    for(let i=0;i<str.length;i++) hash = str.charCodeAt(i) + ((hash<<5)-hash);
    // reste dans la famille rose / or / prune du site
    return 330 + Math.abs(hash) % 70;
  }
  function colorFromString(str){
    return `hsl(${hueFromString(str)}, 70%, 62%)`;
  }

  const HEART_D = 'M12,21.1 C12,21.1 2.4,14.9 2.4,8.3 C2.4,4.8 5.1,2.4 8.1,2.4 C10,2.4 11.3,3.4 12,4.6 C12.7,3.4 14,2.4 15.9,2.4 C18.9,2.4 21.6,4.8 21.6,8.3 C21.6,14.9 12,21.1 12,21.1 Z';
  const HEART_OUTLINE = `<path class="heart-outline" d="${HEART_D}"/>`;
  const HEART_FILL = `<path class="heart-fill" d="${HEART_D}"/>`;
  function heartIcon(fillColor){ return `<path d="${HEART_D}" fill="${fillColor}"/>`; }

  // Icônes du bouton de changement de mode (style cohérent avec les autres
  // icônes du rail : trait seul, sans remplissage).
  const ICON_MAXIMIZE = '<path d="M4 9V5a1 1 0 0 1 1-1h4M15 4h4a1 1 0 0 1 1 1v4M20 15v4a1 1 0 0 1-1 1h-4M9 20H5a1 1 0 0 1-1-1v-4" stroke-linecap="round" stroke-linejoin="round"/>';
  const ICON_MINIMIZE = '<path d="M9 4v4a1 1 0 0 1-1 1H4M20 9h-4a1 1 0 0 1-1-1V4M15 20v-4a1 1 0 0 1 1-1h4M4 15h4a1 1 0 0 1 1 1v4" stroke-linecap="round" stroke-linejoin="round"/>';

  /* ============================================================
     MODE D'AFFICHAGE — "tiktok" (vidéo entière, cadre vertical
     arrondi) par défaut, ou "plein écran" (recadrée, bord à bord).
     ============================================================ */
  let fillMode = false;
  try{ fillMode = localStorage.getItem('em_display_mode') === 'fill'; }catch(e){}

  function applyModeToApp(){
    document.getElementById('app').classList.toggle('mode-fill', fillMode);
  }

  function refreshModeButtons(){
    document.querySelectorAll('.mode-btn').forEach(btn=>{
      const svg = btn.querySelector('svg');
      svg.innerHTML = fillMode ? ICON_MINIMIZE : ICON_MAXIMIZE;
      btn.querySelector('.mode-label').textContent = fillMode ? 'Format' : 'Plein écran';
    });
  }

  function toggleDisplayMode(){
    fillMode = !fillMode;
    try{ localStorage.setItem('em_display_mode', fillMode ? 'fill' : 'fit'); }catch(e){}
    applyModeToApp();
    refreshModeButtons();
    showToast(fillMode ? 'Mode plein écran' : 'Mode TikTok');
  }

  /* ============================================================
     SON — seule la vidéo active (celle affichée à l'écran) joue
     avec le son ; les autres restent muettes. Comme les navigateurs
     exigent un geste explicite et fiable pour autoriser l'autoplay
     avec son, un bouton dédié et bien visible (avec pulsation)
     s'en charge — bien plus fiable qu'une détection "silencieuse"
     de clic n'importe où sur la page.
     ============================================================ */
  let soundOn = false;
  const soundBtn = document.getElementById('soundToggle');
  const ICON_SOUND_ON = '<path d="M4 9v6h4l5 4V5L8 9H4Z" fill="#fbf3ee" stroke="none"/><path d="M16.5 8.5a5 5 0 0 1 0 7" stroke-linecap="round"/><path d="M19.5 6a9 9 0 0 1 0 12" stroke-linecap="round"/>';
  const ICON_SOUND_OFF = '<path d="M4 9v6h4l5 4V5L8 9H4Z" fill="#fbf3ee" stroke="none"/><path d="M16 9l5 6M21 9l-5 6" stroke-linecap="round"/>';

  function currentActiveVideo(){
    return document.querySelector('.video-section.active video.video-bg');
  }

  function setSound(on){
    soundOn = on;
    if(soundBtn){
      soundBtn.classList.toggle('on', soundOn);
      soundBtn.setAttribute('aria-pressed', soundOn ? 'true' : 'false');
      soundBtn.setAttribute('aria-label', soundOn ? 'Couper le son' : 'Activer le son');
      soundBtn.querySelector('svg').innerHTML = soundOn ? ICON_SOUND_ON : ICON_SOUND_OFF;
    }
    const video = currentActiveVideo();
    if(video){
      video.muted = !soundOn;
      if(soundOn) video.play().catch(()=>{});
    }
  }

  if(soundBtn){
    soundBtn.addEventListener('click', (e)=>{
      e.stopPropagation();
      setSound(!soundOn);
      showToast(soundOn ? 'Son activé 🔊' : 'Son coupé 🔇');
    });
  }

  // Filet de sécurité : la toute première interaction ailleurs sur la
  // page active aussi le son (le bouton reste utilisable pour couper).
  ['pointerdown','touchstart','keydown'].forEach(evt=>{
    document.addEventListener(evt, ()=>{ if(!soundOn) setSound(true); }, { once:true, passive:true });
  });

  /* ============================================================
     LOADER — dessin du cœur puis remplissage
     ============================================================ */
  function runLoader(){
    const path = document.getElementById('heartPath');
    const loader = document.getElementById('loader');
    const len = path.getTotalLength();
    path.style.strokeDasharray = len;
    path.style.strokeDashoffset = len;
    path.getBoundingClientRect(); // force reflow
    requestAnimationFrame(()=>{
      path.style.transition = 'stroke-dashoffset 1.35s cubic-bezier(.5,0,.2,1)';
      path.style.strokeDashoffset = '0';
    });
    setTimeout(()=> loader.classList.add('fill'), 1300);
    setTimeout(()=> loader.classList.add('fade-out'), 2500);
    setTimeout(()=>{
      loader.style.display = 'none';
      document.getElementById('app').classList.add('visible');
      initFeed();
    }, 3150);
  }

  /* ============================================================
     FEED — construction des cartes + scroll infini
     ============================================================ */
  const feedEl = document.getElementById('feed');
  let sectionCount = 0;
  let observerEnd = null;
  let observerActive = null;

  function buildSection(data){
    sectionCount += 1;
    const section = document.createElement('div');
    section.className = 'video-section';
    section.dataset.likes = data.likes;
    section.dataset.liked = '0';

    const bgHtml = data.videoSrc
      ? `<video class="video-bg" src="${data.videoSrc}" autoplay muted loop playsinline></video>`
      : `<div class="video-bg" style="background-image:${data.gradient};"></div>`;

    section.innerHTML = `
      <div class="video-frame">
        ${bgHtml}
        <div class="video-grain"></div>
        <div class="video-scrim"></div>
      </div>
      <div class="video-watermark">
        <svg viewBox="0 0 24 24">${heartIcon('#fbf3ee')}</svg>
        E+M
      </div>
      <div class="center-heart"><svg viewBox="0 0 24 24">${heartIcon('#ff5478')}</svg></div>

      <div class="video-info">
        <div class="video-user">
          <div class="avatar">EM</div>
          <span class="handle">${HANDLE}</span>
        </div>
        <p class="video-caption">${data.caption}</p>
      </div>

      <div class="action-rail">
        <button class="action-btn like-btn" aria-label="J'aime">
          <span class="icon-wrap">
            <svg viewBox="0 0 24 24">${HEART_OUTLINE}${HEART_FILL}</svg>
          </span>
          <span class="count like-count">${formatCount(data.likes)}</span>
        </button>
        <button class="action-btn comment-btn" aria-label="Commentaires">
          <span class="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fbf3ee" stroke-width="1.8">
              <path d="M4 12a8 8 0 1 1 3.2 6.4L4 20l1.1-3.4A7.96 7.96 0 0 1 4 12Z" stroke-linejoin="round"/>
            </svg>
          </span>
          <span class="count comment-count">${formatCount(data.comments)}</span>
        </button>
        <button class="action-btn mode-btn" aria-label="Changer de format d'affichage">
          <span class="icon-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fbf3ee" stroke-width="1.8">${fillMode ? ICON_MINIMIZE : ICON_MAXIMIZE}</svg>
          </span>
          <span class="count mode-label">${fillMode ? 'Format' : 'Plein écran'}</span>
        </button>
      </div>
    `;

    // interactions
    const likeBtn = section.querySelector('.like-btn');
    likeBtn.addEventListener('click', ()=> toggleLike(section, likeBtn, true));

    section.querySelector('.comment-btn').addEventListener('click', ()=> openComments(section));

    section.querySelector('.mode-btn').addEventListener('click', toggleDisplayMode);

    let lastTap = 0;
    section.addEventListener('click', (e)=>{
      if(e.target.closest('.action-rail') || e.target.closest('.video-info')) return;
      const now = Date.now();
      if(now - lastTap < 300){
        if(section.dataset.liked !== '1') toggleLike(section, likeBtn, true);
        const heart = section.querySelector('.center-heart');
        heart.classList.remove('pop'); void heart.offsetWidth; heart.classList.add('pop');
      }
      lastTap = now;
    });

    return section;
  }

  function toggleLike(section, btn, spawnBurst){
    const wasLiked = section.dataset.liked === '1';
    const liked = !wasLiked;
    section.dataset.liked = liked ? '1' : '0';
    btn.classList.toggle('liked', liked);
    let count = parseInt(section.dataset.likes, 10);
    count += liked ? 1 : -1;
    section.dataset.likes = count;
    btn.querySelector('.like-count').textContent = formatCount(count);
    if(liked && spawnBurst) burstEM();
  }

  function burstEM(){
    const container = document.createElement('div');
    container.className = 'burst-container';
    document.body.appendChild(container);
    const total = 20 + Math.floor(Math.random()*8);
    for(let i=0;i<total;i++){
      const el = document.createElement('span');
      const isGold = Math.random() < 0.28;
      el.className = 'burst-em' + (isGold ? ' gold' : '');
      el.textContent = Math.random() < 0.78 ? 'E+M' : '♥';
      const duration = 2.2 + Math.random()*2.2;
      const delay = Math.random()*0.5;
      const size = 14 + Math.random()*24;
      const rot = (Math.random()*50 - 25).toFixed(1);
      el.style.left = (Math.random()*94)+'vw';
      el.style.fontSize = size+'px';
      el.style.animationDuration = duration+'s';
      el.style.animationDelay = delay+'s';
      el.style.setProperty('--rot', rot+'deg');
      container.appendChild(el);
    }
    setTimeout(()=> container.remove(), 5200);
  }

  /* ---- commentaires ---- */
  const overlay = document.getElementById('overlay');
  const sheet = document.getElementById('commentSheet');
  const commentList = document.getElementById('commentList');

  function openComments(section){
    commentList.innerHTML = '';
    /*
    const n = 6 + Math.floor(Math.random()*10);
    const chosen = shuffle(RANDOM_COMMENTS).slice(0, n);
    */
    const n = Number(section.getElementsByClassName("comment-count")[0].textContent)
    const m = RANDOM_COMMENTS.length
    const m2 = 10**String(m).length
    const chosen = []
    for (i=0; i<n; i++) {
      chosen.push(RANDOM_COMMENTS[Math.floor(Math.random()*100%m)])
      console.log(i)
    }
    console.log("n",n)
    document.getElementById('commentCountLabel').textContent = `${chosen.length} commentaires`;
    chosen.forEach(c=>{
      const item = document.createElement('div');
      item.className = 'comment-item';
      const initial = c.user.replace('@','').charAt(0).toUpperCase();
      item.innerHTML = `
        <div class="comment-avatar" style="background:${colorFromString(c.user)}">${initial}</div>
        <div>
          <span class="comment-user">${c.user}</span>
          <p class="comment-text">${c.text}</p>
        </div>`;
      commentList.appendChild(item);
    });
    overlay.classList.add('visible');
    sheet.classList.add('open');
  }
  function closeComments(){
    overlay.classList.remove('visible');
    sheet.classList.remove('open');
  }
  overlay.addEventListener('click', closeComments);
  document.getElementById('closeSheet').addEventListener('click', closeComments);
  document.getElementById('commentSend').addEventListener('click', ()=>{
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if(!text) return;
    const item = document.createElement('div');
    item.className = 'comment-item';
    item.innerHTML = `
      <div class="comment-avatar" style="background:${colorFromString('@moi')}">M</div>
      <div>
        <span class="comment-user">@moi</span>
        <p class="comment-text">${text}</p>
      </div>`;
    commentList.prepend(item);
    input.value = '';
  });

  /* ---- toast ---- */
  let toastTimer = null;
  function showToast(msg){
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(()=> toast.classList.remove('show'), 1800);
  }

  /* ============================================================
     SCROLL INFINI — à la dernière carte, un nouvel ordre
     aléatoire est généré et ajouté au flux.
     ============================================================ */
  function appendBatch(){
    const order = shuffle(VIDEOS_DATA);
    const frag = document.createDocumentFragment();
    let firstNew = null;
    order.forEach(data=>{
      const section = buildSection(data);
      if(!firstNew) firstNew = section;
      frag.appendChild(section);
    });
    // on retire l'ancienne cible de fin d'observation
    if(observerEnd){
      const prevLast = feedEl.querySelector('.video-section:last-child');
      if(prevLast) observerEnd.unobserve(prevLast);
    }
    feedEl.appendChild(frag);
    const newLast = feedEl.querySelector('.video-section:last-child');
    observerEnd.observe(newLast);

    // observation "carte active" pour l'effet de zoom ambiant
    feedEl.querySelectorAll('.video-section').forEach(sec=>{
      if(!sec.dataset.observed){
        sec.dataset.observed = '1';
        observerActive.observe(sec);
      }
    });
  }

  function initFeed(){
    observerEnd = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting) appendBatch();
      });
    }, { root: feedEl, threshold: 0.6 });

    observerActive = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        const isActive = entry.isIntersecting;
        entry.target.classList.toggle('active', isActive);
        const video = entry.target.querySelector('video.video-bg');
        if(!video) return;
        if(isActive){
          video.muted = !soundOn;
          video.play().catch(()=>{});
        } else {
          video.muted = true;
          video.pause();
        }
      });
    }, { root: feedEl, threshold: 0.6 });

    applyModeToApp();
    appendBatch();
  }

  runLoader();
})();