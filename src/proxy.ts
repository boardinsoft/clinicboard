import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { checkRateLimit, getClientIdentifier, getRateLimitErrorMessage } from './lib/security/rate-limiter';

export async function proxy(request: NextRequest) {
    // === RATE LIMITING ===
    // Aplicar rate limiting SOLO en rutas de login
    const isLoginRoute = request.nextUrl.pathname.startsWith('/login');

    if (isLoginRoute && request.method === 'POST') {
        const clientIp = getClientIdentifier(request);
        const { success, reset } = await checkRateLimit(clientIp, 'login');

        if (!success) {
            const errorMessage = getRateLimitErrorMessage(reset);
            return NextResponse.json(
                { error: errorMessage },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil((reset - Date.now()) / 1000)),
                    },
                }
            );
        }
    }

    // === SUPABASE SESSION ===
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // IMPORTANT: Do not run code between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const isPublicRoute = request.nextUrl.pathname.startsWith('/login') ||
        request.nextUrl.pathname.startsWith('/auth') ||
        request.nextUrl.pathname.startsWith('/register') ||
        request.nextUrl.pathname.startsWith('/onboarding') ||
        request.nextUrl.pathname.startsWith('/forgot-password') ||
        request.nextUrl.pathname.startsWith('/reset-password') ||
        request.nextUrl.pathname.startsWith('/verify-email');

    // === SESSION TIMEOUT CHECK ===
    // Verificar timeout de inactividad (10 minutos) para usuarios autenticados
    if (user && !isPublicRoute) {
        const lastActivityCookie = request.cookies.get('clinicboard_last_activity');
        const sessionTimeoutMs = parseInt(process.env.SESSION_TIMEOUT_MINUTES || '10', 10) * 60 * 1000;

        if (lastActivityCookie) {
            const lastActivity = parseInt(lastActivityCookie.value, 10);
            const now = Date.now();
            const timeSinceLastActivity = now - lastActivity;

            if (timeSinceLastActivity > sessionTimeoutMs) {
                const url = request.nextUrl.clone();
                url.pathname = '/login';
                url.searchParams.set('reason', 'session_timeout');

                const redirectResponse = NextResponse.redirect(url);
                redirectResponse.cookies.delete('clinicboard_last_activity');

                return redirectResponse;
            }
        }

        supabaseResponse.cookies.set('clinicboard_last_activity', Date.now().toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: sessionTimeoutMs / 1000,
            path: '/',
        });
    }

    if (user) {
        const isOnboardingRoute = request.nextUrl.pathname.match(/^\/[^/]+\/onboarding$/) !== null;
        const isDashboardRoute = request.nextUrl.pathname.match(/^\/[^/]+\/dashboard$/) !== null;

        if (!isOnboardingRoute && !isDashboardRoute) {
            try {
                const { data: practitioner } = await supabase
                    .from('practitioners')
                    .select('onboarding_completed')
                    .eq('auth_user_id', user.id)
                    .single();

                if (practitioner?.onboarding_completed !== true) {
                    const url = request.nextUrl.clone();
                    const slug = url.pathname.split('/')[1];
                    url.pathname = `/${slug}/onboarding`;
                    url.searchParams.set('reason', 'incomplete');
                    return NextResponse.redirect(url);
                }
            } catch {
                // Continue without blocking
            }
        }
    }

    if (!user && !isPublicRoute) {
        // no user, potentially respond by redirecting the user to the login page
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const redirectResponse = NextResponse.redirect(url);

        // Preserve cookies setup by createServerClient during session refresh or clear
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        return redirectResponse;
    }

    if (user && isPublicRoute) {
        const isOnboardingRoute = request.nextUrl.pathname.startsWith('/onboarding');
        if (isOnboardingRoute) {
            return supabaseResponse;
        }
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard';
        const redirectResponse = NextResponse.redirect(url);

        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
        });

        return redirectResponse;
    }

    return supabaseResponse;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
