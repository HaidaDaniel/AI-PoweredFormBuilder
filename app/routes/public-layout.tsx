import { useLoaderData } from "react-router";
import { PublicLayout } from "~/components/layouts/PublicLayout";
import { getUser } from "~/auth/auth.server";
import type { Route } from "./+types/public-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUser(request);
  return { user };
}

export default function PublicLayoutRoute() {
  const { user } = useLoaderData<typeof loader>();
  return <PublicLayout user={user} />;
}

