import { Link } from "react-router";

export function PublicNav({ isAdmin }: { isAdmin: boolean }) {

  return (
    <div className="flex justify-between h-14 items-center">
      <div className="flex items-center gap-6">
        <Link
          to="/forms"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          {isAdmin ? "Form Builder" : "Forms"}
        </Link>
        <Link
          to="/forms"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          Forms
        </Link>
      </div>
      <div className="flex items-center">
        <Link
          to="/admin/login"
          className="px-4 py-2 font-medium rounded-lg transition-colors bg-blue-600 hover:bg-blue-700 text-white"
        >
          Login
        </Link>
      </div>
    </div>
  );
}

