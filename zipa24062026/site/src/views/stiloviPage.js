import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';

import Page from '../containers/page';

/**
 * Strana sa sistemom stilova.
 *
 * Nije javna strana sajta nego radni alat: na jednom mestu stoje sve
 * vrednosti iz `scss/_tokens.scss` i sve komponente iz `scss/_komponente.scss`.
 * Čemu služi:
 *
 *   1. Pri redizajnu podstrane — uzme se gotov deo odavde umesto pisanja
 *      novog. Tako se ne vraćamo na 111 boja i 39 veličina slova.
 *   2. Preklopnik tema pokazuje sve četiri odjednom. Ako neka boja negde
 *      propadne, ovde se to vidi za pet sekundi umesto obilaskom celog sajta.
 *   3. Boje su ispisane sa izmerenim odnosom kontrasta, pa se ne pogađa.
 *
 * Preklopnik menja `data-tema` samo dok je strana otvorena. Kad se ode sa
 * nje, `App.js` vraća temu iz podešavanja — ovde se ništa ne pamti.
 */

const BOJE = [
    { ime: '--boja-podloga',          opis: 'pozadina strane — bela' },
    { ime: '--boja-podloga-tiha',     opis: 'sekcije, polja, zebra u tabeli' },
    { ime: '--boja-povrsina',         opis: 'kartica, panel' },
    { ime: '--boja-tekst',            opis: 'tekst', kontrast: '16,70:1' },
    { ime: '--boja-tekst-tiho',       opis: 'datum, autor, lokacija', kontrast: '4,98:1' },
    { ime: '--boja-linija',           opis: 'svako razdvajanje' },
];

/* Traka je jedina tamna površina na sajtu — zaglavlje i naslovni blok.
 * Ovo je i jedina grupa koju teme A, B i C razlikuju. */
const BOJE_TRAKA = [
    { ime: '--boja-traka',            opis: 'podloga trake' },
    { ime: '--boja-traka-tekst',      opis: 'tekst u traci', kontrast: '18,62:1' },
    { ime: '--boja-traka-tekst-tiho', opis: 'podnaslov, brojač u traci', kontrast: '9,44:1' },
    { ime: '--boja-traka-linija',     opis: 'razdvajanje unutar trake' },
];

const BOJE_RADNJA = [
    { ime: '--boja-akcenat',          opis: 'amber — pretraga i glavna radnja. NIKAD kao tekst.' },
    { ime: '--boja-akcenat-tekst',    opis: 'tekst NA amberu', kontrast: '6,87:1' },
    { ime: '--boja-akcenat-jako',     opis: 'pritisnuto stanje', kontrast: '5,53:1' },
    { ime: '--boja-oznaka',           opis: 'crvena identiteta — oznake, aktivno' },
    { ime: '--boja-oznaka-tekst',     opis: 'crvena kao sam tekst', kontrast: '5,44:1' },
    { ime: '--boja-najava',           opis: 'traka najave na vrhu', kontrast: '6,51:1' },
    { ime: '--boja-uspeh',            opis: 'uspelo', kontrast: '6,62:1' },
    { ime: '--boja-upozorenje',       opis: 'pažnja', kontrast: '5,92:1' },
    { ime: '--boja-tekst-na-akcentu', opis: 'izvedeno — gleda u tekst za amber' },
    { ime: '--boja-zavesa',           opis: 'zatamnjenje iza prozora' },
];

const SLOVA = [
    { ime: '--slovo-3xl', opis: 'naslovni blok' },
    { ime: '--slovo-2xl', opis: 'naslov strane' },
    { ime: '--slovo-xl',  opis: 'naslov odeljka' },
    { ime: '--slovo-lg',  opis: 'naslov kartice' },
    { ime: '--slovo-md',  opis: 'tekst' },
    { ime: '--slovo-sm',  opis: 'podaci uz fotografiju' },
    { ime: '--slovo-xs',  opis: 'oznaka, brojač' },
];

const RAZMACI = ['--razmak-1', '--razmak-2', '--razmak-3', '--razmak-4',
                 '--razmak-5', '--razmak-6', '--razmak-7', '--razmak-8'];

const TEME = [
    { kljuc: 'trenutni', natpis: 'Trenutni', opis: 'zatečeni izgled — mreža za pad' },
    { kljuc: 'a',        natpis: 'A',        opis: 'crna traka' },
    { kljuc: 'b',        natpis: 'B',        opis: 'tamnoplava traka' },
    { kljuc: 'c',        natpis: 'C',        opis: 'topla skoro crna traka' },
];

class StiloviPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            tema: 'a',
            vrednosti: {},
            cekaDugme: false,
            listaOtvorena: false,
        };
    }

    componentDidMount() {
        this.primeni(this.state.tema);
    }

    componentWillUnmount() {
        /* Vraćamo pravu temu — preklopnik važi samo dok je ova strana otvorena.
           Uzima se iz pamćenja, gde `App.js` drži vrednost iz podešavanja; ne
           iz zatečenog atributa, jer je njega upravo ova strana i menjala. */
        let prava = 'trenutni';
        try {
            const zapamcena = localStorage.getItem('tema');
            if (['a', 'b', 'c', 'trenutni'].indexOf(zapamcena) !== -1) prava = zapamcena;
        } catch (e) { /* privatni režim */ }

        document.documentElement.setAttribute('data-tema', prava);
    }

    /* Čitamo izračunate vrednosti sa <html>, da se ispiše ono što zaista
       važi — ne ono što piše u fajlu. */
    ocitaj = () => {
        const s = getComputedStyle(document.documentElement);
        const v = {};
        BOJE.concat(BOJE_TRAKA, BOJE_RADNJA, SLOVA.map(x => ({ ime: x.ime })))
            .map(x => x.ime)
            .concat(RAZMACI, ['--radijus-mali', '--radijus-panel', '--radijus-pun',
                              '--pismo-naslov', '--pismo-tekst', '--pismo-podaci'])
            .forEach((ime) => { v[ime] = s.getPropertyValue(ime).trim(); });
        this.setState({ vrednosti: v });
    }

    primeni = (tema) => {
        document.documentElement.setAttribute('data-tema', tema);
        this.setState({ tema }, () => {
            // Sačekamo da pregledač primeni nove vrednosti pre očitavanja.
            window.requestAnimationFrame(this.ocitaj);
        });
    }

    render() {
        const { vrednosti, tema } = this.state;

        /* Jedan uzorak boje. Isti prikaz za sve tri grupe. */
        const uzorak = (b) => (
            <div className="stilovi__boja" key={b.ime}>
                <span
                    className="stilovi__uzorak"
                    style={{ background: 'var(' + b.ime + ')' }}
                />
                <span className="stilovi__boja-opis">
                    <code>{b.ime}</code>
                    <em>{b.opis}</em>
                    <span className="stilovi__vrednost">
                        {vrednosti[b.ime]}
                        {b.kontrast ? ' · kontrast ' + b.kontrast : ''}
                    </span>
                </span>
            </div>
        );

        return (
            <div className="stilovi">
                <Container>

                    <header className="stilovi__zaglavlje">
                        <h1>Sistem stilova</h1>
                        <p>
                            Sve vrednosti sa ove strane dolaze iz <code>scss/_tokens.scss</code>,
                            sve komponente iz <code>scss/_komponente.scss</code>. Ništa ovde nije
                            zakucano — što se vidi, to je i u kodu.
                        </p>

                        <div className="stilovi__teme" role="group" aria-label="Izbor teme">
                            {TEME.map((t) => (
                                <button
                                    key={t.kljuc}
                                    type="button"
                                    className={'z-pilula' + (tema === t.kljuc ? ' z-pilula--ukljuceno' : '')}
                                    aria-pressed={tema === t.kljuc}
                                    onClick={() => this.primeni(t.kljuc)}
                                >
                                    {t.natpis}
                                    <span className="z-pilula__broj">{t.opis}</span>
                                </button>
                            ))}
                        </div>
                    </header>


                    {/* ── BOJE ─────────────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Boje</h2>
                        <p className="stilovi__uvod">
                            Imena su po ulozi, ne po boji. Kad se tema promeni, uloga ostaje ista.
                            Zatečeno stanje je imalo 111 boja.
                        </p>

                        <div className="stilovi__boje">
                            {BOJE.map(uzorak)}
                        </div>

                        <h3 className="stilovi__podnaslov">Traka</h3>
                        <p className="stilovi__uvod">
                            Zaglavlje i naslovni blok — jedina tamna površina na sajtu.
                            Ovo je i jedino po čemu se teme A, B i C razlikuju.
                        </p>
                        <div className="stilovi__boje">
                            {BOJE_TRAKA.map(uzorak)}
                        </div>

                        <h3 className="stilovi__podnaslov">Radnja i oznaka</h3>
                        <p className="stilovi__uvod">
                            Amber je <strong>površina</strong>, ne tekst — kao tekst na beloj
                            daje 2,00:1 i nikad ne sme tako da stoji.
                        </p>
                        <div className="stilovi__boje">
                            {BOJE_RADNJA.map(uzorak)}
                        </div>
                    </section>


                    {/* ── SLOVA ────────────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Slova</h2>
                        <p className="stilovi__uvod">
                            Jedno pismo nosi ceo sajt: <strong>{vrednosti['--pismo-naslov']}</strong>{' '}
                            — i naslovi, i tekst, i podaci. Mono pisma u ovom pravcu nema;
                            kataloški broj se izdvaja težinom 500, ne pismom. Zatečeno stanje
                            je imalo 39 veličina; ovde ih je sedam.
                        </p>

                        {SLOVA.map((s) => (
                            <div className="stilovi__slovo" key={s.ime}>
                                <span
                                    className="stilovi__primer"
                                    style={{ fontSize: 'var(' + s.ime + ')' }}
                                >
                                    Snimak sa lica mesta
                                </span>
                                <span className="stilovi__oznaka-tokena">
                                    <code>{s.ime}</code> {vrednosti[s.ime]} · {s.opis}
                                </span>
                            </div>
                        ))}

                        <div className="stilovi__pisma">
                            <p style={{ fontFamily: 'var(--pismo-naslov)' }}>
                                Naslov — ZIPA PHOTO, arhiva od 1995.
                            </p>
                            <p style={{ fontFamily: 'var(--pismo-tekst)' }}>
                                Tekst — Devet hiljada devetsto šezdeset pet galerija,
                                dvesta dve hiljade fotografija, šezdeset dva fotografa.
                            </p>
                            <p style={{ fontFamily: 'var(--pismo-podaci)' }}>
                                Podaci — ZP-2024-0317-a4f9 · 5472×3648 · 12.4 MB · 0O1lI
                            </p>
                        </div>
                    </section>


                    {/* ── RAZMACI I RADIJUSI ───────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Razmaci i radijusi</h2>
                        <p className="stilovi__uvod">
                            Lestvica od 4px, osam stepeni umesto zatečenih 79 vrednosti.
                            Radijusa ima dva — osnovni 6 i pilula. Oštrih 2px više nema.
                        </p>

                        <div className="stilovi__razmaci">
                            {RAZMACI.map((r) => (
                                <div className="stilovi__razmak" key={r}>
                                    <span
                                        className="stilovi__traka"
                                        style={{ width: 'var(' + r + ')', height: 'var(' + r + ')' }}
                                    />
                                    <code>{r}</code>
                                    <span className="stilovi__vrednost">{vrednosti[r]}</span>
                                </div>
                            ))}
                        </div>

                        <div className="stilovi__radijusi">
                            {['--radijus-mali', '--radijus-panel', '--radijus-pun'].map((r) => (
                                <div className="stilovi__radijus" key={r}>
                                    <span style={{ borderRadius: 'var(' + r + ')' }} />
                                    <code>{r}</code>
                                    <span className="stilovi__vrednost">{vrednosti[r]}</span>
                                </div>
                            ))}
                        </div>
                    </section>


                    {/* ── DUGMAD ───────────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Dugmad</h2>
                        <p className="stilovi__uvod">
                            Glavno dugme je jedno po ekranu. Sve ostalo je sporedno ili tiho.
                            Probaj tastaturom — <kbd>Tab</kbd> pokazuje okvir fokusa,
                            klik mišem ga ne pokazuje.
                        </p>

                        <div className="stilovi__red">
                            <button type="button" className="z-dugme z-dugme--glavno">Dodaj u korpu</button>
                            <button type="button" className="z-dugme z-dugme--sporedno">Preuzmi pregled</button>
                            <button type="button" className="z-dugme z-dugme--tiho">Otkaži</button>
                            <button type="button" className="z-dugme z-dugme--opasno">Obriši galeriju</button>
                        </div>

                        <div className="stilovi__red">
                            <button type="button" className="z-dugme z-dugme--glavno z-dugme--malo">Malo</button>
                            <button type="button" className="z-dugme z-dugme--glavno">Obično</button>
                            <button type="button" className="z-dugme z-dugme--glavno z-dugme--veliko">Veliko</button>
                        </div>

                        <div className="stilovi__red">
                            <button type="button" className="z-dugme z-dugme--glavno" disabled>Isključeno</button>
                            <button type="button" className="z-dugme z-dugme--sporedno" disabled>Isključeno</button>
                            <button
                                type="button"
                                className={'z-dugme z-dugme--glavno' + (this.state.cekaDugme ? ' z-dugme--ceka' : '')}
                                onClick={() => {
                                    this.setState({ cekaDugme: true });
                                    setTimeout(() => this.setState({ cekaDugme: false }), 2000);
                                }}
                            >
                                Klikni — pa čeka
                            </button>
                        </div>
                    </section>


                    {/* ── POLJA ────────────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Polja</h2>
                        <Row>
                            <Col lg="6">
                                <label className="z-polje">
                                    <span className="z-polje__natpis">
                                        Pojam za pretragu
                                        <span className="z-polje__obavezno">*</span>
                                    </span>
                                    <input className="z-polje__unos" placeholder="npr. Banjaluka, protest, 2018" />
                                    <span className="z-polje__pomoc">Pretražuje se i naziv galerije i opis svake fotografije.</span>
                                </label>
                            </Col>
                            <Col lg="6">
                                <label className="z-polje z-polje--greska">
                                    <span className="z-polje__natpis">Elektronska pošta</span>
                                    <input className="z-polje__unos" defaultValue="marko@" />
                                    <span className="z-polje__pomoc">Adresa nije potpuna.</span>
                                </label>
                            </Col>
                            <Col lg="6">
                                <label className="z-polje">
                                    <span className="z-polje__natpis">Isključeno</span>
                                    <input className="z-polje__unos" defaultValue="ZP-2024-0317-a4f9" disabled />
                                </label>
                            </Col>
                            <Col lg="6">
                                <label className="z-polje">
                                    <span className="z-polje__natpis">Napomena</span>
                                    <textarea className="z-polje__unos" placeholder="Za koju svrhu se fotografija koristi?" />
                                </label>
                            </Col>
                        </Row>
                    </section>


                    {/* ── PADAJUĆA LISTA ───────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Padajuća lista</h2>
                        <p className="stilovi__uvod">
                            Jedno od dva mesta gde senka sme — lista stvarno lebdi iznad strane.
                        </p>
                        <div className="z-lista">
                            <button
                                type="button"
                                className="z-dugme z-dugme--sporedno"
                                aria-expanded={this.state.listaOtvorena}
                                onClick={() => this.setState({ listaOtvorena: !this.state.listaOtvorena })}
                            >
                                Sve kategorije ▾
                            </button>
                            {this.state.listaOtvorena ? (
                                <div className="z-lista__meni">
                                    <button type="button" className="z-lista__stavka z-lista__stavka--izabrano">Sve kategorije</button>
                                    <button type="button" className="z-lista__stavka">Politika</button>
                                    <button type="button" className="z-lista__stavka">Sport</button>
                                    <button type="button" className="z-lista__stavka">Kultura</button>
                                    <hr className="z-lista__razdvajac" />
                                    <button type="button" className="z-lista__stavka">Arhiva pre 2000.</button>
                                </div>
                            ) : null}
                        </div>
                    </section>


                    {/* ── OZNAKE I PILULE ──────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Oznake i pilule filtera</h2>
                        <div className="stilovi__red">
                            <span className="z-oznaka">Politika</span>
                            <span className="z-oznaka z-oznaka--akcenat">Novo</span>
                            <span className="z-oznaka z-oznaka--oznaka">Izdvojeno</span>
                            <span className="z-oznaka z-oznaka--uspeh">Plaćeno</span>
                            <span className="z-oznaka z-oznaka--upozorenje">Bez datuma</span>
                            <span className="z-oznaka z-oznaka--podatak">ZP-2024-0317-a4f9</span>
                        </div>
                        <div className="stilovi__red">
                            <button type="button" className="z-pilula">Sport <span className="z-pilula__broj">1.204</span></button>
                            <button type="button" className="z-pilula z-pilula--ukljuceno">
                                Politika <span className="z-pilula__broj">3.881</span>
                                <span className="z-pilula__skini" aria-hidden="true">×</span>
                            </button>
                            <button type="button" className="z-pilula z-pilula--ukljuceno">
                                2018. <span className="z-pilula__skini" aria-hidden="true">×</span>
                            </button>
                            <button type="button" className="z-pilula">Kultura <span className="z-pilula__broj">742</span></button>
                        </div>
                    </section>


                    {/* ── KARTICA ──────────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Kartica galerije</h2>
                        <p className="stilovi__uvod">
                            Bez senke — u toku strane razdvaja linija. Senka se javlja tek pri
                            prelazu mišem, kao znak da se može kliknuti.
                        </p>
                        <Row>
                            <Col lg="4" md="6">
                                <div className="z-kartica z-kartica--klikce">
                                    <span className="z-kartica__slika" />
                                    <div className="z-kartica__telo">
                                        <h3 className="z-kartica__naslov">Otvaranje mosta na Vrbasu</h3>
                                        <div className="z-kartica__podaci">
                                            <span>17.03.2024.</span>
                                            <span>M. Petrović</span>
                                            <span>48 fotografija</span>
                                        </div>
                                        <div className="z-kartica__podaci">
                                            <span className="z-oznaka z-oznaka--podatak">a4f9</span>
                                        </div>
                                    </div>
                                </div>
                            </Col>
                            <Col lg="4" md="6">
                                <div className="z-kartica">
                                    <span className="z-kostur z-kostur--slika" />
                                    <div className="z-kartica__telo">
                                        <span className="z-kostur z-kostur--naslov" />
                                        <span className="z-kostur z-kostur--red" />
                                        <span className="z-kostur z-kostur--red-kratak" />
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </section>


                    {/* ── OBAVEŠTENJA ──────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Obaveštenja</h2>
                        <p className="stilovi__uvod">
                            Boja nikad ne nosi poruku sama — uz nju uvek ide znak i reč, jer boju
                            ne razlikuje svako.
                        </p>
                        <div className="stilovi__poruke">
                            <div className="z-poruka z-poruka--uspeh">
                                <span className="z-poruka__znak" aria-hidden="true">✓</span>
                                <div className="z-poruka__sadrzaj">
                                    <p className="z-poruka__naslov">Galerija je objavljena</p>
                                    Vidljiva je posetiocima i pretraživa u arhivi.
                                </div>
                                <button type="button" className="z-poruka__zatvori" aria-label="Zatvori">×</button>
                            </div>
                            <div className="z-poruka z-poruka--greska">
                                <span className="z-poruka__znak" aria-hidden="true">✕</span>
                                <div className="z-poruka__sadrzaj">
                                    <p className="z-poruka__naslov">Postavljanje nije uspelo</p>
                                    Tri fotografije prelaze najveću dozvoljenu veličinu.
                                </div>
                            </div>
                            <div className="z-poruka z-poruka--upozorenje">
                                <span className="z-poruka__znak" aria-hidden="true">⚠</span>
                                <div className="z-poruka__sadrzaj">
                                    Galerija nema datum snimanja — neće se pojaviti u pretrazi po godini.
                                </div>
                            </div>
                            <div className="z-poruka z-poruka--obavest">
                                <span className="z-poruka__znak" aria-hidden="true">i</span>
                                <div className="z-poruka__sadrzaj">
                                    Cena zavisi od rezolucije. Pregled je uvek besplatan.
                                </div>
                            </div>
                        </div>
                    </section>


                    {/* ── STRANIČENJE ──────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Straničenje</h2>
                        <nav className="z-stranice" aria-label="Straničenje">
                            <button type="button" className="z-stranice__dugme" disabled>‹ Prethodna</button>
                            <button type="button" className="z-stranice__dugme z-stranice__dugme--ovde">1</button>
                            <button type="button" className="z-stranice__dugme">2</button>
                            <button type="button" className="z-stranice__dugme">3</button>
                            <span className="z-stranice__razmak">…</span>
                            <button type="button" className="z-stranice__dugme">416</button>
                            <button type="button" className="z-stranice__dugme">Sledeća ›</button>
                            <span className="z-stranice__ukupno">9.965 galerija</span>
                        </nav>
                    </section>


                    {/* ── PRAZNO STANJE ────────────────────────────────── */}
                    <section className="stilovi__odeljak">
                        <h2>Prazno stanje</h2>
                        <p className="stilovi__uvod">
                            Nikad samo „Nema rezultata" — uvek se kaže i šta dalje.
                        </p>
                        <div className="z-prazno">
                            <span className="z-prazno__znak" aria-hidden="true">⌕</span>
                            <h3 className="z-prazno__naslov">Ništa ne odgovara pretrazi</h3>
                            <p className="z-prazno__tekst">
                                Za „protest banjaluka 1994" nema pogodaka. Arhiva počinje 1995.
                                godine, pa pokušaj sa širim vremenskim opsegom.
                            </p>
                            <div className="z-prazno__radnje">
                                <button type="button" className="z-dugme z-dugme--glavno">Traži u celoj arhivi</button>
                                <button type="button" className="z-dugme z-dugme--tiho">Skini sve uslove</button>
                            </div>
                        </div>
                    </section>

                </Container>
            </div>
        );
    }
}

export default Page(StiloviPage);
