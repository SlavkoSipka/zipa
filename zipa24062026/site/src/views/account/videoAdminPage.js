import React, { Component } from 'react';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';

import { API_ENDPOINT } from '../../constants';
import { youtubeId } from '../../components/youtube';

/*
 * VIDEO — snimci za stranu /video i naslovnu (2026-10-10).
 *
 * Admin nalepi YouTube adresu (pun link ili goli ID), upiše naslov, opis,
 * grad i datum. Sličica se vuče sama iz adrese. Naslov i opis stoje na
 * strani /video direktno iznad snimka. Redosled je po DATUMU, najnoviji
 * prvi (2026-10-14); na naslovnoj idu šest najnovijih uključenih. Polje
 * „Redosljed" je zato skinuto — `position` ostaje u bazi, ali se ne čita.
 */
const zaglavlja = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
});

// unix (sekunde) ↔ vrednost polja <input type="date">
const uPolje = (t) => {
    if (!t) return '';
    const d = new Date(t * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const izPolja = (v) => (v ? Math.floor(new Date(v + 'T12:00:00').getTime() / 1000) : null);

const prazan = () => ({
    _id: 'new',
    link: '',
    title: { ba: '', en: '' },
    opis: { ba: '', en: '' },
    grad: '',
    // Nov snimak dobija današnji datum, da ne ode na kraj spiska.
    datum: izPolja(uPolje(Math.floor(Date.now() / 1000))),
    position: 0,
    isActive: true,
});

class VideoAdminPage extends Component {
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
        fetch(`${API_ENDPOINT}/videos/admin/all`, { headers: zaglavlja() })
            .then((res) => res.json())
            .then((rez) => this.setState({ stavke: Array.isArray(rez) ? rez : [], ucitavanje: false }))
            .catch(() => this.setState({ ucitavanje: false }));
    };

    izmeni = (i, putanja, vrednost) => {
        const stavke = this.state.stavke.slice();
        const s = JSON.parse(JSON.stringify(stavke[i]));
        if (putanja.length === 2) s[putanja[0]] = Object.assign({}, s[putanja[0]] || {}, { [putanja[1]]: vrednost });
        else s[putanja[0]] = vrednost;
        stavke[i] = s;
        this.setState({ stavke });
    };

    sacuvaj = (s) => {
        const l = this.props.lang;
        const id = youtubeId(s.link);
        if (!id) {
            this.poruke.dodaj('greska', 'Adresa nije prepoznata kao YouTube snimak.'.translate(l));
            return;
        }
        // Po datumu se ređa i /video i naslovna — bez njega bi snimak otišao na kraj.
        if (!s.datum) {
            this.poruke.dodaj('greska', 'Upišite datum snimka.'.translate(l));
            return;
        }
        // Goli ID se pretvara u punu adresu pre slanja; sličica se pravi iznova.
        const telo = Object.assign({}, s, { link: `https://www.youtube.com/watch?v=${id}`, thumbnail: null });
        fetch(`${API_ENDPOINT}/videos/update/${s._id}`, {
            method: 'POST', headers: zaglavlja(), body: JSON.stringify(telo),
        }).then((res) => {
            if (!res.ok) throw new Error(String(res.status));
            this.poruke.dodaj('uspeh', 'Snimak je sačuvan.'.translate(l));
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
        if (!window.confirm('Obrisati ovaj snimak?'.translate(l))) return;
        fetch(`${API_ENDPOINT}/videos/delete/${s._id}`, { method: 'DELETE', headers: zaglavlja() })
            .then(() => { this.poruke.dodaj('uspeh', 'Snimak je obrisan.'.translate(l)); this.ucitaj(); });
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
                naslov={'Video'.translate(l)}
                radnja={
                    <button type="button" className="z-adminokvir__radnja"
                            onClick={() => this.setState({ stavke: [prazan()].concat(this.state.stavke) })}>
                        {'Dodaj snimak'.translate(l)}
                    </button>
                }
            >
                <Obavestenja lang={l} poruke={this.state.poruke} naZatvaranje={(id) => this.poruke.skloni(id)} />

                <div className="z-licence-admin">
                    <p className="z-prijava-strana__uvod">
                        {'Snimci za stranu Video i naslovnu. Nalepite YouTube adresu, upišite naslov, opis, grad i datum — naslov i opis stoje iznad snimka. Snimci idu po datumu, najnoviji prvi; na početnoj se vidi šest najnovijih.'.translate(l)}
                    </p>

                    {this.state.ucitavanje ? <span className="z-kostur z-kostur--red" /> : null}

                    {this.state.stavke.map((s, i) => {
                        const id = youtubeId(s.link);
                        return (
                            <div className="z-licence-admin__stavka z-video-admin" key={s._id + '-' + i}>
                                <div className="z-video-admin__vrh">
                                    <div className="z-video-admin__pregled">
                                        {id ? (
                                            <img src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" />
                                        ) : (
                                            <span>{'Pregled se pojavi kad se nalepi adresa'.translate(l)}</span>
                                        )}
                                    </div>
                                    <div className="z-video-admin__polja">
                                        <label className="z-polje">
                                            <span className="z-polje__oznaka">{'YouTube adresa'.translate(l)} *</span>
                                            <input className="z-polje__unos" value={s.link || ''}
                                                   placeholder="https://www.youtube.com/watch?v=..."
                                                   onChange={(e) => this.izmeni(i, ['link'], e.target.value)} />
                                        </label>
                                        <div className="z-licence-admin__red">
                                            <label className="z-polje">
                                                <span className="z-polje__oznaka">{'Grad'.translate(l)}</span>
                                                <input className="z-polje__unos" value={s.grad || ''}
                                                       onChange={(e) => this.izmeni(i, ['grad'], e.target.value)} />
                                            </label>
                                            <label className="z-polje">
                                                <span className="z-polje__oznaka">{'Datum'.translate(l)} *</span>
                                                <input className="z-polje__unos" type="date" value={uPolje(s.datum)}
                                                       onChange={(e) => this.izmeni(i, ['datum'], izPolja(e.target.value))} />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="z-licence-admin__red z-licence-admin__red--opis">
                                    <label className="z-polje">
                                        <span className="z-polje__oznaka">{'Naslov (BA)'.translate(l)}</span>
                                        <input className="z-polje__unos" value={(s.title && s.title.ba) || ''}
                                               onChange={(e) => this.izmeni(i, ['title', 'ba'], e.target.value)} />
                                    </label>
                                    <label className="z-polje">
                                        <span className="z-polje__oznaka">{'Naslov (EN)'.translate(l)}</span>
                                        <input className="z-polje__unos" value={(s.title && s.title.en) || ''}
                                               onChange={(e) => this.izmeni(i, ['title', 'en'], e.target.value)} />
                                    </label>
                                    <label className="z-polje">
                                        <span className="z-polje__oznaka">{'Opis (BA)'.translate(l)}</span>
                                        <textarea className="z-polje__unos" rows="3" value={(s.opis && s.opis.ba) || ''}
                                                  onChange={(e) => this.izmeni(i, ['opis', 'ba'], e.target.value)} />
                                    </label>
                                    <label className="z-polje">
                                        <span className="z-polje__oznaka">{'Opis (EN)'.translate(l)}</span>
                                        <textarea className="z-polje__unos" rows="3" value={(s.opis && s.opis.en) || ''}
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
                        );
                    })}
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(VideoAdminPage);
