import type { FormFieldData } from "./types";
import { Label } from "~/components/ui/Label";
import { Input } from "~/components/ui/Input";
import { Textarea } from "~/components/ui/Textarea";
import { cn } from "~/lib/utils";
import type { UseFormRegisterReturn } from "react-hook-form";

interface FormFieldRendererProps {
    field: FormFieldData;
    value?: string | number;
    onChange?: (value: string | number) => void;
    error?: string;
    disabled?: boolean;
    mode?: "preview" | "fill";
    isSelected?: boolean;
    onClick?: () => void;
    register?: UseFormRegisterReturn;
    onBlur?: () => void;
}

export function FormFieldRenderer({
    field,
    value,
    error,
    disabled = false,
    mode = "fill",
    isSelected = false,
    onClick,
    register,
    onBlur,
}: FormFieldRendererProps) {
    const isPreview = mode === "preview";
    const isClickable = isPreview && onClick;

    const inputClasses = isSelected && !error
        ? "border-blue-500 ring-2 ring-blue-500"
        : "";

    // In preview mode with click handler, override disabled cursor to pointer
    // Use pointer-events-none so clicks pass through to wrapper, but cursor shows from wrapper
    const previewInputClasses = isClickable
        ? "!cursor-pointer pointer-events-none"
        : "";

    const fieldWrapperClasses = isClickable
        ? `p-3 rounded-lg transition-colors cursor-pointer ${isSelected
            ? "bg-blue-50 dark:bg-blue-900/20"
            : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
        }`
        : "";

    const labelEl = (
        <Label
            htmlFor={field.id}
            required={field.required}
            className={cn("mb-2", isClickable && "cursor-pointer")}
        >
            {field.label}
        </Label>
    );

    const renderField = () => {
        // For React Router forms, use defaultValue instead of value when in fill mode
        // If register is provided (RHF), use it instead
        const inputProps = register
            ? {
                ...register,
                onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                    register.onBlur(e);
                    onBlur?.();
                },
            }
            : isPreview
                ? {}
                : {
                    defaultValue: value !== undefined ? value : undefined,
                    onBlur,
                };

        switch (field.type) {
            case "text":
                return (
                    <Input
                        id={field.id}
                        name={field.id}
                        type="text"
                        placeholder={
                            field.placeholder ||
                            (isPreview ? `Enter ${field.label.toLowerCase()}` : undefined)
                        }
                        required={field.required}
                        disabled={disabled || isPreview}
                        minLength={field.minLength || undefined}
                        maxLength={field.maxLength || undefined}
                        {...inputProps}
                        error={error}
                        className={cn(inputClasses, previewInputClasses)}
                    />
                );

            case "number":
                return (
                    <Input
                        id={field.id}
                        name={field.id}
                        type="number"
                        placeholder={
                            field.placeholder || (isPreview ? "0" : undefined)
                        }
                        required={field.required}
                        disabled={disabled || isPreview}
                        min={field.min || undefined}
                        max={field.max || undefined}
                        step={field.step || undefined}
                        {...inputProps}
                        error={error}
                        className={cn(inputClasses, previewInputClasses)}
                    />
                );

            case "textarea":
                return (
                    <Textarea
                        id={field.id}
                        name={field.id}
                        placeholder={
                            field.placeholder ||
                            (isPreview ? `Enter ${field.label.toLowerCase()}` : undefined)
                        }
                        required={field.required}
                        disabled={disabled || isPreview}
                        minLength={field.minLength || undefined}
                        maxLength={field.maxLength || undefined}
                        rows={field.rows || 4}
                        {...inputProps}
                        error={error}
                        className={cn(inputClasses, previewInputClasses)}
                    />
                );

            default:
                return null;
        }
    };

    if (isClickable) {
        return (
            <div className={fieldWrapperClasses} onClick={onClick}>
                {labelEl}
                {renderField()}
            </div>
        );
    }

    return (
        <div>
            {labelEl}
            {renderField()}
        </div>
    );
}

