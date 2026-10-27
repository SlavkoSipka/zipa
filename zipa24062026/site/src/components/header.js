import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom';

import Isvg from 'react-inlinesvg';

import cart from '../assets/svg/cart.svg';
import search from '../assets/svg/search.svg';
import filterIcon from '../assets/svg/filters.svg';
// Znak ZIPA PHOTO: beli za tamnu traku, tamni za belu (tema C).
import znakZipa from '../assets/svg/footer-logo.svg';
import znakZipaTamni from '../assets/svg/logo.svg';

// Zastavica za `ba` je crtez, ne slika: leva polovina je srpska trobojka
// (bez grba), desna ostaje zastava BiH. Kao SVG je ostra na svakoj meri.
import ba from '../assets/svg/jezik-ba.svg';
import en from '../assets/images/en.png';
import PretragaSaPrijedlozima from './pretragaSaPrijedlozima';
import ProzorNajave from './prozorNajave';
import { AGENCIJA, USLUGE } from './agencijaStrane';

/* Ikonice naslova u padajućim menijima (2026-10-27) — obrisi 24×24, boji ih
   crvena oznake. Isti jezik kao u panelu „Agencija". */
const IKONE = {
    galerije: 'M7 3h14a1 1 0 011 1v12a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1zm1 2v8.2l3-3 3 3 2-2 3 3V5H8zM2 7h2v13h13v2H3a1 1 0 01-1-1V7zm13 1.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
    osnovne: 'M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm8-2h8v8h-8v-8zm2 2v4h4v-4h-4z',
    preporucene: 'M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1L12 2zm0 4.5l-1.8 3.7-4.1.6 3 2.9-.7 4.1 3.6-1.9 3.6 1.9-.7-4.1 3-2.9-4.1-.6L12 6.5z',
    specijal: 'M6 2h12a1 1 0 011 1v19l-7-4-7 4V3a1 1 0 011-1zm1 2v14.6l5-2.9 5 2.9V4H7z',
    cjenovnik: 'M3 3h8.6l9.7 9.7a1 1 0 010 1.4l-7.2 7.2a1 1 0 01-1.4 0L3 11.6V3zm2 2v5.8l8.4 8.4 5.8-5.8L10.8 5H5zm3.5 4a1.5 1.5 0 110-3 1.5 1.5 0 010 3z',
    nalog: 'M12 12a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6zM4 22a8 8 0 0116 0h-2a6 6 0 00-12 0H4z',
};

const GALERIJE = [
    { putanja: '/galerije', naziv: 'Sve galerije', opis: 'Cijela arhiva, od 1995. do danas' },
    { putanja: '/galerije?view=photos', naziv: 'Fotografije', opis: 'Pretraga po pojedinačnim fotografijama' },
];

const CJENOVNIK = [
    { putanja: '/page/cjenovnik', naziv: 'Cjenovnik', opis: 'Cijene fotografija i licenci' },
    { putanja: '/help', naziv: 'Pomoć', opis: 'Uputstva i česta pitanja' },
];
import {PHOTOS_ENDPOINT} from '../constants';

/*
 * ZAGLAVLJE SAJTA
 *
 * Dva sloja:
 *   1. tanka traka — naziv agencije, POMOĆ, cenovnik, jezik. Sve što se
 *      otvori jednom mesečno.
 *   2. glavni red — logo, navigacija, pretraga, korpa, nalog. Sve što se
 *      otvara svaki put.
 *
 * Zašto dva a ne jedan: u zatečenom stanju su se logo, POMOĆ, zastavica i dva
 * dugmeta za prijavu tukli za istu liniju, pa je pretraga — jedini razlog
 * zbog kog neko dolazi na sajt — završila kao ikonica. Razdvajanje po
 * učestalosti oslobađa glavni red da pretraga u njemu bude široka.
 *
 * Pri skrolovanju se tanka traka skuplja na ništa i glavni red se stanjuje;
 * zaglavlje ostaje zalepljeno za vrh, ne beži. Pretraga i logo se pri tome ne
 * gube — samo se stisnu.
 *
 * Jedan markup za sve širine. Na telefonu isti <nav> postaje fioka koja klizi
 * sa strane; nema drugog primerka menija u kodu.
 *
 * Izgled je u `scss/_zaglavlje.scss`. Stari zaglavlje-blok u `_global.scss`
 * (redovi 87–1346) ostaje netaknut jer i dalje služi naloznoj navigaciji
 * (`.navigation ul.account-nav`), koja se ovde prenosi nepromenjena.
 */

// Padajući paneli koji mogu biti otvoreni — jedan po jedan.
const PANELI = ['galerije', 'kategorije', 'agencija', 'cjenovnik', 'nalog'];

class Header extends Component {
    constructor(props) {
        super(props);

        this.state = {
            yScroll: 0,
            pretraga: '',
            // Izbor vrste pretrage levo od polja. `view=photos` je isti
            // parametar koji `views/categoryPage.js` već čita.
            vrstaPretrage: 'galerije',
            meniOtvoren: false,
            panel: null,
            // 'levo' | 'desno' — koja najava ima otvoren prozor.
            otvorenaNajava: null
        };
    }

    componentDidMount() {
        if (typeof window === 'undefined') return;
        window.addEventListener('scroll', this.listenToScroll);
        document.addEventListener('keydown', this.naTaster);
        document.addEventListener('mousedown', this.naKlikVan);
        this.pratiVisinu();
    }

    /*
     * Strane same odvajaju mesto za zaglavlje jer je ono `position: fixed`
     * (`_category.scss`, `_home.scss`, `_cart.scss`… — svaka svojom merom).
     * Te mere su bile zakucane u px i razlikovale se od strane do strane, pa
     * je svaka promena zaglavlja značila obilazak svih.
     *
     * Sada zaglavlje samo javlja svoju izmerenu visinu kroz
     * `--zaglavlje-visina`, a strane je čitaju. Tačna je na svakoj širini, u
     * svakoj temi i pri svakom prelamanju reda. `_zaglavlje.scss` drži
     * približne vrednosti za slučaj da JS ne stigne pre prvog iscrtavanja.
     */
    /*
     * Merenja visine više NEMA.
     *
     * Zaglavlje je prešlo iz `position: fixed` u tok strane — sada samo
     * zauzima svoj prostor i pri skrolovanju odlazi van kadra. Strane zato
     * ne odvajaju ništa za njega i `--zaglavlje-visina` je 0
     * (`_zaglavlje.scss`).
     *
     * Ranije je ovde stajao merač sa `ResizeObserver`-om, proverom u
     * sledećem kadru i osvežavanjem na `fonts.ready`. Sve to je služilo
     * samo da fiksirano zaglavlje javi koliko prostora traži. Bez fiksiranja
     * nema šta da se javlja, pa je izbačeno umesto da stoji ugašeno.
     */
    pratiVisinu = () => {};

    componentWillUnmount() {
        if (typeof window === 'undefined') return;
        window.removeEventListener('scroll', this.listenToScroll);
        document.removeEventListener('keydown', this.naTaster);
        document.removeEventListener('mousedown', this.naKlikVan);
        if (this.javiVisinu) window.removeEventListener('resize', this.javiVisinu);
        this.otkljucajSkrol();
    }

    componentDidUpdate(prevProps) {
        // Promena strane zatvara sve — inače fioka ostane otvorena preko nove
        // strane, pošto React ne montira zaglavlje ponovo.
        if (prevProps[0] && this.props[0]
            && prevProps[0].location.key !== this.props[0].location.key) {
            this.zatvoriSve();
        }
    }

    /* ── otvaranje i zatvaranje ─────────────────────────────────────────── */

    naTaster = (e) => {
        if (e.key !== 'Escape' && e.keyCode !== 27) return;
        if (!this.state.meniOtvoren && !this.state.panel) return;
        this.zatvoriSve();
    };

    naKlikVan = (e) => {
        if (!this.state.meniOtvoren && !this.state.panel) return;
        if (this.koren && this.koren.contains(e.target)) return;
        this.zatvoriSve();
    };

    zatvoriSve = () => {
        this.otkljucajSkrol();
        this.setState({meniOtvoren: false, panel: null});
    };

    prebaciPanel = (ime) => {
        this.setState({panel: this.state.panel === ime ? null : ime});
    };

    prebaciMeni = () => {
        const otvoren = !this.state.meniOtvoren;
        if (otvoren) this.zakljucajSkrol(); else this.otkljucajSkrol();
        this.setState({meniOtvoren: otvoren, panel: null});
    };

    /*
     * Dok fioka stoji otvorena, strana ispod nje ne sme da se pomera.
     * Zatečena vrednost se pamti i vraća — `_global.scss` na <body> drži
     * `overflow-y: auto`, pa se ne sme naslepo obrisati.
     */
    zakljucajSkrol = () => {
        if (typeof document === 'undefined') return;
        this.skrolPre = document.body.style.overflowY;
        document.body.style.overflowY = 'hidden';
    };

    otkljucajSkrol = () => {
        if (typeof document === 'undefined') return;
        if (this.skrolPre === undefined) return;
        document.body.style.overflowY = this.skrolPre;
        this.skrolPre = undefined;
    };

    /* ── pretraga ───────────────────────────────────────────────────────── */

    /*
     * Odredište je `/galerije?search=...`.
     *
     * NAPOMENA: traženo je `?q=`, ali `views/categoryPage.js` čita isključivo
     * `search`, a `?q=` je naziv parametra API-ja za predloge — na strani ga
     * niko ne čita. Preimenovanje bi tiho ugasilo pretragu iz zaglavlja, pa
     * ime parametra ostaje kakvo jeste.
     */
    pokreniPretragu = (pojam) => {
        const q = (pojam !== undefined ? pojam : this.state.pretraga) || '';
        this.setState({pretraga: q});
        this.zatvoriSve();

        const delovi = [];
        if (q) delovi.push(`search=${encodeURIComponent(q)}`);
        // Pretraga fotografija: pojedinačne fotografije, i to samo one kojima
        // su ključne reči upisane na samoj fotografiji (`kljucne=1`, filtrira
        // `searchPhotos` u API-ju). Pretraga galerija ostaje kakva je bila.
        if (this.state.vrstaPretrage === 'fotografije') delovi.push('view=photos', 'kljucne=1');

        this.props[0].history.push(`/galerije${delovi.length ? `?${delovi.join('&')}` : ''}`);
    };

    listenToScroll = () => {
        const yScroll =
            document.body.scrollTop || document.documentElement.scrollTop;

        if (this.leftBaner) {
            if (yScroll > window.document.body.scrollHeight - 581 - 20 - (window.innerHeight) - 80) {
                this.setState({leftBannerSticky: true});
            } else {
                if (this.state.leftBannerSticky) {
                    this.setState({leftBannerSticky: false});
                }
            }
        }

        this.setState({yScroll: yScroll});
    };

    setLangBa = (e) => {
        e.preventDefault();
        this.props.setLang('ba');
    };

    setLangEn = (e) => {
        e.preventDefault();
        this.props.setLang('en');
    };

    /* ── delovi ─────────────────────────────────────────────────────────── */

    /*
     * Polje pretrage — jedno za obe visine trake.
     *
     * `siroko` je naslovna varijanta: bela, sa izborom vrste levo i amber
     * dugmetom lupe desno. Uska varijanta je isto polje stisnuto u traku.
     * Parametar odredišta je nepromenjen — `?search=`.
     */
    /*
     * Prekidač jezika — zastavice umesto slova (isti par slika koji je stajao
     * i pre redizajna). Stoji na dva mesta: u traci na širokom ekranu i u
     * fioci na telefonu, gde traka nema mesta. Zato jedan metod, ne dva
     * primerka istog markupa.
     */
    prekidacJezika(l, dodatnaKlasa) {
        return (
            <span className={'z-zaglavlje__jezici' + (dodatnaKlasa ? ' ' + dodatnaKlasa : '')}>
                <button type="button"
                        className={'z-zaglavlje__jezik' + (l === 'ba' ? ' z-zaglavlje__jezik--izabran' : '')}
                        aria-pressed={l === 'ba'}
                        aria-label={'Bosanski'.translate(l)}
                        onClick={this.setLangBa}>
                    <img src={ba} alt="" width="30" height="18"/>
                </button>
                <button type="button"
                        className={'z-zaglavlje__jezik' + (l === 'en' ? ' z-zaglavlje__jezik--izabran' : '')}
                        aria-pressed={l === 'en'}
                        aria-label={'English'.translate(l)}
                        onClick={this.setLangEn}>
                    <img src={en} alt="" width="30" height="18"/>
                </button>
            </span>
        );
    }

    /*
     * Pozadinska slika iza velike pretrage — važi samo za predlog C (pravilo
     * je u `_zaglavlje.scss` pod `[data-tema="c"]`). Bira se u *Podešavanja
     * sajta → Pozadina pretrage*; dok nije izabrana, ide prva fotografija
     * najnovije galerije.
     */
    pozadinaPretrage() {
        const izbor = this.props.settings && this.props.settings.pozadinaPretrage;
        const g = this.props.najava;
        const rezerva = g && g.photos && g.photos[0] && g.photos[0].image
            ? `${PHOTOS_ENDPOINT}/photos/700x/${encodeURI(g.photos[0].image)}`
            : null;
        const slika = izbor || rezerva;
        return slika ? { '--pozadina-pretrage': `url("${slika}")` } : undefined;
    }

    poljePretrage(siroko, l) {
        return (
            <div className={'z-zaglavlje__pretraga' + (siroko ? ' z-zaglavlje__pretraga--siroka' : ' z-zaglavlje__pretraga--uska')}>

                {siroko ?
                    <span className="z-zaglavlje__vrsta" role="group"
                          aria-label={'Vrsta pretrage'.translate(l)}>
                        <button type="button"
                                className={'z-zaglavlje__vrsta-dugme' + (this.state.vrstaPretrage === 'galerije' ? ' z-zaglavlje__vrsta-dugme--izabran' : '')}
                                aria-pressed={this.state.vrstaPretrage === 'galerije'}
                                onClick={() => this.setState({vrstaPretrage: 'galerije'})}>
                            {'Galerije'.translate(l)}
                        </button>
                        <button type="button"
                                className={'z-zaglavlje__vrsta-dugme' + (this.state.vrstaPretrage === 'fotografije' ? ' z-zaglavlje__vrsta-dugme--izabran' : '')}
                                aria-pressed={this.state.vrstaPretrage === 'fotografije'}
                                onClick={() => this.setState({vrstaPretrage: 'fotografije'})}>
                            {'Fotografije'.translate(l)}
                        </button>
                    </span>
                    : null}

                <div className="z-zaglavlje__polje">
                    <PretragaSaPrijedlozima
                        value={this.state.pretraga}
                        placeholder={'Pretražite arhivu…'.translate(l)}
                        onChange={(v) => this.setState({pretraga: v})}
                        onSearch={this.pokreniPretragu}
                        fotografije={this.state.vrstaPretrage === 'fotografije'}
                        onFotografija={(f) => this.props[0].history.push(
                            `/galerija/${f.galleryAlias}/${f.galleryId}?photo=${f.idx}`)}
                        renderInput={(svojstva) => (
                            <input {...svojstva} className="z-zaglavlje__unos"
                                   aria-label={'Pretraga arhive'.translate(l)}/>
                        )}
                    />
                </div>

                <button type="button"
                        className="z-zaglavlje__trazi"
                        aria-label={'Traži'.translate(l)}
                        onClick={() => this.pokreniPretragu()}>
                    <Isvg src={search}/>
                </button>

                {/* Napredna pretraga — i na velikoj pretrazi naslovne, na sva
                    tri izgleda (2026-10-10); tamo uz ikonicu stoji i natpis. */}
                <button type="button"
                        className={'z-zaglavlje__napredna' + (siroko ? ' z-zaglavlje__napredna--sa-natpisom' : '')}
                        aria-label={'Napredna pretraga'.translate(l)}
                        title={'Napredna pretraga'.translate(l)}
                        onClick={() => this.props.handleDetailSearch(true)}>
                    <Isvg src={filterIcon}/>
                    {siroko ? <span>{'Filteri'.translate(l)}</span> : null}
                </button>
            </div>
        );
    }

    /*
     * Panel sa kategorijama.
     *
     * Spisak dolazi iz `this.props.categories` — istog izvora koji hrani
     * `/galerije` (App.js → `${API_ENDPOINT}/categories`). Ništa se ne
     * izmišlja i ništa se ne filtrira, da panel i strana pokazuju isto.
     * Veza je ista kao ranije: `?category=<alias>&detailSearch=true`.
     *
     * Tri grupe, svaka u svom redu, jedna ispod druge (2026-10-27): osnovne,
     * preporučene, specijal — iste zastavice iz baze (`isRecommended`,
     * `isSpecial`) i ista podela kao u obrascu galerije (`galleryForm.js`).
     */
    panelKategorija() {
        const kategorije = this.props.categories || [];
        if (!kategorije.length) return null;
        const l = this.props.lang;

        const grupe = [
            { naziv: 'Osnovne kategorije', ikona: IKONE.osnovne, spisak: kategorije.filter((k) => !k.isRecommended && !k.isSpecial) },
            { naziv: 'Preporučene kategorije', ikona: IKONE.preporucene, spisak: kategorije.filter((k) => k.isRecommended && !k.isSpecial) },
            { naziv: 'Specijal', ikona: IKONE.specijal, spisak: kategorije.filter((k) => k.isSpecial) },
        ].filter((g) => g.spisak.length);

        return (
            <div className="z-zaglavlje__panel z-zaglavlje__panel--kategorije z-mega">
                {grupe.map((g) => (
                    <div key={g.naziv} className="z-mega__red">
                        {this.naslovPanela(g.naziv.translate(l), g.ikona, g.spisak.length)}
                        <div className="z-mega__stubovi">
                            {g.spisak.map((k, idx) => (
                                <Link
                                    key={k._id || idx}
                                    className="z-mega__veza"
                                    to={`/galerije?category=${Object.translate(k, 'alias', l)}&detailSearch=true`}>
                                    {Object.translate(k, 'name', l)}
                                </Link>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    /*
     * Panel „Agencija" — po uzoru na padajući meni mts.rs (2026-10-27).
     *
     * Beo panel i na tamnoj ili crvenoj traci: svaka grupa je kolona sa
     * crvenom ikonicom i podebljanim naslovom, ispod obične veze. Fotografi
     * su u svom delu ispod linije, u četiri stupca. Ranije su Agencija i
     * Usluge bile tamne pločice u boji trake — klijentu previše tamno.
     */
    // Naslov grupe u padajućem meniju: crvena ikonica, podebljan naziv, broj.
    naslovPanela(naziv, ikona, broj) {
        return (
            <p className="z-mega__naslov">
                <svg className="z-mega__ikona" viewBox="0 0 24 24" aria-hidden="true"><path d={ikona} /></svg>
                {naziv}
                {broj !== undefined ? <em>{broj}</em> : null}
            </p>
        );
    }

    // Kolona: naslov sa ikonicom, ispod veze sa kratkim opisom.
    grupaPanela(naziv, ikona, stavke, l) {
        return (
            <div className="z-mega__kolona">
                {this.naslovPanela(naziv.translate(l), ikona)}
                <ul className="z-mega__spisak">
                    {stavke.map((p) => (
                        <li key={p.putanja}>
                            <Link className="z-mega__veza" to={p.putanja}>
                                {p.naziv.translate(l)}
                                <span>{p.opis.translate(l)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    panelAgencije() {
        const l = this.props.lang;
        const fotografi = this.props.photographers || [];

        return (
            <div className="z-zaglavlje__panel z-zaglavlje__panel--agencija z-mega">
                <div className="z-mega__kolone">
                    {this.grupaPanela('Agencija', AGENCIJA[0].ikona, AGENCIJA, l)}
                    {this.grupaPanela('Usluge', USLUGE[0].ikona, USLUGE, l)}
                </div>

                {fotografi.length ?
                    <div className="z-mega__dno">
                        {this.naslovPanela('Fotografi'.translate(l), AGENCIJA[4].ikona, fotografi.length)}
                        <div className="z-mega__fotografi">
                            {fotografi.map((f, idx) => (
                                <Link key={idx} className="z-mega__veza z-mega__veza--ime"
                                      to={`/fotograf/${f.userAlias}`}>{f.name}</Link>
                            ))}
                        </div>
                    </div>
                    : null}
            </div>
        );
    }

    render() {
        const l = this.props.lang;
        const u = this.props.uData;
        const putanja = this.props[0].location.pathname;

        // Prag od 20px je isti kao ranije — samo se sada zaglavlje stanjuje
        // umesto da beži uvis.
        const zbijeno = this.state.yScroll > 20;

        /*
         * Fotografu se javni meni ranije sklanjao jer ga je zamenjivala traka
         * `account-nav`. Trake više nema — bez ovoga bi fotograf na javnim
         * stranama ostao bez ijedne veze u zaglavlju.
         */
        /* JEDAN NAVBAR NA SVIM STRANAMA (2026-09-22): isti redovi, isti meni
           i ista širina svuda — i na stranama naloga. Nalog ima svoj bočni
           meni u `nalogOkvir.js`, pa mu javni meni gore ne smeta. */
        const javniMeni = true;

        const imaKorpu = !u || u.userRole !== 'photographer';

        // Strana „cjenovnik" postoji samo ako je napravljena u administraciji.
        const imaCenovnik = (this.props.pages || []).some(
            (s) => s && s.alias && (s.alias.ba === 'cjenovnik' || s.alias === 'cjenovnik')
        );

        // Naslovna dobija visoku traku, sve ostale nisku. Ista komponenta.
        const naslovna = putanja === '/';


        // „Dron" nije nova ruta nego postojeća kategorija iz arhive.
        const dron = (this.props.categories || []).find(
            (k) => /dron/i.test(Object.translate(k, 'name', l) || '')
        );

        /*
         * TRAKA NA VRHU ZAGLAVLJA — dve najave iz *Administracija → Najave*
         * (2026-10-13): „Obaveštenje 1" levo, „Obaveštenje 2" desno. Svaka
         * važi dok je današnji dan između njenih polja OD i DO (ruta
         * `/announcements` sama filtrira), pa je taj prozor i prekidač.
         * Bez ijedne važeće traka se ne prikazuje.
         *
         * U traci stoji kratak natpis (`content`); dugme otvara prozor sa
         * punim naslovom i opisom (`components/prozorNajave.js`).
         */
        const najave = this.props.najave || {};
        const mestaNajava = [
            { kljuc: 'levo', najava: najave.levo, uvod: 'Obavještenje'.translate(l) },
            { kljuc: 'desno', najava: najave.desno, uvod: 'Najava'.translate(l) },
        ].filter((m) => m.najava);
        const otvorenaNajava = mestaNajava.find((m) => m.kljuc === this.state.otvorenaNajava);

        // Pilula levo i dalje čeka polje u podešavanjima.
        const pilula = this.props.settings && this.props.settings.headerPill;


        return (
            <header
                ref={(n) => this.koren = n}
                /* Na naslovnoj zaglavlje nosi i adresu pozadinske slike — tema C
                   je širi preko celog prvog ekrana (2026-10-10). */
                style={naslovna ? this.pozadinaPretrage() : undefined}
                className={
                    'zaglavlje-sajta z-zaglavlje'
                    + (naslovna ? ' z-zaglavlje--visoka' : ' z-zaglavlje--niska')
                    + (zbijeno ? ' z-zaglavlje--zbijeno' : '')
                    + (this.state.meniOtvoren ? ' z-zaglavlje--meni-otvoren' : '')
                    /* Fioka postoji samo kad postoji i javni meni. Bez nje se
                       na telefonu ništa ne sme skloniti iz trake — nema gde. */
                    + (javniMeni ? ' z-zaglavlje--sa-fiokom' : '')
                }>

                {
                    u && u.userRole == 'photographer' && u.permissions.indexOf('*') === -1 && (putanja.indexOf('/contact') == -1 && putanja.indexOf('/account') == -1 && putanja.indexOf('/page') == -1 && putanja.indexOf('/galerija') == -1) ?
                        <Redirect to={'/account/profile'}></Redirect>
                        :
                        null
                }

                {this.props.leftSideBanner ?
                    <div className="left-banner" style={this.state.leftBannerSticky ? {
                        position: 'fixed',
                        top: 'unset',
                        bottom: `${(this.state.yScroll - (window.document.body.scrollHeight - 581 - 20 - (window.innerHeight) - 80)) - 70}px`
                    } : null} ref={(node) => this.leftBaner = node}>
                        {
                            this.props.leftSideBanner.images.map((item, idx) => {
                                return (
                                    <a href={item.link} target="_blank"
                                       onClick={() => this.props.bannerClick(item.link)}>
                                        <img key={idx} src={item.image}/>
                                    </a>
                                )
                            })
                        }
                    </div>
                    : null
                }
                {this.props.rightSideBanner ?
                    <div className="right-banner" style={this.state.leftBannerSticky ? {
                        position: 'fixed',
                        top: 'unset',
                        bottom: `${(this.state.yScroll - (window.document.body.scrollHeight - 581 - 20 - (window.innerHeight) - 80)) - 70}px`
                    } : null} ref={(node) => this.rightBanner = node}>
                        {
                            this.props.rightSideBanner.images.map((item, idx) => {
                                return (
                                    <a href={item.link} target="_blank"
                                       onClick={() => this.props.bannerClick(item.link)}>
                                        <img key={idx} src={item.image}/>
                                    </a>
                                )
                            })
                        }
                    </div>
                    : null
                }


                {/* ── RED 1 — traka najave ─────────────────────────────
                    Jedna najava stoji u sredini; dve stoje levo i desno. */}
                {mestaNajava.length ?
                    <div className={'z-zaglavlje__najava z-zaglavlje__najava--obavestenje'
                        + (mestaNajava.length > 1 ? ' z-zaglavlje__najava--dve' : '')}>
                        <div className="z-zaglavlje__sirina">
                            {mestaNajava.map((m) => (
                                <div key={m.kljuc}
                                     className={'z-zaglavlje__najava-mesto z-zaglavlje__najava-mesto--' + m.kljuc}>
                                    <span className="z-zaglavlje__najava-tekst">
                                        {m.uvod}
                                        <span className="z-zaglavlje__najava-naslov">
                                            {Object.translate(m.najava, 'content', l) || ''}
                                        </span>
                                    </span>
                                    <button type="button"
                                            className="z-zaglavlje__najava-dugme"
                                            aria-haspopup="dialog"
                                            onClick={() => this.setState({ otvorenaNajava: m.kljuc })}>
                                        {'Pročitaj'.translate(l)}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                    : null}

                {otvorenaNajava ?
                    <ProzorNajave
                        najava={otvorenaNajava.najava}
                        oznaka={otvorenaNajava.uvod}
                        lang={l}
                        onZatvori={() => this.setState({ otvorenaNajava: null })}/>
                    : null}


                {/* ── RED 2 — pilula, logo, radnje ─────────────────────── */}
                <div className="z-zaglavlje__glavni">
                    <div className="z-zaglavlje__sirina z-zaglavlje__sirina--tri">

                        <div className="z-zaglavlje__levo">
                            <button
                                type="button"
                                className="z-zaglavlje__hamburger"
                                aria-expanded={this.state.meniOtvoren}
                                aria-controls="glavni-meni"
                                aria-label={(this.state.meniOtvoren ? 'Zatvori meni' : 'Otvori meni').translate(l)}
                                onClick={this.prebaciMeni}>
                                <span/><span/><span/>
                            </button>

                            {/* Obrisna pilula iz podešavanja. `settings.headerPill`
                                danas ne postoji, pa se ne iscrtava. */}
                            {pilula ?
                                <Link className="z-zaglavlje__pilula"
                                      to={this.props.settings.headerPillLink || '/galerije'}>
                                    {pilula}
                                </Link>
                                : null}

                            <Link to="/" className="z-zaglavlje__logo">
                                <img className="z-znak z-znak--svetli" src={znakZipa} alt=""/>
                                <img className="z-znak z-znak--tamni" src={znakZipaTamni} alt=""/>
                                <span className="z-zaglavlje__natpis">ZIPAPHOTO</span>
                            </Link>
                        </div>

                        {/* Meni stoji u ISTOM redu sa logom i radnjama (2026-10-13),
                            na svim izgledima — ranije je imao svoj red ispod.
                            Na telefonu je isti <nav> fioka (`position: fixed`). */}
                        {javniMeni ?
                            <nav
                                id="glavni-meni"
                                className="z-zaglavlje__meni"
                                aria-label={'Glavna navigacija'.translate(l)}>

                                <div className={'z-zaglavlje__sa-panelom' + (this.state.panel === 'galerije' ? ' z-zaglavlje__sa-panelom--otvoren' : '')}>
                                    <button type="button"
                                            className={'z-zaglavlje__stavka z-zaglavlje__stavka--panel' + (putanja === '/galerije' ? ' z-zaglavlje__stavka--ovde' : '')}
                                            aria-expanded={this.state.panel === 'galerije'}
                                            onClick={() => this.prebaciPanel('galerije')}>
                                        {'Galerije'.translate(l)}
                                        <span className="z-zaglavlje__strelica" aria-hidden="true"/>
                                    </button>
                                    {this.state.panel === 'galerije' ?
                                        <div className="z-zaglavlje__panel z-zaglavlje__panel--usko z-mega">
                                            {this.grupaPanela('Galerije', IKONE.galerije, GALERIJE, l)}
                                        </div>
                                        : null}
                                </div>

                                <div className={'z-zaglavlje__sa-panelom' + (this.state.panel === 'kategorije' ? ' z-zaglavlje__sa-panelom--otvoren' : '')}>
                                    <button type="button"
                                            className="z-zaglavlje__stavka z-zaglavlje__stavka--panel"
                                            aria-expanded={this.state.panel === 'kategorije'}
                                            onClick={() => this.prebaciPanel('kategorije')}>
                                        {'Kategorije'.translate(l)}
                                        <span className="z-zaglavlje__strelica" aria-hidden="true"/>
                                    </button>
                                    {this.state.panel === 'kategorije' ? this.panelKategorija() : null}
                                </div>

                                <Link className={'z-zaglavlje__stavka' + (putanja === '/video' ? ' z-zaglavlje__stavka--ovde' : '')}
                                      to="/video">{'Video'.translate(l)}</Link>

                                {/* „Dron" je postojeća kategorija iz arhive, ne nova ruta. */}
                                {dron ?
                                    <Link className="z-zaglavlje__stavka"
                                          to={`/galerije?category=${Object.translate(dron, 'alias', l)}`}>
                                        {'Dron'.translate(l)}
                                    </Link>
                                    : null}

                                <div className={'z-zaglavlje__sa-panelom' + (this.state.panel === 'agencija' ? ' z-zaglavlje__sa-panelom--otvoren' : '')}>
                                    <button type="button"
                                            className="z-zaglavlje__stavka z-zaglavlje__stavka--panel"
                                            aria-expanded={this.state.panel === 'agencija'}
                                            onClick={() => this.prebaciPanel('agencija')}>
                                        {'Agencija'.translate(l)}
                                        <span className="z-zaglavlje__strelica" aria-hidden="true"/>
                                    </button>
                                    {this.state.panel === 'agencija' ? this.panelAgencije() : null}
                                </div>

                                {/* DNO FIOKE — samo na telefonu.
                                    Cjenovnik, pomoć i jezik stoje u traci na
                                    širokom ekranu; na 375px ta traka traži 249px
                                    kod raspoloživih 200, pa se ovde presele.
                                    U traci ostaju logo, korpa i prijava. */}
                                <div className="z-zaglavlje__fioka-dno">
                                    {imaCenovnik ?
                                        <Link className="z-zaglavlje__stavka" to="/page/cjenovnik">
                                            {'Cjenovnik'.translate(l)}
                                        </Link>
                                        : null}
                                    <Link className="z-zaglavlje__stavka" to="/help">
                                        {'Pomoć'.translate(l)}
                                    </Link>
                                    {this.prekidacJezika(l, 'z-zaglavlje__jezici--fioka')}
                                </div>
                            </nav>
                            : null}

                        <div className="z-zaglavlje__desno">
                            {imaCenovnik ?
                                <div className={'z-zaglavlje__sa-panelom z-zaglavlje__u-fioku' + (this.state.panel === 'cjenovnik' ? ' z-zaglavlje__sa-panelom--otvoren' : '')}>
                                    <button type="button"
                                            className="z-zaglavlje__stavka z-zaglavlje__stavka--panel"
                                            aria-expanded={this.state.panel === 'cjenovnik'}
                                            onClick={() => this.prebaciPanel('cjenovnik')}>
                                        {'Cjenovnik'.translate(l)}
                                        <span className="z-zaglavlje__strelica" aria-hidden="true"/>
                                    </button>
                                    {this.state.panel === 'cjenovnik' ?
                                        <div className="z-zaglavlje__panel z-zaglavlje__panel--usko z-mega">
                                            {this.grupaPanela('Cjenovnik', IKONE.cjenovnik, CJENOVNIK, l)}
                                        </div>
                                        : null}
                                </div>
                                :
                                <Link className="z-zaglavlje__traka-veza z-zaglavlje__u-fioku" to="/help">{'POMOĆ'.translate(l)}</Link>}

                            {this.prekidacJezika(l, 'z-zaglavlje__u-fioku')}

                            {imaKorpu ?
                                <Link to="/cart" className="z-zaglavlje__korpa" aria-label={'Korpa'.translate(l)}>
                                    <Isvg src={cart}/>
                                    <span>{'Korpa'.translate(l)}</span>
                                    {this.props.brojUKorpi > 0 ?
                                        <em className="z-zaglavlje__korpa-broj">{this.props.brojUKorpi}</em>
                                        : null}
                                </Link>
                                : null}

                            {u ?
                                <div className={'z-zaglavlje__sa-panelom z-zaglavlje__nalog' + (this.state.panel === 'nalog' ? ' z-zaglavlje__sa-panelom--otvoren' : '')}>
                                    <button type="button"
                                            className="z-zaglavlje__stavka z-zaglavlje__stavka--panel"
                                            aria-expanded={this.state.panel === 'nalog'}
                                            onClick={() => this.prebaciPanel('nalog')}>
                                        {u.name || 'Nalog'.translate(l)}
                                        <span className="z-zaglavlje__strelica" aria-hidden="true"/>
                                    </button>
                                    {this.state.panel === 'nalog' ?
                                        <div className="z-zaglavlje__panel z-zaglavlje__panel--nalog z-mega">
                                            <div className="z-mega__kolona">
                                                {this.naslovPanela(u.name || 'Nalog'.translate(l), IKONE.nalog)}
                                                {u.email ? <p className="z-mega__podnaslov">{u.email}</p> : null}
                                                <ul className="z-mega__spisak">
                                                    <li><Link className="z-mega__veza" to="/account/profile">{'Profil'.translate(l)}</Link></li>
                                                    <li><Link className="z-mega__veza" to="/account/downloads">{'Preuzimanja'.translate(l)}</Link></li>
                                                    {imaKorpu ?
                                                        <li><Link className="z-mega__veza" to="/cart">{'Korpa'.translate(l)}</Link></li>
                                                        : null}
                                                </ul>
                                                <div className="z-mega__dno z-mega__dno--tesno">
                                                    <button type="button"
                                                            className="z-mega__veza z-mega__veza--odjava"
                                                            onClick={() => {
                                                                this.zatvoriSve();
                                                                this.props.signOut();
                                                                this.props[0].history.push('/');
                                                                this.props.showInfoMessage('Hvala vam što ste koristili foto servis.');
                                                            }}>{'Izloguj se'.translate(l)}</button>
                                                </div>
                                            </div>
                                        </div>
                                        : null}
                                </div>
                                :
                                <Link className="z-zaglavlje__dugme-prijava" to="/login">{'Prijava'.translate(l)}</Link>
                            }
                        </div>
                    </div>
                </div>


                {/* ── NASLOVNI BLOK — samo naslovna ──────────────────────
                    Bela podloga i samo pretraga u sredini (odluka 2026-09-21);
                    naslov, podnaslov, „Traži se" i ilustracija su izbačeni. */}
                {naslovna ?
                    <div className="z-zaglavlje__naslovni" style={this.pozadinaPretrage()}>
                        <div className="z-zaglavlje__sirina z-zaglavlje__naslovni-red">
                            {this.poljePretrage(true, l)}
                        </div>
                    </div>
                    : null}



                {/* Zavesa iza fioke — klik na nju zatvara meni. Postoji samo
                    na telefonu; na širem ekranu je CSS gasi. */}
                <div className="z-zaglavlje__zavesa" onClick={this.zatvoriSve} aria-hidden="true"/>

                {/* Stara vodoravna traka `account-nav` je uklonjena.
                    Navigacija naloga sada stoji u bočnom panelu: administrator
                    je ima u `components/adminOkvir.js`, fotograf i kupac u
                    `components/nalogOkvir.js`. Traka je na stranama naloga
                    stajala uporedo sa panelom i pokazivala isto dvaput. */}

            </header>
        );
    }
}

export default Header;
