import React, { Component } from 'react';

/*
 * TABELA — zajednički oblik za spiskove u administraciji
 *
 * Koristi je oko 25 ekrana. Nosi sve što je do sada svaki ekran pisao iznova:
 * zaglavlje, sortiranje, straničenje, prazno stanje, stanje učitavanja i
 * prelazak u kartice na uskom ekranu.
 *
 * KAKO SE KORISTI
 *
 *     import Tabela from '../../components/admin/Tabela';
 *
 *     <Tabela
 *         lang={this.props.lang}
 *         kolone={[
 *             { kljuc: 'naslov', naziv: 'Naslov', sortiranje: true },
 *             { kljuc: 'status', naziv: 'Status' },
 *             { kljuc: 'broj',   naziv: 'Fotografija', broj: true },
 *         ]}
 *         redovi={this.state.items}
 *         kljucReda={(r) => r._id}
 *         celija={(r, kolona) => …}          // šta ide u ćeliju
 *         radnje={(r) => <>…dugmad…</>}      // desna kolona
 *
 *         ucitavanje={this.state.ucitavanje}
 *         prazno={{ naslov: 'Nema newslettera', tekst: '…', radnja: <Link…/> }}
 *
 *         sort={this.state.sort}                       // { kljuc, smer }
 *         naSort={(kljuc, smer) => …}
 *
 *         strana={this.state.strana}
 *         ukupnoStrana={this.state.total}
 *         ukupnoStavki={this.state.totalItems}
 *         naStranu={(n) => …}
 *     />
 *
 * Sve osim `kolone`, `redovi` i `celija` je neobavezno. Tabela NE dovlači
 * podatke i ne sortira sama — samo javlja `naSort` i `naStranu`, a ekran
 * odlučuje šta će sa tim. Tako ostaje upotrebljiva i kad se sortira na
 * serveru i kad se sortira u pregledaču.
 */

const SMER = { RASTUCE: 'rastuce', OPADAJUCE: 'opadajuce' };

class Tabela extends Component {
    naslovKolone(k) {
        const l = this.props.lang;
        const sort = this.props.sort || {};
        const naziv = (k.naziv || '').translate(l);

        if (!k.sortiranje || !this.props.naSort) return naziv;

        const ovde = sort.kljuc === k.kljuc;
        const sledeci = ovde && sort.smer === SMER.RASTUCE ? SMER.OPADAJUCE : SMER.RASTUCE;

        return (
            <button
                type="button"
                className="z-tabela__sort"
                onClick={() => this.props.naSort(k.kljuc, sledeci)}
                aria-label={naziv + ' — ' + 'sortiraj'.translate(l)}
            >
                {naziv}
                <span
                    className={
                        'z-tabela__strelica' +
                        (ovde ? (sort.smer === SMER.RASTUCE ? ' z-tabela__strelica--gore' : ' z-tabela__strelica--dole') : '')
                    }
                    aria-hidden="true"
                />
            </button>
        );
    }

    /* Kostur — koliko redova, toliko sivih traka. Ne vrteška: vrteška ne
       govori koliko se čeka, a kostur bar drži oblik strane mirnim. */
    kostur() {
        const kolone = this.props.kolone || [];
        const koliko = this.props.kosturRedova || 5;
        const redovi = [];

        for (let i = 0; i < koliko; i++) {
            redovi.push(
                <tr key={'kostur' + i}>
                    {kolone.map((k) => (
                        <td key={k.kljuc}>
                            <span className="z-kostur z-kostur--red" />
                        </td>
                    ))}
                    {this.props.radnje ? <td className="z-tabela__radnje" /> : null}
                </tr>
            );
        }
        return redovi;
    }

    render() {
        const l = this.props.lang;
        const kolone = this.props.kolone || [];
        const redovi = this.props.redovi || [];
        const prazno = this.props.prazno || {};

        /*
         * Prazan spisak dobija poruku i radnju — nikad broj `0`.
         * Zatečeni ekrani su pisali `items.length && items.map(...)`, što u
         * Reactu ispiše `0` kad je niz prazan.
         */
        if (!this.props.ucitavanje && !redovi.length) {
            return (
                <div className="z-prazno">
                    <span className="z-prazno__znak" aria-hidden="true">{prazno.znak || '—'}</span>
                    <h2 className="z-prazno__naslov">
                        {(prazno.naslov || 'Nema zapisa').translate(l)}
                    </h2>
                    {prazno.tekst ? (
                        <p className="z-prazno__tekst">{prazno.tekst.translate(l)}</p>
                    ) : null}
                    {prazno.radnja ? (
                        <div className="z-prazno__radnje">{prazno.radnja}</div>
                    ) : null}
                </div>
            );
        }

        const imaStranicenje = this.props.naStranu && this.props.ukupnoStrana > 1;

        return (
            <div className="z-tabela">
                <div className="z-tabela__okvir">
                    <table>
                        <thead>
                            <tr>
                                {kolone.map((k) => (
                                    <th key={k.kljuc} className={k.broj ? 'z-tabela__broj' : null}>
                                        {this.naslovKolone(k)}
                                    </th>
                                ))}
                                {this.props.radnje ? (
                                    <th className="z-tabela__radnje">{'Akcije'.translate(l)}</th>
                                ) : null}
                            </tr>
                        </thead>

                        <tbody>
                            {this.props.ucitavanje
                                ? this.kostur()
                                : redovi.map((r, i) => (
                                    <tr key={this.props.kljucReda ? this.props.kljucReda(r) : i}>
                                        {kolone.map((k) => (
                                            <td
                                                key={k.kljuc}
                                                /* `data-naziv` nosi naziv kolone u prikaz karticama
                                                   na uskom ekranu — vidi `_komponente.scss`. */
                                                data-naziv={(k.naziv || '').translate(l)}
                                                className={k.broj ? 'z-tabela__broj' : null}
                                            >
                                                {this.props.celija(r, k, i)}
                                            </td>
                                        ))}
                                        {this.props.radnje ? (
                                            <td className="z-tabela__radnje">{this.props.radnje(r, i)}</td>
                                        ) : null}
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>

                {(imaStranicenje || this.props.ukupnoStavki != null) ? (
                    <div className="z-tabela__dno">
                        <span className="z-tabela__ukupno">
                            {this.props.ukupnoStavki != null
                                ? this.props.ukupnoStavki + ' ' + 'zapisa'.translate(l)
                                : ''}
                        </span>

                        {imaStranicenje ? (
                            <nav className="z-stranice" aria-label={'Stranice'.translate(l)}>
                                <button
                                    type="button"
                                    className="z-stranice__dugme"
                                    disabled={this.props.strana <= 0}
                                    onClick={() => this.props.naStranu(this.props.strana - 1)}
                                >
                                    {'Prethodna'.translate(l)}
                                </button>

                                <span className="z-stranice__razmak">
                                    {(this.props.strana + 1) + ' / ' + this.props.ukupnoStrana}
                                </span>

                                <button
                                    type="button"
                                    className="z-stranice__dugme"
                                    disabled={this.props.strana + 1 >= this.props.ukupnoStrana}
                                    onClick={() => this.props.naStranu(this.props.strana + 1)}
                                >
                                    {'Sljedeća'.translate(l)}
                                </button>
                            </nav>
                        ) : null}
                    </div>
                ) : null}
            </div>
        );
    }
}

export { SMER };
export default Tabela;
