import React, { Component } from 'react';
import Page from '../../containers/page';
import NalogOkvir from '../../components/nalogOkvir';
import AdminOkvir from '../../components/adminOkvir';

import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

/*
 * PREVODI — strana REDAKTORA (2026-11-06).
 *
 * Redaktor proverava engleski naziv i opis galerija, koje sistem prevodi
 * sam (`api/prevod.js`). Srpski tekst samo čita; engleski ispravlja i
 * čuva, i galerija se tada označi kao „provjerena". Server prima samo
 * engleska polja (`/prevodi/galerija/:id`), pa srpski ne može da promeni
 * ni zaobilaznim putem. Strana radi i administratoru.
 */
const zaglavlja = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
});

const datum = (t) => {
    if (!t) return '';
    const d = new Date(Number(t) * 1000);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};

class PrevodiPage extends Component {
    constructor(props) {
        super(props);
        this.state = {
            items: [], ukupno: 0, strana: 0, ucitava: true,
            pretraga: '', neproverene: true,
            izmene: {},     // id → { naziv, opis }
            stanje: {},     // id → 'cuva' | 'sacuvano' | 'greska'
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.dovuci(0);
    }

    dovuci(strana, dodaj) {
        const { pretraga, neproverene } = this.state;
        this.setState({ ucitava: true });
        const upit = `strana=${strana}&neproverene=${neproverene ? 1 : 0}` + (pretraga ? `&pretraga=${encodeURIComponent(pretraga)}` : '');
        fetch(`${API_ENDPOINT}/prevodi/galerije?${upit}`, { headers: zaglavlja() })
            .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
            .then((r) => this.setState({
                items: dodaj ? this.state.items.concat(r.items) : r.items,
                ukupno: r.ukupno, strana, ucitava: false,
            }))
            .catch(() => this.setState({ ucitava: false, greska: true }));
    }

    vrednost(g, polje) {
        const iz = this.state.izmene[g._id];
        if (iz && iz[polje] !== undefined) return iz[polje];
        const izvor = polje === 'naziv' ? g.name : g.description;
        return (izvor && izvor.en) || '';
    }

    izmeni(id, polje, v) {
        const izmene = Object.assign({}, this.state.izmene, { [id]: Object.assign({}, this.state.izmene[id], { [polje]: v }) });
        this.setState({ izmene, stanje: Object.assign({}, this.state.stanje, { [id]: null }) });
    }

    sacuvaj(g) {
        const id = g._id;
        this.setState({ stanje: Object.assign({}, this.state.stanje, { [id]: 'cuva' }) });
        fetch(`${API_ENDPOINT}/prevodi/galerija/${id}`, {
            method: 'POST',
            headers: zaglavlja(),
            body: JSON.stringify({ naziv: this.vrednost(g, 'naziv'), opis: this.vrednost(g, 'opis') }),
        }).then((res) => {
            if (!res.ok) throw new Error(String(res.status));
            const items = this.state.items.map((x) => (x._id === id ? Object.assign({}, x, {
                prevodProveren: true,
                name: Object.assign({}, x.name, { en: this.vrednost(g, 'naziv') }),
                description: Object.assign({}, x.description, { en: this.vrednost(g, 'opis') }),
            }) : x));
            this.setState({ items, stanje: Object.assign({}, this.state.stanje, { [id]: 'sacuvano' }) });
        }).catch(() => this.setState({ stanje: Object.assign({}, this.state.stanje, { [id]: 'greska' }) }));
    }

    render() {
        const l = this.props.lang;
        const u = this.props.uData;
        const Okvir = u && u.userRole === 'admin' ? AdminOkvir : NalogOkvir;
        const { items, ukupno, ucitava } = this.state;

        return (
            <Okvir
                lang={l}
                uData={u}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Prevodi'.translate(l)}
            >
                <div className="z-prevodi">
                    <p className="z-nalog__uvod">
                        {'Engleski naziv i opis galerija prevodi sistem sam. Ovdje ih provjerite i ispravite; srpski tekst se samo čita. Sačuvana galerija se označi kao provjerena.'.translate(l)}
                    </p>

                    <form className="z-prevodi__alati" onSubmit={(e) => { e.preventDefault(); this.dovuci(0); }}>
                        <input type="search" value={this.state.pretraga} placeholder={'Naziv galerije…'.translate(l)}
                               aria-label={'Pretraga galerija'.translate(l)}
                               onChange={(e) => this.setState({ pretraga: e.target.value })} />
                        <button type="submit" className="z-dugme z-dugme--glavno">{'Traži'.translate(l)}</button>
                        <label>
                            <input type="checkbox" checked={this.state.neproverene}
                                   onChange={(e) => this.setState({ neproverene: e.target.checked }, () => this.dovuci(0))} />
                            {'Samo neprovjerene'.translate(l)}
                        </label>
                        <span className="z-prevodi__ukupno">{ukupno} {'galerija'.translate(l)}</span>
                    </form>

                    {items.map((g) => {
                        const st = this.state.stanje[g._id];
                        return (
                            <section key={g._id} className="z-prevodi__galerija">
                                <div className="z-prevodi__vrh">
                                    {g.slika ? <img src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(g.slika)}`} alt="" loading="lazy" /> : null}
                                    <span className="z-prevodi__podaci">{datum(g.date || g.published)}{g.user ? ` · ${g.user}` : ''}</span>
                                    <span className={'z-prevodi__oznaka' + (g.prevodProveren ? ' z-prevodi__oznaka--provereno' : '')}>
                                        {g.prevodProveren ? 'Provjereno'.translate(l) : 'Automatski prevod'.translate(l)}
                                    </span>
                                </div>

                                <div className="z-prevodi__kolone">
                                    <div>
                                        <p className="z-prevodi__jezik">{'Srpski — samo za čitanje'.translate(l)}</p>
                                        <div className="z-prevodi__citaj z-prevodi__citaj--naslov">{(g.name && g.name.ba) || '—'}</div>
                                        <div className="z-prevodi__citaj">{(g.description && g.description.ba) || '—'}</div>
                                    </div>
                                    <div>
                                        <p className="z-prevodi__jezik">{'Engleski — ispravite po potrebi'.translate(l)}</p>
                                        <input className="z-prevodi__unos z-prevodi__unos--naslov" value={this.vrednost(g, 'naziv')}
                                               aria-label={'Engleski naziv'.translate(l)}
                                               onChange={(e) => this.izmeni(g._id, 'naziv', e.target.value)} />
                                        <textarea className="z-prevodi__unos" rows="6" value={this.vrednost(g, 'opis')}
                                                  aria-label={'Engleski opis'.translate(l)}
                                                  onChange={(e) => this.izmeni(g._id, 'opis', e.target.value)} />
                                    </div>
                                </div>

                                <div className="z-prevodi__radnje">
                                    <button type="button" className="z-dugme z-dugme--glavno" disabled={st === 'cuva'}
                                            onClick={() => this.sacuvaj(g)}>
                                        {st === 'cuva' ? 'Čuvam…'.translate(l) : 'Sačuvaj prevod'.translate(l)}
                                    </button>
                                    {st === 'sacuvano' ? <span role="status">{'Sačuvano.'.translate(l)}</span> : null}
                                    {st === 'greska' ? <span className="z-prevodi__poruka--greska" role="alert">{'Nije sačuvano. Pokušajte ponovo.'.translate(l)}</span> : null}
                                </div>
                            </section>
                        );
                    })}

                    {!ucitava && !items.length ? (
                        <p className="z-nalog__uvod">{this.state.greska ? 'Galerije se ne mogu učitati.'.translate(l) : 'Nema galerija za provjeru.'.translate(l)}</p>
                    ) : null}

                    {items.length < ukupno ? (
                        <div className="z-prevodi__jos">
                            <button type="button" className="z-dugme z-dugme--sporedno" disabled={ucitava}
                                    onClick={() => this.dovuci(this.state.strana + 1, true)}>
                                {ucitava ? 'Učitavanje…'.translate(l) : 'Učitaj još galerija'.translate(l)}
                            </button>
                        </div>
                    ) : null}
                </div>
            </Okvir>
        );
    }
}

export default Page(PrevodiPage);
