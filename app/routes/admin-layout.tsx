import { useLoaderData } from "react-router";
import { requireAdmin } from "~/auth/auth.server";
import { AdminLayout } from "~/components/layouts/AdminLayout";
import type { Route } from "./+types/admin-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  return { user };
}

export default function AdminLayoutRoute() {
  const { user } = useLoaderData<typeof loader>();

  return <AdminLayout userEmail={user.email} />;
}


