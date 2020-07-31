//引入react jsx写法的必须
import React from 'react';
//引入需要用到的页面组件
import Home from '../pages/Home';
import Login from "../pages/Login";
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
            <Route path="/" component={Home} />

        </Switch>

        {/*<Route path="/about" component={About} />*/}
    </Router>
);

function router(){
    return route;
    // return (
    //     <Router>
    //         <Switch>
    //             {/*<Redirect from="/" exact to="/index"/>*/}
    //             <Route exact path="/login" component={Login}/>
    //             <Route exact path="/" component={Home} />

    //         </Switch>

    //         {/*<Route path="/about" component={About} />*/}
    //     </Router>);
}
export {history};
export default router;
