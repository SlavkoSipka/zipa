import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import moment from 'moment';

import Page from '../../containers/page';
import NalogOkvir from '../../components/nalogOkvir';
import { kataloskiBroj } from '../../components/articles/article';
import { API_ENDPOINT, PHOTOS_ENDPOINT } from '../../constants';

/*
 * PREUZIMANJA
 *
 * Spisak kupljenih fotografija kroz zajednički okvir naloga. Dohvatanje,
 * podela na strane i sam poziv za preuzimanje su NEPROMENJENI.
 */
class DownloadsPage extends Component {
    constructor(props) {
        super(props);
        this.getSearchParams = this.getSearchParams.bind(this);
        this.generateSearchLink = this.generateSearchLink.bind(this);

        this.state = {
            ...props.initialData,
            // Filter po datumu radi nad UČITANOM stranom — API prima samo
            // `page` i `sort`, pa filtriranje kroz server nije moguće bez
            // izmene rute.
            odDatuma: '',
            doDatuma: '',
        };
    }

    componentDidMount() {
        window.scrollTo(0, 0);

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams()).then((data) => {
                this.setState({
                    ...data
                }, () => {
                    this.props.updateMeta(this.props.generateSeoTags(this.state));
                })
            })
        }
    }

    componentDidUpdate(prevProps) {
        if (prevProps[0].location.pathname != this.props[0].location.pathname || prevProps[0].location.search != this.props[0].location.search) {
            for (let i = 0; i < this.props.loadData.length; i++) {
                this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, this.getSearchParams()).then((data) => {
                    this.setState({
                        ...data
                    }, () => {
                        this.props.updateMeta(this.props.generateSeoTags(this.state));
                    })
                })
            }
        }
    }

    getSearchParams() {
        let brokenParams = this.props[0].location.search.replace('?', '').split('&');
        let params = {};
        for (let i = 0; i < brokenParams.length; i++) {
            params[brokenParams[i].split('=')[0]] = brokenParams[i].split('=')[1];
        }

        return params;
    }

    generateSearchLink(name, value, isValueArray) {
        let params = this.getSearchParams();

        if (!value) {
            delete params[name];
        } else {
            if (isValueArray) {
                if (!params[name]) {
                    params[name] = [];
                }

                if (params[name].indexOf(value) !== -1) {
                    params[name].splice(params[name].indexOf(value), 1);
                } else {
                    params[name].push(value);
                }
                params[name] = params[name].join(',');
            } else {
                params[name] = value;
            }
        }

        let paramsGroup = [];
        for (var key in params) {
            if (params.hasOwnProperty(key) && params[key]) {
                paramsGroup.push(`${key}=${params[key]}`)
            }
        }

        return `?${paramsGroup.join('&')}`;
    }

    // Poziv je nepromenjen — samo izdvojen iz JSX-a da se red vidi.
    preuzmi = (stavka) => {
        fetch(`${API_ENDPOINT}/user/downloads/download-image/${stavka._id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            if (result.image) {
                var a = this.aTag;
                a.href = result.image;
                a.download = stavka.photo && stavka.photo.image
                    ? stavka.photo.image.split('/').pop()
                    : 'zipaphoto.jpg';
                a.click();
            }
        })
    };

    render() {
        const l = this.props.lang;
        const stavke = this.state.items || [];

        // Filtriranje po datumu nad učitanom stranom.
        const od = this.state.odDatuma ? moment(this.state.odDatuma, 'YYYY-MM-DD').startOf('day').unix() : null;
        const doD = this.state.doDatuma ? moment(this.state.doDatuma, 'YYYY-MM-DD').endOf('day').unix() : null;

        const prikazane = stavke.filter((s) => {
            if (!s.timestamp) return true;
            if (od && s.timestamp < od) return false;
            if (doD && s.timestamp > doD) return false;
            return true;
        });

        const imaFilter = !!(this.state.odDatuma || this.state.doDatuma);

        return (
            <NalogOkvir
                lang={l}
                uData={this.props.uData}
                putanja={this.props[0].location.pathname}
                signOut={this.props.signOut}
                naslov={'Preuzimanja'.translate(l)}
            >
                <a ref={(node) => this.aTag = node}></a>

                {stavke.length ? (
                    <>
                        {/* ── filter po datumu ───────────────────────── */}
                        <div className="z-nalog__filter">
                            <label className="z-nalog__filter-polje">
                                <span>{'Od'.translate(l)}</span>
                                <input
                                    type="date"
                                    className="z-nalog__unos"
                                    value={this.state.odDatuma}
                                    onChange={(e) => this.setState({ odDatuma: e.target.value })}
                                />
                            </label>
                            <label className="z-nalog__filter-polje">
                                <span>{'Do'.translate(l)}</span>
                                <input
                                    type="date"
                                    className="z-nalog__unos"
                                    value={this.state.doDatuma}
                                    onChange={(e) => this.setState({ doDatuma: e.target.value })}
                                />
                            </label>
                            {imaFilter ? (
                                <button
                                    type="button"
                                    className="z-nalog__ocisti"
                                    onClick={() => this.setState({ odDatuma: '', doDatuma: '' })}
                                >
                                    {'Poništi filter'.translate(l)}
                                </button>
                            ) : null}
                        </div>

                        {prikazane.length ? (
                            <div className="z-nalog__spisak">
                                {prikazane.map((s, idx) => {
                                    const foto = s.photo
                                        || (s.photos && (s.photos[s.photoId] || s.photos[0]))
                                        || null;
                                    const kat = kataloskiBroj(s.date, s.galleryId || s._id);
                                    const id = kat
                                        ? `${kat}-${String((s.photoId || 0) + 1).padStart(3, '0')}`
                                        : null;

                                    return (
                                        <div className="z-nalog__stavka-spiska" key={s._id || idx}>
                                            <div className="z-nalog__slicica">
                                                {foto && foto.image ? (
                                                    <img
                                                        src={`${PHOTOS_ENDPOINT}/photos/350x/${foto.image}`}
                                                        alt=""
                                                        loading="lazy"
                                                    />
                                                ) : null}
                                            </div>

                                            <div className="z-nalog__stavka-podaci">
                                                <h2 className="z-nalog__stavka-naziv">
                                                    {Object.translate(s, 'name', l)}
                                                </h2>
                                                <p className="z-nalog__stavka-meta">
                                                    {id ? <span className="z-nalog__oznaka-id">{id}</span> : null}
                                                    {s.resolution ? (
                                                        <span className="z-nalog__oznaka">{s.resolution} px</span>
                                                    ) : null}
                                                    {s.timestamp ? (
                                                        <span>{moment.unix(s.timestamp).format('DD.MM.YYYY.')}</span>
                                                    ) : null}
                                                </p>
                                            </div>

                                            <button
                                                type="button"
                                                className="z-nalog__precica z-nalog__precica--glavna"
                                                onClick={() => this.preuzmi(s)}
                                            >
                                                {'Preuzmi ponovo'.translate(l)}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="z-nalog__prazno">
                                {'Za izabrani period nema preuzimanja.'.translate(l)}
                            </p>
                        )}

                        {this.state.total > 20 && !imaFilter ? (
                            <ReactPaginate
                                previousLabel={''}
                                nextLabel={''}
                                breakLabel={'...'}
                                breakClassName={'break-me'}
                                pageCount={this.state.total / 20}
                                marginPagesDisplayed={1}
                                pageRangeDisplayed={2}
                                onPageChange={(page) => { this.props[0].history.push(this.generateSearchLink('page', page.selected)) }}
                                containerClassName={'pagination'}
                                subContainerClassName={'pages pagination'}
                                activeClassName={'active'}
                                hrefBuilder={(page) => { return this.generateSearchLink('page', page) }}
                            />
                        ) : null}
                    </>
                ) : (
                    <div className="z-nalog__prazno-stanje">
                        <h2 className="z-nalog__prazno-naslov">
                            {'Još nemate preuzimanja'.translate(l)}
                        </h2>
                        <p className="z-nalog__prazno-opis">
                            {'Kupljene fotografije pojaviće se ovdje, spremne za ponovno preuzimanje.'.translate(l)}
                        </p>
                        <Link className="z-nalog__precica z-nalog__precica--glavna" to="/galerije">
                            {'Pretraži galerije'.translate(l)}
                        </Link>
                    </div>
                )}
            </NalogOkvir>
        );
    }
}

export default Page(DownloadsPage);
