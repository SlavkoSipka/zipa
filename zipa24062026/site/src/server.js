import App from './App';
import React from 'react';
import { StaticRouter, matchPath } from 'react-router-dom';
import express from 'express';
import compression from 'compression';
import { renderToString } from 'react-dom/server';
import { routes } from './routesList';


const fetch = require('node-fetch')

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

/*
 * PODEŠAVANJA SAJTA SE DOVLAČE NA SERVERU
 *
 * Ranije su stizala tek na klijentu, pa je server iscrtavao naslovnu bez
 * njih: `homePage.js` bi dobio `undefined` i vratio „trenutni", a čim bi
 * podešavanja stigla strana bi skočila na izabrani predlog. Posetilac je
 * video treptaj, a pretraživač je dobijao pogrešnu naslovnu — u izvoru
 * strane je stajao zatečeni izgled, ne onaj koji je klijent izabrao.
 *
 * Sada se podešavanja dovlače ovde i idu i u iscrtavanje i u početni HTML.
 *
 * Keš je kratak i u procesu: podešavanja se menjaju retko, a bez njega bi
 * svaka poseta bilo kojoj strani dodala jedan poziv ka API-ju. Greška se ne
 * propagira — ako API ne odgovori, ostaje poslednja poznata vrednost, a ako
 * je nema, prazan objekat i strana radi kao pre.
 */
const { API_ENDPOINT } = require('./constants');

const KES_TRAJANJE = 60 * 1000;
let kesPodesavanja = { kada: 0, vrednost: {} };

async function dovuciPodesavanja() {
  const sada = Date.now();
  if (kesPodesavanja.kada && sada - kesPodesavanja.kada < KES_TRAJANJE) {
    return kesPodesavanja.vrednost;
  }

  try {
    const odgovor = await fetch(`${API_ENDPOINT}/settings`, {
      method: 'GET',
      headers: { 'content-type': 'application/json' },
    });
    const vrednost = await odgovor.json();
    kesPodesavanja = { kada: sada, vrednost: vrednost || {} };
  } catch (e) {
    console.error('[podesavanja] ' + (e && e.message));
    kesPodesavanja.kada = sada;   // ne pokušavaj ponovo pri svakom zahtevu
  }

  return kesPodesavanja.vrednost;
}

async function seoFetch(lang, url) {
  console.log(lang, url);
  return {};

}



const server = express();
server
  .disable('x-powered-by')
  /*
   * Sazimanje odgovora. Strana naslovne je 170 KB, a galerija sa 156
   * fotografija 279 KB — najveci deo toga su podaci koje server salje uz
   * markup (`window.__POCETNI_PODACI__`), a takav tekst se sazima oko pet
   * puta. Na mobilnoj mrezi je to najveca pojedinacna usteda na sajtu.
   */
  .use(compression())
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', async (req, res) => {
    const context = {};
    console.log(req.url);

    // Uglaste zagrade su namerne — `process.env.RAZZLE_X` webpack zameni
    // vrednoscu iz gradnje, a `process.env['RAZZLE_X']` ostaje ziv upit.
    const adrese = {
      api:    process.env['RAZZLE_API_ENDPOINT'] || null,
      photos: process.env['RAZZLE_PHOTOS_ENDPOINT'] || process.env['RAZZLE_API_ENDPOINT'] || null,
    };

    let lang = 'ba';

    let initialData = {

    }

    let generateSeoTags = null;
    // inside a request
    const promises = [];
    // use `some` to imitate `<Switch>` behavior of selecting only
    // the first to match
    routes.some(route => {
      // use `matchPath` here

      const match = matchPath(req.path, route);
      
      
      if (match && (match.isExact  || !route.exact)) {
        if (route.generateSeoTags){
          generateSeoTags = route.generateSeoTags;
        }
        for (let i = 0; i < route.loadData.length; i++) {
          /*
           * Svako dovlačenje podataka se hvata posebno.
           *
           * Ranije je jedan neuspeh — API koji ne odgovori, ili vrati HTML
           * umesto podataka — obarao ceo proces sajta, za sve posetioce.
           * Tako je otvaranje /blog gasilo sajt, jer ta ruta u API-ju uopšte
           * ne postoji pa se vraćala stranica greške.
           *
           * Sada strana koja ne dobije podatke ostaje bez tog dela sadržaja,
           * a sve ostalo radi.
           */
          promises.push(
            Promise.resolve()
              .then(() => route.loadData[i](fetch, match, req.path, req.query, lang))
              .catch((e) => {
                console.error('[podaci] ' + req.path + ' - ' + (e && e.message));
                return {};
              })
          );
        }

     
      }
      return match && (match.isExact  || !route.exact);
    });




    let promisesRes = await Promise.all(promises);


    for (let i = 0; i < promisesRes.length; i++) {
      initialData = {
        ...initialData,
        ...promisesRes[i]
      }
    }



    // Podešavanja idu u isto iscrtavanje, pa server odmah crta pravu naslovnu.
    const podesavanja = await dovuciPodesavanja();

    let metaTags = generateSeoTags ? generateSeoTags(initialData) : { title: '', 'og:title': '' };
    const markup = renderToString(
      <StaticRouter context={context} location={req.url}>
        <App metaTags={metaTags} initialData={initialData} podesavanja={podesavanja} />
      </StaticRouter>
    );

    metaTags.title += ' - ZIPA PHOTO';
    metaTags['og:title'] = metaTags.title;



    if (context.url) {
      res.redirect(context.url);
    } else {
      res.status(200).send(
        `<!doctype html>
    <html lang="">
    <head>
        <meta name="color-scheme" content="only">
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta charset="utf-8" />

        <!-- Podesavanja sajta stizu SA SERVERA, pre bundla. App.js iz njih
             puni pocetno stanje, pa se prvi prikaz na klijentu poklapa sa
             onim koji je server vec iscrtao — bez treptaja i bez razlike
             pri hidraciji. -->
        <script>window.__PODESAVANJA__ = ${JSON.stringify(podesavanja).replace(/</g, '\\u003c')};</script>

        <!-- Adrese API-ja i slika, procitane iz ZIVE okoline servera. Razzle
             ugradjuje promenljive RAZZLE_* u snop pri gradnji, pa bi bez ovoga
             sajt izgradjen bez tih promenljivih zauvek trazio slike sa
             localhost-a. Citaju se preko uglastih zagrada, da ih webpack ne
             zameni vrednoscu iz gradnje. -->
        <script>window.__ADRESE__ = ${JSON.stringify(adrese).replace(/</g, '\\u003c')};</script>

        <!-- Podaci strane koje je server vec dovukao, isti oni sa kojima je
             iscrtao markup ispod. Bez njih klijent prvi put crta PRAZNU stranu
             pa se hidracija ne poklopi: React usvoji zatecene cvorove sa
             pogresnim klasama, i traka sa naslovne C zavrsi preko naslovne
             fotografije. Polje "putanja" cuva stranu za koju su dovuceni, pa
             se ne useljavaju u neku drugu.
             su dovuceni. -->
        <script>window.__POCETNI_PODACI__ = ${JSON.stringify({ putanja: req.path, podaci: initialData }).replace(/</g, '\\u003c')};</script>

        <!-- Tema izgleda se postavlja PRE prvog iscrtavanja, iz istog
             podesavanja kojim se bira naslovna. Rezerva je pamcenje
             pregledaca, pa zatim „trenutni“ — zateceni izgled, bezbedan
             pocetak ako podesavanja nisu stigla. -->
        <script>(function(){try{var p=window.__PODESAVANJA__||{};var s=null;try{var m=/[?&]izgled=(a|b|c|trenutni|podesavanja)(?:&|$)/.exec(location.search);if(m&&m[1]==='podesavanja'){sessionStorage.removeItem('izgledPregled');}else if(m){sessionStorage.setItem('izgledPregled',m[1]);}s=sessionStorage.getItem('izgledPregled');}catch(e){}var t=s||p.homepageLayout||localStorage.getItem('tema');if(['a','b','c','trenutni'].indexOf(t)===-1)t='trenutni';document.documentElement.setAttribute('data-tema',t);}catch(e){document.documentElement.setAttribute('data-tema','trenutni');}})();</script>

        <title>${metaTags.title && metaTags.title}</title>
        <meta name="description" content='${metaTags.description && metaTags.description}' />
      <meta property="og:type"               content="website" />
      <meta property="og:title"              content='${metaTags.title && metaTags.title}' />
      <meta property="og:description"        content='${metaTags.description && metaTags.description}' />
      <meta property="og:image"              content="${metaTags['og:image'] && metaTags['og:image']}" />
       
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <!-- Pisma se učitavaju iz zaglavlja, ne kroz @import u CSS-u koji
             blokira prikaz.

             Figtree nosi pravac „tamna traka" — naslove, tekst i podatke,
             u težinama 400/500/600. Poppins ostaje dok god tema „trenutni"
             zavisi od njega.

             Archivo Narrow, Source Sans 3 i IBM Plex Mono su izbačeni sa
             pravcem 1 — nijedna font-family ih više ne pominje. -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400..700&family=Poppins:wght@300;400;500;600;700&display=swap">
        ${
        assets.client.css
          ? `<link rel="stylesheet" href="${assets.client.css}">`
          : ''
        }
        ${
        process.env.NODE_ENV === 'production'
          ? `<script src="${assets.client.js}" defer></script>`
          : `<script src="${assets.client.js}" defer crossorigin></script>`
        }

        <!-- Global site tag (gtag.js) - Google Analytics --> <script async src="https://www.googletagmanager.com/gtag/js?id=UA-57909227-1"></script> <script>   window.dataLayer = window.dataLayer || [];   function gtag(){dataLayer.push(arguments);}   gtag('js', new Date());    gtag('config', 'UA-57909227-1'); </script>
    </head>
    <body>
        <div id="root">${markup}</div>
        <script>async function WebpIsSupported(){if(!self.createImageBitmap)return!1;const e=await fetch("data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoCAAEAAQAcJaQAA3AA/v3AgAA=").then(e=>e.blob());return createImageBitmap(e).then(()=>!0,()=>!1)}async function checkWebp(){if(localStorage.getItem("_webpSupport"))return void(window._webpSupport="1");await WebpIsSupported()&&(window._webpSupport="1",localStorage.setItem("_webpSupport","1"))}checkWebp();</script>
        </body>
</html>`
      );
    }
  });

export default server;
