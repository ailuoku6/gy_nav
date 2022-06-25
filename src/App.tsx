import React, { useEffect } from "react";
import "./App.css";
import Router from "./router/router";
import { setUser } from "./redux/actions";
import { GetUserStore } from "./utils/localStorageUtil";
// import { connect } from "react-redux";

import { useDispatch } from "react-redux";

import useWebsocket from "hooks/useWebwocket";

export default function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    let user = GetUserStore();
    if (user !== null && user !== undefined) {
      console.log("从本地读取到了用户", user.userName);
      //this.user = user;
      // this.props.setUser(user);
      dispatch(setUser(user));
    }
  }, []);

  useWebsocket();

  return <Router />;
}

// class App extends React.Component {
//   // eslint-disable-next-line no-useless-constructor
//   constructor(props) {
//     super(props);
//     this.state = {};
//     //this.user = null;
//   }

//   componentDidMount() {
//     this.initUser();
//   }

//   initUser() {
//     let user = GetUserStore();
//     if (user !== null && user !== undefined) {
//       console.log("从本地读取到了用户", user.userName);
//       //this.user = user;
//       this.props.setUser(user);
//     }
//   }

//   render() {
//     return <Router />;
//   }
// }

// const mapStateToProps = ({ User }) => ({
//   user: User.user,
// });

// const mapDispatchToProps = { setUser };

// export default connect(mapStateToProps, mapDispatchToProps)(App);
