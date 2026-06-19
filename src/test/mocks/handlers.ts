import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('*/usuarios', () => {
    return HttpResponse.json([]);
  }),
  http.post('*/usuarios', () => {
    return HttpResponse.json({ success: true });
  }),
];
