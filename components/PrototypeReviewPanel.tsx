"use client";

import { useEffect, useState } from "react";
import { BrainCircuit, CheckCircle2 } from "lucide-react";
import { AiPrototypeLab } from "@/components/AiPrototypeLab";
import { getSupabase } from "@/lib/supabase-browser";

type StageStatus =
  | "locked"
  | "editable"
  | "submitted"
  | "correction_required"
  | "approved"
  | "rejected";

type Work = {
  group_id: number;
  stage_id: number;
  status: StageStatus;
  score: number | string;
  content: Record<string, any>;
  teacher_comment: string;
  student_comment: string;
  submitted_at: string | null;
};

type Props = {
  groupId: number;
  projectName?: string | null;
  prototypeUrl?: string | null;
  stage3: Work;
  stage4: Work;
  onChanged: () => void | Promise<void>;
};

function numeric(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export function PrototypeReviewPanel({
  groupId,
  projectName,
  prototypeUrl,
  stage3,
  stage4,
  onChanged,
}: Props) {
  const currentScore = numeric(stage3.score) + numeric(stage4.score);
  const approved =
    stage3.status === "approved" && stage4.status === "approved";

  const [score, setScore] = useState(String(currentScore || ""));
  const [comment, setComment] = useState(
    stage3.teacher_comment || stage4.teacher_comment || ""
  );
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setScore(String(currentScore || ""));
    setComment(stage3.teacher_comment || stage4.teacher_comment || "");
  }, [
    stage3.score,
    stage4.score,
    stage3.teacher_comment,
    stage4.teacher_comment,
  ]);

  async function approvePrototype() {
    const value = Number(score);

    if (!Number.isFinite(value) || value < 0 || value > 8) {
      setNotice("La nota del prototipo debe estar entre 0 y 8.");
      return;
    }

    if (
      approved &&
      value < currentScore
    ) {
      setNotice(
        "La base actual permite mantener o aumentar una nota ya aprobada, pero no reducirla."
      );
      return;
    }

    if (
      !window.confirm(
        approved
          ? `¿Actualizar la nota del prototipo a ${value}/8?`
          : `¿Aprobar el prototipo con ${value}/8 puntos?`
      )
    ) {
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const supabase = await getSupabase();
      const half = Math.round((value / 2) * 100) / 100;

      const { error: stage3Error } = await supabase
        .from("group_stage_work")
        .update({
          status: "approved",
          score: half,
          teacher_comment: comment.trim(),
        })
        .eq("group_id", groupId)
        .eq("stage_id", 3);

      if (stage3Error) throw stage3Error;

      const { error: stage4Error } = await supabase
        .from("group_stage_work")
        .update({
          status: "approved",
          score: half,
          teacher_comment: comment.trim(),
          content: {
            ...(stage4.content ?? {}),
            combined_prototype: true,
            combined_score: value,
          },
        })
        .eq("group_id", groupId)
        .eq("stage_id", 4);

      if (stage4Error) throw stage4Error;

      setNotice(
        `✅ Prototipo aprobado con ${value}/8. La Exposición final quedó habilitada.`
      );
      await onChanged();
    } catch (error) {
      console.error(error);
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la evaluación del prototipo."
      );
    } finally {
      setBusy(false);
    }
  }

  async function requestCorrection() {
    if (!comment.trim()) {
      setNotice("Escribe una observación para indicar qué deben corregir.");
      return;
    }

    if (!window.confirm("¿Solicitar corrección del prototipo?")) return;

    setBusy(true);
    setNotice("");

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("group_stage_work")
        .update({
          status: "correction_required",
          teacher_comment: comment.trim(),
        })
        .eq("group_id", groupId)
        .eq("stage_id", 3);

      if (error) throw error;
      setNotice("🔄 Corrección solicitada.");
      await onChanged();
    } catch (error) {
      console.error(error);
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo solicitar la corrección."
      );
    } finally {
      setBusy(false);
    }
  }

  const statusLabel = approved
    ? "✅ Aprobado"
    : stage3.status === "submitted"
    ? "🟡 Esperando evaluación"
    : stage3.status === "correction_required"
    ? "🔄 Corrección solicitada"
    : stage3.status === "editable"
    ? "✏️ En desarrollo"
    : stage3.status === "rejected"
    ? "❌ Rechazado"
    : "🔒 Bloqueado";

  return (
    <section
      style={{
        display: "grid",
        gap: 16,
        marginBottom: 14,
        border: "1px solid #ddd6fe",
        borderRadius: 20,
        padding: 18,
        background: "linear-gradient(135deg,#ffffff,#faf8ff)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <small style={{ color: "#6d28d9", fontWeight: 900 }}>
            ETAPA 3 · PROTOTIPO IA · 8 PUNTOS
          </small>
          <h3 style={{ margin: "5px 0" }}>Probar mi proyecto IA</h3>
          <p style={{ margin: 0, color: "#64748b", maxWidth: 760 }}>
            Reúne las antiguas Etapas 3 y 4. Prueba la función principal
            directamente y coloca una sola nota sobre 8.
          </p>
        </div>
        <strong
          style={{
            height: "fit-content",
            borderRadius: 999,
            padding: "8px 12px",
            background: approved ? "#ecfdf5" : "#f8fafc",
            color: approved ? "#047857" : "#475569",
          }}
        >
          {statusLabel}
        </strong>
      </div>

      <AiPrototypeLab
        groupId={groupId}
        projectName={projectName}
        prototypeUrl={prototypeUrl}
        showDemoButton={true}
        showExposureButton={false}
      />

      {stage3.student_comment && (
        <div
          style={{
            borderRadius: 14,
            padding: 12,
            background: "#f8fafc",
            color: "#475569",
          }}
        >
          <strong>💬 Estudiante:</strong> {stage3.student_comment}
        </div>
      )}

      {approved ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(130px,180px) 1fr auto",
            gap: 12,
            alignItems: "end",
            borderRadius: 16,
            padding: 16,
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
          }}
        >
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Nota del prototipo /8</strong>
            <input
              type="number"
              min="0"
              max="8"
              step="0.1"
              value={score}
              onChange={(event) => setScore(event.target.value)}
              style={{
                minHeight: 43,
                border: "1px solid #cbd5e1",
                borderRadius: 11,
                padding: "0 12px",
              }}
            />
          </label>
          <label style={{ display: "grid", gap: 6 }}>
            <strong>Observación</strong>
            <textarea
              rows={2}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 11,
                padding: 10,
                resize: "vertical",
              }}
            />
          </label>
          <button
            type="button"
            disabled={busy}
            onClick={approvePrototype}
            style={{
              minHeight: 43,
              border: 0,
              borderRadius: 12,
              padding: "0 16px",
              background: "#15803d",
              color: "white",
              fontWeight: 900,
              cursor: busy ? "wait" : "pointer",
            }}
          >
            <CheckCircle2 size={17} /> Guardar
          </button>
        </div>
      ) : stage3.status === "submitted" ? (
        <div
          style={{
            display: "grid",
            gap: 12,
            borderRadius: 16,
            padding: 16,
            background: "#fffbeb",
            border: "1px solid #fde68a",
          }}
        >
          <strong style={{ color: "#92400e" }}>
            🟡 Prototipo listo para evaluación
          </strong>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(130px,180px) 1fr",
              gap: 12,
            }}
          >
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Nota /8</strong>
              <input
                type="number"
                min="0"
                max="8"
                step="0.1"
                placeholder="0 a 8"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                style={{
                  minHeight: 43,
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: "0 11px",
                }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <strong>Observación</strong>
              <textarea
                rows={3}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Fortalezas, observaciones o correcciones..."
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: 10,
                  padding: 11,
                  resize: "vertical",
                }}
              />
            </label>
          </div>

          {notice && (
            <div style={{ color: notice.startsWith("✅") ? "#047857" : "#92400e" }}>
              {notice}
            </div>
          )}

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              disabled={busy}
              onClick={requestCorrection}
              style={{
                minHeight: 42,
                border: "1px solid #d1d5db",
                borderRadius: 11,
                padding: "0 14px",
                background: "white",
                fontWeight: 850,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              🔄 Pedir corrección
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={approvePrototype}
              style={{
                minHeight: 42,
                border: 0,
                borderRadius: 11,
                padding: "0 16px",
                background: "linear-gradient(135deg,#6d28d9,#4f46e5)",
                color: "white",
                fontWeight: 900,
                cursor: busy ? "wait" : "pointer",
              }}
            >
              <BrainCircuit size={17} /> Aprobar prototipo
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            borderRadius: 14,
            padding: 13,
            background: "#f8fafc",
            color: "#64748b",
          }}
        >
          {notice ||
            (stage3.status === "correction_required"
              ? "Esperando que el grupo corrija y vuelva a enviar el prototipo."
              : stage3.status === "locked"
              ? "El Canvas todavía debe aprobarse."
              : "El grupo todavía está probando su proyecto.")}
        </div>
      )}
    </section>
  );
}
