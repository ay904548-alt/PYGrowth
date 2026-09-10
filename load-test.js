import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const pageLoad = new Trend('page_load_duration');
const pageSuccess = new Rate('page_success_rate');

const ROUTES = [
  'https://pygrowth.in',
  'https://pygrowth.in/insights',
  'https://pygrowth.in/contact',
  'https://pygrowth.in/payment-portal',
];

export const options = {
  scenarios: {
    steady: {
      executor: 'constant-vus',
      vus: 20,
      duration: '20s',
      exec: 'steadyLoad',
    },
    spike: {
      executor: 'ramping-arrival-rate',
      startRate: 5,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { duration: '10s', target: 20 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 80 },
        { duration: '10s', target: 20 },
      ],
      exec: 'spikeLoad',
    },
  },
};

function loadPage(url) {
  const res = http.get(url, { redirects: 3 });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'body is not empty': (r) => !!r.body && r.body.length > 0,
  });

  pageLoad.add(res.timings.duration);
  pageSuccess.add(res.status === 200);
  return res;
}

export function steadyLoad() {
  for (const route of ROUTES) {
    loadPage(route);
  }
  sleep(1);
}

export function spikeLoad() {
  const route = ROUTES[Math.floor(Math.random() * ROUTES.length)];
  loadPage(route);
  sleep(0.5);
}
