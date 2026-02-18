import { Link, Form } from "react-router";
import { Card } from "~/components/ui/Card";
import { Badge } from "~/components/ui/Badge";
import { Toggle } from "~/components/ui/Toggle";
import { DeleteButton } from "~/components/forms/DeleteButton";

interface FormCardProps {
    form: {
        id: string;
        title: string;
        description?: string | null;
        published?: boolean;
        _count?: { fields: number };
        updatedAt: Date | string;
    };
    variant?: "public" | "admin";
}

export function FormCard({ form, variant = "public" }: FormCardProps) {
    const editUrl = variant === "admin" ? `/admin/forms/${form.id}` : `/forms/${form.id}`;
    const linkText = variant === "admin" ? "Edit" : "Open";

    if (variant === "admin") {
        return (
            <Card className="p-5 flex flex-col h-full min-h-[280px]">
                {/* Title and Badge */}
                <div className="flex items-start justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1 pr-2">
                        {form.title}
                    </h2>
                    <Badge variant={form.published ? "published" : "draft"}>
                        {form.published ? "Published" : "Draft"}
                    </Badge>
                </div>

                {/* Description - always reserve space */}
                <div className="mb-3 min-h-10">
                    {form.description ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                            {form.description}
                        </p>
                    ) : (
                        <div className="text-sm text-transparent">Placeholder</div>
                    )}
                </div>

                {/* Metadata - always reserve space */}
                <div className="mb-4 min-h-4">
                    {form._count ? (
                        <div className="text-xs text-gray-400 dark:text-gray-500">
                            {form._count.fields} field{form._count.fields !== 1 ? "s" : ""} &middot; Updated{" "}
                            {new Date(form.updatedAt).toLocaleDateString()}
                        </div>
                    ) : (
                        <div className="text-xs text-transparent">Placeholder</div>
                    )}
                </div>

                {/* Controls section */}
                <div className="mt-auto flex flex-col gap-3">
                    <Form method="post" id={`toggle-form-${form.id}`}>
                        <input type="hidden" name="intent" value="togglePublish" />
                        <input type="hidden" name="formId" value={form.id} />
                        <Toggle
                            checked={form.published || false}
                            onChange={() => {
                                const formElement = document.getElementById(`toggle-form-${form.id}`) as HTMLFormElement;
                                if (formElement) {
                                    formElement.requestSubmit();
                                }
                            }}
                            label="Published"
                        />
                    </Form>
                    <div className="flex gap-2">
                        <Link
                            to={editUrl}
                            className="flex-1 text-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            {linkText}
                        </Link>
                        <DeleteButton formId={form.id} formTitle={form.title} />
                    </div>
                </div>
            </Card>
        );
    }

    // Public variant (unchanged)
    return (
        <Card className="p-5 flex flex-col h-full min-h-[200px]">
            <div className="flex items-start justify-between mb-1">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex-1">
                    {form.title}
                </h2>
            </div>
            <div className="mb-3 min-h-10">
                {form.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {form.description}
                    </p>
                ) : (
                    <div className="text-sm text-transparent">Placeholder</div>
                )}
            </div>
            <div className="mt-auto">
                <Link
                    to={editUrl}
                    className="block text-center px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    {linkText}
                </Link>
            </div>
        </Card>
    );
}

