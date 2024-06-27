import { createStore } from 'redux';
import reducer from './reducer';

import handlePart from './middleware/handlePart';
import { applyMiddleware } from 'redux';

const store = createStore(reducer, applyMiddleware(handlePart));

export default store;
