import React, { Component } from 'react';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import ZaglavljeStampe, { stampaj } from '../../components/zaglavljeStampe';

import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

/*
 * STATISTIKA GALERIJA (prekrojeno 2026-11-06).
 *
 * Za izabrani period: koliko puta su otvarane fotografije, po galerijama.
 * Izvor je `photoVisits` (svako otvaranje fotografije u galeriji), ruta
 * `/admin/statistika-galerija`. Svaka GRUPA je jedna galerija: krupan broj
 * je zbir pregleda svih njenih fotografija, ispod su najgledanije.
 *
 * Ranije: kalendar je ispadao iz okvira, naziv galerije je bio isključen pa
 * se nije znalo šta su grupe, a štampa je izlazila sa menijem administracije.
 */
const dan = (d) => d.toISOString().slice(0, 10);
const prikazDana = (s) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}.` : '');
const br = (n) => Number(n || 0).toLocaleString('sr-RS');

class GalleryStats extends Component {
    constructor(props) {
        super(props);
        const danas = new Date();
        const pre30 = new Date(Date.now() - 29 * 86400000);
        this.state = { od: dan(pre30), do: dan(danas), galerije: null, ucitava: true, greska: null, prikazano: null };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.dovuci();
    }

    dovuci = (e) => {
        if (e) e.preventDefault();
        const { od, do: dokle } = this.state;
        if (!od || !dokle || dokle < od) return;
        this.setState({ ucitava: true, greska: null });
        fetch(`${API_ENDPOINT}/admin/statistika-galerija?od=${od}&do=${dokle}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((galerije) => this.setState({ galerije, ucitava: false, prikazano: { od, do: dokle } }))
            .catch(() => this.setState({ ucitava: false, greska: true }));
    };

    render() {
        const l = this.props.lang;
        const galerije = this.state.galerije || [];
        const ukupno = galerije.reduce((z, g) => z + (g.visits || 0), 0);
        const fotografija = galerije.reduce((z, g) => z + ((g.photos && g.photos.length) || 0), 0);
        const p = this.state.prikazano;
        const period = p ? `${prikazDana(p.od)} – ${prikazDana(p.do)}` : '';

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Statistika galerija'.translate(l)}
            >
                <form className="z-stat-alati" onSubmit={this.dovuci}>
                    <label className="z-ploca__datum">
                        <span>{'Od'.translate(l)}</span>
                        <input type="date" value={this.state.od} max={this.state.do}
                               onChange={(e) => this.setState({ od: e.target.value })} />
                    </label>
                    <label className="z-ploca__datum">
                        <span>{'Do'.translate(l)}</span>
                        <input type="date" value={this.state.do} min={this.state.od}
                               onChange={(e) => this.setState({ do: e.target.value })} />
                    </label>
                    <button type="submit" className="z-dugme z-dugme--glavno">{'Prikaži'.translate(l)}</button>
                    <button type="button" className="z-dugme z-dugme--sporedno" disabled={!galerije.length} onClick={stampaj}>
                        {'Štampaj'.translate(l)}
                    </button>
                </form>

                <div className="z-stampa">
                    <ZaglavljeStampe naslov="Statistika posjeta galerija" podnaslov={period ? `Za period ${period}` : null} />

                    <div className="z-stat-brojevi">
                        <div className="z-stat-broj z-stat-broj--glavni">
                            <span className="z-stat-broj__vrednost">{this.state.ucitava ? '—' : br(ukupno)}</span>
                            <span className="z-stat-broj__naziv">pregleda fotografija</span>
                        </div>
                        <div className="z-stat-broj">
                            <span className="z-stat-broj__vrednost">{this.state.ucitava ? '—' : br(galerije.length)}</span>
                            <span className="z-stat-broj__naziv">galerija sa pregledima</span>
                        </div>
                        <div className="z-stat-broj">
                            <span className="z-stat-broj__vrednost">{this.state.ucitava ? '—' : br(fotografija)}</span>
                            <span className="z-stat-broj__naziv">pregledanih fotografija</span>
                        </div>
                    </div>

                    <p className="z-stat-objasnjenje">
                        <b>Kako se čita:</b> svaka kartica je <b>jedna galerija</b>. Krupan broj je koliko su puta u ovom periodu
                        otvarane njene fotografije (zbir za sve fotografije galerije). Ispod su njene najgledanije fotografije
                        sa brojem otvaranja. Galerije su poređane od najgledanije.
                    </p>

                    {this.state.greska ? <p className="z-stat-objasnjenje">Podaci se ne mogu učitati. Osvježite stranu.</p> : null}
                    {!this.state.ucitava && !this.state.greska && !galerije.length ? (
                        <p className="z-stat-objasnjenje">U ovom periodu nije zabilježeno nijedno otvaranje fotografije.</p>
                    ) : null}

                    <div className="z-stat-galerije">
                        {galerije.map((g, i) => (
                            <section key={g._id || i} className="z-stat-galerija">
                                <div className="z-stat-galerija__vrh">
                                    <span className="z-stat-galerija__mesto">{i + 1}.</span>
                                    <h3 className="z-stat-galerija__naziv">{g.name || '(galerija obrisana)'}</h3>
                                </div>
                                <div className="z-stat-galerija__broj">{br(g.visits)} <small>pregleda</small></div>
                                <ul className="z-stat-galerija__foto">
                                    {(g.photos || []).slice(0, 4).map((f, j) => (
                                        <li key={j}>
                                            {f.image ? <img src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(f.image)}`} alt="" loading="lazy" /> : <span />}
                                            <span className="z-stat-galerija__ime" title={f.name}>{f.name}</span>
                                            <b>{br(f.visits)}</b>
                                        </li>
                                    ))}
                                </ul>
                                {g.photos && g.photos.length > 4 ? (
                                    <p className="z-stat-galerija__jos">+ još {g.photos.length - 4} fotografija sa pregledima</p>
                                ) : null}
                            </section>
                        ))}
                    </div>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(GalleryStats);
