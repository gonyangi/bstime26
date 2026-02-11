import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the default view of the application
  redirect('/room');
}
