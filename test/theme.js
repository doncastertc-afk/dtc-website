/* Seasonal site themes: client-side only, live Google Sheet. Not a visitor picker.
   Preview with ?theme=christmas|easter|melbourne-cup (or ?theme=none). */
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
    if(!current){if(el)el.parentNode.removeChild(el);return}
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
