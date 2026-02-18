interface HeaderProps {
    children: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
    return (
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </header>
    );
}


