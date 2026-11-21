/* Site search mock-up: client-side only, live Google Sheets + page text. */
(function(){
  var CONTENT='1VqoOP7ec88J1Rl-DN7PtynWBuAoA3McwAMSIjn8o-FA';
  var ALLOC='1UWpz7oqgZOBoo3NYWNmSDpim8F8rIP3vVynrMmr0Xew';
  var T=Math.floor(Date.now()/300000);
  var GROUPS=[
    {id:'pages',label:'Pages & sections'},
    {id:'faq',label:'FAQs'},
    {id:'champions',label:'Club Champions'},
    {id:'wof',label:'Wall of Fame'},
    {id:'office',label:'Office Bearers'},
    {id:'courts',label:'Ladders & Court Allocations'}
  ];
  var PAGES=['index.html','courts.html','results.html','wall-of-fame.html','office-bearers.html','faq.html'];
  var ALLOC_TABS=[
    {sheet:'Open Night - Monday',url:'courts.html#monday',title:'Open Night – Monday allocations'},
    {sheet:'Open Night - Tuesday',url:'courts.html#tuesday',title:'Open Night – Tuesday allocations'},
    {sheet:'Open Night - Wednesday',url:'courts.html#wednesday',title:'Open Night – Wednesday allocations'},
    {sheet:'Open Night - Thursday',url:'courts.html#thursday',title:'Open Night – Thursday allocations'},
    {sheet:'Saturday Afternoon',url:'courts.html#saturday',title:'Saturday Afternoon allocations'},
    {sheet:'Sunday Afternoon',url:'courts.html#sunday',title:'Sunday Afternoon allocations'}
  ];
  var MAG='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
  var CROSS='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var items=[], ready=false, pending=0, active=-1, lastHits=[], open=false;
  var ov, input, bodyEl, footEl, sbtn, lastFocus=null, cid=0;

  function cell(c){if(!c)return '';if(c.f!=null)return String(c.f).trim();return c.v==null?'':String(c.v).trim()}
  function rows(r){var out=[],rs=(r&&r.table&&r.table.rows)||[];for(var i=0;i<rs.length;i++){var c=rs[i].c||[],any=false;for(var j=0;j<c.length;j++)if(cell(c[j]))any=true;if(any)out.push(c)}return out}
  function esc(t){return String(t).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]})}
  function norm(s){return String(s||'').replace(/\s+/g,' ').trim()}
  function low(s){return norm(s).toLowerCase()}
  function slugQuestion(q){var s=String(q||'').toLowerCase().replace(/[''\u2019\u2032]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');return 'q-'+(s||'question')}
  function yes(s){return String(s||'').toLowerCase()!=='no'}
  function splitNames(s){return String(s||'').split(/\s*(?:\/|&|,|\band\b)\s*/i).map(norm).filter(function(n){return n&&n!=='-'&&n!=='–'})}
  function visibleText(el){
    var c=el.cloneNode(true);
    c.querySelectorAll('iframe[title]').forEach(function(n){n.insertAdjacentText('beforebegin',' '+n.getAttribute('title')+' ')});
    c.querySelectorAll('script,style,iframe,noscript,svg,img,.s-ov,.tag,.kicker,.more,.mores,.btn,.chip,.chips,nav,header,footer,.sbtn').forEach(function(n){n.remove()});
    c.querySelectorAll('a[href*="trols"]').forEach(function(n){n.remove()});
    c.querySelectorAll('br,p,div,li,h1,h2,h3,h4,td,th,figcaption,dt,dd,section,article,button,a,span').forEach(function(n){
      n.insertAdjacentText('beforebegin',' '); n.insertAdjacentText('afterend',' ');
    });
    return norm(c.textContent);
  }
  function ownHeading(el){
    if(/^H[1-4]$/.test(el.tagName)) return el;
    var hs=el.querySelectorAll('h1,h2,h3,h4');
    for(var i=0;i<hs.length;i++){
      var h=hs[i], p=h.parentElement, nested=false;
      while(p&&p!==el){ if(p.id){nested=true;break} p=p.parentElement; }
      if(!nested) return h;
    }
    return null;
  }
  function pageLabel(file, pageTitle){
    if(file==='index.html') return 'Home';
    return pageTitle||file.replace('.html','').replace(/-/g,' ');
  }


  function add(it){
    it.title=norm(it.title);it.snippet=norm(it.snippet||'');
    it.text=low([it.title,it.snippet,it.extra||''].join(' '));
    if(!it.title||!it.url)return;
    items.push(it);
  }

  function loadSheet(id,tab,headers,fn){
    pending++;
    var cb='dtcSearchCb'+(++cid),done=false;
    function finish(ok,r){if(done)return;done=true;pending--;try{if(ok)fn(r)}catch(e){}if(!pending)ready=true;if(open)render(input&&input.value)}
    window[cb]=function(r){try{delete window[cb]}catch(e){}finish(true,r)};
    var s=document.createElement('script');
    s.src='https://docs.google.com/spreadsheets/d/'+id+'/gviz/tq?tqx=out:json;responseHandler:'+cb+'&sheet='+encodeURIComponent(tab)+'&headers='+headers+'&t='+T;
    s.onerror=function(){try{delete window[cb]}catch(e){}finish(false)};
    document.head.appendChild(s);
  }

  function pageFile(){
    var p=location.pathname.split('/').pop();
    return (!p||p==='/')?'index.html':p;
  }

  function indexDoc(doc, href){
    var file=href.split('#')[0]||'index.html';
    var clone=doc.documentElement.cloneNode(true);
    var kill=clone.querySelectorAll('script,style,header,footer,nav,.mbar,.tpop,.burger,#dtc-search');
    for(var i=0;i<kill.length;i++)kill[i].remove();
    var main=clone.querySelector('main')||clone.body;
    if(!main)return;
    var h1=main.querySelector('h1');
    var intro=main.querySelector('.phead p, .intro');
    var pageTitle=h1?norm(h1.textContent):'';
    var pageIntro=intro?visibleText(intro):'';
    if(pageTitle){
      var pgrp=(file==='courts.html')?'courts':(file==='wall-of-fame.html')?'wof':(file==='office-bearers.html')?'office':(file==='results.html')?'champions':(file==='faq.html')?'faq':'pages';
      add({group:pgrp,title:pageTitle,snippet:pageIntro||('The '+pageTitle+' page'),url:file,path:pageTitle,extra:file});
    }
    var seen={};
    if(pageTitle)seen[low(pageTitle)]=1;
    var nodes=main.querySelectorAll('section[id], article[id], div.tp[id], h2[id], h3[id], h2, h3');
    for(var n=0;n<nodes.length;n++){
      var el=nodes[n], id=el.id;
      var heading=ownHeading(el);
      var title=heading?norm(heading.textContent):'';
      if(!title)continue;
      var key=low(title);
      if(seen[key])continue; seen[key]=1;
      var anchor=id;
      if(!anchor||anchor==='main'||anchor==='yr'){
        var p=el.parentElement;
        while(p&&p!==main&&(!p.id||p.id==='main')) p=p.parentElement;
        anchor=p&&p.id&&p.id!=='main'?p.id:'';
      }
      var textEl=el;
      if(/^H[1-4]$/.test(el.tagName)&&el.parentElement){
        var p=el.parentElement;
        if(p.matches&&p.matches('article,.rcard,.lsec,.comp,.lhead,li,figure')) textEl=p;
      }
      var text=visibleText(textEl).replace(title,'');
      if(text.length<24 && /^H[1-4]$/.test(el.tagName)){
        var sib=el.nextElementSibling, parts=[];
        while(sib && !sib.id){
          var day=sib.querySelector&&sib.querySelector('.lhead h3, h3');
          var ifr=sib.querySelector&&sib.querySelector('iframe[title]');
          if(day) parts.push(norm(day.textContent)+(ifr&&/ladder/i.test(ifr.getAttribute('title')||'')?' ladder':''));
          else parts.push(visibleText(sib));
          sib=sib.nextElementSibling;
        }
        text=norm((text+' '+parts.join(' · ')).replace(title,''));
      }
      var introEl=(!/^H[1-4]$/.test(el.tagName)&&el.querySelector)?el.querySelector('.intro, .phead p'):null;
      if(introEl) text=visibleText(introEl);
      if(text.length>280)text=text.slice(0,280).replace(/\s+\S*$/,'')+'…';
      var url=file+(anchor?'#'+anchor:'');
      var grp='pages';
      if(file==='courts.html') grp='courts';
      add({group:grp,title:title,snippet:text,url:url,path:pageLabel(file,pageTitle)+(title?' · '+title:''),extra:anchor+' '+title});
    }
  }

  function fetchPages(){
    var current=pageFile();
    if(PAGES.indexOf(current)>=0){
      try{indexDoc(document, current)}catch(e){}
    }
    PAGES.forEach(function(file){
      if(file===current)return;
      pending++;
      fetch(file,{credentials:'same-origin'}).then(function(r){return r.text()}).then(function(html){
        pending--;
        try{indexDoc(new DOMParser().parseFromString(html,'text/html'), file)}catch(e){}
        if(!pending)ready=true;
        if(open)render(input&&input.value);
      }).catch(function(){pending--;if(!pending)ready=true;if(open)render(input&&input.value)});
    });
  }

  function collapsePeople(list, group, pathBase, urlFn){
    var map={}, order=[];
    list.forEach(function(row){
      var key=low(row.name);
      if(!key)return;
      if(!map[key]){map[key]={name:row.name,bits:[],url:row.url,extra:''};order.push(key)}
      map[key].bits.push(row.bit);
      map[key].extra+=' '+row.bit;
    });
    order.forEach(function(k){
      var p=map[k];
      var snip=p.bits.filter(Boolean).slice(0,8).join(' · ');
      add({group:group,title:p.name,snippet:snip,url:p.url||urlFn(p),path:pathBase,extra:p.extra});
    });
  }

  function loadRecords(){
    loadSheet(CONTENT,'Honour Board',1,function(r){
      var list=[];
      rows(r).forEach(function(c){
        var y=cell(c[0]); if(!y)return;
        var men=cell(c[1]), ladies=cell(c[2]);
        splitNames(men).forEach(function(n){list.push({name:n,bit:"Men's Singles champion, "+y,url:'results.html#honour-board'})});
        splitNames(ladies).forEach(function(n){list.push({name:n,bit:"Ladies' Singles champion, "+y,url:'results.html#honour-board'})});
      });
      collapsePeople(list,'champions','Senior honour board',function(){return 'results.html#honour-board'});
    });
    loadSheet(CONTENT,'Junior Honour Board',1,function(r){
      var list=[];
      rows(r).forEach(function(c){
        var y=cell(c[0]); if(!y)return;
        var boys=cell(c[1]), girls=cell(c[2]);
        splitNames(boys).forEach(function(n){list.push({name:n,bit:"Boys' Singles champion, "+y,url:'results.html#junior-honour-board'})});
        splitNames(girls).forEach(function(n){list.push({name:n,bit:"Girls' Singles champion, "+y,url:'results.html#junior-honour-board'})});
      });
      collapsePeople(list,'champions','Junior honour board',function(){return 'results.html#junior-honour-board'});
    });
    loadSheet(CONTENT,'Senior Club Champs',1,function(r){
      var list=[];
      rows(r).forEach(function(c){
        var y=cell(c[0]), ev=cell(c[1]); if(!y||!ev)return;
        splitNames(cell(c[2])).forEach(function(n){list.push({name:n,bit:'Winner, '+y+' Senior '+ev,url:'results.html#seniors'})});
        splitNames(cell(c[3])).forEach(function(n){list.push({name:n,bit:'Runner-up, '+y+' Senior '+ev,url:'results.html#seniors'})});
      });
      collapsePeople(list,'champions','Senior Club Championships',function(){return 'results.html#seniors'});
    });
    loadSheet(CONTENT,'Junior Club Champs',1,function(r){
      var list=[];
      rows(r).forEach(function(c){
        var y=cell(c[0]), g=cell(c[1]), ev=cell(c[2]); if(!y||!ev)return;
        var label=y+' Junior '+(g?g+' ':'')+ev;
        splitNames(cell(c[3])).forEach(function(n){list.push({name:n,bit:'Winner, '+label,url:'results.html#juniors'})});
        splitNames(cell(c[4])).forEach(function(n){list.push({name:n,bit:'Runner-up, '+label,url:'results.html#juniors'})});
      });
      collapsePeople(list,'champions','Junior Club Championships',function(){return 'results.html#juniors'});
    });
    loadSheet(CONTENT,'Wall of Fame',1,function(r){
      rows(r).forEach(function(c){
        var era=cell(c[0]), year=cell(c[1]), cap=cell(c[2]), url=cell(c[3]), show=cell(c[6]);
        if(!yes(show)||!cap)return;
        var slug=low(year||era).replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
        add({group:'wof',title:cap,snippet:[era,year].filter(Boolean).join(' · '),url:'wall-of-fame.html#wof-'+slug,path:'Wall of Fame'+(year?' · '+year:''),thumb:wofThumb(url),extra:era+' '+year});
      });
    });
    loadSheet(CONTENT,'Office Bearers',1,function(r){
      var roles=['President','Secretary','Treasurer','Club Captain'];
      var list=[];
      rows(r).forEach(function(c){
        var y=cell(c[0]); if(!y)return;
        for(var i=0;i<roles.length;i++){
          var n=cell(c[i+1]); if(!n||n==='-')continue;
          list.push({name:n,bit:roles[i]+', '+y,url:'office-bearers.html'});
        }
      });
      collapsePeople(list,'office','Club Office Bearers',function(){return 'office-bearers.html'});
    });
    loadSheet(CONTENT,'Contacts',1,function(r){
      rows(r).forEach(function(c){
        if(!yes(cell(c[1])))return;
        var role=cell(c[3]), name=cell(c[4]); if(!role&&!name)return;
        add({group:'pages',title:name||role,snippet:[role,name].filter(Boolean).join(' · ')+' — club contacts',url:'index.html#contact',path:'Contact'});
      });
    });
    loadSheet(CONTENT,'Events',1,function(r){
      rows(r).forEach(function(c){
        if(!yes(cell(c[0])))return;
        var title=cell(c[4]), det=cell(c[5]), date=cell(c[1]);
        if(!title)return;
        add({group:'pages',title:title,snippet:[date,det].filter(Boolean).join(' — '),url:'index.html#events',path:'Events'});
      });
    });
    loadSheet(CONTENT,'FAQ',1,function(r){
      rows(r).forEach(function(c){
        if(cell(c[4]).toLowerCase()!=='yes')return;
        var q=cell(c[1]), a=cell(c[2]); if(!q)return;
        var cat=cell(c[0]);
        var snip=a.replace(/\[([^\]]+)\]\(([^)]+)\)/g,'$1').replace(/\s+/g,' ').trim();
        add({group:'faq',title:q,snippet:snip,url:'faq.html#'+slugQuestion(q),path:'FAQ'+(cat?' · '+cat:'')});
      });
    });
    ALLOC_TABS.forEach(function(tab){
      loadSheet(ALLOC,tab.sheet,0,function(r){
        var R=((r&&r.table&&r.table.rows)||[]).map(function(x){return (x.c||[]).map(cell)});
        if(!R.length){ add({group:'courts',title:tab.title,snippet:'Weekly court allocations',url:tab.url,path:'Court Allocations'}); return; }
        var H=R[0]||[], cap=R[1]||[], bits=[], names=[];
        for(var i=1;i<H.length;i++){
          if(/^duty/i.test(H[i]))continue;
          if(H[i]) bits.push(H[i]);
          if(cap[i]) names.push(cap[i]);
        }
        add({group:'courts',title:tab.title,snippet:(bits.concat(names).join(' · ')||'Weekly court allocations'),url:tab.url,path:'Court Allocations',extra:names.join(' ')});
      });
    });
  }

  function wofThumb(u){
    if(!u)return '';
    try{
      var x=new URL(u, location.href);
      var id=(u.match(/\/d\/([^/?]+)/)||[])[1]||x.searchParams.get('id')||'';
      var rk=x.searchParams.get('resourcekey');
      if(id&&/^[\w-]{10,}$/.test(id)) return 'https://lh3.googleusercontent.com/d/'+id+'=w200'+(rk?('?resourcekey='+encodeURIComponent(rk)):'');
    }catch(e){}
    return '';
  }

  function wordsOf(q){return low(q).split(/[^\p{L}\p{N}]+/u).filter(function(w){return w.length>=2})}

  function highlight(text, words){
    var s=esc(text||'');
    if(!words.length)return s;
    var re=new RegExp('('+words.map(function(w){return w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}).join('|')+')','gi');
    return s.replace(re,'<mark>$1</mark>');
  }

  function snippetAround(text, words){
    var raw=norm(text||''); if(!raw)return '';
    if(!words.length)return raw.length>140?raw.slice(0,140)+'…':raw;
    var L=low(raw), idx=-1, hit='';
    for(var i=0;i<words.length;i++){var p=L.indexOf(words[i]); if(p>=0&&(idx<0||p<idx)){idx=p;hit=words[i]}}
    if(idx<0)return raw.length>140?raw.slice(0,140)+'…':raw;
    var start=Math.max(0, idx-48), end=Math.min(raw.length, idx+hit.length+72);
    var out=(start>0?'…':'')+raw.slice(start,end)+(end<raw.length?'…':'');
    return out;
  }

  function score(it, words){
    var t=low(it.title), s=0;
    for(var i=0;i<words.length;i++){
      var w=words[i];
      if(t===w)s+=20;
      else if(t.indexOf(w)===0)s+=12;
      else if(t.indexOf(w)>=0)s+=8;
      else if(it.text.indexOf(w)>=0)s+=3;
      else return -1;
    }
    return s;
  }

  function search(q){
    var words=wordsOf(q);
    if(!words.length)return [];
    var hits=[];
    for(var i=0;i<items.length;i++){
      var sc=score(items[i], words);
      if(sc>=0) hits.push({it:items[i],sc:sc});
    }
    hits.sort(function(a,b){return b.sc-a.sc});
    var grouped={}, counts={};
    GROUPS.forEach(function(g){grouped[g.id]=[]});
    var titleUrl={};
    hits.forEach(function(h){
      var t=low(h.it.title), titled=false;
      for(var i=0;i<words.length;i++) if(t.indexOf(words[i])>=0) titled=true;
      if(titled) titleUrl[h.it.url]=1;
    });
    hits.forEach(function(h){
      var g=h.it.group; if(!grouped[g])return;
      var t=low(h.it.title), titled=false;
      for(var i=0;i<words.length;i++) if(t.indexOf(words[i])>=0) titled=true;
      if(!titled && titleUrl[h.it.url]) return;
      if((counts[g]||0)>=8)return;
      counts[g]=(counts[g]||0)+1;
      grouped[g].push(h.it);
    });
    return grouped;
  }

  function render(q){
    if(!bodyEl)return;
    q=q||'';
    var words=wordsOf(q);
    if(!q.trim()){
      lastHits=[]; active=-1;
      bodyEl.innerHTML='<p class="s-msg">Type a name, a team, or a page — results appear as you type.</p>';
      updateFoot(0); return;
    }
    if(words.length===0){
      lastHits=[]; active=-1;
      bodyEl.innerHTML='<p class="s-msg">Keep typing to search.</p>';
      updateFoot(0); return;
    }
    var grouped=search(q), html='', flat=[], total=0;
    GROUPS.forEach(function(g){
      var list=grouped[g.id]||[]; if(!list.length)return;
      total+=list.length;
      html+='<div class="s-group"><p class="s-label">'+esc(g.label)+'</p><ul class="s-list">';
      list.forEach(function(it){
        var i=flat.length; flat.push(it);
        var thumb=it.group==='wof'&&it.thumb?'<img class="s-thumb" alt="" src="'+esc(it.thumb)+'" width="52" height="52">':'';
        html+='<li><a class="s-item'+(thumb?' has-thumb':'')+'" href="'+esc(it.url)+'" data-i="'+i+'">'+thumb+'<span class="s-text"><span class="s-title">'+highlight(it.title,words)+'</span>'+(it.snippet?'<p class="s-snips">'+highlight(snippetAround(it.snippet,words),words)+'</p>':'')+'<p class="s-path">'+esc(it.path||g.label)+'</p></span></a></li>';
      });
      html+='</ul></div>';
    });
    lastHits=flat;
    if(!total){
      active=-1;
      bodyEl.innerHTML='<p class="s-msg">No matches for <b>'+esc(q.trim())+'</b>. Try a name, a page, or a team.</p>';
      updateFoot(0); return;
    }
    bodyEl.innerHTML=html;
    if(active>=flat.length)active=flat.length-1;
    if(active<0)active=0;
    paintActive();
    updateFoot(total);
    var imgs=bodyEl.querySelectorAll('.s-thumb');
    for(var k=0;k<imgs.length;k++) imgs[k].addEventListener('error',function(){this.style.display='none'});
  }

  function updateFoot(n){
    if(!footEl)return;
    var status=pending&&!ready?'Loading club records…':(n?n+(n===1?' result':' results'):'');
    footEl.querySelector('[data-count]').textContent=status;
  }

  function paintActive(){
    var links=bodyEl.querySelectorAll('.s-item');
    for(var i=0;i<links.length;i++){
      var on=i===active;
      links[i].classList.toggle('is-active',on);
      if(on) links[i].scrollIntoView({block:'nearest'});
    }
  }

  function goActive(){
    if(active<0||!lastHits[active])return;
    close();
    location.href=lastHits[active].url;
  }

  function build(){
    ov=document.createElement('div');
    ov.id='dtc-search';
    ov.className='s-ov';
    ov.hidden=true;
    ov.setAttribute('role','dialog');
    ov.setAttribute('aria-modal','true');
    ov.setAttribute('aria-label','Search the club website');
    ov.innerHTML='<div class="s-panel">'+
      '<div class="s-head">'+
        '<span class="s-ico">'+MAG+'</span>'+
        '<input class="s-input" type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Search the club…" aria-label="Search the club">'+
        '<span class="s-keys" aria-hidden="true"><kbd>/</kbd><kbd>Ctrl+K</kbd></span>'+
        '<button class="s-x" type="button" aria-label="Close search">'+CROSS+'</button>'+
      '</div>'+
      '<div class="s-body"></div>'+
      '<div class="s-foot"><span data-count></span><span class="s-hint">Pages, honour boards, Wall of Fame, office bearers, ladders &amp; allocations</span></div>'+
    '</div>';
    document.body.appendChild(ov);
    input=ov.querySelector('.s-input');
    bodyEl=ov.querySelector('.s-body');
    footEl=ov.querySelector('.s-foot');
    ov.querySelector('.s-x').addEventListener('click',close);
    ov.addEventListener('click',function(e){if(e.target===ov)close()});
    input.addEventListener('input',function(){active=0;render(input.value)});
    bodyEl.addEventListener('click',function(e){
      var a=e.target.closest('.s-item'); if(!a)return;
      /* let the browser follow the link; close after */
      close();
    });
    bodyEl.addEventListener('mousemove',function(e){
      var a=e.target.closest('.s-item'); if(!a)return;
      var i=+a.getAttribute('data-i'); if(!isNaN(i)&&i!==active){active=i;paintActive()}
    });
  }

  function openSearch(){
    if(!ov)build();
    if(open){input.focus();return}
    open=true; lastFocus=document.activeElement;
    if(sbtn)sbtn.setAttribute('aria-expanded','true');
    ov.hidden=false;
    document.body.style.overflow='hidden';
    render(input.value);
    setTimeout(function(){input.focus();input.select&&input.value&&input.select()},10);
  }
  function close(){
    if(!open)return;
    open=false;
    if(sbtn)sbtn.setAttribute('aria-expanded','false');
    ov.hidden=true;
    document.body.style.overflow='';
    if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(e){}
  }

  function isTypingTarget(el){
    if(!el||!el.tagName)return false;
    var t=el.tagName;
    return t==='INPUT'||t==='TEXTAREA'||t==='SELECT'||el.isContentEditable;
  }

  document.addEventListener('keydown',function(e){
    var k=e.key;
    if(k==='Escape'&&open){e.preventDefault();close();return}
    if((k==='k'||k==='K')&&(e.metaKey||e.ctrlKey)){e.preventDefault();openSearch();return}
    if(k==='/'&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!open&&!isTypingTarget(e.target)){e.preventDefault();openSearch();return}
    if(!open)return;
    if(k==='ArrowDown'){e.preventDefault();if(lastHits.length){active=Math.min(lastHits.length-1,(active<0?0:active+1));paintActive()} }
    else if(k==='ArrowUp'){e.preventDefault();if(lastHits.length){active=Math.max(0,active-1);paintActive()} }
    else if(k==='Enter'){ if(lastHits[active]){e.preventDefault();goActive()} }
  });

  function readyBtn(){
    sbtn=document.querySelector('.sbtn');
    if(!sbtn)return;
    sbtn.addEventListener('click',function(){open?close():openSearch()});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',readyBtn);
  else readyBtn();

  fetchPages();
  loadRecords();
})();
