(function(){
  /* con esto, los estados de partida de las animaciones solo existen si el script corre */
  document.documentElement.classList.add('mv-js');
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var IO = 'IntersectionObserver' in window;
  /* enciende una clase la primera vez que algo entra en pantalla */
  var alVer = function(el, umbral, fn){
    if (!el) return;
    if (reduce || !IO) { fn(); return; }
    var o = new IntersectionObserver(function(es){ if (es[0].isIntersecting) { fn(); o.disconnect(); } }, { threshold: umbral });
    o.observe(el);
  };

  /* ================================================================
     DEMO DEL CHAT: arrastrar los PDF, sumar el producto, enviar y ver
     cómo salen los anuncios: la imagen grande y, a la derecha, la
     columna de miniaturas que se va llenando, como en ChatGPT.
     El mensaje va sin texto: la instrucción del método no se muestra.
     ================================================================ */
  var demo = document.getElementById('mvDemo');
  if (demo) {
    var win = demo.querySelector('.mv-win'), hilo = demo.querySelector('.mv-hilo'), adj = demo.querySelector('.mv-adj'), send = demo.querySelector('.mv-send');
    var capB = demo.querySelector('.mv-cap-txt b'), capS = demo.querySelector('.mv-cap-txt span');
    var barras = [].slice.call(demo.querySelectorAll('.mv-cap-barras i')), pasos = [].slice.call(demo.querySelectorAll('.mv-pasos li'));
    var TITULOS = ['Arrastras los archivos', 'Sumas tu producto', 'Envías el mensaje y esperas'];
    var ARCH = ['01 Guía del método', '02 Protocolo Maestro', '03 Reality Layer', '04 Dirección Visual', '05 Corrige y Continúa', '06 Variedad Total'];
    var FOTO = 'assets/caso-cos/real-160.webp', FRASE = 'Genérame anuncios para este bolso';
    var texto = demo.querySelector('.mv-texto'), typed = demo.querySelector('.mv-typed');
    var IMGS = ['c6', 'c1', 'c3', 'c2', 'c5', 'c4', 'c7', 'c8'].map(function(n){ return 'assets/caso-cos/' + n + '-480.webp'; });
    var MINI = function(src){ return src.replace('-480.webp', '-160.webp'); };
    var BAJAR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="m6 13 6 6 6-6"/></svg>';
    var vuelta = 0, activo = false, precargado = false;
    var el = function(tag, cls, html){ var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
    var dormir = function(ms, v){ return new Promise(function(ok, no){ setTimeout(function(){ if (v === vuelta && activo) ok(); else no('corte'); }, ms); }); };
    var todos = function(raiz, sel){ return [].slice.call(raiz.querySelectorAll(sel)); };
    var paso = function(n){
      demo.setAttribute('data-paso', String(n));
      if (capB) capB.textContent = 'Paso ' + n + ' de 3';
      if (capS) capS.textContent = TITULOS[n - 1];
      barras.forEach(function(b, i){ b.classList.toggle('lleno', i < n); });
    };
    var limpiar = function(){ hilo.innerHTML = ''; adj.innerHTML = ''; typed.textContent = ''; texto.classList.remove('escribiendo'); win.classList.remove('con-hilo', 'soltando', 'arrastrando'); };
    var mensaje = function(){ return el('div', 'mv-yo', '<div class="mv-yo-adj"><span class="mv-yo-pdf"><b>PDF</b>6 archivos</span><span class="mv-yo-foto"><img src="' + FOTO + '" alt=""></span><span class="mv-yo-logo">logo</span></div><p>' + FRASE + '</p>'); };
    var galeria = function(){ return el('div', 'mv-galeria', '<div class="mv-gal-grande creando"><span class="mv-gal-est">Creando imagen</span><span class="mv-gal-editar">Editar</span><span class="mv-gal-bajar">' + BAJAR + '</span></div><div class="mv-gal-riel"><div class="mv-gal-col"></div></div>'); };
    /* cuando las miniaturas ya no entran, la columna sube sola */
    var acomodar = function(riel, col){ var d = Math.min(0, riel.clientHeight - col.scrollHeight); col.style.transform = 'translateY(' + d + 'px)'; riel.classList.toggle('movida', d < 0); };
    var precargar = function(){ if (precargado) return; precargado = true; IMGS.concat(IMGS.map(MINI), [FOTO]).forEach(function(src){ var i = new Image(); i.src = src; }); };
    var ciclo = async function(v){
      limpiar(); paso(1);
      await dormir(500, v);
      win.classList.add('arrastrando');
      await dormir(1250, v);
      win.classList.add('soltando');
      await dormir(650, v);
      for (var i = 0; i < ARCH.length; i++) { adj.appendChild(el('span', 'mv-file', '<b>PDF</b><em>' + ARCH[i] + '</em>')); await dormir(130, v); }
      win.classList.remove('soltando', 'arrastrando');
      await dormir(900, v);
      adj.innerHTML = ''; adj.appendChild(el('span', 'mv-grupo', '<b>PDF</b><em>6 archivos del método</em>'));
      paso(2);
      await dormir(700, v);
      adj.appendChild(el('span', 'mv-img', '<img src="' + FOTO + '" alt="">'));
      await dormir(500, v);
      adj.appendChild(el('span', 'mv-logo', 'logo'));
      await dormir(600, v);
      texto.classList.add('escribiendo');
      for (var c = 1; c <= FRASE.length; c++) { typed.textContent = FRASE.slice(0, c); await dormir(38, v); }
      await dormir(800, v);
      paso(3);
      send.classList.add('aprieta'); await dormir(200, v); send.classList.remove('aprieta');
      adj.innerHTML = ''; typed.textContent = ''; texto.classList.remove('escribiendo');
      win.classList.add('con-hilo');
      hilo.appendChild(mensaje());
      await dormir(700, v);
      var g = galeria(); hilo.appendChild(g);
      var grande = g.querySelector('.mv-gal-grande'), riel = g.querySelector('.mv-gal-riel'), col = g.querySelector('.mv-gal-col');
      for (var k = 0; k < IMGS.length; k++) {
        var rapido = k >= 1;   /* solo la primera se toma un respiro, para que se lea "Creando imagen" */
        var mini = el('i', 'mv-gal-mini pend'); col.appendChild(mini); acomodar(riel, col);
        todos(grande, 'img').forEach(function(x){ x.classList.add('sale'); });
        grande.classList.add('creando');
        await dormir(rapido ? 450 : 700, v);
        todos(grande, 'img').forEach(function(x){ x.remove(); });
        var im = el('img'); im.alt = ''; im.src = IMGS[k]; grande.appendChild(im);
        void im.offsetWidth; im.classList.add('lista');
        grande.classList.remove('creando');
        mini.classList.remove('pend'); mini.innerHTML = '<img src="' + MINI(IMGS[k]) + '" alt="">';
        todos(col, '.sel').forEach(function(x){ x.classList.remove('sel'); }); mini.classList.add('sel');
        await dormir(rapido ? 700 : 850, v);
      }
      await dormir(2800, v);
    };
    var correr = async function(){ var v = ++vuelta; try { while (activo && v === vuelta) await ciclo(v); } catch (e) {} };
    if (reduce) {
      paso(3); win.classList.add('con-hilo');
      hilo.appendChild(mensaje());
      var g0 = galeria(); hilo.appendChild(g0);
      var gr0 = g0.querySelector('.mv-gal-grande'), col0 = g0.querySelector('.mv-gal-col');
      gr0.classList.remove('creando');
      var im0 = el('img', 'lista'); im0.alt = ''; im0.src = IMGS[0]; gr0.appendChild(im0);
      IMGS.slice(0, 6).forEach(function(src, i){ col0.appendChild(el('i', 'mv-gal-mini' + (i ? '' : ' sel'), '<img src="' + MINI(src) + '" alt="">')); });
    } else if (IO) {
      /* empieza a bajar las imágenes bastante antes de que la demo entre en pantalla:
         así la primera ya está en memoria cuando toca mostrarla */
      var oPre = new IntersectionObserver(function(es){ if (es[0].isIntersecting) { precargar(); oPre.disconnect(); } }, { rootMargin: '1400px 0px' });
      oPre.observe(win);
      new IntersectionObserver(function(es){
        var v = es[0].isIntersecting;
        if (v && !activo) { activo = true; precargar(); correr(); }
        else if (!v && activo) { activo = false; vuelta++; }
      }, { threshold: 0.3 }).observe(win);
      document.addEventListener('visibilitychange', function(){
        if (document.hidden) { activo = false; vuelta++; }
      });
    } else { activo = true; precargar(); correr(); }
  }

  /* ================================================================
     EL CÍRCULO DE APRENDER SOLO: una estación por vez, en bucle
     ================================================================ */
  var rueda = document.getElementById('mvRueda');
  if (rueda) {
    var est = [].slice.call(rueda.querySelectorAll('.mv-estaciones li'));
    var num = rueda.querySelector('.mv-rueda-num'), txt = rueda.querySelector('.mv-rueda-txt'), hecho = rueda.querySelector('.mv-rueda-hecho');
    var L = 2 * Math.PI * 38, k = 0, t2 = null, vis2 = false, N = est.length;
    var dos = function(n){ return (n < 10 ? '0' : '') + n; };
    if (hecho) { hecho.style.strokeDasharray = L; hecho.style.strokeDashoffset = L * (1 - 0.06 / N); }
    var marcar = function(i){
      k = i;
      /* el icono, el texto y la línea roja cambian todos juntos, cuando termina el fundido.
         La línea termina JUSTO en el icono encendido (antes iba una estación adelantada). */
      var aplicar = function(){
        est.forEach(function(li, j){ li.classList.toggle('activo', j === i); });
        if (txt) {
          var t = est[i].querySelector('.mv-est-txt');
          txt.textContent = t ? t.textContent : '';
          if (num) num.textContent = dos(i + 1) + ' / ' + dos(N);
          txt.classList.remove('cambia');
        }
        if (hecho) hecho.style.strokeDashoffset = L * (1 - (i + 0.06) / N);
      };
      if (txt) { txt.classList.add('cambia'); setTimeout(aplicar, 300); } else aplicar();
      clearTimeout(t2);
      if (vis2) t2 = setTimeout(function(){ marcar((i + 1) % N); }, i === N - 1 ? 3400 : 2700);
    };
    if (!reduce && IO) {
      new IntersectionObserver(function(es){
        var v = es[0].isIntersecting;
        if (v && !vis2) { vis2 = true; marcar(k); }
        else if (!v && vis2) { vis2 = false; clearTimeout(t2); }
      }, { threshold: 0.4 }).observe(rueda);
    }
  }

  /* líneas que avanzan con el scroll: la del método y la de los pasos de la demo.
     Las posiciones se miden una vez (y al cambiar el tamaño); en cada cuadro solo se lee
     dónde está la lista y se escribe una variable: nada de recalcular el diseño a cada paso. */
  var lineaScroll = function(lista, base, off, largoDe){
    if (!lista) return;
    var items = [].slice.call(lista.children), tops = [], largo = 0;
    var medir = function(){ tops = items.map(function(li){ return li.offsetTop; }); largo = largoDe(items, lista); lista.style.setProperty('--largo', largo + 'px'); };
    var pintar = function(){
      var r = lista.getBoundingClientRect(), vh = innerHeight, ini = vh * 0.8, fin = vh * 0.4;
      var p = Math.min(1, Math.max(0, (ini - r.top) / (ini - fin + r.height)));
      lista.style.setProperty('--p', p.toFixed(4));
      var punta = base + largo * p;
      items.forEach(function(li, i){ li.classList.toggle('on', tops[i] + off <= punta + 1); });
    };
    medir();
    if (reduce || !IO) { lista.style.setProperty('--p', '1'); items.forEach(function(li){ li.classList.add('on'); }); return; }
    var pedido = false;
    var alMover = function(){ if (pedido) return; pedido = true; requestAnimationFrame(function(){ pedido = false; pintar(); }); };
    var alCambiar = function(){ medir(); alMover(); };
    new IntersectionObserver(function(es){
      if (es[0].isIntersecting) { addEventListener('scroll', alMover, { passive: true }); addEventListener('resize', alCambiar); }
      else { removeEventListener('scroll', alMover); removeEventListener('resize', alCambiar); }
      pintar();
    }).observe(lista);
  };
  lineaScroll(document.querySelector('#mvMetodo .mv-linea'), 18, 18, function(items){ return items[items.length - 1].offsetTop; });
  lineaScroll(document.querySelector('#mvDemo .mv-pasos'), 0, 18, function(items, lista){ return lista.offsetHeight; });

  /* el sello de garantía: el visto verde aparece al verlo */
  var sello = document.querySelector('.mv-sello');
  alVer(sello, 0.5, function(){ sello.classList.add('mv-visto'); setTimeout(function(){ sello.classList.add('mv-listo'); }, 2200); });
  /* con movimiento reducido, el sello queda quieto */
  if (reduce && sello) { var svgS = sello.querySelector('svg'); if (svgS && svgS.pauseAnimations) svgS.pauseAnimations(); }

  /* la franja fija: baja cuando la franja de arriba y el header ya salieron de la pantalla.
     Copia los textos de la franja real, que escribe la escalera de precios según el día. */
  var franja = document.querySelector('.announcement');
  if (franja) { var medir = function(){ document.documentElement.style.setProperty('--mv-franja', franja.offsetHeight + 'px'); }; medir(); addEventListener('resize', medir); }
  /* la marca: el brillo corre solo mientras se ve, y el subrayado del título grande se dibuja una vez */
  [].slice.call(document.querySelectorAll('.mv-marca')).forEach(function(m){
    if (reduce || !IO) { m.classList.add('mv-visto'); return; }
    var grande = m.classList.contains('mv-marca-grande');
    new IntersectionObserver(function(es){ var v = es[0].isIntersecting; if (v && grande && !m.classList.contains('mv-visto')) setTimeout(function(){ m.classList.add('mv-listo'); }, 1800); m.classList.toggle('mv-visto', v || (grande && m.classList.contains('mv-visto'))); }, { threshold: 0.6 }).observe(m);
  });

  /* los botones: un brillo metálico al aparecer (una vez); el de compra lo repite solo mientras se ve */
  [].slice.call(document.querySelectorAll('.btn:not(.light):not(.ghost)')).forEach(function(b){
    if (reduce || !IO) return;
    new IntersectionObserver(function(es){
      var v = es[0].isIntersecting;
      if (v) b.classList.add('mv-brillo');
      b.classList.toggle('mv-anim', v);
    }, { threshold: 0.6 }).observe(b);
  });

  /* la comparación: la X cae sobre el genérico y el premium se enciende */
  [].slice.call(document.querySelectorAll('.versus-card')).forEach(function(card){
    alVer(card, 0.55, function(){ card.classList.add('mv-visto'); });
  });

  /* el valor total se tacha cuando aparece la tarjeta de precio */
  var tarjeta = document.querySelector('.price-card');
  alVer(tarjeta, 0.35, function(){ tarjeta.classList.add('mv-visto'); });
  /* arriba del precio va la marca: el rótulo "Método completo" que escribe la escalera queda de más */
  var rotulo = document.querySelector('.price-reveal .launch-tag');
  if (rotulo && document.querySelector('.mv-marca-precio') && /^m[ée]todo completo$/i.test(rotulo.textContent.trim())) rotulo.hidden = true;

  /* el ahorro: las barras crecen y los números cuentan */
  var ahorro = document.getElementById('mvAhorro');
  alVer(ahorro, 0.35, function(){
    ahorro.classList.add('mv-visto');
    if (reduce) return;
    [].slice.call(ahorro.querySelectorAll('b[data-n]')).forEach(function(b, i){
      var fin = +b.getAttribute('data-n'), mas = b.getAttribute('data-mas') ? '+' : '', t0 = null, dur = 1300, espera = i * 150 + (mas ? 0 : 450);
      var fmt = function(n){ return 'USD ' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + mas; };
      b.textContent = fmt(0);
      setTimeout(function(){
        var cuadro = function(ts){ if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / dur); b.textContent = fmt(fin * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(cuadro); };
        requestAnimationFrame(cuadro);
      }, espera);
    });
  });

  /* ================================================================
     POPUP de bienvenida, como prueba: la mitad lo ve y la otra mitad no.
     El enlace de pago lleva src=popA o src=popB para comparar en Hotmart.
     ================================================================ */
  var pop = document.getElementById('mvPop');
  if (pop) {
    var variante = 'B', visto = false;
    try {
      variante = localStorage.getItem('ss_pop_var');
      if (variante !== 'A' && variante !== 'B') { variante = Math.random() < 0.5 ? 'A' : 'B'; localStorage.setItem('ss_pop_var', variante); }
      visto = localStorage.getItem('ss_pop_visto') === '1';
    } catch (e) { variante = 'B'; }
    document.addEventListener('click', function(e){
      var a = e.target && e.target.closest ? e.target.closest('a[href*="pay.hotmart.com"]') : null;
      if (!a) return;
      try { var u = new URL(a.href); if (!u.searchParams.get('src')) { u.searchParams.set('src', 'pop' + variante); a.href = u.toString(); } } catch (err) {}
    }, true);
    if (variante === 'A' && !visto) {
      var abierto = false, listo = false, reloj = pop.querySelector('.v2-cuenta-mini');
      var esc = function(e){ if (e.key === 'Escape') cerrar(); };
      var cerrar = function(){ pop.classList.remove('abierto'); document.removeEventListener('keydown', esc); setTimeout(function(){ pop.hidden = true; }, 450); };
      var abrir = function(){
        if (abierto) return;
        if (document.documentElement.classList.contains('precio-visible')) return;
        if (reloj && reloj.hidden) return;
        abierto = true;
        try { localStorage.setItem('ss_pop_visto', '1'); } catch (e) {}
        pop.hidden = false;
        requestAnimationFrame(function(){ requestAnimationFrame(function(){ pop.classList.add('abierto'); }); });
        document.addEventListener('keydown', esc);
      };
      [].slice.call(pop.querySelectorAll('[data-cerrar],[data-cerrar-ir]')).forEach(function(x){ x.addEventListener('click', cerrar); });
      setTimeout(function(){ listo = true; }, 6000);
      setTimeout(abrir, 22000);
      var alBajar = function(){
        if (!listo || abierto) return;
        if ((scrollY + innerHeight) / document.documentElement.scrollHeight > 0.45) { removeEventListener('scroll', alBajar); abrir(); }
      };
      addEventListener('scroll', alBajar, { passive: true });
    }
  }
})();
