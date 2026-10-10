/*
 * Strane agencije — jedan spisak za meni „Agencija" u zaglavlju i za bočni
 * panel na samim stranama (O nama, Kontakt, Uslovi…). 2026-10-10.
 */
/* Stavke panela „Agencija" — pločice sa ikonicom i kratkim opisom. Ikonice
   su jednostavni obrisi (24×24), boji ih `currentColor`. */
export const AGENCIJA = [
    { putanja: '/page/o-nama', naziv: 'O nama', opis: 'Ko smo i šta radimo',
      ikona: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 2a8 8 0 110 16 8 8 0 010-16zm-1 7h2v6h-2v-6zm0-4h2v2h-2V7z' },
    { putanja: '/contact', naziv: 'Kontakt', opis: 'Telefon, adresa i e-pošta',
      ikona: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm1 2.4V17h14V7.4l-7 4.9-7-4.9zM6.2 7l5.8 4 5.8-4H6.2z' },
    { putanja: '/page/uslovi-koriscenja', naziv: 'Uslovi korišćenja', opis: 'Pravila korišćenja sajta',
      ikona: 'M6 2h9l5 5v15H6V2zm2 2v16h10V8h-4V4H8zm2 7h6v2h-6v-2zm0 4h6v2h-6v-2z' },
    { putanja: '/page/ugovori', naziv: 'Ugovori', opis: 'Licence i ugovori o preuzimanju',
      ikona: 'M5 3h10l4 4v6h-2V8h-3V5H7v14h6v2H5V3zm11 12l1.4 1.4L15 18.8l3.6-3.6L20 16.6 15 21.6l-2.4-2.4L14 17.8l1 1 1-1z' },
    { putanja: '/page/prijatelji-sajta', naziv: 'Prijatelji sajta', opis: 'Partneri agencije',
      ikona: 'M8 11a4 4 0 110-8 4 4 0 010 8zm0-2a2 2 0 100-4 2 2 0 000 4zm8 2a3 3 0 110-6 3 3 0 010 6zM2 20c0-3.3 2.7-6 6-6s6 2.7 6 6h-2c0-2.2-1.8-4-4-4s-4 1.8-4 4H2zm13.5-6c2.5.2 4.5 2.4 4.5 5h2c0-3.7-2.9-6.7-6.5-7v2z' },
];

export const USLUGE = [
    { putanja: '/page/fotografisanje', naziv: 'Fotografisanje', opis: 'Fotografi agencije po narudžbi',
      ikona: 'M9 4h6l1.5 2H20a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1h3.5L9 4zm3 4a5 5 0 100 10 5 5 0 000-10zm0 2a3 3 0 110 6 3 3 0 010-6z' },
    { putanja: '/page/saradnja', naziv: 'Saradnja', opis: 'Za medije, firme i institucije',
      ikona: 'M3 7l5-3 4 2 4-2 5 3v7l-9 6-9-6V7zm2 1.2v4.7l7 4.7 7-4.7V8.2l-3.1-1.9L12 8.3 8.1 6.3 5 8.2z' },
];

