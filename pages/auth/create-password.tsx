import router from "next/router";
import { useState, useEffect } from "react";

import { autoLogin } from "../../lib/autologin";

export default function CreatePasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session_id = urlParams.get("session_id");
    if (session_id) {
      fetch(`/api/checkout-session?session_id=${session_id}`)
        .then(res => res.json())
        .then(data => setEmail(data.email));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    // Call your Supabase backend to create/update user password
    const res = await fetch("/api/create-user-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const result = await res.json();

    if (result.success) {
      // now log them in
      const session = await autoLogin(email, password);
      if (session) {
        router.push("/dashboard"); // or wherever
      } else {
        alert("Error creating password");
      }
    };
  }

    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
        // style={{ backgroundImage: "url(/bg.jpg)" }}
      >
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-6">Create Your Password</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white">Email</label>
              <input type="text" value={email} disabled className="w-full border p-2 rounded bg-gray-100" />
            </div>
            <div>
              <label className="text-white">New Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
            </div>
            <div>
              <label className="text-white">Confirm Password</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full border p-2 rounded" required />
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded">
              Create Password
            </button>
          </form>
        </div>
      </div>
    );
  }

