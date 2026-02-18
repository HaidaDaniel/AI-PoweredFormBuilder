import { Form, useLoaderData, useActionData, useNavigation } from "react-router";
import { useState, useEffect } from "react";
import { prisma } from "~/db/db.server";
import { generateFormSchema } from "~/domain/form.schema";
import type { Route } from "./+types/forms.$id";

export async function loader({ request, params }: Route.LoaderArgs) {
  const form = await prisma.form.findFirst({
    where: { id: params.id, published: true },
    include: {
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!form) {
    throw new Response("Form not found", { status: 404 });
  }

  return { form };
}

export async function action({ request, params }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");

  // Get the form with fields
  const form = await prisma.form.findFirst({
    where: { id: params.id, published: true },
    include: {
      fields: { orderBy: { order: "asc" } },
    },
  });

  if (!form) {
    return { error: "Form not found" };
  }

  // Handle confirmation and save
  if (intent === "confirm") {
    const valuesJsonStr = formData.get("valuesJson");
    if (!valuesJsonStr) {
      return { error: "No data to save" };
    }

    try {
      const valuesJson = JSON.parse(String(valuesJsonStr));
      await prisma.formResponse.create({
        data: {
          formId: form.id,
          valuesJson,
        },
      });
      return { success: true };
    } catch (error) {
      return { error: "Failed to save response" };
    }
  }

  // Handle initial submission and validation
  if (intent === "submit") {
    // Generate Zod schema from form fields
    const schema = generateFormSchema(form.fields);

    // Collect submitted values
    const submittedValues: Record<string, unknown> = {};
    for (const field of form.fields) {
      const value = formData.get(field.id);
      if (value !== null) {
        if (field.type === "number") {
          submittedValues[field.id] = value === "" ? null : Number(value);
        } else {
          submittedValues[field.id] = value === "" ? null : String(value);
        }
      }
    }

    // Validate with Zod
    const result = schema.safeParse(submittedValues);

    if (!result.success) {
      // Return validation errors
      const fieldErrors: Record<string, string> = {};
      for (const error of result.error.errors) {
        const fieldId = error.path[0];
        if (typeof fieldId === "string") {
          fieldErrors[fieldId] = error.message;
        }
      }
      return { errors: fieldErrors, values: submittedValues };
    }

    // Validation passed, return data for confirmation
    return { confirm: true, values: result.data };
  }

  return { error: "Unknown action" };
}

export default function FormFillPage() {
  const { form } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [showModal, setShowModal] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);

  // Show modal when confirmation is needed
  useEffect(() => {
    if (actionData && "confirm" in actionData && actionData.confirm) {
      setShowModal(true);
      setSubmittedValues(actionData.values || null);
    }
  }, [actionData]);

  // Hide modal on success
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      setShowModal(false);
      setSubmittedValues(null);
    }
  }, [actionData]);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">{form.description}</p>
        )}

        {actionData && "success" in actionData && actionData.success ? (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg">
            <p className="font-medium">Form submitted successfully!</p>
            <p className="text-sm mt-1">Thank you for your submission.</p>
          </div>
        ) : (
          <>
            <Form method="post" id="form-fill">
              <input type="hidden" name="intent" value="submit" />
              <div className="space-y-5">
                {form.fields.map((field) => {
                  const fieldError =
                    actionData && "errors" in actionData
                      ? actionData.errors?.[field.id]
                      : undefined;
                  const fieldValue =
                    actionData && "values" in actionData
                      ? actionData.values?.[field.id]
                      : undefined;

                  return (
                    <div key={field.id}>
                      <label
                        htmlFor={field.id}
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </label>

                      {field.type === "text" && (
                        <input
                          type="text"
                          id={field.id}
                          name={field.id}
                          required={field.required}
                          placeholder={field.placeholder || undefined}
                          minLength={field.minLength || undefined}
                          maxLength={field.maxLength || undefined}
                          defaultValue={fieldValue as string | undefined}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            fieldError
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        />
                      )}

                      {field.type === "number" && (
                        <input
                          type="number"
                          id={field.id}
                          name={field.id}
                          required={field.required}
                          placeholder={field.placeholder || undefined}
                          min={field.min || undefined}
                          max={field.max || undefined}
                          step={field.step || undefined}
                          defaultValue={fieldValue as number | undefined}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            fieldError
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        />
                      )}

                      {field.type === "textarea" && (
                        <textarea
                          id={field.id}
                          name={field.id}
                          required={field.required}
                          placeholder={field.placeholder || undefined}
                          minLength={field.minLength || undefined}
                          maxLength={field.maxLength || undefined}
                          rows={field.rows || 4}
                          defaultValue={fieldValue as string | undefined}
                          className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                            fieldError
                              ? "border-red-500 dark:border-red-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                        />
                      )}

                      {fieldError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {fieldError}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {form.fields.length > 0 && (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-8 w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </button>
              )}
            </Form>

            {/* Confirmation Modal */}
            {showModal && submittedValues && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                    Confirm Submission
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Please review your answers before submitting:
                  </p>
                  <div className="space-y-3 mb-6">
                    {form.fields.map((field) => {
                      const value = submittedValues[field.id];
                      return (
                        <div key={field.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {field.label}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {value === null || value === undefined || value === ""
                              ? "(empty)"
                              : String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex gap-3">
                    <Form method="post" className="flex-1">
                      <input type="hidden" name="intent" value="confirm" />
                      <input
                        type="hidden"
                        name="valuesJson"
                        value={JSON.stringify(submittedValues)}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                      >
                        {isSubmitting ? "Saving..." : "Confirm"}
                      </button>
                    </Form>
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setSubmittedValues(null);
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

