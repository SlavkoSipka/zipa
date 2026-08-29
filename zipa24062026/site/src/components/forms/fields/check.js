import React, { Component } from 'react';

/*
 * KVAČICA
 *
 * Do 2026-08-28 je ovo bio `<div onClick>` bez `<input>`, bez `role`, bez
 * `tabIndex` i bez obrade tastature: do njega se nije moglo doći Tab-om, a
 * čitač ekrana nije video ni ulogu ni stanje. Na obrascu banera stoji devet
 * takvih kvačica, a u celoj formi su postojala samo tri prava polja.
 *
 * Sada je pravi `<input type="checkbox">` unutar `<label>`, pa je i natpis
 * kliktabilan. Klase su NAMERNO zadržane (`checkbox-wrap`, `checkbox`,
 * `checkbox-label`) da zatečeni stilovi u `_global.scss` i `_account.scss`
 * nastave da važe — menja se šta je element, ne kako izgleda.
 *
 * `redux-form` prosleđuje `value` i `onChange` kao i do sada, pa nijedan
 * obrazac ne treba dirati.
 */
class Check extends Component {
    render() {
        const { label, value, onChange, error, disabled } = this.props;

        return (
            <label className="checkbox-wrap">
                <input
                    type="checkbox"
                    className="checkbox-unos"
                    checked={!!value}
                    disabled={disabled}
                    onChange={(e) => onChange && onChange(e.target.checked)}
                    aria-invalid={error ? 'true' : undefined}
                />
                {/* Kvadratić je i dalje `div`, zbog zatečenog izgleda — ali je
                    sada samo ukras: stanje nosi `input` iznad njega. */}
                <span className={value ? 'checkbox checked' : 'checkbox'} aria-hidden="true" />
                {label ? (
                    <span className={error ? 'checkbox-label required' : 'checkbox-label'}>
                        {label}
                    </span>
                ) : null}
            </label>
        );
    }
}

export default Check;
