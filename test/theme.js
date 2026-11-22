/* Seasonal site themes: client-side only, live Google Sheet. Not a visitor picker.
   Preview with ?theme=christmas|easter|melbourne-cup (or ?theme=none).
   Preview travellers with ?santa=now, ?bunny=now, ?horses=now, or ?fx=now. */
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

  /* ---- Garland plus seasonal travellers (Santa, bunny, horses) ---- */
  var SANTA_SVG="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 372 112' fill='none'><g><path d='M14 90 Q20 82 38 82 H160 Q184 82 192 64' stroke='#E8B923' stroke-width='4.5' stroke-linecap='round'/><path d='M58 76 V82 M136 76 V82' stroke='#E8B923' stroke-width='3.4' stroke-linecap='round'/><path d='M26 56 Q20 30 44 24 Q68 30 62 56 Z' fill='#7D5A34'/><path d='M36 28 Q44 20 52 28' stroke='#E8B923' stroke-width='2.4' fill='none' stroke-linecap='round'/><rect x='38' y='14' width='13' height='11' rx='1.5' fill='#2E9A50'/><path d='M44.5 14 v11 M38 19.5 h13' stroke='#FFE08A' stroke-width='1.6'/><rect x='52' y='18' width='10' height='8' rx='1.5' fill='#4AA8F0'/><path d='M57 18 v8' stroke='#fff' stroke-width='1.4'/><path d='M22 54 H152 Q172 54 178 36 L188 30 Q192 66 160 78 H44 Q22 76 22 54 Z' fill='#C8102E'/><path d='M28 62 H166' stroke='#F0C14B' stroke-width='2.4' stroke-linecap='round'/><path d='M26 54 H152' stroke='#9E0B22' stroke-width='3'/><path d='M90 56 Q88 30 106 28 Q124 30 122 56 Z' fill='#E31B2D'/><rect x='92' y='45' width='28' height='4.5' rx='2' fill='#2b2b2b'/><rect x='103' y='44.4' width='6' height='5.6' rx='1' fill='#E8B923'/><path d='M118 40 Q146 40 176 47' stroke='#E31B2D' stroke-width='6.4' stroke-linecap='round'/><circle cx='178' cy='47.5' r='3.8' fill='#fff'/><circle cx='106' cy='20' r='9.6' fill='#F6C8A0'/><circle cx='109.5' cy='19' r='1.2' fill='#3b2a1a'/><circle cx='103' cy='19' r='1.2' fill='#3b2a1a'/><circle cx='106.5' cy='22.5' r='1.7' fill='#E58C86'/><path d='M96 22 Q106 44 117 22 Q111 29 106 27.5 Q101 29 96 22Z' fill='#fff'/><path d='M95 15.5 Q97 -1 114 1 Q118 3 118 14 Z' fill='#E31B2D'/><path d='M95 15 Q86 14 82 22' stroke='#E31B2D' stroke-width='5' stroke-linecap='round' fill='none'/><circle cx='81' cy='24' r='3.6' fill='#fff'/><rect x='93' y='12.5' width='25' height='5.4' rx='2.7' fill='#fff'/></g><path d='M180 48 Q210 44 238 54 M238 54 Q268 48 296 56' stroke='#E8B923' stroke-width='1.8' stroke-linecap='round'/><g><path d='M234 66 l-8 15 M240 68 l-10 12 M254 68 l11 10 M260 66 l11 11' stroke='#74461F' stroke-width='3.4' stroke-linecap='round' fill='none'/><path d='M228 58 q-9 -4 -10 -12' stroke='#9A6232' stroke-width='4' stroke-linecap='round' fill='none'/><ellipse cx='246' cy='60' rx='21' ry='10.5' fill='#9A6232'/><ellipse cx='250' cy='64' rx='13' ry='5' fill='#F1D9B5' opacity='.55'/><path d='M260 55 L271 41' stroke='#9A6232' stroke-width='9' stroke-linecap='round'/><ellipse cx='275' cy='38' rx='8' ry='6.6' fill='#9A6232'/><ellipse cx='282' cy='41' rx='5.4' ry='4' fill='#B9824A'/><circle cx='286' cy='40.5' r='1.9' fill='#2b1b10'/><circle cx='276' cy='35.5' r='1.4' fill='#1c1208'/><path d='M271 33 l-4 -5' stroke='#9A6232' stroke-width='3' stroke-linecap='round'/><path d='M274 32 l-2 -13 M272 24 l-7 -4 M273.5 28 l7 -6 M272.5 19 l-1 -7 M280 22 l4 -6' stroke='#5B3A1C' stroke-width='2' fill='none' stroke-linecap='round'/></g><g><path d='M288 66 l-12 13 M294 68 l-3 15 M308 68 l7 13 M314 66 l13 7' stroke='#74461F' stroke-width='3.4' stroke-linecap='round' fill='none'/><path d='M282 58 q-9 -4 -10 -12' stroke='#9A6232' stroke-width='4' stroke-linecap='round' fill='none'/><ellipse cx='300' cy='60' rx='21' ry='10.5' fill='#9A6232'/><ellipse cx='304' cy='64' rx='13' ry='5' fill='#F1D9B5' opacity='.55'/><path d='M314 55 L325 41' stroke='#9A6232' stroke-width='9' stroke-linecap='round'/><ellipse cx='329' cy='38' rx='8' ry='6.6' fill='#9A6232'/><ellipse cx='336' cy='41' rx='5.4' ry='4' fill='#B9824A'/><circle cx='340' cy='40.5' r='3' fill='#E8182B'/><circle cx='340' cy='40.5' r='6' fill='#FF4455' opacity='.28'/><circle cx='330' cy='35.5' r='1.4' fill='#1c1208'/><path d='M325 33 l-4 -5' stroke='#9A6232' stroke-width='3' stroke-linecap='round'/><path d='M328 32 l-2 -13 M326 24 l-7 -4 M327.5 28 l7 -6 M326.5 19 l-1 -7 M334 22 l4 -6' stroke='#5B3A1C' stroke-width='2' fill='none' stroke-linecap='round'/></g></svg>";
  var BUNNY_SVG="<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 148' fill='none'><defs><radialGradient id='dtc-bn-body' cx='34%' cy='22%' r='80%'><stop offset='0%' stop-color='#F8C878'/><stop offset='40%' stop-color='#E8943A'/><stop offset='100%' stop-color='#B85A16'/></radialGradient><radialGradient id='dtc-bn-head' cx='30%' cy='26%' r='74%'><stop offset='0%' stop-color='#FBE0A8'/><stop offset='36%' stop-color='#EBA04C'/><stop offset='75%' stop-color='#D07628'/><stop offset='100%' stop-color='#B55A14'/></radialGradient><linearGradient id='dtc-bn-ear' x1='0.12' y1='1' x2='0.75' y2='0'><stop offset='0%' stop-color='#C46218'/><stop offset='35%' stop-color='#E08A32'/><stop offset='100%' stop-color='#F3C070'/></linearGradient><linearGradient id='dtc-bn-ear2' x1='0.18' y1='1' x2='0.88' y2='0'><stop offset='0%' stop-color='#C8681C'/><stop offset='40%' stop-color='#E8983C'/><stop offset='100%' stop-color='#F6C888'/></linearGradient><linearGradient id='dtc-bn-inner' x1='0.35' y1='1' x2='0.6' y2='0'><stop offset='0%' stop-color='#D86A78'/><stop offset='45%' stop-color='#F4A8A4'/><stop offset='100%' stop-color='#FFD8D2'/></linearGradient><radialGradient id='dtc-bn-cream' cx='40%' cy='28%' r='72%'><stop offset='0%' stop-color='#FFFBF2'/><stop offset='70%' stop-color='#F6E0C4'/><stop offset='100%' stop-color='#E8C8A0'/></radialGradient><radialGradient id='dtc-bn-muzzle' cx='40%' cy='28%' r='70%'><stop offset='0%' stop-color='#FFFCF6'/><stop offset='100%' stop-color='#F0D8B8'/></radialGradient><radialGradient id='dtc-bn-iris' cx='35%' cy='32%' r='70%'><stop offset='0%' stop-color='#C8843C'/><stop offset='42%' stop-color='#7A4218'/><stop offset='100%' stop-color='#241208'/></radialGradient><radialGradient id='dtc-bn-paw' cx='35%' cy='28%' r='70%'><stop offset='0%' stop-color='#F6CC90'/><stop offset='55%' stop-color='#E09848'/><stop offset='100%' stop-color='#C47028'/></radialGradient><radialGradient id='dtc-bn-pad' cx='40%' cy='35%' r='65%'><stop offset='0%' stop-color='#FCE4D0'/><stop offset='100%' stop-color='#E8B090'/></radialGradient><linearGradient id='dtc-bn-bask' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#E8B05A'/><stop offset='100%' stop-color='#A86A22'/></linearGradient><linearGradient id='dtc-bn-bask2' x1='0' y1='0' x2='0' y2='1'><stop offset='0%' stop-color='#D49840'/><stop offset='100%' stop-color='#8A5418'/></linearGradient><radialGradient id='dtc-bn-tail' cx='40%' cy='35%' r='70%'><stop offset='0%' stop-color='#FFF8EE'/><stop offset='100%' stop-color='#E8D0B4'/></radialGradient><radialGradient id='dtc-bn-earshade' cx='80%' cy='50%' r='70%'><stop offset='0%' stop-color='#A84E10' stop-opacity='.35'/><stop offset='100%' stop-color='#A84E10' stop-opacity='0'/></radialGradient></defs><ellipse class='dtc-fx-shadow' cx='52' cy='143.6' rx='24' ry='3.6' fill='#000' opacity='.22'/><g class='dtc-hopper'><ellipse cx='22' cy='108' rx='8.8' ry='7.4' fill='url(#dtc-bn-tail)'/><ellipse cx='19.6' cy='106' rx='3.8' ry='3.3' fill='#fff' opacity='.8'/><g transform='rotate(-15 39 54)'><ellipse cx='39' cy='27' rx='8.6' ry='28' fill='url(#dtc-bn-ear)'/><ellipse cx='42' cy='27' rx='4.4' ry='24' fill='url(#dtc-bn-earshade)'/><ellipse cx='38.6' cy='26.5' rx='4.4' ry='21.5' fill='url(#dtc-bn-inner)'/><path d='M33.6 20 C33 10 35.2 5.5 39 4.2' stroke='#F8D8A0' stroke-width='1.45' fill='none' stroke-linecap='round' opacity='.75'/></g><ellipse cx='52' cy='108' rx='26' ry='22.5' fill='url(#dtc-bn-body)'/><ellipse cx='52' cy='112' rx='16.5' ry='14.5' fill='url(#dtc-bn-cream)'/><ellipse cx='66' cy='114' rx='8' ry='12' fill='#B85A16' opacity='.18'/><g transform='rotate(13 62 52)'><ellipse cx='62' cy='24' rx='9.4' ry='30' fill='url(#dtc-bn-ear2)'/><ellipse cx='65.4' cy='24' rx='4.6' ry='26' fill='url(#dtc-bn-earshade)'/><ellipse cx='61.6' cy='23.5' rx='4.9' ry='23.2' fill='url(#dtc-bn-inner)'/><path d='M55.6 16 C54.8 6 57.4 2.2 61.6 1.4' stroke='#FBE6B8' stroke-width='1.6' fill='none' stroke-linecap='round' opacity='.8'/></g><ellipse cx='37' cy='131.8' rx='8.4' ry='4.6' fill='url(#dtc-bn-paw)'/><ellipse cx='66' cy='132.2' rx='8.6' ry='4.6' fill='url(#dtc-bn-paw)'/><ellipse cx='40.6' cy='132.6' rx='2.2' ry='1.55' fill='url(#dtc-bn-pad)'/><ellipse cx='69.4' cy='133' rx='2.2' ry='1.55' fill='url(#dtc-bn-pad)'/><g transform='translate(36,116)'><g transform='translate(20.5,1.0) rotate(16)'><ellipse cx='0' cy='0' rx='5.6' ry='7.4' fill='#F5D04A'/><path d='M-5.4 -2 H5.4 M-5 1.3 H5 M-4 4.4 H4' stroke='#FFF6C8' stroke-width='1.05' stroke-linecap='round'/><ellipse cx='-1.4' cy='-2.8' rx='2' ry='1.4' fill='#fff' opacity='.35'/></g><g transform='translate(7.8,0.4) rotate(-14)'><ellipse cx='0' cy='0' rx='5.4' ry='7.2' fill='#F4A0B8'/><path d='M-3.8 -2.8 L-1.4 -1.2 L0.8 -3 L3.4 -1.3' stroke='#FFF0F4' stroke-width='0.95' fill='none' stroke-linecap='round' stroke-linejoin='round'/><path d='M-4 0.7 L-1.4 2.2 L0.8 0.4 L3.4 2.1' stroke='#FFF0F4' stroke-width='0.95' fill='none' stroke-linecap='round' stroke-linejoin='round'/><ellipse cx='-1.3' cy='-2.6' rx='1.8' ry='1.3' fill='#fff' opacity='.3'/></g><g transform='translate(14.2,3.0) rotate(5)'><ellipse cx='0' cy='0' rx='6' ry='7.8' fill='#3EB0D8'/><path d='M-2 -2.4 L-1.2 -0.4 L0.9 -0.5 L-0.7 0.7 L-0.1 2.6 L-2 1.4 L-3.9 2.6 L-3.3 0.7 L-4.9 -0.5 L-2.8 -0.4 Z' fill='#FFE56A'/><path d='M2.4 1.2 L2.85 2.25 L4.05 2.35 L3.15 3.1 L3.45 4.25 L2.4 3.6 L1.35 4.25 L1.65 3.1 L0.75 2.35 L1.95 2.25 Z' fill='#FFE56A'/><ellipse cx='-1.5' cy='-2.9' rx='2.1' ry='1.5' fill='#fff' opacity='.35'/></g><path d='M1.2 8.2 C1.2 4.2 7 2.4 14.2 2.4 C21.4 2.4 27.2 4.2 27.2 8.2 C27.2 14.6 21.4 18.8 14.2 18.8 C7 18.8 1.2 14.6 1.2 8.2Z' fill='url(#dtc-bn-bask)'/><path d='M3.2 8.8 C6 7.2 10 6.6 14.2 6.6 C18.4 6.6 22.4 7.2 25.2 8.8' stroke='#F0C070' stroke-width='0.9' fill='none' opacity='.55'/><path d='M4 12.2 C8 10.6 11.2 10.4 14.2 10.4 C17.2 10.4 20.6 10.6 24.4 12.2' stroke='#8A5418' stroke-width='0.65' fill='none' opacity='.45'/><ellipse cx='14.2' cy='8.4' rx='13' ry='2.8' fill='url(#dtc-bn-bask2)'/></g><ellipse cx='51' cy='66' rx='26' ry='27.2' fill='url(#dtc-bn-head)'/><ellipse cx='41' cy='54' rx='13' ry='10' fill='#FDE6B4' opacity='.42'/><ellipse cx='68' cy='72' rx='8.5' ry='11' fill='#C06018' opacity='.16'/><path d='M33.5 53.2 Q40 48.6 47.5 51.4' stroke='#A85A18' stroke-width='2.05' fill='none' stroke-linecap='round'/><path d='M54 50.8 Q61.2 47.2 69.2 50.6' stroke='#A85A18' stroke-width='2.05' fill='none' stroke-linecap='round'/><g><ellipse cx='41' cy='64.2' rx='8.6' ry='9.4' fill='#FFF9F2'/><ellipse cx='40.2' cy='64.8' rx='6.6' ry='7.3' fill='url(#dtc-bn-iris)'/><ellipse cx='40.1' cy='65' rx='3.2' ry='3.5' fill='#1A0C06'/><circle cx='38.2' cy='62.2' r='2.25' fill='#fff'/><circle cx='42' cy='66.4' r='0.9' fill='#fff' opacity='.9'/><path d='M33.2 61.2 C36 58.2 41 57.6 46 59.4' stroke='#C46820' stroke-width='1.15' fill='none' stroke-linecap='round' opacity='.55'/><ellipse cx='61.6' cy='63.4' rx='9.1' ry='9.7' fill='#FFF9F2'/><ellipse cx='60.7' cy='64.1' rx='7' ry='7.6' fill='url(#dtc-bn-iris)'/><ellipse cx='60.6' cy='64.3' rx='3.4' ry='3.7' fill='#1A0C06'/><circle cx='58.6' cy='61.4' r='2.45' fill='#fff'/><circle cx='62.6' cy='65.8' r='0.95' fill='#fff' opacity='.9'/><path d='M53.4 60.2 C56.6 57 62 56.4 67.6 58.4' stroke='#C46820' stroke-width='1.15' fill='none' stroke-linecap='round' opacity='.55'/></g><ellipse cx='33.5' cy='76.5' rx='7' ry='4.2' fill='#F4A090' opacity='.48'/><ellipse cx='71' cy='75.2' rx='6.6' ry='4' fill='#F4A090' opacity='.42'/><ellipse cx='51.2' cy='80.2' rx='14.2' ry='9.6' fill='url(#dtc-bn-muzzle)'/><path d='M51.2 75.6 C48 75.6 46.7 78.2 51.2 80 C55.7 78.2 54.4 75.6 51.2 75.6Z' fill='#E87890'/><ellipse cx='49.9' cy='76.6' rx='1.45' ry='0.75' fill='#FFC0C8' opacity='.85'/><path d='M44.6 82.4 Q51.2 87.6 58.2 82.2' stroke='#C07870' stroke-width='0.9' fill='none' stroke-linecap='round'/><rect x='48.5' y='82.3' width='2.55' height='3.15' rx='0.6' fill='#FFFCF8'/><rect x='51.25' y='82.3' width='2.55' height='3.15' rx='0.6' fill='#FFFCF8'/><path d='M51.1 82.3 V85.3' stroke='#E8D8D0' stroke-width='0.4'/><g stroke='#C4A080' stroke-width='0.55' fill='none' stroke-linecap='round' opacity='.85'><path d='M37.2 79 C28.5 77 21.5 77.2 16.5 78.8'/><path d='M37.6 81.2 C29.5 81.4 22.5 83 18 85.2'/><path d='M38.2 83.2 C31 85 24.5 88 20.5 91.5'/><path d='M65.2 78.4 C73.5 76.2 81.5 76.2 87 78'/><path d='M65.5 80.6 C74 80.6 81.5 82.2 86.5 84.6'/><path d='M65 82.8 C72.5 84.8 79.5 88 83.8 91.2'/></g><g transform='translate(51,101)'><ellipse cx='-6.6' cy='0' rx='7.8' ry='6.5' fill='url(#dtc-bn-paw)'/><ellipse cx='6.6' cy='0.35' rx='7.8' ry='6.5' fill='url(#dtc-bn-paw)'/><ellipse cx='-6.6' cy='1.3' rx='3.6' ry='2.6' fill='url(#dtc-bn-pad)' opacity='.9'/><ellipse cx='6.6' cy='1.65' rx='3.6' ry='2.6' fill='url(#dtc-bn-pad)' opacity='.9'/><ellipse cx='-9.2' cy='-2.5' rx='1.55' ry='1.35' fill='url(#dtc-bn-pad)'/><ellipse cx='-6' cy='-3.35' rx='1.55' ry='1.35' fill='url(#dtc-bn-pad)'/><ellipse cx='-3.2' cy='-2.3' rx='1.45' ry='1.25' fill='url(#dtc-bn-pad)'/><ellipse cx='3.2' cy='-1.95' rx='1.45' ry='1.25' fill='url(#dtc-bn-pad)'/><ellipse cx='6.2' cy='-3' rx='1.55' ry='1.35' fill='url(#dtc-bn-pad)'/><ellipse cx='9.3' cy='-2.15' rx='1.55' ry='1.35' fill='url(#dtc-bn-pad)'/></g></g></svg>";
  var HORSES=[
    {h:'#5A3218',h2:'#3D2010',mz:'#D2B08A',s:'#A81F45',s2:'#E0B84F',cap:'#A81F45',p:'#1a1208'},
    {h:'#1C1A18',h2:'#0A0908',mz:'#C4A882',s:'#E0B84F',s2:'#15130F',cap:'#E0B84F',p:'#2a2a2a'},
    {h:'#C4C0BA',h2:'#8A8680',mz:'#EDE8E0',s:'#1F4A8A',s2:'#F4F0E6',cap:'#1F4A8A',p:'#1a1a1a'},
    {h:'#A85A28',h2:'#7A3C16',mz:'#E0B894',s:'#F4F0E6',s2:'#A81F45',cap:'#A81F45',p:'#3a2a18'},
    {h:'#3E2A18',h2:'#24180C',mz:'#C4A070',s:'#0E5A38',s2:'#F4F0E6',cap:'#0E5A38',p:'#1a1a1a'}
  ];
  function horseSvg(o,begin){
    var b=begin||'0s',h=o.h,h2=o.h2,mz=o.mz,s=o.s,s2=o.s2,cap=o.cap,p=o.p;
    function swing(cls,from,to){
      return "<g class='"+cls+"'><animateTransform attributeName='transform' type='rotate' values='"+from+";"+to+";"+from+"' dur='0.42s' begin='"+b+"' repeatCount='indefinite'/>";
    }
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 230 120' fill='none'>"
      +"<ellipse class='dtc-fx-shadow' cx='118' cy='114' rx='58' ry='5' fill='#000' opacity='.2'/>"
      +"<g class='dtc-gallop'>"
      +"<g transform='translate(58,60)'><g><animateTransform attributeName='transform' type='rotate' values='8;-10;8' dur='0.42s' begin='"+b+"' repeatCount='indefinite'/>"
      +"<path d='M0 4 Q-28 -10 -52 6 Q-30 4 -24 22 Q-10 8 0 4Z' fill='"+h2+"'/></g></g>"
      +"<g transform='translate(86,72)'>"
      +swing('dtc-leg-bn',38,-16)+"<path d='M0 0 L2 22' stroke='"+h+"' stroke-width='6.6' stroke-linecap='round'/><path d='M2 22 L8 36' stroke='"+h+"' stroke-width='5.4' stroke-linecap='round'/><path d='M8 36 L4 40' stroke='#1a120c' stroke-width='4.2' stroke-linecap='round'/></g>"
      +swing('dtc-leg-bf',18,-28)+"<path d='M8 0 L14 20' stroke='"+h+"' stroke-width='6.2' stroke-linecap='round' opacity='.82'/><path d='M14 20 L22 34' stroke='"+h2+"' stroke-width='5' stroke-linecap='round' opacity='.82'/><path d='M22 34 L20 39' stroke='#1a120c' stroke-width='3.8' stroke-linecap='round' opacity='.82'/></g></g>"
      +"<path d='M62 74 C60 58 86 48 118 50 C140 52 156 58 160 66 C164 73 160 82 148 84 C118 90 86 90 68 80 C60 76 60 76 62 74Z' fill='"+h+"'/>"
      +"<path d='M90 78 C110 86 140 82 150 74 C140 80 110 84 90 78Z' fill='"+h2+"' opacity='.35'/>"
      +"<path d='M148 60 C158 48 174 38 190 34' stroke='"+h+"' stroke-width='13' stroke-linecap='round' fill='none'/>"
      +"<path d='M146 54 C158 32 180 26 190 30' fill='"+h2+"'/>"
      +"<g transform='rotate(12 198 34)'><ellipse cx='198' cy='34' rx='18' ry='9' fill='"+h+"'/><ellipse cx='212' cy='33.5' rx='8.2' ry='5' fill='"+mz+"'/><circle cx='196' cy='30.5' r='2.05' fill='#1a1008'/><circle cx='196.7' cy='29.8' r='.7' fill='#fff' opacity='.85'/></g>"
      +"<path d='M188 24 Q192 10 200 22' stroke='"+h+"' stroke-width='5' fill='none' stroke-linecap='round'/>"
      +"<path d='M190 22 Q193 14 198 22' stroke='"+mz+"' stroke-width='2' fill='none' stroke-linecap='round'/>"
      +"<g transform='translate(150,70)'>"
      +swing('dtc-leg-fn',-36,20)+"<path d='M0 0 L-2 20' stroke='"+h+"' stroke-width='6.6' stroke-linecap='round'/><path d='M-2 20 L-6 36' stroke='"+h+"' stroke-width='5.4' stroke-linecap='round'/><path d='M-6 36 L-2 40' stroke='#1a120c' stroke-width='4.2' stroke-linecap='round'/></g>"
      +swing('dtc-leg-ff',-16,32)+"<path d='M10 0 L16 18' stroke='"+h+"' stroke-width='6.2' stroke-linecap='round' opacity='.82'/><path d='M16 18 L24 32' stroke='"+h2+"' stroke-width='5' stroke-linecap='round' opacity='.82'/><path d='M24 32 L22 37' stroke='#1a120c' stroke-width='3.8' stroke-linecap='round' opacity='.82'/></g></g>"
      +"<g class='dtc-jockey'><path d='M112 62 L148 58 L148 70 L112 72Z' fill='"+s2+"'/><ellipse cx='122' cy='62' rx='14' ry='7' fill='"+p+"'/><path d='M128 64 L136 78' stroke='#1a120c' stroke-width='4.6' stroke-linecap='round'/><path d='M134 78 L142 76' stroke='#1a120c' stroke-width='3.8' stroke-linecap='round'/><path d='M116 60 L140 36 L152 44 L128 66Z' fill='"+s+"'/><path d='M140 36 L152 44 L148 52 L136 46Z' fill='"+s2+"'/><path d='M148 44 L176 48' stroke='"+s+"' stroke-width='4.6' stroke-linecap='round'/><circle cx='178' cy='48' r='3.1' fill='#F0C8A8'/><path d='M178 48 Q188 40 204 34' stroke='#2a1a10' stroke-width='1.3' fill='none'/><circle cx='146' cy='30' r='7.2' fill='#F0C8A8'/><path d='M138 30 Q146 18 156 28 L138 32Z' fill='"+cap+"'/><path d='M156 28 L164 31' stroke='"+cap+"' stroke-width='3.1' stroke-linecap='round'/></g>"
      +"</g></svg>";
  }
  var fx=null;
  function reducedMotion(){try{return window.matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){return false}}
  function fxNow(){
    try{
      var s=location.search, k=current&&current.key;
      if(/[?&]fx=now\b/i.test(s))return true;
      if(k==='christmas'&&/[?&]santa=now\b/i.test(s))return true;
      if(k==='easter'&&/[?&]bunny=now\b/i.test(s))return true;
      if(k==='melbourne-cup'&&/[?&]horses?=now\b/i.test(s))return true;
      return false;
    }catch(e){return false}
  }
  function mbarClearance(){
    var bar=document.querySelector('.mbar');
    if(!bar)return 0;
    var cs=getComputedStyle(bar);
    if(cs.display==='none'||cs.visibility==='hidden')return 0;
    var r=bar.getBoundingClientRect();
    return r.height>8?Math.ceil(r.height):0;
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
    var want=(!reducedMotion()&&document.body&&Element.prototype.animate)?current.key:'';
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
  function pauseSvgs(){
    if(!fx||!fx.el)return;
    var list=fx.el.querySelectorAll?fx.el.querySelectorAll('svg'):[];
    for(var i=0;i<list.length;i++)try{list[i].pauseAnimations()}catch(e){}
  }
  function resumeSvgs(){
    if(!fx||!fx.el)return;
    var list=fx.el.querySelectorAll?fx.el.querySelectorAll('svg'):[];
    for(var i=0;i<list.length;i++)try{list[i].unpauseAnimations()}catch(e){}
  }
  function onVis(){
    if(!fx)return;
    if(document.hidden){
      clearTimeout(fx.t);
      fx.left=Math.max(0,fx.due-Date.now());
      (fx.anims||[]).forEach(function(a){if(a.playState==='running')a.pause()});
      pauseSvgs();
    }else{
      var running=false;
      (fx.anims||[]).forEach(function(a){
        if(a.playState==='paused'){a.play();running=true}
        else if(a.playState==='running')running=true;
      });
      if(running)resumeSvgs();
      else if(!(fx.anims&&fx.anims.length))schedule(fx.left);
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
    ['dtc-santa','dtc-bunny','dtc-horses'].forEach(function(id){
      var n=document.getElementById(id);
      if(n&&n.parentNode)n.parentNode.removeChild(n);
    });
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
    else if(fx.key==='easter')hopBunny();
    else if(fx.key==='melbourne-cup')gallopHorses();
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
  function hopBunny(){
    if(!fx||document.hidden)return;
    var W=window.innerWidth,small=W<700;
    var h=small?58:74,w=h*100/148,hopH=h*0.38;
    var el=document.createElement('div');
    el.id='dtc-bunny';
    el.setAttribute('aria-hidden','true');
    el.style.width=w+'px';
    el.style.height=h+'px';
    el.style.bottom=(mbarClearance()+(small?0:8))+'px';
    el.innerHTML=BUNNY_SVG;
    document.body.appendChild(el);
    var hopper=el.querySelector('.dtc-hopper');
    var shadow=el.querySelector('.dtc-fx-shadow');
    hopper.style.transformBox='view-box';
    hopper.style.transformOrigin='52% 96.6%';
    if(shadow){shadow.style.transformBox='fill-box';shadow.style.transformOrigin='50% 50%'}
    var hopKf=[],shKf=[],steps=16,i,phase,p,y,sx,sy,r,air;
    for(i=0;i<=steps;i++){
      phase=i/steps;y=0;sx=1;sy=1;r=0;air=0;
      if(phase<0.18){
        p=phase/0.18;sy=1-0.28*Math.sin(p*Math.PI);sx=1+(1-sy)*0.8;
      }else if(phase<0.82){
        p=(phase-0.18)/0.64;y=-hopH*Math.sin(p*Math.PI);r=-10*Math.cos(p*Math.PI);
        sy=1+0.1*Math.sin(p*Math.PI);sx=2-sy;air=Math.sin(p*Math.PI);
      }else{
        p=(phase-0.82)/0.18;sy=1-0.28*Math.sin(p*Math.PI);sx=1+(1-sy)*0.8;
      }
      hopKf.push({transform:'translate(0,'+y.toFixed(1)+'px) rotate('+r.toFixed(1)+'deg) scale('+sx.toFixed(3)+','+sy.toFixed(3)+')'});
      shKf.push({transform:'scale('+(1.15-0.6*air).toFixed(3)+',1)',opacity:String((0.24-0.16*air).toFixed(3))});
    }
    var hopDur=550;
    var dist=W+w*2+40,dur=dist/(small?80:110)*1000;
    var travel=el.animate(
      [{transform:'translate3d('+(-w-20)+'px,0,0)'},{transform:'translate3d('+(W+w+20)+'px,0,0)'}],
      {duration:dur,easing:'linear',fill:'forwards'}
    );
    var hop=hopper.animate(hopKf,{duration:hopDur,iterations:Infinity,easing:'linear'});
    var sh=shadow?shadow.animate(shKf,{duration:hopDur,iterations:Infinity,easing:'linear'}):null;
    fx.el=el;
    fx.anims=sh?[travel,hop,sh]:[travel,hop];
    travel.onfinish=finishPass;
  }
  function gallopHorses(){
    if(!fx||document.hidden)return;
    var W=window.innerWidth,H=window.innerHeight,small=W<700;
    var n=small?3:4,w=small?112:168,h=w*120/230;
    var lift=mbarClearance();
    var yBase=H-lift-h-(small?36:80);
    if(yBase<80)yBase=Math.max(24,H-lift-h-8);
    var wrap=document.createElement('div');
    wrap.id='dtc-horses';
    wrap.setAttribute('aria-hidden','true');
    document.body.appendChild(wrap);
    var anims=[],pending=n,i,lane,el,startX,dist,dur,speed,bob,cyc,steps,kf,k,t,x,y,r;
    for(i=0;i<n;i++){
      el=document.createElement('div');
      el.className='dtc-horse';
      el.style.width=w+'px';
      lane=i-(n-1)/2;
      el.style.top=(yBase+lane*(small?14:20))+'px';
      el.style.zIndex=String(10-Math.round(lane*2));
      el.innerHTML=horseSvg(HORSES[i],(-i*0.11)+'s');
      wrap.appendChild(el);
      startX=-w-20-i*(small?42:56);
      dist=W+w+40-startX;
      speed=(small?180:240)-i*8;
      dur=dist/speed*1000;
      bob=small?4:7;cyc=dur/420;steps=48;kf=[];
      for(k=0;k<=steps;k++){
        t=k/steps;
        x=startX+t*dist;
        y=-bob*Math.abs(Math.sin(2*Math.PI*cyc*t));
        r=2*Math.sin(2*Math.PI*cyc*t);
        kf.push({transform:'translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0) rotate('+r.toFixed(2)+'deg)'});
      }
      (function(anim){
        anims.push(anim);
        anim.onfinish=function(){
          pending--;
          if(!pending)finishPass();
        };
      })(el.animate(kf,{duration:dur,easing:'linear',fill:'forwards'}));
    }
    fx.el=wrap;
    fx.anims=anims;
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
