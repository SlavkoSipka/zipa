import React, { Component } from "react";
import { Link, Redirect } from "react-router-dom";
import Page from "../containers/page";
import { Container } from "reactstrap";
import moment from "moment";

import { kataloskiBroj } from "../components/articles/article";
import {
    EmailShareButton,
    FacebookShareButton,
    LinkedinShareButton,
    TelegramShareButton,
    TwitterShareButton,
    ViberShareButton,
    WhatsappShareButton,
    EmailIcon,
    FacebookIcon,
    LinkedinIcon,
    TelegramIcon,
    TwitterIcon,
    ViberIcon,
    WhatsappIcon,
} from "react-share";
import { API_ENDPOINT, PHOTOS_ENDPOINT } from "../constants";

/*
 * JEDNA FOTOGRAFIJA — /galerija/:alias/:id/:photo
 *
 * Ovo je adresa koja se deli. Fotografija je zato krupna i prva; podaci,
 * cena i korpa stoje uz nju, a ne ispod nje.
 *
 * NIŠTA OD LOGIKE NIJE MENJANO: `gallery/track`, `gallery/download`,
 * `addToCart`, cene po rezolucijama i uslovi za preuzimanje su prepisani
 * jedan u jedan.
 *
 * POPRAVLJENO usput: prelaz na sledeću/prethodnu fotografiju je čitao
 * `this.props.history` i `this.props.location`, kojih na ovoj komponenti
 * nema — kroz `Page(...)` router stiže kao `this.props[0]`. Strelice su zbog
 * toga rušile stranu pri kliku. Sada čitaju `this.props[0]`.
 *
 * OG oznake za deljenje se prave u `routesList.js`; tamo je dodato da
 * `og:image` pokazuje BAŠ ovu fotografiju, a ne prvu iz galerije.
 */

// Cena po rezoluciji — udeo pune cene galerije. Zatečene vrednosti.
const CENE = {
    3000: 1,
    1500: 0.5,
    800: 0.15,
};

class PhotoPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.selectedImage = this.selectedImage.bind(this);
        this.nextImage = this.nextImage.bind(this);
        this.previousImage = this.previousImage.bind(this);

        this.state = {
            ...props.initialData,
            resolution: 3000,
            imagesInGallery: 0,
            singleImage: false,
        };
    }

    init() {
        fetch(`${API_ENDPOINT}/gallery/track/${this.props[0].match.params.id}/${this.props[0].match.params.alias}/${this.props[0].match.params.photo}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
        });

        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](window.fetch, this.props[0].match, this.props[0].location.pathname, null, this.props.lang)
                .then((data) => {
                    this.setState(
                        {
                            ...data,
                        },
                        () => {
                            const { gallery } = this.state;
                            if (gallery && gallery.photos) {
                                this.setState({ imagesInGallery: gallery.photos.length });
                            }
                            this.props.updateMeta(this.props.generateSeoTags(this.state));
                        }
                    );
                })
                .catch((error) => {
                    console.error("Error fetching gallery data: ", error);
                });
        }
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.init();
    }

    componentDidUpdate(prevProps) {
        if (prevProps[0].location.pathname != this.props[0].location.pathname) {
            this.init();
            window.scrollTo(0, 0);
        }
    }

    selectedImage() {
        const imageUrl = this.props[0].location.pathname;
        return parseInt(imageUrl.split("/").pop());
    }

    nextImage() {
        const selectedImage = this.selectedImage();
        const history = this.props[0].history;
        const nextImage = selectedImage + 1;
        const numberOfImages = this.state.gallery ? this.state.gallery.photos.length : 0;
        const pathname = this.props[0].location.pathname;

        if (nextImage >= numberOfImages) {
            history.replace(`${pathname.replace(/\/\d+$/, "")}/0`);
        } else {
            history.replace(`${pathname.replace(/\d+$/, "")}${nextImage}`);
        }
    }

    previousImage() {
        const selectedImage = this.selectedImage();
        const history = this.props[0].history;
        const previousImage = selectedImage - 1;
        const numberOfImages = this.state.gallery ? this.state.gallery.photos.length : 0;
        const pathname = this.props[0].location.pathname;

        if (previousImage < 0) {
            history.replace(`${pathname.replace(/\/\d+$/, "")}/${numberOfImages - 1}`);
        } else {
            history.replace(`${pathname.replace(/\d+$/, "")}${previousImage}`);
        }
    }

    // Preuzimanje — poziv i način upisa u skriveni <a> su nepromenjeni.
    preuzmi = (gallery) => {
        fetch(`${API_ENDPOINT}/gallery/download/${gallery._id}/${this.props[0].match.params.photo}/${this.state.resolution}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
        })
            .then((res) => res.json())
            .then((result) => {
                if (result.image) {
                    var a = this.aTag;
                    a.href = result.image;
                    a.download = gallery.photos[this.props[0].match.params.photo].image.split("/").pop();
                    a.click();
                }
            });
    };

    render() {
        const l = this.props.lang;
        const gallery = this.state.gallery ? this.state.gallery : { photos: [] };
        const idx = this.props[0].match.params.photo;

        const numberOfImages = gallery.photos ? gallery.photos.length : 0;
        const singleImage = numberOfImages > 1;

        if (singleImage !== this.state.singleImage) {
            this.setState({ singleImage });
        }

        if (gallery.error == "notfound") {
            return <Redirect to="/404"></Redirect>;
        }

        const foto = (gallery.photos && gallery.photos[idx]) || {};
        const sirina = foto.width;

        const alias = Object.translate(gallery, "alias", l);
        const putanjaGalerije = `/galerija/${alias}/${gallery._id}`;

        const kat = kataloskiBroj(gallery.date, gallery._id);
        const kataloski = kat ? `${kat}-${String(Number(idx) + 1).padStart(3, "0")}` : null;

        // Rezolucije koje ova fotografija uopšte može da ponudi.
        const rezolucije = [
            { px: 3000, uslov: sirina >= 1500 },
            { px: 1500, uslov: sirina >= 801 },
            { px: 800, uslov: sirina >= 0 },
        ].filter((r) => r.uslov);

        const cena = (px) => (gallery.price ? (gallery.price * CENE[px]).formatPrice(2) : "/");

        const naOriginalu = foto.originalIsOnServer;
        const vecPlaceno = this.state.allowedResolutions
            && this.state.allowedResolutions[`resolution${this.state.resolution}px`];

        const podaci = [
            { naziv: "Naziv datoteke", vrednost: foto.name },
            { naziv: "Dimenzija", vrednost: foto.width && foto.height ? `${foto.width} × ${foto.height} px` : null },
            { naziv: "Lokacija", vrednost: foto.location || gallery.location },
            { naziv: "Fotografisano", vrednost: foto.date ? moment.unix(foto.date).format("DD.MM.YYYY.") : null },
            { naziv: "Autor", vrednost: foto.author || gallery.user },
            { naziv: "Opis napisao", vrednost: foto.captionWriter },
            { naziv: "Autorsko pravo", vrednost: foto.copyright },
        ].filter((p) => p.vrednost);

        return (
            <div className="detail-wrap z-fotografija">
                <a ref={(node) => (this.aTag = node)}></a>

                <Container>
                    {/* ── vrh: povratak i kataloški broj ─────────────── */}
                    <div className="z-fotografija__vrh">
                        <Link className="z-fotografija__nazad" to={putanjaGalerije}>
                            {"Nazad na galeriju".translate(l)}
                        </Link>

                        {kataloski ? (
                            <span className="z-fotografija__kataloski">{kataloski}</span>
                        ) : null}
                    </div>

                    <div className="z-fotografija__raspored">

                        {/* ── fotografija ────────────────────────────── */}
                        <div className="z-fotografija__kadar">
                            {foto.image ? (
                                <img
                                    className="z-fotografija__slika"
                                    src={`${PHOTOS_ENDPOINT}/photos/700x/${foto.image}`}
                                    alt={Object.translate(gallery, "name", l) || ""}
                                    decoding="async"
                                />
                            ) : null}

                            {this.state.singleImage ? (
                                <>
                                    <button
                                        type="button"
                                        className="z-fotografija__strelica z-fotografija__strelica--nazad"
                                        aria-label={"Prethodna fotografija".translate(l)}
                                        onClick={this.previousImage}
                                    />
                                    <button
                                        type="button"
                                        className="z-fotografija__strelica z-fotografija__strelica--napred"
                                        aria-label={"Sljedeća fotografija".translate(l)}
                                        onClick={this.nextImage}
                                    />
                                </>
                            ) : null}
                        </div>

                        {/* ── panel sa cenom ─────────────────────────── */}
                        <aside className="z-fotografija__panel">
                            {/* Naslov je naziv galerije, ne ime datoteke —
                                ime datoteke stoji dole, među podacima. */}
                            <h1 className="z-fotografija__naslov">
                                {Object.translate(gallery, "name", l)}
                            </h1>

                            <p className="z-fotografija__podnaslov">
                                {gallery.user ? gallery.user : null}
                                {gallery.user && gallery.date ? " · " : null}
                                {gallery.date ? moment.unix(gallery.date).format("DD.MM.YYYY.") : null}
                            </p>

                            {naOriginalu ? (
                                <>
                                    <p className="z-fotografija__oznaka-grupe">
                                        {"Veličina".translate(l)}
                                    </p>

                                    <div className="z-fotografija__rezolucije">
                                        {rezolucije.map((r) => (
                                            <button
                                                type="button"
                                                key={r.px}
                                                className={
                                                    "z-fotografija__rezolucija"
                                                    + (this.state.resolution === r.px ? " z-fotografija__rezolucija--izabrana" : "")
                                                }
                                                aria-pressed={this.state.resolution === r.px}
                                                onClick={() => this.setState({ resolution: r.px })}
                                            >
                                                <span className="z-fotografija__px">{r.px} px</span>
                                                <span className="z-fotografija__cena">{cena(r.px)} KM</span>
                                            </button>
                                        ))}
                                    </div>

                                    {vecPlaceno ? (
                                        <button
                                            type="button"
                                            className="z-fotografija__radnja z-fotografija__radnja--glavna"
                                            onClick={() => this.preuzmi(gallery)}
                                        >
                                            {"Preuzmi fotografiju".translate(l)}
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            className="z-fotografija__radnja z-fotografija__radnja--glavna"
                                            onClick={() => {
                                                if (this.props.uData) this.props.addToCart(gallery, idx, this.state.resolution);
                                                else this.props[0].history.push("/login");
                                            }}
                                        >
                                            {"Dodaj u korpu".translate(l)}
                                        </button>
                                    )}
                                </>
                            ) : (
                                <p className="z-fotografija__nedostupno">
                                    {"Za kupovinu ili preuzimanje ove fotografije javite nam se na +387 66 00 11 22 ili na".translate(l)}{" "}
                                    <a href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>
                                </p>
                            )}

                            {/* ── podaci ─────────────────────────────── */}
                            {podaci.length ? (
                                <dl className="z-fotografija__podaci">
                                    {podaci.map((p, i) => (
                                        <div className="z-fotografija__red" key={i}>
                                            <dt>{p.naziv.translate(l)}</dt>
                                            <dd>{p.vrednost}</dd>
                                        </div>
                                    ))}
                                </dl>
                            ) : null}

                            {/* ── kuda dalje ─────────────────────────── */}
                            <div className="z-fotografija__veze">
                                <Link className="z-fotografija__veza" to={putanjaGalerije}>
                                    {"Cijela galerija".translate(l)}
                                    {numberOfImages ? ` (${numberOfImages})` : null}
                                </Link>

                                {gallery.userAlias ? (
                                    <Link className="z-fotografija__veza" to={`/fotograf/${gallery.userAlias}`}>
                                        {"Profil fotografa".translate(l)}
                                    </Link>
                                ) : null}
                            </div>
                        </aside>
                    </div>

                    {/* ── opis galerije ──────────────────────────────── */}
                    {Object.translate(gallery, "description", l) ? (
                        <section className="z-fotografija__opis">
                            <h2 className="z-fotografija__opis-naslov">
                                {Object.translate(gallery, "name", l)}
                            </h2>
                            <div
                                dangerouslySetInnerHTML={{
                                    __html: Object.translate(gallery, "description", l).replace(/\n/g, "<br/>"),
                                }}
                            />
                        </section>
                    ) : null}

                    {/* ── deljenje ───────────────────────────────────── */}
                    {typeof window !== "undefined" ? (
                        <section className="z-fotografija__dijeljenje">
                            <p className="z-fotografija__oznaka-grupe">{"Podijelite".translate(l)}</p>
                            <div className="z-fotografija__mreze">
                                <FacebookShareButton url={window.location.href}><FacebookIcon size={36} round /></FacebookShareButton>
                                <TwitterShareButton url={window.location.href}><TwitterIcon size={36} round /></TwitterShareButton>
                                <LinkedinShareButton url={window.location.href}><LinkedinIcon size={36} round /></LinkedinShareButton>
                                <TelegramShareButton url={window.location.href}><TelegramIcon size={36} round /></TelegramShareButton>
                                <WhatsappShareButton url={window.location.href}><WhatsappIcon size={36} round /></WhatsappShareButton>
                                <ViberShareButton url={window.location.href}><ViberIcon size={36} round /></ViberShareButton>
                                <EmailShareButton url={window.location.href}><EmailIcon size={36} round /></EmailShareButton>
                            </div>
                        </section>
                    ) : null}

                    {/* ── ostalo iz galerije ─────────────────────────── */}
                    {gallery.photos && gallery.photos.length > 1 ? (
                        <section className="z-fotografija__ostalo">
                            <h2 className="z-fotografija__opis-naslov">
                                {"Iz iste galerije".translate(l)}
                            </h2>

                            <div className="z-fotografija__traka">
                                {gallery.photos.map((item, i) => (
                                    <Link
                                        className={
                                            "z-fotografija__slicica"
                                            + (String(i) === String(idx) ? " z-fotografija__slicica--ovde" : "")
                                        }
                                        key={i}
                                        to={`${putanjaGalerije}/${i}`}
                                        aria-current={String(i) === String(idx) ? "true" : null}
                                    >
                                        <img
                                            src={`${PHOTOS_ENDPOINT}/photos/350x/${item.image}`}
                                            alt=""
                                            loading="lazy"
                                            decoding="async"
                                        />
                                    </Link>
                                ))}
                            </div>
                        </section>
                    ) : null}

                    {/* Reklamna traka agencije — ostaje. */}
                    {this.props.detailBanner && this.props.detailBanner.images.length ? (
                        <div className="z-fotografija__reklame">
                            {this.props.detailBanner.images.map((item, i) => (
                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    key={i}
                                    onClick={() => this.props.bannerClick(item.link)}
                                >
                                    <img src={item.image} alt="" loading="lazy" />
                                </a>
                            ))}
                        </div>
                    ) : null}
                </Container>
            </div>
        );
    }
}

export default Page(PhotoPage);
