import React, {Component} from 'react';
import {API_ENDPOINT, PHOTOS_ENDPOINT} from '../constants';

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
 *
 * Uz `fotografije` (pretraga fotografija) predlozi su ključne reči upisane na
 * samim fotografijama, a ispod njih i nekoliko fotografija kao sličice.
 * Klik na sličicu zove `onFotografija(foto)`.
 */
class PretragaSaPrijedlozima extends Component {
    constructor(props) {
        super(props);
        this.state = {
            prijedlozi: [],
            fotografije: [],
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
            this.setState({prijedlozi: [], fotografije: [], vidljivi: false, oznaceni: -1});
            return;
        }

        this._kucanje = setTimeout(() => {
            const ovaj = (this._redniBroj = (this._redniBroj || 0) + 1);

            const zaFotografije = !!this.props.fotografije;
            const putanja = zaFotografije ? '/search/suggest/photos' : '/search/suggest';

            fetch(`${API_ENDPOINT}${putanja}?q=${encodeURIComponent(pojam.trim())}`)
                .then((res) => res.json())
                .then((rezultat) => {
                    if (ovaj !== this._redniBroj) return;
                    const prijedlozi = zaFotografije
                        ? ((rezultat && rezultat.kljucne) || [])
                        : (Array.isArray(rezultat) ? rezultat : []);
                    this.setState({
                        prijedlozi,
                        fotografije: zaFotografije ? ((rezultat && rezultat.fotografije) || []) : [],
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

    componentDidUpdate(prethodni) {
        // Promena vrste pretrage (galerije ↔ fotografije) — stari predlozi ne važe.
        if (!!prethodni.fotografije !== !!this.props.fotografije) {
            this.setState({prijedlozi: [], fotografije: [], vidljivi: false, oznaceni: -1});
            if (this.props.value) this.traziPrijedloge(this.props.value);
        }
    }

    render() {
        const {prijedlozi, fotografije, vidljivi, oznaceni} = this.state;

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
                if (prijedlozi.length || fotografije.length) this.setState({vidljivi: true});
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

                {vidljivi && (prijedlozi.length || fotografije.length) ?
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
                        {fotografije.length ?
                            <li className="prijedlozi__fotografije">
                                {fotografije.map((f) => (
                                    <button type="button"
                                            key={`${f.galleryId}-${f.idx}`}
                                            className="prijedlozi__foto"
                                            title={f.name || ''}
                                            onMouseDown={(e) => {
                                                e.preventDefault();
                                                this.zatvori();
                                                if (this.props.onFotografija) this.props.onFotografija(f);
                                            }}>
                                        <img src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(f.image)}`}
                                             alt={f.name || ''} loading="lazy"/>
                                    </button>
                                ))}
                            </li>
                            : null}
                    </ul>
                    : null}
            </>
        );
    }
}

export default PretragaSaPrijedlozima;
