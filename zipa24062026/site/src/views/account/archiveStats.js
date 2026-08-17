import React, { Component } from 'react';
import { Container, Row, Col } from 'reactstrap';
import { Bar } from 'react-chartjs-2';

import Page from '../../containers/page';
import { API_ENDPOINT } from '../../constants';

/**
 * Pregled arhive od početka rada do danas.
 *
 * Klijent je tražio uvid od postavljanja sajta do danas. Istorija poseta nije
 * stigla u bazi preuzetoj od dosadašnjeg izvođača, pa se ovde prikazuje ono
 * što jeste dostupno od prvog dana — rast same arhive po godinama.
 */
class ArchiveStats extends Component {
    constructor(props) {
        super(props);
        this.state = { godine: [], ukupno: {}, fotografi: [], ucitava: true, greska: null };
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        fetch(`${API_ENDPOINT}/admin/archive-stats`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        })
            .then((res) => {
                // Bez prijave odgovor je 401; bolje je to reći nego prikazati
                // praznu tabelu, jer prazno izgleda kao da podataka nema.
                if (res.status === 401 || res.status === 403) {
                    throw new Error('prijava');
                }
                if (!res.ok) throw new Error('server');
                return res.json();
            })
            .then((r) => this.setState({
                godine: r.godine || [],
                ukupno: r.ukupno || {},
                fotografi: r.fotografi || [],
                ucitava: false
            }))
            .catch((e) => this.setState({
                ucitava: false,
                greska: e.message === 'prijava'
                    ? 'Za ovaj pregled je potrebna prijava administratorskim nalogom.'
                    : 'Podaci trenutno nisu dostupni. Pokušajte ponovo za koji trenutak.'
            }));
    }

    broj(n) {
        return (n === undefined || n === null) ? '—' : Number(n).toLocaleString('sr-RS');
    }

    render() {
        const { godine, ukupno, fotografi, ucitava, greska } = this.state;

        const grafikon = {
            labels: godine.map((g) => g.godina),
            datasets: [
                {
                    label: 'Fotografija',
                    data: godine.map((g) => g.fotografija),
                    backgroundColor: '#3C59B9',
                    borderRadius: 4,
                }
            ]
        };

        const opcije = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            }
        };

        return (
            <div className="account-wrap arhiva-stat">
                <Container>
                    <Row>
                        <Col lg="12">
                            <h1>Arhiva od početka rada</h1>

                            {ucitava ? <p className="uvod">Učitavam…</p> : greska ? (
                                <div className="napomena upozorenje">{greska}</div>
                            ) : (
                                <>
                                    <p className="uvod">
                                        Prva zabeležena galerija je od <b>{ukupno.prva || '—'}</b>,
                                        poslednja od <b>{ukupno.poslednja || '—'}</b>.
                                    </p>

                                    <div className="zbir">
                                        <div className="stavka">
                                            <span className="broj">{this.broj(ukupno.galerija)}</span>
                                            <span className="opis">galerija</span>
                                        </div>
                                        <div className="stavka">
                                            <span className="broj">{this.broj(ukupno.fotografija)}</span>
                                            <span className="opis">fotografija</span>
                                        </div>
                                        <div className="stavka">
                                            <span className="broj">{this.broj(ukupno.fotografa)}</span>
                                            <span className="opis">fotografa</span>
                                        </div>
                                    </div>

                                    <div className="napomena">
                                        <b>O posetama:</b> evidencija poseta nije se nalazila u bazi
                                        preuzetoj od dosadašnjeg izvođača — stigle su galerije,
                                        korisnici, kategorije i klikovi na banere, ali ne i istorija
                                        poseta. Posete se beleže od preuzimanja sajta nadalje i
                                        dostupne su u <i>Statistici poseta</i>.
                                    </div>

                                    <h2>Po godinama</h2>
                                    <div className="grafikon">
                                        <Bar data={grafikon} options={opcije} />
                                    </div>

                                    <div className="tabela-okvir">
                                        <table className="tabela">
                                            <thead>
                                                <tr>
                                                    <th>Godina</th>
                                                    <th className="d">Galerija</th>
                                                    <th className="d">Fotografija</th>
                                                    <th className="d">Fotografa</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {godine.map((g) => (
                                                    <tr key={g.godina}>
                                                        <td>{g.godina}</td>
                                                        <td className="d">{this.broj(g.galerija)}</td>
                                                        <td className="d">{this.broj(g.fotografija)}</td>
                                                        <td className="d">{this.broj(g.fotografa)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <h2>Fotografi po broju fotografija</h2>
                                    <div className="tabela-okvir">
                                        <table className="tabela">
                                            <thead>
                                                <tr>
                                                    <th>Fotograf</th>
                                                    <th className="d">Galerija</th>
                                                    <th className="d">Fotografija</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {fotografi.map((f, i) => (
                                                    <tr key={i}>
                                                        <td>{f.ime}</td>
                                                        <td className="d">{this.broj(f.galerija)}</td>
                                                        <td className="d">{this.broj(f.fotografija)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default Page(ArchiveStats);
