import { Outlet } from "react-router";
import { Header } from "~/components/navigation/Header";
import { PublicNav } from "~/components/navigation/PublicNav";
import { AdminNav } from "~/components/navigation/AdminNav";
import type { AuthUser } from "~/auth/auth.server";

interface PublicLayoutProps {
    user: AuthUser | null;
}

export function PublicLayout({ user }: PublicLayoutProps) {
    const isAdmin = user?.role === "admin";

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header>
                {isAdmin ? (
                    <AdminNav userEmail={user.email} />
                ) : (
                    <PublicNav isAdmin={isAdmin} />
                )}
            </Header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}

