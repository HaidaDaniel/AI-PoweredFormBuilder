import { Outlet } from "react-router";
import { Header } from "~/components/navigation/Header";
import { AdminNav } from "~/components/navigation/AdminNav";

interface AdminLayoutProps {
    userEmail: string;
}

export function AdminLayout({ userEmail }: AdminLayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
            <Header>
                <AdminNav userEmail={userEmail} />
            </Header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Outlet />
            </main>
        </div>
    );
}


