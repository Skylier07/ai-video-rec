import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Google],
  callbacks: {
    async signIn({ user, account }) {
      // Proxy the user to our completely autonomous FastAPI database!
      // This sends the email safely to our backend to ensure they are created in Postgres.
      try {
        if (user.email) {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/auth/google`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            // Note: Since we don't have a secure token payload from an actual client-side credential flow right now, 
            // we will simulate the token payload just with the email to hit our specific Postgres python endpoint.
            body: JSON.stringify({
              token: account?.id_token || "simulated_token",
              email: user.email,
            }),
          });
          
          if (!res.ok) {
             console.error("Failed to sync user with FastAPI backend");
             return false;
          }
          
          const data = await res.json();
          // We can mutate the user object to attach our Postgres database string ID if needed
          user.id = data.user_id;
        }
      } catch (e) {
        console.error("FastAPI Backend unreachable", e);
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Persist profile data from provider into JWT so server-rendered nav can show avatar.
      if (user?.id) {
        token.sub = user.id;
      }
      // NextAuth handles the rest natively (mapping user.image to token.picture, etc.)
      return token;
    },
    async session({ session, token }) {
      if (token?.sub) {
        session.user.id = token.sub as string; 
      }
      // Pass the picture natively if somehow NextAuth didn't (though v5 usually does automatically)
      if (token?.picture) {
        session.user.image = token.picture as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/signin",
  }
})
