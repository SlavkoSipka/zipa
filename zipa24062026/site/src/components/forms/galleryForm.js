import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'

import Text from './fields/text1';
import Autotext from './fields/autoText';

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
import { API_ENDPOINT } from '../../constants';

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
    children,
    width
}) => (

    <MultiCheckbox
        placeholder={placeholder}
        label={label}
        errorText={touched && error}
        error={touched && error}
        width={width}
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
    uploadHandler,
    enableSave
}) => (

    <Gallery
        label={label}
        errorText={touched && error}
        error={touched && error}
        height={height}
        uploadHandler={uploadHandler}
        enableSave={enableSave}
        {...input}
    />
)



class form extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            cities: []
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

    }


    render() {

        const { handleSubmit, pristine, reset, submitting } = this.props;

        return (
            <form onSubmit={handleSubmit} className="edit-account-form">
                <Row>
                    <Col lg="6">

                        <Field
                            name="name"
                            validate={[required]}
                            component={renderTextField}
                            label={'Naziv *'.translate(this.props.lang)}
                            multilang
                            lang={this.props.lang}
                        ></Field>

                        <Field
                            name="description"
                            validate={[required]}
                            component={renderTextareaField}
                            label={'Opis *'.translate(this.props.lang)}
                            multilang
                            lang={this.props.lang}
                        ></Field>

                    </Col>
                    <Col lg="6">
                        <Field
                            name="keywords"
                            component={renderTagsField}
                            label={'Ključne riječi'.translate(this.props.lang)}
                            multilang
                            lang={this.props.lang}

                        ></Field>
                        <Field
                            name="location"
                            component={renderAutoTextField}
                            label={'Lokacija'.translate(this.props.lang)}
                            suggestions={this.state.cities}
                        ></Field>
                        <Row>
                            <Col lg="6">
                                <Field
                                    name="date"
                                    component={renderDateField}
                                    label={'Datum'.translate(this.props.lang)}
                                    validate={[required]}
                                ></Field>

                            </Col>
                            {/*<Col lg="6">
                                <Field
                                    name="forcedDate"
                                    component={renderDateField}
                                    label={'Prinudni datum'.translate(this.props.lang)}
                                    //validate={[required]}
                                ></Field>

        </Col>*/}
                            {/*
                            <Col lg="4">
                                <Field
                                    name="requiredDate"
                                    component={renderDateField}
                                    label={'Obavezan datum'.translate(this.props.lang)}
                                    //validate={[required]}
                                ></Field>

                            </Col>
                            */}

                            <Col lg="8">
                                <Field
                                    name="price"
                                    component={renderTextField}
                                    label={'Cijena'.translate(this.props.lang)}
                                ></Field>

                            </Col>
                            <Col lg="4">
                                <Field
                                    name="isActive"
                                    component={renderToggleField}
                                    label={'Status'.translate(this.props.lang)}
                                ></Field>

                            </Col>

                            {/*
                              * Obaveštenje se šalje samo kad se ovo označi —
                              * namerno nije samostalno, jer bi pretplatnici uz
                              * sedamsto galerija godišnje dobijali po dva
                              * pisma dnevno.
                              */}
                            <Col lg="12">
                                <Field
                                    name="notifySubscribers"
                                    component={renderCheckField}
                                    label={'Obavijesti pretplatnike o ovoj galeriji'.translate(this.props.lang)}
                                ></Field>
                            </Col>
                        </Row>

                    </Col>

                    <Col lg="12">
                        <div className="spacer"></div>
                    </Col>



                    <Col lg="4">
                        <Field
                            name="category"
                            component={renderMultiCheckboxField}
                            label={'Osnovne kategorije'.translate(this.props.lang)}
                            width="12"
                        >
                            {
                                this.props.categories && this.props.categories.map((item, idx) => {
                                    if (!item.isRecommended && !item.isSpecial)
                                        return (
                                            <option value={item._id}>{Object.translate(item, 'name', this.props.lang)}</option>

                                        )
                                })
                            }
                        </Field>

                    </Col>
                    <Col lg="4">
                        <Field
                            name="category"
                            component={renderMultiCheckboxField}
                            label={'Preporucene kategorije'.translate(this.props.lang)}
                            width="12"

                        >
                            {
                                this.props.categories && this.props.categories.map((item, idx) => {
                                    if (item.isRecommended && !item.isSpecial)
                                        return (
                                            <option value={item._id}>{Object.translate(item, 'name', this.props.lang)}</option>

                                        )
                                })
                            }

                        </Field>

                    </Col>
                    <Col lg="4">
                        <Field
                            name="category"
                            component={renderMultiCheckboxField}
                            label={'Specijal'.translate(this.props.lang)}
                            width="12"
                        >
                            {
                                this.props.categories && this.props.categories.map((item, idx) => {
                                    if (item.isSpecial)
                                        return (
                                            <option value={item._id}>{Object.translate(item, 'name', this.props.lang)}</option>

                                        )
                                })
                            }

                        </Field>

                    </Col>

                    <Col lg="12">
                        <Field
                            name="photos"
                            component={renderGalleryField}
                            label={'Fotografije'.translate(this.props.lang)}
                            uploadHandler={this.props.uploadHandler}
                            enableSave={() => this.setState({ enableSave: true })}
                        ></Field>

                    </Col>


                    <Col lg="12">
                        <button disabled={!this.state.enableSave || this.props.loading} className={"button"}>{'Spremi'.translate(this.props.lang)}</button>
                    </Col>
                </Row>
            </form>
        )
    }
}

// Decorate with redux-form
form = reduxForm({
    form: 'galleryForm', // a unique identifier for this form
    // Podešavanja (npr. cijena) stižu asinhrono — forma ih pokupi kad stignu,
    // ali zadržava sve što je korisnik u međuvremenu unio.
    enableReinitialize: true,
    keepDirtyOnReinitialize: true
})(form)


export default form;