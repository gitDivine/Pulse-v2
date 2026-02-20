export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gray-900 text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">PULSE</h1>
          <p className="mt-1 text-sm text-gray-400">Africa&apos;s Commerce Nervous System</p>
        </div>
        <div>
          <p className="text-2xl font-semibold leading-tight">
            One platform to manage your orders, inventory, payments, and logistics.
          </p>
          <p className="mt-4 text-gray-400">
            SCOUT &middot; HAUL &middot; FLOW &middot; CONVOY
          </p>
        </div>
        <p className="text-xs text-gray-600">
          &copy; {new Date().getFullYear()} PULSE. Built for African commerce.
        </p>
      </div>

      {/* Right panel — auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 lg:hidden">
            <h1 className="text-2xl font-bold text-orange-500">PULSE</h1>
            <p className="text-sm text-gray-500">Africa&apos;s Commerce Nervous System</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
