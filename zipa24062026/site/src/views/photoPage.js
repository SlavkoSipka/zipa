import React, { Component } from "react";
import { Link, Redirect } from "react-router-dom";
import Isvg from "react-inlinesvg";
import Page from "../containers/page";
import { Container, Row, Col } from "reactstrap";
import moment from "moment";

import searchIcon from "../assets/svg/search-icon-btn.svg";
import picture from "../assets/svg/picture-icon.svg";
import imagesCount from "../assets/svg/images-count.svg";
import download from "../assets/svg/download.svg";
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
import { API_ENDPOINT } from "../constants";

class PhotoPage extends Component {
    constructor(props) {
        super(props);
        this.init = this.init.bind(this);
        this.selectedImage = this.selectedImage.bind(this);
        this.nextImage = this.nextImage.bind(this);
        this.previousImage = this.previousImage.bind(this);
        this.toggleModal = this.toggleModal.bind(this);

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
                                const numberOfImages = gallery.photos.length;
                                this.setState({ imagesInGallery: numberOfImages });
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
        const imageUrl = window.location.pathname;
        let imageIndex = parseInt(imageUrl.split("/").pop());
        return imageIndex;
    }

    nextImage() {
        const selectedImage = this.selectedImage();
        const { history } = this.props;
        const nextImage = selectedImage + 1;
        const numberOfImages = this.state.gallery ? this.state.gallery.photos.length : 0;
        const { pathname } = this.props.location;

        if (nextImage >= numberOfImages) {
            history.replace(`${pathname.replace(/\/\d+$/, "")}/0`);
        } else {
            history.replace(`${pathname.replace(/\d+$/, "")}${nextImage}`);
        }
    }

    previousImage() {
        const selectedImage = this.selectedImage();
        const { history } = this.props;
        const previousImage = selectedImage - 1;
        const numberOfImages = this.state.gallery ? this.state.gallery.photos.length : 0;
        const { pathname } = this.props.location;

        if (previousImage < 0) {
            history.replace(`${pathname.replace(/\/\d+$/, "")}/${numberOfImages - 1}`);
        } else {
            history.replace(`${pathname.replace(/\d+$/, "")}${previousImage}`);
        }
    }

    numberOfImages() {
        const numberOfImages = this.state.gallery.photos.length;
        if (numberOfImages > 1) {
            this.setState({ singleImage: true });
        }
    }

    toggleModal() {
        this.setState((prevState) => ({
            modalOpen: !prevState.modalOpen,
        }));
    }

    render() {
        let gallery = this.state.gallery ? this.state.gallery : { photos: [] };
        const { modalOpen } = this.state;
        let priceMap = {
            3000: 1,
            1500: 0.5,
            800: 0.15,
        };

        const numberOfImages = gallery.photos ? gallery.photos.length : 0;
        const singleImage = numberOfImages > 1;

        if (singleImage !== this.state.singleImage) {
            this.setState({ singleImage });
        }

        if (gallery.error == "notfound") {
            return <Redirect to="/404"></Redirect>;
        }
        return (
            <div className="detail-wrap">
                <div className="into-wrap">
                    <Container>
                        <Row>
                            <Col lg="6">
                                <h2>{this.state.category && this.state.category.breadcrumb ? this.state.category.name : "Pregled galerija".translate(this.props.lang)}</h2>
                                {/*<h2>57.000 {'fotografija u ponudi'.translate(this.props.lang)}</h2>*/}
                            </Col>
                            <Col lg={{ size: 6 }}>
                                <div className="search-wrap">
                                    <Isvg src={picture} />
                                    <input
                                        type="text"
                                        placeholder={"Unesite pojam za pretragu".translate(this.props.lang)}
                                        value={this.state.search}
                                        onChange={(e) => this.setState({ search: e.target.value })}
                                        onKeyUp={(e) => {
                                            if (e.keyCode == 13) {
                                                e.preventDefault();
                                                this.props[0].history.push(`/galerije?search=${encodeURIComponent(this.state.search)}`);
                                            }
                                        }}
                                    />
                                    <button
                                        className="button"
                                        onClick={() => {
                                            this.props[0].history.push(`/galerije?search=${encodeURIComponent(this.state.search)}`);
                                        }}
                                    >
                                        <Isvg src={searchIcon} /> {"PRETRAŽI".translate(this.props.lang)}{" "}
                                    </button>
                                </div>
                                <a onClick={() => this.props.handleDetailSearch(true)} className="detail-search">
                                    {"Napredna pretraga".translate(this.props.lang)}
                                </a>
                            </Col>
                        </Row>
                    </Container>
                </div>

                <a ref={(node) => (this.aTag = node)}></a>
                <section className="section-detail">
                    <Container>
                        <Row>
                            <Col lg="7">
                                <h1>{Object.translate(gallery, "name", this.props.lang)}</h1>
                                <div className="info">
                                    <div>Fotograf: {Object.get(gallery, "user")}</div>
                                    <div>
                                        {Object.get(gallery, "location")} | {moment.unix(Object.get(gallery, "date")).format("DD.MM.YYYY.")}
                                        <Isvg src={imagesCount} /> {gallery.photos && gallery.photos.length}
                                    </div>
                                </div>
                            </Col>
                            <Col lg={{ size: 5, offset: 0 }} sm={{ size: 6, offset: 6 }}>
                                <p className="share-desc">{"Hvala Vam što ste objavu podijelili na:".translate(this.props.lang)}</p>
                                {typeof window !== "undefined" ? (
                                    <div className="share-actions">
                                        <FacebookShareButton url={window.location.href}>
                                            {" "}
                                            <FacebookIcon size={48} />
                                        </FacebookShareButton>
                                        <TwitterShareButton url={window.location.href}>
                                            <TwitterIcon size={48} />
                                        </TwitterShareButton>
                                        <LinkedinShareButton url={window.location.href}>
                                            <LinkedinIcon size={48} />
                                        </LinkedinShareButton>
                                        <TelegramShareButton url={window.location.href}>
                                            <TelegramIcon size={48} />
                                        </TelegramShareButton>
                                        <EmailShareButton url={window.location.href}>
                                            <EmailIcon size={48} />
                                        </EmailShareButton>
                                        <ViberShareButton url={window.location.href}>
                                            <ViberIcon size={48} />
                                        </ViberShareButton>
                                        <WhatsappShareButton url={window.location.href}>
                                            <WhatsappIcon size={48} />
                                        </WhatsappShareButton>
                                    </div>
                                ) : null}
                            </Col>

                            <Col lg="7" className="preview-image">
                                {this.state.singleImage ? (
                                    <div className="arrow-border left" onClick={this.previousImage}>
                                        <div className="arrow-left"></div>
                                    </div>
                                ) : null}
                                <img src={`${API_ENDPOINT}/photos/700x/${Object.get(gallery, `photos[${this.props[0].match.params.photo}].image`)}`} />
                                {this.state.singleImage ? (
                                    <div className="arrow-border right" onClick={this.nextImage}>
                                        <div className="arrow-right"></div>
                                    </div>
                                ) : null}
                            </Col>
                            <Col lg="5">
                                <div className="resolutions">
                                    {Object.get(gallery, `photos[${this.props[0].match.params.photo}].width`) >= 1500 ? (
                                        <button className={this.state.resolution === 3000 ? "active" : ""} onClick={() => this.setState({ resolution: 3000 })}>
                                            <span>3000 px</span>
                                            <span> {gallery.price ? gallery.price.formatPrice(2) : "/"} KM </span>
                                        </button>
                                    ) : null}
                                    {Object.get(gallery, `photos[${this.props[0].match.params.photo}].width`) >= 801 ? (
                                        <button className={this.state.resolution === 1500 ? "active" : ""} onClick={() => this.setState({ resolution: 1500 })}>
                                            <span>1500 px</span>
                                            <span>{gallery.price ? (gallery.price * priceMap[1500]).formatPrice(2) : "/"} KM</span>
                                        </button>
                                    ) : null}
                                    {Object.get(gallery, `photos[${this.props[0].match.params.photo}].width`) >= 0 ? (
                                        <button className={this.state.resolution === 800 ? "active" : ""} onClick={() => this.setState({ resolution: 800 })}>
                                            <span>800 px</span>
                                            <span>{gallery.price ? (gallery.price * priceMap[800]).formatPrice(2) : "/"} KM</span>
                                        </button>
                                    ) : null}
                                </div>

                                {Object.get(gallery, `photos[${this.props[0].match.params.photo}].originalIsOnServer`) ? (
                                    this.state.allowedResolutions && this.state.allowedResolutions[`resolution${this.state.resolution}px`] ? (
                                        <button
                                            className="download-btn"
                                            // onClick={() => {
                                            //     this.props.addToCart(gallery, this.props[0].match.params.photo, this.state.resolution)
                                            //     console.log('TESTIRANJE IZ STARE GALERIJE: ', this.props.addToCart(gallery, this.props[0].match.params.photo, this.state.resolution))

                                            // }}
                                            onClick={() => {
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
                                                            a.href = result.image; //Image Base64 Goes here
                                                            a.download = gallery.photos[this.props[0].match.params.photo].image.split("/").pop(); //File name Here
                                                            a.click(); //Downloaded file
                                                        }
                                                    });
                                            }}
                                        >
                                            <Isvg src={download} />
                                            {"PREUZMI FOTOGRAFIJU".translate(this.props.lang)}
                                        </button>
                                    ) : (
                                        <button
                                            className="download-btn"
                                            onClick={() => {
                                                if (this.props.uData) this.props.addToCart(gallery, this.props[0].match.params.photo, this.state.resolution);
                                                else this.props[0].history.push("/login");
                                            }}
                                        >
                                            <Isvg src={download} />
                                            {"KUPI FOTOGRAFIJU".translate(this.props.lang)}
                                        </button>
                                    )
                                ) : (
                                    <p className="original-not-found">
                                        {"Za kupovinu ili preuzimanje ove fotografije molimo Vas kontaktirajte nas putem telefona +387.66.00.11.22 ili na e-mail "}
                                        <a href="mailto:info@zipaphoto.net">info@zipaphoto.net</a>
                                    </p>
                                )}

                                <Row className="attrs">
                                    <Col lg="12">
                                        <h6>{"NAZIV".translate(this.props.lang)}</h6>
                                        <p>{Object.get(gallery, `photos[${this.props[0].match.params.photo}].name`)}</p>
                                    </Col>
                                    <Col lg="6" sm="6">
                                        <h6>{"DIMENZIJA".translate(this.props.lang)}</h6>
                                        <p>
                                            {" "}
                                            {Object.get(gallery, `photos[${this.props[0].match.params.photo}].width`)}x
                                            {Object.get(gallery, `photos[${this.props[0].match.params.photo}].height`)}{" "}
                                        </p>
                                    </Col>
                                    <Col lg="6" sm="6">
                                        <h6>{"LOKACIJA".translate(this.props.lang)}</h6>
                                        <p>
                                            {Object.get(gallery, `photos[${this.props[0].match.params.photo}].location`)
                                                ? Object.get(gallery, `photos[${this.props[0].match.params.photo}].location`)
                                                : Object.get(gallery, "location")}
                                        </p>
                                    </Col>
                                    <Col lg="6" sm="6">
                                        <h6>{"Fotografisano".translate(this.props.lang)}</h6>
                                        <p>{moment.unix(Object.get(gallery, `photos[${this.props[0].match.params.photo}].date`)).format("DD.MM.YYYY")}</p>
                                    </Col>
                                    <Col lg="6" sm="6">
                                        <h6>{"Autor".translate(this.props.lang)}</h6>
                                        <p>{Object.get(gallery, `photos[${this.props[0].match.params.photo}].author`)}</p>
                                    </Col>
                                    <Col lg="6" sm="6">
                                        <h6>{"Caption writer".translate(this.props.lang)}</h6>
                                        <p>{Object.get(gallery, `photos[${this.props[0].match.params.photo}].captionWriter`)}</p>
                                    </Col>
                                    <Col lg="6" sm="6">
                                        <h6>{"Copyright".translate(this.props.lang)}</h6>
                                        <p>{Object.get(gallery, `photos[${this.props[0].match.params.photo}].copyright`)}</p>
                                    </Col>
                                </Row>
                            </Col>

                            <Col lg="12">
                                <div className="description">
                                    <h6>{Object.translate(gallery, "name", this.props.lang)}</h6>
                                    <p
                                        dangerouslySetInnerHTML={{
                                            __html: Object.translate(gallery, "description", this.props.lang)
                                                ? Object.translate(gallery, "description", this.props.lang).replace(/\n/g, "<br/>")
                                                : null,
                                        }}
                                    ></p>
                                </div>
                            </Col>

                            {gallery.photos &&
                                gallery.photos.map((item, idx) => {
                                    return (
                                        <Col lg="3" sm="4" xs="6" key={idx}>
                                            <Link to={`/galerija/${Object.translate(gallery, "alias", this.props.lang)}/${gallery._id}/${idx}`}>
                                                <article>
                                                    <img src={`${API_ENDPOINT}/photos/350x/` + item.image} />
                                                    <div className="zoom-image">
                                                        <img src={`${API_ENDPOINT}/photos/350x/` + item.image} />
                                                    </div>
                                                </article>
                                            </Link>
                                        </Col>
                                    );
                                })}
                        </Row>
                    </Container>
                </section>

                <section className="section-banners">
                    <Container>
                        <Row>
                            <Col lg="12" className="banners">
                                {this.props.detailBanner
                                    ? this.props.detailBanner.images.map((item, idx) => {
                                          return (
                                              <a href={item.link} target="_blank" onClick={() => this.props.bannerClick(item.link)}>
                                                  <img src={item.image} className="banner" />
                                              </a>
                                          );
                                      })
                                    : null}
                            </Col>
                        </Row>
                    </Container>
                </section>
            </div>
        );
    }
}

export default Page(PhotoPage);
