import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Page from '../containers/page';
import moment from 'moment';

import { Container } from 'reactstrap';

/*
 * NAJAVA — /najave/:id
 *
 * Čita se kao vest: povratak na naslovnu, naslov, datum, pa tekst u čitljivoj
 * širini. Fotografije, ako ih ima, stižu unutar samog teksta iz
 * administracije, pa ih oblači `_stranice.scss`.
 *
 * Dovlačenje (`/announcements/get/:id`) i ruta su nepromenjeni.
 *
 * ZAŠTO SE `text` PARSIRA: u bazi ne stoji objekat po jezicima nego STRING
 * koji sadrži JSON — `"{\"ba\": \"<p>…</p>\"}"`. Zbog toga je
 * `Object.translate(data, 'text', lang)` vraćao ništa i telo najave se nikad
 * nije iscrtavalo. Ovde se string prvo raspakuje; ako nije JSON, uzima se kao
 * običan tekst. Zapis u bazi nije diran.
 */

const teloNajave = (data, l) => {
    const sirovo = data && data.text;
    if (!sirovo) return '';

    // Već je objekat po jezicima — normalan slučaj za ostatak sajta.
    if (typeof sirovo === 'object') {
        return Object.translate(data, 'text', l) || '';
    }

    if (typeof sirovo === 'string') {
        const s = sirovo.trim();
        if (s.charAt(0) === '{') {
            try {
                const raspakovano = JSON.parse(s);
                return raspakovano[l] || raspakovano.ba || '';
            } catch (e) {
                return sirovo;   // nije JSON — piše se kako stoji
            }
        }
        return sirovo;
    }

    return '';
};

class AnnoucmentPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            data: {
                items: []
            }
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

    render() {
        const l = this.props.lang;
        const najava = this.state.data || {};

        const naslov = Object.translate(najava, 'content', l);
        const telo = teloNajave(najava, l);

        // `from` je početak najave; `published` je trenutak objave. Prvi je
        // tačniji podatak za čitaoca, drugi je mreža za pad.
        const datum = najava.from || najava.published;

        return (
            <div className="contact-wrap z-najava">

                <header className="z-najava__vrh">
                    <Container>
                        <p className="z-najava__putanja">
                            <Link to="/">{'Početna'.translate(l)}</Link>
                        </p>

                        <p className="z-najava__oznaka">{'Najava'.translate(l)}</p>
                        <h1 className="z-najava__naslov">{naslov}</h1>

                        {datum ? (
                            <p className="z-najava__datum">
                                <time dateTime={moment.unix(datum).format('YYYY-MM-DD')}>
                                    {moment.unix(datum).format('DD.MM.YYYY.')}
                                </time>
                                {najava.to ? (
                                    <span className="z-najava__trajanje">
                                        {' — '}
                                        {moment.unix(najava.to).format('DD.MM.YYYY.')}
                                    </span>
                                ) : null}
                            </p>
                        ) : null}
                    </Container>
                </header>

                <Container>
                    {telo ? (
                        <div
                            className="z-strana__telo z-najava__telo"
                            dangerouslySetInnerHTML={{ __html: telo }}
                        />
                    ) : (
                        <p className="z-najava__prazno">
                            {'Ova najava još nema teksta.'.translate(l)}
                        </p>
                    )}

                    <p className="z-najava__nazad">
                        <Link className="z-najava__radnja" to="/galerije">
                            {'Pretraži arhivu'.translate(l)}
                        </Link>
                    </p>
                </Container>
            </div>
        );
    }
}

export default Page(AnnoucmentPage);
