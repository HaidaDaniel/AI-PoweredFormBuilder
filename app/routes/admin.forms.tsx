import { Form, Link, useLoaderData, redirect } from "react-router";
import { requireAdmin } from "~/auth/auth.server";
import { prisma } from "~/db/db.server";
import type { Route } from "./+types/admin.forms";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireAdmin(request);
  const forms = await prisma.form.findMany({
    where: { ownerUserId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { fields: true } } },
  });
  return { forms };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const form = await prisma.form.create({
      data: {
        title: "Untitled Form",
        ownerUserId: user.id,
      },
    });
    
    // Create default first field
    await prisma.formField.create({
      data: {
        formId: form.id,
        type: "text",
        label: "New Field",
        required: false,
        order: 1,
      },
    });
    
    return redirect(`/admin/forms/${form.id}`);
  }

  if (intent === "delete") {
    const formId = String(formData.get("formId"));
    // Verify ownership before deleting
    const form = await prisma.form.findFirst({
      where: { id: formId, ownerUserId: user.id },
    });
    if (!form) {
      return { error: "Form not found" };
    }
    await prisma.form.delete({ where: { id: formId } });
    return { ok: true };
  }

  return { error: "Unknown action" };
}

export default function FormsListPage() {
  const { forms } = useLoaderData<typeof loader>();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Forms
        </h1>
        <Form method="post">
          <input type="hidden" name="intent" value="create" />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            + New Form
          </button>
        </Form>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            You don&apos;t have any forms yet.
          </p>
          <Form method="post">
            <input type="hidden" name="intent" value="create" />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create your first form
            </button>
          </Form>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-5 flex flex-col"
            >
              <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                  {form.title}
                </h2>
                <span
                  className={`px-2 py-0.5 text-xs font-medium rounded ${
                    form.published
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400"
                  }`}
                >
                  {form.published ? "Published" : "Draft"}
                </span>
              </div>
              {form.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
                  {form.description}
                </p>
              )}
              <div className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                {form._count.fields} field{form._count.fields !== 1 ? "s" : ""}{" "}
                &middot; Updated{" "}
                {new Date(form.updatedAt).toLocaleDateString()}
              </div>
              <div className="mt-auto flex gap-2">
                <Link
                  to={`/admin/forms/${form.id}`}
                  className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Edit
                </Link>
                <Form method="post">
                  <input type="hidden" name="intent" value="delete" />
                  <input type="hidden" name="formId" value={form.id} />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    onClick={(e) => {
                      if (!confirm("Are you sure you want to delete this form?")) {
                        e.preventDefault();
                      }
                    }}
                  >
                    Delete
                  </button>
                </Form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

