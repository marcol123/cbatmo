import { connect } from 'react-redux'
import { ThunkDispatch } from "redux-thunk";
import * as darkskyActions from '../store/darksky/actions'
import * as openweatherActions from '../store/openweather/actions'
import * as netatmoActions from '../store/netatmo/actions'
import DashboardLayout from "./DashboardLayout";
import { ApplicationState } from "../store";

const mapStateToProps = ({ netatmo}: ApplicationState) => ({
    station_data: netatmo.station_data,
    selected_module: netatmo.selected_module,
    selected_types: netatmo.selected_types,
    selected_timelapse: netatmo.selected_timelapse
});

const mapDispatchToProps = (dispatch: ThunkDispatch<any, any, any>) => ({
    fetchDarksky: () => dispatch(darkskyActions.fetchDarksky()),
    fetchOpenWeather: () => dispatch(openweatherActions.fetchOpenWeather()),
    fetchStationData: () => dispatch(netatmoActions.fetchStationData()),
    fetchMeasure: (device: string, module: string, type: string[], timelapse: '12h'|'1d'|'1m') => dispatch(netatmoActions.fetchMeasure(device, module, type, timelapse)),
    fetchRainMeasure: (device: string, module: string) => dispatch(netatmoActions.fetchRainMeasure(device, module)),
});

const DashboardLayoutContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(DashboardLayout);

export default DashboardLayoutContainer
