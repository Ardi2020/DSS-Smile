// src/routes/api/export/pdf/facilities/+server.ts
import type { RequestHandler } from '@sveltejs/kit';
import { chromium } from 'playwright';

function getOrigin(req: Request) {
  // Rekonstruksi origin dari header request
  // Default ke http://localhost:5173 jika tidak tersedia
  try {
    const url = new URL(req.url);
    const proto = (req.headers.get('x-forwarded-proto') ?? url.protocol.replace(':','')) as string;
    const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? url.host;
    return `${proto}://${host}`;
  } catch {
    return 'http://localhost:5173';
  }
}

export const GET: RequestHandler = async ({ request }) => {
  const origin = getOrigin(request);
  const targetUrl = `${origin}/facilities`;

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    });

    // Penting: bawa header Accept untuk rendering konsisten (opsional)
    await page.setExtraHTTPHeaders({ Accept: 'text/html' });

    // Buka halaman facilities
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

    // Opsi styling print: gunakan CSS @media print (bila ada), margin nyaman, format A4
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '14mm', right: '12mm', bottom: '16mm', left: '12mm' }
    });

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="facilities.pdf"`
      }
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ ok: false, error: String(e?.message ?? e) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    await browser.close();
  }
};
