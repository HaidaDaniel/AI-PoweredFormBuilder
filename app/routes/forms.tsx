import { Link, useLoaderData } from "react-router";
import { prisma } from "~/db/db.server";
import type { Route } from "./+types/forms";

export async function loader({ request }: Route.LoaderArgs) {
  const forms = await prisma.form.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
  });

  return { forms };
}

export default function FormsListPage() {
  const { forms } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Available Forms
      </h1>

      {forms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400">
            No published forms available at the moment.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                {form.title}
              </h2>
              {form.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">
                  {form.description}
                </p>
              )}
              <Link
                to={`/forms/${form.id}`}
                className="mt-auto px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-center"
              >
                Open
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


