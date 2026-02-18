import { Form, useLoaderData, useActionData, useNavigation, useNavigate, useSubmit } from "react-router";
import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { prisma } from "~/db/db.server";
import { generateFormSchema } from "~/domain/form.schema";
import { Card } from "~/components/ui/Card";
import { Button } from "~/components/ui/Button";
import { FormFieldInput } from "~/components/forms/FormFieldInput";
import { ConfirmationModal } from "~/components/forms/ConfirmationModal";
import { SuccessModal } from "~/components/forms/SuccessModal";
import type { Route } from "./+types/forms.$id";
import { toast } from "sonner";
import type { FormField } from "@prisma/client";

export async function loader({ params }: Route.LoaderArgs) {
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
      toast.error("Failed to save response: " + (error as Error).message);
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
      for (const error of result.error.issues) {
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
  const navigate = useNavigate();
  const submit = useSubmit();
  const [showModal, setShowModal] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [submittedValues, setSubmittedValues] = useState<Record<string, unknown> | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState<boolean>(false);

  // Generate Zod schema from form fields
  const formSchema = useMemo(() => generateFormSchema(form.fields), [form.fields]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: useMemo(() => {
      const defaults: Record<string, unknown> = {};
      for (const field of form.fields) {
        defaults[field.id] = field.type === "number" ? null : "";
      }
      return defaults;
    }, [form.fields]),
  });

  // Reset form when actionData changes (after successful submission)
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      reset();
      setHasAttemptedSubmit(false);
    }
  }, [actionData, reset]);

  // Show modal when confirmation is needed
  useEffect(() => {
    if (actionData && "confirm" in actionData && actionData.confirm) {
      setTimeout(() => {
        setShowModal(true);
        setSubmittedValues(actionData.values || null);

      }, 0);
    }
  }, [actionData]);

  // Show toast on error
  useEffect(() => {
    if (actionData && "error" in actionData && actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  // Show congratulations modal on success
  useEffect(() => {
    if (actionData && "success" in actionData && actionData.success) {
      setTimeout(() => {
        setShowModal(false);
        setSubmittedValues(null);
        setShowCongratulationsModal(true);
      }, 0);
    }
  }, [actionData]);

  // Auto-redirect after 2 seconds when congratulations modal is shown
  useEffect(() => {
    if (showCongratulationsModal) {
      const timer = setTimeout(() => {
        navigate("/forms");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showCongratulationsModal, navigate]);

  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="max-w-2xl mx-auto">
      <Card variant="elevated" className="p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {form.title}
        </h1>
        {form.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6">{form.description}</p>
        )}

        {!showCongratulationsModal && (
          <>
            <Form
              method="post"
              id="form-fill"
              onSubmit={(e) => {
                e.preventDefault();
                setHasAttemptedSubmit(true);

                handleSubmit(
                  (data) => {
                    // Form is valid, proceed with submission
                    const formData = new FormData();
                    formData.set("intent", "submit");

                    // Add all form values to FormData
                    for (const field of form.fields) {
                      const value = data[field.id];
                      if (value !== undefined && value !== null && value !== "") {
                        if (field.type === "number") {
                          formData.set(field.id, String(value));
                        } else {
                          formData.set(field.id, String(value));
                        }
                      }
                    }

                    submit(formData, { method: "post" });
                  },
                  () => {
                    // Form validation failed
                    trigger(); // Trigger validation to show errors
                  }
                )();
              }}
            >
              <input type="hidden" name="intent" value="submit" />
              <div className="space-y-5">
                {form.fields.map((field: FormField) => {
                  // Get error from RHF or server-side validation
                  const fieldError =
                    (hasAttemptedSubmit && errors[field.id]?.message) ||
                    (actionData && "errors" in actionData
                      ? actionData.errors?.[field.id]
                      : undefined);
                  const fieldValue =
                    actionData && "values" in actionData
                      ? actionData.values?.[field.id]
                      : watch(field.id);

                  return (
                    <FormFieldInput
                      key={field.id}
                      field={{
                        id: field.id,
                        type: field.type,
                        label: field.label,
                        required: field.required,
                        order: field.order,
                        placeholder: field.placeholder,
                        minLength: field.minLength,
                        maxLength: field.maxLength,
                        min: field.min,
                        max: field.max,
                        step: field.step,
                        rows: field.rows,
                      }}
                      value={fieldValue}
                      error={fieldError}
                      register={(name: string) => register(name, field.type === "number" ? { valueAsNumber: true } : undefined)}
                      onBlur={() => {
                        if (hasAttemptedSubmit) {
                          trigger(field.id);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {form.fields.length > 0 && (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-8 w-full"
                >
                  {isSubmitting ? "Submitting..." : "Submit"}
                </Button>
              )}
            </Form>

            {showModal && submittedValues && (
              <ConfirmationModal
                isOpen={showModal}
                onClose={() => {
                  setShowModal(false);
                  setSubmittedValues(null);
                }}
                fields={form.fields.map((f: FormField) => ({
                  id: f.id,
                  type: f.type,
                  label: f.label,
                  required: f.required,
                  order: f.order,
                  placeholder: f.placeholder,
                  minLength: f.minLength,
                  maxLength: f.maxLength,
                  min: f.min,
                  max: f.max,
                  step: f.step,
                  rows: f.rows,
                }))}
                values={submittedValues}
                isSubmitting={isSubmitting}
              />
            )}
          </>
        )}

        <SuccessModal
          isOpen={showCongratulationsModal}
          onClose={() => setShowCongratulationsModal(false)}
          onNavigate={() => navigate("/forms")}
        />
      </Card>
    </div>
  );
}

