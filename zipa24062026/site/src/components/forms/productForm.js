import React, { Component } from 'react';
import { Field, reduxForm } from 'redux-form'
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';

import Text from './fields/textIcon';
import Textarea from './fields/textarea';

import Check from './fields/check';
import Html from './fields/html';
import Gallery from './fields/gallery';
import Category from './fields/category';

import rightChevron from '../../assets/svg/right-arrow.svg';

import {
    Col,
    Row,
    Container
} from 'reactstrap';

const required = value => value ? undefined : "Required"
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
                        <Col lg="6">

                            <Row>

                                <Col lg="6">

                                    <Field
                                        name="sku"
                                        component={renderTextField}
                                        label="Šifra artikla"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>

                                <Col lg="6">

                                    <Field
                                        name="barCode"
                                        component={renderTextField}
                                        label="Bar kod (opciono)"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="12">

                                    <Field
                                        name="name"
                                        component={renderTextField}
                                        label="Naziv proizvoda"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>

                                <Col lg="12">

                                    <Field
                                        name="brand"
                                        component={renderTextField}
                                        label="Brend"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>

                                <Col lg="6">

                                    <Field
                                        name="stock"
                                        component={renderTextField}
                                        label="Na stanju"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="6">

                                    <Field
                                        name="minOrder"
                                        component={renderTextField}
                                        label="Minimalna narudžba (komada)"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="6">

                                    <Field
                                        name="price"
                                        component={renderTextField}
                                        label="Cijena"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="12">
                                </Col>
                                <Col lg="3">

                                    <Field
                                        name="length"
                                        component={renderTextField}
                                        label="Dužina [cm]"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="3">

                                    <Field
                                        name="width"
                                        component={renderTextField}
                                        label="Širina [cm]"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="3">

                                    <Field
                                        name="height"
                                        component={renderTextField}
                                        label="Visina [cm]"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="3">

                                    <Field
                                        name="weight"
                                        component={renderTextField}
                                        label="Težina [kg]"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="12">
                                    <Field
                                        name="used"
                                        component={renderCheckField}
                                        label="Korišteno"

                                    ></Field>
                                </Col>


                                <Col lg="12">

                                    <Field
                                        name="shortDescription"
                                        component={renderTextareaField}
                                        label="Kratak opis artikla"
                                        type="html"
                                        height={230}
                                    ></Field>

                                </Col>




                            </Row>

                        </Col>
                        <Col lg="6">

                            <Row>
                                <Col lg="3">
                                    <Field
                                        name="isVisible"
                                        component={renderCheckField}
                                        label="Vidljiv u shopu"

                                    ></Field>
                                </Col>
                                <Col lg="3">
                                    <Field
                                        name="isPromoted"
                                        component={renderCheckField}
                                        label="Izdvojen"

                                    ></Field>
                                </Col>
                                <Col lg="3">
                                    <Field
                                        name="isPopular"
                                        component={renderCheckField}
                                        label="Popularan"

                                    ></Field>
                                </Col>
                                <Col lg="3">
                                    <Field
                                        name="onOffer"
                                        component={renderCheckField}
                                        label="Na akciji"

                                    ></Field>
                                </Col>

                                <Col lg="12">
                                    <Field
                                        name="images"
                                        component={renderGalleryField}
                                        label="Fotografije"

                                    ></Field>

                                </Col>

                            </Row>
                        </Col>

                        <Col lg="12">

                            <Field
                                name="description"
                                component={renderHtmlField}
                                label="Detaljan opis artikla"
                                type="html"
                                height={430}
                            ></Field>



                        </Col>
                        <Col lg="12">
                            <Field
                                name="category"
                                component={renderCategoryField}
                                height={430}
                                categories={this.props.categories.map((item) => {
                                    return {
                                        name: item.name,
                                        value: item.breadcrumb
                                    }
                                })
                                }
                            ></Field>


                        </Col>

                        <Col lg="12">
                            <button className="submit-button">Sačuvaj <Isvg src={rightChevron} /> </button>
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
