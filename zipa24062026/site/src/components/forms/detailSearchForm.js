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
            <form onSubmit={handleSubmit} className="detail-search-form">
                <Row>
                    <Col lg="6">
                        <Field
                            name="keywords"
                            component={renderTagsField}
                            label={'Ključne riječi'.translate(this.props.lang)}
                        ></Field>
                    </Col>
                    <Col lg="6">
                        <Field
                            name="name"
                            component={renderTextField}
                            label={'Događaj'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="6">
                        <Field
                            name="photographer"
                            component={renderSelectField}
                            label={'Fotograf'.translate(this.props.lang)}
                        >
                            {
                                this.props.photographers && this.props.photographers.map((item, idx) => {
                                    return (
                                        <option value={item.userAlias}>{item.name}</option>
                                    )
                                })
                            }
                        </Field>
                    </Col>
                    <Col lg="6">
                    </Col>

                    <Col lg="6">
                        <Field
                            name="city"
                            component={renderAutoTextField}
                            suggestions={this.state.cities}
                            label={'Grad'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="3">
                        <Field
                            name="date-from"
                            component={renderDateField}
                            label={'Datum fotografisanja - OD'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="3">
                        <Field
                            name="date-to"
                            component={renderDateField}
                            label={'Datum fotografisanja - DO'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="6" className="checks">
                        <label>{'Orjentacija fotografije'.translate(this.props.lang)}</label>
                        <Field
                            name="orientation-portrait"
                            component={renderCheckField}
                            label={'Portret'.translate(this.props.lang)}
                        ></Field>
                        <Field
                            name="orientation-horizontal"
                            component={renderCheckField}
                            label={'Horizontalna'.translate(this.props.lang)}
                        ></Field>

                    </Col>



                    <Col lg="6" className="buttons">
                        <button className="button" type="button" onClick={() => this.props.handleDetailSearch(null)}>{'Zatvori'.translate(this.props.lang)}</button>
                        <button className="button" type="button" onClick={() => this.props.reset()}>{'Očisti polja'.translate(this.props.lang)}</button>
                        <button className="button">{'Pretraži'.translate(this.props.lang)}</button>
                    </Col>
                </Row>
            </form>
        )
    }
}

export default reduxForm({
    form: 'detailSearchForm'  // a unique identifier for this form
})(form)
