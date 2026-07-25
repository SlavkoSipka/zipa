import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'

import Textarea from './fields/textarea';
import Rating from './fields/rating';

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
const renderRatingField = ({
    input,
    meta: { touched, error },
}) => (

        <Rating
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
            <form onSubmit={handleSubmit} className="review-form">
                <p>Odaberite koliko zvjezdica želite dati ovom artiklu.</p>
                <Field
                    name="rating"
                    component={renderRatingField}

                ></Field>


                <h6>Dodaj komentar</h6>
                <Field
                    name="comment"
                    component={renderTextareaField}
                    validate={[required]}
                    placeholder='Unesite komentar...'

                ></Field>
                <button className="button">OSTAVI KOMENTAR <Isvg src={rightChevron} /></button>
            </form>
        )
    }
}

export default reduxForm({
    form: 'form'  // a unique identifier for this form
})(form)
