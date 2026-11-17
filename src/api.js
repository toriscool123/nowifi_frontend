export async function api(op, method = 'GET', fields = {}) {
  const token = op === 'loginuser' ? null : localStorage.getItem('token');
  const isGet = method === 'GET';
  const query = new URLSearchParams(isGet ? { o: op, ...fields } : { o: op });

  // Kolla om fields är ett FormData-objekt (för bilduppladdning mm)
  const isFormData = fields instanceof FormData;

  let body;
  if (isGet) {
    body = undefined;
  } else if (isFormData) {
    body = fields; // Skicka FormData direkt!
  } else {
    body = new URLSearchParams(fields);
  }

  const res = await fetch(`/api/?${query}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    // OBS: Sätt INTE 'Content-Type' här när du skickar FormData, 
    // webbläsaren sätter boundary automatiskt!
    body,
  });

  const data = await res.json().catch(() => ({ error: 'Svaret var inte JSON' }));
  return { status: res.status, ...data };
}