import io
import json
import os
import unittest
from unittest.mock import patch
from rmu_backend.app import application


class APITest(unittest.TestCase):
    def request(self, path, method="GET", payload=None, token="test-" + "x" * 40):
        raw = json.dumps(payload).encode() if payload is not None else b""
        env = {"PATH_INFO": path, "REQUEST_METHOD": method,
               "HTTP_AUTHORIZATION": "Bearer " + token,
               "CONTENT_TYPE": "application/json", "CONTENT_LENGTH": str(len(raw)),
               "wsgi.input": io.BytesIO(raw)}
        result = []
        with patch.dict(os.environ, {"RMU_SERVICE_TOKEN": "test-" + "x" * 40}):
            body = b"".join(application(env, lambda s, h: result.append((s, dict(h)))))
        return result[0][0], json.loads(body), result[0][1]

    def test_private_status_requires_authentication(self):
        self.assertEqual(self.request('/v1/status', token='wrong')[0], '401 Unauthorized')

    def test_no_secret_in_status(self):
        status, data, headers = self.request('/v1/status')
        self.assertEqual(status, '200 OK')
        self.assertFalse(data['collection_enabled'])
        self.assertNotIn('test-xxxx', json.dumps(data))
        self.assertEqual(headers['Cache-Control'], 'no-store')

    def test_preview_preserves_caps_without_execution(self):
        for mode, cap in [('test', '2.50'), ('initial', '50.00')]:
            status, data, _ = self.request('/v1/collection-preview', 'POST', {
                'query': 'from:rihanna', 'start': '2022-01-01', 'end': '2022-04-30', 'mode': mode})
            self.assertEqual(status, '200 OK')
            self.assertEqual(data['budget_cap_usd'], cap)
            self.assertFalse(data['execution_enabled'])

    def test_client_cannot_override_budget(self):
        self.assertEqual(self.request('/v1/collection-preview', 'POST', {
            'query': 'test', 'start': '2022-01-01', 'end': '2022-04-30', 'budget': 500})[0], '400 Bad Request')

    def test_invalid_windows_and_queries(self):
        for change in [{'start': '2022-06-01'}, {'end': '2999-01-01'}, {'query': 'x\n'}, {'query': ''}]:
            payload = dict(query='rihanna', start='2022-01-01', end='2022-04-30')
            payload.update(change)
            self.assertEqual(self.request('/v1/collection-preview', 'POST', payload)[0], '400 Bad Request')

    def test_missing_config_fails_closed(self):
        output = []
        with patch.dict(os.environ, {'RMU_SERVICE_TOKEN': ''}):
            list(application({'PATH_INFO': '/v1/status'}, lambda s, h: output.append(s)))
        self.assertEqual(output, ['503 Service Unavailable'])

    def test_liveness_does_not_claim_readiness(self):
        self.assertEqual(self.request('/healthz', token='')[1]['status'], 'alive')

    def test_paid_collection_is_disabled(self):
        status, data, _ = self.request('/v1/runs/00000000-0000-4000-8000-000000000001/collect-page','POST',{})
        self.assertEqual(status, '409 Conflict')
        self.assertIn('not activated',data['error'])

    def test_no_paid_run_endpoint(self):
        self.assertEqual(self.request('/v1/run', 'POST', {})[0], '404 Not Found')

if __name__ == '__main__':
    unittest.main()
