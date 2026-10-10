import React, { Component } from 'react';
import { connect } from 'react-redux';
import { formValueSelector } from 'redux-form';
import { Row, Col } from 'reactstrap';

import { API_ENDPOINT } from '../../../constants';

/*
 * CIJENE ZA CIJELU GALERIJU (2026-10-10).
 *
 * Jedno polje obrasca (`cene`) sa cijenom svake veličine i svake licence za
 * sve fotografije galerije. Svaka fotografija VUČE ove cijene; u
 * „Izmjeni fotografiju" admin po želji upiše drugu za tu jednu fotografiju.
 *
 * Prazno polje = važi opšta cijena: za veličine cijena galerije × množilac
 * (Najveća 100%, Srednja 50%, Mala 15%), za licence opšta cijena licence.
 * Ta opšta vrijednost se vidi kao siva oznaka u praznom polju.
 */
export const MNOZILAC = { '3000': 1, '1500': 0.5, '800': 0.15 };
export const VELICINE = [
    { kljuc: '3000', naziv: 'Najveća (3000 px)' },
    { kljuc: '1500', naziv: 'Srednja (1500 px)' },
    { kljuc: '800', naziv: 'Mala (800 px)' },
];

const ima = (v) => v !== null && v !== undefined && v !== '';

// Opšta cijena kad galerija nema svoju: veličina iz cijene galerije, licenca iz opšte.
export function opstaCena(kljuc, cenaGalerije, licence) {
    if (MNOZILAC[kljuc] !== undefined) {
        return ima(cenaGalerije) ? Math.round(parseFloat(cenaGalerije) * MNOZILAC[kljuc] * 100) / 100 : null;
    }
    const lic = (licence || []).find((l) => String(l._id) === String(kljuc));
    return lic && ima(lic.cena) ? parseFloat(lic.cena) : null;
}

class CeneGalerije extends Component {
    constructor(props) {
        super(props);
        this.state = { licence: [] };
    }

    componentDidMount() {
        fetch(`${API_ENDPOINT}/licence/admin/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }).then((res) => (res.ok ? res.json() : [])).then((licence) => {
            this.setState({ licence: Array.isArray(licence) ? licence : [] });
        }).catch(() => {});
    }

    postavi(kljuc, vrednost) {
        const cene = Object.assign({}, this.props.value || {});
        if (vrednost === '') delete cene[kljuc];
        else cene[kljuc] = vrednost;
        this.props.onChange(cene);
    }

    polje(kljuc, naziv) {
        const cene = this.props.value || {};
        const opsta = opstaCena(kljuc, this.props.cenaGalerije, this.state.licence);
        return (
            <Col lg="2" md="4" xs="6" key={kljuc}>
                <div className="input-wrap">
                    <label>{naziv}</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={ima(cene[kljuc]) ? String(cene[kljuc]) : ''}
                        placeholder={opsta !== null ? `${opsta} KM` : 'Na upit'}
                        onChange={(e) => this.postavi(kljuc, e.target.value)}
                    />
                </div>
            </Col>
        );
    }

    render() {
        return (
            <div className="z-cene-galerije">
                <h4 className="z-cene-foto__naslov">
                    Cijene za cijelu galeriju (KM) — svaka fotografija ih vuče; pojedinačnu mijenjate u „Izmjeni fotografiju"
                </h4>
                <Row>
                    {VELICINE.map((v) => this.polje(v.kljuc, v.naziv))}
                    {this.state.licence.map((l) => this.polje(String(l._id), (l.naziv && l.naziv.ba) || 'Licenca'))}
                </Row>
            </div>
        );
    }
}

const selector = formValueSelector('galleryForm');

export default connect((state) => ({ cenaGalerije: selector(state, 'price') }))(CeneGalerije);
