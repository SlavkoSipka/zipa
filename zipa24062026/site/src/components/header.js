import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom';

import Isvg from 'react-inlinesvg';

import {
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';

import cart from '../assets/svg/cart.svg';
import search from '../assets/svg/search.svg';
import imagesCount from '../assets/svg/images-count.svg';
import filterIcon from '../assets/svg/filters.svg';

import ba from '../assets/images/basr.png';
import en from '../assets/images/en.png';
import PretragaSaPrijedlozima from './pretragaSaPrijedlozima';
import naslovnaIlustracija from '../assets/images/naslovna-ilustracija.png';

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
            panel: null
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
        if (this.state.vrstaPretrage === 'fotografije') delovi.push('view=photos');

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
                    <img src={ba} alt="" width="20" height="12"/>
                </button>
                <button type="button"
                        className={'z-zaglavlje__jezik' + (l === 'en' ? ' z-zaglavlje__jezik--izabran' : '')}
                        aria-pressed={l === 'en'}
                        aria-label={'English'.translate(l)}
                        onClick={this.setLangEn}>
                    <img src={en} alt="" width="20" height="12"/>
                </button>
            </span>
        );
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
                        placeholder={'Pretraži arhivu…'.translate(l)}
                        onChange={(v) => this.setState({pretraga: v})}
                        onSearch={this.pokreniPretragu}
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

                {!siroko ?
                    <button type="button"
                            className="z-zaglavlje__napredna"
                            aria-label={'Napredna pretraga'.translate(l)}
                            onClick={() => this.props.handleDetailSearch(true)}>
                        <Isvg src={filterIcon}/>
                    </button>
                    : null}
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
     */
    panelKategorija() {
        const kategorije = this.props.categories || [];
        if (!kategorije.length) return null;

        return (
            <div className="z-zaglavlje__panel z-zaglavlje__panel--kategorije">
                <div className="z-zaglavlje__stubovi">
                    {kategorije.map((k, idx) => (
                        <Link
                            key={idx}
                            className="z-zaglavlje__stavka-panela"
                            to={`/galerije?category=${Object.translate(k, 'alias', this.props.lang)}&detailSearch=true`}>
                            <span>{Object.translate(k, 'name', this.props.lang)}</span>
                            {k.photosCount ? <em>{k.photosCount}</em> : null}
                        </Link>
                    ))}
                </div>
            </div>
        );
    }

    /*
     * Panel „Agencija".
     *
     * Ranije je ovde bio podmeni u podmeniju: Agencija → Usluge →
     * Fotografisanje. Sada su „Usluge" i „Fotografi" naslovi grupa unutar
     * istog panela — jedan klik manje i ništa se ne krije iza drugog klika.
     */
    panelAgencije() {
        const l = this.props.lang;
        const fotografi = this.props.photographers || [];

        return (
            <div className="z-zaglavlje__panel z-zaglavlje__panel--agencija">
                <div className="z-zaglavlje__grupa">
                    <p className="z-zaglavlje__naslov-grupe">{'Agencija'.translate(l)}</p>
                    <Link className="z-zaglavlje__stavka-panela" to="/page/o-nama">{'O nama'.translate(l)}</Link>
                    <Link className="z-zaglavlje__stavka-panela" to="/page/uslovi-koriscenja">{'Uslovi korišćenja'.translate(l)}</Link>
                    <Link className="z-zaglavlje__stavka-panela" to="/page/ugovori">{'Ugovori'.translate(l)}</Link>
                    <Link className="z-zaglavlje__stavka-panela" to="/page/prijatelji-sajta">{'Prijatelji sajta'.translate(l)}</Link>
                    <Link className="z-zaglavlje__stavka-panela" to="/contact">{'Kontakt'.translate(l)}</Link>
                </div>

                <div className="z-zaglavlje__grupa">
                    <p className="z-zaglavlje__naslov-grupe">{'Usluge'.translate(l)}</p>
                    <Link className="z-zaglavlje__stavka-panela" to="/page/fotografisanje">{'Fotografisanje'.translate(l)}</Link>
                    <Link className="z-zaglavlje__stavka-panela" to="/page/saradnja">{'Saradnja'.translate(l)}</Link>
                </div>

                {fotografi.length ?
                    <div className="z-zaglavlje__grupa z-zaglavlje__grupa--fotografi">
                        <p className="z-zaglavlje__naslov-grupe">
                            {'Fotografi'.translate(l)} <em>{fotografi.length}</em>
                        </p>
                        <div className="z-zaglavlje__spisak-fotografa">
                            {fotografi.map((f, idx) => (
                                <Link key={idx} className="z-zaglavlje__stavka-panela"
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

        // Nalozna navigacija ima svoj red ispod glavnog; javna se tad sklanja.
        const naNalogu = putanja.indexOf('/account') === 0;

        const javniMeni = !naNalogu
            && (!u || (u && u.userRole !== 'photographer'));

        const imaKorpu = !u || u.userRole !== 'photographer';

        // Strana „cjenovnik" postoji samo ako je napravljena u administraciji.
        const imaCenovnik = (this.props.pages || []).some(
            (s) => s && s.alias && (s.alias.ba === 'cjenovnik' || s.alias === 'cjenovnik')
        );

        // Naslovna dobija visoku traku, sve ostale nisku. Ista komponenta.
        const naslovna = putanja === '/';

        // Kategorije zakačene u administraciji hrane red „Traži se:".
        const trazi = (this.props.categories || []).filter((k) => k.isVisibleOnNav);

        // „Dron" nije nova ruta nego postojeća kategorija iz arhive.
        const dron = (this.props.categories || []).find(
            (k) => /dron/i.test(Object.translate(k, 'name', l) || '')
        );

        /*
         * Traka najave — najnovija galerija iz arhive. `App.js` je dovuče
         * zajedno sa fotografijom za naslovni blok, pa nema drugog poziva.
         */
        const najava = this.props.najava;
        // Galerija nosi naziv u `name`, ne u `title`.
        const najavaNaslov = najava ? (Object.translate(najava, 'name', l) || '') : '';
        const najavaPutanja = najava && najava._id
            ? `/galerija/${Object.translate(najava, 'alias', l) || najava.alias || 'galerija'}/${najava._id}`
            : null;

        // Pilula levo i dalje čeka polje u podešavanjima.
        const pilula = this.props.settings && this.props.settings.headerPill;


        return (
            <header
                ref={(n) => this.koren = n}
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
                    Iscrtava se samo kad iz administracije stigne zakačena
                    najava. Danas prop `najava` ne stiže (vidi CLAUDE.md,
                    „ČEKA ODLUKU KLIJENTA"), pa reda nema. */}
                {najava ?
                    <div className="z-zaglavlje__najava">
                        <div className="z-zaglavlje__sirina">
                            <span className="z-zaglavlje__najava-tekst">
                                {'Pogledajte novu galeriju'.translate(l)}
                                {najavaNaslov ? <span className="z-zaglavlje__najava-naslov">{najavaNaslov}</span> : null}
                            </span>
                            {najavaPutanja ?
                                <Link className="z-zaglavlje__najava-dugme" to={najavaPutanja}>
                                    {'Pogledaj'.translate(l)}
                                </Link>
                                : null}
                        </div>
                    </div>
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
                        </div>

                        <Link to="/" className="z-zaglavlje__logo">
                            <Isvg src={this.props.settings.logo}/>
                            <span className="z-zaglavlje__natpis"
                                  dangerouslySetInnerHTML={{__html: this.props.settings.logoText}}/>
                        </Link>

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
                                        <div className="z-zaglavlje__panel z-zaglavlje__panel--usko">
                                            <div className="z-zaglavlje__grupa">
                                                <Link className="z-zaglavlje__stavka-panela" to="/page/cjenovnik">{'Cjenovnik'.translate(l)}</Link>
                                                <Link className="z-zaglavlje__stavka-panela" to="/help">{'Pomoć'.translate(l)}</Link>
                                            </div>
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
                                        <div className="z-zaglavlje__panel z-zaglavlje__panel--nalog">
                                            <div className="z-zaglavlje__grupa">
                                                {u.email ? <p className="z-zaglavlje__naslov-grupe">{u.email}</p> : null}
                                                <Link className="z-zaglavlje__stavka-panela" to="/account/profile">{'Profil'.translate(l)}</Link>
                                                <Link className="z-zaglavlje__stavka-panela" to="/account/downloads">{'Preuzimanja'.translate(l)}</Link>
                                                {imaKorpu ?
                                                    <Link className="z-zaglavlje__stavka-panela" to="/cart">{'Korpa'.translate(l)}</Link>
                                                    : null}
                                                <button type="button"
                                                        className="z-zaglavlje__stavka-panela z-zaglavlje__odjava"
                                                        onClick={() => {
                                                            this.zatvoriSve();
                                                            this.props.signOut();
                                                            this.props[0].history.push('/');
                                                            this.props.showInfoMessage('Hvala vam što ste koristili foto servis.');
                                                        }}>{'Izloguj se'.translate(l)}</button>
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


                {/* ── RED 3 — navigacija ───────────────────────────────── */}
                {javniMeni ?
                    <div className="z-zaglavlje__navred">
                        <div className="z-zaglavlje__sirina">
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
                                        <div className="z-zaglavlje__panel z-zaglavlje__panel--usko">
                                            <div className="z-zaglavlje__grupa">
                                                <Link className="z-zaglavlje__stavka-panela" to="/galerije">{'Sve galerije'.translate(l)}</Link>
                                                <Link className="z-zaglavlje__stavka-panela" to="/galerije?view=photos">{'Fotografije'.translate(l)}</Link>
                                            </div>
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

                            {/* Na ostalim stranama pretraga stoji u traci, uža. */}
                            {!naslovna ? this.poljePretrage(false, l) : null}
                        </div>
                    </div>
                    : null}


                {/* ── NASLOVNI BLOK — samo naslovna ────────────────────── */}
                {naslovna ?
                    <div className="z-zaglavlje__naslovni">
                        <div className="z-zaglavlje__sirina z-zaglavlje__naslovni-red">
                            <div className="z-zaglavlje__naslovni-tekst">
                                <h1 className="z-zaglavlje__naslov">
                                    {'Arhiva Banja Luke, od 1990.'.translate(l)}
                                </h1>
                                <p className="z-zaglavlje__podnaslov">
                                    {'Pretražite fotografije iz arhive agencije ZIPA PHOTO.'.translate(l)}
                                </p>

                                {this.poljePretrage(true, l)}

                                {trazi.length ?
                                    <p className="z-zaglavlje__trazi-se">
                                        <span className="z-zaglavlje__trazi-se-natpis">{'Traži se:'.translate(l)}</span>
                                        {trazi.map((k, idx) => (
                                            <Link key={idx}
                                                  className="z-zaglavlje__trazi-se-pojam"
                                                  to={`/galerije?category=${Object.translate(k, 'alias', l)}`}>
                                                {Object.translate(k, 'name', l)}
                                            </Link>
                                        ))}
                                    </p>
                                    : null}
                            </div>

                            {/* Ilustracija — ukras, ne sadržaj. Prazan alt; `lazy` +
                                `low` prioritet da nikad ne konkuriše naslovu i pretrazi
                                za propusni opseg pri prvom prikazu. Tekst NIKAD ne ide
                                preko nje (stalno pravilo) — stoji levo u svom stupcu,
                                slika je pozicionirana nezavisno, van toka. */}
                            <div className="z-zaglavlje__naslovna-slika">
                                <img src={naslovnaIlustracija} alt=""
                                     loading="lazy" decoding="async" fetchpriority="low"/>
                            </div>
                        </div>
                    </div>
                    : null}


                {/* Zavesa iza fioke — klik na nju zatvara meni. Postoji samo
                    na telefonu; na širem ekranu je CSS gasi. */}
                <div className="z-zaglavlje__zavesa" onClick={this.zatvoriSve} aria-hidden="true"/>

                {/* ── nalozna navigacija — prenesena nepromenjena ──────── */}
                {naNalogu || (u && u.userRole === 'photographer') ?
                    <div className={`col-12 navigation ${u && u.userRole == 'photographer' ? 'photographer-nav' : ''} ${u && u.userRole == 'agency' ? 'agency-nav' : ''}`}>
                            {this.props.uData && this.props.uData.userRole == 'photographer' && (this.props[0].location.pathname.indexOf('/account') == 0 || this.props[0].location.pathname.indexOf('/galerija/') == 0) ?

                                <ul className="account-nav">
                                    <li className={this.props[0].location.pathname == '/account/profile' ? "active" : null}>
                                        <Link to='/account/profile'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li className={this.props[0].location.pathname == '/account/galleries' ? "active" : null}>
                                        <Link to='/account/galleries'>{'Fotografije'.translate(this.props.lang)}</Link>
                                    </li>
                                    {this.props.uData.permissions && this.props.uData.permissions.indexOf('*') != -1 ?
                                        <li className={this.props[0].location.pathname == '/account/users' ? "active" : null}>
                                            <Link to='/account/users'>{'Korisnici'.translate(this.props.lang)}</Link>
                                        </li>
                                        :
                                        null
                                    }
                                    <li className={this.props[0].location.pathname == '/account/photo-visits' ? "active" : null}>
                                        <Link to='/account/photo-visits'>{'Pregledi'.translate(this.props.lang)}</Link>
                                    </li>

                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Profil'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem><Link
                                                    to={'/account/edit'}>{'Izmjeni profil'.translate(this.props.lang)}</Link></DropdownItem>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                    <li className="button-li"><Link to='/account/gallery/new'>
                                        <button><Isvg
                                            src={imagesCount}/> {'Dodaj fotografiju'.translate(this.props.lang)}
                                        </button>
                                    </Link></li>
                                </ul>
                                :
                                null
                            }

                            {this.props[0].location.pathname.indexOf('/account') == 0 && this.props.uData && this.props.uData.userRole != 'photographer' && this.props.uData && this.props.uData.userRole != 'admin' ?

                                <ul className="account-nav">
                                    <li className={this.props[0].location.pathname == '/account/profile' ? "active" : null}>
                                        <Link to='/account/profile'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li className={this.props[0].location.pathname == '/account/downloads' ? "active" : null}>
                                        <Link to='/account/downloads'>{'Preuzimanja'.translate(this.props.lang)}</Link>
                                    </li>
                                    <li className={this.props[0].location.pathname == '/account/subscription' ? "active" : null}>
                                        <Link to='/account/subscription'>{'Pretplata'.translate(this.props.lang)}</Link>
                                    </li>

                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Profil'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem><Link
                                                    to={'/account/edit'}>{'Ažuriranje profila'.translate(this.props.lang)}</Link></DropdownItem>
                                                <DropdownItem><Link
                                                    to={'/account/change-password'}>{'Promjena lozinke'.translate(this.props.lang)}</Link></DropdownItem>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                </ul>
                                :
                                null
                            }


                            {this.props[0].location.pathname.indexOf('/account') == 0 && this.props.uData && this.props.uData.userRole == 'admin' ?

                                <ul className="account-nav admin-nav">
                                    <li className={this.props[0].location.pathname == '/' ? "active" : null}><Link
                                        to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Kategorije'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/categories'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/categories/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li className={this.props[0].location.pathname == '/account/users' ? "active" : null}>
                                        <Link to='/account/users'>{'Korisnici'.translate(this.props.lang)}</Link></li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Baneri'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/banners'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/banners/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Stranice'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/pages'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/pages/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Najave'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/announcements'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/announcements/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Slajder'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/slides'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/slides/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'FAQ'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/faqCategories'}>
                                                    <DropdownItem>{'Lista kategorija'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/faqCategories/new'}>
                                                    <DropdownItem>{'Dodaj kategoriju'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/faq'}>
                                                    <DropdownItem>{'Lista pitanja'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/faq/new'}>
                                                    <DropdownItem>{'Dodaj pitanje'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Newsletter'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/newsletter'}>
                                                    <DropdownItem>{'Lista newslettera'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/subscribers'}>
                                                    <DropdownItem>{'Lista prijavljenih'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/newsletter/new'}>
                                                    <DropdownItem>{'Dodaj newsletter'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/subscribers/import'}>
                                                    <DropdownItem>{'Import subscribers'.translate(this.props.lang)}</DropdownItem></Link>
                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                    <li className={this.props[0].location.pathname == '/account/settings' ? "active" : null}>
                                        <Link to='/account/settings'>{'Podešavanja'.translate(this.props.lang)}</Link>
                                    </li>

                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Logovi'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>


                                                <Link to={'/account/today-visits'}>
                                                    <DropdownItem>{'Najpregledanije stranice danas'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/gallery-stats'}>
                                                    <DropdownItem>{'Statistika galerija'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/photographer-stats'}>
                                                    <DropdownItem>{'Statistika fotografa'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/banner-stats'}>
                                                    <DropdownItem>{'Statistika bannera'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/archive-stats'}>
                                                    <DropdownItem>{'Arhiva od početka rada'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/watermarks'}>
                                                    <DropdownItem>{'Žig na fotografijama'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/download-logs'}>
                                                    <DropdownItem>{'Transakcije'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/logs'}>
                                                    <DropdownItem>{'Logovi'.translate(this.props.lang)}</DropdownItem></Link>
                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                </ul>
                                :
                                null
                            }
                    </div>
                    : null}

            </header>
        );
    }
}

export default Header;
