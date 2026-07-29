import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'

import Text from './fields/text1';
import Textarea from './fields/textarea';
import Tags from './fields/tags';

import Name from './fields/name';

import Check from './fields/check';
import Select from './fields/select';
import Image from './fields/image';
import DatePicker from './fields/date';
import Toggle from './fields/toggleCheckbox';
import Gallery from './fields/banners';
import MultiCheckbox from './fields/multiCheckbox';

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
                    <Col lg="4">

                        <Field
                            name="logo"
                            component={renderImageField}
                            label="Logo"
                        ></Field>


                    </Col>
                    <Col lg="4">

                        <Field
                            name="footerLogo"
                            component={renderImageField}
                            label="Footer logo"
                        ></Field>


                    </Col>
                    <Col lg="4">

                        <Field
                            name="watermark"
                            validate={[required]}
                            component={renderImageField}
                            label="Watermark"
                        ></Field>


                    </Col>

                    <Col lg="12">
                        <div className="spacer-t"></div>
                    </Col>


                    <Col lg="6">
                        <Field
                            name="logoText"
                            validate={[required]}
                            component={renderTextField}
                            label="Logo text *"
                        ></Field>

                        <Field
                            name="defaultPhotoPrice"
                            component={renderTextField}
                            label="Cijena fotografije (KM)"
                        ></Field>

                        <Field
                            name="phoneNumber"
                            validate={[required]}
                            component={renderTextField}
                            label="Kontakt telefon *"
                        ></Field>
                        <Field
                            name="email"
                            validate={[required]}
                            component={renderTextField}
                            label="E-mail adresa *"
                        ></Field>

                        <Field
                            name="location"
                            validate={[required]}
                            component={renderTextareaField}
                            label="Lokacija *"
                        ></Field>

                    </Col>
                    <Col lg="6">
                        <Field
                            name="facebook"
                            component={renderTextField}
                            label="Facebook"
                        ></Field>
                        <Field
                            name="instagram"
                            component={renderTextField}
                            label="Instagram"
                        ></Field>
                        <Field
                            name="twitter"
                            component={renderTextField}
                            label="Twitter"
                        ></Field>
                        <Field
                            name="pinterest"
                            component={renderTextField}
                            label="Pinterest"
                        ></Field>
                        <Field
                            name="tumblr"
                            component={renderTextField}
                            label="Tumblr"
                        ></Field>
                        <Field
                            name="linkedin"
                            component={renderTextField}
                            label="LinkedIn"
                        ></Field>



                    </Col>

                    <Col lg="3">
                        <Field
                            name="infoblock[0].icon"
                            validate={[required]}
                            component={renderImageField}
                            label="Ikonica #1"
                        ></Field>
                        <Field
                            name="infoblock[0].name"
                            component={renderTextField}
                            label="Naziv"
                            lang={this.props.lang}
                            multilang

                        ></Field>
                        <Field
                            name="infoblock[0].value"
                            component={renderTextField}
                            label="Vrijednost"
                            lang={this.props.lang}
                            multilang

                        ></Field>


                    </Col>
                    <Col lg="3">
                        <Field
                            name="infoblock[1].icon"
                            validate={[required]}
                            component={renderImageField}
                            label="Ikonica #2"
                        ></Field>
                        <Field
                            name="infoblock[1].name"
                            component={renderTextField}
                            label="Naziv"
                            lang={this.props.lang}
                            multilang

                        ></Field>
                        <Field
                            name="infoblock[1].value"
                            component={renderTextField}
                            label="Vrijednost"
                            lang={this.props.lang}
                            multilang

                        ></Field>


                    </Col>
                    <Col lg="3">
                        <Field
                            name="infoblock[2].icon"
                            validate={[required]}
                            component={renderImageField}
                            label="Ikonica #3"
                        ></Field>
                        <Field
                            name="infoblock[2].name"
                            component={renderTextField}
                            label="Naziv"
                            lang={this.props.lang}
                            multilang

                        ></Field>
                        <Field
                            name="infoblock[2].value"
                            component={renderTextField}
                            label="Vrijednost"
                            lang={this.props.lang}
                            multilang

                        ></Field>


                    </Col>
                    <Col lg="3">
                        <Field
                            name="infoblock[3].icon"
                            validate={[required]}
                            component={renderImageField}
                            label="Ikonica #4"
                        ></Field>
                        <Field
                            name="infoblock[3].name"
                            component={renderTextField}
                            label="Naziv"
                            lang={this.props.lang}
                            multilang
                        ></Field>
                        <Field
                            name="infoblock[3].value"
                            component={renderTextField}
                            label="Vrijednost"
                            lang={this.props.lang}
                            multilang
                        ></Field>


                    </Col>
                    <Col lg="12">
                        <Field
                            name="enableInfoBlocks"
                            component={renderCheckField}
                            label="Prikaži info blokove umjesto newslettera"
                        ></Field>


                    </Col>
                    <Col lg="12">
                        <Field
                            name="showSlider"
                            component={renderCheckField}
                            label="Prikaži slajder umjesto pretrage"
                        ></Field>


                    </Col>
                    <Col lg="12">
                        <Field
                            name="showBanner"
                            component={renderCheckField}
                            label="Prikaži banner umjesto pretrage"
                        ></Field>


                    </Col>

                    <Col lg="12">
                        <div className="spacer"></div>
                    </Col>




                    <Col lg="12">
                        <button className="button">Spremi</button>
                    </Col>
                </Row>
            </form>
        )
    }
}

export default reduxForm({
    form: 'editAccountForm'  // a unique identifier for this form
})(form)
