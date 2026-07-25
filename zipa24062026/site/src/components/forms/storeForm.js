import React, { Component } from 'react';
import { Field, reduxForm, formValueSelector } from 'redux-form'
import { Link } from 'react-router-dom'
import Isvg from 'react-inlinesvg';
import { connect } from 'react-redux'

import Text from './fields/textIcon';
import Check from './fields/check';
import Html from './fields/html';
import Gallery from './fields/gallery';
import Category from './fields/category';
import Image from './fields/image';
import Select from './fields/select';

import rightChevron from '../../assets/svg/right-arrow.svg';
import regions from '../../regions';

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

const renderSelectField = ({
    input,
    placeholder,
    label,
    children,
    meta: { touched, error },
}) => (

        <Select
            placeholder={placeholder}
            label={label}
            errorText={touched && error}
            error={touched && error}
            {...input}
        >{children}</Select>
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



class SelectingFormValuesForm extends React.Component {

    constructor(props) {
        super(props);
        this.state = {}
    }


    render() {

        const { handleSubmit, pristine, reset, submitting } = this.props;
        console.log(pristine, submitting);
        let cities;

        if (this.props.region){
            cities = [];
            for(let i=0;i<regions.length;i++){
                if (regions[i].name == this.props.region){
                    cities = regions[i].cities;
                    break;
                }
            }
        }

        return (
            <form onSubmit={handleSubmit}>
                <Container>
                    <Row>
                        <Col lg="8">

                            <Row>

                                <Col lg="6">

                                    <Field
                                        name="alias"
                                        component={renderTextField}
                                        label="Alias"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="6">

                                    <Field
                                        name="name"
                                        component={renderTextField}
                                        label="Naziv radnje"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>

                                <Col lg="6">

                                    <Field
                                        name="region"
                                        component={renderSelectField}
                                        placeholder="Izaberite regiju"
                                        label="Regija"
                                        validate={[required]}
                                    >
                                        {regions.map((item, idx) => {
                                            return (
                                                <option value={item.name}>{item.name}</option>
                                            )
                                        })}
                                    </Field>

                                </Col>
                                {this.props.region ?
                                    <Col lg="6">

                                        <Field
                                            name="city"
                                            component={renderSelectField}
                                            placeholder="Izaberite grad"
                                            label="Grad"
                                            validate={[required]}
                                        >
                                            {cities.map((item, idx) => {
                                                return (
                                                    <option value={item}>{item}</option>
                                                )
                                            })}
                                        </Field>

                                    </Col>
                                    :
                                    null
                                }
                                <Col lg="12"></Col>

                                <Col lg="6">

                                    <Field
                                        name="address"
                                        component={renderTextField}
                                        label="Adresa"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>

                                <Col lg="6">

                                    <Field
                                        name="phoneNumber"
                                        component={renderTextField}
                                        label="Telefon"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="6">

                                    <Field
                                        name="webSite"
                                        component={renderTextField}
                                        label="Web site"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="6">

                                    <Field
                                        name="adminEmail"
                                        component={renderTextField}
                                        label="Admin E-mail"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="6">

                                    <Field
                                        name="adminPassword"
                                        component={renderTextField}
                                        label="Admin Lozinka"
                                        type="text"
                                        validate={[required]}
                                    ></Field>

                                </Col>
                                <Col lg="12">

                                    <Field
                                        name="aboutUs"
                                        component={renderHtmlField}
                                        label="O nama"
                                        type="html"
                                        height={430}
                                    ></Field>



                                </Col>

                            </Row>

                        </Col>
                        <Col lg="4">

                            <Row>
                                <Col lg="6">
                                    <Field
                                        name="isVisible"
                                        component={renderCheckField}
                                        label="Vidljiva"

                                    ></Field>
                                </Col>
                                <Col lg="6">
                                    <Field
                                        name="isPromoted"
                                        component={renderCheckField}
                                        label="Izdvojena"

                                    ></Field>
                                </Col>

                                <Col lg="12">
                                    <Field
                                        name="profilePhoto"
                                        component={renderImageField}
                                        label="Logo"

                                    ></Field>

                                </Col>

                                <Col lg="12">
                                    <Field
                                        name="coverPhoto"
                                        component={renderImageField}
                                        label="Cover"

                                    ></Field>

                                </Col>

                            </Row>
                        </Col>


                        <Col lg="12">
                            <button className="submit-button">Dodaj radnju <Isvg src={rightChevron} /> </button>
                        </Col>


                    </Row>

                </Container>


            </form>
        )
    }
}
SelectingFormValuesForm = reduxForm({
    form: 'selectingFormValues' // a unique identifier for this form
})(SelectingFormValuesForm)

// Decorate with connect to read form values
const selector = formValueSelector('selectingFormValues') // <-- same as form name
SelectingFormValuesForm = connect(state => {
    const region = selector(state, 'region')
    return {
        region
    }
})(SelectingFormValuesForm)

export default SelectingFormValuesForm
