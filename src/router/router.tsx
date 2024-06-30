//引入react jsx写法的必须
// import React from 'react';
//引入需要用到的页面组件
// @ts-ignore
import Home from '../pages/Home';
// @ts-ignore
import Login from '../pages/Login';
import NotFound from '../pages/NotFound';
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
      <Route path="/login" component={Login} />
      <Route path="/not-found" component={NotFound} />
      <Route exact path="/" component={Home} />
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
