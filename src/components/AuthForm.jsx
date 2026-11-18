"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { doCredentialSignIn } from "@/app/actions";
import { getAllServiceCategories, getServicesByCategory } from "@/data/homeservices";
import { Eye, EyeOff } from "lucide-react";

export default function AuthForm({ mode = "signin" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const [category, setCategory] = useState("");
  const signup = mode !== "signin",
    provider = mode === "provider";
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      if (!signup) {
        const result = await doCredentialSignIn(form);
        if (result.error) throw new Error(result.error.message);
        router.push("/homeservices");
        router.refresh();
        return;
      }
      const data = Object.fromEntries(form);
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      router.push("/signin?registered=1");
    } catch (e) {
      setError(e.message || "Unable to submit. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const field = (name, label, type = "text", max = 100) => (
    <label className="field" key={name}>
      {label}
      <input
        name={name}
        type={type}
        required
        maxLength={max}
        autoComplete={
          name === "username"
            ? "username"
            : name === "email"
              ? "email"
              : name === "phone"
                ? "tel"
                : undefined
        }
      />
    </label>
  );
  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <div className="feedback error" role="alert">
          {error}
        </div>
      )}
      <div className={signup ? "form-grid" : "space-y-5"}>
        {field("username", "Username", "text", 50)}
        {signup && field("email", provider ? "Email Address" : "Email", "email", 254)}
      </div>
      {signup && field("phone", "Phone Number", "tel", 20)}
      <label className="field">
        Password
        <div className="relative">
          <input
            name="password"
            aria-label="Password"
            type={show ? "text" : "password"}
            required
            minLength={signup ? 12 : 1}
            maxLength={72}
            autoComplete={signup ? "new-password" : "current-password"}
            style={{ paddingRight: 50 }}
          />
          <button
            className="absolute right-3 top-3 p-1"
            type="button"
            aria-label={show ? "Hide password" : "Show password"}
            onClick={() => setShow((v) => !v)}
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {signup && (
          <span className="subtle text-xs font-normal">
            At least 12 characters. Maximum 72 UTF-8 bytes.
          </span>
        )}
      </label>
      {signup && !provider && (
        <>
          <h3 className="pt-3">Your visit address</h3>
          {field("street", "Street Address", "text", 200)}
          <div className="form-grid">
            {field("city", "City")}
            {field("state", "State")}
          </div>
        </>
      )}
      {provider && (
        <>
          <label className="field">
            Service category
            <select
              id="category"
              name="category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Choose a category</option>
              {getAllServiceCategories().map((c) => (
                <option key={c} value={c}>
                  {c.replace(/([a-z])([A-Z])/g, "$1 $2")}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            Service Type
            <select key={category} name="service" required defaultValue="">
              <option value="">Choose a service</option>
              {getServicesByCategory(category).map((s) => (
                <option value={s.name} key={s.name}>
                  {s.name.replace(/([a-z])([A-Z])/g, "$1 $2")}
                </option>
              ))}
            </select>
          </label>
          <p className="subtle text-sm">
            Your initial hours are 09:00–17:00 daily, in India Standard Time. Change or close any
            day in Settings after signing in.
          </p>
        </>
      )}
      <button type="submit" disabled={busy} className="btn w-full justify-center">
        {busy ? "Please wait…" : signup ? "Sign Up" : "Sign In"}
      </button>
      <p className="subtle text-sm text-center">
        {signup ? "Already have an account?" : "New to Fixit?"}{" "}
        <Link className="text-link" href={signup ? "/signin" : "/signup"}>
          {signup ? "Sign In" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
