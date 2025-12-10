import { redirect } from 'next/navigation'

// Registrazione disabilitata - gli utenti vengono creati dall'amministratore
export default function SignupPage() {
  redirect('/login')
}
