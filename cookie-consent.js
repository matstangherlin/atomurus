(function(){
  var KEY='atomurus-cookie-consent';
  try { if (localStorage.getItem(KEY)) return; } catch(e) { return; }

  // Resolve path prefix so the banner works from subfolders (e.g. /elements/*)
  var depth=(location.pathname.split('/').filter(Boolean).length - 1);
  var prefix=''; for (var i=0;i<depth;i++) prefix+='../';

  var css=''
    +'#aco-cookie-banner{position:fixed;left:16px;right:16px;bottom:16px;max-width:440px;margin:0 auto;padding:18px 20px;border-radius:14px;background:var(--surface,#fffefc);color:var(--text-1,#12100E);border:1px solid var(--border,#DDD8CE);box-shadow:0 12px 36px rgba(0,0,0,.20);font-family:"DM Sans",sans-serif;line-height:1.55;z-index:9999;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);display:flex;flex-direction:column;gap:14px;animation:aco-slide-up .35s cubic-bezier(.4,0,.2,1)}'
    +'@keyframes aco-slide-up{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}'
    +'#aco-cookie-banner .aco-head{display:flex;align-items:center;gap:10px}'
    +'#aco-cookie-banner .aco-icon{width:32px;height:32px;border-radius:9px;background:var(--accent-light,#E2F0EB);color:var(--accent,#1E6A50);display:flex;align-items:center;justify-content:center;flex-shrink:0}'
    +'#aco-cookie-banner .aco-title{font-family:"DM Serif Display",serif;font-size:16px;color:var(--text-1,#12100E);letter-spacing:-.2px}'
    +'#aco-cookie-banner .aco-body{font-size:12.5px;color:var(--text-2,#5A5550)}'
    +'#aco-cookie-banner .aco-body a{color:var(--accent,#1E6A50);text-decoration:none;font-weight:500;border-bottom:1px dotted currentColor}'
    +'#aco-cookie-banner .aco-body a:hover{opacity:.8}'
    +'#aco-cookie-banner .aco-row{display:flex;gap:8px}'
    +'#aco-cookie-banner button{flex:1;font-family:inherit;font-size:12.5px;font-weight:500;padding:9px 14px;border-radius:9px;border:1px solid var(--border,#DDD8CE);background:transparent;color:var(--text-2,#5A5550);cursor:pointer;transition:all .15s;letter-spacing:.2px}'
    +'#aco-cookie-banner button:hover{border-color:var(--accent,#1E6A50);color:var(--accent,#1E6A50);background:var(--accent-light,#E2F0EB)}'
    +'#aco-cookie-banner button.aco-primary{background:var(--accent,#1E6A50);border-color:var(--accent,#1E6A50);color:#fff;font-weight:600}'
    +'#aco-cookie-banner button.aco-primary:hover{opacity:.92;color:#fff;background:var(--accent,#1E6A50)}'
    +'@media (max-width:480px){#aco-cookie-banner{left:12px;right:12px;bottom:12px;padding:16px}}';

  var style=document.createElement('style');
  style.textContent=css;
  document.head.appendChild(style);

  var lang=(document.documentElement.lang||'').toLowerCase().indexOf('pt')===0;
  var t = lang ? {
    title:'Privacidade & Cookies',
    body:'Usamos cookies de terceiros (Google AdSense, Analytics e reCAPTCHA) para anúncios, métricas e proteção anti-spam. Ao continuar, você concorda com nossos',
    privacy:'Política de Privacidade',
    and:'e',
    terms:'Termos de Uso',
    accept:'Aceitar todos',
    reject:'Apenas essenciais'
  } : {
    title:'Privacy & Cookies',
    body:'We use third-party cookies (Google AdSense, Analytics and reCAPTCHA) for advertising, analytics and anti-spam. By continuing, you agree to our',
    privacy:'Privacy Policy',
    and:'and',
    terms:'Terms of Use',
    accept:'Accept all',
    reject:'Essential only'
  };

  var bar=document.createElement('div');
  bar.id='aco-cookie-banner';
  bar.setAttribute('role','dialog');
  bar.setAttribute('aria-live','polite');
  bar.setAttribute('aria-labelledby','aco-cookie-title');
  bar.innerHTML=''
    +'<div class="aco-head">'
    +  '<div class="aco-icon" aria-hidden="true"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a6.5 6.5 0 1 0 6.5 6.5c0-.34-.03-.67-.08-.99a2 2 0 0 1-2.5-2.5A6.5 6.5 0 0 0 8 1.5z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><circle cx="5.5" cy="6" r=".9" fill="currentColor"/><circle cx="9" cy="9.5" r=".9" fill="currentColor"/><circle cx="6" cy="11" r=".7" fill="currentColor"/></svg></div>'
    +  '<div class="aco-title" id="aco-cookie-title">'+t.title+'</div>'
    +'</div>'
    +'<div class="aco-body">'+t.body+' <a href="'+prefix+'privacy.html">'+t.privacy+'</a> '+t.and+' <a href="'+prefix+'terms.html">'+t.terms+'</a>.</div>'
    +'<div class="aco-row">'
    +  '<button type="button" id="aco-cc-reject">'+t.reject+'</button>'
    +  '<button type="button" class="aco-primary" id="aco-cc-accept">'+t.accept+'</button>'
    +'</div>';

  function save(v){
    try { localStorage.setItem(KEY, v); } catch(e){}
    if (bar.parentNode) {
      bar.style.animation = 'aco-slide-up .25s cubic-bezier(.4,0,.2,1) reverse forwards';
      setTimeout(function(){ if (bar.parentNode) bar.parentNode.removeChild(bar); }, 250);
    }
  }

  function ready(){
    document.body.appendChild(bar);
    document.getElementById('aco-cc-accept').addEventListener('click',function(){save('accepted');});
    document.getElementById('aco-cc-reject').addEventListener('click',function(){save('rejected');});
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',ready);
  else ready();
})();
