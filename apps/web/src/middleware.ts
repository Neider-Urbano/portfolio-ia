import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/admin/login" },
  callbacks: {
    // Solo la página de login queda accesible sin sesión; todo lo demás bajo
    // /admin y las rutas admin de la API requieren un token válido. (Antes
    // comparaba con startsWith("/admin"), que también es cierto para
    // /admin/perfil, /admin/servicios, etc. — dejaba todo el dashboard
    // abierto sin login.)
    authorized: ({ token, req }) => {
      if (req.nextUrl.pathname === "/admin/login") return true;
      return !!token;
    },
  },
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
