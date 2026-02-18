import {
  type RouteConfig,
  index,
  layout,
  route,
  prefix,
} from "@react-router/dev/routes";

export default [
  // Home: redirects to /forms (public forms list)
  index("routes/home.tsx"),

  // Auth routes (public)
  route("logout", "routes/logout.tsx"),

  // Public form routes (no authentication required)
  layout("routes/public-layout.tsx", [
    route("forms", "routes/forms.tsx"),
    route("forms/:id", "routes/forms.$id.tsx"),
  ]),

  // Admin routes (admin role only)
  route("admin/login", "routes/admin.login.tsx"),
  layout("routes/admin-layout.tsx", [
    ...prefix("admin", [
      index("routes/admin._index.tsx"),
      route("forms", "routes/admin.forms.tsx"),
      route("forms/manage", "routes/admin.forms.manage.tsx"),
      route("forms/:id", "routes/admin.forms.$id.tsx"),
      route("forms/:id/ai-chat", "routes/admin.forms.$id.ai-chat.ts"),
      route("results", "routes/admin.results.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
