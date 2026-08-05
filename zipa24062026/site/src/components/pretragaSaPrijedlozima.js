import React, {Component} from 'react';
import {API_ENDPOINT} from '../constants';

// Nazivi vrsta predloga, onako kako ih vidi posetilac.
const VRSTE = {
    'kljucna-rec': 'ključna riječ',
    'grad': 'grad',
    'fotograf': 'fotograf',
    'galerija': 'galerija',
};

/*
 * Polje za pretragu sa predlozima dok se kuca.
 *
 * Predlozi se vuku iz onoga što u arhivi zaista postoji — ključnih reči,
 * gradova, fotografa i naziva galerija — pa posetilac ne mora da pogađa
 * kako je nešto zavedeno.
 *
 * Koristi se i na naslovnoj i u zaglavlju, pa izgled dolazi spolja preko
 * `renderInput`; ovde je samo ponašanje.
 */
class PretragaSaPrijedlozima extends Component {
    constructor(props) {
        super(props);
        this.state = {
            prijedlozi: [],
            vidljivi: false,
            oznaceni: -1,
        };
    }

    componentWillUnmount() {
        clearTimeout(this._kucanje);
    }

    /*
     * Upit se šalje tek kad se prestane kucati na četvrt sekunde — inače bi
     * svako slovo bilo poseban odlazak u bazu. Odgovor koji stigne posle
     * novijeg upita se odbacuje, da stariji ne pretekne noviji.
     */
    traziPrijedloge = (pojam) => {
        clearTimeout(this._kucanje);

        if (!pojam || pojam.trim().length < 2) {
            this.setState({prijedlozi: [], vidljivi: false, oznaceni: -1});
            return;
        }

        this._kucanje = setTimeout(() => {
            const ovaj = (this._redniBroj = (this._redniBroj || 0) + 1);

            fetch(`${API_ENDPOINT}/search/suggest?q=${encodeURIComponent(pojam.trim())}`)
                .then((res) => res.json())
                .then((rezultat) => {
                    if (ovaj !== this._redniBroj) return;
                    this.setState({
                        prijedlozi: Array.isArray(rezultat) ? rezultat : [],
                        vidljivi: true,
                        oznaceni: -1,
                    });
                })
                .catch(() => {
                    // Predlozi su pomoć, ne uslov — ako ne stignu, pretraga i dalje radi.
                });
        }, 250);
    };

    zatvori = () => this.setState({vidljivi: false, oznaceni: -1});

    potvrdi = (pojam) => {
        this.zatvori();
        this.props.onSearch(pojam !== undefined ? pojam : this.props.value);
    };

    // Strelice biraju predlog, Enter potvrđuje, Escape zatvara listu.
    naTaster = (e) => {
        const {prijedlozi, vidljivi, oznaceni} = this.state;

        if (e.keyCode === 27) return this.zatvori();

        if (e.keyCode === 13) {
            e.preventDefault();
            return this.potvrdi(
                vidljivi && oznaceni >= 0 ? prijedlozi[oznaceni].tekst : undefined
            );
        }

        if (!vidljivi || !prijedlozi.length) return;

        if (e.keyCode === 40) {
            e.preventDefault();
            this.setState({oznaceni: (oznaceni + 1) % prijedlozi.length});
        }
        if (e.keyCode === 38) {
            e.preventDefault();
            this.setState({
                oznaceni: oznaceni <= 0 ? prijedlozi.length - 1 : oznaceni - 1,
            });
        }
    };

    render() {
        const {prijedlozi, vidljivi, oznaceni} = this.state;

        const svojstva = {
            type: 'text',
            autoComplete: 'off',
            value: this.props.value || '',
            placeholder: this.props.placeholder,
            onChange: (e) => {
                this.props.onChange(e.target.value);
                this.traziPrijedloge(e.target.value);
            },
            onFocus: () => {
                if (prijedlozi.length) this.setState({vidljivi: true});
            },
            // Kratko odlaganje, da klik na predlog stigne pre zatvaranja liste.
            onBlur: () => setTimeout(this.zatvori, 150),
            onKeyDown: this.naTaster,
        };

        return (
            <>
                {this.props.renderInput
                    ? this.props.renderInput(svojstva)
                    : <input {...svojstva} />}

                {vidljivi && prijedlozi.length ?
                    <ul className="prijedlozi">
                        {prijedlozi.map((p, idx) => (
                            <li key={idx}
                                className={idx === oznaceni ? 'oznaceni' : null}
                                onMouseEnter={() => this.setState({oznaceni: idx})}
                                onMouseDown={() => this.potvrdi(p.tekst)}>
                                <span className="tekst">{p.tekst}</span>
                                <span className="vrsta">{VRSTE[p.vrsta] || p.vrsta}</span>
                            </li>
                        ))}
                    </ul>
                    : null}
            </>
        );
    }
}

export default PretragaSaPrijedlozima;
