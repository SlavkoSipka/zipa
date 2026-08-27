/*
 * BOJE GRAFIKONA IZ TOKENA
 *
 * Chart.js prima boje kao obične stringove i ne razume `var(--boja-…)`, pa se
 * tokeni ovde čitaju iz izračunatog stila na `<html>`. Time grafikoni prate
 * `data-tema` kao i sve ostalo, umesto da nose zakucane vrednosti.
 *
 * Rezervne vrednosti postoje zbog prikaza na serveru: tamo nema `window`, pa
 * se uzimaju vrednosti tema A. Na klijentu se prvim iscrtavanjem zamene
 * pravim tokenima.
 */

const REZERVA = {
    '--boja-povrsina':    '#FFFFFF',
    '--boja-tekst':       '#1B1E24',
    '--boja-tekst-tiho':  '#6B7079',
    '--boja-linija':      '#E6E8EB',
    '--boja-akcenat':     '#F2A93B',
    '--boja-oznaka':      '#D60006',
    '--boja-najava':      '#2877A3',
    '--boja-podloga-tiha': '#F5F6F8',
};

export function token(ime) {
    if (typeof window === 'undefined' || !window.getComputedStyle) {
        return REZERVA[ime] || '#000000';
    }
    const v = window.getComputedStyle(document.documentElement)
        .getPropertyValue(ime)
        .trim();
    return v || REZERVA[ime] || '#000000';
}

/*
 * Jedan skup podešavanja za sve linijske grafikone na sajtu — da svi izgledaju
 * isto i da se boja menja na jednom mestu.
 */
export function linija(naziv, podaci) {
    return {
        label: naziv,
        fill: false,
        lineTension: 0.4,
        backgroundColor: token('--boja-podloga-tiha'),
        borderColor: token('--boja-najava'),
        borderCapStyle: 'butt',
        borderDash: [],
        borderDashOffset: 0.0,
        borderJoinStyle: 'miter',
        pointBorderColor: token('--boja-najava'),
        pointBackgroundColor: token('--boja-povrsina'),
        pointBorderWidth: 1,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: token('--boja-najava'),
        pointHoverBorderColor: token('--boja-linija'),
        pointHoverBorderWidth: 2,
        pointRadius: 1,
        pointHitRadius: 10,
        data: podaci,
    };
}

export function stubic(naziv, podaci) {
    return {
        label: naziv,
        backgroundColor: token('--boja-najava'),
        borderColor: token('--boja-najava'),
        borderWidth: 1,
        hoverBackgroundColor: token('--boja-akcenat'),
        hoverBorderColor: token('--boja-akcenat'),
        data: podaci,
    };
}

export default { token, linija, stubic };
