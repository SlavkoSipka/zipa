import React, { Component } from "react";
import Article, { kataloskiBroj } from '../components/articles/article';
import { Link, Redirect } from "react-router-dom";
import Isvg from "react-inlinesvg";
import Page from "../containers/page";
import {
    Container,
    Row,
    Col,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown,
    CarouselControl,
    Carousel,
    CarouselItem,
    Modal,
    ModalBody,
    ModalHeader,
    Button,
} from "reactstrap";
import moment from "moment";
import searchIcon from "../assets/svg/search-icon-btn.svg";
import picture from "../assets/svg/picture-icon.svg";
import imagesCount from "../assets/svg/images-count.svg";
import penIcon from "../assets/svg/orders-pen.svg";
import trashIcon from "../assets/svg/orders-trash.svg";
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
import PriceInquiry from '../components/priceInquiry';
import { API_ENDPOINT, PHOTOS_ENDPOINT} from "../constants";
import download from "../assets/svg/download.svg";
import cartIcon from "../assets/svg/cart.svg";
import shareIcon from "../assets/svg/share.svg";

class DetailPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);

        this.state = {
            ...props.initialData,
            modalOpen: false,
            galleryContent: null,
            selectedImageIndex: 0,
            resolution: 800,
            touchStartX: null,
            touchEndX: null,
            isMobile: false,

            // Redosled fotografija u galeriji — kako su snimljene ili obrnuto.
            // Traženo uz novi prikaz, po uzoru na Pixsell.
            obrnutRedosled: false,

            opisOtvoren: false,
            deljenjeOtvoreno: false,
            srodne: [],

            // Da li je oštra verzija trenutne fotografije stigla — dok ne
            // stigne, vidi se razmazana mala.
            ostraStigla: false,

            opisFotoOtvoren: false,
        };
        this.deljenjeRef = React.createRef();
    }

    init() {
        for (let i = 0; i < this.props.loadData.length; i++) {
            this.props.loadData[i](
                window.fetch,
                this.props[0].match,
                this.props[0].location.pathname,
                null,
                this.props.lang
            ).then((data) => {
                this.setState(
                    {
                        ...data,
                    },
                    () => {
                        this.props.updateMeta(
                            this.props.generateSeoTags(this.state)
                        );
                    }
                );
            });
        }
    }

    fetchGallery() {
        let pageUrl = window.location.pathname;
        const urlParts = pageUrl.split("/");
        const galleryId = urlParts.pop();
        const galleryOwner = urlParts.pop();
        const galleryUrl = `${API_ENDPOINT}/gallery/get/${this.props.lang}/${galleryOwner}/${galleryId}`;
        fetch(galleryUrl, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        })
            .then((res) =>
                res.json().then((result) => {
                    this.setState({
                        galleryContent: result,
                    });
                })
            )
            .catch((error) => {
                console.error("Error fetching gallery: ", error);
            });
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        this.init();
        this.fetchGallery();
        this.setState({ isMobile: window.innerWidth < 1024 });
        window.addEventListener("resize", this.updateScreenWidth);
        document.addEventListener("mousedown", this.naKlikVanDeljenja);
        document.addEventListener("keydown", this.naTasterDeljenja);
        document.addEventListener("keydown", this.naTasterProzora);
    }

    updateScreenWidth = () => {
        this.setState({ isMobile: window.innerWidth < 1024 });
    };

    componentDidUpdate(prevProps, prevState) {
        if (prevState.modalOpen !== this.state.modalOpen) {
            if (this.state.modalOpen) {
                document.body.style.overflow = "hidden"; // Disable scrolling
            } else {
                document.body.style.overflow = "unset"; // Enable scrolling
            }
        }

        // Optional: Perform actions based on state change
        if (prevState.isMobile !== this.state.isMobile) {
            console.log("Screen width changed, isMobile:", this.state.isMobile);
        }

        // Galerija stiže tek posle `loadData`, pa se srodne traže tada.
        if (this.state.gallery && this.state.gallery !== prevState.gallery) {
            this.dovuciSrodne(this.state.gallery);
        }
    }

    componentWillUnmount() {
        // Clean up event listener
        window.removeEventListener("resize", this.updateScreenWidth);
        document.removeEventListener("mousedown", this.naKlikVanDeljenja);
        document.removeEventListener("keydown", this.naTasterDeljenja);
        document.removeEventListener("keydown", this.naTasterProzora);
        document.body.style.overflow = "unset";
    }

    handleNextImage = () => {
        const { galleryContent, selectedImageIndex } = this.state;
        const lastIndex = galleryContent.photos.length - 1;
        let nextIndex;
        if (selectedImageIndex < lastIndex) {
            nextIndex = selectedImageIndex + 1;
        } else {
            // Wrap around to the first image
            nextIndex = 0;
        }
        this.setState({ selectedImageIndex: nextIndex, ostraStigla: false }, () => {
            this.fetchGalleryTrack(nextIndex);
            this.pretovariSusedne(nextIndex);
        });
    };

    handlePreviousImage = () => {
        const { galleryContent, selectedImageIndex } = this.state;
        const lastIndex = galleryContent.photos.length - 1;
        let prevIndex;
        if (selectedImageIndex > 0) {
            prevIndex = selectedImageIndex - 1;
        } else {
            // Wrap around to the last image
            prevIndex = lastIndex;
        }
        this.setState({ selectedImageIndex: prevIndex, ostraStigla: false }, () => {
            this.fetchGalleryTrack(prevIndex);
            this.pretovariSusedne(prevIndex);
        });
    };

    fetchGalleryTrack = (index) => {
        const { galleryContent } = this.state;
        fetch(
            `${API_ENDPOINT}/gallery/track/${galleryContent._id}/${this.props[0].match.params.alias}/${index}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "authToken"
                    )}`,
                },
            }
        ).catch((error) => {
            console.error("Error fetching gallery track:", error);
        });
    };

    /* Tastatura u prozoru: strelice menjaju fotografiju, Escape zatvara.
       Radi samo dok je prozor otvoren, da se ne sudara sa stranom ispod. */
    naTasterProzora = (e) => {
        if (!this.state.modalOpen) return;

        if (e.key === "Escape" || e.keyCode === 27) {
            this.zatvoriProzor();
        } else if (e.key === "ArrowRight" || e.keyCode === 39) {
            this.handleNextImage();
        } else if (e.key === "ArrowLeft" || e.keyCode === 37) {
            this.handlePreviousImage();
        }
    };

    // Prevlačenje prstom — prag od 50px da običan dodir ne pomera kadar.
    naDodirPocetak = (e) => {
        this.setState({ touchStartX: e.changedTouches[0].clientX });
    };

    naDodirKraj = (e) => {
        const pocetak = this.state.touchStartX;
        if (pocetak === null || pocetak === undefined) return;

        const razlika = e.changedTouches[0].clientX - pocetak;
        if (Math.abs(razlika) > 50) {
            if (razlika < 0) this.handleNextImage();
            else this.handlePreviousImage();
        }
        this.setState({ touchStartX: null });
    };

    /* Sledeća i prethodna se učitavaju unapred, da prelaz ne čeka mrežu.
       Slika se samo traži — pregledač je zadrži u kešu. */
    pretovariSusedne = (index) => {
        const foto = this.state.galleryContent && this.state.galleryContent.photos;
        if (!foto || !foto.length || typeof window === "undefined") return;

        [index + 1, index - 1].forEach((i) => {
            const stvarni = (i + foto.length) % foto.length;
            const stavka = foto[stvarni];
            if (!stavka) return;
            const img = new window.Image();
            img.src = `${PHOTOS_ENDPOINT}/photos/700x/${stavka.image}`;
        });
    };

    /* Zatvaranje vraća skrol tačno na fotografiju sa koje je prozor otvoren.
       Bez ovoga strana se vrati na vrh, a u galeriji od 156 fotografija to
       znači ponovno traženje mesta. */
    zatvoriProzor = () => {
        const odakle = this.otvorenoSa;
        this.setState({ modalOpen: false }, () => {
            if (odakle === undefined || odakle === null) return;
            const cilj = document.querySelectorAll(".z-galerija__foto")[odakle];
            if (cilj) cilj.scrollIntoView({ block: "center" });
        });
    };

    naKlikVanDeljenja = (e) => {
        if (this.state.deljenjeOtvoreno && this.deljenjeRef.current && !this.deljenjeRef.current.contains(e.target)) {
            this.setState({ deljenjeOtvoreno: false });
        }
    };

    naTasterDeljenja = (e) => {
        if ((e.key === "Escape" || e.keyCode === 27) && this.state.deljenjeOtvoreno) {
            this.setState({ deljenjeOtvoreno: false });
        }
    };

    /*
     * „Iz iste kategorije" — koristi POSTOJEĆU pretragu galerija, istu koju
     * gađa i `/galerije`. Ništa se ne menja u API-ju; ovo je samo još jedno
     * čitanje. Bez kategorije se ne poziva.
     */
    dovuciSrodne(gallery) {
        const kategorija = gallery && gallery.category;
        if (!kategorija) return;

        /* Galerija čuva ID kategorije, a pretraga prima ALIAS — isto kao na
           `/galerije`. Bez ovog prevoda pretraga vraća nula rezultata
           (probano). Spisak kategorija već stiže kroz `App.js`. */
        const id = String(Array.isArray(kategorija) ? kategorija[0] : kategorija);
        const nadjena = (this.props.categories || []).find((k) => String(k._id) === id);
        const alias = nadjena ? Object.translate(nadjena, "alias", this.props.lang) : null;

        if (!alias || this.srodneZa === alias) return;
        this.srodneZa = alias;

        fetch(`${API_ENDPOINT}/gallery/search/${this.props.lang}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query: { category: [alias], ipp: 8 } }),
        })
            .then((res) => res.json())
            .then((result) => {
                const stavke = (result && result.items ? result.items : [])
                    .filter((g) => g && g._id !== gallery._id)
                    .slice(0, 4);
                this.setState({ srodne: stavke });
            })
            .catch(() => {});
    }

    toggleModal = () => {
        this.setState((prevState) => ({
            modalOpen: !prevState.modalOpen,
        }));
    };

    render() {
        let content = null;
        let gallery = this.state.gallery ? this.state.gallery : { photos: [] };

        if (gallery.error == "notfound") {
            return <Redirect to="/404"></Redirect>;
        }

        /*
         * Novi prikaz fotografija u galeriji — natpis preko dna, redni broj i
         * biranje redosleda — ide uz nove izglede naslovne. Dok je izabran
         * „trenutni", galerija ostaje kakva je bila, da se ništa ne menja
         * posetiocima pre nego što se izgled odobri.
         */
        const noviPrikaz =
            this.props.settings && this.props.settings.homepageLayout &&
            this.props.settings.homepageLayout !== 'trenutni';

        // Redosled se okreće samo u prikazu; položaj fotografije u galeriji
        // (idx) ostaje isti, jer se po njemu otvara uvećani prikaz.
        const poredaneFotografije = (gallery.photos || [])
            .map((item, idx) => ({ item, idx }));
        if (noviPrikaz && this.state.obrnutRedosled) poredaneFotografije.reverse();

        let priceMap = {
            3000: 1,
            1500: 0.5,
            800: 0.15,
        };

        const { galleryContent, selectedImageIndex } = this.state;

        if (
            !galleryContent ||
            !galleryContent.photos ||
            galleryContent.photos.length === 0
        ) {
            return <div>Loading...</div>;
        }
        const selectedImage = galleryContent.photos[selectedImageIndex];

        // Kataloški broj galerije — treba i prozoru (ID za narudžbu) i
        // zaglavlju strane, pa se računa pre oba.
        const katBrojModal = kataloskiBroj(
            Object.get(gallery, "date"),
            Object.get(gallery, "_id")
        );

        if (this.state.modalOpen && this.state.galleryContent) {
            const ukupno = galleryContent.photos.length;

            /* Namena rezolucije običnim jezikom — kupac ne bira „1500 px",
               bira „za štampu do A5". Cene i pragovi su NEPROMENJENI. */
            const rezolucije = [
                {
                    px: 3000,
                    prag: 1500,
                    naziv: "Najveća".translate(this.props.lang),
                    namena: "za štampu do A3".translate(this.props.lang),
                    mnozilac: priceMap[3000],
                },
                {
                    px: 1500,
                    prag: 801,
                    naziv: "Srednja".translate(this.props.lang),
                    namena: "za štampu do A5".translate(this.props.lang),
                    mnozilac: priceMap[1500],
                },
                {
                    px: 800,
                    prag: 0,
                    naziv: "Mala".translate(this.props.lang),
                    namena: "za veb i društvene mreže".translate(this.props.lang),
                    mnozilac: priceMap[800],
                },
            ].filter((r) => selectedImage.width >= r.prag);

            // ID za poručivanje — kataloški broj galerije plus mesto u njoj.
            const idFotografije = katBrojModal
                ? `${katBrojModal}-${String(selectedImageIndex + 1).padStart(3, "0")}`
                : null;

            const opisFotografije = selectedImage.description || selectedImage.name || "";
            const nazivGalerije = Object.translate(gallery, "name", this.props.lang) || "";

            content = (
                <Modal
                    isOpen={this.state.modalOpen}
                    toggle={this.zatvoriProzor}
                    backdrop={"static"}
                    centered={false}
                    scrollable={false}
                    /* `fade={false}`: Bootstrap-ovo `.modal.fade .modal-dialog`
                       pomera prozor za -50px i oslanja se na prelaz da ga
                       vrati. Taj prelaz se ovde nikad ne dovrši, pa je gornja
                       traka ostajala van kadra. Gašenjem `fade` klase pravilo
                       se uopšte ne primenjuje — čistije nego prebijati ga. */
                    fade={false}
                    className={"z-prozor"}
                >
                    <ModalHeader tag="div" close={<span />}>
                        <div className="z-prozor__vrh">
                            <h2 className="z-prozor__naslov">
                                {Object.translate(gallery, "name", this.props.lang)}
                            </h2>

                            <span className="z-prozor__brojac">
                                {selectedImageIndex + 1} / {ukupno}
                            </span>

                            <button
                                type="button"
                                className="z-prozor__zatvori"
                                aria-label={"Zatvori".translate(this.props.lang)}
                                onClick={this.zatvoriProzor}
                            >
                                &times;
                            </button>
                        </div>
                    </ModalHeader>

                    <ModalBody>
                        <div className="z-prozor__telo">

                            {/* ── fotografija ─────────────────────────── */}
                            <div
                                className="z-prozor__scena"
                                onTouchStart={this.naDodirPocetak}
                                onTouchEnd={this.naDodirKraj}
                            >
                                {ukupno > 1 ? (
                                    <button
                                        type="button"
                                        className="z-prozor__strelica z-prozor__strelica--nazad"
                                        aria-label={"Prethodna".translate(this.props.lang)}
                                        onClick={this.handlePreviousImage}
                                    >
                                        &#8249;
                                    </button>
                                ) : null}

                                <div className="z-prozor__slika-okvir">
                                    {/* Mala verzija razmazana ide prva — kadar
                                        se vidi odmah, oštra stiže preko nje. */}
                                    <img
                                        className="z-prozor__slika z-prozor__slika--pregled"
                                        src={`${PHOTOS_ENDPOINT}/photos/350x/${selectedImage.image}`}
                                        alt=""
                                        aria-hidden="true"
                                    />
                                    <img
                                        key={selectedImage.image}
                                        className={
                                            "z-prozor__slika z-prozor__slika--puna" +
                                            (this.state.ostraStigla
                                                ? " z-prozor__slika--stigla"
                                                : "")
                                        }
                                        src={`${PHOTOS_ENDPOINT}/photos/700x/${selectedImage.image}`}
                                        alt={selectedImage.description || selectedImage.name}
                                        onLoad={() => this.setState({ ostraStigla: true })}
                                    />
                                </div>

                                {ukupno > 1 ? (
                                    <button
                                        type="button"
                                        className="z-prozor__strelica z-prozor__strelica--napred"
                                        aria-label={"Sljedeća".translate(this.props.lang)}
                                        onClick={this.handleNextImage}
                                    >
                                        &#8250;
                                    </button>
                                ) : null}
                            </div>

                            {/* ── panel: cene pa podaci ───────────────── */}
                            <aside className="z-prozor__panel">
                              <div className="z-prozor__panel-telo">

                                {galleryContent.priceOnRequest ? (
                                    <>
                                        <span className="z-prozor__oznaka-grupe">
                                            {"Cijena na upit".translate(this.props.lang)}
                                        </span>
                                        <PriceInquiry
                                            lang={this.props.lang}
                                            galleryId={galleryContent._id}
                                            photoId={selectedImageIndex}
                                            resolution={this.state.resolution}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <span className="z-prozor__oznaka-grupe">
                                            {"Veličina".translate(this.props.lang)}
                                        </span>

                                        <div className="z-prozor__rezolucije">
                                            {rezolucije.map((r) => {
                                                const izabrana = this.state.resolution === r.px;
                                                // Visina se računa iz odnosa originala.
                                                const visina = selectedImage.width
                                                    ? Math.round(
                                                          (selectedImage.height * r.px) /
                                                              selectedImage.width
                                                      )
                                                    : null;
                                                return (
                                                    <button
                                                        type="button"
                                                        key={r.px}
                                                        aria-pressed={izabrana}
                                                        className={
                                                            "z-prozor__rezolucija" +
                                                            (izabrana
                                                                ? " z-prozor__rezolucija--izabrana"
                                                                : "")
                                                        }
                                                        onClick={() =>
                                                            this.setState({ resolution: r.px })
                                                        }
                                                    >
                                                        <span className="z-prozor__rez-levo">
                                                            <span className="z-prozor__rez-naziv">
                                                                {r.naziv}
                                                            </span>
                                                            <span className="z-prozor__rez-opis">
                                                                {visina
                                                                    ? `${r.px} × ${visina} px · `
                                                                    : `${r.px} px · `}
                                                                {r.namena}
                                                            </span>
                                                        </span>
                                                        <span className="z-prozor__rez-cena">
                                                            {galleryContent.price
                                                                ? (
                                                                      galleryContent.price *
                                                                      r.mnozilac
                                                                  ).formatPrice(2)
                                                                : "0"}{" "}
                                                            KM
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Radnje — grane i pozivi NEPROMENJENI,
                                            samo natpisi kažu šta se dešava. */}
                                        <div className="z-prozor__radnje">
                                            {galleryContent.price === 0 ? (
                                                <button
                                                    className="z-prozor__glavna-radnja"
                                                    onClick={() => {
                                                        fetch(
                                                            `${API_ENDPOINT}/gallery/download/free/${galleryContent._id}/${selectedImageIndex}/${this.state.resolution}`,
                                                            {
                                                                method: "GET",
                                                                headers: {
                                                                    "Content-Type":
                                                                        "application/json",
                                                                },
                                                            }
                                                        )
                                                            .then((res) => res.json())
                                                            .then((result) => {
                                                                if (result.image) {
                                                                    var a = this.aTag;
                                                                    a.href = result.image;
                                                                    a.download = selectedImage.name;
                                                                    a.click();
                                                                }
                                                            });
                                                    }}
                                                >
                                                    <Isvg src={download} />
                                                    {"Preuzmi fotografiju".translate(
                                                        this.props.lang
                                                    )}
                                                </button>
                                            ) : selectedImage.originalIsOnServer ? (
                                                this.state.allowedResolutions &&
                                                this.state.allowedResolutions[
                                                    `resolution${this.state.resolution}px`
                                                ] ? (
                                                    <button
                                                        className="z-prozor__glavna-radnja"
                                                        onClick={() => {
                                                            fetch(
                                                                `${API_ENDPOINT}/gallery/download/${galleryContent}/${selectedImageIndex}/${this.state.resolution}`,
                                                                {
                                                                    method: "GET",
                                                                    headers: {
                                                                        "Content-Type":
                                                                            "application/json",
                                                                        Authorization: `Bearer ${localStorage.getItem(
                                                                            "authToken"
                                                                        )}`,
                                                                    },
                                                                }
                                                            )
                                                                .then((res) => res.json())
                                                                .then((result) => {
                                                                    if (result.image) {
                                                                        var a = this.aTag;
                                                                        a.href = result.image;
                                                                        a.download =
                                                                            selectedImage.name;
                                                                        a.click();
                                                                    }
                                                                });
                                                        }}
                                                    >
                                                        <Isvg src={download} />
                                                        {"Preuzmi fotografiju".translate(
                                                            this.props.lang
                                                        )}
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="z-prozor__glavna-radnja"
                                                        onClick={() => {
                                                            if (this.props.uData)
                                                                this.props.addToCart(
                                                                    galleryContent,
                                                                    selectedImageIndex,
                                                                    this.state.resolution
                                                                );
                                                            else
                                                                this.props[0].history.push(
                                                                    "/login"
                                                                );
                                                        }}
                                                    >
                                                        <Isvg src={cartIcon} />
                                                        {"Dodaj u korpu".translate(
                                                            this.props.lang
                                                        )}
                                                    </button>
                                                )
                                            ) : null}

                                            <button
                                                type="button"
                                                className="z-prozor__sporedna-radnja"
                                                title={"Kopiraj vezu".translate(this.props.lang)}
                                                aria-label={"Kopiraj vezu".translate(this.props.lang)}
                                                onClick={() => {
                                                    if (typeof navigator !== "undefined" &&
                                                        navigator.clipboard) {
                                                        navigator.clipboard.writeText(
                                                            window.location.href
                                                        );
                                                    }
                                                }}
                                            >
                                                <Isvg src={shareIcon} />
                                            </button>
                                        </div>

                                        {!selectedImage.originalIsOnServer &&
                                        galleryContent.price !== 0 ? (
                                            <p className="z-prozor__napomena">
                                                {"Za kupovinu ili preuzimanje ove fotografije molimo Vas kontaktirajte nas putem telefona +387.66.00.11.22 ili na e-mail "}
                                                <a href="mailto:info@zipaphoto.net">
                                                    info@zipaphoto.net
                                                </a>
                                            </p>
                                        ) : null}

                                        <a ref={(node) => (this.aTag = node)}></a>
                                    </>
                                )}


                                {/* Opis ide preko cele širine, ne kao vrednost
                                    u redu „Naziv" — tamo je ceo pasus razvlačio
                                    panel. Skraćen na tri reda. */}
                                {opisFotografije ? (
                                    <>
                                        <p
                                            className={
                                                "z-prozor__opis" +
                                                (this.state.opisFotoOtvoren
                                                    ? ""
                                                    : " z-prozor__opis--skupljen")
                                            }
                                        >
                                            {opisFotografije}
                                        </p>
                                        <button
                                            type="button"
                                            className="z-prozor__opis-vise"
                                            aria-expanded={this.state.opisFotoOtvoren}
                                            onClick={() =>
                                                this.setState({
                                                    opisFotoOtvoren:
                                                        !this.state.opisFotoOtvoren,
                                                })
                                            }
                                        >
                                            {this.state.opisFotoOtvoren
                                                ? "manje".translate(this.props.lang)
                                                : "više".translate(this.props.lang)}
                                        </button>
                                    </>
                                ) : null}

                                {/* ── podaci o fotografiji ────────────── */}
                                <dl className="z-prozor__podaci">
                                    {selectedImage.author ? (
                                        <div className="z-prozor__red">
                                            <dt>{"Autor".translate(this.props.lang)}</dt>
                                            <dd>{selectedImage.author}</dd>
                                        </div>
                                    ) : null}

                                    {selectedImage.date ? (
                                        <div className="z-prozor__red">
                                            <dt>{"Datum".translate(this.props.lang)}</dt>
                                            <dd>
                                                {moment
                                                    .unix(selectedImage.date)
                                                    .format("DD.MM.YYYY.")}
                                            </dd>
                                        </div>
                                    ) : null}

                                    {galleryContent.location ? (
                                        <div className="z-prozor__red">
                                            <dt>{"Mjesto".translate(this.props.lang)}</dt>
                                            <dd>{galleryContent.location}</dd>
                                        </div>
                                    ) : null}

                                    {selectedImage.width && selectedImage.height ? (
                                        <div className="z-prozor__red">
                                            <dt>{"Original".translate(this.props.lang)}</dt>
                                            <dd>
                                                {selectedImage.width} × {selectedImage.height} px
                                            </dd>
                                        </div>
                                    ) : null}

                                    {idFotografije ? (
                                        <div className="z-prozor__red">
                                            <dt>{"ID za narudžbu".translate(this.props.lang)}</dt>
                                            <dd className="z-prozor__id">{idFotografije}</dd>
                                        </div>
                                    ) : null}
                                </dl>

                                {/* U arhivi ovde stoji naziv galerije, ne prave
                                    ključne reči — pa se tako i zove. */}
                                {nazivGalerije ? (
                                    <p className="z-prozor__iz-galerije">
                                        <span className="z-prozor__iz-galerije-oznaka">
                                            {"Iz galerije:".translate(this.props.lang)}
                                        </span>
                                        <Link
                                            className="z-prozor__iz-galerije-veza"
                                            to={`/galerije?search=${encodeURIComponent(
                                                nazivGalerije
                                            )}`}
                                            onClick={this.zatvoriProzor}
                                        >
                                            {nazivGalerije}
                                        </Link>
                                    </p>
                                ) : null}
                              </div>
                            </aside>
                        </div>

                        {/* ── traka sa umanjenim prikazima ────────────── */}
                        {ukupno > 1 ? (
                            <div className="z-prozor__traka">
                                {galleryContent.photos.map((foto, i) => (
                                    <button
                                        type="button"
                                        key={i}
                                        aria-label={`${"Fotografija".translate(
                                            this.props.lang
                                        )} ${i + 1}`}
                                        aria-current={i === selectedImageIndex}
                                        className={
                                            "z-prozor__umanjena" +
                                            (i === selectedImageIndex
                                                ? " z-prozor__umanjena--trenutna"
                                                : "")
                                        }
                                        ref={
                                            i === selectedImageIndex
                                                ? (n) => {
                                                      if (n && this.poslednjaTraka !== i) {
                                                          this.poslednjaTraka = i;
                                                          n.scrollIntoView({
                                                              inline: "center",
                                                              block: "nearest",
                                                          });
                                                      }
                                                  }
                                                : null
                                        }
                                        onClick={() => {
                                            this.setState({
                                                selectedImageIndex: i,
                                                ostraStigla: false,
                                            });
                                            this.fetchGalleryTrack(i);
                                            this.pretovariSusedne(i);
                                        }}
                                    >
                                        <img
                                            src={`${PHOTOS_ENDPOINT}/photos/350x/${foto.image}`}
                                            alt=""
                                            loading="lazy"
                                        />
                                    </button>
                                ))}
                            </div>
                        ) : null}
                    </ModalBody>
                </Modal>
            );
        }

        const autor = Object.get(gallery, "user");
        const autorAlias = Object.get(gallery, "userAlias");
        const brojFotografija = gallery.photos ? gallery.photos.length : 0;
        const katBroj = katBrojModal;
        const opisTekst = Object.translate(gallery, "description", this.props.lang);
        const kategorijaNaziv = Object.translate(gallery, "categoryName", this.props.lang);
        const mozeIzmena =
            (this.props.uData && this.props.uData.userRole == "admin") ||
            (this.props.uData &&
                this.props.uData.userRole == "photographer" &&
                (this.props.uData.permissions.indexOf("*") !== -1 ||
                    this.props.uData._id == gallery.uid));

        return (
            <div className="detail-wrap z-galerija">

                {/* ── zaglavlje galerije ───────────────────────────────── */}
                <div className="z-galerija__zaglavlje">
                    <Container>
                        <div className="z-galerija__vrh">
                            <div className="z-galerija__naslovni">
                                {kategorijaNaziv ? (
                                    <span className="z-galerija__kategorija">
                                        {kategorijaNaziv}
                                    </span>
                                ) : null}

                                <h1 className="z-galerija__naslov">
                                    {Object.translate(gallery, "name", this.props.lang)}
                                </h1>

                                {/* Jedan red podataka — tačke između stavki crta
                                    CSS, pa se ne pojavljuju uz stavku koje nema. */}
                                <p className="z-galerija__podaci">
                                    {Object.get(gallery, "location") ? (
                                        <span>{Object.get(gallery, "location")}</span>
                                    ) : null}
                                    {Object.get(gallery, "date") ? (
                                        <span>
                                            {moment
                                                .unix(Object.get(gallery, "date"))
                                                .format("DD.MM.YYYY.")}
                                        </span>
                                    ) : null}
                                    {autor ? (
                                        <span>
                                            {autorAlias ? (
                                                <Link to={`/fotograf/${autorAlias}`}>
                                                    {autor}
                                                </Link>
                                            ) : (
                                                autor
                                            )}
                                        </span>
                                    ) : null}
                                    {brojFotografija ? (
                                        <span>
                                            {brojFotografija}{" "}
                                            {"fotografija".translate(this.props.lang)}
                                        </span>
                                    ) : null}
                                    {katBroj ? (
                                        <span className="z-galerija__kataloski">
                                            {katBroj}
                                        </span>
                                    ) : null}
                                </p>

                                {opisTekst ? (
                                    <>
                                        <div
                                            className={
                                                "z-galerija__opis" +
                                                (this.state.opisOtvoren
                                                    ? ""
                                                    : " z-galerija__opis--skupljen")
                                            }
                                        >
                                            <p
                                                dangerouslySetInnerHTML={{
                                                    __html: opisTekst.replace(/\n/g, "<br/>"),
                                                }}
                                            ></p>
                                        </div>
                                        <button
                                            type="button"
                                            className="z-galerija__vise"
                                            aria-expanded={this.state.opisOtvoren}
                                            onClick={() =>
                                                this.setState({
                                                    opisOtvoren: !this.state.opisOtvoren,
                                                })
                                            }
                                        >
                                            {this.state.opisOtvoren
                                                ? "Prikaži manje".translate(this.props.lang)
                                                : "Prikaži više".translate(this.props.lang)}
                                        </button>
                                    </>
                                ) : null}
                            </div>

                            {/* ── radnje ──────────────────────────────── */}
                            <div className="z-galerija__radnje">
                                <div
                                    className="z-galerija__radnja-grupa"
                                    ref={this.deljenjeRef}
                                >
                                    <button
                                        type="button"
                                        className="z-galerija__radnja"
                                        aria-expanded={this.state.deljenjeOtvoreno}
                                        onClick={() =>
                                            this.setState({
                                                deljenjeOtvoreno: !this.state.deljenjeOtvoreno,
                                            })
                                        }
                                    >
                                        <Isvg src={picture} />
                                        {"Podijeli".translate(this.props.lang)}
                                    </button>

                                    {this.state.deljenjeOtvoreno &&
                                    typeof window !== "undefined" ? (
                                        <div className="z-galerija__panel-deljenje">
                                            <FacebookShareButton url={window.location.href}>
                                                <FacebookIcon size={32} round />
                                            </FacebookShareButton>
                                            <TwitterShareButton url={window.location.href}>
                                                <TwitterIcon size={32} round />
                                            </TwitterShareButton>
                                            <LinkedinShareButton url={window.location.href}>
                                                <LinkedinIcon size={32} round />
                                            </LinkedinShareButton>
                                            <TelegramShareButton url={window.location.href}>
                                                <TelegramIcon size={32} round />
                                            </TelegramShareButton>
                                            <ViberShareButton url={window.location.href}>
                                                <ViberIcon size={32} round />
                                            </ViberShareButton>
                                            <WhatsappShareButton url={window.location.href}>
                                                <WhatsappIcon size={32} round />
                                            </WhatsappShareButton>
                                            <EmailShareButton url={window.location.href}>
                                                <EmailIcon size={32} round />
                                            </EmailShareButton>
                                        </div>
                                    ) : null}
                                </div>

                                <button
                                    type="button"
                                    className="z-galerija__radnja"
                                    onClick={() => window.print()}
                                >
                                    <Isvg src={imagesCount} />
                                    {"Štampaj".translate(this.props.lang)}
                                </button>

                                {/* Izmena i brisanje — nepromenjena prava i pozivi,
                                    samo u istom tihom izgledu kao ostale radnje. */}
                                {mozeIzmena ? (
                                    <>
                                        <Link
                                            className="z-galerija__radnja"
                                            to={
                                                this.props.uData.userRole == "admin"
                                                    ? `/account/gallery-photographer/${gallery.uid}/${gallery._id}`
                                                    : `/account/gallery/${gallery._id}`
                                            }
                                        >
                                            <Isvg src={penIcon} />
                                            {"Izmijeni".translate(this.props.lang)}
                                        </Link>
                                        <button
                                            type="button"
                                            className="z-galerija__radnja"
                                            onClick={() => {
                                                this.props.handleDelete(() => {
                                                    fetch(
                                                        this.props.uData.userRole == "admin"
                                                            ? `${API_ENDPOINT}/gallery/photographer/delete/${gallery.uid}/${gallery._id}`
                                                            : `${API_ENDPOINT}/gallery/delete/` +
                                                                  gallery._id,
                                                        {
                                                            method: "DELETE",
                                                            headers: {
                                                                Accept: "application/json",
                                                                Authorization: `Bearer ${localStorage.getItem(
                                                                    "authToken"
                                                                )}`,
                                                            },
                                                        }
                                                    )
                                                        .then((res) => res.text())
                                                        .then(() => {
                                                            this.props[0].history.push("/");
                                                        });
                                                });
                                            }}
                                        >
                                            <Isvg src={trashIcon} />
                                            {"Obriši".translate(this.props.lang)}
                                        </button>
                                    </>
                                ) : null}
                            </div>
                        </div>
                    </Container>
                </div>

                {/* ── mreža fotografija ───────────────────────────────── */}
                <section className="section-detail">
                    <Container>
                        {brojFotografija ? (
                            <>
                                <div className="z-galerija__traka-mreze">
                                    <span className="z-galerija__broj-fotografija">
                                        {brojFotografija}{" "}
                                        {"fotografija".translate(this.props.lang)}
                                    </span>

                                    {brojFotografija > 1 ? (
                                        <button
                                            type="button"
                                            className="z-galerija__redosled"
                                            onClick={() =>
                                                this.setState({
                                                    obrnutRedosled: !this.state.obrnutRedosled,
                                                })
                                            }
                                        >
                                            {this.state.obrnutRedosled
                                                ? "Od poslednje ka prvoj".translate(this.props.lang)
                                                : "Od prve ka poslednjoj".translate(this.props.lang)}
                                        </button>
                                    ) : null}
                                </div>

                                <div className="z-galerija__mreza">
                                    {poredaneFotografije.map(({ item, idx }) => (
                                        <button
                                            type="button"
                                            className="z-galerija__foto"
                                            key={idx}
                                            aria-label={`${"Fotografija".translate(
                                                this.props.lang
                                            )} ${idx + 1}`}
                                            onClick={(e) => {
                                                // Mesto u MREŽI, ne u galeriji —
                                                // po njemu se skrol vraća tačno
                                                // ovde kad se prozor zatvori.
                                                this.otvorenoSa = [
                                                    ...e.currentTarget.parentNode.children,
                                                ].indexOf(e.currentTarget);
                                                this.setState({
                                                    modalOpen: true,
                                                    selectedImageIndex: idx,
                                                    ostraStigla: false,
                                                });
                                                this.fetchGalleryTrack(idx);
                                                this.pretovariSusedne(idx);
                                            }}
                                        >
                                            <img
                                                src={`${PHOTOS_ENDPOINT}/photos/350x/${item.image}`}
                                                srcSet={`${PHOTOS_ENDPOINT}/photos/350x/${item.image} 350w, ${PHOTOS_ENDPOINT}/photos/700x/${item.image} 700w`}
                                                sizes="(max-width: 767px) 50vw, (max-width: 1439px) 33vw, 25vw"
                                                alt={item.description || ""}
                                                loading="lazy"
                                                decoding="async"
                                            />

                                            <span className="z-galerija__preko">
                                                <span className="z-galerija__redni-broj">
                                                    {idx + 1}
                                                </span>
                                                {/* Obe radnje otvaraju isti prozor:
                                                    kupovina traži izbor rezolucije, a
                                                    on živi tamo — logika korpe se ne
                                                    dira. */}
                                                <span className="z-galerija__foto-radnje">
                                                    <span className="z-galerija__foto-dugme">
                                                        <Isvg src={searchIcon} />
                                                    </span>
                                                    <span className="z-galerija__foto-dugme">
                                                        <Isvg src={download} />
                                                    </span>
                                                </span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="z-galerija__prazno">
                                {"Ova galerija još nema fotografija.".translate(
                                    this.props.lang
                                )}
                            </p>
                        )}

                        {/* ── iz iste kategorije ──────────────────────── */}
                        {this.state.srodne && this.state.srodne.length ? (
                            <div className="z-galerija__srodne">
                                <h2 className="z-galerija__srodne-naslov">
                                    {"Iz iste kategorije".translate(this.props.lang)}
                                </h2>
                                <Row className="articles">
                                    {this.state.srodne.map((srodna, idx) => (
                                        <Col lg="3" md="4" xs="6" key={idx}>
                                            <Article
                                                _id={srodna._id}
                                                categoryName={Object.translate(srodna, "categoryName", this.props.lang)}
                                                image={srodna.photos && srodna.photos[0] && srodna.photos[0].image}
                                                name={Object.translate(srodna, "name", this.props.lang)}
                                                shortDescription={Object.translate(srodna, "description", this.props.lang)}
                                                alias={Object.translate(srodna, "alias", this.props.lang)}
                                                userAlias={srodna.userAlias}
                                                imagesCount={srodna.photosCount !== undefined ? srodna.photosCount : (srodna.photos && srodna.photos.length)}
                                                location={srodna.location}
                                                published={srodna.date}
                                                homeArticle
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        ) : null}
                    </Container>
                </section>

                {content}

                <section className="section-banners">
                    <Container>
                        <Row>
                            <Col lg="12" className="banners">
                                {this.props.detailBanner
                                    ? this.props.detailBanner.images.map(
                                          (item, idx) => {
                                              return (
                                                  <a
                                                      key={idx}
                                                      href={item.link}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      onClick={() =>
                                                          this.props.bannerClick(item.link)
                                                      }
                                                  >
                                                      <img src={item.image} className="banner" alt="" />
                                                  </a>
                                              );
                                          }
                                      )
                                    : null}
                            </Col>
                        </Row>
                    </Container>
                </section>
            </div>
        );
    }
}

export default Page(DetailPage);
