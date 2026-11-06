
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';


import Dropzone from 'react-dropzone';
import GridLayout from 'react-grid-layout';
import DatePicker from './date';
import { formValueSelector, change } from 'redux-form';  // ES6
import { connect } from 'react-redux';

import deleteIcon from '../../../assets/svg/close-icon.svg';
import image from '../../../assets/svg/picture.svg';
import {
    Container,
    Row,
    Col,
} from 'reactstrap';

import Text from './text1';
import Textarea from './textarea';
import Check from './check';
import { API_ENDPOINT, PHOTOS_ENDPOINT} from '../../../constants';
import { opstaCena } from './ceneGalerije';

class Gallery extends Component {
    constructor(props) {
        super(props);
        this.dropzone = React.createRef()
        this.getBase64 = this.getBase64.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onLayoutChange = this.onLayoutChange.bind(this);
        this.state = {
            files: [],
            imagesLayout: [],
            _uploading: [],
            // Neuspela slanja po mestu u galeriji: { datoteka, poruka } (2026-11-06).
            _greske: {},
            neuspelo: 0,
            licence: [],
        };
    }

    /*
     * Cena jedne stavke za OVU fotografiju (`photo.cene[kljuc]`). Prazno polje
     * briše posebnu cenu, pa važi opšta (galerija × množilac za veličine,
     * opšta cena licence za licence). Dodato 2026-10-10.
     */
    postaviCenu(kljuc, vrednost) {
        const selectedImage = this.state.selectedImage;
        const cene = Object.assign({}, selectedImage.cene || {});
        if (vrednost === '' || vrednost === null || vrednost === undefined) delete cene[kljuc];
        else cene[kljuc] = vrednost;
        selectedImage.cene = cene;
        this.setState({ selectedImage });
    }

    // Cijena koju fotografija vuče kad nema svoju: iz galerije, pa opšta.
    nasledjenaCena(kljuc) {
        const galerija = this.props.formCene || {};
        const v = galerija[kljuc];
        if (v !== null && v !== undefined && v !== '') return parseFloat(v);
        return opstaCena(kljuc, this.props.formPrice, this.state.licence);
    }

    poljeCene(kljuc, natpis) {
        const cene = (this.state.selectedImage && this.state.selectedImage.cene) || {};
        const nasledjena = this.nasledjenaCena(kljuc);
        return (
            <div className="z-cene-mreza__polje" key={kljuc} title={natpis}>
                <Text label={natpis} type="number" onChange={(e) => this.postaviCenu(kljuc, e)}
                      placeholder={nasledjena !== null ? `${nasledjena} KM` : 'na upit'}
                      value={cene[kljuc] === undefined || cene[kljuc] === null ? '' : String(cene[kljuc])} />
            </div>
        );
    }


    componentDidMount() {
        // Licence za polja cena po fotografiji.
        fetch(`${API_ENDPOINT}/licence/admin/all`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
        }).then((res) => (res.ok ? res.json() : [])).then((licence) => {
            this.setState({ licence: Array.isArray(licence) ? licence : [] });
        }).catch(() => {});

        let files = [];
        let imagesLayout = [];
        for (let i = 0; i < this.props.value.length; i++) {
            files.push(this.props.value[i]);
            imagesLayout.push(i);
        }


        this.setState({
            files: files,
            imagesLayout: imagesLayout,
        });

    }



    // Datum snimanja prve fotografije koja ga ima (FotoStation / EXIF).
    datumIzFotografija() {
        const lista = (this.state.files && this.state.files.length) ? this.state.files : (this.props.value || []);
        const f = lista.find((x) => x && x.date);
        return f ? f.date : null;
    }

    componentDidUpdate(prevProps, prevState) {
        /* „Preuzmi datum sa fotografije": čim je kvačica uključena, i posle
           svakog novog postavljanja, datum galerije se postavlja na datum
           snimanja iz podataka fotografije. */
        if (this.props.datumSaSlike
            && (!prevProps.datumSaSlike || prevProps.value !== this.props.value || prevState.files !== this.state.files)) {
            const d = this.datumIzFotografija();
            if (d && d !== this.props.formDate) this.props.changeDate(d);
        }

        if ((!this.state.files.length && this.props.value.length) && !(prevState.files.length && !this.state.files.length)) {
            console.log(this.props.value);
            let files = [];
            let imagesLayout = [];
            for (let i = 0; i < this.props.value.length; i++) {
                files.push(this.props.value[i]);
                imagesLayout.push(i);
            }

            this.setState({
                files: files,
                imagesLayout: imagesLayout,
            });

            if (this.props.value.length) {

                this.props.enableSave();
            }



        }

        if (prevState.files.length && !this.state.files.length) {
            let files = [];
            for (let i = 0; i < this.state.imagesLayout.length; i++) {
                files.push(this.state.files[this.state.imagesLayout[i]]);
            }

            this.props.onChange(files);

        }
    }

    removeImage(idx) {
        // `imagesLayout` čuva redosled prikaza kao indekse u nizu `files`.
        // Zato se pri brisanju iz njega izbacuje obrisani indeks, a svi veći
        // se pomeraju za jedno mesto — inače bi pokazivali na pogrešnu (ili
        // nepostojeću) fotografiju.
        let files = this.state.files.filter((item, i) => i !== idx);
        let _uploading = this.state._uploading.filter((item, i) => i !== idx);
        let imagesLayout = this.state.imagesLayout
            .filter((position) => position !== idx)
            .map((position) => (position > idx ? position - 1 : position));

        this.setState({
            files: files,
            imagesLayout: imagesLayout,
            _uploading: _uploading
        }, () => {
            this.props.onChange(this.state.imagesLayout.map((position) => this.state.files[position]));
        });
    }

    getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result;
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    }


    /*
     * SLANJE FOTOGRAFIJA (2026-11-06).
     *
     * Ranije su sve izabrane fotografije išle na server ODJEDNOM, a greška
     * se nigde nije hvatala: server je istovremeno obrađivao 59 slika (žig,
     * dve veličine pregleda, WebP), poneka bi pala, i „Slanje u toku…" je
     * ostajalo zauvek. Sada:
     *   - idu po tri istovremeno (`ODJEDNOM`), ostale čekaju red;
     *   - svaka završi uspehom ILI greškom — neuspela ostaje na svom mestu
     *     sa porukom i dugmetom „Pokušaj ponovo";
     *   - kad server ne odgovori ili je zagušen, pokuša se još jednom sam;
     *   - dok traje, piše koliko je poslato, koliko je ostalo i otprilike
     *     koliko još treba.
     */
    posaljiJednu(datoteka, mesto, pokusaj = 1) {
        return new Promise((gotovo) => {
            const formData = new FormData();
            formData.append('file', datoteka);
            this.props.uploadHandler(formData, (img, greska, ponoviti) => {
                if (!img && ponoviti && pokusaj < 2) {
                    this.posaljiJednu(datoteka, mesto, pokusaj + 1).then(gotovo);
                    return;
                }
                gotovo({ img, greska });
            });
        });
    }

    primiRezultat(mesto, datoteka, { img, greska }) {
        const _greske = Object.assign({}, this.state._greske);
        const files = this.state.files.slice();
        const _uploading = this.state._uploading.slice();
        _uploading[mesto] = null;

        if (img) {
            delete _greske[mesto];
            files[mesto] = img;

            if (!this.props.formName && img.galleryName) this.props.changeName({ ba: img.galleryName });
            if (img.description) this.props.changeDescription({ ba: img.description });
            if (!this.props.formDate && img.date) this.props.changeDate(img.date);
            if (img.location) this.props.changeLocation(img.location);
        } else {
            _greske[mesto] = { datoteka, poruka: greska || 'Slanje nije uspjelo.' };
        }

        this.setState({
            files, _uploading, _greske,
            imagesUploaded: this.state.imagesUploaded + (img ? 1 : 0),
            neuspelo: Object.keys(_greske).length,
        }, () => {
            // Galerija dobija samo fotografije koje su stvarno poslate.
            this.props.onChange(this.state.imagesLayout.map((i) => this.state.files[i]).filter(Boolean));
        });
    }

    async posaljiRed(poslovi) {
        const ODJEDNOM = 3;
        let sledeci = 0;
        const pocetak = Date.now();
        this.setState({ uploading: true, pocetakSlanja: pocetak });

        const radnik = async () => {
            while (sledeci < poslovi.length) {
                const { datoteka, mesto } = poslovi[sledeci++];
                const rez = await this.posaljiJednu(datoteka, mesto);
                this.primiRezultat(mesto, datoteka, rez);
            }
        };
        await Promise.all(Array.from({ length: Math.min(ODJEDNOM, poslovi.length) }, radnik));

        this.setState({ uploading: false });
        if (this.props.enableSave) this.props.enableSave();
    }

    async onDrop(imageFiles) {
        if (this.state.uploading) return;
        const startIndex = this.state.files.length;
        const poslovi = imageFiles.map((datoteka, i) => ({ datoteka, mesto: startIndex + i }));

        this.setState({
            imagesCount: imageFiles.length,
            imagesUploaded: 0,
            files: this.state.files.concat(imageFiles.map(() => null)),
            imagesLayout: this.state.imagesLayout.concat(poslovi.map((p) => p.mesto)),
            _uploading: this.state._uploading.concat(imageFiles.map(() => true)),
        }, () => this.posaljiRed(poslovi));
    }

    // Ponovo pošalji sve koje nisu uspele (ili jednu).
    ponoviNeuspele(samoMesto) {
        if (this.state.uploading) return;
        const poslovi = Object.keys(this.state._greske)
            .map(Number)
            .filter((m) => samoMesto === undefined || m === samoMesto)
            .map((mesto) => ({ datoteka: this.state._greske[mesto].datoteka, mesto }));
        if (!poslovi.length) return;
        const _greske = Object.assign({}, this.state._greske);
        poslovi.forEach((p) => delete _greske[p.mesto]);
        this.setState({ imagesCount: poslovi.length, imagesUploaded: 0, _greske, neuspelo: Object.keys(_greske).length },
            () => this.posaljiRed(poslovi));
    }

    // Neuspela fotografija se uklanja iz galerije (mesto ostaje prazno, ne pomera ostale).
    ukloniNeuspelu(mesto) {
        const _greske = Object.assign({}, this.state._greske);
        delete _greske[mesto];
        this.setState({
            _greske,
            neuspelo: Object.keys(_greske).length,
            imagesLayout: this.state.imagesLayout.filter((i) => i !== mesto),
        }, () => this.props.onChange(this.state.imagesLayout.map((i) => this.state.files[i]).filter(Boolean)));
    }



    onLayoutChange(layout) {
        //console.log(layout);
        let arr = [];
        for (let i = 0; i < layout.length; i++) {
            arr.push({ idx: layout[i].i, position: layout[i].y * 3 + layout[i].x });
        }

        arr.sort(function (a, b) { return (a.position > b.position) ? 1 : ((b.position > a.position) ? -1 : 0); });
        let imagesLayout = [];
        for (let i = 0; i < arr.length; i++) {
            imagesLayout.push(parseInt(arr[i].idx));
        }


        this.setState({
            imagesLayout: imagesLayout
        }, () => {
            let files = [];
            for (let i = 0; i < this.state.imagesLayout.length; i++) {
                files.push(this.state.files[this.state.imagesLayout[i]]);
            }

            this.props.onChange(files);


        });

    }


    render() {

        let images = [];

        if (this.state.files) {
            let x = 0;
            let y = 0;
            for (let i = 0; i < this.state.files.length; i++) {
                let layout = { i: i.toString(), x: x, y: y, w: 1, h: 1 };
                let item = {
                    content: (
                        <div className="image" key={i.toString()} data-grid={layout} >

                            <div className="image-wrap">

                                {this.state._greske[i] ? (
                                    <div className="z-slika-greska" onMouseDown={(e) => e.stopPropagation()}>
                                        <strong>{'Nije poslato'.translate(this.props.lang)}</strong>
                                        <span title={this.state._greske[i].poruka}>{this.state._greske[i].datoteka && this.state._greske[i].datoteka.name}: {this.state._greske[i].poruka}</span>
                                        <span className="z-slika-greska__radnje">
                                            <button type="button" disabled={this.state.uploading}
                                                    onClick={(e) => { e.preventDefault(); this.ponoviNeuspele(i); }}>{'Pokušaj ponovo'.translate(this.props.lang)}</button>
                                            <button type="button" onClick={(e) => { e.preventDefault(); this.ukloniNeuspelu(i); }}>{'Ukloni'.translate(this.props.lang)}</button>
                                        </span>
                                    </div>
                                ) : this.state.files[i] ? (
                                    <img src={`${PHOTOS_ENDPOINT}/photos/350x/${encodeURI(this.state.files[i].image || '')}`} alt="" />
                                ) : (
                                    <div className="z-slika-ceka">{'Obrađuje se…'.translate(this.props.lang)}</div>
                                )}

                                {/*
                                  * RADNJE NAD FOTOGRAFIJOM
                                  *
                                  * Do sada se izmjena otvarala klikom na SAMU
                                  * SLIKU — nigde nije pisalo da se može kliknuti,
                                  * a slika nije dostupna tastaturom. Sada stoji
                                  * dugme sa natpisom.
                                  *
                                  * `stopPropagation` na `mousedown` je OBAVEZAN:
                                  * pločice stoje u mreži koja se prevlači
                                  * (`react-grid-layout`), pa pritisak na dugme
                                  * inače počinje prevlačenje i klik ume da se
                                  * izgubi. To je i razlog zbog kog je brisanje
                                  * djelovalo kao da ne radi.
                                  *
                                  * `type="button"` takođe nije ukras — sve ovo
                                  * stoji unutar obrasca galerije, pa bi dugme bez
                                  * njega slalo obrazac.
                                  */}
                                <div className="z-slika-radnje">
                                    <button
                                        type="button"
                                        className="z-slika-radnje__izmeni"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onTouchStart={(e) => e.stopPropagation()}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            this.setState({
                                                selectedImage: JSON.parse(JSON.stringify(this.state.files[i])),
                                                selectedImageIdx: i
                                            });
                                        }}
                                    >
                                        {'Izmijeni'.translate(this.props.lang)}
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    className={'delete'}
                                    aria-label={'Obriši fotografiju'.translate(this.props.lang)}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        this.removeImage(i);
                                    }}
                                >
                                    <Isvg src={deleteIcon} />
                                </button>
                            </div>
                        </div>
                    )
                };
                images.push(item);
                x++;
                if (x >= 3) {
                    y++;
                    x = 0;
                }
            }



        }


        const jezik = this.props.lang;
        // Broje se samo stvarno poslate fotografije, ne mesta koja čekaju ili nisu uspela.
        const koliko = this.state.files ? this.state.files.filter(Boolean).length : 0;

        return (
            <div className="input-wrap gallery-input-wrap">
                <label>{this.props.label}</label>

                {/*
                  * DODAVANJE FOTOGRAFIJA — traka IZNAD okvira.
                  *
                  * Okvir ispod je visok 520px i sam skroluje. U galeriji sa
                  * 156 fotografija dugme za dodavanje otkotrlja se van kadra
                  * cim se malo skroluje, pa je izgledalo da se u vec objavljenu
                  * galeriju ne moze nista dodati. Ova traka stoji van okvira i
                  * uvek je na istom mestu.
                  *
                  * Bira se preko obicnog `input[type=file]`, ne preko
                  * `Dropzone`-a: isti posao, bez oslanjanja na njegovo API
                  * koje se menjalo kroz verzije. Prevlacenje na okvir ispod i
                  * dalje radi kao i do sada.
                  */}
                <div className="z-dodaj-slike">
                    <span className="z-dodaj-slike__broj">
                        {koliko
                            ? `${koliko} ${'fotografija u galeriji'.translate(jezik)}`
                            : 'Galerija je prazna'.translate(jezik)}
                    </span>

                    <input
                        type="file"
                        multiple
                        accept="image/*"
                        ref={(n) => this.izborDatoteka = n}
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const datoteke = Array.prototype.slice.call(e.target.files || []);
                            if (datoteke.length) this.onDrop(datoteke);
                            // Bez ovoga se ista datoteka ne moze izabrati dvaput zaredom.
                            e.target.value = '';
                        }}
                    />

                    <button
                        type="button"
                        className="z-dugme z-dugme--glavno z-dodaj-slike__dugme"
                        disabled={this.state.uploading}
                        onClick={() => this.izborDatoteka && this.izborDatoteka.click()}
                    >
                        {this.state.uploading
                            ? 'Slanje u toku…'.translate(jezik)
                            : (koliko
                                ? 'Dodaj još fotografija'.translate(jezik)
                                : 'Dodaj fotografije'.translate(jezik))}
                    </button>
                </div>

                {this.state.uploading ? (
                    <p className="z-slanje-poruka" role="status">
                        {'Fotografije se šalju i obrađuju na serveru (žig, pregledi, WebP) — oko 5 do 10 sekundi po fotografiji, po tri istovremeno. Ne zatvarajte stranu dok slanje ne završi.'.translate(jezik)}
                    </p>
                ) : null}
                {!this.state.uploading && this.state.neuspelo ? (
                    <div className="z-slanje-poruka z-slanje-poruka--greska" role="alert">
                        {'Nije poslato fotografija:'.translate(jezik)} <b>{this.state.neuspelo}</b> {'— označene su crveno u galeriji.'.translate(jezik)}{' '}
                        <button type="button" className="z-dugme z-dugme--glavno z-dugme--malo" onClick={() => this.ponoviNeuspele()}>
                            {'Pokušaj ponovo sve'.translate(jezik)}
                        </button>
                        <span> {'Ostale možete sačuvati odmah.'.translate(jezik)}</span>
                    </div>
                ) : null}

                <div className="file-drop" ref={(ref) => this.dropzone = ref}>

                    <Dropzone
                        onDrop={this.onDrop}
                        className='dropzone'
                        activeClassName='active-dropzone'
                        multiple={true}>

                        <button button type="button"><i className="mdi mdi-file-outline"></i></button>




                    </Dropzone>

                    <div className="bottom-content">
                        <Isvg src={image} />
                        <p><span>{'Izaberite datoteke'.translate(jezik)}</span> {'ili ih prevucite ovdje'.translate(jezik)}</p>
                    </div>

                    {this.state.uploading ? (() => {
                        const gotovo = this.state.imagesUploaded + this.state.neuspelo;
                        const ukupno = this.state.imagesCount || 1;
                        const sek = (Date.now() - (this.state.pocetakSlanja || Date.now())) / 1000;
                        const ostalo = gotovo > 0 ? Math.ceil((sek / gotovo) * (ukupno - gotovo) / 60) : null;
                        return (
                            <div className="progress-wrap">
                                <div>
                                    <div style={{ width: `${(gotovo * 100) / ukupno}%` }}></div>
                                </div>
                                <p>{'Poslato'.translate(jezik)} {this.state.imagesUploaded} {'od'.translate(jezik)} {ukupno}
                                    {ostalo ? ` · ${'još oko'.translate(jezik)} ${ostalo} min` : ''}</p>
                            </div>
                        );
                    })() : null}

                    <GridLayout
                        className="grid-layout"
                        onLayoutChange={this.onLayoutChange}
                        width={this.dropzone.offsetWidth}
                        margin={[30, 30]}
                        rowHeight={120}

                        compactType={'horizontal'}
                        isResizable={false}
                        verticalCompact={true}
                        horizontalCompact={true}
                        useCSSTransforms={true}
                        cols={3}
                    >

                        {
                            images.map((image, idx) => {
                                return (
                                    image.content
                                );
                            })
                        }
                    </GridLayout>


                </div>

                {this.state.selectedImage ?
                    <div className="exif-modal">
                        <div>
                            <Container>
                                <Row>
                                    <Col lg="12">
                                        <h3>Izmjeni fotografiju</h3>

                                    </Col>

                                    <Col lg="6">
                                        <Text label="Naziv *" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.name = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.name} />
                                        <DatePicker label="Fotografisano" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.date = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.date} />
                                        <Text label="Lokacija" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.location = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.location} />
                                        <Text label="Autor" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.author = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.author} />
                                        <Text label="Caption writer" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.captionWriter = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.captionWriter} />
                                        <Text label="Copyright" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.copyright = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.copyright} />
                                        <Check label="Izdvojena na profilu" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.visibleOnProfile = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.visibleOnProfile} />

                                    </Col>
                                    <Col lg="6">
                                        {/* Adresa je imala NAVODNIKE u sebi:
                                            `'http://…/photos/700x/'n-a/…` — pa
                                            se pregled nikad nije ucitao. Uz to
                                            `encodeURI`, jer imena u arhivi
                                            imaju razmake (pravilo projekta). */}
                                        <img src={`${PHOTOS_ENDPOINT}/photos/700x/${encodeURI(this.state.selectedImage.image || '')}`} alt="" />
                                    </Col>
                                    <Col lg="12">
                                        <Textarea label="Opis *" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.description = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.description} />
                                    </Col>

                                    {/*
                                      * Ključne reči ove fotografije. Ako su upisane u FotoStation-u,
                                      * preuzimaju se pri postavljanju i ovde su već popunjene.
                                      * Po njima se traži baš ova fotografija, a ne cela galerija.
                                      */}
                                    <Col lg="12">
                                        <Text label="Ključne riječi (odvojene zarezom)" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.keywords = (e || '')
                                                .split(',')
                                                .map((rec) => rec.trim())
                                                .filter((rec) => rec.length);
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={
                                            Array.isArray(this.state.selectedImage.keywords)
                                                ? this.state.selectedImage.keywords.join(', ')
                                                : (this.state.selectedImage.keywords || '')
                                        } />
                                    </Col>

                                    {/*
                                      * Skriveni tekst — FotoStation polje „Local Caption".
                                      * Traži se po njemu kao i po opisu, ali ga posetilac
                                      * nigde ne vidi. Za imena ljudi sa fotografije, radne
                                      * nazive i slično.
                                      */}
                                    <Col lg="12">
                                        <Textarea label="Skriveni tekst za pretragu (ne prikazuje se na sajtu)" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.localCaption = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.localCaption || ''} />
                                    </Col>

                                    {/*
                                      * Cijene za OVU fotografiju (KM). Prazno = važi opšta cijena:
                                      * za veličine cijena galerije, za licence cijena iz
                                      * Sadržaj → Licence. Upisana cijena ima prednost.
                                      */}
                                    <Col lg="12">
                                        <h4 className="z-cene-foto__naslov">Cijene za ovu fotografiju (KM) — prazno polje vuče cijenu iz galerije (siva vrijednost u polju)</h4>
                                    </Col>
                                    {/* Mreža jednakih polja, natpis u jednom redu (2026-10-27). */}
                                    <Col lg="12">
                                        <div className="z-cene-mreza">
                                            {this.poljeCene('3000', 'Najveća (3000 px)')}
                                            {this.poljeCene('1500', 'Srednja (1500 px)')}
                                            {this.poljeCene('800', 'Mala (800 px)')}
                                            {(this.state.licence || []).map((lic) =>
                                                this.poljeCene(String(lic._id), (lic.naziv && lic.naziv.ba) || 'Licenca')
                                            )}
                                        </div>
                                    </Col>

                                    <Col lg="12" className="buttons">
                                        <button type="button" onClick={() => {
                                            let files = this.state.files;
                                            files[this.state.selectedImageIdx] = JSON.parse(JSON.stringify(this.state.selectedImage));
                                            this.setState({
                                                files,
                                                selectedImage: null,
                                                selectedImageIdx: null
                                            });
                                            this.props.onChange(files)
                                        }}>IZMJENI</button>
                                        <button type="button" onClick={() => {
                                            this.setState({
                                                selectedImage: null,
                                                selectedImageIdx: null
                                            })
                                        }}>ZATVORI</button>
                                    </Col>

                                </Row>
                            </Container>
                        </div>
                    </div>
                    :
                    null
                }




            </div>
        );
    }
}

const selector = formValueSelector('galleryForm');

export default connect(state => {
    return {
        formName: selector(state, 'name'),
        formDescription: selector(state, 'description'),
        formDate: selector(state, 'date'),
        formLocation: selector(state, 'location'),
        formPrice: selector(state, 'price'),
        datumSaSlike: selector(state, 'datumSaSlike'),
        formCene: selector(state, 'cene'),

    }

}, {
    changeName: value => change("galleryForm", "name", value),
    changeDescription: value => change("galleryForm", "description", value),
    changeDate: value => change("galleryForm", "date", value),
    changeLocation: value => change("galleryForm", "location", value),


})(Gallery);