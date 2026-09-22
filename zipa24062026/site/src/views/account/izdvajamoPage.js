import React, { Component } from 'react';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';

import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

/*
 * IZDVAJAMO — izbor galerija za odeljak „Izdvajamo" na naslovnoj.
 *
 * Podaci su u tabeli `featured` (API `/featured/*` je postojao, ekrana nije
 * bilo). Svaka stavka nosi naslov, fotografiju i vezu; ovde se prave iz
 * izabrane galerije: naslov = naziv galerije, fotografija = prva iz nje,
 * veza = strana galerije. Redosled je `position`.
 *
 * Predlog B prikazuje prve četiri, A i C prve dve.
 */
const zaglavlja = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
});

// Adresa fotografije: u bazi je bez domaćina (`/photos/...`), stari redovi sa njim.
const slikaStavke = (vrednost) => {
    if (!vrednost) return null;
    const mesto = vrednost.indexOf('/photos/');
    return mesto === -1 ? vrednost : `${PHOTOS_ENDPOINT}${vrednost.slice(mesto)}`;
};

class IzdvajamoPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            stavke: [],
            ucitavanje: true,
            pretraga: '',
            rezultati: [],
            trazim: false,
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

        this.ucitaj();
        this.trazi('');
    }

    ucitaj = () => {
        fetch(`${API_ENDPOINT}/featured/admin/all`, { headers: zaglavlja() })
            .then((res) => res.json())
            .then((rez) => this.setState({ stavke: Array.isArray(rez) ? rez : [], ucitavanje: false }))
            .catch(() => this.setState({ ucitavanje: false }));
    };

    trazi = (pojam) => {
        this.setState({ trazim: true });
        fetch(`${API_ENDPOINT}/gallery/search/ba`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: { search: pojam || undefined, ipp: 12, page: 0 } }),
        }).then((res) => res.json()).then((rez) => {
            this.setState({ rezultati: (rez && rez.items) || [], trazim: false });
        }).catch(() => this.setState({ trazim: false }));
    };

    // Jedan upis; `id` je 'new' za novu stavku.
    sacuvaj = (id, polja) => fetch(`${API_ENDPOINT}/featured/update/${id}`, {
        method: 'POST',
        headers: zaglavlja(),
        body: JSON.stringify(polja),
    }).then((res) => {
        if (!res.ok) throw new Error(String(res.status));
    });

    poljaStavke = (s, position) => ({
        title: s.title,
        image: s.image,
        link: s.link,
        position,
        isActive: s.isActive !== false,
    });

    dodaj = (g) => {
        const l = this.props.lang;
        const slika = g.photos && g.photos[0] ? g.photos[0].image : null;
        const alias = (g.alias && (g.alias.ba || g.alias)) || 'galerija';
        const poslednja = this.state.stavke.reduce((m, s) => Math.max(m, s.position || 0), 0);

        this.sacuvaj('new', {
            title: { ba: (g.name && g.name.ba) || '', en: (g.name && (g.name.en || g.name.ba)) || '' },
            image: slika ? `/photos/700x/${slika}` : '',
            link: `/galerija/${alias}/${g._id}`,
            position: poslednja + 1,
            isActive: true,
        }).then(() => {
            this.poruke.dodaj('uspeh', 'Galerija je dodata u Izdvajamo.'.translate(l));
            this.ucitaj();
        }).catch((e) => this.poruke.dodaj('greska', 'Izmjena nije sačuvana.'.translate(l) + ` (${e.message})`));
    };

    ukloni = (s) => {
        const l = this.props.lang;
        fetch(`${API_ENDPOINT}/featured/delete/${s._id}`, { method: 'DELETE', headers: zaglavlja() })
            .then((res) => {
                if (!res.ok) throw new Error(String(res.status));
                this.poruke.dodaj('uspeh', 'Galerija je uklonjena iz Izdvajamo.'.translate(l));
                this.ucitaj();
            })
            .catch((e) => this.poruke.dodaj('greska', 'Izmjena nije sačuvana.'.translate(l) + ` (${e.message})`));
    };

    // Pomeranje gore/dole: ceo spisak dobija redne brojeve 1..n.
    pomeri = (indeks, smer) => {
        const l = this.props.lang;
        const nove = this.state.stavke.slice();
        const cilj = indeks + smer;
        if (cilj < 0 || cilj >= nove.length) return;
        [nove[indeks], nove[cilj]] = [nove[cilj], nove[indeks]];
        this.setState({ stavke: nove });

        Promise.all(nove.map((s, i) => this.sacuvaj(s._id, this.poljaStavke(s, i + 1))))
            .then(() => this.ucitaj())
            .catch((e) => this.poruke.dodaj('greska', 'Izmjena nije sačuvana.'.translate(l) + ` (${e.message})`));
    };

    render() {
        const l = this.props.lang;
        const { stavke } = this.state;
        const izabrane = new Set(stavke.map((s) => (s.link || '').split('/').pop()));

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Izdvajamo'.translate(l)}
            >
                <Obavestenja
                    lang={l}
                    poruke={this.state.poruke}
                    naZatvaranje={(id) => this.poruke.skloni(id)}
                />

                <div className="z-prijava-strana z-izdvajamo">
                    <p className="z-prijava-strana__uvod">
                        {'Galerije u odeljku „Izdvajamo" na naslovnoj. Predlog B prikazuje prve četiri, A i C prve dvije.'.translate(l)}
                    </p>

                    {/* ── trenutni izbor ──────────────────────────────── */}
                    <div className="z-prijava-strana__trenutno">
                        <span className="z-prijava-strana__oznaka">{'Sada se prikazuje'.translate(l)}</span>

                        {this.state.ucitavanje ? (
                            <span className="z-kostur z-kostur--red" />
                        ) : stavke.length ? (
                            <ol className="z-izdvajamo__spisak">
                                {stavke.map((s, i) => (
                                    <li key={s._id} className="z-izdvajamo__stavka">
                                        <span className="z-izdvajamo__broj">{i + 1}</span>
                                        {s.image ? <img className="z-prijava-strana__slicica" src={slikaStavke(s.image)} alt="" /> : null}
                                        <span className="z-prijava-strana__naziv">{Object.translate(s, 'title', l)}</span>
                                        <span className="z-izdvajamo__radnje">
                                            <button type="button" className="z-dugme z-dugme--tiho"
                                                    disabled={i === 0}
                                                    aria-label={'Pomjeri gore'.translate(l)}
                                                    onClick={() => this.pomeri(i, -1)}>↑</button>
                                            <button type="button" className="z-dugme z-dugme--tiho"
                                                    disabled={i === stavke.length - 1}
                                                    aria-label={'Pomjeri dolje'.translate(l)}
                                                    onClick={() => this.pomeri(i, 1)}>↓</button>
                                            <button type="button" className="z-prijava-strana__ukloni"
                                                    onClick={() => this.ukloni(s)}>
                                                {'Ukloni'.translate(l)}
                                            </button>
                                        </span>
                                    </li>
                                ))}
                            </ol>
                        ) : (
                            <span className="z-prijava-strana__prazno">{'Nijedna galerija nije izdvojena.'.translate(l)}</span>
                        )}
                    </div>

                    {/* ── dodavanje ───────────────────────────────────── */}
                    <span className="z-prijava-strana__oznaka">{'Dodajte galeriju'.translate(l)}</span>

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
                                const jeIzabrana = izabrane.has(String(g._id));
                                return (
                                    <button
                                        type="button"
                                        key={g._id}
                                        disabled={jeIzabrana}
                                        aria-pressed={jeIzabrana}
                                        className={'z-prijava-strana__stavka' + (jeIzabrana ? ' z-prijava-strana__stavka--izabrana' : '')}
                                        onClick={() => this.dodaj(g)}
                                    >
                                        {slika ? (
                                            <img src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(slika)}`} alt="" loading="lazy" />
                                        ) : null}
                                        <span className="z-prijava-strana__stavka-naziv">{Object.translate(g, 'name', l)}</span>
                                    </button>
                                );
                            })}
                    </div>

                    <p className="z-prijava-strana__napomena">
                        {'Klik na galeriju je dodaje na kraj spiska.'.translate(l)}
                    </p>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(IzdvajamoPage);
