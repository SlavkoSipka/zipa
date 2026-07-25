import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import Text from './fields/text1';
import Check from './fields/check';
import Html from './fields/html';
import Gallery from './fields/gallery';
import Category from './fields/category';
import Image from './fields/image';
import Textarea from './fields/textarea';

import rightChevron from '../../assets/svg/right-arrow.svg';

import {
    Col,
    Row,
    Container
} from 'reactstrap';

const required = value => value ? undefined : "Required"

const renderTextField = ({
    input,
    placeholder,
    label,
    icon,
    type,
    meta: { touched, error },
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

const renderTextareaField = ({
    input,
    placeholder,
    label,
    icon,
    type,
    meta: { touched, error },
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


const renderCategoryField = ({
    input,
    label,
    categories,
    meta: { touched, error },
}) => (

        <Category
            categories={categories}
            label={label}
            errorText={touched && error}
            error={touched && error}
            {...input}
        />
    )



const renderHtmlField = ({
    input,
    placeholder,
    label,
    icon,
    type,
    height,
    meta: { touched, error },
    multilang,
    lang
}) => (

        <Html
            placeholder={placeholder}
            label={label}
            icon={icon}
            errorText={touched && error}
            error={touched && error}
            type={type}
            height={height}
            multilang={multilang}
            lang={lang}

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


                    </Col>
                    <Col lg="12">

                        <Field
                            name="content"
                            component={renderHtmlField}
                            label={'Tekst'.translate(this.props.lang)}
                            type="text"
                            height={400}
                            validate={[required]}
                            multilang
                            lang={this.props.lang}

                        ></Field>

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
    form: 'form'  // a unique identifier for this form
})(form)
