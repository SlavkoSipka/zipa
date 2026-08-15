import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';

import Page from '../containers/page';

/**
 * Stranica sa snimcima.
 *
 * Snimci se ne postavljaju na naš server nego se povlače sa YouTube kanala
 * agencije — u administraciji se unosi samo adresa snimka i naslov, a sličicu
 * sistem sam izvlači iz adrese.
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
        const lang = this.props.lang;
        const snimci = this.state.videos || [];

        return (
            <div className="video-strana">
                <Container>
                    <Row>
                        <Col lg="12">
                            <h1>{'Video'.translate(lang)}</h1>
                            <p className="uvod">
                                {'Snimci sa kanala agencije.'.translate(lang)}
                            </p>
                        </Col>
                    </Row>

                    {snimci.length ? (
                        <div className="mreza-video">
                            {snimci.map((v, i) => {
                                const naslov = Object.translate(v, 'title', lang) || '';
                                return (
                                    <a key={i} href={v.link} target="_blank" rel="noopener noreferrer" className="plocica">
                                        <div className="slika">
                                            {v.thumbnail ? <img src={v.thumbnail} alt={naslov} loading="lazy" /> : null}
                                            <span className="igraj">&#9654;</span>
                                        </div>
                                        <div className="telo"><h4>{naslov}</h4></div>
                                    </a>
                                );
                            })}
                        </div>
                    ) : (
                        <Row>
                            <Col lg="12">
                                <p className="prazno">
                                    {'Trenutno nema objavljenih snimaka.'.translate(lang)}
                                </p>
                            </Col>
                        </Row>
                    )}
                </Container>
            </div>
        );
    }
}

// Kroz `Page` stranica dobija zaglavlje, podnožje i podešavanja sajta —
// bez toga se prikazuje sama, bez menija i podnožja.
export default Page(VideoPage);
