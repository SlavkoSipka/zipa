import React, { Component } from 'react';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

import Loader from '../loader';
import { linija } from '../bojeGrafikona';

/*
 * ADMINISTRATORSKI PREGLED
 *
 * Izdvojen iz `profilePage.js`, gde je stajao izmešan sa korisničkim
 * profilom. Prikazuje se SAMO administratoru — provera uloge ostaje u
 * `profilePage.js` i koristi isti mehanizam koji je i do sada bio tamo
 * (`uData.userRole === 'admin'`). Ova komponenta ne proverava ništa sama;
 * ako je iscrtana, pretpostavlja da je pravo već provereno.
 *
 * Podatke prima gotove — ne dovlači ništa.
 */
class AdminPregled extends Component {
    render() {
        const l = this.props.lang;
        const s = this.props.statistika || {};
        const ucitava = this.props.ucitava;

        // Crtica umesto nule dok podaci ne stignu — inače deluje kao da ih nema.
        const broj = (v, sufiks = '') => {
            if (ucitava || v === undefined || v === null) return '—';
            return `${v}${sufiks}`;
        };

        const posete = s.visitsPerDay || [];
        const imaGrafikon = !ucitava && posete.length > 0;

        const kartice = [
            { naziv: 'Promet danas',       vrednost: broj(s.todayEarnings, ' KM') },
            { naziv: 'Mjesečni promet',    vrednost: broj(s.currentMonthEarnings, ' KM') },
            { naziv: 'Promet juče',        vrednost: broj(s.yesterdayEarnings, ' KM') },
            { naziv: 'Prethodni mjesec',   vrednost: broj(s.prevMonthEarnings, ' KM') },
            { naziv: 'Ukupno preuzeto',    vrednost: broj(s.totalDownloads) },
            { naziv: 'Preuzeto danas',     vrednost: broj(s.todayDownloads) },
            { naziv: 'Fotografija u arhivi', vrednost: broj(s.photosCount) },
            { naziv: 'Fotografa',          vrednost: broj(s.photographersCount) },
        ];

        return (
            <section className="z-admin">
                <h2 className="z-admin__naslov">{'Pregled servisa'.translate(l)}</h2>

                {/* ── kartice sa brojevima ───────────────────────────── */}
                <div className="z-admin__kartice">
                    {kartice.map((k, idx) => (
                        <div className="z-admin__kartica" key={idx}>
                            <span className="z-admin__kartica-naziv">
                                {k.naziv.translate(l)}
                            </span>
                            <span className="z-admin__kartica-broj">{k.vrednost}</span>
                        </div>
                    ))}
                </div>

                {/* ── kretanje kroz vreme ────────────────────────────── */}
                <div className="z-admin__grafikon">
                    <h3 className="z-admin__pod-naslov">
                        {'Posjete po danima'.translate(l)}
                    </h3>

                    {ucitava ? (
                        <div className="z-admin__ucitavanje"><Loader /></div>
                    ) : imaGrafikon ? (
                        <Line
                            data={{
                                labels: posete.map((p) => moment.unix(p.timestamp).format('DD MMM')),
                                // Boje dolaze iz tokena, pa grafikon prati temu.
                                datasets: [linija('POSJETA'.translate(l), posete.map((p) => p.count))],
                            }}
                            options={{ maintainAspectRatio: false }}
                        />
                    ) : (
                        <p className="z-admin__prazno">
                            {'Za izabrani period nema podataka o posjetama.'.translate(l)}
                        </p>
                    )}
                </div>

                {/* ── poslednje transakcije ──────────────────────────── */}
                {s.lastTransactions && s.lastTransactions.length ? (
                    <div className="z-admin__transakcije">
                        <h3 className="z-admin__pod-naslov">
                            {'Poslednje transakcije'.translate(l)}
                        </h3>
                        <ul className="z-admin__spisak">
                            {s.lastTransactions.map((t, idx) => (
                                <li className="z-admin__transakcija" key={idx}>
                                    <span className="z-admin__transakcija-ko">
                                        {t.user ? t.user.name : '—'}
                                    </span>
                                    <span className="z-admin__transakcija-kada">
                                        {t.timestamp
                                            ? moment.unix(t.timestamp).format('DD.MM.YYYY.')
                                            : null}
                                    </span>
                                    <span className="z-admin__transakcija-iznos">
                                        {t.total !== undefined ? `${t.total} KM` : null}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : null}
            </section>
        );
    }
}

export default AdminPregled;
