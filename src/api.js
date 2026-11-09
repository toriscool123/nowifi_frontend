export async function api(op, method = 'GET', fields = {}) {
  // loginuser ger 409 om en giltig token skickas med, så den skickas inte då
  const token = op === 'loginuser' ? null : localStorage.getItem('token');
  const isGet = method === 'GET';
  const query = new URLSearchParams(isGet ? { o: op, ...fields } : { o: op });

  const res = await fetch(`/api/?${query}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: isGet ? undefined : new URLSearchParams(fields),
  });
  const data = await res.json().catch(() => ({ error: 'Svaret var inte JSON' }));
  return { status: res.status, ...data };
}
