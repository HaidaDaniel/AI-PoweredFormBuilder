import { useLoaderData, Link } from "react-router";
import { requireAdmin } from "~/auth/auth.server";
import { prisma } from "~/db/db.server";
import type { Route } from "./+types/admin.results";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  
  const responses = await prisma.formResponse.findMany({
    include: {
      form: {
        select: {
          id: true,
          title: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return { responses };
}

export default function ResultsPage() {
  const { responses } = useLoaderData<typeof loader>();

  const formatResponseData = (valuesJson: any): string => {
    if (!valuesJson || typeof valuesJson !== "object") {
      return String(valuesJson || "");
    }
    
    const entries = Object.entries(valuesJson);
    if (entries.length === 0) {
      return "No data";
    }
    
    return entries
      .map(([key, value]) => {
        const displayValue = value === null || value === undefined ? "—" : String(value);
        return `${key}: ${displayValue}`;
      })
      .join(", ");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Form Results
      </h1>

      {responses.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No form submissions yet.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Form Title
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Submitted At
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Response Data
                </th>
              </tr>
            </thead>
            <tbody>
              {responses.map((response) => (
                <tr
                  key={response.id}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-sm">
                    <Link
                      to={`/admin/forms/${response.form.id}`}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                    >
                      {response.form.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(response.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    <div className="max-w-md truncate" title={formatResponseData(response.valuesJson)}>
                      {formatResponseData(response.valuesJson)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


