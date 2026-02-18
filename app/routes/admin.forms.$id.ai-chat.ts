/**
 * Resource route for AI chat - returns plain JSON (no Single Fetch serialization)
 */
import { requireAdminApi } from "~/auth/auth.server";
import { prisma } from "~/db/db.server";
import { processAIRequest } from "~/services/ai.server";
import { isLLMConfigured } from "~/config/llm.server";
import type { FormDefinition } from "~/services/llm/types";
import type { FormField } from "@prisma/client";
import type { Route } from "./+types/admin.forms.$id.ai-chat";

export async function action({ request, params }: Route.ActionArgs) {
    const user = await requireAdminApi(request);
    const formData = await request.formData();
    const isCreateMode = params.id === "new";

    if (!isLLMConfigured()) {
        return Response.json({
            error: "AI chat is not configured. Please set LLM_PROVIDER and required environment variables.",
        });
    }

    const message = String(formData.get("message") ?? "").trim();
    if (!message) {
        return Response.json({ error: "Message is required" });
    }

    let formDefinition: FormDefinition;

    if (!isCreateMode) {
        const form = await prisma.form.findFirst({
            where: { id: params.id, ownerUserId: user.id },
            include: { fields: { orderBy: { order: "asc" } } },
        });
        if (!form) {
            return Response.json({ error: "Form not found" });
        }
        const currentFieldsJson = formData.get("currentFieldsJson");
        formDefinition = currentFieldsJson
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
    } else {
        const currentFieldsJson = formData.get("currentFieldsJson");
        if (!currentFieldsJson) {
            return Response.json({ error: "Current fields are required" });
        }
        const currentFields = JSON.parse(String(currentFieldsJson)) as Array<{
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
        formDefinition = {
            fields: currentFields.map((f) => ({
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
        };
    }

    try {
        const aiResponse = await processAIRequest({ message, formDefinition });

        if (!aiResponse.success || !aiResponse.formDefinition) {
            return Response.json({
                error: aiResponse.error || "Failed to process AI request",
                rawResponse: aiResponse.rawResponse,
            });
        }

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
                error instanceof Error ? error.message : "Unknown error occurred",
        });
    }
}
