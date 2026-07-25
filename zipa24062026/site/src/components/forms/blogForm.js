import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import Text from './fields/textIcon';
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
}) => (

        <Html
            placeholder={placeholder}
            label={label}
            icon={icon}
            errorText={touched && error}
            error={touched && error}
            type={type}
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
            <form onSubmit={handleSubmit}>
                <Container>
                    <Row>
                        <Col lg="8">

                            <Row>

                                <Col lg="8">

                                    <Field
                                        name="title"
                                        component={renderTextField}
                                        label={'Naslov'.translate(this.props.lang)}
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="4">
                                    <Field
                                        name="isVisible"
                                        component={renderCheckField}
                                        label={'Vidljiva'.translate(this.props.lang)}

                                    ></Field>
                                </Col>
                                <Col lg="12">

                                    <Field
                                        name="shortDescription"
                                        component={renderTextareaField}
                                        label={'Uvodni tekst'.translate(this.props.lang)}
                                        validate={[required]}
                                    ></Field>

                                </Col>

                            </Row>

                        </Col>
                        <Col lg="4">

                            <Row>
                                <Col lg="12">
                                    <Field
                                        name="image"
                                        component={renderImageField}
                                        label={'Fotografija'.translate(this.props.lang)}

                                    ></Field>

                                </Col>




                            </Row>
                        </Col>

                        <Col lg="12">

                            <Field
                                name="content"
                                component={renderHtmlField}
                                label={'Kompletan tekst'.translate(this.props.lang)}
                                type="text"
                                height={400}
                                validate={[required]}
                            ></Field>

                        </Col>

                        <Col lg="12">
                            <button className="submit-button">{'Spremi'.translate(this.props.lang)} <Isvg src={rightChevron} /> </button>
                        </Col>


                    </Row>

                </Container>


            </form>
        )
    }
}

export default reduxForm({
    form: 'form'  // a unique identifier for this form
})(form)
