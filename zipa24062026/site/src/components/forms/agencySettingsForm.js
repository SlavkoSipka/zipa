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
    children,
    width,
    enableSelectAll
}) => (

        <MultiCheckbox
            placeholder={placeholder}
            label={label}
            errorText={touched && error}
            error={touched && error}
            width={width}
            enableSelectAll={enableSelectAll}
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
                            name="from"
                            component={renderDateField}
                            label={'OD'.translate(this.props.lang)}
                        ></Field>
                    </Col>

                    <Col lg="4">
                        <Field
                            name="to"
                            component={renderDateField}
                            label={'DO'.translate(this.props.lang)}

                        ></Field>
                    </Col>
                    
                    <Col lg="12"></Col>

                    <Col lg="4">

                        <Field
                            name="resolution3000px"
                            validate={[required]}
                            component={renderTextField}
                            label="3000px *"
                        ></Field>
                    </Col>
                    <Col lg="4">

                        <Field
                            name="resolution1500px"
                            validate={[required]}
                            component={renderTextField}
                            label="1500px *"
                        ></Field>
                    </Col>
                    <Col lg="4">

                        <Field
                            name="resolution800px"
                            validate={[required]}
                            component={renderTextField}
                            label="800px *"
                        ></Field>
                    </Col>

                    <Col lg="4">
                        <Field
                            name="categories"
                            component={renderMultiCheckboxField}
                            enableSelectAll
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
                            name="categories"
                            component={renderMultiCheckboxField}
                            enableSelectAll
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
                            name="categories"
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
                    <Col lg="4">
                        <Field
                            name="photographers"
                            component={renderMultiCheckboxField}
                            label={'Fotografi'.translate(this.props.lang)}
                            width="12"
                        >
                            {
                                this.props.photographers && this.props.photographers.map((item, idx) => {
                                    return (
                                        <option value={item._id}>{item.name}</option>

                                    )
                                })
                            }

                        </Field>

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

export default reduxForm({
    form: 'editAccountForm'  // a unique identifier for this form
})(form)
