import React, { Component } from 'react';
import { Field, Fields, reduxForm } from 'redux-form'
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
import Gallery from './fields/banners';
import MultiCheckbox from './fields/multiCheckbox';
import VelicinaBanera from './fields/velicinaBanera';

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
    mobilna,
    meta: { touched, error },
}) => (

    <Gallery
        label={label}
        errorText={touched && error}
        error={touched && error}
        height={height}
        mobilna={mobilna}
        {...input}
    />
)

// Širina i visina širokog banera (2026-10-27) — samo za „Široki"; ostale
// vrste imaju svoju stalnu meru.
const renderVelicinaField = (polja) => (
    polja.size.input.value && polja.size.input.value !== 'siroki' ? null : (
        <VelicinaBanera
            sirina={polja.sirina.input.value}
            visina={polja.visina.input.value}
            slike={Array.isArray(polja.images.input.value) ? polja.images.input.value : []}
            onSirina={polja.sirina.input.onChange}
            onVisina={polja.visina.input.onChange}
        />
    )
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
                    {/* Vrsta i MERA banera stoje na vrhu (2026-10-27) — prvo se
                        bira mera, pa se po njoj pravi i postavlja slika. */}
                    <Col lg="12">
                        <div className="z-baner-vrh">
                            <Field
                                name="size"
                                component={renderSelectField}
                                label={'Vrsta banera'.translate(this.props.lang)}
                                placeholder={'Široki — širina i visina po izboru'.translate(this.props.lang)}
                            >
                                <option value="siroki">Široki — širina i visina po izboru</option>
                                <option value="uspravni">Uspravni — 160 × 600</option>
                                <option value="kvadratni">Kvadratni — 300 × 250</option>
                                <option value="mobilni">Za telefon — 320 × 100</option>
                            </Field>
                            <Fields names={['sirina', 'visina', 'images', 'size']} component={renderVelicinaField} />
                        </div>
                    </Col>

                    <Col lg="12">

                        <Field
                            name="hidden"
                            component={renderCheckField}
                            label={'Skriveno'.translate(this.props.lang)}
                        ></Field>


                    </Col>
                    <Col lg="6">

                        <Field
                            name="name"
                            validate={[required]}
                            component={renderTextField}
                            label={'Naziv *'.translate(this.props.lang)}
                        ></Field>


                    </Col>
                    <Col lg="6">

                        <Field
                            name="position"
                            component={renderTextField}
                            label={'Pozicija *'.translate(this.props.lang)}
                        ></Field>



                    </Col>

                    <Col lg="3">

                        <Field
                            name="leftSide"
                            component={renderCheckField}
                            label={'Lijevi fiksni'.translate(this.props.lang)}
                        ></Field>


                    </Col>
                    <Col lg="3">

                        <Field
                            name="rightSide"
                            component={renderCheckField}
                            label={'Desni fiksni'.translate(this.props.lang)}
                        ></Field>


                    </Col>
                    <Col lg="3">

                        <Field
                            name="footer"
                            component={renderCheckField}
                            label={'Footer'.translate(this.props.lang)}
                        ></Field>


                    </Col>

                    <Col lg="3">

                        <Field
                            name="sponsor"
                            component={renderCheckField}
                            label={'Generalni sponzor'.translate(this.props.lang)}
                        ></Field>


                    </Col>

                    <Col lg="3">

                        <Field
                            name="detail"
                            component={renderCheckField}
                            label={'Detail banner'.translate(this.props.lang)}
                        ></Field>


                    </Col>
                    <Col lg="3">

                        <Field
                            name="mobilePopup"
                            component={renderCheckField}
                            label={'Iskačuća na telefonu'.translate(this.props.lang)}
                        ></Field>

                        <Field
                            name="mobileOnly"
                            component={renderCheckField}
                            label={'Samo na telefonu'.translate(this.props.lang)}
                        ></Field>

                        <Field
                            name="ad"
                            component={renderCheckField}
                            label={'Glavni baner (ispod pretrage na naslovnoj)'.translate(this.props.lang)}
                        ></Field>


                    </Col>

                    <Col lg="12">
                        <div className="spacer"></div>
                    </Col>



                    <Col lg="12">
                        <Field
                            name="images"
                            component={renderGalleryField}
                            mobilna
                            label={'Fotografije'.translate(this.props.lang)}
                        ></Field>

                    </Col>


                    <Col lg="12">
                        <button className="button">{'Spremi bannere'.translate(this.props.lang)}</button>
                    </Col>
                </Row>
            </form>
        )
    }
}

export default reduxForm({
    form: 'editAccountForm'  // a unique identifier for this form
})(form)
