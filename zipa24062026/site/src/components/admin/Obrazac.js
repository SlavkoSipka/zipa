import React, { Component } from 'react';

/*
 * OBRAZAC — zajednički delovi za unos u administraciji
 *
 * Izvozi četiri sitna dela, ne jednu veliku komponentu: ekrani se međusobno
 * previše razlikuju da bi im jedan obrazac odgovarao, a ovi delovi pokrivaju
 * ono što je svuda isto.
 *
 *     import { Grupa, Polje, Kvacica, DnoObrasca } from '../../components/admin/Obrazac';
 *
 *     <Grupa naslov="Osnovno" opis="Naziv i mjesto u spisku.">
 *         <Polje oznaka="Naziv" obavezno greska={g.naziv} pomoc="Vidi se u spisku.">
 *             <input className="z-polje__unos" value={…} onChange={…} />
 *         </Polje>
 *
 *         <Polje oznaka="Pozicija" neobavezno>
 *             <input type="number" className="z-polje__unos" … />
 *         </Polje>
 *     </Grupa>
 *
 *     <Kvacica ime="hidden" oznaka="Skriveno"
 *              pomoc="Skriven baner se ne prikazuje posjetiocima."
 *              vrednost={…} naPromenu={(v) => …} />
 *
 *     <DnoObrasca
 *         lang={lang}
 *         cuva={this.state.cuva}
 *         sacuvano={this.state.sacuvano}
 *         naOdustani={() => history.push('/account/banners')}
 *         povratak={<Link to="/account/banners">Nazad na spisak</Link>}
 *     />
 *
 * GREŠKA SE UVEK PIŠE REČIMA. `greska` je tekst, ne `true` — do sada je
 * jedini znak bio crveni natpis, bez ijedne reči o tome šta je pogrešno.
 */

export function Grupa({ naslov, opis, lang, children }) {
    return (
        <section className="z-obrazac__grupa">
            {naslov ? (
                <h2 className="z-obrazac__naslov-grupe">{naslov.translate(lang)}</h2>
            ) : null}
            {opis ? (
                <p className="z-obrazac__opis-grupe">{opis.translate(lang)}</p>
            ) : null}
            {children}
        </section>
    );
}

/* Dva polja u redu na širokom ekranu, jedno na uskom. */
export function Red({ children }) {
    return <div className="z-obrazac__red">{children}</div>;
}

let brojac = 0;

export class Polje extends Component {
    constructor(props) {
        super(props);
        // Oznaka mora da bude vezana za polje (`htmlFor`), pa svakom treba
        // jedinstven `id` i kad ga ekran ne da.
        this.id = props.id || ('polje-' + (++brojac));
    }

    render() {
        const { oznaka, obavezno, neobavezno, pomoc, greska, lang, children } = this.props;
        const idPomoci = this.id + '-pomoc';
        const idGreske = this.id + '-greska';

        // Pomoć i greška se vezuju za polje preko `aria-describedby`, da ih
        // čitač ekrana pročita uz samo polje.
        const opisano = [pomoc ? idPomoci : null, greska ? idGreske : null]
            .filter(Boolean).join(' ') || undefined;

        const dete = React.isValidElement(children)
            ? React.cloneElement(children, {
                id: children.props.id || this.id,
                'aria-describedby': children.props['aria-describedby'] || opisano,
                'aria-invalid': greska ? 'true' : undefined,
            })
            : children;

        return (
            <div className={'z-obrazac__polje' + (greska ? ' z-obrazac__polje--greska' : '')}>
                {oznaka ? (
                    <label className="z-obrazac__oznaka" htmlFor={this.id}>
                        {oznaka.translate(lang)}
                        {obavezno ? (
                            <abbr className="z-obrazac__obavezno" title={'obavezno'.translate(lang)}>*</abbr>
                        ) : null}
                        {/* Neobavezno se PIŠE rečju — zvezdica na obaveznima
                            sama po sebi ne kaže šta znači njeno odsustvo. */}
                        {neobavezno ? (
                            <span className="z-obrazac__uz">{'neobavezno'.translate(lang)}</span>
                        ) : null}
                    </label>
                ) : null}

                {dete}

                {pomoc ? (
                    <p className="z-obrazac__pomoc" id={idPomoci}>{pomoc.translate(lang)}</p>
                ) : null}

                {greska ? (
                    <p className="z-obrazac__greska" id={idGreske} role="alert">{greska}</p>
                ) : null}
            </div>
        );
    }
}

/*
 * KVAČICA — pravi `<input type="checkbox">`.
 *
 * `fields/check.js` je `<div onClick>` bez `<input>`, bez `role` i bez
 * `tabIndex`: do njega se ne može doći tastaturom, a čitač ekrana ne vidi ni
 * stanje ni ulogu. Na obrascu banera ima devet takvih kvačica, a u celoj
 * formi samo tri prava polja.
 *
 * Ovde je `<label>` omotač, pa je i sam tekst kliktabilan.
 */
export class Kvacica extends Component {
    constructor(props) {
        super(props);
        this.id = props.id || ('kvacica-' + (++brojac));
    }

    render() {
        const { oznaka, pomoc, vrednost, naPromenu, lang, ime } = this.props;
        return (
            <label className="z-obrazac__kvacica" htmlFor={this.id}>
                <input
                    type="checkbox"
                    id={this.id}
                    name={ime}
                    checked={!!vrednost}
                    onChange={(e) => naPromenu && naPromenu(e.target.checked)}
                    aria-describedby={pomoc ? this.id + '-pomoc' : undefined}
                />
                <span className="z-obrazac__kvacica-tekst">
                    {oznaka.translate(lang)}
                    {pomoc ? (
                        <span className="z-obrazac__kvacica-pomoc" id={this.id + '-pomoc'}>
                            {pomoc.translate(lang)}
                        </span>
                    ) : null}
                </span>
            </label>
        );
    }
}

/*
 * DNO OBRASCA — zalepljeno uz donju ivicu, da se dugme „Sačuvaj" ne traži na
 * kraju dugačkog obrasca.
 *
 * Posle čuvanja ostaje vidljiva potvrda sa vezom nazad na spisak — do sada je
 * ekran samo skočio na spisak, pa se nije videlo da li je išta sačuvano.
 */
export function DnoObrasca({ lang, cuva, sacuvano, naOdustani, povratak, natpisSacuvaj }) {
    return (
        <div className="z-obrazac__dno">
            <button type="submit" className="z-dugme z-dugme--glavno" disabled={cuva}>
                {cuva
                    ? 'Čuvanje…'.translate(lang)
                    : (natpisSacuvaj || 'Sačuvaj').translate(lang)}
            </button>

            {naOdustani ? (
                <button type="button" className="z-dugme z-dugme--sporedno" onClick={naOdustani}>
                    {'Odustani'.translate(lang)}
                </button>
            ) : null}

            {sacuvano ? (
                <p className="z-obrazac__poruka-uspeha" role="status">
                    {'Sačuvano.'.translate(lang)}
                    {povratak || null}
                </p>
            ) : null}
        </div>
    );
}

export default { Grupa, Red, Polje, Kvacica, DnoObrasca };
