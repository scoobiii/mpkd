import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<300', 'p(99)<800'],
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://127.0.0.1:3000';
  const response = http.get(`${baseUrl}/healthz`);

  check(response, {
    'health endpoint returns 200': (r) => r.status === 200,
    'health endpoint returns JSON': (r) =>
      String(r.headers['Content-Type'] || '').includes('application/json'),
  });

  sleep(0.1);
}
