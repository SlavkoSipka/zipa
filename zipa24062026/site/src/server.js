import App from './App';
import React from 'react';
import { StaticRouter, matchPath } from 'react-router-dom';
import express from 'express';
import { renderToString } from 'react-dom/server';
import { routes } from './routesList';


const fetch = require('node-fetch')

const assets = require(process.env.RAZZLE_ASSETS_MANIFEST);

async function seoFetch(lang, url) {
  console.log(lang, url);
  return {};

}



const server = express();
server
  .disable('x-powered-by')
  .use(express.static(process.env.RAZZLE_PUBLIC_DIR))
  .get('/*', async (req, res) => {
    const context = {};
    console.log(req.url);

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
          promises.push(route.loadData[i](fetch, match, req.path, req.query, lang));
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



    let metaTags = generateSeoTags ? generateSeoTags(initialData) : { title: '', 'og:title': '' };
    const markup = renderToString(
      <StaticRouter context={context} location={req.url}>
        <App metaTags={metaTags}  initialData={initialData} />
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
        <title>${metaTags.title && metaTags.title}</title>
        <meta name="description" content='${metaTags.description && metaTags.description}' />
      <meta property="og:type"               content="website" />
      <meta property="og:title"              content='${metaTags.title && metaTags.title}' />
      <meta property="og:description"        content='${metaTags.description && metaTags.description}' />
      <meta property="og:image"              content="${metaTags['og:image'] && metaTags['og:image']}" />
       
        <meta name="viewport" content="width=device-width, initial-scale=1">
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
