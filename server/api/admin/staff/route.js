/**
 * Route Handler: /api/admin/staff (Next.js App Router).
 * Clean route dispatcher decoupled from business logic and auth verification.
 */

import { authenticateAdmin, corsHeaders, jsonResponse } from '@/lib/auth/adminAuth.js';
import {
  listStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  parseCreateStaffInput,
  parseUpdateStaffInput,
} from '@/lib/services/staffService.js';

export async function OPTIONS(request) {
  const origin = request.headers.get('origin');
  return new Response(null, { status: 204, headers: corsHeaders(origin) });
}

export async function GET(request) {
  const origin = request.headers.get('origin');
  const auth = await authenticateAdmin(request, origin);
  if (auth.response) return auth.response;

  try {
    const staff = await listStaff(auth.admin);
    return jsonResponse({ staff }, 200, origin);
  } catch (error) {
    console.error('[StaffAPI:GET] Error:', error);
    return jsonResponse({ error: 'Gagal memuat daftar staf.' }, 500, origin);
  }
}

export async function POST(request) {
  const origin = request.headers.get('origin');
  const auth = await authenticateAdmin(request, origin);
  if (auth.response) return auth.response;

  const body = await request.json().catch(() => null);
  const parsed = parseCreateStaffInput(body);
  if (parsed.error) return jsonResponse({ error: parsed.error }, 400, origin);

  try {
    const staff = await createStaff(auth.admin, parsed.value);
    return jsonResponse({ staff }, 201, origin);
  } catch (error) {
    console.error('[StaffAPI:POST] Error:', error);
    return jsonResponse({ error: error.message || 'Gagal membuat akun staf.' }, 400, origin);
  }
}

export async function PATCH(request) {
  const origin = request.headers.get('origin');
  const auth = await authenticateAdmin(request, origin);
  if (auth.response) return auth.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonResponse({ error: 'ID staf wajib disertakan.' }, 400, origin);

  const body = await request.json().catch(() => null);
  const parsed = parseUpdateStaffInput(body);
  if (parsed.error) return jsonResponse({ error: parsed.error }, 400, origin);

  try {
    const staff = await updateStaff(auth.admin, id, parsed.value);
    return jsonResponse({ staff }, 200, origin);
  } catch (error) {
    console.error('[StaffAPI:PATCH] Error:', error);
    return jsonResponse({ error: error.message || 'Gagal memperbarui staf.' }, 400, origin);
  }
}

export async function DELETE(request) {
  const origin = request.headers.get('origin');
  const auth = await authenticateAdmin(request, origin);
  if (auth.response) return auth.response;

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return jsonResponse({ error: 'ID staf wajib disertakan.' }, 400, origin);

  try {
    const result = await deleteStaff(auth.admin, id, auth.user.id);
    return jsonResponse(result, 200, origin);
  } catch (error) {
    console.error('[StaffAPI:DELETE] Error:', error);
    const status = error.message?.includes('sedang dipakai') ? 409 : 500;
    return jsonResponse({ error: error.message || 'Gagal menghapus staf.' }, status, origin);
  }
}
