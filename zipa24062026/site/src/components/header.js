import React, {Component} from 'react';
import {Link, Redirect} from 'react-router-dom';

import Isvg from 'react-inlinesvg';

/*header*/


import {
    Container,
    Row,
    Col,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    UncontrolledDropdown
} from 'reactstrap';


import cart from '../assets/svg/cart.svg';
import search from '../assets/svg/search.svg';
import accountIcon from '../assets/svg/user.svg';
import imagesCount from '../assets/svg/images-count.svg';

import ba from '../assets/images/basr.png';
import en from '../assets/images/en.png';
import filterIcon from '../assets/svg/filters.svg';
import PretragaSaPrijedlozima from './pretragaSaPrijedlozima';

class Header extends Component {
    constructor(props) {
        super(props);


        this.state = {
            yScroll: 0
        };
    }

    componentDidMount() {
        if (typeof window !== 'undefined')
            window.addEventListener('scroll', this.listenToScroll)
    }

    componentWillUnmount() {
        if (typeof window !== 'undefined')
            window.removeEventListener('scroll', this.listenToScroll)
    }

    pokreniPretragu = (pojam) => {
        const q = (pojam !== undefined ? pojam : this.state.search) || '';
        this.setState({search: q});
        this.props[0].history.push(`/galerije${q ? `?search=${encodeURIComponent(q)}` : ''}`);
    };

    listenToScroll = () => {
        const yScroll =
            document.body.scrollTop || document.documentElement.scrollTop
        if (this.leftBaner) {
            if (yScroll > window.document.body.scrollHeight - 581 - 20 - (window.innerHeight) - 80) {
                this.setState({
                    leftBannerSticky: true
                })
            } else {
                if (this.state.leftBannerSticky) {
                    this.setState({
                        leftBannerSticky: false
                    })
                }
            }
        }


        this.setState({
            yScroll: yScroll,
            scrollHeader: yScroll < this.state.yScroll,
        })
    }

    setLangBa = (e) => {
        e.preventDefault();
        this.props.setLang('ba');
    }

    setLangEn = (e) => {
        e.preventDefault();
        this.props.setLang('en');
    }


    render() {

        // Gornja plava traka pripada predlogu B. Levo naziv agencije, desno
        // jezik, cenovnik i prijava — krupnije i zbijenije, kako je traženo.
        const plavaTraka = this.props.settings && this.props.settings.homepageLayout === 'b';

        // U predlogu A meni je preoblikovan po vrsti sadržaja.
        const meniA = this.props.settings && this.props.settings.homepageLayout === 'a';

        return (
            <header
                className={
                    (this.state.yScroll > 20 && this.state.scrollHeader ? 'scroll-header' : this.state.yScroll < 20 ? '' : 'hide-header')
                    + (plavaTraka ? ' sa-trakom' : '')
                }>

                {plavaTraka ?
                    <div className="traka-vrh">
                        <Container>
                            <div className="traka-sadrzaj">
                                <span className="naziv">ZIPA AGENCY &ndash; Banja Luka</span>
                                <div className="veze">
                                    <button
                                        className={this.props.lang === 'ba' ? 'jezik izabran' : 'jezik'}
                                        onClick={this.setLangBa}>BA</button>
                                    <button
                                        className={this.props.lang === 'en' ? 'jezik izabran' : 'jezik'}
                                        onClick={this.setLangEn}>EN</button>
                                    {/*
                                      * Stranica „cjenovnik" još ne postoji u
                                      * administraciji. Dok je ne naprave, veza
                                      * se ne prikazuje — ranije je vodila na
                                      * praznu stranu. Čim strana bude
                                      * napravljena, veza se sama pojavi.
                                      */}
                                    {(this.props.pages || []).some(
                                        (s) => s && s.alias && (s.alias.ba === 'cjenovnik' || s.alias === 'cjenovnik')
                                    ) ? (
                                        <Link to="/page/cjenovnik">{'CJENOVNIK'.translate(this.props.lang)}</Link>
                                    ) : null}
                                    {this.props.uData ?
                                        <Link to="/account/profile">{'NALOG'.translate(this.props.lang)}</Link>
                                        :
                                        <>
                                            <Link to="/register">{'REGISTRUJ SE'.translate(this.props.lang)}</Link>
                                            <Link to="/login">{'PRIJAVI SE'.translate(this.props.lang)}</Link>
                                        </>
                                    }
                                </div>
                            </div>
                        </Container>
                    </div>
                    : null}

                {
                    this.props.uData && this.props.uData.userRole == 'photographer' && this.props.uData.permissions.indexOf('*') === -1 && (this.props[0].location.pathname.indexOf('/contact') == -1 && this.props[0].location.pathname.indexOf('/account') == -1 && this.props[0].location.pathname.indexOf('/page') == -1 && this.props[0].location.pathname.indexOf('/galerija') == -1) ?
                        <Redirect to={'/account/profile'}></Redirect>
                        :

                        null
                }
                {this.props.leftSideBanner ?
                    <div className="left-banner" style={this.state.leftBannerSticky ? {
                        position: 'fixed',
                        top: 'unset',
                        bottom: `${(this.state.yScroll - (window.document.body.scrollHeight - 581 - 20 - (window.innerHeight) - 80)) - 70}px`
                    } : null} ref={(node) => this.leftBaner = node}>
                        {
                            this.props.leftSideBanner.images.map((item, idx) => {
                                return (
                                    <a href={item.link} target="_blank"
                                       onClick={() => this.props.bannerClick(item.link)}>
                                        <img key={idx} src={item.image}/>
                                    </a>
                                )
                            })
                        }
                    </div>

                    :
                    null

                }
                {this.props.rightSideBanner ?
                    <div className="right-banner" style={this.state.leftBannerSticky ? {
                        position: 'fixed',
                        top: 'unset',
                        bottom: `${(this.state.yScroll - (window.document.body.scrollHeight - 581 - 20 - (window.innerHeight) - 80)) - 70}px`
                    } : null} ref={(node) => this.rightBanner = node}>
                        {
                            this.props.rightSideBanner.images.map((item, idx) => {
                                return (
                                    <a href={item.link} target="_blank"
                                       onClick={() => this.props.bannerClick(item.link)}>
                                        <img key={idx} src={item.image}/>
                                    </a>
                                )
                            })
                        }
                    </div>

                    :
                    null

                }

                <Container>
                    <Row>
                        <Col xs="2" sm="1"
                             className={this.state.mobileNavigation ? 'hamburger hamburger-animation' : 'hamburger'}>
                            <button onClick={() => this.setState({mobileNavigation: !this.state.mobileNavigation})}>
                                <div></div>
                                <div></div>
                                <div></div>
                            </button>
                        </Col>
                        <Col lg="4" xs="8" sm="4" className="logo">
                            {plavaTraka ?
                                /* U predlogu B natpis je razdvojen na dva dela sa
                                   zamenjenim bojama, kako je traženo. */
                                <Link to='/' className="desktop-logo logo-b">
                                    <Isvg src={this.props.settings.logo}/>
                                    <span className="natpis-b">ZIPA<em>PHOTO</em></span>
                                </Link>
                                :
                                <Link to='/' className="desktop-logo"><Isvg src={this.props.settings.logo}/> <span
                                    dangerouslySetInnerHTML={{__html: this.props.settings.logoText}}></span> </Link>
                            }

                            <Isvg src={this.props.settings.logo}/>

                            <PretragaSaPrijedlozima
                                value={this.state.search}
                                onChange={(v) => this.setState({search: v})}
                                onSearch={this.pokreniPretragu}
                            />

                            <button className="search" onClick={() => this.pokreniPretragu()}>
                                <Isvg src={search}/>
                            </button>

                        </Col>

                        <Col lg="8" className="links" sm="7" xs="2">
                            <>

                                <Link to="/help" className="help">{'POMOĆ'.translate(this.props.lang)}</Link>
                            </>
                            {/* <div className={this.state.showSearch ? "desktop-search desktop-search-visible" : 'desktop-search'}>
                <input type="text" placeholder={'Pretraga...'.translate(this.props.lang)} value={this.state.search} onChange={(e) => this.setState({ search: e.target.value })} onKeyUp={(e) => {
                  if (e.keyCode == 13) {
                    e.preventDefault();
                    this.props[0].history.push(`/galerije${this.state.search ? `?search=${encodeURIComponent(this.state.search)}` : ''}`)
                  }
                }} />
                <button onClick={() => { this.setState({ showSearch: !this.state.showSearch }) }}><Isvg src={search} /></button>
              </div>
              */}
                            <UncontrolledDropdown>
                                <DropdownToggle>
                                    <img src={this.props.lang == 'ba' ? ba : en}/>
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem onClick={this.setLangBa}><a><img src={ba}/></a></DropdownItem>
                                    <DropdownItem onClick={this.setLangEn}><a><img src={en}/></a></DropdownItem>

                                </DropdownMenu>
                            </UncontrolledDropdown>
                            {this.props.uData ?
                                <>
                                    <div className="login">
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Nalog'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link
                                                    to="/account/profile"><DropdownItem>{'Profil'.translate(this.props.lang)}</DropdownItem></Link>
                                                <DropdownItem onClick={() => {
                                                    this.props.signOut()
                                                    this.props[0].history.push('/');
                                                    this.props.showInfoMessage('Hvala vam što ste koristili foto servis.')
                                                }
                                                }>{'Izloguj se'.translate(this.props.lang)}</DropdownItem>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </div>


                                    {this.props.uData.userRole !== 'photographer' ?
                                        <div className="cart"><Link to="/cart">
                                            <button><Isvg src={cart}/> <span>{'Korpa'.translate(this.props.lang)}</span>
                                            </button>
                                        </Link></div>
                                        :
                                        null
                                    }

                                </>
                                :
                                <>
                                    <div className="login"><Link
                                        to="/login">{'Uloguj se'.translate(this.props.lang)}</Link></div>
                                    <div className="register"><Link to="/register">
                                        <button>{'Registruj se'.translate(this.props.lang)}</button>
                                    </Link></div>
                                </>
                            }

                        </Col>


                        <Col lg="12" xs="12" sm="12"
                             className={`navigation ${this.props.uData && this.props.uData.userRole == 'photographer' ? 'photographer-nav' : ''} ${this.props.uData && this.props.uData.userRole == 'agency' ? 'agency-nav' : ''}`}>
                            {this.props[0].location.pathname.indexOf('/account') == -1 && (!this.props.uData || (this.props.uData && this.props.uData.userRole != 'photographer') /*|| (this.props.uData && this.props.uData.userRole == 'photographer' && this.props.uData.permissions.indexOf('*') !== -1)*/) ?

                                <ul className={meniA ? 'meni-a' : null}>
                                    {/* U predlogu A meni je preoblikovan po vrsti
                                        sadržaja — fotografija, video i dron —
                                        kako je predloženo u nacrtu. */}
                                    {meniA ? [
                                        <li key="foto" className={this.props[0].location.pathname == '/galerije' ? 'istaknuto active' : 'istaknuto'}>
                                            <Link to='/galerije'>{'PHOTO'.translate(this.props.lang)}</Link></li>,
                                        <li key="video" className="istaknuto">
                                            <Link to='/video'>{'VIDEO'.translate(this.props.lang)}</Link></li>,
                                        <li key="dron" className="istaknuto">
                                            <Link to='/galerije?search=dron'>{'DRON'.translate(this.props.lang)}</Link></li>
                                    ] : null}

                                    <li className={this.props[0].location.pathname == '/' ? "active" : null}><Link
                                        to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    {!meniA ?
                                        <li><Link to='/galerije'>{'Galerije'.translate(this.props.lang)}</Link></li>
                                        : null}

                                    <li className="hide-on-mobile">
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Kategorije'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                {
                                                    this.props.categories.map((item, idx) => {
                                                        return (
                                                            <Link
                                                                to={`/galerije?category=${Object.translate(item, 'alias', this.props.lang)}&detailSearch=true`}>
                                                                <DropdownItem>{Object.translate(item, 'name', this.props.lang)}</DropdownItem></Link>
                                                        )
                                                    })
                                                }
                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>


                                    <li className="menu hide-on-mobile">
                                        <button className="menu-button"
                                                onClick={() => this.setState({agencyDropdown: !this.state.agencyDropdown})}> {'Agencija'.translate(this.props.lang)} </button>
                                        <ul style={{display: this.state.agencyDropdown ? 'block' : 'none'}}>
                                            <li className="submenu">
                                                <button>{'Fotografi'.translate(this.props.lang)}</button>
                                                <ul>
                                                    {
                                                        this.props.photographers.map((item, idx) => {
                                                            return (
                                                                <li><Link
                                                                    to={`/fotograf/${item.userAlias}`}>{item.name}</Link>
                                                                </li>
                                                            )
                                                        })
                                                    }

                                                </ul>
                                            </li>

                                            <li><Link to={'/page/o-nama'}>  {'O nama'.translate(this.props.lang)}</Link>
                                            </li>
                                            <li><Link
                                                to={'/page/uslovi-koriscenja'}>  {'Uslovi korišćenja'.translate(this.props.lang)}</Link>
                                            </li>
                                            <li className="submenu">
                                                <button>{'Usluge'.translate(this.props.lang)}</button>
                                                <ul>
                                                    <li><Link
                                                        to={'/page/fotografisanje'}>  {'Fotografisanje'.translate(this.props.lang)}</Link>
                                                    </li>
                                                    <li><Link
                                                        to={'/page/saradnja'}> {'Saradnja'.translate(this.props.lang)}</Link>
                                                    </li>

                                                </ul>
                                            </li>
                                            <li><Link
                                                to={'/page/ugovori'}>  {'Ugovori'.translate(this.props.lang)}</Link>
                                            </li>
                                            <li><Link
                                                to={'/page/prijatelji-sajta'}> {'Prijatelji sajta'.translate(this.props.lang)}</Link>
                                            </li>
                                            <li><Link to="/contact"
                                                      className="contact">{'Kontakt'.translate(this.props.lang)}</Link>
                                            </li>
                                        </ul>
                                    </li>


                                    {
                                        this.props.categories.map((item, idx) => {
                                            if (item.isVisibleOnNav)
                                                return (
                                                    <li className="nav-category"><Link
                                                        to={`/galerije?category=${Object.translate(item, 'alias', this.props.lang)}`}>{Object.translate(item, 'name', this.props.lang)}</Link>
                                                    </li>

                                                )
                                        })
                                    }
                                    <li>
                                        <div className={'desktop-search'}>
                                            <input type="text" placeholder={'Pretraga...'.translate(this.props.lang)}
                                                   value={this.state.search}
                                                   onChange={(e) => this.setState({search: e.target.value})}
                                                   onKeyUp={(e) => {
                                                       if (e.keyCode == 13) {
                                                           e.preventDefault();
                                                           this.props[0].history.push(`/galerije${this.state.search ? `?search=${encodeURIComponent(this.state.search)}` : ''}`)
                                                       }
                                                   }}/>
                                            <button className="btn1" onClick={() => {
                                                this.props[0].history.push(`/galerije${this.state.search ? `?search=${encodeURIComponent(this.state.search)}` : ''}`)
                                            }}><Isvg src={search}/></button>
                                            <button className="btn2" onClick={() => {
                                                this.props.handleDetailSearch(true)
                                            }}><Isvg src={filterIcon}/></button>

                                        </div>
                                    </li>
                                </ul>

                                :
                                null
                            }
                            {this.props.uData && this.props.uData.userRole == 'photographer' && (this.props[0].location.pathname.indexOf('/account') == 0 || this.props[0].location.pathname.indexOf('/galerija/') == 0) ?

                                <ul className="account-nav">
                                    <li className={this.props[0].location.pathname == '/account/profile' ? "active" : null}>
                                        <Link to='/account/profile'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li className={this.props[0].location.pathname == '/account/galleries' ? "active" : null}>
                                        <Link to='/account/galleries'>{'Fotografije'.translate(this.props.lang)}</Link>
                                    </li>
                                    {this.props.uData.permissions && this.props.uData.permissions.indexOf('*') != -1 ?
                                        <li className={this.props[0].location.pathname == '/account/users' ? "active" : null}>
                                            <Link to='/account/users'>{'Korisnici'.translate(this.props.lang)}</Link>
                                        </li>
                                        :
                                        null
                                    }
                                    <li className={this.props[0].location.pathname == '/account/photo-visits' ? "active" : null}>
                                        <Link to='/account/photo-visits'>{'Pregledi'.translate(this.props.lang)}</Link>
                                    </li>

                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Profil'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem><Link
                                                    to={'/account/edit'}>{'Izmjeni profil'.translate(this.props.lang)}</Link></DropdownItem>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                    <li className="button-li"><Link to='/account/gallery/new'>
                                        <button><Isvg
                                            src={imagesCount}/> {'Dodaj fotografiju'.translate(this.props.lang)}
                                        </button>
                                    </Link></li>
                                </ul>
                                :
                                null
                            }

                            {this.props[0].location.pathname.indexOf('/account') == 0 && this.props.uData && this.props.uData.userRole != 'photographer' && this.props.uData && this.props.uData.userRole != 'admin' ?

                                <ul className="account-nav">
                                    <li className={this.props[0].location.pathname == '/account/profile' ? "active" : null}>
                                        <Link to='/account/profile'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li className={this.props[0].location.pathname == '/account/downloads' ? "active" : null}>
                                        <Link to='/account/downloads'>{'Preuzimanja'.translate(this.props.lang)}</Link>
                                    </li>
                                    <li className={this.props[0].location.pathname == '/account/subscription' ? "active" : null}>
                                        <Link to='/account/subscription'>{'Pretplata'.translate(this.props.lang)}</Link>
                                    </li>

                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Profil'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <DropdownItem><Link
                                                    to={'/account/edit'}>{'Ažuriranje profila'.translate(this.props.lang)}</Link></DropdownItem>
                                                <DropdownItem><Link
                                                    to={'/account/change-password'}>{'Promjena lozinke'.translate(this.props.lang)}</Link></DropdownItem>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                </ul>
                                :
                                null
                            }


                            {this.props[0].location.pathname.indexOf('/account') == 0 && this.props.uData && this.props.uData.userRole == 'admin' ?

                                <ul className="account-nav admin-nav">
                                    <li className={this.props[0].location.pathname == '/' ? "active" : null}><Link
                                        to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Kategorije'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/categories'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/categories/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li className={this.props[0].location.pathname == '/account/users' ? "active" : null}>
                                        <Link to='/account/users'>{'Korisnici'.translate(this.props.lang)}</Link></li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Baneri'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/banners'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/banners/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Stranice'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/pages'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/pages/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Najave'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/announcements'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/announcements/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Slajder'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/slides'}>
                                                    <DropdownItem>{'Lista'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/slides/new'}>
                                                    <DropdownItem>{'Dodaj'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'FAQ'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/faqCategories'}>
                                                    <DropdownItem>{'Lista kategorija'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/faqCategories/new'}>
                                                    <DropdownItem>{'Dodaj kategoriju'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/faq'}>
                                                    <DropdownItem>{'Lista pitanja'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/faq/new'}>
                                                    <DropdownItem>{'Dodaj pitanje'.translate(this.props.lang)}</DropdownItem></Link>

                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>
                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Newsletter'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>
                                                <Link to={'/account/newsletter'}>
                                                    <DropdownItem>{'Lista newslettera'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/subscribers'}>
                                                    <DropdownItem>{'Lista prijavljenih'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/newsletter/new'}>
                                                    <DropdownItem>{'Dodaj newsletter'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/subscribers/import'}>
                                                    <DropdownItem>{'Import subscribers'.translate(this.props.lang)}</DropdownItem></Link>
                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                    <li className={this.props[0].location.pathname == '/account/settings' ? "active" : null}>
                                        <Link to='/account/settings'>{'Podešavanja'.translate(this.props.lang)}</Link>
                                    </li>

                                    <li>
                                        <UncontrolledDropdown>
                                            <DropdownToggle>
                                                {'Logovi'.translate(this.props.lang)}
                                            </DropdownToggle>
                                            <DropdownMenu>


                                                <Link to={'/account/today-visits'}>
                                                    <DropdownItem>{'Najpregledanije stranice danas'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/gallery-stats'}>
                                                    <DropdownItem>{'Statistika galerija'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/photographer-stats'}>
                                                    <DropdownItem>{'Statistika fotografa'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/banner-stats'}>
                                                    <DropdownItem>{'Statistika bannera'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/archive-stats'}>
                                                    <DropdownItem>{'Arhiva od početka rada'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/watermarks'}>
                                                    <DropdownItem>{'Žig na fotografijama'.translate(this.props.lang)}</DropdownItem></Link>

                                                <Link to={'/account/download-logs'}>
                                                    <DropdownItem>{'Transakcije'.translate(this.props.lang)}</DropdownItem></Link>
                                                <Link to={'/account/logs'}>
                                                    <DropdownItem>{'Logovi'.translate(this.props.lang)}</DropdownItem></Link>
                                            </DropdownMenu>
                                        </UncontrolledDropdown>
                                    </li>

                                </ul>
                                :
                                null
                            }


                        </Col>

                    </Row>
                </Container>

                <div className={this.state.mobileNavigation ? "mobile-menu-wrap mobile-menu-open" : "mobile-menu-wrap"}>
                    <div className="overlay" onClick={() => this.setState({mobileNavigation: null})}></div>
                    <div className="mobile-menu">
                        <div className="user-info">
                            <UncontrolledDropdown className="langs-select">
                                <DropdownToggle>
                                    <img src={this.props.lang == 'ba' ? ba : en}/>
                                </DropdownToggle>
                                <DropdownMenu>
                                    <DropdownItem><a onClick={() => this.props.setLang('ba')}><img
                                        src={ba}/></a></DropdownItem>
                                    <DropdownItem><a onClick={() => this.props.setLang('en')}><img
                                        src={en}/></a></DropdownItem>

                                </DropdownMenu>
                            </UncontrolledDropdown>

                            <Isvg src={accountIcon}/>
                            <h6>{this.props.uData && this.props.uData.name ? this.props.uData.name : 'Nalog'}</h6>
                            <p>{this.props.uData ? this.props.uData.email : 'Sign up or Login to make purchase.'} </p>
                            <div className={this.props.uData ? "buttons" : "buttons buttons-login"}>
                                {this.props.uData ?
                                    <>
                                        <Link to={'/account/edit'}>
                                            <button>{'Nalog'.translate(this.props.lang)}</button>
                                        </Link>
                                        <Link to={'/account/downloads'}>
                                            <button>{'Preuzimanja'.translate(this.props.lang)}</button>
                                        </Link>
                                        <button onClick={() => {
                                            this.props.signOut()
                                            this.props[0].history.push('/');
                                        }}>{'Odjavi se'.translate(this.props.lang)}</button>

                                    </>
                                    :
                                    <>
                                        <Link to={'/login'}>
                                            <button>{'Prijava'.translate(this.props.lang)}</button>
                                        </Link>
                                        <Link to={'/register'}>
                                            <button>{'Registracija'.translate(this.props.lang)}</button>
                                        </Link>

                                    </>
                                }
                            </div>
                        </div>
                        <ul>
                            <li><Link to='/'>{'Početna'.translate(this.props.lang)}</Link></li>
                            {this.props.uData && this.props.uData.userRole != 'photographer' ?
                                <li><Link to='/cart'>{'Korpa'.translate(this.props.lang)}</Link></li> : null}
                            <li className="menu">
                                <button className="menu-button"
                                        onClick={() => this.setState({agencyDropdown1: !this.state.agencyDropdown1})}> {'Agencija'.translate(this.props.lang)} </button>
                                <ul style={{display: this.state.agencyDropdown1 ? 'block' : 'none'}}>
                                    <li className="submenu">
                                        <button
                                            onClick={() => this.setState({agencyDropdown2: !this.state.agencyDropdown2})}>{'Fotografi'.translate(this.props.lang)}</button>
                                        <ul style={{display: this.state.agencyDropdown2 ? 'block' : 'none'}}>
                                            {
                                                this.props.photographers.map((item, idx) => {
                                                    return (
                                                        <li><Link to={`/fotograf/${item.userAlias}`}>{item.name}</Link>
                                                        </li>
                                                    )
                                                })
                                            }

                                        </ul>
                                    </li>

                                    <li><Link to={'/page/o-nama'}>  {'O nama'.translate(this.props.lang)}</Link></li>
                                    <li><Link
                                        to={'/page/uslovi-koriscenja'}>  {'Uslovi korišćenja'.translate(this.props.lang)}</Link>
                                    </li>
                                    <li className="submenu">
                                        <button
                                            onClick={() => this.setState({agencyDropdown3: !this.state.agencyDropdown3})}>{'Usluge'.translate(this.props.lang)}</button>
                                        <ul style={{display: this.state.agencyDropdown3 ? 'block' : 'none'}}>
                                            <li><Link
                                                to={'/page/fotografisanje'}>  {'Fotografisanje'.translate(this.props.lang)}</Link>
                                            </li>
                                            <li><Link
                                                to={'/page/saradnja'}> {'Saradnja'.translate(this.props.lang)}</Link>
                                            </li>

                                        </ul>
                                    </li>
                                    <li><Link to={'/page/ugovori'}>  {'Ugovori'.translate(this.props.lang)}</Link></li>
                                    <li><Link
                                        to={'/page/prijatelji-sajta'}> {'Prijatelji sajta'.translate(this.props.lang)}</Link>
                                    </li>
                                    <li><Link to="/contact"
                                              className="contact">{'Kontakt'.translate(this.props.lang)}</Link></li>
                                </ul>
                            </li>

                        </ul>
                    </div>
                </div>

            </header>
        );
    }
}

export default Header;