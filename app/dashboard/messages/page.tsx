import { redirect } from 'next/navigation';

// Canonical messages location moved to /network/messages (profile-scoped, truly anonymous).
export default function MessagesPage() {
  redirect('/network/messages');
}
