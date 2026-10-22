"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  getSupabase,
} from "@/lib/supabase-browser";

export default function LoginPage() {
  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");

    const form =
      new FormData(
        event.currentTarget
      );

    const identifier =
      String(
        form.get("identifier") ||
          ""
      )
        .trim()
        .toLowerCase();

    const password =
      String(
        form.get("password") ||
          ""
      );

    const email =
      identifier.includes("@")
        ? identifier
        : `${identifier}@atenas.test`;

    try {
      const supabase =
        await getSupabase();

      const { data, error } =
        await supabase.auth
          .signInWithPassword({
            email,
            password,
          });

      if (error) {
        if (
          String(
            error.message
          )
            .toLowerCase()
            .includes(
              "invalid login"
            )
        ) {
          throw new Error(
            "Usuario o contraseña incorrectos."
          );
        }

        throw error;
      }

      if (!data.user) {
        throw new Error(
          "No se pudo identificar al usuario."
        );
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(
          "username, display_name, role, group_id, active"
        )
        .eq(
          "id",
          data.user.id
        )
        .single();

      if (profileError) {
        throw profileError;
      }

      if (!profile?.active) {
        await supabase.auth
          .signOut();

        throw new Error(
          "Esta cuenta está deshabilitada por el profesor."
        );
      }

      if (
        profile.role ===
        "student"
      ) {
        window.location.href =
          "/student";
        return;
      }

      window.location.href =
        "/";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background:
          "linear-gradient(135deg, #f5f7ff 0%, #eef9f7 100%)",
        padding: 24,
        fontFamily:
          "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 420,
          background: "white",
          borderRadius: 24,
          padding: 32,
          boxShadow:
            "0 20px 60px rgba(31, 41, 55, 0.12)",
        }}
      >
        <div
          style={{
            marginBottom: 28,
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#6c56d9",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            ATENAS SV
          </p>

          <h1
            style={{
              margin:
                "8px 0",
              fontSize: 30,
              color: "#1f2937",
            }}
          >
            Atenas IA Lab
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            Ingresa con el usuario
            y contraseña entregados
            por el profesor.
          </p>
        </div>

        <form
          onSubmit={
            handleLogin
          }
          style={{
            display: "grid",
            gap: 18,
          }}
        >
          <label
            style={{
              display: "grid",
              gap: 7,
              color: "#374151",
              fontWeight: 600,
            }}
          >
            Usuario

            <input
              name="identifier"
              type="text"
              required
              autoComplete="username"
              placeholder="Ej. grupo7"
              style={{
                height: 46,
                borderRadius: 12,
                border:
                  "1px solid #d1d5db",
                padding:
                  "0 14px",
                fontSize: 16,
              }}
            />

            <small
              style={{
                color: "#6b7280",
                fontWeight: 400,
              }}
            >
              El profesor también
              puede entrar usando su
              correo completo.
            </small>
          </label>

          <label
            style={{
              display: "grid",
              gap: 7,
              color: "#374151",
              fontWeight: 600,
            }}
          >
            Contraseña

            <input
              name="password"
              type="password"
              required
              autoComplete=
                "current-password"
              style={{
                height: 46,
                borderRadius: 12,
                border:
                  "1px solid #d1d5db",
                padding:
                  "0 14px",
                fontSize: 16,
              }}
            />
          </label>

          {message && (
            <div
              style={{
                background:
                  "#fff1f2",
                color:
                  "#be123c",
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              height: 48,
              border: 0,
              borderRadius: 12,
              background:
                "#6c56d9",
              color: "white",
              fontSize: 16,
              fontWeight: 700,
              cursor: loading
                ? "wait"
                : "pointer",
              opacity: loading
                ? 0.7
                : 1,
            }}
          >
            {loading
              ? "Ingresando..."
              : "Iniciar sesión"}
          </button>
        </form>
      </section>
    </main>
  );
}
