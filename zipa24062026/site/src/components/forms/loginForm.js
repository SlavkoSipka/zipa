import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import {Link} from 'react-router-dom'

import Text from './fields/textIcon';

import Check from './fields/check';

import mail from '../../assets/svg/mail.svg';
import lock from '../../assets/svg/lock.svg';




const required = value => value ? undefined : "Required"

const renderTextField = ({
    input,
    placeholder,
    label,
    icon,
    type,
    meta: { touched, error },
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
        console.log(pristine, submitting);

        return (
            <form onSubmit={handleSubmit} className="login-form">
                <Field
                    name="email"
                    component={renderTextField}
                    icon={mail}
                    type="email"
                    label={'E-mail Adresa'.translate(this.props.lang)}
                    validate={[required]}
                    placeholder='name@yourdomain.com'

                ></Field>
                <Field
                    name="password"
                    component={renderTextField}
                    icon={lock}
                    type="password"
                    label={'Lozinka'.translate(this.props.lang)}
                    validate={[required]}
                    placeholder={'Unesite lozinku'.translate(this.props.lang)}

                ></Field>
                <div className="login-options">
                    <Field
                        name="rememberMe"
                        component={renderCheckField}
                        label={'Zapamti me'.translate(this.props.lang)}

                    ></Field>
                    <Link to='/reset-password'>{'Zaboravljena šifra'.translate(this.props.lang)}</Link>
                </div>
                <button className="button">{'Uloguj se'.translate(this.props.lang)}</button>
            </form>
        )
    }
}

export default reduxForm({
    form: 'form'  // a unique identifier for this form
})(form)
