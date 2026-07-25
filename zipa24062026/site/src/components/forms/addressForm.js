import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'

import Text from './fields/textIcon';
import Textarea from './fields/textarea';

import Check from './fields/check';
import Select from './fields/select';

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

const renderTextField = ({
    input,
    placeholder,
    label,
    icon,
    meta: { touched, error },
    type
}) => (

        <Text
            placeholder={placeholder}
            label={label}
            icon={icon}
            errorText={touched && error}
            error={touched && error}
            type={type}
            {...input}
        />
    )

    const renderTextareaField = ({
        input,
        placeholder,
        label,
        icon,
        meta: { touched, error },
        type
    }) => (
    
            <Textarea
                placeholder={placeholder}
                label={label}
                icon={icon}
                errorText={touched && error}
                error={touched && error}
                type={type}
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
                    <Col lg="12">
                        <h6>Podaci o dostavi</h6>
                    </Col>
                    <Col lg="6">
                        <Field
                            name="name"
                            component={renderTextField}
                            label="Ime i prezime"
                            validate={[required]}
                        ></Field>
                    </Col>
                    <Col lg="6">
                        <Field
                            name="phoneNumber"
                            component={renderTextField}
                            label="Telefon"
                            validate={[required]}

                        ></Field>

                    </Col>
                    <Col lg="6">
                        <Field
                            name="address"
                            component={renderTextField}
                            label="Adresa"
                            validate={[required]}

                        ></Field>

                    </Col>
                    <Col lg="6">
                        <Field
                            name="city"
                            component={renderTextField}
                            label="Grad"
                            validate={[required]}
                        ></Field>

                    </Col>
                    <Col lg="12">
                        <Field
                            name="note"
                            component={renderTextareaField}
                            label="Napomena"
                        ></Field>

                    </Col>

                    <Col lg="12">
                            <button className="submit-button">Završi narudžbu <Isvg src={rightChevron} /> </button>
                        </Col>


                </Row>
            </form>
        )
    }
}

export default reduxForm({
    form: 'addressForm'  // a unique identifier for this form
})(form)
