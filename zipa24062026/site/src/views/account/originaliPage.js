import React, { Component } from 'react';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';

import { API_ENDPOINT } from '../../constants';

/*
 * ORIGINALI — koliko dugo se čuvaju (2026-11-06), `api/originali.js`.
 *
 * Administrator upiše broj meseci; pre čuvanja vidi koliko će se galerija i
 * fotografija obraditi, i mora da upiše OBRIŠI — brisanje originala je
 * nepovratno. Pregledi sa žigom ostaju, a kupac na tim galerijama dobija
 * poruku da se javi agenciji.
 */
const zaglavlja = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
});
const br = (n) => Number(n || 0).toLocaleString('sr-RS');
const datum = (t) => (t ? new Date(Number(t) * 1000).toLocaleDateString('sr-RS') : '—');

class OriginaliPage extends Component {
    constructor(props) {
        super(props);
        this.state = { meseci: '', sacuvano: null, potvrda: '', pregled: null, poruka: null, greska: null, cuva: false };
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        fetch(`${API_ENDPOINT}/admin/originali`, { headers: zaglavlja() })
            .then((r) => r.json())
            .then((r) => this.setState({
                meseci: r.meseci ? String(r.meseci) : '',
                sacuvano: r,
                pregled: r.pregled,
            }))
            .catch(() => this.setState({ greska: 'Podaci se ne mogu učitati.' }));
    }

    promeni = (v) => {
        this.setState({ meseci: v, potvrda: '', poruka: null, greska: null });
        clearTimeout(this.sat);
        this.sat = setTimeout(() => {
            fetch(`${API_ENDPOINT}/admin/originali/pregled?meseci=${encodeURIComponent(v || 0)}`, { headers: zaglavlja() })
                .then((r) => r.json()).then((pregled) => this.setState({ pregled })).catch(() => {});
        }, 300);
    };

    sacuvaj = () => {
        const meseci = parseInt(this.state.meseci, 10) || 0;
        this.setState({ cuva: true, poruka: null, greska: null });
        fetch(`${API_ENDPOINT}/admin/originali`, {
            method: 'POST', headers: zaglavlja(),
            body: JSON.stringify({ meseci, potvrda: this.state.potvrda }),
        }).then((r) => r.json().then((telo) => ({ ok: r.ok, telo })))
            .then(({ ok, telo }) => {
                if (!ok || telo.error) throw new Error(telo.error || 'Nije sačuvano.');
                this.setState({
                    cuva: false, sacuvano: telo, potvrda: '',
                    poruka: meseci
                        ? `Sačuvano. Originali stariji od ${meseci} mjeseci se brišu — prvi dio odmah, ostatak jednom dnevno.`
                        : 'Sačuvano. Originali se čuvaju zauvijek, ništa se ne briše.',
                });
            })
            .catch((e) => this.setState({ cuva: false, greska: e.message }));
    };

    render() {
        const l = this.props.lang;
        const { pregled, sacuvano } = this.state;
        const meseci = parseInt(this.state.meseci, 10) || 0;
        const isto = sacuvano && (sacuvano.meseci || 0) === meseci && (meseci === 0 || sacuvano.potvrda);
        const trebaPotvrda = meseci > 0 && !isto;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Originali'.translate(l)}
            >
                <div className="z-licence-admin z-originali">
                    <p className="z-prijava-strana__uvod">
                        Originali (puna rezolucija) zauzimaju najviše prostora. Ovdje birate koliko dugo se čuvaju na sajtu.
                        Starijim galerijama se original briše, a pregled sa žigom ostaje: galerija se i dalje vidi, ali kupac
                        umjesto „Dodaj u korpu" dobija poruku da vas pozove ili pošalje e-mail, pa mu fotografiju dostavljate iz
                        svoje arhive po uplati. Pojedinu galeriju možete zaštititi kvačicom „Uvijek čuvaj original" u njenoj izmjeni.
                    </p>

                    <div className="z-licence-admin__stavka">
                        <label className="z-polje">
                            <span className="z-polje__oznaka">Čuvaj originale posljednjih (mjeseci) — prazno ili 0 = zauvijek</span>
                            <input className="z-polje__unos" type="number" min="0" max="600" value={this.state.meseci}
                                   onChange={(e) => this.promeni(e.target.value)} />
                        </label>

                        {meseci > 0 && pregled ? (
                            <p className="z-originali__pregled">
                                Original se briše galerijama starijim od <b>{datum(pregled.starijeOd)}</b>:{' '}
                                <b>{br(pregled.galerija)}</b> galerija, <b>{br(pregled.fotografija)}</b> fotografija.
                                {pregled.zasticeno ? <> Zaštićeno kvačicom: {br(pregled.zasticeno)} galerija.</> : null}
                                {pregled.vecObrisano ? <> Već obrađeno ranije: {br(pregled.vecObrisano)} galerija.</> : null}
                            </p>
                        ) : (
                            <p className="z-originali__pregled">Ništa se ne briše — svi originali ostaju na sajtu.</p>
                        )}

                        {trebaPotvrda ? (
                            <label className="z-polje z-originali__potvrda">
                                <span className="z-polje__oznaka">
                                    Brisanje originala je NEPOVRATNO. Za potvrdu upišite <b>OBRIŠI</b>
                                </span>
                                <input className="z-polje__unos" value={this.state.potvrda}
                                       onChange={(e) => this.setState({ potvrda: e.target.value })} />
                            </label>
                        ) : null}

                        <div className="z-licence-admin__radnje">
                            <button type="button" className="z-dugme z-dugme--glavno"
                                    disabled={this.state.cuva || isto || (trebaPotvrda && this.state.potvrda.trim().toUpperCase() !== 'OBRIŠI')}
                                    onClick={this.sacuvaj}>
                                {this.state.cuva ? 'Čuvam…' : 'Sačuvaj'}
                            </button>
                        </div>

                        {this.state.poruka ? <p className="z-originali__poruka" role="status">{this.state.poruka}</p> : null}
                        {this.state.greska ? <p className="z-originali__greska" role="alert">{this.state.greska}</p> : null}
                        {sacuvano ? (
                            <p className="z-originali__stanje">
                                Sada: {sacuvano.meseci && sacuvano.potvrda
                                    ? `originali se čuvaju ${sacuvano.meseci} mjeseci (uključeno ${datum(sacuvano.potvrda)})`
                                    : 'originali se čuvaju zauvijek'}.
                            </p>
                        ) : null}
                    </div>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(OriginaliPage);
