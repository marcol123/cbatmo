import { combineReducers, Dispatch, Action, AnyAction } from 'redux';
import { applicationReducer } from "./application/reducer";
import { darkskyReducer } from "./darksky/reducer";
import { netatmoReducer } from "./netatmo/reducer";
import {openWeatherReducer} from "./openweather/reducer";
import { IApplicationState } from "./application/types";
import { IDarkskyState } from "./darksky/types";
import { INetatmoState } from "./netatmo/types";
import {IOpenWeatherState} from "./openweather/types";

// The top-level state object.
export interface ApplicationState {
    application: IApplicationState,
    darksky: IDarkskyState,
    openweather: IOpenWeatherState,
    netatmo: INetatmoState
}

// Additional props for connected React components. This prop is passed by default with `connect()`
export interface ConnectedReduxProps<A extends Action = AnyAction> {
    dispatch: Dispatch<A>
}

export const rootReducer = combineReducers<ApplicationState>({
    application: applicationReducer,
    darksky: darkskyReducer,
    openweather: openWeatherReducer,
    netatmo: netatmoReducer
});
