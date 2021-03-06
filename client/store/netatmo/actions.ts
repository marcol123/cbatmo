import { Action } from 'redux'
import { ApplicationState } from '../index'
import { ThunkAction } from 'redux-thunk'
import moment from 'moment';
import { setUserInfo } from "../application/actions";
import NetatmoNAMain from '../../models/NetatmoNAMain';
import NetatmoUserInformation from "../../models/NetatmoUserInformation";
import NetatmoChartsData, { Scale } from "../../models/NetatmoChartsData";
import { NetatmoActionTypes } from "./types";

const NETATMO_API_ROOT_URL = "https://api.netatmo.com/";

export const requestAuth = () => {
    return {
        type: NetatmoActionTypes.AUTH_REQUEST
    }
};

export const successAuth = (json: any) => {
    return {
        type: NetatmoActionTypes.AUTH_SUCCESS,
        payload: json,
        receivedAt: Date.now()
    }
};

export const failureAuth = (error: any) => {
    return {
        type: NetatmoActionTypes.AUTH_FAILURE,
        error: error
    }
};

export const fetchAuth = (): ThunkAction<void, ApplicationState, null, Action<string>> => {
    return (dispatch, getState) => {
        dispatch(requestAuth());

        const { netatmo } = getState();

        const params = new URLSearchParams();
        params.append('client_id', netatmo.client_id);
        params.append('client_secret', netatmo.client_secret);
        params.append('grant_type', 'password');
        params.append('scope', 'read_station');
        params.append('username', netatmo.username);
        params.append('password', netatmo.password);

        return fetch(`${NETATMO_API_ROOT_URL}oauth2/token`, {method: 'POST', body: params})
            .then(response => {
                if (!response.ok) throw response;
                return response.json()
            })
            .then(json => {
                window.localStorage.setItem('NetatmoRefreshToken', json.refresh_token);
                window.localStorage.setItem('NetatmoExpireIn', moment().unix() + json.expire_in);
                //window.localStorage.setItem('appIsConfigured', 'true');
                dispatch(successAuth(json));
                //dispatch(appConfigured(true));
                console.log('Fetch station data')
                dispatch(fetchStationData());
            })
            .catch(error => {
                // Todo types
                error.json().then((errorMessage: any) => {
                    dispatch(failureAuth(errorMessage))
                })
            });

    }
};

export const requestRefreshToken = () => {
    return {
        type: NetatmoActionTypes.REFRESH_TOKEN_REQUEST
    }
};

export const successRefreshToken = (json: any) => {
    return {
        type: NetatmoActionTypes.REFRESH_TOKEN_SUCCESS,
        payload: json,
        receivedAt: Date.now()
    }
};

export const failureRefreshToken = (error: any) => {
    return {
        type: NetatmoActionTypes.REFRESH_TOKEN_FAILURE,
        error: error
    }
};

export const fetchRefreshToken = (): ThunkAction<void, ApplicationState, null, Action<string>> => {
    return (dispatch, getState) => {
        dispatch(requestRefreshToken());

        const current_refresh_token = window.localStorage.getItem('NetatmoRefreshToken');
        const { netatmo } = getState();

        const params = new URLSearchParams();
        params.append('client_id', netatmo.client_id);
        params.append('client_secret', netatmo.client_secret);
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', current_refresh_token ? current_refresh_token : '');

        return fetch(`${NETATMO_API_ROOT_URL}oauth2/token`, {method: 'POST', body: params})
            .then(response => {
                if (!response.ok) throw response;
                return response.json()
            })
            .then(json => {
                window.localStorage.setItem('NetatmoRefreshToken', json.refresh_token);
                window.localStorage.setItem('NetatmoExpireIn', moment().unix() + json.expire_in);
                dispatch(successRefreshToken(json));
                dispatch(fetchStationData());
            })
            .catch(error => {
                // Todo types
                error.json().then((errorMessage: any) => {
                    dispatch(failureRefreshToken(errorMessage))
                })
            });
    }
};

export const requestStationData = () => {
    return {
        type: NetatmoActionTypes.STATION_DATA_REQUEST
    }
};

export const successStationData = (json: any) => {
    return {
        type: NetatmoActionTypes.STATION_DATA_SUCCESS,
        payload: json,
        receivedAt: Date.now()
    }
};

export const failureStationData = (error: any) => {
    return {
        type: NetatmoActionTypes.STATION_DATA_FAILURE,
        error: error
    }
};

export const fetchStationData = (): ThunkAction<void, ApplicationState, null, Action<string>> => {
    return (dispatch, getState) => {
        // If no access token or refresh token is soon expired
        if (!getState().netatmo.access_token || moment.unix(Number(getState().netatmo.access_token_expire_in)).diff(moment(), 'minute') < 10) {
            // Fetch a new access token from refresh token and then fetch station data
            dispatch(fetchRefreshToken());
        } else {
            // Fetch new data only if last data stored is bigger than 10 minutes
            if (getState().netatmo.station_data_last_updated === 0 || moment().diff(moment.unix(Number(getState().netatmo.station_data?.last_status_store)), 'minute') > 10) {
                dispatch(requestStationData());

                return fetch(`${NETATMO_API_ROOT_URL}api/getstationsdata?access_token=${getState().netatmo.access_token}`)
                    .then(response => {
                        if (!response.ok) throw response;
                        return response.json()
                    })
                    .then(json => {
                        const data = new NetatmoNAMain(json.body.devices[0]);
                        const user = new NetatmoUserInformation(json.body.user);
                        dispatch(successStationData(data))
                        dispatch(setUserInfo(user))
                    })
                    .catch(error => {
                        // Todo types
                        error.json().then((errorMessage: any) => {
                            dispatch(failureStationData(errorMessage))
                        })
                    });
            } else {
                console.debug('No new Netatmo station data to fetch')
            }
        }
    }
};


export const requestMeasure = () => {
    return {
        type: NetatmoActionTypes.MEASURE_REQUEST
    }
};

export const successMeasure = (data: any, module: string, types: string[], timelapse: '12h'|'1d'|'1m') => {
    return {
        type: NetatmoActionTypes.MEASURE_SUCCESS,
        payload: data,
        module: module,
        types: types,
        timelapse: timelapse,
        receivedAt: Date.now()
    }
};

export const failureMeasure = (error: any) => {
    return {
        type: NetatmoActionTypes.MEASURE_FAILURE,
        error: error
    }
};

export const fetchMeasure = (device: string, module: string, type: string[], timelapse: '12h'|'1d'|'1m'): ThunkAction<void, ApplicationState, null, Action<string>> => {
    return (dispatch, getState) => {
        // Get measure only if we have no data or if the last fetch is bigger than 10 minutes
        if (getState().netatmo.measure_data.length === 0 ||
            (getState().netatmo.selected_types[0] !== type[0] || getState().netatmo.selected_module !== module) ||
            getState().netatmo.selected_timelapse !== timelapse ||
            moment().diff(moment.unix(Number(getState().netatmo.station_data?.last_status_store)), 'minute') > 10) {
            dispatch(requestMeasure());

            let date_begin;
            let scale;

            switch (timelapse) {
                case "12h":
                    date_begin = moment().subtract(11, 'hours').unix();
                    scale = '30min';
                    break;
                case "1d":
                    date_begin = moment().subtract(23, 'hours').unix();
                    scale = '1hour';
                    break;
                case "1m":
                    date_begin = moment().subtract(1, 'months').unix();
                    scale = '1day';
                    break;
            }

            const date_end = moment().unix();

            return fetch(`${NETATMO_API_ROOT_URL}api/getmeasure?access_token=${getState().netatmo.access_token}&device_id=${device}&module_id=${module}&scale=${scale}&type=${type}&date_begin=${date_begin}&date_end=${date_end}&optimize=false`)
                .then(response => {
                    if (!response.ok) throw response;
                    return response.json()
                })
                .then(json => {
                    const dataChart = new NetatmoChartsData(json.body, type);
                    dispatch(successMeasure(dataChart.data, module, type, timelapse))
                })
                .catch(error => {
                    // Todo types
                    error.json().then((errorMessage: any) => {
                        dispatch(failureMeasure(errorMessage))
                    })
                });
        } else {
            console.debug('No new Netatmo measure data to fetch')
        }
    }
};


export const requestRainMeasure = () => {
    return {
        type: NetatmoActionTypes.MEASURE_RAIN_REQUEST
    }
};

export const successRainMeasure = (data: any) => {
    return {
        type: NetatmoActionTypes.MEASURE_RAIN_SUCCESS,
        payload: data,
        receivedAt: Date.now()
    }
};

export const failureNRainMeasure = (error: any) => {
    return {
        type: NetatmoActionTypes.MEASURE_RAIN_FAILURE,
        error: error
    }
};

export const fetchRainMeasure = (device: string, module: string): ThunkAction<void, ApplicationState, null, Action<string>> => {
    return (dispatch, getState) => {
        // Get measure only if we have no data or if the last fetch is bigger than 10 minutes
        if (getState().netatmo.measure_rain_data.length === 0 || moment().diff(moment.unix(Number(getState().netatmo.station_data?.last_status_store)), 'minute') > 10) {
            dispatch(requestRainMeasure());

            const date_begin = moment().subtract(23, 'hours').unix();
            const date_end = moment().unix();

            return fetch(`${NETATMO_API_ROOT_URL}api/getmeasure?access_token=${getState().netatmo.access_token}&device_id=${device}&module_id=${module}&scale=1hour&type=Rain&date_begin=${date_begin}&date_end=${date_end}&optimize=false`)
                .then(response => {
                    if (!response.ok) throw response;
                    return response.json()
                })
                .then(json => {
                    const dataChart = new NetatmoChartsData(json.body, ['Rain']);
                    dispatch(successRainMeasure(dataChart.data))
                })
                .catch(error => {
                    // Todo types
                    error.json().then((errorMessage: any) => {
                        dispatch(failureNRainMeasure(errorMessage))
                    })
                });
        } else {
            console.debug('No new Netatmo rain measure data to fetch')
        }
    }
};
