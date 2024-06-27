import React from "react";
import "./App.css";
//import './dark.css';
import Router from "./router/router";
import { setUser } from "./redux/actions";
import { GetUserStore } from "./utils/localStorageUtil";
// import {GetPartData,ValidToken} from './utils/Api'
// import {get,post} from "./utils/http";
import { connect } from "react-redux";

// import useMediaQuery from '@mui/material/useMediaQuery';
// import { createMuiTheme, ThemeProvider } from '@mui/material/styles';
// import CssBaseline from '@mui/material/CssBaseline';

class App extends React.Component {
  // eslint-disable-next-line no-useless-constructor
  constructor(props) {
    super(props);
    this.state = {};
    //this.user = null;
  }

  componentDidMount() {
    this.initUser();
  }

  initUser() {
    let user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log("从本地读取到了用户", user.userName);
      //this.user = user;
      this.props.setUser(user);
    }
  }

  render() {
    // const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

    // const theme = React.useMemo(
    //     () =>
    //     createMuiTheme({
    //         palette: {
    //             type: prefersDarkMode ? 'dark' : 'light',
    //         },
    //     }),
    //     [prefersDarkMode],
    // );

    return (
      // <ThemeProvider theme={theme}>
      //     <CssBaseline/>
      //     <Router/>
      // </ThemeProvider>
      <Router />
    );
  }
}

const mapStateToProps = ({ User }) => ({
  user: User.user,
});

const mapDispatchToProps = { setUser };

// export default App;

export default connect(mapStateToProps, mapDispatchToProps)(App);
// export default App;
