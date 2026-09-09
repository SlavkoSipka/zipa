import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import Page from '../../containers/page';
import AdminOkvir from '../../components/adminOkvir';
import { Obavestenja, napraviPoruke } from '../../components/admin/Stanja';

import { API_ENDPOINT } from '../../constants';

/*
 * PREGLED NEWSLETTERA PRIJE SLANJA.
 *
 * Do sada je stavka „Pregled newslettera" u meniju vodila na stranu koja crta
 * grafikon posjeta — pregleda same poruke nije bilo nigdje. Slalo se naslijepo.
 *
 * Ovdje se prikazuje BAŠ ONO što primalac dobija: HTML sastavlja API
 * (`/newsletter/preview/:id`), istom funkcijom kojom se sastavlja i pri
 * slanju. Da se ne mogu razići, nema drugog puta.
 *
 * Poruka se crta u `iframe`-u sa `srcDoc`: predložak nosi svoje `<style>`,
 * `<table>` raspored i pisma iz e-pošte. Ubačen u stranu administracije,
 * mijenjao bi joj izgled — a i sam bi se pokvario od njenih pravila.
 */
class NewsletterPreviewPage extends Component {
    constructor(props) {
        super(props);

        this.state = {
            ...props.initialData,
            ucitavanje: true,
            html: null,
            naslov: '',
            brojGalerija: 0,
            sirina: 'desktop',
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

        this.dovuci();
    }

    dovuci = () => {
        fetch(`${API_ENDPOINT}/newsletter/preview/${this.props[0].match.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        }).then((res) => res.json().then((telo) => ({ ok: res.ok, telo })))
            .then(({ ok, telo }) => {
                if (!ok || !telo || telo.error) {
                    this.setState({ ucitavanje: false });
                    this.poruke.dodaj('greska',
                        (telo && telo.error) ? telo.error : 'Pregled nije moguće učitati.');
                    return;
                }
                this.setState({
                    html: telo.html,
                    naslov: telo.naslov,
                    brojGalerija: telo.brojGalerija,
                    ucitavanje: false,
                });
            })
            .catch(() => {
                this.setState({ ucitavanje: false });
                this.poruke.dodaj('greska', 'Pregled nije moguće učitati.');
            });
    };

    posaljiProbnu = () => {
        fetch(`${API_ENDPOINT}/newsletter/send/test/${this.props[0].match.params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        }).then((res) => {
            this.poruke.dodaj(res.ok ? 'uspeh' : 'greska', res.ok
                ? 'Probna poruka je poslana.'
                : 'Probna poruka nije poslana.');
        }).catch(() => this.poruke.dodaj('greska', 'Probna poruka nije poslana.'));
    };

    render() {
        const l = this.props.lang;
        const id = this.props[0].match.params.id;

        return (
            <AdminOkvir
                lang={l}
                uData={this.props.uData}
                settings={this.props.settings}
                putanja={this.props[0] && this.props[0].location ? this.props[0].location.pathname : ''}
                signOut={this.props.signOut}
                naslov={'Pregled newslettera'.translate(l)}
                radnja={
                    <Link to="/account/newsletter" className="z-adminokvir__radnja z-adminokvir__radnja--tiha">
                        {'Nazad na spisak'.translate(l)}
                    </Link>
                }
            >
                <Obavestenja
                    lang={l}
                    poruke={this.state.poruke}
                    naZatvaranje={(pid) => this.poruke.skloni(pid)}
                />

                <div className="z-pregled-poruke">
                    <div className="z-pregled-poruke__traka">
                        <div className="z-pregled-poruke__podaci">
                            <span className="z-pregled-poruke__naslov">{this.state.naslov || '—'}</span>
                            <span className="z-pregled-poruke__uz">
                                {this.state.brojGalerija
                                    ? `${this.state.brojGalerija} ${'galerija u poruci'.translate(l)}`
                                    : 'Bez galerija'.translate(l)}
                            </span>
                        </div>

                        <div className="z-pregled-poruke__radnje">
                            {/* Ista poruka izgleda drukčije na telefonu — a
                                većina je i čita tamo. */}
                            <div className="z-pregled-poruke__mere" role="group"
                                 aria-label={'Širina pregleda'.translate(l)}>
                                <button type="button"
                                        aria-pressed={this.state.sirina === 'desktop'}
                                        className={this.state.sirina === 'desktop' ? 'aktivan' : ''}
                                        onClick={() => this.setState({ sirina: 'desktop' })}>
                                    {'Računar'.translate(l)}
                                </button>
                                <button type="button"
                                        aria-pressed={this.state.sirina === 'telefon'}
                                        className={this.state.sirina === 'telefon' ? 'aktivan' : ''}
                                        onClick={() => this.setState({ sirina: 'telefon' })}>
                                    {'Telefon'.translate(l)}
                                </button>
                            </div>

                            <button type="button" className="z-dugme" onClick={this.posaljiProbnu}>
                                {'Pošalji probnu'.translate(l)}
                            </button>

                            <Link to={`/account/newsletter/${id}`} className="z-dugme z-dugme--glavno">
                                {'Izmijeni'.translate(l)}
                            </Link>
                        </div>
                    </div>

                    <p className="z-pregled-poruke__uputa">
                        {'Ovo je poruka onakva kakvu dobija primalac, zajedno sa vezom za odjavu na dnu.'.translate(l)}
                    </p>

                    <div className={'z-pregled-poruke__okvir z-pregled-poruke__okvir--' + this.state.sirina}>
                        {this.state.ucitavanje ? (
                            <span className="z-kostur z-pregled-poruke__kostur" />
                        ) : this.state.html ? (
                            <iframe
                                title={'Pregled newslettera'.translate(l)}
                                className="z-pregled-poruke__ram"
                                srcDoc={this.state.html}
                            />
                        ) : (
                            <p className="z-pregled-poruke__prazno">
                                {'Poruku nije moguće prikazati.'.translate(l)}
                            </p>
                        )}
                    </div>
                </div>
            </AdminOkvir>
        );
    }
}

export default Page(NewsletterPreviewPage);
