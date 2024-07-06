import React, { Suspense } from 'react';
import { CircularProgress } from '@mui/material';

const Home = React.lazy(() => import('../pages/Home'));
const Login = React.lazy(() => import('../pages/Login'));
const NotFound = React.lazy(() => import('../pages/NotFound'));
// import About from './pages/about';
//引入一些模块
//Router
// import { BrowserRouter as Router,Switch, Route,Redirect} from "react-router-dom";
import { Router, Switch, Route, Redirect } from 'react-router-dom';

// @ts-ignore
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

const Loading = () => {
  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <CircularProgress />
    </div>
  );
};

const route = (
  <Router history={history}>
    <Switch>
      {/*<Redirect from="/" exact to="/index"/>*/}
      <Route
        path="/login"
        component={() => (
          <Suspense fallback={<Loading />}>
            <Login />
          </Suspense>
        )}
      />
      <Route
        path="/not-found"
        component={() => (
          <Suspense fallback={<Loading />}>
            <NotFound />
          </Suspense>
        )}
      />
      <Route
        exact
        path="/"
        component={() => (
          <Suspense fallback={<Loading />}>
            <Home />
          </Suspense>
        )}
      />
      <Redirect to="/not-found" />
    </Switch>

    {/*<Route path="/about" component={About} />*/}
  </Router>
);

function router() {
  return route;
}
export { history };
export default router;
