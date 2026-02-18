import { Form, Link, useLocation } from "react-router";

interface AdminNavProps {
    userEmail: string;
}

export function AdminNav({ userEmail }: AdminNavProps) {
    const location = useLocation();

    const isFormsListActive = location.pathname === "/admin/forms";

    const isFormsManageActive = location.pathname === "/admin/forms/manage";

    const isFormEditorActive = location.pathname.startsWith("/admin/forms/") &&
        location.pathname !== "/admin/forms" &&
        location.pathname !== "/admin/forms/manage";

    const isResultsActive = location.pathname === "/admin/results";

    const getLinkClassName = (isActive: boolean) => {
        const baseClasses = "text-sm transition-colors px-4 py-2 rounded-md border-b-2";
        if (isActive) {
            return `${baseClasses} text-gray-900 dark:text-white font-semibold bg-blue-50 dark:bg-blue-900/20 border-blue-600 dark:border-blue-400`;
        }
        return `${baseClasses} text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent`;
    };

    return (
        <div className="flex justify-between h-14 items-center">
            <div className="flex items-center gap-8">
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                    FormBuilder
                </span>
                <Link
                    to="/admin/forms"
                    className={getLinkClassName(isFormsListActive)}
                >
                    Forms
                </Link>
                <Link
                    to="/admin/forms/manage"
                    className={getLinkClassName(isFormsManageActive)}
                >
                    Manage Forms
                </Link>
                <Link
                    to="/admin/results"
                    className={getLinkClassName(isResultsActive)}
                >
                    Results
                </Link>
                {isFormEditorActive && (
                    <span
                        className={getLinkClassName(true)}
                    >
                        Form Editor
                    </span>
                )}
            </div>
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {userEmail} (admin)
                </span>
                <Form method="post" action="/logout">
                    <button
                        type="submit"
                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                        Logout
                    </button>
                </Form>
            </div>
        </div>
    );
}

