import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'

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
    meta: { touched, error },
    type,
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
                    name="newPassword"
                    component={renderTextField}
                    icon={lock}
                    label={'Nova lozinka'.translate(this.props.lang)}
                    validate={[required]}
                    placeholder={'Unesite novu lozinku'.translate(this.props.lang)}
                    type="password"

                ></Field>
                <Field
                    name="retypedPassword"
                    component={renderTextField}
                    icon={lock}
                    label={'Ponovite lozinku'.translate(this.props.lang)}
                    validate={[required]}
                    placeholder={'Ponovite lozinku'.translate(this.props.lang)}
                    type="password"

                ></Field>

                <button className="button">{'Resetuj lozinku'.translate(this.props.lang)}</button>
            </form>
        )
    }
}

export default reduxForm({
    form: 'form'  // a unique identifier for this form
})(form)
