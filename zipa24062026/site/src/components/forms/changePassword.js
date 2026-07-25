import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'

import Text from './fields/text1';
import Name from './fields/name';

import Check from './fields/check';
import Select from './fields/select';
import Image from './fields/profilePhoto';

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

const renderNameField = ({
    input,
    placeholder,
    label,
    icon,
    meta: { touched, error },
    type
}) => (

        <Name
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
                        <Field
                            name="oldPassword"
                            component={renderTextField}
                            label={'Stara lozinka'.translate(this.props.lang)}
                        ></Field>
                    </Col>
                    <Col lg="12">
                        <Field
                            name="newPassword"
                            component={renderTextField}
                            label={'Nova lozinka'.translate(this.props.lang)}
                        ></Field>
                    </Col>
                    <Col lg="12">
                        <Field
                            name="newPasswordRetyped"
                            component={renderTextField}
                            label={'Ponovi lozinku'.translate(this.props.lang)}
                        ></Field>
                    </Col>


                    <Col lg="12">
                        <button className="button">{'Sačuvaj podatke'.translate(this.props.lang)}</button>
                    </Col>
                </Row>
            </form>
        )
    }
}

export default reduxForm({
    form: 'editAccountForm'  // a unique identifier for this form
})(form)
