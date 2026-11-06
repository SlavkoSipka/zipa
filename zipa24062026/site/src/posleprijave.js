/*
 * Kuda korisnik ide posle prijave.
 *
 * Stoji u zasebnom fajlu, a ne u `routesList.js`, da ga strana prijave može
 * uvesti bez kružnog uvoza — `routesList` već uvozi samu stranu prijave.
 *
 * Administrator ide na nadzornu ploču, u administratorski okvir sa bočnim
 * menijem. Fotograf i kupac idu na svoj nalog, koji ima svoj bočni meni
 * (`components/nalogOkvir.js`). Nijedno od to dvoje nije stara vodoravna
 * traka — nje više nema.
 */
export const posleprijave = (uData) =>
    uData && uData.userRole === 'admin' ? '/account/dashboard'
        // Redaktor ima samo prevode (2026-11-06).
        : uData && uData.userRole === 'redaktor' ? '/account/prevodi'
        : '/account/profile';

export default posleprijave;
