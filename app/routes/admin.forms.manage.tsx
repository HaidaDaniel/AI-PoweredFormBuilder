import { useLoaderData, useSearchParams, useNavigate, redirect } from "react-router";
import { requireAdmin } from "~/auth/auth.server";
import { prisma } from "~/db/db.server";
import { Button } from "~/components/ui/Button";
import { FormCard } from "~/components/forms/FormCard";
import { useEffect } from "react";
import { toast } from "sonner";
import type { Route } from "./+types/admin.forms.manage";
import type { Form as PrismaForm } from "@prisma/client";

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

    // Handle form deletion
    if (intent === "delete") {
        const formId = String(formData.get("formId"));

        // Verify ownership before deletion
        const form = await prisma.form.findFirst({
            where: { id: formId, ownerUserId: user.id },
        });

        if (!form) {
            throw new Response("Form not found", { status: 404 });
        }

        // Delete the form (cascade will delete fields and responses)
        await prisma.form.delete({
            where: { id: formId },
        });

        return redirect("/admin/forms/manage?deleted=true");
    }

    // Handle toggle publish status
    if (intent === "togglePublish") {
        const formId = String(formData.get("formId"));

        // Verify ownership
        const form = await prisma.form.findFirst({
            where: { id: formId, ownerUserId: user.id },
        });

        if (!form) {
            throw new Response("Form not found", { status: 404 });
        }

        // Toggle published status
        await prisma.form.update({
            where: { id: formId },
            data: { published: !form.published },
        });

        return { ok: true };
    }

    return { error: "Unknown action" };
}

export default function FormsManagePage() {
    const { forms } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();

    // Show toast on successful deletion
    useEffect(() => {
        if (searchParams.get("deleted") === "true") {
            toast.success("Form deleted successfully");
            // Remove the parameter from URL
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete("deleted");
            setSearchParams(newSearchParams, { replace: true });
        }
    }, [searchParams, setSearchParams]);

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    My Forms
                </h1>
                <Button type="button" onClick={() => navigate("/admin/forms/new")}>
                    + New Form
                </Button>
            </div>

            {forms.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        You don&apos;t have any forms yet.
                    </p>
                    <Button type="button" onClick={() => navigate("/admin/forms/new")}>
                        Create your first form
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {forms.map((form: PrismaForm & { _count: { fields: number } }) => (
                        <FormCard
                            key={form.id}
                            form={form}
                            variant="admin"
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

