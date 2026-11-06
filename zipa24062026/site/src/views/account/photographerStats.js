import React, { Component } from 'react';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import ZaglavljeStampe, { stampaj } from '../../components/zaglavljeStampe';

import { API_ENDPOINT } from '../../constants';

/*
 * STATISTIKA FOTOGRAFA (prekrojeno 2026-11-06) — izveštaj za štampu.
 *
 * Tabela: redni broj, ime i prezime, broj postavljenih galerija i
 * fotografija, sa zbirom na dnu. Bez perioda važi za celu arhivu; sa
 * periodom broji galerije OBJAVLJENE u njemu. Svi nalozi fotografa su na
 * spisku, i oni bez ijedne galerije. Izvor: `/admin/statistika-fotografa`
 * (`photographerUploadStats` u `api/admin/admin.js`).
 */
const prikazDana = (s) => (s ? `${s.slice(8, 10)}.${s.slice(5, 7)}.${s.slice(0, 4)}.` : '');
const br = (n) => Number(n || 0).toLocaleString('sr-RS');

class PhotographerStats extends Component {
    constructor(props) {
        super(props);
        this.state = { od: '', do: '', redovi: null, ucitava: true, greska: null, prikazano: null };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.dovuci();
    }

    dovuci = (e) => {
        if (e) e.preventDefault();
        const { od, do: dokle } = this.state;
        if ((od && !dokle) || (!od && dokle) || (od && dokle && dokle < od)) return;
        this.setState({ ucitava: true, greska: null });
        const upit = od && dokle ? `?od=${od}&do=${dokle}` : '';
        fetch(`${API_ENDPOINT}/admin/statistika-fotografa${upit}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` },
        })
            .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
            .then((redovi) => this.setState({ redovi, ucitava: false, prikazano: od && dokle ? { od, do: dokle } : null }))
            .catch(() => this.setState({ ucitava: false, greska: true }));
    };

    render() {
        const l = this.props.lang;
        const redovi = this.state.redovi || [];
        const p = this.state.prikazano;
        const podnaslov = p
            ? `Galerije objavljene od ${prikazDana(p.od)} do ${prikazDana(p.do)}`
            : 'Cijela arhiva';
        const zbirG = redovi.reduce((z, r) => z + (r.uploadedGalleryCount || 0), 0);
        const zbirF = redovi.reduce((z, r) => z + (r.uploadedPhotosCount || 0), 0);

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Statistika fotografa'.translate(l)}
            >
                <form className="z-stat-alati" onSubmit={this.dovuci}>
                    <label className="z-ploca__datum">
                        <span>{'Od'.translate(l)}</span>
                        <input type="date" value={this.state.od} max={this.state.do || undefined}
                               onChange={(e) => this.setState({ od: e.target.value })} />
                    </label>
                    <label className="z-ploca__datum">
                        <span>{'Do'.translate(l)}</span>
                        <input type="date" value={this.state.do} min={this.state.od || undefined}
                               onChange={(e) => this.setState({ do: e.target.value })} />
                    </label>
                    <button type="submit" className="z-dugme z-dugme--glavno">{'Prikaži'.translate(l)}</button>
                    {p ? (
                        <button type="button" className="z-dugme z-dugme--tiho"
                                onClick={() => this.setState({ od: '', do: '' }, () => this.dovuci())}>
                            {'Cijela arhiva'.translate(l)}
                        </button>
                    ) : null}
                    <button type="button" className="z-dugme z-dugme--sporedno" disabled={!redovi.length} onClick={stampaj}>
                        {'Štampaj'.translate(l)}
                    </button>
                </form>

                <div className="z-stampa">
                    <ZaglavljeStampe naslov="Statistika fotografa" podnaslov={podnaslov} />

                    {this.state.greska ? <p className="z-stat-objasnjenje">Podaci se ne mogu učitati. Osvježite stranu.</p> : null}
                    {this.state.ucitava ? <p className="z-stat-objasnjenje">Učitavam…</p> : (
                        <table className="z-stat-tabela">
                            <thead>
                                <tr>
                                    <th className="z-stat-tabela__br">Red. br.</th>
                                    <th>Ime i prezime fotografa</th>
                                    <th className="z-stat-tabela__broj">Broj uploadovanih galerija</th>
                                    <th className="z-stat-tabela__broj">Broj uploadovanih fotografija</th>
                                </tr>
                            </thead>
                            <tbody>
                                {redovi.map((r, i) => (
                                    <tr key={r._id || i}>
                                        <td className="z-stat-tabela__br">{i + 1}.</td>
                                        <td>{r.name || r.userAlias || '—'}</td>
                                        <td className="z-stat-tabela__broj">{br(r.uploadedGalleryCount)}</td>
                                        <td className="z-stat-tabela__broj">{br(r.uploadedPhotosCount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td />
                                    <td>Ukupno ({redovi.length} fotografa)</td>
                                    <td className="z-stat-tabela__broj">{br(zbirG)}</td>
                                    <td className="z-stat-tabela__broj">{br(zbirF)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    )}
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(PhotographerStats);
