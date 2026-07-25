import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'

import Textarea from './fields/textarea';
import rightChevron from '../../assets/svg/right-arrow.svg';
import Isvg from 'react-inlinesvg';



const required = value => value ? undefined : "Required"

const renderTextareaField = ({
    input,
    placeholder,
    label,
    meta: { touched, error },
}) => (

        <Textarea
            placeholder={placeholder}
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
            <form onSubmit={handleSubmit} className="comment-form reply-form">
                <Field
                    name="comment"
                    component={renderTextareaField}
                    validate={[required]}
                    placeholder='Leave a reply...'

                ></Field>
                <button className="button">Reply <Isvg src={rightChevron} /></button>
            </form>
        )
    }
}

export default reduxForm({
    form: 'replyForm'  // a unique identifier for this form
})(form)
