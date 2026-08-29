import App from './App';
import BrowserRouter from 'react-router-dom/BrowserRouter';
import React from 'react';
import { hydrate } from 'react-dom';

/*
 * Podaci koje je server vec dovukao stizu u HTML-u (`window.__POCETNI_PODACI__`),
 * isto kao i podesavanja. Bez njih je prvi prikaz u pregledacu prazan, pa se
 * ne poklapa sa onim sto je server iscrtao.
 */
const pocetni = (typeof window !== 'undefined' && window.__POCETNI_PODACI__) || {};

hydrate(
  <BrowserRouter>
    <App initialData={pocetni.podaci} pocetnaPutanja={pocetni.putanja} />
  </BrowserRouter>,
  document.getElementById('root')
);

if (module.hot) {
  module.hot.accept();
}
