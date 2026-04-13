import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
document.cookie = `app_timezone=${timezone}; path=/; SameSite=Lax`;
window.axios.defaults.headers.common['X-Timezone'] = timezone;
