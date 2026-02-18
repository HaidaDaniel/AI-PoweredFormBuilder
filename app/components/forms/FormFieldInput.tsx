import { FormFieldRenderer } from "./FormFieldRenderer";
import type { FormFieldData } from "./types";
import type { UseFormRegisterReturn, RegisterOptions } from "react-hook-form";

interface FormFieldInputProps {
    field: FormFieldData;
    value?: string | number;
    onChange?: (value: string | number) => void;
    error?: string;
    register?: (name: string, options?: RegisterOptions) => UseFormRegisterReturn;
    onBlur?: () => void;
}

export function FormFieldInput({
    field,
    value,
    onChange,
    error,
    register,
    onBlur,
}: FormFieldInputProps) {
    return (
        <FormFieldRenderer
            field={field}
            value={value}
            onChange={onChange}
            error={error}
            mode="fill"
            register={register ? register(field.id) : undefined}
            onBlur={onBlur}
        />
    );
}


