export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Gestionale
        </h1>
        <p className="text-gray-600 mb-8">
          Sistema di gestione aziendale con Supabase
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Clienti</h2>
            <p className="text-gray-600">Gestione anagrafica clienti</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Prodotti</h2>
            <p className="text-gray-600">Gestione anagrafica prodotti</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Fornitori</h2>
            <p className="text-gray-600">Gestione anagrafica fornitori</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold mb-2">Ordini</h2>
            <p className="text-gray-600">Simulazione ordini</p>
          </div>
        </div>
      </div>
    </main>
  );
}
