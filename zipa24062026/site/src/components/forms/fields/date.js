
import React, { Component } from 'react';
import { Link, Redirect } from 'react-router-dom';

import Isvg from 'react-inlinesvg';
import { Calendar } from 'react-date-range';

import 'react-date-range/dist/styles.css'; // main style file
import 'react-date-range/dist/theme/default.css'; // theme css file

import moment from 'moment';


class DatePicker extends Component {
    constructor(props) {
        super(props);
        this.wrapperRef = React.createRef();

        this.state = {
        };
    }

    componentDidMount() {
        let date = new Date();

        this.setState({
            year: date.getFullYear()
        })


        if (this.props.value){
            this.setState({
                value: moment.unix(this.props.value).format('DD.MM.YYYY')
            })
        }

        document.addEventListener('mousedown', this.handleClickOutside);
    }

    componentDidUpdate(prevProps){
        if (prevProps.value != this.state.value && !this.state.value){
            if (this.props.value){
                this.setState({
                    value: moment.unix(this.props.value).format('DD.MM.YYYY')
                })
            }    
        }
    }

    componentWillUnmount() {
        document.removeEventListener('mousedown', this.handleClickOutside);
    }


    handleClickOutside = (event) => {
        if (this.wrapperRef && !this.wrapperRef.current.contains(event.target)) {
            this.setState({
                showCalendar: null
            })
        }
    }




    render() {
        //console.log(this.props)
        //console.log(generateAlias("ćčććasd"))
        return (
            <div className={this.props.error ? 'date-picker-field required' : 'date-picker-field'} ref={this.wrapperRef}>
                <label >{this.props.label}</label>
                <input placeholder={this.props.placeholder ? this.props.placeholder : null}   value={this.state.value} onChange={(e) => {

                    if (e.target.value && e.target.value.split('.').length - 1 >= 2){
                        let splitted = e.target.value.split('.');
                        if (splitted[2].length == 4){

                            let date = Math.floor(new Date(splitted[2], splitted[1] - 1, splitted[0], 0, 0, 0, 0).getTime() / 1000);
                            this.props.onChange(date);
                        }
                    }

                    this.setState({
                        value: e.target.value
                    })
                }}
                    type="text" onFocus={() => {
                        if (!this.state.showCalendar) {
                            this.setState({
                                showCalendar: true
                            })
                        }
                    }}  />

                {this.state.showCalendar ?
                    <Calendar
                        minDate={new Date(1990, 1 - 1)}
                        maxDate={new Date(this.state.year, 11, 31)}
                        date={this.props.value ? moment.unix(this.props.value).toDate() : new Date()}
                        onChange={(date) => {
                            this.props.onChange(Math.floor(date.getTime() / 1000))
                            this.setState({
                                showCalendar: null,
                                value: moment.unix(Math.floor(date.getTime() / 1000)).format('DD.MM.YYYY')
                            })
                        }}
                    />
                    :
                    null
                }
            </div>

        );
    }
}

export default DatePicker;