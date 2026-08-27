import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Page from '../containers/page';

import { Container } from 'reactstrap';
import { PHOTOS_ENDPOINT } from '../constants';

/*
 * STRANA KOJE NEMA — /404
 *
 * Fotografija iz arhive kao podloga, kratka poruka, pretraga i veze na
 * glavne delove sajta. Ako je posetilac promašio adresu, pretraga je jedina
 * stvar koja mu zaista pomaže — zato stoji u sredini, a ne veza „nazad na
 * naslovnu" kao ranije.
 *
 * Fotografija dolazi iz NAJNOVIJE GALERIJE, koju `App.js` već dovlači za
 * traku najave i naslovni blok. Bez novog poziva; ako je nema, ostaje tiha
 * podloga i strana i dalje radi.
 *
 * Tekst NIKAD ne ide preko fotografije (stalno pravilo projekta) — preko nje
 * stoji tamni preliv iste boje kao traka, pa je poruka na traci, a ne na
 * kadru.
 */

const DELOVI = [
    { putanja: '/galerije',  naziv: 'Galerije' },
    { putanja: '/video',     naziv: 'Video' },
    { putanja: '/help',      naziv: 'Pomoć' },
    { putanja: '/contact',   naziv: 'Kontakt' },
];

class ErrorPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            data: {
                items: []
            },
            pojam: '',
        };
    }

    init() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, null, this.props.lang).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }
    }

    componentDidMount() {
        this.init()
    }

    componentDidUpdate(prevProps) {
        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
        }
    }

    trazi = (e) => {
        if (e) e.preventDefault();
        const pojam = this.state.pojam.trim();
        this.props[0].history.push(
            pojam ? `/galerije?search=${encodeURIComponent(pojam)}` : '/galerije'
        );
    };

    render() {
        const l = this.props.lang;

        const galerija = this.props.najava;
        const slika = galerija && galerija.photos && galerija.photos[0]
            ? `${PHOTOS_ENDPOINT}/photos/700x/${galerija.photos[0].image}`
            : null;

        return (
            <div className="contact-wrap z-nemastrane">
                <div className="z-nemastrane__kadar">
                    {slika ? (
                        <img
                            className="z-nemastrane__slika"
                            src={slika}
                            alt=""
                            loading="lazy"
                            decoding="async"
                        />
                    ) : null}

                    <Container>
                        <div className="z-nemastrane__sadrzaj">
                            <p className="z-nemastrane__broj">404</p>

                            <h1 className="z-nemastrane__naslov">
                                {'Ove strane nema'.translate(l)}
                            </h1>
                            <p className="z-nemastrane__uvod">
                                {'Adresa je pogrešna ili je strana uklonjena. Ako tražite određenu fotografiju, pretraga arhive je najbrži put.'.translate(l)}
                            </p>

                            <form className="z-nemastrane__pretraga" onSubmit={this.trazi}>
                                <input
                                    type="search"
                                    className="z-nemastrane__polje"
                                    placeholder={'Pretražite arhivu…'.translate(l)}
                                    aria-label={'Pretraga arhive'.translate(l)}
                                    value={this.state.pojam}
                                    onChange={(e) => this.setState({ pojam: e.target.value })}
                                />
                                <button type="submit" className="z-nemastrane__dugme">
                                    {'Pretraži'.translate(l)}
                                </button>
                            </form>

                            <nav className="z-nemastrane__veze" aria-label={'Glavni dijelovi sajta'.translate(l)}>
                                {DELOVI.map((d) => (
                                    <Link className="z-nemastrane__veza" key={d.putanja} to={d.putanja}>
                                        {d.naziv.translate(l)}
                                    </Link>
                                ))}
                            </nav>
                        </div>
                    </Container>
                </div>

                {/* Potpis fotografije — autor se navodi i kad je fotografija
                    samo podloga. */}
                {slika ? (
                    <Container>
                        <p className="z-nemastrane__potpis">
                            {'Fotografija:'.translate(l)}{' '}
                            {Object.translate(galerija, 'name', l)}
                            {galerija.user ? ` · ${galerija.user}` : null}
                        </p>
                    </Container>
                ) : null}
            </div>
        );
    }
}

export default Page(ErrorPage);
