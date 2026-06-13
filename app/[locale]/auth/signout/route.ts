import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request, { params }: { params: { locale: string } }) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  return NextResponse.redirect(new URL(`/${params.locale}/auth/signin`, request.url), {
    status: 303,
  });
}
