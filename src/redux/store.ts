import { createStore } from 'redux';
import reducer from './reducer';

import handlePart from './middleware/handlePart';
import { applyMiddleware } from 'redux';

const store = createStore(reducer, applyMiddleware(handlePart));


export type StoreType = ReturnType<typeof reducer>;

export default store;
