import React, { Component } from 'react';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';

import { API_ENDPOINT } from '../../constants';

/*
 * LICENCE — namene korišćenja u prozoru fotografije (2026-10-10).
 *
 * Opšti naziv, opis i cena svake licence. Cena za pojedinačnu fotografiju
 * upisuje se u galeriji (Izmjeni fotografiju → Cijene) i ima prednost.
 * Prazna cena znači „Na upit". Kupac licencu ne plaća kroz korpu — šalje
 * upit, koji stiže u *Poruke → Upiti za licence*.
 */
const zaglavlja = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
});

const prazna = () => ({
    _id: 'new',
    naziv: { ba: '', en: '' },
    opis: { ba: '', en: '' },
    cena: '',
    position: 0,
    isActive: true,
});

class LicencePage extends Component {
    constructor(props) {
        super(props);
        this.state = { ...props.initialData, stavke: [], ucitavanje: true, poruke: [] };
        this.poruke = napraviPoruke(this);
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname)
                .then((data) => this.setState({ ...data }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                }));
        }
        this.ucitaj();
    }

    ucitaj = () => {
        fetch(`${API_ENDPOINT}/licence/admin/all`, { headers: zaglavlja() })
            .then((res) => res.json())
            .then((rez) => this.setState({ stavke: Array.isArray(rez) ? rez : [], ucitavanje: false }))
            .catch(() => this.setState({ ucitavanje: false }));
    };

    izmeni = (i, putanja, vrednost) => {
        const stavke = this.state.stavke.slice();
        const s = JSON.parse(JSON.stringify(stavke[i]));
        if (putanja.length === 2) s[putanja[0]] = Object.assign({}, s[putanja[0]], { [putanja[1]]: vrednost });
        else s[putanja[0]] = vrednost;
        stavke[i] = s;
        this.setState({ stavke });
    };

    sacuvaj = (s) => {
        const l = this.props.lang;
        fetch(`${API_ENDPOINT}/licence/update/${s._id}`, {
            method: 'POST',
            headers: zaglavlja(),
            body: JSON.stringify(s),
        }).then((res) => {
            if (!res.ok) throw new Error(String(res.status));
            this.poruke.dodaj('uspeh', 'Licenca je sačuvana.'.translate(l));
            this.ucitaj();
        }).catch((e) => this.poruke.dodaj('greska', 'Izmjena nije sačuvana.'.translate(l) + ` (${e.message})`));
    };

    obrisi = (s, i) => {
        const l = this.props.lang;
        if (s._id === 'new') {
            const stavke = this.state.stavke.slice();
            stavke.splice(i, 1);
            this.setState({ stavke });
            return;
        }
        if (!window.confirm('Obrisati ovu licencu?'.translate(l))) return;
        fetch(`${API_ENDPOINT}/licence/delete/${s._id}`, { method: 'DELETE', headers: zaglavlja() })
            .then((res) => {
                if (!res.ok) throw new Error(String(res.status));
                this.poruke.dodaj('uspeh', 'Licenca je obrisana.'.translate(l));
                this.ucitaj();
            })
            .catch((e) => this.poruke.dodaj('greska', 'Izmjena nije sačuvana.'.translate(l) + ` (${e.message})`));
    };

    render() {
        const l = this.props.lang;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Licence'.translate(l)}
                radnja={
                    <button
                        type="button"
                        className="z-adminokvir__radnja"
                        onClick={() => this.setState({ stavke: this.state.stavke.concat([prazna()]) })}
                    >
                        {'Dodaj licencu'.translate(l)}
                    </button>
                }
            >
                <Obavestenja lang={l} poruke={this.state.poruke} naZatvaranje={(id) => this.poruke.skloni(id)} />

                <div className="z-licence-admin">
                    <p className="z-prijava-strana__uvod">
                        {'Namjene korišćenja koje kupac vidi ispod veličina, kad klikne „Prikaži više opcija". Prazna cijena znači „Na upit". Cijenu za pojedinačnu fotografiju mijenjate u galeriji: Izmjeni fotografiju → Cijene.'.translate(l)}
                    </p>

                    {this.state.ucitavanje ? <span className="z-kostur z-kostur--red" /> : null}

                    {this.state.stavke.map((s, i) => (
                        <div className="z-licence-admin__stavka" key={s._id + '-' + i}>
                            <div className="z-licence-admin__red">
                                <label className="z-polje">
                                    <span className="z-polje__oznaka">{'Naziv (BA)'.translate(l)}</span>
                                    <input className="z-polje__unos" value={(s.naziv && s.naziv.ba) || ''}
                                           onChange={(e) => this.izmeni(i, ['naziv', 'ba'], e.target.value)} />
                                </label>
                                <label className="z-polje">
                                    <span className="z-polje__oznaka">{'Naziv (EN)'.translate(l)}</span>
                                    <input className="z-polje__unos" value={(s.naziv && s.naziv.en) || ''}
                                           onChange={(e) => this.izmeni(i, ['naziv', 'en'], e.target.value)} />
                                </label>
                                <label className="z-polje">
                                    <span className="z-polje__oznaka">{'Cijena (KM)'.translate(l)}</span>
                                    <input className="z-polje__unos" type="number" min="0" step="0.01"
                                           value={s.cena === null || s.cena === undefined ? '' : s.cena}
                                           onChange={(e) => this.izmeni(i, ['cena'], e.target.value)} />
                                </label>
                                <label className="z-polje">
                                    <span className="z-polje__oznaka">{'Redosljed'.translate(l)}</span>
                                    <input className="z-polje__unos" type="number"
                                           value={s.position || 0}
                                           onChange={(e) => this.izmeni(i, ['position'], e.target.value)} />
                                </label>
                            </div>
                            <div className="z-licence-admin__red z-licence-admin__red--opis">
                                <label className="z-polje">
                                    <span className="z-polje__oznaka">{'Opis (BA)'.translate(l)}</span>
                                    <textarea className="z-polje__unos" rows="2" value={(s.opis && s.opis.ba) || ''}
                                              onChange={(e) => this.izmeni(i, ['opis', 'ba'], e.target.value)} />
                                </label>
                                <label className="z-polje">
                                    <span className="z-polje__oznaka">{'Opis (EN)'.translate(l)}</span>
                                    <textarea className="z-polje__unos" rows="2" value={(s.opis && s.opis.en) || ''}
                                              onChange={(e) => this.izmeni(i, ['opis', 'en'], e.target.value)} />
                                </label>
                            </div>
                            <div className="z-licence-admin__radnje">
                                <label className="z-licence-admin__aktivna">
                                    <input type="checkbox" checked={s.isActive !== false}
                                           onChange={(e) => this.izmeni(i, ['isActive'], e.target.checked)} />
                                    {'Prikazuje se na sajtu'.translate(l)}
                                </label>
                                <button type="button" className="z-dugme z-dugme--tiho" onClick={() => this.obrisi(s, i)}>
                                    {'Obriši'.translate(l)}
                                </button>
                                <button type="button" className="z-dugme z-dugme--glavno" onClick={() => this.sacuvaj(s)}>
                                    {'Sačuvaj'.translate(l)}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(LicencePage);
