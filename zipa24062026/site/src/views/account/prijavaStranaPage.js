import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';
import PoljeSlike from '../../components/forms/fields/image';

import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

/*
 * PRIJAVA I REGISTRACIJA — izbor galerije za fotografiju uz obrazac.
 *
 * Strane `/login` i `/register` nemaju sadržaj koji se uređuje kao ostale
 * stranice: obrazac je isti uvek, a jedino što se menja je FOTOGRAFIJA uz
 * njega i potpis ispod nje (naziv galerije, autor, mjesto, godina).
 *
 * Do sada je to uvijek bila najnovija galerija. Ovdje se bira konkretna
 * galerija ILI se postavlja sopstvena fotografija (`fotografija` + `potpis`).
 * Izbor se pamti u podešavanjima sajta (`loginGallery`), pa nema nove
 * tabele u bazi: `/settings/update` spaja poslano sa postojećim.
 *
 * Čuva se ID i alias — `/gallery/get/:lang/:alias/:id` traži oba. Naziv i
 * fotografija se NE prepisuju ovdje, nego se svaki put čitaju iz same
 * galerije, da izmjena galerije odmah bude vidljiva i na prijavi.
 */
class PrijavaStranaPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            pretraga: '',
            rezultati: [],
            ucitavanje: true,
            trazim: false,
            izabrana: null,     // { id, alias, naziv, slika } ili { fotografija, potpis }
            poruke: [],
        };

        this.poruke = napraviPoruke(this);
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname)
                .then((data) => {
                    this.setState({ ...data }, () => {
                        this.props.updateMeta(this.props.generateSeoTags(this.state));
                    });
                });
        }

        // Zatečeni izbor iz podešavanja.
        fetch(`${API_ENDPOINT}/settings`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        }).then((res) => res.json()).then((result) => {
            const izbor = result && result.loginGallery;
            this.setState({
                izabrana: izbor && (izbor.id || izbor.fotografija) ? izbor : null,
                ucitavanje: false,
            });
        }).catch(() => this.setState({ ucitavanje: false }));

        this.trazi('');
    }

    trazi = (pojam) => {
        this.setState({ trazim: true });

        fetch(`${API_ENDPOINT}/gallery/search/ba`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: { search: pojam || undefined, ipp: 12, page: 0 } }),
        }).then((res) => res.json()).then((result) => {
            this.setState({
                rezultati: (result && result.items ? result.items : []),
                trazim: false,
            });
        }).catch(() => this.setState({ trazim: false }));
    };

    /*
     * Klik na galeriju je i izbor i čuvanje — nema zasebnog dugmeta.
     *
     * Dugme „Sačuvaj" je stajalo ISPOD mreže od dvanaest galerija: izbor bi se
     * označio, dugme ostalo neprimijećeno, a neupisan izbor izgleda isto kao
     * upisan. Ovako jedan klik znači jedno stanje.
     */
    izaberi = (g) => {
        const l = this.props.lang;
        const izbor = {
            id: g._id,
            alias: Object.translate(g, 'alias', l) || (g.alias && g.alias.ba) || '',
            naziv: Object.translate(g, 'name', l) || '',
            slika: g.photos && g.photos[0] ? g.photos[0].image : null,
        };

        this.setState({ izabrana: izbor });
        this.sacuvaj({ id: izbor.id, alias: izbor.alias });
    };

    sacuvaj = (vrednost, porukaUspeha) => {
        const l = this.props.lang;
        fetch(`${API_ENDPOINT}/settings/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
            body: JSON.stringify({ loginGallery: vrednost }),
        }).then((res) => res.json().then((telo) => ({ ok: res.ok, status: res.status, telo })))
            .then(({ ok, status, telo }) => {
                /*
                 * Odgovor se MORA provjeriti. `permissionMiddleware` na odbijanje
                 * vraća uredan JSON (`{error: "Not Authorized"}`) uz 401, pa
                 * `res.json()` prolazi — bez ove provjere je poruka govorila
                 * „sačuvano" i onda kad ništa nije sačuvano.
                 */
                if (!ok || (telo && telo.error)) {
                    this.poruke.dodaj('greska',
                        ((telo && telo.error) ? telo.error : 'Izmjena nije sačuvana.') + ' (' + status + ')');
                    return;
                }

                // Provjera da je vrijednost STVARNO zapisana: čitamo je natrag.
                return fetch(`${API_ENDPOINT}/settings`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                }).then((r) => r.json()).then((sada) => {
                    const upisano = sada && sada.loginGallery;
                    const kljuc = (v) => (v && (v.id || v.fotografija)) ? String(v.id || v.fotografija) : null;
                    const ocekivano = kljuc(vrednost);
                    const stvarno = kljuc(upisano);

                    if (ocekivano !== stvarno) {
                        this.poruke.dodaj('greska',
                            'Izbor nije zapisan u bazu. Tabela `settings` nema kolonu `loginGallery` — vidi CLAUDE.md.'.translate(l));
                        return;
                    }

                    // Zaglavlje i strane čitaju podešavanja iz `App.js` — osvježi
                    // ih, da se izmjena vidi bez ponovnog učitavanja sajta.
                    if (this.props.initFetch) this.props.initFetch();
                    const uspeh = porukaUspeha
                        || (vrednost ? 'Fotografija na prijavi je promijenjena.' : 'Vraćeno na najnoviju galeriju.');
                    this.poruke.dodaj('uspeh', uspeh.translate(l));
                });
            })
            .catch(() => this.poruke.dodaj('greska', 'Izmjena nije sačuvana. Pokušajte ponovo.'.translate(l)));
    };

    // Sopstvena fotografija — postavlja se kroz isti `/upload` kao baneri.
    postaviFotografiju = (url) => {
        const iz = this.state.izabrana;
        const izbor = { fotografija: url, potpis: (iz && iz.fotografija && iz.potpis) || '' };
        this.setState({ izabrana: izbor });
        this.sacuvaj(izbor);
    };

    sacuvajPotpis = () => {
        const iz = this.state.izabrana;
        if (!iz || !iz.fotografija) return;
        this.sacuvaj({ fotografija: iz.fotografija, potpis: iz.potpis || '' }, 'Potpis je sačuvan.');
    };

    render() {
        const l = this.props.lang;
        const iz = this.state.izabrana;
        const sopstvena = !!(iz && iz.fotografija);

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Prijava i registracija'.translate(l)}
                radnja={
                    <Link to="/account/pages" className="z-adminokvir__radnja z-adminokvir__radnja--tiha">
                        {'Nazad na spisak'.translate(l)}
                    </Link>
                }
            >
                <Obavestenja
                    lang={l}
                    poruke={this.state.poruke}
                    naZatvaranje={(id) => this.poruke.skloni(id)}
                />

                <div className="z-prijava-strana">
                    <p className="z-prijava-strana__uvod">
                        {'Fotografija uz obrazac na stranama Prijava i Registracija. Ispod nje stoji naziv galerije, autor, mjesto i godina.'.translate(l)}
                    </p>

                    {/* ── trenutni izbor ──────────────────────────────── */}
                    <div className="z-prijava-strana__trenutno">
                        <span className="z-prijava-strana__oznaka">{'Sada se prikazuje'.translate(l)}</span>

                        {this.state.ucitavanje ? (
                            <span className="z-kostur z-kostur--red" />
                        ) : iz ? (
                            <div className="z-prijava-strana__izbor">
                                {sopstvena ? (
                                    <img className="z-prijava-strana__slicica" src={iz.fotografija} alt="" />
                                ) : iz.slika ? (
                                    <img
                                        className="z-prijava-strana__slicica"
                                        src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(iz.slika)}`}
                                        alt=""
                                    />
                                ) : null}
                                <span className="z-prijava-strana__naziv">
                                    {sopstvena ? 'Sopstvena fotografija'.translate(l) : (iz.naziv || iz.alias)}
                                </span>
                                <button
                                    type="button"
                                    className="z-prijava-strana__ukloni"
                                    onClick={() => {
                                        this.setState({ izabrana: null });
                                        this.sacuvaj(null);
                                    }}
                                >
                                    {'Vrati na najnoviju'.translate(l)}
                                </button>
                            </div>
                        ) : (
                            <span className="z-prijava-strana__prazno">
                                {'Najnovija galerija (automatski)'.translate(l)}
                            </span>
                        )}
                    </div>

                    {/* ── sopstvena fotografija ───────────────────────── */}
                    <span className="z-prijava-strana__oznaka">{'Postavite svoju fotografiju'.translate(l)}</span>

                    <div className="z-prijava-strana__sopstvena">
                        <PoljeSlike
                            lang={l}
                            value={sopstvena ? iz.fotografija : null}
                            onChange={this.postaviFotografiju}
                        />

                        {sopstvena ? (
                            <label className="z-polje">
                                <span className="z-polje__oznaka">{'Potpis ispod fotografije (neobavezno)'.translate(l)}</span>
                                <input
                                    type="text"
                                    className="z-polje__unos"
                                    value={iz.potpis || ''}
                                    onChange={(e) => this.setState({ izabrana: { ...iz, potpis: e.target.value } })}
                                    onBlur={this.sacuvajPotpis}
                                />
                            </label>
                        ) : null}
                    </div>

                    {/* ── izbor galerije ──────────────────────────────── */}
                    <span className="z-prijava-strana__oznaka">{'Ili izaberite galeriju'.translate(l)}</span>

                    <form
                        className="z-prijava-strana__trazenje"
                        onSubmit={(e) => { e.preventDefault(); this.trazi(this.state.pretraga); }}
                    >
                        <input
                            type="text"
                            className="z-polje__unos"
                            value={this.state.pretraga}
                            placeholder={'Naziv galerije…'.translate(l)}
                            aria-label={'Pretraga galerija'.translate(l)}
                            onChange={(e) => this.setState({ pretraga: e.target.value })}
                        />
                        <button type="submit" className="z-dugme z-dugme--glavno">
                            {'Traži'.translate(l)}
                        </button>
                    </form>

                    <div className="z-prijava-strana__mreza">
                        {this.state.trazim
                            ? Array.from({ length: 8 }).map((_, i) => (
                                <span className="z-kostur z-prijava-strana__kostur" key={i} />
                            ))
                            : (this.state.rezultati || []).map((g) => {
                                const slika = g.photos && g.photos[0] ? g.photos[0].image : null;
                                const naziv = Object.translate(g, 'name', l) || '';
                                const jeIzabrana = iz && String(iz.id) === String(g._id);

                                return (
                                    <button
                                        type="button"
                                        key={g._id}
                                        aria-pressed={jeIzabrana}
                                        className={'z-prijava-strana__stavka' + (jeIzabrana ? ' z-prijava-strana__stavka--izabrana' : '')}
                                        onClick={() => this.izaberi(g)}
                                    >
                                        {slika ? (
                                            <img
                                                src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(slika)}`}
                                                alt=""
                                                loading="lazy"
                                            />
                                        ) : null}
                                        <span className="z-prijava-strana__stavka-naziv">{naziv}</span>
                                    </button>
                                );
                            })}
                    </div>

                    {!this.state.trazim && !(this.state.rezultati || []).length ? (
                        <p className="z-prijava-strana__prazno">
                            {'Nijedna galerija ne odgovara pretrazi.'.translate(l)}
                        </p>
                    ) : null}

                    <p className="z-prijava-strana__napomena">
                        {'Izbor se pamti odmah po kliku — nema posebnog čuvanja.'.translate(l)}
                    </p>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(PrijavaStranaPage);
