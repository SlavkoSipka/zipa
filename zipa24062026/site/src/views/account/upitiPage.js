import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';

import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

/*
 * UPITI ZA LICENCE (2026-10-10).
 *
 * Kupac na prozoru fotografije izabere licencu (Televizija, Štampa…) i
 * ostavi ime, firmu, telefon i e-mail. Ovde se upiti vide, najnoviji prvi;
 * nepročitani su istaknuti i broje se u meniju administracije.
 */
const zaglavlja = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
});

const vreme = (t) => {
    if (!t) return '';
    const d = new Date(t * 1000);
    const dv = (n) => String(n).padStart(2, '0');
    return `${dv(d.getDate())}.${dv(d.getMonth() + 1)}.${d.getFullYear()}. ${dv(d.getHours())}:${dv(d.getMinutes())}`;
};

class UpitiPage extends Component {
    constructor(props) {
        super(props);
        this.state = { ...props.initialData, upiti: [], ucitavanje: true, poruke: [] };
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
        fetch(`${API_ENDPOINT}/upiti/admin/all`, { headers: zaglavlja() })
            .then((res) => res.json())
            .then((rez) => this.setState({ upiti: Array.isArray(rez) ? rez : [], ucitavanje: false }))
            .catch(() => this.setState({ ucitavanje: false }));
    };

    oznaci = (u, procitan) => {
        fetch(`${API_ENDPOINT}/upiti/procitan/${u._id}`, {
            method: 'POST', headers: zaglavlja(), body: JSON.stringify({ procitan }),
        }).then(() => {
            this.ucitaj();
            // Broj u meniju se osvežava.
            if (typeof window !== 'undefined') window.dispatchEvent(new Event('z-upiti-promena'));
        });
    };

    obrisi = (u) => {
        const l = this.props.lang;
        if (!window.confirm('Obrisati ovaj upit?'.translate(l))) return;
        fetch(`${API_ENDPOINT}/upiti/delete/${u._id}`, { method: 'DELETE', headers: zaglavlja() })
            .then(() => {
                this.poruke.dodaj('uspeh', 'Upit je obrisan.'.translate(l));
                this.ucitaj();
                if (typeof window !== 'undefined') window.dispatchEvent(new Event('z-upiti-promena'));
            });
    };

    render() {
        const l = this.props.lang;
        const { upiti } = this.state;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Upiti za licence'.translate(l)}
            >
                <Obavestenja lang={l} poruke={this.state.poruke} naZatvaranje={(id) => this.poruke.skloni(id)} />

                <div className="z-upiti">
                    {this.state.ucitavanje ? <span className="z-kostur z-kostur--red" /> : null}

                    {!this.state.ucitavanje && !upiti.length ? (
                        <p className="z-prijava-strana__prazno">{'Još nema nijednog upita.'.translate(l)}</p>
                    ) : null}

                    {upiti.map((u) => (
                        <article key={u._id} className={'z-upiti__stavka' + (u.procitan ? '' : ' z-upiti__stavka--novo')}>
                            {u.slika ? (
                                <img className="z-upiti__slika" src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(u.slika)}`} alt="" />
                            ) : null}

                            <div className="z-upiti__telo">
                                <p className="z-upiti__vrh">
                                    {!u.procitan ? <span className="z-upiti__oznaka">{'Novo'.translate(l)}</span> : null}
                                    <strong>{u.licenca || 'Licenca'.translate(l)}</strong>
                                    {u.cena !== null && u.cena !== undefined ? <span> · {Number(u.cena).formatPrice(2)} KM</span> : <span> · {'na upit'.translate(l)}</span>}
                                    <span className="z-upiti__vreme">{vreme(u.published)}</span>
                                </p>

                                <p className="z-upiti__kupac">
                                    <strong>{u.ime}</strong> · {u.firma}<br />
                                    <a href={`tel:${u.telefon}`}>{u.telefon}</a> · <a href={`mailto:${u.email}`}>{u.email}</a>
                                </p>

                                {u.galleryId ? (
                                    <p className="z-upiti__galerija">
                                        {'Galerija'.translate(l)}:{' '}
                                        <Link to={`/galerija/${u.galerijaAlias || 'galerija'}/${u.galleryId}?photo=${u.photoId || 0}`}>
                                            {u.galerija}
                                        </Link>
                                        {u.photoId !== null && u.photoId !== undefined ? ` — ${'fotografija'.translate(l)} ${u.photoId + 1}` : ''}
                                    </p>
                                ) : null}

                                {u.poruka ? <p className="z-upiti__poruka">{u.poruka}</p> : null}

                                <div className="z-upiti__radnje">
                                    <button type="button" className="z-dugme z-dugme--tiho" onClick={() => this.oznaci(u, !u.procitan)}>
                                        {(u.procitan ? 'Označi kao novo' : 'Označi kao pročitano').translate(l)}
                                    </button>
                                    <button type="button" className="z-dugme z-dugme--tiho" onClick={() => this.obrisi(u)}>
                                        {'Obriši'.translate(l)}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(UpitiPage);
