import Vue from 'vue'
import MuseUI from 'muse-ui';
import 'muse-ui/dist/muse-ui.css';

import login from './login.vue'

Vue.use(MuseUI);
Vue.use(require('vue-resource'));

Vue.config.productionTip = false

new Vue({
    render: h => h(login),
}).$mount('#allsite')