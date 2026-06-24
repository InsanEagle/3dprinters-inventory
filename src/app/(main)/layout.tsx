import { AppHeader } from "@/components/AppHeader";
import { requireEmployee } from "@/lib/auth";

export default async function MainLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const employee = await requireEmployee();

  return (
    <div className="min-h-screen bg-paper">
      <AppHeader employee={employee} />
      <main className="mx-auto w-full max-w-3xl px-4 py-5 pb-24">
        {children}
      </main>
    </div>
  );
}
