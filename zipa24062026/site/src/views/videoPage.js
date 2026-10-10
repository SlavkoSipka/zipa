import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Container } from 'reactstrap';

import Page from '../containers/page';
import { YouTubePlejer } from '../components/youtube';

const datum = (t) => {
    const d = new Date(t * 1000);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}.`;
};

/*
 * VIDEO — /video
 *
 * Snimci se ne postavljaju na naš server nego se povlače sa YouTube kanala
 * agencije: u administraciji se unosi adresa i naslov, a sličicu sistem sam
 * izvlači iz adrese (`slicicaSaYouTube` u `api/admin/admin.js`).
 *
 * Dovlačenje (`/videos/all`) i ruta su nepromenjeni.
 *
 * DUŽINA TRAJANJA: zapis snimka u bazi ima `title`, `link`, `thumbnail`,
 * `position` i `isActive` — trajanja NEMA. Iscrtava se samo ako polje
 * `duration` jednog dana bude uneto; ne izmišlja se broj.
 *
 * Strana je danas prazna (u bazi nema nijednog snimka), pa je prazno stanje
 * glavni prikaz, a ne rub slučaj.
 */
class VideoPage extends Component {
    constructor(props) {
        super(props);
        this.state = { videos: [], ...props.initialData };
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match).then((data) => {
                this.setState({ ...data }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                });
            });
        }
    }

    render() {
        const l = this.props.lang;
        const snimci = this.state.videos || [];

        return (
            <div className="video-strana z-video">

                <header className="z-video__vrh">
                    <Container>
                        <h1 className="z-video__naslov">{'Video'.translate(l)}</h1>
                        <p className="z-video__uvod">
                            {'Snimci sa kanala agencije ZIPA PHOTO.'.translate(l)}
                        </p>
                    </Container>
                </header>

                <Container>
                    {snimci.length ? (
                        /* Tri snimka u redu, široko. Naslov, grad i datum i opis
                           stoje IZNAD snimka; plejer se učitava tek na klik
                           (`components/youtube.js`). — 2026-10-10 */
                        <div className="z-video__mreza">
                            {snimci.map((v, i) => {
                                const naslov = Object.translate(v, 'title', l) || '';
                                const opis = v.opis ? Object.translate(v, 'opis', l) : '';
                                return (
                                    <article key={v._id || i} className="z-video__snimak">
                                        <div className="z-video__tekst">
                                            {naslov ? <h2 className="z-video__ime">{naslov}</h2> : null}
                                            {v.grad || v.datum ? (
                                                <p className="z-video__podaci">
                                                    {v.grad ? <span>{v.grad}</span> : null}
                                                    {v.grad && v.datum ? ' · ' : null}
                                                    {v.datum ? <span>{datum(v.datum)}</span> : null}
                                                </p>
                                            ) : null}
                                            {opis ? <p className="z-video__opis">{opis}</p> : null}
                                        </div>
                                        <YouTubePlejer link={v.link} slicica={v.thumbnail} naslov={naslov} lang={l} />
                                    </article>
                                );
                            })}
                        </div>
                    ) : (
                        /* ── prazno stanje ─────────────────────────────── */
                        <div className="z-video__prazno">
                            <span className="z-video__prazno-znak" aria-hidden="true" />

                            <h2 className="z-video__prazno-naslov">
                                {'Snimci tek stižu'.translate(l)}
                            </h2>
                            <p className="z-video__prazno-opis">
                                {'Ovdje će stajati snimci sa terena — konferencije, utakmice, dešavanja u gradu. Do tada, arhiva fotografija je otvorena.'.translate(l)}
                            </p>

                            <div className="z-video__prazno-radnje">
                                <Link className="z-video__radnja z-video__radnja--glavna" to="/galerije">
                                    {'Pretraži arhivu'.translate(l)}
                                </Link>
                                <Link className="z-video__radnja" to="/contact">
                                    {'Naručite snimanje'.translate(l)}
                                </Link>
                            </div>
                        </div>
                    )}
                </Container>
            </div>
        );
    }
}

// Kroz `Page` stranica dobija zaglavlje, podnožje i podešavanja sajta.
export default Page(VideoPage);
