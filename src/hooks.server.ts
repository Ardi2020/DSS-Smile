import { login } from '$lib/server/api/token';

// Login sekali saat proses start (gunakan env)
await login().catch(() => {
  // Jangan crash; biarkan endpoint /login manual dipanggil bila perlu.
});
