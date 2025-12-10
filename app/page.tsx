import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 text-center">
        <img
          src="https://artbclzfaccheonngkbe.supabase.co/storage/v1/object/public/avatars/3473677f-6c55-45ea-b191-dd43057febf7/avatar-1764921945394.png"
          alt="All in One Logo"
          className="mx-auto h-32 w-auto mb-8"
        />
        <h1 className="text-5xl font-bold text-gray-900 mb-8">
          All in One
        </h1>

        <div className="flex justify-center">
          <Link
            href="/login"
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Accedi
          </Link>
        </div>
      </div>
    </main>
  );
}
