"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { fetchAuthSession, signOut } from "aws-amplify/auth";
import { useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function Home() {
  return (
    <Authenticator>
      {({ user }) => <Dashboard userEmail={user?.signInDetails?.loginId ?? ""} />}
    </Authenticator>
  );
}

function Dashboard({ userEmail }: { userEmail: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const getToken = async () => {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() ?? "";
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/items`, {
        headers: { Authorization: token },
      });
      const data = await res.json();
      setItems(data.items ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">BeDrawn</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{userEmail}</span>
          <button
            onClick={() => signOut()}
            className="text-sm px-3 py-1 rounded border border-gray-300 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>

      <button
        onClick={fetchItems}
        disabled={loading}
        className="mb-6 px-4 py-2 bg-black text-white rounded-lg text-sm disabled:opacity-50"
      >
        {loading ? "Loading…" : "Refresh"}
      </button>

      {items.length === 0 && !loading ? (
        <p className="text-gray-400 text-sm">No items yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id ?? item.PK} className="border rounded-lg p-3 text-sm font-mono">
              {JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
