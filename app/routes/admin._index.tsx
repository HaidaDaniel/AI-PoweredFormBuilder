import { useLoaderData } from "react-router";
import { prisma } from "~/db/db.server";
import type { Route } from "./+types/admin._index";

export async function loader({ request }: Route.LoaderArgs) {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      _count: { select: { forms: true } },
    },
  });

  const totalForms = await prisma.form.count();

  return { users, totalForms };
}

export default function AdminIndexPage() {
  const { users, totalForms } = useLoaderData<typeof loader>();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Admin Dashboard
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {users.length}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Users
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5">
          <div className="text-3xl font-bold text-gray-900 dark:text-white">
            {totalForms}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Forms
          </div>
        </div>
      </div>

      {/* Users table */}
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        All Users
      </h2>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Email
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Role
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Forms
              </th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                Registered
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-100 dark:border-gray-800 last:border-0"
              >
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                  {user.email}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                      user.role === "admin"
                        ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {user._count.forms}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


