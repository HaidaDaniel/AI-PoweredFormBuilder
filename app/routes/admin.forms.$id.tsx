import { Form, Link, useLoaderData, useActionData, useNavigation, useSubmit, useNavigate, useFetcher, redirect, useBlocker } from "react-router";
import { useState, useEffect, useRef } from "react";
import { requireAdmin, requireAdminApi } from "~/auth/auth.server";
import { prisma } from "~/db/db.server";
import { FormFieldEditor } from "~/components/FormFieldEditor";
import type { FormFieldData } from "~/components/FormFieldEditor";
import { FormFieldRenderer } from "~/components/forms/FormFieldRenderer";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/Input";
import { Toggle } from "~/components/ui/Toggle";
import { Modal } from "~/components/ui/Modal";
import { toast } from "sonner";
import type { Route } from "./+types/admin.forms.$id";
import type { FormField } from "@prisma/client";
import { processAIRequest } from "~/services/ai.server";
import { ChatAssistant, type ChatMessageData } from "~/components/ai/ChatAssistant";
import type { FormDefinition } from "~/services/llm/types";
import { isLLMConfigured } from "~/config/llm.server";
import { FormFieldDefinitionSchema } from "~/domain/ai.schema";
import { applyRawPatchToFields } from "~/utils/apply-patch.client";

export async function loader({ request, params }: Route.LoaderArgs) {
    const user = await requireAdmin(request);

    // Support create mode when id is "new"
    if (params.id === "new") {
        return { form: null, isCreateMode: true, isLLMConfigured: isLLMConfigured() };
    }

    const form = await prisma.form.findFirst({
        where: { id: params.id, ownerUserId: user.id },
        include: {
            fields: { orderBy: { order: "asc" } },
        },
    });

    if (!form) {
        throw new Response("Form not found", { status: 404 });
    }

    return { form, isCreateMode: false, isLLMConfigured: isLLMConfigured() };
}

export async function action({ request, params }: Route.ActionArgs) {
    // Use requireAdminApi so fetch requests (AI chat) get JSON errors instead of HTML redirect
    const user = await requireAdminApi(request);
    const formData = await request.formData();
    const intent = formData.get("intent");
    const isCreateMode = params.id === "new";

    // Save form with all changes (fields + metadata)
    if (intent === "saveForm") {
        // In create mode, create the form first
        if (isCreateMode) {
            const title = String(formData.get("title") ?? "").trim();
            const description = String(formData.get("description") ?? "").trim();
            const published = formData.get("published") === "true";

            const newFieldsJson = formData.get("newFieldsJson");
            const newFields = newFieldsJson ? JSON.parse(String(newFieldsJson)) as Array<{
                type: string;
                label: string;
                required: boolean;
                order: number;
                placeholder?: string | null;
                minLength?: number | null;
                maxLength?: number | null;
                min?: number | null;
                max?: number | null;
                step?: number | null;
                rows?: number | null;
            }> : [];

            // Create form
            const form = await prisma.form.create({
                data: {
                    title: title || "Untitled Form",
                    description: description || null,
                    published,
                    ownerUserId: user.id,
                },
            });

            // Create fields
            if (newFields.length > 0) {
                await prisma.$transaction(
                    newFields.map(f =>
                        prisma.formField.create({
                            data: {
                                formId: form.id,
                                type: f.type,
                                label: f.label,
                                required: f.required,
                                order: f.order,
                                placeholder: f.placeholder || null,
                                minLength: f.minLength || null,
                                maxLength: f.maxLength || null,
                                min: f.min || null,
                                max: f.max || null,
                                step: f.step || null,
                                rows: f.rows || null,
                            },
                        })
                    )
                );
            }

            return redirect(`/admin/forms/${form.id}`);
        }

        // Edit mode - verify ownership
        const form = await prisma.form.findFirst({
            where: { id: params.id, ownerUserId: user.id },
        });
        if (!form) {
            throw new Response("Form not found", { status: 404 });
        }
        const title = String(formData.get("title") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const published = formData.get("published") === "true";

        const fieldsJson = formData.get("fieldsJson");
        const newFieldsJson = formData.get("newFieldsJson");
        const deletedFieldIdsJson = formData.get("deletedFieldIdsJson");

        // Parse JSON data
        const fieldsToUpdate = fieldsJson ? JSON.parse(String(fieldsJson)) as Array<{
            fieldId: string;
            updates: Partial<{
                label: string;
                type: string;
                required: boolean;
                placeholder: string | null;
                minLength: number | null;
                maxLength: number | null;
                min: number | null;
                max: number | null;
                step: number | null;
                rows: number | null;
                order: number;
            }>;
        }> : [];

        const newFields = newFieldsJson ? JSON.parse(String(newFieldsJson)) as Array<{
            type: string;
            label: string;
            required: boolean;
            order: number;
            placeholder?: string | null;
            minLength?: number | null;
            maxLength?: number | null;
            min?: number | null;
            max?: number | null;
            step?: number | null;
            rows?: number | null;
        }> : [];

        const deletedFieldIds = deletedFieldIdsJson ? JSON.parse(String(deletedFieldIdsJson)) as string[] : [];

        // Execute all changes in a transaction
        const operations: Array<Promise<unknown>> = [];

        // 1. Delete fields
        if (deletedFieldIds.length > 0) {
            for (const fieldId of deletedFieldIds) {
                operations.push(
                    prisma.formField.delete({
                        where: { id: fieldId },
                    })
                );
            }
        }

        // 2. Add new fields
        if (newFields.length > 0) {
            for (const f of newFields) {
                operations.push(
                    prisma.formField.create({
                        data: {
                            formId: form.id,
                            type: f.type,
                            label: f.label,
                            required: f.required,
                            order: f.order,
                            placeholder: f.placeholder || null,
                            minLength: f.minLength || null,
                            maxLength: f.maxLength || null,
                            min: f.min || null,
                            max: f.max || null,
                            step: f.step || null,
                            rows: f.rows || null,
                        },
                    })
                );
            }
        }

        // 3. Update existing fields
        if (fieldsToUpdate.length > 0) {
            for (const { fieldId, updates } of fieldsToUpdate) {
                operations.push(
                    prisma.formField.update({
                        where: { id: fieldId },
                        data: updates,
                    })
                );
            }
        }

        // 4. Update form metadata
        operations.push(
            prisma.form.update({
                where: { id: form.id },
                data: { title: title || "Untitled Form", description: description || null, published },
            })
        );

        await prisma.$transaction(operations);

        return { ok: true };
    }

    // Update form title/description (legacy, kept for compatibility)
    if (intent === "updateForm") {
        // Verify ownership
        const form = await prisma.form.findFirst({
            where: { id: params.id, ownerUserId: user.id },
        });
        if (!form) {
            throw new Response("Form not found", { status: 404 });
        }
        const title = String(formData.get("title") ?? "").trim();
        const description = String(formData.get("description") ?? "").trim();
        const published = formData.get("published") === "true";

        await prisma.form.update({
            where: { id: form.id },
            data: { title: title || "Untitled Form", description: description || null, published },
        });
        return { ok: true };
    }

    // Legacy actions (only work in edit mode, not in create mode)
    if (!isCreateMode) {
        // Verify ownership for legacy actions
        const form = await prisma.form.findFirst({
            where: { id: params.id, ownerUserId: user.id },
        });
        if (!form) {
            throw new Response("Form not found", { status: 404 });
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

        // Update multiple fields at once
        if (intent === "updateFields") {
            const fieldsJson = formData.get("fieldsJson");
            if (!fieldsJson) {
                return { error: "No fields data provided" };
            }

            try {
                const fieldsToUpdate = JSON.parse(String(fieldsJson)) as Array<{
                    fieldId: string;
                    updates: Partial<{
                        label: string;
                        type: string;
                        required: boolean;
                        placeholder: string | null;
                        minLength: number | null;
                        maxLength: number | null;
                        min: number | null;
                        max: number | null;
                        step: number | null;
                        rows: number | null;
                    }>;
                }>;

                // Update all fields in a transaction
                await prisma.$transaction(
                    fieldsToUpdate.map(({ fieldId, updates }) =>
                        prisma.formField.update({
                            where: { id: fieldId },
                            data: updates,
                        })
                    )
                );

                return { ok: true };
            } catch (error) {
                return { error: "Failed to update fields: " + (error as Error).message };
            }
        }

        // Update field
        if (intent === "updateField") {
            const fieldId = String(formData.get("fieldId"));
            const label = String(formData.get("label") ?? "").trim();
            const type = String(formData.get("type") ?? "text");
            const required = formData.get("required") === "true";

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
    }

    // AI Chat handler - must always return JSON (never throw, to avoid HTML error pages)
    if (intent === "aiChat") {
        try {
            // Check if LLM is configured
            if (!isLLMConfigured()) {
                return Response.json({
                    error: "AI chat is not configured. Please set LLM_PROVIDER and required environment variables.",
                });
            }

            // Verify ownership (only in edit mode)
            if (!isCreateMode) {
                const form = await prisma.form.findFirst({
                where: { id: params.id, ownerUserId: user.id },
                include: {
                    fields: { orderBy: { order: "asc" } },
                },
            });

            if (!form) {
                return Response.json({ error: "Form not found" });
            }

            const message = String(formData.get("message") ?? "").trim();
            if (!message) {
                return Response.json({ error: "Message is required" });
            }

            // Use currentFieldsJson from frontend if provided, otherwise fallback to DB
            const currentFieldsJson = formData.get("currentFieldsJson");
            const formDefinition: FormDefinition = currentFieldsJson
                ? {
                    fields: (JSON.parse(String(currentFieldsJson)) as Array<{
                        id: string;
                        type: string;
                        label: string;
                        required: boolean;
                        order: number;
                        placeholder?: string | null;
                        minLength?: number | null;
                        maxLength?: number | null;
                        min?: number | null;
                        max?: number | null;
                        step?: number | null;
                        rows?: number | null;
                    }>).map((f) => ({
                        id: f.id,
                        type: f.type as "text" | "number" | "textarea",
                        label: f.label,
                        required: f.required,
                        order: f.order,
                        placeholder: f.placeholder ?? null,
                        minLength: f.minLength ?? null,
                        maxLength: f.maxLength ?? null,
                        min: f.min ?? null,
                        max: f.max ?? null,
                        step: f.step ?? null,
                        rows: f.rows ?? null,
                    })),
                }
                : {
                    fields: form.fields.map((f: FormField) => ({
                        id: f.id,
                        type: f.type as "text" | "number" | "textarea",
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
                    })),
                };

            try {
                const aiResponse = await processAIRequest({
                    message,
                    formDefinition,
                });

                if (!aiResponse.success || !aiResponse.formDefinition) {
                    return Response.json({
                        error: aiResponse.error || "Failed to process AI request",
                        rawResponse: aiResponse.rawResponse,
                    });
                }

                // Return updated fields without persisting - user must approve in chat to persist
                return Response.json({
                    ok: true,
                    message: "Form updated successfully",
                    updatedFields: aiResponse.formDefinition.fields,
                    rawResponse: aiResponse.rawResponse,
                });
            } catch (error) {
                console.error("AI request error:", error);
                return Response.json({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
            }
        } else {
            // In create mode, we can still process the request but only update local state
            // The actual save will happen when the form is saved
            const message = String(formData.get("message") ?? "").trim();
            if (!message) {
                return Response.json({ error: "Message is required" });
            }

            // Get current fields from formData (they're stored in localFields on client)
            const currentFieldsJson = formData.get("currentFieldsJson");
            if (!currentFieldsJson) {
                return Response.json({ error: "Current fields are required" });
            }

            const currentFields = JSON.parse(
                String(currentFieldsJson)
            ) as FormFieldData[];

            const formDefinition: FormDefinition = {
                fields: currentFields.map((f) => ({
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
                })),
            };

            try {
                const aiResponse = await processAIRequest({
                    message,
                    formDefinition,
                });

                if (!aiResponse.success || !aiResponse.formDefinition) {
                    return Response.json({
                        error: aiResponse.error || "Failed to process AI request",
                        rawResponse: aiResponse.rawResponse,
                    });
                }

                // Return the updated fields for client to apply
                return Response.json({
                    ok: true,
                    message: "Form updated successfully",
                    updatedFields: aiResponse.formDefinition.fields,
                    rawResponse: aiResponse.rawResponse,
                });
            } catch (error) {
                console.error("AI request error (create mode):", error);
                return Response.json({
                    error:
                        error instanceof Error
                            ? error.message
                            : "Unknown error occurred",
                });
            }
        }
        } catch (error) {
            // Ensure we always return JSON, never throw (prevents HTML error pages)
            console.error("AI Chat handler error:", error);
            return Response.json({
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            });
        }
    }

    // AI Chat Approve - persist approved LLM changes to DB (edit mode only)
    if (intent === "aiChatApprove") {
        if (isCreateMode) {
            return Response.json({ error: "Approve is only for edit mode" });
        }
        const form = await prisma.form.findFirst({
            where: { id: params.id, ownerUserId: user.id },
            include: { fields: { orderBy: { order: "asc" } } },
        });
        if (!form) {
            return Response.json({ error: "Form not found" });
        }
        const approvedFieldsJson = formData.get("approvedFieldsJson");
        if (!approvedFieldsJson) {
            return Response.json({ error: "Approved fields are required" });
        }
        const approvedFields = JSON.parse(String(approvedFieldsJson)) as Array<{
            id: string;
            type: string;
            label: string;
            required: boolean;
            order: number;
            placeholder?: string | null;
            minLength?: number | null;
            maxLength?: number | null;
            min?: number | null;
            max?: number | null;
            step?: number | null;
            rows?: number | null;
        }>;

        const currentFields = form.fields;
        const newFields = approvedFields;

        const fieldsToDelete = currentFields.filter(
            (cf: FormField) => !newFields.some((nf) => nf.id === cf.id)
        );
        const fieldsToAdd = newFields.filter(
            (nf) => !currentFields.some((cf: FormField) => cf.id === nf.id)
        );
        const fieldsToUpdate = newFields
            .map((nf) => {
                const cf = currentFields.find((c: FormField) => c.id === nf.id);
                if (!cf) return null;
                const hasChanges =
                    cf.label !== nf.label ||
                    cf.type !== nf.type ||
                    cf.required !== nf.required ||
                    cf.order !== nf.order ||
                    cf.placeholder !== (nf.placeholder ?? null) ||
                    cf.minLength !== (nf.minLength ?? null) ||
                    cf.maxLength !== (nf.maxLength ?? null) ||
                    cf.min !== (nf.min ?? null) ||
                    cf.max !== (nf.max ?? null) ||
                    cf.step !== (nf.step ?? null) ||
                    cf.rows !== (nf.rows ?? null);
                if (!hasChanges) return null;
                return {
                    fieldId: nf.id,
                    updates: {
                        label: nf.label,
                        type: nf.type,
                        required: nf.required,
                        order: nf.order,
                        placeholder: nf.placeholder ?? null,
                        minLength: nf.minLength ?? null,
                        maxLength: nf.maxLength ?? null,
                        min: nf.min ?? null,
                        max: nf.max ?? null,
                        step: nf.step ?? null,
                        rows: nf.rows ?? null,
                    },
                };
            })
            .filter(Boolean) as Array<{
                fieldId: string;
                updates: Record<string, unknown>;
            }>;

        const operations: Array<Promise<unknown>> = [];
        for (const field of fieldsToDelete) {
            operations.push(prisma.formField.delete({ where: { id: field.id } }));
        }
        for (const field of fieldsToAdd) {
            operations.push(
                prisma.formField.create({
                    data: {
                        formId: form.id,
                        type: field.type,
                        label: field.label,
                        required: field.required,
                        order: field.order,
                        placeholder: field.placeholder ?? null,
                        minLength: field.minLength ?? null,
                        maxLength: field.maxLength ?? null,
                        min: field.min ?? null,
                        max: field.max ?? null,
                        step: field.step ?? null,
                        rows: field.rows ?? null,
                    },
                })
            );
        }
        for (const { fieldId, updates } of fieldsToUpdate) {
            operations.push(
                prisma.formField.update({
                    where: { id: fieldId },
                    data: updates,
                })
            );
        }
        await prisma.$transaction(operations);
        return Response.json({ ok: true, message: "Changes approved and saved" });
    }

    return { error: "Unknown action" };
}

export default function FormEditorPage() {
    const { form, isCreateMode, isLLMConfigured } = useLoaderData<typeof loader>();
    const actionData = useActionData<typeof action>();
    const navigation = useNavigation();
    const submit = useSubmit();
    const navigate = useNavigate();

    // In create mode, start with empty fields, otherwise use form fields
    const initialFields: FormFieldData[] = isCreateMode || !form
        ? []
        : form.fields.map((f: FormField) => ({
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

    // Local state for fields - all operations work on this until save
    const [localFields, setLocalFields] = useState<FormFieldData[]>(() => initialFields);

    // Sync localFields when form data changes (after save/reload) - only in edit mode
    useEffect(() => {
        if (!isCreateMode && form) {
            const newFields: FormFieldData[] = form.fields.map((f: FormField) => ({
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
            setLocalFields(newFields);
        }
    }, [form, isCreateMode]);

    const fields = localFields;

    // Save initial data for comparison
    const initialDataRef = useRef<{
        title: string;
        description: string;
        published: boolean;
        fields: FormFieldData[];
    } | null>(null);

    if (initialDataRef.current === null) {
        initialDataRef.current = {
            title: isCreateMode ? "" : (form?.title || ""),
            description: isCreateMode ? "" : (form?.description || ""),
            published: isCreateMode ? false : (form?.published || false),
            fields: fields.map(f => ({ ...f })),
        };
    }

    // Use lazy initialization to set initial selected field
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(() =>
        fields.length > 0 ? fields[0].id : null
    );
    const [showLoading, setShowLoading] = useState<boolean>(false);
    const prevFieldsCountRef = useRef<number>(localFields.length);
    const [title, setTitle] = useState<string>(isCreateMode ? "" : (form?.title || ""));
    const [description, setDescription] = useState<string>(isCreateMode ? "" : (form?.description || ""));
    const [published, setPublished] = useState<boolean>(isCreateMode ? false : (form?.published || false));
    const lastSaveIntentRef = useRef<string | null>(null);
    const [showNoChangesModal, setShowNoChangesModal] = useState<boolean>(false);
    const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState<boolean>(false);
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
    const [titleError, setTitleError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [showAIChat, setShowAIChat] = useState(false);
    const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
    const [aiError, setAiError] = useState<string | null>(null);
    const [llmPending, setLlmPending] = useState(false);
    const preLLMStateRef = useRef<FormFieldData[] | null>(null);
    const [isAILoading, setIsAILoading] = useState(false);
    const approveFetcher = useFetcher();
    const lastProcessedApproveRef = useRef<unknown>(null);

    const handleRevertLLM = () => {
        if (preLLMStateRef.current) {
            setLocalFields(preLLMStateRef.current);
            preLLMStateRef.current = null;
            setLlmPending(false);
            toast.success("Changes reverted");
        }
    };

    const handleApproveLLM = () => {
        if (isCreateMode) {
            preLLMStateRef.current = null;
            setLlmPending(false);
            toast.success("Changes approved");
            return;
        }
        const formData = new FormData();
        formData.set("intent", "aiChatApprove");
        formData.set("approvedFieldsJson", JSON.stringify(localFields));
        approveFetcher.submit(formData, {
            method: "post",
            action: window.location.pathname,
        });
    };

    // Validation functions
    const validateFormName = (formTitle: string): string | null => {
        const trimmed = formTitle.trim();
        if (!trimmed || trimmed === "Untitled Form") {
            return "Form name cannot be empty or 'Untitled Form'";
        }
        return null;
    };

    const validateFieldName = (fieldLabel: string): string | null => {
        const trimmed = fieldLabel.trim();
        if (!trimmed || trimmed === "New Field") {
            return "Field name cannot be empty or 'New Field'";
        }
        return null;
    };

    const validateAllFields = (fields: FormFieldData[]): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        if (fields.length === 0) {
            errors.push("Form must have at least one field");
            return { isValid: false, errors };
        }

        fields.forEach((field, index) => {
            const error = validateFieldName(field.label);
            if (error) {
                errors.push(`Field ${index + 1}: ${error}`);
            }
        });

        return { isValid: errors.length === 0, errors };
    };

    const validateForm = (): { isValid: boolean; errors: string[] } => {
        const errors: string[] = [];

        const titleError = validateFormName(title);
        if (titleError) {
            errors.push(titleError);
        }

        const fieldsValidation = validateAllFields(localFields);
        if (!fieldsValidation.isValid) {
            errors.push(...fieldsValidation.errors);
        }

        return { isValid: errors.length === 0, errors };
    };

    // Check if current values match initial values (for edit mode)
    // In create mode, always return false (there are always changes if form has content)
    const hasNoChanges = (): boolean => {
        if (isCreateMode) {
            // In create mode, check if form is empty
            return title.trim() === "" &&
                description.trim() === "" &&
                !published &&
                localFields.length === 0;
        }

        if (!initialDataRef.current) return false;

        // Check form metadata
        if (title.trim() !== initialDataRef.current.title.trim() ||
            description.trim() !== initialDataRef.current.description.trim() ||
            published !== initialDataRef.current.published) {
            return false;
        }

        // Check fields count
        if (localFields.length !== initialDataRef.current.fields.length) {
            return false;
        }

        // Check if there are any new fields (temp- IDs)
        const hasNewFields = localFields.some(f => f.id.startsWith('temp-'));
        if (hasNewFields) {
            return false;
        }

        // Check if any fields were deleted
        const hasDeletedFields = initialDataRef.current.fields.some(
            initialField => !localFields.some(localField => localField.id === initialField.id)
        );
        if (hasDeletedFields) {
            return false;
        }

        // Check each field by ID and compare all properties
        for (const localField of localFields) {
            const initialField = initialDataRef.current.fields.find(f => f.id === localField.id);
            if (!initialField) {
                return false;
            }

            // Compare all field properties
            if (localField.label !== initialField.label ||
                localField.type !== initialField.type ||
                localField.required !== initialField.required ||
                localField.placeholder !== initialField.placeholder ||
                localField.minLength !== initialField.minLength ||
                localField.maxLength !== initialField.maxLength ||
                localField.min !== initialField.min ||
                localField.max !== initialField.max ||
                localField.step !== initialField.step ||
                localField.rows !== initialField.rows ||
                localField.order !== initialField.order) {
                return false;
            }
        }

        return true;
    };

    // Handle field changes
    const handleFieldChange = (fieldId: string, updates: Partial<FormFieldData>) => {
        // Update local fields state
        setLocalFields(prev => prev.map(f =>
            f.id === fieldId ? { ...f, ...updates } : f
        ));

        // Clear error for this field if label is being updated
        if (updates.label !== undefined) {
            const error = validateFieldName(updates.label);
            if (!error) {
                setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldId];
                    return newErrors;
                });
            }
        }
    };

    // Handle field blur for validation
    const handleFieldBlur = (fieldId: string) => {
        const field = localFields.find(f => f.id === fieldId);
        if (field) {
            const error = validateFieldName(field.label);
            if (error) {
                setFieldErrors(prev => ({ ...prev, [fieldId]: error }));
                // Also show toast for immediate feedback
                toast.error(error);
            } else {
                // Clear error if validation passes
                setFieldErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[fieldId];
                    return newErrors;
                });
            }
        }
    };

    // Handle add field
    const handleAddField = () => {
        const maxOrder = localFields.length > 0
            ? Math.max(...localFields.map(f => f.order))
            : 0;
        const newField: FormFieldData = {
            id: `temp-${Date.now()}`,
            type: "text",
            label: "New Field",
            required: false,
            order: maxOrder + 1,
        };
        setLocalFields([...localFields, newField]);
        setSelectedFieldId(newField.id);
    };

    // Handle delete field
    const handleDeleteField = (fieldId: string) => {
        setLocalFields(prev => {
            const filtered = prev.filter(f => f.id !== fieldId);
            // Select another field if deleted was selected
            if (selectedFieldId === fieldId) {
                setSelectedFieldId(filtered.length > 0 ? filtered[0].id : null);
            }
            return filtered;
        });
    };

    // Handle reorder field
    const handleReorderField = (fieldId: string, direction: "up" | "down") => {
        setLocalFields(prev => {
            const sorted = [...prev].sort((a, b) => a.order - b.order);
            const idx = sorted.findIndex(f => f.id === fieldId);
            if (idx === -1) return prev;

            const swapIdx = direction === "up" ? idx - 1 : idx + 1;
            if (swapIdx < 0 || swapIdx >= sorted.length) return prev;

            // Swap orders
            const currentField = sorted[idx];
            const swapField = sorted[swapIdx];
            const tempOrder = currentField.order;
            currentField.order = swapField.order;
            swapField.order = tempOrder;

            return sorted;
        });
    };

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
        const currentFieldsCount = localFields.length;
        const prevFieldsCount = prevFieldsCountRef.current;

        // If a new field was added (count increased)
        if (currentFieldsCount > prevFieldsCount && localFields.length > 0) {
            // Select the last field (highest order)
            const lastField = localFields.reduce((prev, current) =>
                (current.order > prev.order) ? current : prev
            );
            setSelectedFieldId(lastField.id);
        }

        // Update ref for next comparison
        prevFieldsCountRef.current = currentFieldsCount;
    }, [localFields]);

    // Show toast on successful save and redirect
    useEffect(() => {
        if (actionData && typeof actionData === 'object' && 'ok' in actionData && actionData.ok) {
            // Only redirect if the last save was saveForm or updateForm
            if (lastSaveIntentRef.current === 'saveForm' || lastSaveIntentRef.current === 'updateForm') {
                if (isCreateMode) {
                    toast.success('Form created successfully');
                } else {
                    toast.success('Form saved successfully');
                }
                // Redirect to forms list after a short delay to show the toast
                setTimeout(() => {
                    navigate('/admin/forms/manage');
                }, 500);
                lastSaveIntentRef.current = null; // Reset after redirect
            } else {
                // For field operations, just show success toast
                toast.success('Changes saved');
            }
        }
    }, [actionData, navigate, isCreateMode]);

    // Show toast on error
    useEffect(() => {
        if (actionData && typeof actionData === 'object' && "error" in actionData && actionData.error) {
            toast.error(String(actionData.error));
        }
    }, [actionData]);

    // Update form values when form data changes (after save/reload) - only in edit mode
    useEffect(() => {
        if (!isCreateMode && form) {
            setTitle(form.title);
            setDescription(form.description || "");
            setPublished(form.published);
        }
    }, [form, isCreateMode]);

    // Update initial data after successful save - only in edit mode
    // In create mode, redirect happens after save, so this effect won't run
    useEffect(() => {
        if (!isCreateMode && actionData && typeof actionData === 'object' && 'ok' in actionData && actionData.ok && initialDataRef.current && form) {
            const newFields: FormFieldData[] = form.fields.map((f: FormField) => ({
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
            initialDataRef.current = {
                title: form.title,
                description: form.description || "",
                published: form.published,
                fields: newFields.map(f => ({ ...f })),
            };
            // Sync localFields with server data
            setLocalFields(newFields);
        }
    }, [actionData, form, isCreateMode]);

    // Helper to process AI response and apply to form
    const processAIResponse = (
        result: {
            ok?: boolean;
            error?: string;
            message?: string;
            updatedFields?: unknown[];
            rawResponse?: string;
        },
        currentFields: FormFieldData[]
    ) => {
        setAiError(null);
        if (result.error) {
            setAiError(result.error);
            setChatMessages((prev) => [
                ...prev,
                { role: "error", content: result.error || "Unknown error", timestamp: new Date() },
            ]);
            if (result.error === "Unauthorized") {
                window.location.href = "/admin/login";
            }
            return;
        }
        if (!result.ok) return;

        const rawFields: unknown[] = Array.isArray(result.updatedFields) ? result.updatedFields : [];
        const hasValidFieldObjects =
            rawFields.length > 0 &&
            rawFields.every(
                (f) => f && typeof f === "object" && "id" in f && "type" in f && "label" in f
            );

        let validatedFields: FormFieldData[] = [];
        const validationErrors: string[] = [];

        if (hasValidFieldObjects) {
            for (let i = 0; i < rawFields.length; i++) {
                const parsed = FormFieldDefinitionSchema.safeParse(rawFields[i]);
                if (parsed.success) {
                    const f = parsed.data;
                    validatedFields.push({
                        id: f.id,
                        type: f.type,
                        label: f.label,
                        required: f.required,
                        order: f.order,
                        placeholder: f.placeholder ?? undefined,
                        minLength: f.minLength ?? undefined,
                        maxLength: f.maxLength ?? undefined,
                        min: f.min ?? undefined,
                        max: f.max ?? undefined,
                        step: f.step ?? undefined,
                        rows: f.rows ?? undefined,
                    });
                } else {
                    validationErrors.push(`Field ${i + 1}: ${parsed.error.message}`);
                }
            }
        }

        if (validatedFields.length === 0 && result.rawResponse) {
            try {
                const patchedFields = applyRawPatchToFields(currentFields, result.rawResponse);
                if (patchedFields) validatedFields = patchedFields;
            } catch (err) {
                const msg = err instanceof Error ? err.message : "Failed to apply AI changes";
                setAiError(msg);
                setChatMessages((prev) => [
                    ...prev,
                    { role: "error", content: msg, timestamp: new Date() },
                ]);
                return;
            }
        }

        if (validationErrors.length > 0 && validatedFields.length === 0) {
            setAiError(`Invalid field data: ${validationErrors.join("; ")}`);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "error",
                    content: `Invalid field data: ${validationErrors.join("; ")}`,
                    timestamp: new Date(),
                },
            ]);
        } else if (validatedFields.length > 0) {
            preLLMStateRef.current = [...currentFields];
            const sortedFields = validatedFields
                .sort((a, b) => a.order - b.order)
                .map((f, idx) => ({ ...f, order: idx }));
            setLocalFields(sortedFields);
            setLlmPending(true);
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: result.message || "Form updated successfully!",
                    timestamp: new Date(),
                },
            ]);
            toast.success("AI changes applied. Approve or revert in chat.");
        }
    };

    // Process approve fetcher response - clear llmPending on success
    useEffect(() => {
        if (
            approveFetcher.state !== "idle" ||
            !approveFetcher.data ||
            lastProcessedApproveRef.current === approveFetcher.data
        ) {
            return;
        }
        lastProcessedApproveRef.current = approveFetcher.data;
        const result = approveFetcher.data as { ok?: boolean; error?: string };
        if (result.ok) {
            preLLMStateRef.current = null;
            setLlmPending(false);
            // Update initialDataRef so hasNoChanges reflects approved state
            if (initialDataRef.current) {
                initialDataRef.current = {
                    ...initialDataRef.current,
                    fields: localFields.map((f) => ({ ...f })),
                };
            }
            toast.success("Changes approved and saved");
        } else if (result.error) {
            toast.error(result.error);
        }
    }, [approveFetcher.state, approveFetcher.data, localFields]);

    // Check if form is being saved
    const isSaving = navigation.state === 'submitting' && (navigation.formData?.get('intent') === 'saveForm' || navigation.formData?.get('intent') === 'updateForm');

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

    // Auto-redirect for no changes modal
    useEffect(() => {
        if (showNoChangesModal) {
            const timer = setTimeout(() => {
                setShowNoChangesModal(false);
                navigate('/admin/forms');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [showNoChangesModal, navigate]);

    // Check if there are unsaved changes
    const hasUnsavedChanges = !hasNoChanges();

    // Block navigation when there are unsaved changes
    const blocker = useBlocker(
        ({ currentLocation, nextLocation }) =>
            hasUnsavedChanges && currentLocation.pathname !== nextLocation.pathname
    );

    // Show modal when navigation is blocked
    useEffect(() => {
        if (blocker.state === "blocked") {
            setShowUnsavedChangesModal(true);
            setPendingNavigation(() => () => {
                blocker.proceed();
                setShowUnsavedChangesModal(false);
                setPendingNavigation(null);
            });
        }
    }, [blocker]);

    // Handle browser navigation (back/forward, address bar, closing tab)
    useEffect(() => {
        if (!hasUnsavedChanges) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload);
        };
    }, [hasUnsavedChanges]);


    return (
        <div className="h-[calc(100vh-120px)] max-h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
                <Link
                    to="/admin/forms/manage"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 whitespace-nowrap"
                >
                    &larr; Back to forms
                </Link>
                <div className="flex items-center gap-4 flex-1 justify-end">
                    <Form
                        method="post"
                        id="form-editor-form"
                        onSubmit={(e) => {
                            e.preventDefault();

                            // Validate form before submission
                            const validation = validateForm();
                            if (!validation.isValid) {
                                // Set title error if validation fails
                                const titleErr = validateFormName(title);
                                if (titleErr) {
                                    setTitleError(titleErr);
                                }

                                // Set field errors
                                const newFieldErrors: Record<string, string> = {};
                                localFields.forEach((field) => {
                                    const fieldErr = validateFieldName(field.label);
                                    if (fieldErr) {
                                        newFieldErrors[field.id] = fieldErr;
                                    }
                                });
                                setFieldErrors(newFieldErrors);

                                // Show toasts for general errors
                                validation.errors.forEach(error => toast.error(error));
                                return;
                            }

                            // Clear all errors if validation passes
                            setTitleError(null);
                            setFieldErrors({});

                            // Check if no changes were made (for edit mode)
                            if (hasNoChanges()) {
                                setShowNoChangesModal(true);
                                return;
                            }

                            lastSaveIntentRef.current = "saveForm";

                            // Determine new fields (with temp- ID)
                            const newFields = localFields
                                .filter(f => f.id.startsWith('temp-'))
                                .map(f => ({
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
                                }));

                            // In create mode, all fields are new
                            // In edit mode, determine deleted and updated fields
                            let deletedFieldIds: string[] = [];
                            let updatedFields: Array<{
                                fieldId: string;
                                updates: {
                                    label: string;
                                    type: string;
                                    required: boolean;
                                    placeholder: string | null;
                                    minLength: number | null;
                                    maxLength: number | null;
                                    min: number | null;
                                    max: number | null;
                                    step: number | null;
                                    rows: number | null;
                                    order: number;
                                };
                            }> = [];

                            if (!isCreateMode) {
                                // Determine deleted fields (were in initialFields but not in localFields)
                                deletedFieldIds = initialFields
                                    .filter(f => !localFields.some(lf => lf.id === f.id))
                                    .map(f => f.id);

                                // Determine updated fields (compare localFields with initialFields)
                                updatedFields = localFields
                                    .filter(f => !f.id.startsWith('temp-'))
                                    .map(localField => {
                                        const initialField = initialFields.find(f => f.id === localField.id);
                                        if (!initialField) return null;

                                        // Check if field was changed
                                        const hasChanges =
                                            localField.label !== initialField.label ||
                                            localField.type !== initialField.type ||
                                            localField.required !== initialField.required ||
                                            localField.placeholder !== initialField.placeholder ||
                                            localField.minLength !== initialField.minLength ||
                                            localField.maxLength !== initialField.maxLength ||
                                            localField.min !== initialField.min ||
                                            localField.max !== initialField.max ||
                                            localField.step !== initialField.step ||
                                            localField.rows !== initialField.rows ||
                                            localField.order !== initialField.order;

                                        if (!hasChanges) return null;

                                        return {
                                            fieldId: localField.id,
                                            updates: {
                                                label: localField.label,
                                                type: localField.type,
                                                required: localField.required,
                                                placeholder: localField.placeholder,
                                                minLength: localField.minLength,
                                                maxLength: localField.maxLength,
                                                min: localField.min,
                                                max: localField.max,
                                                step: localField.step,
                                                rows: localField.rows,
                                                order: localField.order,
                                            },
                                        };
                                    })
                                    .filter(Boolean) as Array<{
                                        fieldId: string;
                                        updates: {
                                            label: string;
                                            type: string;
                                            required: boolean;
                                            placeholder: string | null;
                                            minLength: number | null;
                                            maxLength: number | null;
                                            min: number | null;
                                            max: number | null;
                                            step: number | null;
                                            rows: number | null;
                                            order: number;
                                        };
                                    }>;
                            }

                            // Submit all changes in one request
                            const formData = new FormData(e.currentTarget);
                            formData.set("intent", "saveForm");
                            if (!isCreateMode) {
                                formData.append("fieldsJson", JSON.stringify(updatedFields));
                                formData.append("deletedFieldIdsJson", JSON.stringify(deletedFieldIds));
                            }
                            formData.append("newFieldsJson", JSON.stringify(newFields));

                            submit(formData, { method: "post" });
                        }}
                    >
                        <input type="hidden" name="title" value={title || ""} />
                        <input type="hidden" name="description" value={description || ""} />
                        <input type="hidden" name="published" value={published ? "true" : "false"} />
                        <div className="flex items-center gap-4">
                            <Toggle
                                checked={published}
                                onChange={setPublished}
                                label="Published"
                            />
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="text-sm flex items-center gap-2"
                            >
                                <span className={`inline-block ${showLoading ? 'opacity-100' : 'opacity-0'} transition-opacity`} style={{ width: '16px', height: '16px' }}>
                                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </span>
                                Save Form
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>

            {/* Overlay during save */}
            {isSaving && (
                <div className="fixed inset-0 bg-black/10 dark:bg-black/20 z-40 pointer-events-none" />
            )}

            {/* No changes modal */}
            <Modal
                isOpen={showNoChangesModal}
                onClose={() => {
                    setShowNoChangesModal(false);
                    navigate('/admin/forms/manage');
                }}
                title="No Changes Detected"
            >
                <p className="text-gray-700 dark:text-gray-300">
                    The form values match the previous values. No changes to save.
                </p>
                <div className="mt-4 flex justify-end">
                    <Button
                        onClick={() => {
                            setShowNoChangesModal(false);
                            navigate('/admin/forms/manage');
                        }}
                    >
                        Go to Forms List
                    </Button>
                </div>
            </Modal>

            {/* Unsaved changes warning modal */}
            <Modal
                isOpen={showUnsavedChangesModal}
                onClose={() => {
                    setShowUnsavedChangesModal(false);
                    setPendingNavigation(null);
                    if (blocker.state === "blocked") {
                        blocker.reset();
                    }
                }}
                title="Unsaved Changes"
            >
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                    You have unsaved changes. If you leave now, your progress will be lost. Are you sure you want to leave the editor?
                </p>
                <div className="mt-4 flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => {
                            setShowUnsavedChangesModal(false);
                            setPendingNavigation(null);
                            if (blocker.state === "blocked") {
                                blocker.reset();
                            }
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => {
                            if (pendingNavigation) {
                                pendingNavigation();
                            }
                        }}
                    >
                        Leave Without Saving
                    </Button>
                </div>
            </Modal>

            {/* Main content: 12/44/44 split */}
            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Left: Field Navigation Sidebar (12%) */}
                <div className="w-[12%] min-w-[180px] border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-white dark:bg-gray-900">
                    <div className="p-2">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                            Fields ({fields.length})
                        </h3>
                        <div className="space-y-1">
                            {fields.map((field, index) => {
                                const hasError = !!fieldErrors[field.id];
                                const isSelected = selectedFieldId === field.id;
                                return (
                                    <button
                                        key={field.id}
                                        type="button"
                                        onClick={() => setSelectedFieldId(field.id)}
                                        className={`
                                            w-full text-left px-3 py-2 rounded-md text-sm transition-colors
                                            ${isSelected
                                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                                : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                                            }
                                            ${hasError
                                                ? 'border-l-4 border-red-500'
                                                : ''
                                            }
                                        `}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    #{index + 1}
                                                </span>
                                                <span className="truncate">
                                                    {field.label || 'Unnamed Field'}
                                                </span>
                                            </span>
                                            {hasError && (
                                                <span className="text-red-500 shrink-0" title={fieldErrors[field.id]}>
                                                    ⚠
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Middle: Preview (44%) */}
                <div className="w-[44%] min-h-0 border-r border-gray-200 dark:border-gray-700 overflow-y-auto bg-gray-50 dark:bg-gray-950">
                    <div className="p-6">
                        {/* Form title and description inputs */}
                        <div className="mb-6 space-y-4">
                            <div>
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">Form Settings</span>

                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Form Name
                                </label>
                                <Input
                                    type="text"
                                    form="form-editor-form"
                                    value={title}
                                    onChange={(e) => {
                                        setTitle(e.target.value);
                                        setTitleError(null);
                                    }}
                                    onBlur={(e) => {
                                        const error = validateFormName(e.target.value);
                                        if (error) {
                                            setTitleError(error);
                                            toast.error(error);
                                        } else {
                                            setTitleError(null);
                                        }
                                    }}
                                    placeholder="Form title"
                                    error={titleError || undefined}
                                    className="text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                    Form Description
                                </label>
                                <Input
                                    type="text"
                                    form="form-editor-form"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Form description (optional)"
                                    className="text-sm"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                Preview
                            </h2>
                            <Button
                                type="button"
                                onClick={handleAddField}
                                className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700"
                            >
                                + Add Field
                            </Button>
                        </div>
                        <ClickableFormPreview
                            title={title || ""}
                            description={description}
                            fields={fields}
                            selectedFieldId={selectedFieldId}
                            onFieldClick={setSelectedFieldId}
                        />
                    </div>
                </div>

                {/* Right: Sidebar (44%) */}
                <div className="w-[44%] min-h-500 overflow-y-auto bg-white dark:bg-gray-900">
                    <div className="p-6">
                        {/* Toggle between Field Settings and AI Chat */}
                        <div className="mb-4 flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                            <button
                                type="button"
                                onClick={() => setShowAIChat(false)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${!showAIChat
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                    }`}
                            >
                                Field Settings
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAIChat(true)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${showAIChat
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                                    }`}
                            >
                                AI Assistant
                            </button>
                        </div>

                        {showAIChat ? (
                            <div className="flex flex-col min-h-0" style={{ height: 'calc(100vh - 450px)', maxHeight: 'calc(100vh - 450px)' }}>
                                {!isLLMConfigured ? (
                                    <div className="flex flex-col items-center justify-center h-full p-6 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
                                        <div className="text-center max-w-md">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                AI Assistant Not Configured
                                            </h3>
                                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                                Please configure your LLM provider by setting the following environment variables:
                                            </p>
                                            <div className="text-left bg-gray-50 dark:bg-gray-800 p-4 rounded-md mb-4">
                                                <code className="text-sm text-gray-700 dark:text-gray-300">
                                                    LLM_PROVIDER=ollama<br />
                                                    OLLAMA_BASE_URL=http://host.docker.internal:11434<br />
                                                    OLLAMA_MODEL=llama3.2:latest
                                                </code>
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-500">
                                                After setting these variables, restart the Docker container.
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2">
                                        {llmPending && (
                                            <div className="flex-shrink-0 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                                <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                                                    AI changes are pending. Approve to save or revert to restore.
                                                </p>
                                                <div className="flex gap-2">
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        onClick={handleRevertLLM}
                                                        className="text-sm"
                                                    >
                                                        Revert
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="primary"
                                                        onClick={handleApproveLLM}
                                                        disabled={approveFetcher.state !== "idle"}
                                                        className="text-sm"
                                                    >
                                                        {approveFetcher.state !== "idle"
                                                            ? "Saving..."
                                                            : "Approve"}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        <div className="flex-1 min-h-0 overflow-hidden">
                                        <ChatAssistant
                                            onSendMessage={async (message: string) => {
                                                setAiError(null);
                                                setChatMessages((prev) => [
                                                    ...prev,
                                                    {
                                                        role: "user",
                                                        content: message,
                                                        timestamp: new Date(),
                                                    },
                                                ]);
                                                setIsAILoading(true);
                                                const formData = new FormData();
                                                formData.set("message", message);
                                                formData.set(
                                                    "currentFieldsJson",
                                                    JSON.stringify(localFields)
                                                );
                                                try {
                                                    const aiChatUrl =
                                                        window.location.pathname + "/ai-chat";
                                                    const res = await fetch(aiChatUrl, {
                                                        method: "POST",
                                                        body: formData,
                                                        credentials: "same-origin",
                                                    });
                                                    const result = (await res.json()) as {
                                                        ok?: boolean;
                                                        error?: string;
                                                        message?: string;
                                                        updatedFields?: unknown[];
                                                        rawResponse?: string;
                                                    };
                                                    processAIResponse(result, localFields);
                                                } catch (err) {
                                                    const msg =
                                                        err instanceof Error
                                                            ? err.message
                                                            : "Request failed";
                                                    setAiError(msg);
                                                    setChatMessages((prev) => [
                                                        ...prev,
                                                        {
                                                            role: "error",
                                                            content: msg,
                                                            timestamp: new Date(),
                                                        },
                                                    ]);
                                                } finally {
                                                    setIsAILoading(false);
                                                }
                                            }}
                                            messages={chatMessages}
                                            isLoading={isAILoading}
                                            error={aiError}
                                            disabled={false}
                                        />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : selectedField ? (
                            <>
                                <div className="mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        Field Settings
                                    </h2>
                                </div>
                                <FormFieldEditor
                                    field={selectedField}
                                    formId={isCreateMode ? "new" : form?.id || ""}
                                    isFirst={fields.findIndex((f) => f.id === selectedField.id) === 0}
                                    isLast={
                                        fields.findIndex((f) => f.id === selectedField.id) ===
                                        fields.length - 1
                                    }
                                    fieldIndex={fields.findIndex((f) => f.id === selectedField.id)}
                                    labelError={fieldErrors[selectedField.id]}
                                    onFieldChange={handleFieldChange}
                                    onFieldDelete={handleDeleteField}
                                    onFieldReorder={handleReorderField}
                                    onFieldTouched={handleFieldBlur}
                                />
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">
                                    add fields to the form                                 </p>
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
}: {
    title: string;
    description?: string | null;
    fields: FormFieldData[];
    selectedFieldId: string | null;
    onFieldClick: (fieldId: string) => void;
}) {
    // Filter fields: only show fields with valid names (not empty and not "New Field")
    const validFields = fields.filter(field => {
        const trimmedLabel = field.label.trim();
        return trimmedLabel !== "" && trimmedLabel !== "New Field";
    });

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-8">
                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                    {title}
                </h1>
                {description && (
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{description}</p>
                )}

                {validFields.length === 0 && (
                    <p className="text-gray-400 dark:text-gray-500 italic">
                        This form has no fields yet.
                    </p>
                )}

                <div className="space-y-5">
                    {validFields.map((field) => (
                        <FormFieldRenderer
                            key={field.id}
                            field={field}
                            mode="preview"
                            isSelected={selectedFieldId === field.id}
                            onClick={() => onFieldClick(field.id)}
                        />
                    ))}
                </div>

                {validFields.length > 0 && (
                    <button
                        type="button"
                        disabled
                        className="mt-8 w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-lg opacity-60 cursor-not-allowed"
                    >
                        Submit
                    </button>
                )}
            </div>
        </div>
    );
}


