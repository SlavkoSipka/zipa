
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';


import Dropzone from 'react-dropzone';
import GridLayout from 'react-grid-layout';
import DatePicker from './date';
import { formValueSelector, change } from 'redux-form';  // ES6
import { connect } from 'react-redux';

import deleteIcon from '../../../assets/svg/close-icon.svg';
import image from '../../../assets/svg/picture.svg';
import {
    Container,
    Row,
    Col,
} from 'reactstrap';

import Text from './text1';
import Textarea from './textarea';
import Check from './check';
import { API_ENDPOINT, PHOTOS_ENDPOINT} from '../../../constants';

class Gallery extends Component {
    constructor(props) {
        super(props);
        this.dropzone = React.createRef()
        this.getBase64 = this.getBase64.bind(this);
        this.removeImage = this.removeImage.bind(this);
        this.onDrop = this.onDrop.bind(this);
        this.onLayoutChange = this.onLayoutChange.bind(this);
        this.state = {
            files: [],
            imagesLayout: [],
            _uploading: [],
        };
    }


    componentDidMount() {
        let files = [];
        let imagesLayout = [];
        for (let i = 0; i < this.props.value.length; i++) {
            files.push(this.props.value[i]);
            imagesLayout.push(i);
        }


        this.setState({
            files: files,
            imagesLayout: imagesLayout,
        });

    }



    componentDidUpdate(prevProps, prevState) {
        if ((!this.state.files.length && this.props.value.length) && !(prevState.files.length && !this.state.files.length)) {
            console.log(this.props.value);
            let files = [];
            let imagesLayout = [];
            for (let i = 0; i < this.props.value.length; i++) {
                files.push(this.props.value[i]);
                imagesLayout.push(i);
            }

            this.setState({
                files: files,
                imagesLayout: imagesLayout,
            });

            if (this.props.value.length) {

                this.props.enableSave();
            }



        }

        if (prevState.files.length && !this.state.files.length) {
            let files = [];
            for (let i = 0; i < this.state.imagesLayout.length; i++) {
                files.push(this.state.files[this.state.imagesLayout[i]]);
            }

            this.props.onChange(files);

        }
    }

    removeImage(idx) {
        console.log(idx);

        console.log('removeImage');
        let files = this.state.files.slice(0, idx).concat(this.state.files.slice(idx + 1, this.state.files.length))
        let imagesLayout = this.state.imagesLayout.slice(0, idx).concat(this.state.imagesLayout.slice(idx + 1, this.state.imagesLayout.length))
        let _uploading = this.state._uploading.slice(0, idx).concat(this.state._uploading.slice(idx + 1, this.state._uploading.length))
        this.setState({
            files: files,
            imagesLayout: imagesLayout,
            _uploading: _uploading
        });
    }

    getBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
                let encoded = reader.result;
                resolve(encoded);
            };
            reader.onerror = error => reject(error);
        });
    }


    async onDrop(imageFiles) {

        let imagesLayout = [];
        let images = [];
        let _uploading = [];


        this.setState({
            uploading: true,
            imagesCount: imageFiles.length,
            imagesUploaded: 0
        }, () => {

            for (let i = 0; i < imageFiles.length; i++) {
                let formData = new FormData();
                formData.append('file', imageFiles[i]);
                let name = this.state.files.length + i;

                this.props.uploadHandler(formData, (img) => {


                    this.props.onChange(img);

                    if (!this.props.formName && img.galleryName) {
                        this.props.changeName({ ba: img.galleryName });
                    }

                    if (img.description) {
                        this.props.changeDescription({ ba: img.description });
                    }

                    if (!this.props.formDate && img.date) {
                        this.props.changeDate(img.date);
                    }
                    if (img.location) {
                        this.props.changeLocation(img.location);
                    }

                    if (this.state.imagesUploaded + 1 >= this.state.imagesCount) {
                        this.props.enableSave();
                    }
                    this.setState({
                        _loading: null,
                        uploading: this.state.imagesUploaded + 1 >= this.state.imagesCount ? false : true,
                        imagesUploaded: this.state.imagesUploaded + 1
                    })

                    let files = this.state.files;
                    let _uploading = this.state._uploading;
                    files[name] = img;
                    _uploading[name] = null;

                    this.setState({
                        _uploading: _uploading,
                        files: files
                    }, () => {
                        this.props.onChange(this.state.files);
                    })

                })


                images.push(null);
                imagesLayout.push(i);
                _uploading.push(true);
            }

            this.setState({
                files: this.state.files.concat(images),
                imagesLayout: this.state.imagesLayout.concat(imagesLayout),
                _uploading: this.state._uploading.concat(_uploading)
            }, () => {
                let files = [];
                for (let i = 0; i < this.state.imagesLayout.length; i++) {
                    files.push(this.state.files[this.state.imagesLayout[i]]);
                }

                this.props.onChange(files);
            });
        })





    }



    onLayoutChange(layout) {
        //console.log(layout);
        let arr = [];
        for (let i = 0; i < layout.length; i++) {
            arr.push({ idx: layout[i].i, position: layout[i].y * 3 + layout[i].x });
        }

        arr.sort(function (a, b) { return (a.position > b.position) ? 1 : ((b.position > a.position) ? -1 : 0); });
        let imagesLayout = [];
        for (let i = 0; i < arr.length; i++) {
            imagesLayout.push(parseInt(arr[i].idx));
        }


        this.setState({
            imagesLayout: imagesLayout
        }, () => {
            let files = [];
            for (let i = 0; i < this.state.imagesLayout.length; i++) {
                files.push(this.state.files[this.state.imagesLayout[i]]);
            }

            this.props.onChange(files);


        });

    }


    render() {

        let images = [];

        if (this.state.files) {
            let x = 0;
            let y = 0;
            for (let i = 0; i < this.state.files.length; i++) {
                let layout = { i: i.toString(), x: x, y: y, w: 1, h: 1 };
                let item = {
                    content: (
                        <div className="image" key={i.toString()} data-grid={layout} >

                            <div className="image-wrap">

                                <img src={this.state.files[i] && (`${PHOTOS_ENDPOINT}/photos/350x/` + this.state.files[i].image)} onClick={() => this.setState({ selectedImage: JSON.parse(JSON.stringify(this.state.files[i])), selectedImageIdx: i })} />
                                <div className={'delete'} onClick={() => this.removeImage(i)}>
                                    <Isvg src={deleteIcon} />
                                </div>
                            </div>
                        </div>
                    )
                };
                images.push(item);
                x++;
                if (x >= 3) {
                    y++;
                    x = 0;
                }
            }



        }


        return (
            <div className="input-wrap gallery-input-wrap">
                <label>{this.props.label}</label>
                <div className="file-drop" ref={(ref) => this.dropzone = ref}>

                    <Dropzone
                        onDrop={this.onDrop}
                        className='dropzone'
                        activeClassName='active-dropzone'
                        multiple={true}>

                        <button button type="button"><i className="mdi mdi-file-outline"></i></button>




                    </Dropzone>

                    <div className="bottom-content">
                        <Isvg src={image} />
                        <p> <span>Upload a file</span> or drag and drop</p>
                    </div>

                    {this.state.uploading ?
                        <div className="progress-wrap">
                            <div>
                                <div style={{ width: `${((this.state.imagesUploaded * 100) / this.state.imagesCount)}%` }}></div>
                            </div>
                            <p>{((this.state.imagesUploaded * 100) / this.state.imagesCount).toFixed(2)}%</p>
                        </div>

                        :
                        null
                    }

                    <GridLayout
                        className="grid-layout"
                        onLayoutChange={this.onLayoutChange}
                        width={this.dropzone.offsetWidth}
                        margin={[30, 30]}
                        rowHeight={120}

                        compactType={'horizontal'}
                        isResizable={false}
                        verticalCompact={true}
                        horizontalCompact={true}
                        useCSSTransforms={true}
                        cols={3}
                    >

                        {
                            images.map((image, idx) => {
                                return (
                                    image.content
                                );
                            })
                        }
                    </GridLayout>


                </div>

                {this.state.selectedImage ?
                    <div className="exif-modal">
                        <div>
                            <Container>
                                <Row>
                                    <Col lg="12">
                                        <h3>Izmjeni fotografiju</h3>

                                    </Col>

                                    <Col lg="6">
                                        <Text label="Naziv *" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.name = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.name} />
                                        <DatePicker label="Fotografisano" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.date = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.date} />
                                        <Text label="Lokacija" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.location = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.location} />
                                        <Text label="Autor" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.author = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.author} />
                                        <Text label="Caption writer" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.captionWriter = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.captionWriter} />
                                        <Text label="Copyright" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.copyright = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.copyright} />
                                        <Check label="Izdvojena na profilu" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.visibleOnProfile = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.visibleOnProfile} />

                                    </Col>
                                    <Col lg="6">
                                        <img src={`'${PHOTOS_ENDPOINT}/photos/700x/'` + this.state.selectedImage.image} />
                                    </Col>
                                    <Col lg="12">
                                        <Textarea label="Opis *" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.description = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.description} />
                                    </Col>

                                    <Col lg="12" className="buttons">
                                        <button type="button" onClick={() => {
                                            let files = this.state.files;
                                            files[this.state.selectedImageIdx] = JSON.parse(JSON.stringify(this.state.selectedImage));
                                            this.setState({
                                                files,
                                                selectedImage: null,
                                                selectedImageIdx: null
                                            });
                                            this.props.onChange(files)
                                        }}>IZMJENI</button>
                                        <button type="button" onClick={() => {
                                            this.setState({
                                                selectedImage: null,
                                                selectedImageIdx: null
                                            })
                                        }}>ZATVORI</button>
                                    </Col>

                                </Row>
                            </Container>
                        </div>
                    </div>
                    :
                    null
                }




            </div>
        );
    }
}

const selector = formValueSelector('galleryForm');

export default connect(state => {
    return {
        formName: selector(state, 'name'),
        formDescription: selector(state, 'description'),
        formDate: selector(state, 'date'),
        formLocation: selector(state, 'location'),

    }

}, {
    changeName: value => change("galleryForm", "name", value),
    changeDescription: value => change("galleryForm", "description", value),
    changeDate: value => change("galleryForm", "date", value),
    changeLocation: value => change("galleryForm", "location", value),


})(Gallery);