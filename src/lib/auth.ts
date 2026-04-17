// NextAuth config — X (Twitter) OAuth 2.0
//
// On first sign-in we upsert the user row in Supabase and hydrate the
// session with the Supabase user id + role.

import NextAuth from 'next-auth';
import Twitter from 'next-auth/providers/twitter';
import { supabaseAdmin } from './supabase';
import { fetchTwitterScore } from './twitter-score';
import type { Role } from '@/types';

declare module 'next-auth' {
  interface User {
    twitterId?: string;
    handle?: string;
    role?: Role;
  }
  interface Session {
    user: {
      id: string;
      twitterId: string;
      handle: string;
      name?: string | null;
      image?: string | null;
      email?: string | null;
      role: Role;
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Twitter({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ profile }) {
      if (!profile) return false;

      // Twitter OAuth 2.0 returns data.id / data.username / data.name
      // (NextAuth normalizes to profile.data.* via the built-in Twitter provider)
      const raw = (profile as { data?: { id: string; username: string; name?: string; profile_image_url?: string } }).data;
      if (!raw?.id || !raw?.username) return false;

      const admin = supabaseAdmin();
      await admin
        .from('users')
        .upsert(
          {
            twitter_id: raw.id,
            twitter_handle: raw.username,
            twitter_name: raw.name ?? null,
            twitter_avatar_url: raw.profile_image_url ?? null,
          },
          { onConflict: 'twitter_id' }
        );

      // Hydrate TwitterScore on first sign-in if we haven't fetched one yet.
      // Fire-and-forget — don't block login if the external API is slow/down.
      const { data: existing } = await admin
        .from('users')
        .select('twitter_score_updated_at')
        .eq('twitter_id', raw.id)
        .maybeSingle();
      if (!existing?.twitter_score_updated_at) {
        void (async () => {
          const result = await fetchTwitterScore(raw.username);
          if (result) {
            await admin
              .from('users')
              .update({
                twitter_score: result.score,
                twitter_score_updated_at: new Date().toISOString(),
              })
              .eq('twitter_id', raw.id);
          }
        })();
      }

      return true;
    },
    async jwt({ token, profile }) {
      if (profile) {
        const raw = (profile as { data?: { id: string; username: string } }).data;
        if (raw?.id) token.twitterId = raw.id;
        if (raw?.username) token.handle = raw.username;
      }

      if (token.twitterId && !token.userId) {
        const admin = supabaseAdmin();
        const { data } = await admin
          .from('users')
          .select('id, role')
          .eq('twitter_id', token.twitterId)
          .maybeSingle();
        if (data) {
          token.userId = data.id;
          token.role = data.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Overwrite user fields from the JWT we populated in `jwt`.
      Object.assign(session.user, {
        id: (token.userId as string) ?? '',
        twitterId: (token.twitterId as string) ?? '',
        handle: (token.handle as string) ?? '',
        role: ((token.role as Role) ?? 'ambassador'),
      });
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
});
