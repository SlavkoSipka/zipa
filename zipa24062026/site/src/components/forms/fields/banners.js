
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';


import Dropzone from 'react-dropzone';
import GridLayout from 'react-grid-layout';
import DatePicker from './date';

import deleteIcon from '../../../assets/svg/close-icon.svg';
import image from '../../../assets/svg/picture.svg';
import {
    Container,
    Row,
    Col,
} from 'reactstrap';

import Text from './text1';
import Textarea from './textarea';
import { API_ENDPOINT } from '../../../constants';

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

        for (let i = 0; i < imageFiles.length; i++) {
            let formData = new FormData();
            formData.append('file', imageFiles[i]);
            let name = this.state.files.length + i;

            fetch(`${API_ENDPOINT}/upload`, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    //'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`

                },
                body: formData
            }).then((res) => res.text()).then((img) => {
                this.props.onChange(img);
                this.setState({
                    _loading: null
                })

                let files = this.state.files;
                let _uploading = this.state._uploading;
                files[name] = { image: img };
                _uploading[name] = null;

                this.setState({
                    _uploading: _uploading,
                    files: files
                }, () => {
                    this.props.onChange(this.state.files);
                })


            });

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
                        <div className="image" key={i.toString()} data-grid={layout} onClick={() => this.setState({ selectedImage: JSON.parse(JSON.stringify(this.state.files[i])), selectedImageIdx: i })}>

                            <div className="image-wrap">

                                <img src={this.state.files[i] && this.state.files[i].image} />
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
                                        <h3>Izmjeni banner</h3>

                                    </Col>

                                    <Col lg="6">
                                        <Text label="Link *" onChange={(e) => {
                                            let selectedImage = this.state.selectedImage;
                                            selectedImage.link = e;
                                            this.setState({
                                                selectedImage: selectedImage
                                            })
                                        }} value={this.state.selectedImage.link} />
                                    </Col>
                                    <Col lg="6">
                                        <img src={this.state.selectedImage.image} />
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

export default Gallery;