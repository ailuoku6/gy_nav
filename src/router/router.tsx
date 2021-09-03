//引入react jsx写法的必须
import React from 'react';
//引入需要用到的页面组件
import Home from '../pages/Home';
import Login from "../pages/Login";
import NotFound from '../pages/NotFound'
// import About from './pages/about';
//引入一些模块
//Router
// import { BrowserRouter as Router,Switch, Route,Redirect} from "react-router-dom";
import { Router,Switch, Route,Redirect} from "react-router-dom";

import { createBrowserHistory } from 'history';

const history =  createBrowserHistory();

const route = (
    <Router history={history}>
        <Switch>
            {/*<Redirect from="/" exact to="/index"/>*/}
            <Route path="/login" component={Login}/>
            <Route path="/not-found" component={NotFound} />
            <Route exact path="/" component={Home} />
            <Redirect to="/not-found" />

        </Switch>

    </Router>
);

function router(){
    return route;
}
export {history};
export default router;
