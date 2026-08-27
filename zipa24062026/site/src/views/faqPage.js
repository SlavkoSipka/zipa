import React, { Component } from 'react';
import { Link } from 'react-router-dom'
import Page from '../containers/page';

import { Container } from 'reactstrap';
import { API_ENDPOINT } from '../constants';

/*
 * TEMA POMOĆI — /faq/:alias
 *
 * Sa strane spisak pitanja iz teme (sadržaj), u sredini pitanja u harmonici,
 * u dnu srodne teme.
 *
 * Poziv `/faq/:alias` je netaknut. Spisak ostalih tema dolazi istim javnim
 * pozivom `/faqCategories/all` koji koristi `/help` — bez njega nema srodnih
 * tema u dnu.
 */

class FaqPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            data: {
                items: []
            },
            teme: [],
            otvoreno: 0,
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
        fetch(`${API_ENDPOINT}/faq/${this.props[0].match.params.alias}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                data: result,
                otvoreno: 0,
            })
        })

        fetch(`${API_ENDPOINT}/faqCategories/all`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                teme: Array.isArray(result) ? result : []
            })
        }).catch(() => { })
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
        const tema = this.state.data || { items: [] };
        const pitanja = tema.items || [];
        const alias = this.props[0].match.params.alias;

        const srodne = (this.state.teme || []).filter(
            (t) => Object.translate(t, 'alias', 'ba') !== alias
        );

        return (
            <div className="contact-wrap z-tema">

                <header className="z-tema__vrh">
                    <Container>
                        <p className="z-tema__putanja">
                            <Link to="/help">{'Pomoć'.translate(l)}</Link>
                        </p>
                        <h1 className="z-tema__naslov">
                            {Object.translate(tema, 'name', l)}
                        </h1>
                    </Container>
                </header>

                <Container>
                    <div className="z-tema__raspored">

                        {/* ── sadržaj sa strane ──────────────────────── */}
                        {pitanja.length > 1 ? (
                            <nav className="z-tema__sadrzaj" aria-label={'Pitanja u ovoj temi'.translate(l)}>
                                <p className="z-tema__sadrzaj-naslov">{'U ovoj temi'.translate(l)}</p>
                                <ol className="z-tema__spisak">
                                    {pitanja.map((p, idx) => (
                                        <li key={p._id || idx}>
                                            <button
                                                type="button"
                                                className={'z-tema__stavka' + (this.state.otvoreno === idx ? ' z-tema__stavka--ovde' : '')}
                                                onClick={() => this.setState({ otvoreno: idx })}
                                            >
                                                {Object.translate(p, 'name', l)}
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            </nav>
                        ) : null}

                        {/* ── pitanja ────────────────────────────────── */}
                        <main className="z-tema__telo">
                            {pitanja.length ? (
                                <div className="z-tema__harmonika">
                                    {pitanja.map((p, idx) => {
                                        const otvoreno = this.state.otvoreno === idx;
                                        return (
                                            <div className="z-tema__pitanje" key={p._id || idx}>
                                                <h2 className="z-tema__pitanje-naslov">
                                                    <button
                                                        type="button"
                                                        className="z-tema__prekidac"
                                                        aria-expanded={otvoreno}
                                                        onClick={() => this.setState({ otvoreno: otvoreno ? null : idx })}
                                                    >
                                                        <span>{Object.translate(p, 'name', l)}</span>
                                                        <span className="z-tema__znak" aria-hidden="true">
                                                            {otvoreno ? '–' : '+'}
                                                        </span>
                                                    </button>
                                                </h2>

                                                {otvoreno ? (
                                                    <div
                                                        className="z-tema__odgovor"
                                                        dangerouslySetInnerHTML={{
                                                            __html: String(Object.translate(p, 'content', l) || '').replace(/\n/g, '<br/>')
                                                        }}
                                                    />
                                                ) : null}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="z-tema__prazno">
                                    {'U ovoj temi još nema pitanja.'.translate(l)}
                                </p>
                            )}
                        </main>
                    </div>

                    {/* ── srodne teme ────────────────────────────────── */}
                    {srodne.length ? (
                        <section className="z-tema__srodne">
                            <h2 className="z-tema__srodne-naslov">{'Srodne teme'.translate(l)}</h2>
                            <div className="z-tema__srodne-spisak">
                                {srodne.map((t, idx) => (
                                    <Link
                                        className="z-tema__srodna"
                                        key={t._id || idx}
                                        to={`/faq/${Object.translate(t, 'alias', 'ba')}`}
                                    >
                                        {Object.translate(t, 'name', l)}
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}
                </Container>
            </div>
        );
    }
}

export default Page(FaqPage);
