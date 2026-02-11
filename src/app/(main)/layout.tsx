import Header from '@/components/layout/Header';
import MainNav from '@/components/layout/MainNav';
import { FirebaseClientProvider } from '@/firebase';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FirebaseClientProvider>
      <div className="flex min-h-screen w-full flex-col bg-background">
        <Header />
        <MainNav />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </FirebaseClientProvider>
  );
}
