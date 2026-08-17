import React, { Component } from "react";
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
        };
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
    }

    componentWillUnmount() {
        // Clean up event listener
        window.removeEventListener("resize", this.updateScreenWidth);
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
        this.setState({ selectedImageIndex: nextIndex }, () => {
            this.fetchGalleryTrack(nextIndex);
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
        this.setState({ selectedImageIndex: prevIndex }, () => {
            this.fetchGalleryTrack(prevIndex);
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

        if (this.state.modalOpen && this.state.galleryContent) {
            content = (
                <Modal
                    isOpen={this.state.modalOpen}
                    toggle={this.toggleModal}
                    backdrop={"static"}
                    centered={true}
                    size={"lg"}
                    scrollable={true}
                    className={"customWidth"}
                >
                    <ModalHeader toggle={this.toggleModal} close={buttonClose}>
                        <div className={"headerContent"}>
                            <div className={"titleWrapper"}>
                                <h1>{galleryContent.name?.ba}</h1>
                                <p>
                                    {selectedImage.date ? (
                                        <p>
                                            {moment
                                                .unix(`${selectedImage.date}`)
                                                .format("DD.MM.YYYY HH:MM:ss")}
                                        </p>
                                    ) : null}
                                </p>
                            </div>
                            <div
                                className={`${
                                    this.state.isMobile
                                        ? "displayNone"
                                        : "navigationWrapper"
                                }`}
                            >
                                <button
                                    className={"navigationButton"}
                                    onClick={() => {
                                        this.handlePreviousImage();
                                    }}
                                >
                                    {"<"}
                                </button>
                                <button
                                    className={"navigationButton"}
                                    onClick={() => {
                                        this.handleNextImage();
                                    }}
                                >
                                    {">"}
                                </button>
                            </div>
                        </div>
                    </ModalHeader>
                    <ModalBody
                        className={`${
                            this.state.isMobile ? "customPaddingModal" : ""
                        }`}
                    >
                        <div className={"imageContainer"}>
                            <div className={"imagesWrapper"}>
                                <img
                                    src={`${PHOTOS_ENDPOINT}/photos/700x/${selectedImage.image}`}
                                    alt={selectedImage.name}
                                />
                            </div>
                            <div
                                className={`${
                                    this.state.isMobile
                                        ? "navigationWrapperMobile"
                                        : "displayNone"
                                }`}
                            >
                                <button
                                    className={"navigationButton"}
                                    onClick={() => {
                                        this.handlePreviousImage();
                                    }}
                                >
                                    {"<"}
                                </button>
                                <button
                                    className={"navigationButton"}
                                    onClick={() => {
                                        this.handleNextImage();
                                    }}
                                >
                                    {">"}
                                </button>
                            </div>
                            <div className={"imagesButtons"}>
                                {/*
                                  * Arhivske galerije nemaju fiksnu cijenu — umjesto
                                  * iznosa i dugmeta za kupovinu nudi se slanje upita.
                                  */}
                                {galleryContent.priceOnRequest ? (
                                    <PriceInquiry
                                        lang={this.props.lang}
                                        galleryId={galleryContent._id}
                                        photoId={selectedImageIndex}
                                        resolution={this.state.resolution}
                                    />
                                ) : (
                                <>
                                <div>
                                    {selectedImage.width >= 1500 ? (
                                        <button
                                            className={
                                                this.state.resolution === 3000
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                this.setState({
                                                    resolution: 3000,
                                                })
                                            }
                                        >
                                            <span>3000 px</span>
                                            <span>
                                                {galleryContent.price
                                                    ? galleryContent.price.formatPrice(
                                                          2
                                                      )
                                                    : "0"}{" "}
                                                KM
                                            </span>
                                        </button>
                                    ) : null}
                                    {selectedImage.width >= 801 ? (
                                        <button
                                            className={
                                                this.state.resolution === 1500
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                this.setState({
                                                    resolution: 1500,
                                                })
                                            }
                                        >
                                            <span>1500 px</span>
                                            <span>
                                                {galleryContent.price
                                                    ? (
                                                          galleryContent.price *
                                                          priceMap[1500]
                                                      ).formatPrice(2)
                                                    : "0"}{" "}
                                                KM
                                            </span>
                                        </button>
                                    ) : null}
                                    {selectedImage.width >= 0 ? (
                                        <button
                                            className={
                                                this.state.resolution === 800
                                                    ? "active"
                                                    : ""
                                            }
                                            onClick={() =>
                                                this.setState({
                                                    resolution: 800,
                                                })
                                            }
                                        >
                                            <span>800 px</span>
                                            <span>
                                                {galleryContent.price
                                                    ? (
                                                          galleryContent.price *
                                                          priceMap[800]
                                                      ).formatPrice(2)
                                                    : "0"}{" "}
                                                KM
                                            </span>
                                        </button>
                                    ) : null}
                                </div>
                                <div className={"downloadingButtonAndText"}>
                                    {galleryContent.price === 0 ? (
                                        <button
                                            className="download-btn"
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
                                                            a.href =
                                                                result.image; //Image Base64 Goes here
                                                            a.download =
                                                                selectedImage.name; //File name Here
                                                            a.click(); //Downloaded file
                                                        }
                                                    });
                                            }}
                                        >
                                            <Isvg src={download} />
                                            {"PREUZMI FOTOGRAFIJU".translate(
                                                this.props.lang
                                            )}
                                        </button>
                                    ) : selectedImage.originalIsOnServer ? (
                                        this.state.allowedResolutions &&
                                        this.state.allowedResolutions[
                                            `resolution${this.state.resolution}px`
                                        ] ? (
                                            <button
                                                className="download-btn"
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
                                                        .then((res) =>
                                                            res.json()
                                                        )
                                                        .then((result) => {
                                                            if (result.image) {
                                                                var a =
                                                                    this.aTag;
                                                                a.href =
                                                                    result.image; //Image Base64 Goes here
                                                                a.download =
                                                                    selectedImage.name; //File name Here
                                                                a.click(); //Downloaded file
                                                            }
                                                        });
                                                }}
                                            >
                                                <Isvg src={download} />
                                                {"PREUZMI FOTOGRAFIJU".translate(
                                                    this.props.lang
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                className="download-btn"
                                                onClick={() => {
                                                    if (this.props.uData)
                                                        this.props.addToCart(
                                                            galleryContent,
                                                            selectedImageIndex,
                                                            this.state
                                                                .resolution
                                                        );
                                                    else
                                                        this.props[0].history.push(
                                                            "/login"
                                                        );
                                                }}
                                            >
                                                <Isvg src={download} />
                                                {"KUPI FOTOGRAFIJU".translate(
                                                    this.props.lang
                                                )}
                                            </button>
                                        )
                                    ) : (
                                        <p className="original-not-found">
                                            {
                                                "Za kupovinu ili preuzimanje ove fotografije molimo Vas kontaktirajte nas putem telefona +387.66.00.11.22 ili na e-mail "
                                            }
                                            <a href="mailto:info@zipaphoto.net">
                                                info@zipaphoto.net
                                            </a>
                                        </p>
                                    )}
                                    <a ref={(node) => (this.aTag = node)}></a>
                                </div>
                                </>
                                )}
                            </div>
                            <div className={"imagesDescription"}>
                                <p
                                    dangerouslySetInnerHTML={{
                                        __html: Object.translate(
                                            gallery,
                                            "description",
                                            this.props.lang
                                        )
                                            ? Object.translate(
                                                  gallery,
                                                  "description",
                                                  this.props.lang
                                              ).replace(/\n/g, "<br/>")
                                            : null,
                                    }}
                                ></p>
                                <div className={"imagesDescriptionWrapper"}>
                                    <div className={"descriptionHeader"}>
                                        <div>
                                            <h6>NAZIV</h6>
                                            <p>{`${selectedImage.name}`}</p>
                                        </div>
                                    </div>
                                    <div className={"descriptionLeft"}>
                                        <div>
                                            <h6>DIMENZIJA</h6>
                                            <p>{`${selectedImage.width}x${selectedImage.height}`}</p>
                                        </div>
                                        <div>
                                            <h6>Fotografisano</h6>
                                            {selectedImage.date ? (
                                                <p>
                                                    {moment
                                                        .unix(
                                                            `${selectedImage.date}`
                                                        )
                                                        .format("DD.MM.YYYY")}
                                                </p>
                                            ) : null}
                                        </div>
                                        <div>
                                            <h6>Caption writer</h6>
                                            {selectedImage.captionWriter ? (
                                                <p>{`${selectedImage.captionWriter}`}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className={"descriptionRight"}>
                                        <div className={"rightText"}>
                                            <h6>LOKACIJA</h6>
                                            {galleryContent.location ? (
                                                <p>{`${galleryContent.location}`}</p>
                                            ) : null}
                                        </div>
                                        <div className={"rightText"}>
                                            <h6>AUTOR</h6>
                                            {selectedImage.author ? (
                                                <p>{`${selectedImage.author}`}</p>
                                            ) : null}
                                        </div>
                                        <div className={"rightText"}>
                                            <h6>Copyright</h6>
                                            {selectedImage.copyright ? (
                                                <p>{`${selectedImage.copyright}`}</p>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </ModalBody>
                </Modal>
            );
        }

        let buttonClose = null;

        buttonClose = (
            <button
                className={"photoModalCloseButton"}
                onClick={this.toggleModal}
            >
                &times;
            </button>
        );

        return (
            <div className="detail-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6">
                                <h2>
                                    {this.state.category &&
                                    this.state.category.breadcrumb
                                        ? this.state.category.name
                                        : "Pregled galerija".translate(
                                              this.props.lang
                                          )}
                                </h2>
                                {/*<h2>57.000 {'fotografija u ponudi'.translate(this.props.lang)}</h2>*/}
                            </Col>
                            <Col lg={{ size: 6 }}>
                                <div className="search-wrap">
                                    <Isvg src={picture} />
                                    <input
                                        type="text"
                                        placeholder={"Unesite pojam za pretragu".translate(
                                            this.props.lang
                                        )}
                                        value={this.state.search}
                                        onChange={(e) =>
                                            this.setState({
                                                search: e.target.value,
                                            })
                                        }
                                        onKeyUp={(e) => {
                                            if (e.keyCode == 13) {
                                                e.preventDefault();
                                                this.props[0].history.push(
                                                    `/galerije?search=${encodeURIComponent(
                                                        this.state.search
                                                    )}`
                                                );
                                            }
                                        }}
                                    />
                                    <button
                                        className="button"
                                        onClick={() => {
                                            this.props[0].history.push(
                                                `/galerije?search=${encodeURIComponent(
                                                    this.state.search
                                                )}`
                                            );
                                        }}
                                    >
                                        <Isvg src={searchIcon} />{" "}
                                        {"PRETRAŽI".translate(this.props.lang)}{" "}
                                    </button>
                                </div>
                                <a
                                    onClick={() =>
                                        this.props.handleDetailSearch(true)
                                    }
                                    className="detail-search"
                                >
                                    {"Napredna pretraga".translate(
                                        this.props.lang
                                    )}
                                </a>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <section className="section-detail">
                    <Container>
                        <Row>
                            <Col lg="7" sm="12">
                                {/* <Button onClick={this.toggleModal}>
                                    Click me
                                </Button>
                                <Modal
                                    isOpen={this.state.modalOpen}
                                    toggle={this.toggleModal}
                                    backdrop={"static"}
                                    centered={true}
                                    fullscreen={true}
                                >
                                    <ModalHeader
                                        toggle={this.toggleModal}
                                        close={buttonClose}
                                    >
                                        Nemam blage stae ovo
                                    </ModalHeader>
                                    <ModalBody>
                                        Lorem ipsum dolor sit amet, consectetur
                                        adipisicing elit, sed do eiusmod tempor
                                        incididunt ut labore et dolore magna
                                        aliqua. Ut enim ad minim veniam, quis
                                        nostrud exercitation ullamco laboris
                                        nisi ut aliquip ex ea commodo consequat.
                                        Duis aute irure dolor in reprehenderit
                                        in voluptate velit esse cillum dolore eu
                                        fugiat nulla pariatur. Excepteur sint
                                        occaecat cupidatat non proident, sunt in
                                        culpa qui officia deserunt mollit anim
                                        id est laborum.
                                    </ModalBody>
                                </Modal> */}
                                <h1>
                                    {Object.translate(
                                        gallery,
                                        "name",
                                        this.props.lang
                                    )}
                                </h1>
                                <div className="info">
                                    <div>
                                        {"Fotograf:".translate(this.props.lang)}{" "}
                                        {Object.get(gallery, "user")}
                                    </div>
                                    <div>
                                        {Object.get(gallery, "location")} |{" "}
                                        {moment
                                            .unix(Object.get(gallery, "date"))
                                            .format("DD.MM.YYYY.")}
                                        <Isvg src={imagesCount} />{" "}
                                        {gallery.photos &&
                                            gallery.photos.length}
                                    </div>
                                </div>
                            </Col>
                            <Col
                                lg={{ size: 5, offset: 0 }}
                                sm={{ size: 6, offset: 6 }}
                            >
                                <p className="share-desc">
                                    {"Hvala Vam što ste objavu podijelili na:".translate(
                                        this.props.lang
                                    )}
                                </p>
                                {typeof window !== "undefined" ? (
                                    <div className="share-actions">
                                        <FacebookShareButton
                                            url={window.location.href}
                                        >
                                            {" "}
                                            <FacebookIcon size={48} />
                                        </FacebookShareButton>
                                        <TwitterShareButton
                                            url={window.location.href}
                                        >
                                            <TwitterIcon size={48} />
                                        </TwitterShareButton>
                                        <LinkedinShareButton
                                            url={window.location.href}
                                        >
                                            <LinkedinIcon size={48} />
                                        </LinkedinShareButton>
                                        <TelegramShareButton
                                            url={window.location.href}
                                        >
                                            <TelegramIcon size={48} />
                                        </TelegramShareButton>
                                        <EmailShareButton
                                            url={window.location.href}
                                        >
                                            <EmailIcon size={48} />
                                        </EmailShareButton>
                                        <ViberShareButton
                                            url={window.location.href}
                                        >
                                            <ViberIcon size={48} />
                                        </ViberShareButton>
                                        <WhatsappShareButton
                                            url={window.location.href}
                                        >
                                            <WhatsappIcon size={48} />
                                        </WhatsappShareButton>
                                    </div>
                                ) : null}
                            </Col>

                            <Col lg="12">
                                {(this.props.uData &&
                                    this.props.uData.userRole == "admin") ||
                                (this.props.uData &&
                                    this.props.uData.userRole ==
                                        "photographer" &&
                                    this.props.uData.permissions.indexOf(
                                        "*"
                                    ) !== -1) ? (
                                    <div className="acc-buttons">
                                        <Link
                                            to={`/account/gallery-photographer/${gallery.uid}/${gallery._id}`}
                                        >
                                            <button>
                                                <Isvg src={penIcon} />{" "}
                                                {"IZMJENI".translate(
                                                    this.props.lang
                                                )}
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                this.props.handleDelete(() => {
                                                    fetch(
                                                        `${API_ENDPOINT}/gallery/photographer/delete/${gallery.uid}/${gallery._id}`,
                                                        {
                                                            method: "DELETE",
                                                            headers: {
                                                                Accept: "application/json",
                                                                //'Content-Type': 'multipart/form-data',
                                                                Authorization: `Bearer ${localStorage.getItem(
                                                                    "authToken"
                                                                )}`,
                                                            },
                                                        }
                                                    )
                                                        .then((res) =>
                                                            res.text()
                                                        )
                                                        .then((img) => {
                                                            this.props[0].history.push(
                                                                "/"
                                                            );
                                                        });
                                                });
                                            }}
                                        >
                                            <Isvg src={trashIcon} />{" "}
                                            {"OBRIŠI".translate(
                                                this.props.lang
                                            )}
                                        </button>
                                    </div>
                                ) : null}
                                {this.props.uData &&
                                this.props.uData.userRole == "photographer" &&
                                this.props.uData._id == gallery.uid ? (
                                    <div className="acc-buttons">
                                        <Link
                                            to={`/account/gallery/${gallery._id}`}
                                        >
                                            <button>
                                                <Isvg src={penIcon} />{" "}
                                                {"IZMJENI".translate(
                                                    this.props.lang
                                                )}
                                            </button>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                this.props.handleDelete(() => {
                                                    fetch(
                                                        `${API_ENDPOINT}/gallery/delete/` +
                                                            gallery._id,
                                                        {
                                                            method: "DELETE",
                                                            headers: {
                                                                Accept: "application/json",
                                                                //'Content-Type': 'multipart/form-data',
                                                                Authorization: `Bearer ${localStorage.getItem(
                                                                    "authToken"
                                                                )}`,
                                                            },
                                                        }
                                                    )
                                                        .then((res) =>
                                                            res.text()
                                                        )
                                                        .then((img) => {
                                                            this.props[0].history.push(
                                                                "/"
                                                            );
                                                        });
                                                });
                                            }}
                                        >
                                            <Isvg src={trashIcon} />{" "}
                                            {"OBRIŠI".translate(
                                                this.props.lang
                                            )}
                                        </button>
                                    </div>
                                ) : null}

                                <div className="description">
                                    <p
                                        dangerouslySetInnerHTML={{
                                            __html: Object.translate(
                                                gallery,
                                                "description",
                                                this.props.lang
                                            )
                                                ? Object.translate(
                                                      gallery,
                                                      "description",
                                                      this.props.lang
                                                  ).replace(/\n/g, "<br/>")
                                                : null,
                                        }}
                                    ></p>
                                </div>
                            </Col>
                            {/*
                              * Biranje redosleda — vidljivo samo uz nove izglede.
                              * Fotografije stoje onako kako su snimljene, a ovim
                              * se okreće, kako je traženo po uzoru na Pixsell.
                              */}
                            {noviPrikaz && gallery.photos && gallery.photos.length > 1 ? (
                                <Col lg="12">
                                    <div className="red-fotografija">
                                        <span className="koliko">
                                            {gallery.photos.length} {'fotografija'.translate(this.props.lang)}
                                        </span>
                                        <button
                                            type="button"
                                            className="prekidac-reda"
                                            onClick={() => this.setState({ obrnutRedosled: !this.state.obrnutRedosled })}
                                        >
                                            {this.state.obrnutRedosled
                                                ? 'Od poslednje ka prvoj'.translate(this.props.lang)
                                                : 'Od prve ka poslednjoj'.translate(this.props.lang)}
                                        </button>
                                    </div>
                                </Col>
                            ) : null}

                            {gallery.photos &&
                                poredaneFotografije.map(({ item, idx }) => {
                                    return (
                                        <Col lg="3" sm="4" xs="6" key={idx}>
                                            {/*<Link*/}
                                            {/*    to={{*/}
                                            {/*        pathname: `/galerija/${Object.translate(gallery, 'alias', this.props.lang)}/${gallery._id}/${idx}`,*/}
                                            {/*        state: {gallery, lang: this.props.lang, isIframe: true, idx}*/}
                                            {/*    }}>*/}
                                            {/*    <article>*/}
                                            {/*        <img src={`${PHOTOS_ENDPOINT}/photos/350x/` + item.image}/>*/}
                                            {/*        <div className="zoom-image">*/}
                                            {/*            <img src={`${PHOTOS_ENDPOINT}/photos/350x/` + item.image}/>*/}

                                            {/*        </div>*/}
                                            {/*        <div className="zoom"><Isvg src={searchIcon}/></div>*/}
                                            {/*    </article>*/}
                                            {/*</Link>*/}

                                            {/*<article*/}
                                            {/*    onClick={() => this.setState({modalOpen: true, selectedImageIndex: idx})}>*/}
                                            {/*    <img src={`${PHOTOS_ENDPOINT}/photos/350x/` + item.image}/>*/}
                                            {/*    <div className="zoom-image">*/}
                                            {/*        <img src={`${PHOTOS_ENDPOINT}/photos/350x/` + item.image}/>*/}

                                            {/*    </div>*/}
                                            {/*    <div className="zoom"><Isvg src={searchIcon}/></div>*/}
                                            {/*</article>*/}

                                            <article
                                                onClick={() => {
                                                    this.setState({
                                                        modalOpen: true,
                                                        selectedImageIndex: idx,
                                                    });
                                                    this.fetchGalleryTrack(idx);
                                                }}
                                            >
                                                <img
                                                    src={`${PHOTOS_ENDPOINT}/photos/350x/${item.image}`}
                                                />
                                                <div className="zoom-image">
                                                    <img
                                                        src={`${PHOTOS_ENDPOINT}/photos/350x/${item.image}`}
                                                    />
                                                </div>
                                                <div className="zoom">
                                                    <Isvg src={searchIcon} />
                                                </div>

                                                {/* Redni broj i opis preko dna
                                                    fotografije — po uzoru koji
                                                    je klijent poslao. */}
                                                {noviPrikaz ? (
                                                    <>
                                                        <span className="redni-broj">{idx + 1}</span>
                                                        {item.description || item.name ? (
                                                            <div className="natpis">
                                                                {item.description || item.name}
                                                            </div>
                                                        ) : null}
                                                    </>
                                                ) : null}
                                            </article>
                                        </Col>
                                    );
                                })}
                        </Row>
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
                                                      href={item.link}
                                                      target="_blank"
                                                      onClick={() =>
                                                          this.props.bannerClick(
                                                              item.link
                                                          )
                                                      }
                                                  >
                                                      <img
                                                          src={item.image}
                                                          className="banner"
                                                      />
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
