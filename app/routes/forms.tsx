import { useLoaderData } from "react-router";
import { prisma } from "~/db/db.server";
import { FormCard } from "~/components/forms/FormCard";
import type { Form } from "@prisma/client";

export async function loader() {
  const forms = await prisma.form.findMany({
    where: { published: true },
    orderBy: { updatedAt: "desc" },
  });

  return { forms };
}

export default function FormsListPage() {
  const { forms } = useLoaderData<typeof loader>();

  return (
    <div className="max-w-6xl mx-auto">
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
          {forms.map((form: Form) => (
            <FormCard key={form.id} form={form} variant="public" />
          ))}
        </div>
      )}
    </div>
  );
}


