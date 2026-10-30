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
import Html from './fields/html';

import mail from '../../assets/svg/mail.svg';
import lock from '../../assets/svg/lock.svg';
import user from '../../assets/svg/user-icon.svg';

import rightChevron from '../../assets/svg/right-arrow.svg';
import Isvg from 'react-inlinesvg';

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

const renderHtmlField = ({
    input,
    placeholder,
    label,
    icon,
    type,
    height,
    meta: { touched, error },
    multilang,
    lang
}) => (

        <Html
            placeholder={placeholder}
            label={label}
            icon={icon}
            errorText={touched && error}
            error={touched && error}
            type={type}
            height={height}
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



class form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {}
    }


    render() {

        const { handleSubmit, pristine, reset, submitting } = this.props;

        return (
            <form onSubmit={handleSubmit} className="edit-account-form">
                <Row>
                    {/* Dve najave istovremeno (2026-10-13): Obaveštenje 1 stoji
                        levo u traci, Obaveštenje 2 desno. Svaka ima svoje
                        dugme koje otvara prozor sa punim naslovom i opisom. */}
                    <Col lg="6">
                        <Field
                            name="pozicija"
                            component={renderSelectField}
                            label={'Mesto u traci'.translate(this.props.lang)}
                            placeholder={'Obaveštenje 1 — levo'.translate(this.props.lang)}
                        >
                            <option value="levo">{'Obaveštenje 1 — levo'.translate(this.props.lang)}</option>
                            <option value="desno">{'Obaveštenje 2 — desno'.translate(this.props.lang)}</option>
                        </Field>
                    </Col>
                    <Col lg="6">
                        <Field
                            name="content"
                            validate={[required]}
                            component={renderTextField}
                            label={'Natpis u traci (kratko) *'.translate(this.props.lang)}
                            multilang
                            lang={this.props.lang}
                        ></Field>
                    </Col>
                    <Col lg="6">
                        <Field
                            name="naslov"
                            component={renderTextField}
                            label={'Naslov u prozoru (prazno = natpis iz trake)'.translate(this.props.lang)}
                            multilang
                            lang={this.props.lang}
                        ></Field>
                    </Col>
                    <Col lg="6">
                        <Field
                            name="link"
                            component={renderTextField}
                            label={'Veza (npr. adresa galerije) — dugme „Pogledaj" u prozoru'.translate(this.props.lang)}
                            placeholder="https://zipaphoto.net/galerija/..."
                        ></Field>
                    </Col>
                    <Col lg="12"></Col>
                    <Col lg="3">
                        <Field
                            name="from"
                            component={renderDateField}
                            label={'OD'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="3">
                        <Field
                            name="to"
                            component={renderDateField}
                            label={'DO'.translate(this.props.lang)}
                        ></Field>
                    </Col>
                    <Col lg="3">
                        <Field
                            name="time"
                            component={renderTextField}
                            type="time"
                            label={'Vrijeme'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="12">

                        <Field
                            name="text"
                            component={renderHtmlField}
                            label={'Opis u prozoru'.translate(this.props.lang)}
                            type="text"
                            height={400}
                            multilang
                            lang={this.props.lang}

                        ></Field>

                    </Col>


                    <Col lg="12">
                        <div className="spacer"></div>
                    </Col>

                    <Col lg="12">
                        <button className="button">{'Sačuvaj'.translate(this.props.lang)}</button>
                    </Col>
                </Row>
            </form>
        )
    }
}

/*
 * `enableReinitialize` je OBAVEZAN (2026-10-30).
 *
 * Strane administracije dovlače vrednosti tek u `componentDidMount`, dakle
 * POSLE prvog iscrtavanja obrasca. Bez ovoga redux-form zadržava prazno
 * početno stanje i kasnije vrednosti ignoriše — izmena se otvarala praznih
 * polja, a čuvanje je brisalo ono što je ranije bilo upisano.
 *
 * Ime obrasca mora da bude JEDINSTVENO: desetak obrazaca je delilo isto
 * (`editAccountForm`), pa su vrednosti umele da procure sa jednog ekrana na
 * drugi.
 */
export default reduxForm({
    form: 'announcementForm',
    enableReinitialize: true,
})(form)
