import React, { Suspense } from 'react';
//引入react jsx写法的必须
// import React from 'react';
//引入需要用到的页面组件
// @ts-ignore
// import Home from '../pages/Home';
// // @ts-ignore
// import Login from '../pages/Login';
// import NotFound from '../pages/NotFound';
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

const route = (
  <Router history={history}>
    <Switch>
      {/*<Redirect from="/" exact to="/index"/>*/}
      <Route
        path="/login"
        component={() => (
          <Suspense>
            <Login />
          </Suspense>
        )}
      />
      <Route
        path="/not-found"
        component={() => (
          <Suspense>
            <NotFound />
          </Suspense>
        )}
      />
      <Route
        exact
        path="/"
        component={() => (
          <Suspense>
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
