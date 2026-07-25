import React, {Component} from 'react';
import Page from '../../containers/page';
import {API_ENDPOINT} from '../../constants';
import someImage from "../../assets/images/blog2.png";

class PhotoModal extends Component {
    constructor(props) {
        super(props);

        this.state = {};
    }

    render() {
        return (
            <div className={'photoModal'}>
                <div className={'photoModalContent'}>
                    <button className={'navigationButton'}>{'<'}</button>
                    <div className={'imageContainer'}>
                        <div className={'imageItems'}>
                            <div className={'photoModalClose'}>
                                <button className={'photoModalCloseButton'}
                                        onClick={() => this.setState({modalOpen: false})}>X
                                </button>
                            </div>
                            <div className={'imagesLayout'}>
                                <div className={'imagesLayoutLeft'}>
                                    <img src={someImage}/>
                                </div>
                                <div className={'imagesLayoutRight'}>
                                    <div className={'imagesButtons'}>
                                        <div>
                                            <button className={''}>
                                                                <span>
                                                                3000 px
                                                                </span>
                                                <span>
                                                                20.00 KM
                                                                </span>
                                            </button>
                                            <button>
                                                                <span>
                                                                1500 px
                                                                </span>
                                                <span>
                                                                10.00 KM
                                                                </span>
                                            </button>
                                            <button>
                                                                <span>
                                                                800 px
                                                                </span>
                                                <span>
                                                                3.00 KM
                                                                </span>
                                            </button>
                                        </div>
                                        <button className={'buyPhoto'}>KUPI FOTOGRAFIJU</button>
                                    </div>
                                    <div className={'imagesRightDescription'}>
                                        <div className={'descriptionHeader'}>
                                            <h6>NAZIV</h6>
                                            <p>ogfdijdofigjosdfjgiosdjfgilsd.jpg</p>
                                        </div>
                                        <div className={'itemDescriptionItems'}>
                                            <div>
                                                <h6>DIMENZIJA</h6>
                                                <p>5860x3072</p>
                                            </div>
                                            <div className={'rightText'}>
                                                <h6>LOKACIJA</h6>
                                                <p>Bijeljina, Bosnia i Hercegovina</p>
                                            </div>
                                        </div>
                                        <div className={'itemDescriptionItems'}>
                                            <div>
                                                <h6>Fotografisano</h6>
                                                <p>01.01.1970</p>
                                            </div>
                                            <div className={'rightText'}>
                                                <h6>AUTOR</h6>
                                            </div>
                                        </div>
                                        <div className={'itemDescriptionItems'}>
                                            <div>
                                                <h6>Caption writer</h6>
                                            </div>
                                            <div className={'rightText'}>
                                                <h6>Copyright</h6>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button className={'navigationButton'}>{'>'}</button>
                </div>
            </div>
        );
    }
}

export default Page(PhotoModal);