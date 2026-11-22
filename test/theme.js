/* Seasonal site themes: client-side only, live Google Sheet. Not a visitor picker.
   Preview with ?theme=christmas|easter|melbourne-cup (or ?theme=none).
   Christmas supports ?santa=now or ?fx=now to force a sleigh pass (preview only). */
(function(){
  var CONTENT='1VqoOP7ec88J1Rl-DN7PtynWBuAoA3McwAMSIjn8o-FA';
  var KEYS={
    christmas:{cls:'theme-christmas', def:'Merry Christmas from DTC'},
    easter:{cls:'theme-easter', def:'Happy Easter from DTC'},
    'melbourne-cup':{cls:'theme-melbourne-cup', def:'Happy Cup Day from DTC'}
  };
  var CACHE='dtc-season-theme';
  var root=document.documentElement;
  var override=null, current=null, pending=false;

  function normKey(s){
    s=(s||'').toString().trim().toLowerCase().replace(/[_\s]+/g,'-');
    if(s==='cup'||s==='melbournecup'||s==='melbourn-cup')s='melbourne-cup';
    return KEYS[s]?s:'';
  }
  function queryTheme(){
    try{
      var m=location.search.match(/[?&]theme=([^&]*)/i);
      if(!m)return null;
      var raw=decodeURIComponent(m[1].replace(/\+/g,' ')).trim().toLowerCase();
      if(raw===''||raw==='none'||raw==='off'||raw==='0'||raw==='normal')return '';
      return normKey(raw);
    }catch(e){return null}
  }
  function melbourneToday(){
    var p=new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Melbourne',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date()).split('-');
    return new Date(+p[0],+p[1]-1,+p[2]);
  }
  function ymd(d){return d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()}
  function parseDate(c){
    if(!c)return null;
    var v=c.v;
    if(typeof v==='string'){
      var m=v.match(/^Date\((\d+),(\d+),(\d+)/);
      if(m)return new Date(+m[1],+m[2],+m[3]);
    }
    if(typeof v==='number'&&isFinite(v)){
      var epoch=new Date(Date.UTC(1899,11,30));
      epoch.setUTCDate(epoch.getUTCDate()+Math.floor(v));
      return new Date(epoch.getUTCFullYear(),epoch.getUTCMonth(),epoch.getUTCDate());
    }
    var s=((c.f!=null?c.f:v)||'')+'';
    var dm=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return dm?new Date(+dm[3],+dm[2]-1,+dm[1]):null;
  }
  function cell(c){
    if(!c||c.v==null||c.v==='')return '';
    return String(c.v).trim();
  }
  function isYes(c){
    var s=cell(c).toLowerCase();
    if(!s&&c&&c.f)s=String(c.f).trim().toLowerCase();
    return s==='yes'||s==='y'||s==='true';
  }
  function inRange(start,end,today){
    if(!start||!end)return false;
    var t=ymd(today);
    return ymd(start)<=t&&t<=ymd(end);
  }
  function apply(key,msg){
    key=normKey(key);
    Object.keys(KEYS).forEach(function(k){root.classList.remove(KEYS[k].cls)});
    current=key?{key:key,msg:(msg&&String(msg).trim())||KEYS[key].def}:null;
    if(current)root.classList.add(KEYS[current.key].cls);
    if(document.body)mountRibbon();
  }
  function mountRibbon(){
    var el=document.getElementById('dtc-season');
    if(!current){if(el)el.parentNode.removeChild(el);syncFx();return}
    if(!el){
      el=document.createElement('div');
      el.id='dtc-season';
      el.className='season-ribbon';
      el.setAttribute('role','status');
      el.innerHTML='<span class="season-ribbon-icon" aria-hidden="true"></span><span class="season-ribbon-msg"></span><span class="season-ribbon-icon" aria-hidden="true"></span>';
      var header=document.querySelector('header');
      if(header&&header.parentNode)header.parentNode.insertBefore(el,header.nextSibling);
      else document.body.insertBefore(el,document.body.firstChild);
    }
    el.querySelector('.season-ribbon-msg').textContent=current.msg;
    syncFx();
  }

  /* ---- Garland (lights / eggs / silks) hung from the ribbon, and Santa ---- */
  var SANTA_SVG="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 372 112' fill='none'><g><path d='M14 90 Q20 82 38 82 H160 Q184 82 192 64' stroke='#E8B923' stroke-width='4.5' stroke-linecap='round'/><path d='M58 76 V82 M136 76 V82' stroke='#E8B923' stroke-width='3.4' stroke-linecap='round'/><path d='M26 56 Q20 30 44 24 Q68 30 62 56 Z' fill='#7D5A34'/><path d='M36 28 Q44 20 52 28' stroke='#E8B923' stroke-width='2.4' fill='none' stroke-linecap='round'/><rect x='38' y='14' width='13' height='11' rx='1.5' fill='#2E9A50'/><path d='M44.5 14 v11 M38 19.5 h13' stroke='#FFE08A' stroke-width='1.6'/><rect x='52' y='18' width='10' height='8' rx='1.5' fill='#4AA8F0'/><path d='M57 18 v8' stroke='#fff' stroke-width='1.4'/><path d='M22 54 H152 Q172 54 178 36 L188 30 Q192 66 160 78 H44 Q22 76 22 54 Z' fill='#C8102E'/><path d='M28 62 H166' stroke='#F0C14B' stroke-width='2.4' stroke-linecap='round'/><path d='M26 54 H152' stroke='#9E0B22' stroke-width='3'/><path d='M90 56 Q88 30 106 28 Q124 30 122 56 Z' fill='#E31B2D'/><rect x='92' y='45' width='28' height='4.5' rx='2' fill='#2b2b2b'/><rect x='103' y='44.4' width='6' height='5.6' rx='1' fill='#E8B923'/><path d='M118 40 Q146 40 176 47' stroke='#E31B2D' stroke-width='6.4' stroke-linecap='round'/><circle cx='178' cy='47.5' r='3.8' fill='#fff'/><circle cx='106' cy='20' r='9.6' fill='#F6C8A0'/><circle cx='109.5' cy='19' r='1.2' fill='#3b2a1a'/><circle cx='103' cy='19' r='1.2' fill='#3b2a1a'/><circle cx='106.5' cy='22.5' r='1.7' fill='#E58C86'/><path d='M96 22 Q106 44 117 22 Q111 29 106 27.5 Q101 29 96 22Z' fill='#fff'/><path d='M95 15.5 Q97 -1 114 1 Q118 3 118 14 Z' fill='#E31B2D'/><path d='M95 15 Q86 14 82 22' stroke='#E31B2D' stroke-width='5' stroke-linecap='round' fill='none'/><circle cx='81' cy='24' r='3.6' fill='#fff'/><rect x='93' y='12.5' width='25' height='5.4' rx='2.7' fill='#fff'/></g><path d='M180 48 Q210 44 238 54 M238 54 Q268 48 296 56' stroke='#E8B923' stroke-width='1.8' stroke-linecap='round'/><g><path d='M234 66 l-8 15 M240 68 l-10 12 M254 68 l11 10 M260 66 l11 11' stroke='#74461F' stroke-width='3.4' stroke-linecap='round' fill='none'/><path d='M228 58 q-9 -4 -10 -12' stroke='#9A6232' stroke-width='4' stroke-linecap='round' fill='none'/><ellipse cx='246' cy='60' rx='21' ry='10.5' fill='#9A6232'/><ellipse cx='250' cy='64' rx='13' ry='5' fill='#F1D9B5' opacity='.55'/><path d='M260 55 L271 41' stroke='#9A6232' stroke-width='9' stroke-linecap='round'/><ellipse cx='275' cy='38' rx='8' ry='6.6' fill='#9A6232'/><ellipse cx='282' cy='41' rx='5.4' ry='4' fill='#B9824A'/><circle cx='286' cy='40.5' r='1.9' fill='#2b1b10'/><circle cx='276' cy='35.5' r='1.4' fill='#1c1208'/><path d='M271 33 l-4 -5' stroke='#9A6232' stroke-width='3' stroke-linecap='round'/><path d='M274 32 l-2 -13 M272 24 l-7 -4 M273.5 28 l7 -6 M272.5 19 l-1 -7 M280 22 l4 -6' stroke='#5B3A1C' stroke-width='2' fill='none' stroke-linecap='round'/></g><g><path d='M288 66 l-12 13 M294 68 l-3 15 M308 68 l7 13 M314 66 l13 7' stroke='#74461F' stroke-width='3.4' stroke-linecap='round' fill='none'/><path d='M282 58 q-9 -4 -10 -12' stroke='#9A6232' stroke-width='4' stroke-linecap='round' fill='none'/><ellipse cx='300' cy='60' rx='21' ry='10.5' fill='#9A6232'/><ellipse cx='304' cy='64' rx='13' ry='5' fill='#F1D9B5' opacity='.55'/><path d='M314 55 L325 41' stroke='#9A6232' stroke-width='9' stroke-linecap='round'/><ellipse cx='329' cy='38' rx='8' ry='6.6' fill='#9A6232'/><ellipse cx='336' cy='41' rx='5.4' ry='4' fill='#B9824A'/><circle cx='340' cy='40.5' r='3' fill='#E8182B'/><circle cx='340' cy='40.5' r='6' fill='#FF4455' opacity='.28'/><circle cx='330' cy='35.5' r='1.4' fill='#1c1208'/><path d='M325 33 l-4 -5' stroke='#9A6232' stroke-width='3' stroke-linecap='round'/><path d='M328 32 l-2 -13 M326 24 l-7 -4 M327.5 28 l7 -6 M326.5 19 l-1 -7 M334 22 l4 -6' stroke='#5B3A1C' stroke-width='2' fill='none' stroke-linecap='round'/></g></svg>";
  var fx=null;
  function reducedMotion(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
  function fxNow(){
    try{
      var s=location.search;
      return /[?&](?:fx|santa)=now\b/i.test(s);
    }catch(e){return false}
  }
  function syncFx(){
    var ribbon=document.getElementById('dtc-season');
    var lights=ribbon&&ribbon.querySelector('.season-lights');
    if(!current){
      if(lights)lights.parentNode.removeChild(lights);
      stopFx();return;
    }
    if(ribbon&&!lights){
      var n=Math.min(80,Math.ceil(Math.max(window.screen&&screen.width||0,window.innerWidth||0,360)/36)+2),h='',i;
      for(i=0;i<n;i++)h+='<i></i>';
      lights=document.createElement('div');
      lights.className='season-lights';
      lights.setAttribute('aria-hidden','true');
      lights.innerHTML=h;
      ribbon.appendChild(lights);
      window.addEventListener('resize',function(){
        clearTimeout(lights._t);
        lights._t=setTimeout(function(){
          var need=Math.min(120,Math.ceil((window.innerWidth||0)/36)+2),have=lights.children.length,add='';
          for(;have<need;have++)add+='<i></i>';
          if(add)lights.insertAdjacentHTML('beforeend',add);
        },200);
      });
    }
    var want=(!reducedMotion()&&document.body&&Element.prototype.animate&&current.key==='christmas')?'christmas':'';
    if(fx&&fx.key!==want)stopFx();
    if(want&&!fx)startFx(want);
  }
  function schedule(ms){
    if(!fx)return;
    clearTimeout(fx.t);
    fx.left=ms;fx.due=Date.now()+ms;
    if(document.hidden)return;
    fx.t=setTimeout(play,ms);
  }
  function onVis(){
    if(!fx)return;
    if(document.hidden){
      clearTimeout(fx.t);
      fx.left=Math.max(0,fx.due-Date.now());
      (fx.anims||[]).forEach(function(a){if(a.playState==='running')a.pause()});
    }else{
      var running=false;
      (fx.anims||[]).forEach(function(a){
        if(a.playState==='paused'){a.play();running=true}
        else if(a.playState==='running')running=true;
      });
      if(!running&&!(fx.anims&&fx.anims.length))schedule(fx.left);
    }
  }
  function startFx(key){
    if(fx||reducedMotion()||!document.body||!Element.prototype.animate)return;
    fx={key:key,t:0,due:0,left:0,el:null,anims:[]};
    document.addEventListener('visibilitychange',onVis);
    schedule(fxNow()?500:5000+Math.random()*10000);
  }
  function stopFx(){
    if(!fx)return;
    clearTimeout(fx.t);
    document.removeEventListener('visibilitychange',onVis);
    (fx.anims||[]).forEach(function(a){try{a.cancel()}catch(e){}});
    if(fx.el&&fx.el.parentNode)fx.el.parentNode.removeChild(fx.el);
    var leftover=document.getElementById('dtc-santa');
    if(leftover&&leftover.parentNode)leftover.parentNode.removeChild(leftover);
    fx=null;
  }
  function finishPass(){
    if(!fx)return;
    (fx.anims||[]).forEach(function(a){try{a.cancel()}catch(e){}});
    if(fx.el&&fx.el.parentNode)fx.el.parentNode.removeChild(fx.el);
    fx.el=null;fx.anims=[];
    schedule(30000+Math.random()*60000);
  }
  function play(){
    if(!fx||document.hidden)return;
    if(fx.key==='christmas')flySanta();
  }
  function flySanta(){
    if(!fx||document.hidden)return;
    var W=window.innerWidth,H=window.innerHeight,small=W<700;
    var w=small?160:224,h=w*112/372;
    var hd=document.querySelector('header');
    var base=hd?hd.getBoundingClientRect().bottom:90;
    var top=Math.min(base+(small?92:124)+Math.random()*(small?18:40),Math.max(base,H-h-24));
    var el=document.createElement('div');
    el.id='dtc-santa';
    el.setAttribute('aria-hidden','true');
    el.style.width=w+'px';
    el.style.top=top+'px';
    el.innerHTML=SANTA_SVG;
    document.body.appendChild(el);
    var dist=W+w*2+40,dur=dist/(small?85:120)*1000,steps=48,kf=[],i,t,x,y,r;
    var arc=small?14:24,bob=small?3:5,cyc=dist/280;
    for(i=0;i<=steps;i++){
      t=i/steps;
      x=-w-20+t*dist;
      y=-arc*Math.sin(Math.PI*t)+bob*Math.sin(2*Math.PI*cyc*t);
      r=-3*Math.cos(Math.PI*t)+1.4*Math.cos(2*Math.PI*cyc*t);
      kf.push({transform:'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) rotate('+r.toFixed(2)+'deg)'});
    }
    fx.el=el;
    var anim=el.animate(kf,{duration:dur,easing:'linear',fill:'forwards'});
    fx.anims=[anim];
    anim.onfinish=finishPass;
  }
  function readCache(){
    try{
      var o=JSON.parse(sessionStorage.getItem(CACHE)||'');
      if(!o||!normKey(o.key))return null;
      var today=melbourneToday();
      var start=o.start?new Date(o.start):null, end=o.end?new Date(o.end):null;
      if(!inRange(start,end,today))return null;
      return {key:normKey(o.key),msg:o.msg||'',start:start,end:end};
    }catch(e){return null}
  }
  function writeCache(row){
    try{
      if(!row){sessionStorage.removeItem(CACHE);return}
      sessionStorage.setItem(CACHE,JSON.stringify({
        key:row.key,msg:row.msg||'',
        start:row.start.getFullYear()+'-'+String(row.start.getMonth()+1).padStart(2,'0')+'-'+String(row.start.getDate()).padStart(2,'0'),
        end:row.end.getFullYear()+'-'+String(row.end.getMonth()+1).padStart(2,'0')+'-'+String(row.end.getDate()).padStart(2,'0')
      }));
    }catch(e){}
  }
  function messageFor(key,rows){
    var found='', i;
    for(i=0;i<rows.length;i++){
      if(rows[i].key===key && rows[i].msg){found=rows[i].msg;if(rows[i].active)break}
    }
    return found;
  }
  function pick(rows,today){
    var i,r;
    for(i=0;i<rows.length;i++){
      r=rows[i];
      if(r.active&&inRange(r.start,r.end,today))return r;
    }
    return null;
  }
  function parseRows(table){
    var cols={}, i, rows=[], r, key, start, end, msg;
    (table.cols||[]).forEach(function(c,idx){cols[String(c.label||'').trim().toLowerCase()]=idx});
    function idx(){
      var names=arguments, n, k;
      for(n=0;n<names.length;n++){k=names[n];if(cols[k]!=null)return cols[k]}
      return -1;
    }
    var iTheme=idx('theme'), iStart=idx('start date','start'), iEnd=idx('end date','end'),
        iActive=idx('active'), iMsg=idx('message','msg');
    (table.rows||[]).forEach(function(row){
      r=row.c||[];
      key=normKey(cell(iTheme>=0?r[iTheme]:null));
      if(!key)return;
      start=parseDate(iStart>=0?r[iStart]:null);
      end=parseDate(iEnd>=0?r[iEnd]:null);
      msg=cell(iMsg>=0?r[iMsg]:null);
      if(!msg&&iMsg>=0&&r[iMsg]&&r[iMsg].f)msg=String(r[iMsg].f).trim();
      rows.push({key:key,start:start,end:end,active:isYes(iActive>=0?r[iActive]:null),msg:msg});
    });
    return rows;
  }
  function fail(){
    if(override!==null){
      if(override)apply(override,KEYS[override].def);
      else apply('', '');
      return;
    }
    apply('','');
    writeCache(null);
  }
  function ok(table){
    var rows=parseRows(table||{}), today=melbourneToday();
    if(override!==null){
      if(!override){apply('','');return}
      apply(override, messageFor(override,rows)||KEYS[override].def);
      return;
    }
    var row=pick(rows,today);
    if(!row){apply('','');writeCache(null);return}
    apply(row.key,row.msg||KEYS[row.key].def);
    writeCache(row);
  }
  function load(){
    if(pending)return;
    pending=true;
    var T=Math.floor(Date.now()/300000);
    var cb='dtcThemes';
    var timed=setTimeout(function(){cleanup();fail()},8000);
    function cleanup(){
      clearTimeout(timed);
      pending=false;
      try{delete window[cb]}catch(e){window[cb]=undefined}
      if(s&&s.parentNode)s.parentNode.removeChild(s);
    }
    window[cb]=function(j){
      cleanup();
      try{
        if(!j||j.status==='error'||!j.table){fail();return}
        ok(j.table);
      }catch(e){fail()}
    };
    var s=document.createElement('script');
    s.src='https://docs.google.com/spreadsheets/d/'+CONTENT+'/gviz/tq?tqx=out:json;responseHandler:'+cb+'&sheet='+encodeURIComponent('Themes')+'&range=A2%3AF&headers=1&t='+T;
    s.onerror=function(){cleanup();fail()};
    (document.head||document.documentElement).appendChild(s);
  }

  override=queryTheme();
  if(override!==null){
    if(override)apply(override,KEYS[override].def);
    else apply('','');
  }else{
    var cached=readCache();
    if(cached)apply(cached.key,cached.msg);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){if(current)mountRibbon();load()});
  else{if(current)mountRibbon();load()}
})();
