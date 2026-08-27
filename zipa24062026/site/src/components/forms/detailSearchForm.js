import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'

import Text from './fields/text1';
import Textarea from './fields/textarea';
import Tags from './fields/tags';

import Name from './fields/name';

import Check from './fields/check';
import Select from './fields/select';
import Image from './fields/profilePhoto';
import DatePicker from './fields/date';
import Toggle from './fields/toggleCheckbox';
import Gallery from './fields/photos';
import MultiCheckbox from './fields/multiCheckbox';

import mail from '../../assets/svg/mail.svg';
import lock from '../../assets/svg/lock.svg';
import user from '../../assets/svg/user-icon.svg';

import rightChevron from '../../assets/svg/right-arrow.svg';
import Isvg from 'react-inlinesvg';
import Autotext from './fields/autoText';
import { API_ENDPOINT } from '../../constants'

import {
    Container,
    Row,
    Col,
    Dropdown,
    DropdownItem,
    DropdownMenu,
    DropdownToggle,
    Carousel,
    CarouselItem,
    CarouselControl,
    CarouselIndicators,
    CarouselCaption,
    UncontrolledDropdown
} from 'reactstrap';



const required = value => value ? undefined : "Required"

const renderSelectField = ({
    input,
    placeholder,
    label,
    meta: { touched, error },
    children
}) => (

    <Select
        placeholder={placeholder}
        label={label}
        errorText={touched && error}
        error={touched && error}
        {...input}
    >{children}</Select>
)

const renderAutoTextField = ({
    input,
    placeholder,
    label,
    icon,
    meta: { touched, error },
    type,
    multilang,
    lang,
    suggestions
}) => (

    <Autotext
        placeholder={placeholder}
        suggestions={suggestions}
        label={label}
        icon={icon}
        errorText={touched && error}
        error={touched && error}
        type={type}
        multilang={multilang}
        lang={lang}
        {...input}
    />
)
const renderTextField = ({
    input,
    placeholder,
    label,
    icon,
    meta: { touched, error },
    type,
    multilang,
    lang
}) => (

    <Text
        placeholder={placeholder}
        label={label}
        icon={icon}
        errorText={touched && error}
        error={touched && error}
        type={type}
        multilang={multilang}
        lang={lang}
        {...input}
    />
)
const renderTagsField = ({
    input,
    placeholder,
    label,
    icon,
    meta: { touched, error },
    type,
    multilang,
    lang
}) => (

    <Tags
        placeholder={placeholder}
        label={label}
        icon={icon}
        errorText={touched && error}
        error={touched && error}
        type={type}
        multilang={multilang}
        lang={lang}
        {...input}
    />
)

const renderDateField = ({
    input,
    placeholder,
    label,
    meta: { touched, error },
}) => (

    <DatePicker
        placeholder={placeholder}
        label={label}
        errorText={touched && error}
        error={touched && error}
        {...input}
    />
)


const renderTextareaField = ({
    input,
    placeholder,
    label,
    icon,
    meta: { touched, error },
    type,
    multilang,
    lang
}) => (

    <Textarea
        placeholder={placeholder}
        label={label}
        icon={icon}
        errorText={touched && error}
        error={touched && error}
        type={type}
        multilang={multilang}
        lang={lang}
        {...input}
    />
)


const renderMultiCheckboxField = ({
    input,
    placeholder,
    label,
    meta: { touched, error },
    children
}) => (

    <MultiCheckbox
        placeholder={placeholder}
        label={label}
        errorText={touched && error}
        error={touched && error}
        {...input}
    >{children}</MultiCheckbox>
)

const renderCheckField = ({
    input,
    placeholder,
    label,
    meta: { touched, error },
    lang,
    multilang
}) => (

    <Check
        label={label}
        errorText={touched && error}
        error={touched && error}

        {...input}
    />
)
const renderToggleField = ({
    input,
    placeholder,
    label,
    meta: { touched, error },
    lang,
    multilang
}) => (

    <Toggle
        label={label}
        errorText={touched && error}
        error={touched && error}

        {...input}
    />
)


const renderImageField = ({
    input,
    label,
    height,
    meta: { touched, error },
}) => (

    <Image
        label={label}
        errorText={touched && error}
        error={touched && error}
        height={height}
        {...input}
    />
)

const renderGalleryField = ({
    input,
    label,
    height,
    meta: { touched, error },
}) => (

    <Gallery
        label={label}
        errorText={touched && error}
        error={touched && error}
        height={height}
        {...input}
    />
)



/*
 * Vizuelni izbor orijentacije.
 *
 * Zatečeno su bila dva obična polja za štikliranje. Vrednost i ime polja
 * ostaju ISTI (`orientation-portrait`, `orientation-horizontal`, prosto
 * uključeno/isključeno) — menja se samo način na koji se bira, jer se
 * orijentacija bira okom, ne čitanjem.
 *
 * „Kvadrat" namerno NEMA: za njega ne postoji parametar u URL-u, a imena
 * parametara se ne diraju.
 */
const renderOrijentacija = ({ input, oblik, naziv }) => (
    <button type="button"
            className={'z-pretraga-prozor__orijentacija z-pretraga-prozor__orijentacija--' + oblik
                + (input.value ? ' z-pretraga-prozor__orijentacija--izabrana' : '')}
            aria-pressed={input.value ? 'true' : 'false'}
            onClick={() => input.onChange(!input.value)}>
        <span className="z-pretraga-prozor__orijentacija-oblik" aria-hidden="true" />
        <span>{naziv}</span>
    </button>
);

// Prečice za datum — vraćaju [od, do] u sekundama, isto kao birač datuma.
const PRECICE = {
    dana7: () => {
        const doDatuma = new Date();
        const od = new Date();
        od.setDate(od.getDate() - 7);
        od.setHours(0, 0, 0, 0);
        return [Math.floor(od.getTime() / 1000), Math.floor(doDatuma.getTime() / 1000)];
    },
    mesec: () => {
        const sada = new Date();
        const od = new Date(sada.getFullYear(), sada.getMonth(), 1, 0, 0, 0, 0);
        return [Math.floor(od.getTime() / 1000), Math.floor(sada.getTime() / 1000)];
    },
    godina: () => {
        const sada = new Date();
        const od = new Date(sada.getFullYear(), 0, 1, 0, 0, 0, 0);
        return [Math.floor(od.getTime() / 1000), Math.floor(sada.getTime() / 1000)];
    },
};


class form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            cities: [],
            precica: null,
        }
    }

    componentDidMount() {

        fetch(`${API_ENDPOINT}/cities`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
        }).then(res => res.json()).then((result) => {
            this.setState({
                cities: result
            })
        })

        // Prozor se zatvara i tasterom Escape, ne samo dugmetom.
        document.addEventListener('keydown', this.naTaster);
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.naTaster);
    }

    naTaster = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27) {
            this.props.handleDetailSearch(null);
        }
    };

    // Prečice pišu u ISTA polja u koja piše i birač datuma.
    postaviPrecicu = (kljuc) => {
        if (kljuc === 'proizvoljno') {
            this.props.change('date-from', null);
            this.props.change('date-to', null);
            this.setState({ precica: 'proizvoljno' });
            return;
        }
        const [od, doDatuma] = PRECICE[kljuc]();
        this.props.change('date-from', od);
        this.props.change('date-to', doDatuma);
        this.setState({ precica: kljuc });
    };

    ponistiSve = () => {
        this.props.reset();
        this.setState({ precica: null });
    };

    render() {

        const { handleSubmit } = this.props;
        const l = this.props.lang;
        const precice = [
            ['dana7', 'Posljednjih 7 dana'],
            ['mesec', 'Ovaj mjesec'],
            ['godina', 'Ova godina'],
            ['proizvoljno', 'Proizvoljno'],
        ];

        return (
            <form onSubmit={handleSubmit} className="detail-search-form">

                <div className="z-pretraga-prozor__telo">

                    {/* ── šta se traži ─────────────────────────────────── */}
                    <div className="z-pretraga-prozor__grupa">
                        <h3 className="z-pretraga-prozor__naslov-grupe">{'Šta tražite'.translate(l)}</h3>

                        <Field
                            name="keywords"
                            component={renderTagsField}
                            label={'Ključne riječi'.translate(l)}
                        ></Field>

                        <Field
                            name="name"
                            component={renderTextField}
                            label={'Događaj'.translate(l)}
                        ></Field>
                    </div>

                    {/* ── kada ─────────────────────────────────────────── */}
                    <div className="z-pretraga-prozor__grupa">
                        <h3 className="z-pretraga-prozor__naslov-grupe">{'Kada je snimljeno'.translate(l)}</h3>

                        <div className="z-pretraga-prozor__precice">
                            {precice.map(([kljuc, naziv]) => (
                                <button key={kljuc}
                                        type="button"
                                        className={'z-pretraga-prozor__precica'
                                            + (this.state.precica === kljuc ? ' z-pretraga-prozor__precica--izabrana' : '')}
                                        aria-pressed={this.state.precica === kljuc ? 'true' : 'false'}
                                        onClick={() => this.postaviPrecicu(kljuc)}>
                                    {naziv.translate(l)}
                                </button>
                            ))}
                        </div>

                        <div className="z-pretraga-prozor__par">
                            <Field
                                name="date-from"
                                component={renderDateField}
                                label={'Datum fotografisanja - OD'.translate(l)}
                            ></Field>
                            <Field
                                name="date-to"
                                component={renderDateField}
                                label={'Datum fotografisanja - DO'.translate(l)}
                            ></Field>
                        </div>
                    </div>

                    {/* ── gde i ko ─────────────────────────────────────── */}
                    <div className="z-pretraga-prozor__grupa">
                        <h3 className="z-pretraga-prozor__naslov-grupe">{'Gdje i ko'.translate(l)}</h3>

                        <div className="z-pretraga-prozor__par">
                            <Field
                                name="city"
                                component={renderAutoTextField}
                                suggestions={this.state.cities}
                                label={'Grad'.translate(l)}
                            ></Field>

                            <Field
                                name="photographer"
                                component={renderSelectField}
                                label={'Fotograf'.translate(l)}
                            >
                                {
                                    this.props.photographers && this.props.photographers.map((item, idx) => {
                                        return (
                                            <option key={idx} value={item.userAlias}>{item.name}</option>
                                        )
                                    })
                                }
                            </Field>
                        </div>
                    </div>

                    {/* ── oblik fotografije ────────────────────────────── */}
                    <div className="z-pretraga-prozor__grupa">
                        <h3 className="z-pretraga-prozor__naslov-grupe">{'Orjentacija fotografije'.translate(l)}</h3>

                        <div className="z-pretraga-prozor__orijentacije">
                            <Field
                                name="orientation-portrait"
                                component={renderOrijentacija}
                                oblik="uspravna"
                                naziv={'Uspravna'.translate(l)}
                            ></Field>
                            <Field
                                name="orientation-horizontal"
                                component={renderOrijentacija}
                                oblik="polozena"
                                naziv={'Položena'.translate(l)}
                            ></Field>
                        </div>
                    </div>
                </div>

                {/* ── dno ──────────────────────────────────────────────── */}
                <div className="z-pretraga-prozor__dno">
                    <button type="button"
                            className="z-pretraga-prozor__dugme z-pretraga-prozor__dugme--tiho"
                            onClick={this.ponistiSve}>
                        {'Poništi sve'.translate(l)}
                    </button>
                    <button type="submit"
                            className="z-pretraga-prozor__dugme z-pretraga-prozor__dugme--glavno">
                        {'Pretraži'.translate(l)}
                    </button>
                </div>
            </form>
        )
    }
}

export default reduxForm({
    form: 'detailSearchForm'  // a unique identifier for this form
})(form)
