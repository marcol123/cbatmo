import { connect } from 'react-redux'
import { ThunkDispatch} from "redux-thunk";
import { ApplicationState } from "../store";
import ModuleDateTime from "../components/ModuleDateTime"

const mapStateToProps = ({ darksky, application}: ApplicationState) => ({
    sunset_time: darksky.data?.daily.data[0].sunset_time,
    sunrise_time: darksky.data?.daily.data[0].sunrise_time,
    locale: application.user.lang
});

const mapDispatchToProps = (dispatch: ThunkDispatch<any, any, any>) => ({

});

const ModuleDateTimeContainer = connect(
    mapStateToProps,
    mapDispatchToProps
)(ModuleDateTime);

export default ModuleDateTimeContainer