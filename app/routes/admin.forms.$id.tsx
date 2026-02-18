import { Form, Link, useLoaderData, useActionData, useNavigation } from "react-router";
import { useState, useEffect, useRef } from "react";
import { requireAdmin } from "~/auth/auth.server";
import { prisma } from "~/db/db.server";
import { FormFieldEditor } from "~/components/FormFieldEditor";
import type { FormFieldData } from "~/components/FormFieldEditor";
import type { Route } from "./+types/admin.forms.$id";
import type { FormField } from "@prisma/client";

export async function loader({ request, params }: Route.LoaderArgs) {
    const user = await requireAdmin(request);
    const form = await prisma.form.findFirst({
        where: { id: params.id, ownerUserId: user.id },
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
    const user = await requireAdmin(request);
    const formData = await request.formData();
    const intent = formData.get("intent");

    // Verify ownership
    const form = await prisma.form.findFirst({
        where: { id: params.id, ownerUserId: user.id },
    });
    if (!form) {
        throw new Response("Form not found", { status: 404 });
    }

    // Update form title/description
    if (intent === "updateForm") {
        const title = String(formData.get("title") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const published = formData.get("published") === "true";

        if (!title) {
            return { error: "Title is required" };
        }

        await prisma.form.update({
            where: { id: form.id },
            data: { title, description: description || null, published },
        });
        return { ok: true };
    }

    // Add a new field
    if (intent === "addField") {
        const maxOrder = await prisma.formField.aggregate({
            where: { formId: form.id },
            _max: { order: true },
        });
        const nextOrder = (maxOrder._max.order ?? 0) + 1;

        await prisma.formField.create({
            data: {
                formId: form.id,
                type: "text",
                label: "New Field",
                required: false,
                order: nextOrder,
            },
        });
        return { ok: true };
    }

    // Update field
    if (intent === "updateField") {
        const fieldId = String(formData.get("fieldId"));
        const label = String(formData.get("label") ?? "").trim();
        const type = String(formData.get("type") ?? "text");
        const required = formData.get("required") === "true";

        if (!label) {
            return { error: "Field label is required" };
        }

        // Parse field options
        const placeholder = String(formData.get("placeholder") ?? "").trim() || null;
        const minLengthStr = String(formData.get("minLength") ?? "").trim();
        const maxLengthStr = String(formData.get("maxLength") ?? "").trim();
        const minStr = String(formData.get("min") ?? "").trim();
        const maxStr = String(formData.get("max") ?? "").trim();
        const stepStr = String(formData.get("step") ?? "").trim();
        const rowsStr = String(formData.get("rows") ?? "").trim();

        const minLength = minLengthStr ? parseInt(minLengthStr, 10) : null;
        const maxLength = maxLengthStr ? parseInt(maxLengthStr, 10) : null;
        const min = minStr ? parseFloat(minStr) : null;
        const max = maxStr ? parseFloat(maxStr) : null;
        const step = stepStr ? parseFloat(stepStr) : null;
        const rows = rowsStr ? parseInt(rowsStr, 10) : null;

        await prisma.formField.update({
            where: { id: fieldId },
            data: {
                label,
                type,
                required,
                placeholder,
                minLength,
                maxLength,
                min,
                max,
                step,
                rows,
            },
        });
        return { ok: true };
    }

    // Delete field
    if (intent === "deleteField") {
        const fieldId = String(formData.get("fieldId"));
        await prisma.formField.delete({ where: { id: fieldId } });
        return { ok: true };
    }

    // Reorder field
    if (intent === "reorderField") {
        const fieldId = String(formData.get("fieldId"));
        const direction = String(formData.get("direction")); // "up" | "down"

        const fields = await prisma.formField.findMany({
            where: { formId: form.id },
            orderBy: { order: "asc" },
        });

        const idx = fields.findIndex((f: FormField) => f.id === fieldId);
        if (idx === -1) {
            return { error: "Field not found" };
        }

        const swapIdx = direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= fields.length) {
            return { ok: true }; // No-op if at boundary
        }

        // Swap orders
        const currentField = fields[idx];
        const swapField = fields[swapIdx];

        await prisma.$transaction([
            prisma.formField.update({
                where: { id: currentField.id },
                data: { order: swapField.order },
            }),
            prisma.formField.update({
                where: { id: swapField.id },
                data: { order: currentField.order },
            }),
        ]);

        return { ok: true };
    }

    return { error: "Unknown action" };
}

export default function FormEditorPage() {
    const { form } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();

    const fields: FormFieldData[] = form.fields.map((f: FormField) => ({
        id: f.id,
        type: f.type as FormFieldData["type"],
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
    }));

    // Use lazy initialization to set initial selected field
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(() =>
        fields.length > 0 ? fields[0].id : null
    );
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [currentTitle, setCurrentTitle] = useState<string>(form.title);
    const [currentDescription, setCurrentDescription] = useState<string>(form.description || "");
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const prevFieldsCountRef = useRef<number>(form.fields.length);

    const selectedField = selectedFieldId
        ? fields.find((f) => f.id === selectedFieldId)
        : null;

    // Auto-select first field if available and none selected (when fields change)
    useEffect(() => {
        if (fields.length > 0 && !selectedFieldId) {
            // This is necessary to sync state when fields become available
            // The alternative would be to derive selectedFieldId from fields, but that would
            // lose the user's selection when fields update. This effect only runs when
            // transitioning from no selection to having fields available.
            setSelectedFieldId(fields[0].id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fields.length, selectedFieldId]);

    // Auto-select last field (newly added) after field addition
    useEffect(() => {
        const currentFieldsCount = fields.length;
        const prevFieldsCount = prevFieldsCountRef.current;

        // If a new field was added (count increased)
        if (currentFieldsCount > prevFieldsCount && fields.length > 0) {
            // Select the last field (highest order)
            const lastField = fields.reduce((prev, current) =>
                (current.order > prev.order) ? current : prev
            );
            setSelectedFieldId(lastField.id);
        }

        // Update ref for next comparison
        prevFieldsCountRef.current = currentFieldsCount;
    }, [fields]);

    // Show toast on successful save
    useEffect(() => {
        if (actionData && 'ok' in actionData && actionData.ok) {
            setToast({ message: 'Form saved successfully', type: 'success' });
            const timer = setTimeout(() => setToast(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [actionData]);

    // Update current values when form data changes (after save/reload)
    useEffect(() => {
        setCurrentTitle(form.title);
        setCurrentDescription(form.description || "");
    }, [form.title, form.description]);

    // Check if form is being saved
    const isSaving = navigation.state === 'submitting' && navigation.formData?.get('intent') === 'updateForm';

    // Manage loading spinner with minimum duration (300ms)
    useEffect(() => {
        if (isSaving) {
            setShowLoading(true);
        } else if (showLoading) {
            // Keep spinner visible for at least 300ms even if save completes quickly
            const timer = setTimeout(() => {
                setShowLoading(false);
            }, 300);
            return () => clearTimeout(timer);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSaving]);

    // Check if title has unsaved changes
    const isTitleUnsaved = currentTitle !== form.title;

    return (
        <div className="h-[calc(100vh-120px)] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <Link
                    to="/admin/forms"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                    &larr; Back to forms
                </Link>
                <div className="flex items-center gap-4 flex-1">
                    <Form method="post" className="flex items-center gap-4 flex-1">
                        <input type="hidden" name="intent" value="updateForm" />
                        <div className="flex items-center gap-2 flex-1">
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="title"
                                    value={currentTitle}
                                    onChange={(e) => setCurrentTitle(e.target.value)}
                                    placeholder="Form title"
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    name="description"
                                    value={currentDescription}
                                    onChange={(e) => setCurrentDescription(e.target.value)}
                                    placeholder="Form description (optional)"
                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="published"
                                name="published"
                                value="true"
                                defaultChecked={form.published}
                                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                                className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <label
                                htmlFor="published"
                                className="text-sm text-gray-700 dark:text-gray-300"
                            >
                                Published
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm flex items-center gap-2"
                        >
                            <span className={`inline-block ${showLoading ? 'opacity-100' : 'opacity-0'} transition-opacity`} style={{ width: '16px', height: '16px' }}>
                                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </span>
                            Save Form
                        </button>
                    </Form>
                </div>
            </div>

            {actionData && "error" in actionData && actionData.error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm border-b border-red-200 dark:border-red-800">
                    {actionData.error}
                </div>
            )}

            {/* Toast notification */}
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all ${toast.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
                    }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="text-sm font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Overlay during save */}
            {isSaving && (
                <div className="fixed inset-0 bg-black/10 dark:bg-black/20 z-40 pointer-events-none" />
            )}

            {/* Main content: 50/50 split */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Left: Preview (50%) */}
                <div className="w-1/2 min-h-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-950">
                    <div className="p-6">
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Preview
                            </h2>
                            <Form method="post">
                                <input type="hidden" name="intent" value="addField" />
                                <button
                                    type="submit"
                                    className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                                >
                                    + Add Field
                                </button>
                            </Form>
                        </div>
                        <ClickableFormPreview
                            title={currentTitle}
                            description={currentDescription}
                            fields={fields}
                            selectedFieldId={selectedFieldId}
                            onFieldClick={setSelectedFieldId}
                            isTitleUnsaved={isTitleUnsaved}
                        />
                    </div>
                </div>

                {/* Right: Sidebar (50%) */}
                <div className="w-1/2 min-h-500 overflow-y-auto bg-white dark:bg-gray-900">
                    <div className="p-6">
                        {selectedField ? (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Field Settings
                                    </h2>
                                </div>
                                <FormFieldEditor
                                    field={selectedField}
                                    formId={form.id}
                                    isFirst={fields.findIndex((f) => f.id === selectedField.id) === 0}
                                    isLast={
                                        fields.findIndex((f) => f.id === selectedField.id) ===
                                        fields.length - 1
                                    }
                                />
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Click on a field in the preview to edit its settings
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Clickable preview component
function ClickableFormPreview({
    title,
    description,
    fields,
    selectedFieldId,
    onFieldClick,
    isTitleUnsaved,
}: {
    title: string;
    description?: string | null;
    fields: FormFieldData[];
    selectedFieldId: string | null;
    onFieldClick: (fieldId: string) => void;
    isTitleUnsaved?: boolean;
}) {
    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8">
                <h1 className={`text-2xl font-bold mb-2 ${isTitleUnsaved
                    ? "text-gray-900/50 dark:text-white/50"
                    : "text-gray-900 dark:text-white"
                    }`}>
                    {title}
                </h1>
                {description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
                )}

                {fields.length === 0 && (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                        This form has no fields yet.
                    </p>
                )}

                <div className="space-y-5">
                    {fields.map((field) => (
                        <ClickablePreviewField
                            key={field.id}
                            field={field}
                            isSelected={selectedFieldId === field.id}
                            onClick={() => onFieldClick(field.id)}
                        />
                    ))}
                </div>

                {fields.length > 0 && (
                    <button
                        type="button"
                        disabled
                        className="mt-8 w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg opacity-60 cursor-not-allowed"
                    >
                        Submit (preview only)
                    </button>
                )}
            </div>
        </div>
    );
}

function ClickablePreviewField({
    field,
    isSelected,
    onClick,
}: {
    field: FormFieldData;
    isSelected: boolean;
    onClick: () => void;
}) {
    const labelEl = (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
    );

    const inputClasses = `w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white pointer-events-none ${isSelected
        ? "border-blue-500 ring-2 ring-blue-500"
        : "border-gray-300 dark:border-gray-600"
        }`;

    const fieldWrapperClasses = `p-3 rounded-lg transition-colors cursor-pointer ${isSelected ? "bg-blue-50 dark:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`;

    switch (field.type) {
        case "text":
            return (
                <div className={fieldWrapperClasses} onMouseDown={onClick}>
                    {labelEl}
                    <input
                        type="text"
                        disabled
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        minLength={field.minLength || undefined}
                        maxLength={field.maxLength || undefined}
                        className={inputClasses}
                    />
                </div>
            );

        case "number":
            return (
                <div className={fieldWrapperClasses} onMouseDown={onClick}>
                    {labelEl}
                    <input
                        type="number"
                        disabled
                        placeholder={field.placeholder || "0"}
                        min={field.min || undefined}
                        max={field.max || undefined}
                        step={field.step || undefined}
                        className={inputClasses}
                    />
                </div>
            );

        case "textarea":
            return (
                <div className={fieldWrapperClasses} onMouseDown={onClick}>
                    {labelEl}
                    <textarea
                        disabled
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        minLength={field.minLength || undefined}
                        maxLength={field.maxLength || undefined}
                        rows={field.rows || 4}
                        className={inputClasses}
                    />
                </div>
            );

        default:
            return null;
    }
}

