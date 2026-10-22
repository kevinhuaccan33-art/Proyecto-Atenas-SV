"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CheckCircle2,
  ChevronRight,
  FileText,
  ImagePlus,
  Lock,
  LogOut,
  RefreshCw,
  Send,
  Sparkles,
  Upload,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getSupabase } from "@/lib/supabase-browser";

type StageStatus =
  | "locked"
  | "editable"
  | "submitted"
  | "correction_required"
  | "approved"
  | "rejected";

type Stage = {
  id: number;
  name: string;
  description: string;
  milestone_percent: number;
};

type StageWork = {
  group_id: number;
  stage_id: number;
  status: StageStatus;
  content: Record<string, any>;
  evidence_url: string | null;
  student_comment: string;
  score: number | string;
  teacher_comment: string;
  revision: number;
  submitted_at: string | null;
  reviewed_at: string | null;
};

type GroupData = {
  id: number;
  members: string;
  project_name: string | null;
  logo_path: string | null;
  active: boolean;
  completion_approved: boolean;
  diploma_code: string | null;
};

const STATUS_DATA: Record<
  StageStatus,
  {
    icon: string;
    label: string;
    background: string;
    color: string;
  }
> = {
  locked: {
    icon: "🔒",
    label: "Bloqueada",
    background: "#f3f4f6",
    color: "#6b7280",
  },

  editable: {
    icon: "✏️",
    label: "En desarrollo",
    background: "#eef2ff",
    color: "#5145cd",
  },

  submitted: {
    icon: "🟡",
    label: "Esperando revisión",
    background: "#fff7e6",
    color: "#92400e",
  },

  correction_required: {
    icon: "🔄",
    label: "Corrección solicitada",
    background: "#fff1f2",
    color: "#be123c",
  },

  approved: {
    icon: "✅",
    label: "Aprobada",
    background: "#ecfdf5",
    color: "#047857",
  },

  rejected: {
    icon: "❌",
    label: "Rechazada",
    background: "#fef2f2",
    color: "#b91c1c",
  },
};

function numeric(
  value: number | string | null | undefined
) {
  const result = Number(value ?? 0);

  return Number.isFinite(result)
    ? result
    : 0;
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
      }}
    >
      <strong>{label}</strong>

      <input
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        style={{
          minHeight: 46,
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: "0 14px",
          fontSize: 15,
          background: disabled
            ? "#f3f4f6"
            : "white",
        }}
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  rows?: number;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
      }}
    >
      <strong>{label}</strong>

      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        rows={rows}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
          resize: "vertical",
          background: disabled
            ? "#f3f4f6"
            : "white",
        }}
      />
    </label>
  );
}

export default function StudentPage() {
  const [authReady, setAuthReady] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [uploading, setUploading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [displayName, setDisplayName] =
    useState("Estudiante");

  const [group, setGroup] =
    useState<GroupData | null>(null);

  const [stages, setStages] =
    useState<Stage[]>([]);

  const [works, setWorks] =
    useState<StageWork[]>([]);

  // ETAPA 1

  const [projectName, setProjectName] =
    useState("");

  const [members, setMembers] =
    useState("");

  const [logoPath, setLogoPath] =
    useState("");

  const [logoPreview, setLogoPreview] =
    useState("");

  const [stage1Comment, setStage1Comment] =
    useState("");

  // ETAPA 2

  const [problem, setProblem] =
    useState("");

  const [beneficiaries, setBeneficiaries] =
    useState("");

  const [solution, setSolution] =
    useState("");

  const [objective, setObjective] =
    useState("");

  const [aiUse, setAiUse] =
    useState("");

  const [limitations, setLimitations] =
    useState("");

  const [technologies, setTechnologies] =
    useState("");

  const [schemePath, setSchemePath] =
    useState("");

  const [schemeUrl, setSchemeUrl] =
    useState("");

  const [stage2Comment, setStage2Comment] =
    useState("");

  const stage1 = useMemo(
    () =>
      works.find(
        (work) => work.stage_id === 1
      ) ?? null,
    [works]
  );

  const stage2 = useMemo(
    () =>
      works.find(
        (work) => work.stage_id === 2
      ) ?? null,
    [works]
  );

  const grade = useMemo(
    () =>
      works
        .filter(
          (work) =>
            work.status === "approved"
        )
        .reduce(
          (total, work) =>
            total + numeric(work.score),
          0
        ),
    [works]
  );

  const progress =
    Math.round(grade * 5 * 10) / 10;

  const stage1Editable =
    stage1?.status === "editable" ||
    stage1?.status ===
      "correction_required";

  const stage2Editable =
    stage2?.status === "editable" ||
    stage2?.status ===
      "correction_required";

  useEffect(() => {
    let mounted = true;

    async function verifyStudent() {
      try {
        const supabase =
          await getSupabase();

        const { data: sessionData } =
          await supabase.auth.getSession();

        const user =
          sessionData.session?.user;

        if (!user) {
          window.location.replace("/login");
          return;
        }

        const {
          data: profile,
          error,
        } = await supabase
          .from("profiles")
          .select(
            "display_name, role, group_id, active"
          )
          .eq("id", user.id)
          .single();

        if (
          error ||
          !profile ||
          !profile.active
        ) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (profile.role === "admin") {
          window.location.replace("/");
          return;
        }

        if (
          profile.role !== "student" ||
          !profile.group_id
        ) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (mounted) {
          setDisplayName(
            profile.display_name ||
              "Estudiante"
          );

          setAuthReady(true);
        }
      } catch (error) {
        console.error(error);
        window.location.replace("/login");
      }
    }

    verifyStudent();

    return () => {
      mounted = false;
    };
  }, []);

  async function createFileUrl(
    path: string
  ) {
    if (!path) return "";

    try {
      const supabase =
        await getSupabase();

      const { data, error } =
        await supabase.storage
          .from("project-assets")
          .createSignedUrl(path, 3600);

      if (
        error ||
        !data?.signedUrl
      ) {
        return "";
      }

      return data.signedUrl;
    } catch {
      return "";
    }
  }

  async function loadStudentData() {
    setLoading(true);

    try {
      const supabase =
        await getSupabase();

      const { data: userData } =
        await supabase.auth.getUser();

      const user = userData.user;

      if (!user) {
        window.location.replace("/login");
        return;
      }

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();

      if (
        profileError ||
        !profile?.group_id
      ) {
        throw new Error(
          "No encontramos un grupo asignado a esta cuenta."
        );
      }

      const groupId =
        Number(profile.group_id);

      const [
        groupResult,
        stagesResult,
        workResult,
      ] = await Promise.all([
        supabase
          .from("groups")
          .select(`
            id,
            members,
            project_name,
            logo_path,
            active,
            completion_approved,
            diploma_code
          `)
          .eq("id", groupId)
          .maybeSingle(),

        supabase
          .from("stages")
          .select(`
            id,
            name,
            description,
            milestone_percent
          `)
          .order("id", {
            ascending: true,
          }),

        supabase
          .from("group_stage_work")
          .select(`
            group_id,
            stage_id,
            status,
            content,
            evidence_url,
            student_comment,
            score,
            teacher_comment,
            revision,
            submitted_at,
            reviewed_at
          `)
          .eq("group_id", groupId)
          .order("stage_id", {
            ascending: true,
          }),
      ]);

      if (groupResult.error) {
        throw groupResult.error;
      }

      if (stagesResult.error) {
        throw stagesResult.error;
      }

      if (workResult.error) {
        throw workResult.error;
      }

      if (!groupResult.data) {
        throw new Error(
          "Tu grupo está deshabilitado o todavía no está disponible."
        );
      }

      const loadedGroup =
        groupResult.data as GroupData;

      const loadedWorks =
        (workResult.data ??
          []) as StageWork[];

      setGroup(loadedGroup);

      setStages(
        (stagesResult.data ??
          []) as Stage[]
      );

      setWorks(loadedWorks);

      // ETAPA 1

      const identity =
        loadedWorks.find(
          (work) =>
            work.stage_id === 1
        );

      const identityContent =
        identity?.content &&
        typeof identity.content ===
          "object"
          ? identity.content
          : {};

      setProjectName(
        String(
          identityContent.project_name ??
            loadedGroup.project_name ??
            ""
        )
      );

      setMembers(
        String(
          identityContent.members ??
            loadedGroup.members ??
            ""
        )
      );

      const currentLogo =
        String(
          identityContent.logo_path ??
            loadedGroup.logo_path ??
            ""
        );

      setLogoPath(currentLogo);

      setStage1Comment(
        identity?.student_comment ?? ""
      );

      if (currentLogo) {
        setLogoPreview(
          await createFileUrl(
            currentLogo
          )
        );
      } else {
        setLogoPreview("");
      }

      // ETAPA 2

      const canvas =
        loadedWorks.find(
          (work) =>
            work.stage_id === 2
        );

      const canvasContent =
        canvas?.content &&
        typeof canvas.content ===
          "object"
          ? canvas.content
          : {};

      setProblem(
        String(
          canvasContent.problem ?? ""
        )
      );

      setBeneficiaries(
        String(
          canvasContent.beneficiaries ??
            ""
        )
      );

      setSolution(
        String(
          canvasContent.solution ?? ""
        )
      );

      setObjective(
        String(
          canvasContent.objective ?? ""
        )
      );

      setAiUse(
        String(
          canvasContent.ai_use ?? ""
        )
      );

      setLimitations(
        String(
          canvasContent.limitations ??
            ""
        )
      );

      setTechnologies(
        String(
          canvasContent.technologies ??
            ""
        )
      );

      const currentScheme =
        String(
          canvasContent.scheme_path ??
            ""
        );

      setSchemePath(currentScheme);

      setStage2Comment(
        canvas?.student_comment ?? ""
      );

      if (currentScheme) {
        setSchemeUrl(
          await createFileUrl(
            currentScheme
          )
        );
      } else {
        setSchemeUrl("");
      }
    } catch (error) {
      console.error(
        "Error cargando grupo:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el grupo."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadStudentData();
  }, [authReady]);

  async function uploadStageFile(
    file: File,
    stageId: number
  ) {
    if (!group) {
      throw new Error(
        "No hay grupo disponible."
      );
    }

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase() || "file";

    const fileName =
      `${crypto.randomUUID()}.${extension}`;

    const path =
      `${group.id}/${stageId}/${fileName}`;

    const supabase =
      await getSupabase();

    const { error } =
      await supabase.storage
        .from("project-assets")
        .upload(path, file, {
          upsert: false,
          contentType: file.type,
        });

    if (error) throw error;

    return path;
  }

  async function uploadLogo(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !group) return;

    setMessage("");

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    if (!allowed.includes(file.type)) {
      setMessage(
        "El logo debe ser PNG, JPG o WebP."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setMessage(
        "El logo no puede superar 5 MB."
      );

      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const path =
        await uploadStageFile(
          file,
          1
        );

      setLogoPath(path);

      setLogoPreview(
        URL.createObjectURL(file)
      );

      setMessage(
        "Logo cargado correctamente."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir el logo."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function uploadScheme(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0];

    if (!file || !group) return;

    setMessage("");

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];

    if (!allowed.includes(file.type)) {
      setMessage(
        "El esquema debe ser PNG, JPG, WebP o PDF."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setMessage(
        "El archivo no puede superar 10 MB."
      );

      event.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const path =
        await uploadStageFile(
          file,
          2
        );

      setSchemePath(path);

      if (
        file.type ===
        "application/pdf"
      ) {
        setSchemeUrl(
          await createFileUrl(path)
        );
      } else {
        setSchemeUrl(
          URL.createObjectURL(file)
        );
      }

      setMessage(
        "Esquema cargado correctamente."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir el esquema."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function saveIdentity(
    submit: boolean
  ) {
    if (!group || !stage1) return;

    if (!stage1Editable) {
      setMessage(
        "La Etapa 1 está bloqueada."
      );
      return;
    }

    const cleanProjectName =
      projectName.trim();

    const cleanMembers =
      members.trim();

    if (
      submit &&
      !cleanProjectName
    ) {
      setMessage(
        "Debes escribir el nombre del proyecto."
      );
      return;
    }

    if (
      submit &&
      !cleanMembers
    ) {
      setMessage(
        "Debes indicar los integrantes."
      );
      return;
    }

    if (
      submit &&
      !logoPath
    ) {
      setMessage(
        "Debes subir el logo antes de enviar."
      );
      return;
    }

    if (
      submit &&
      !window.confirm(
        "¿Enviar la Etapa 1 al profesor? Después quedará bloqueada hasta que sea revisada."
      )
    ) {
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase =
        await getSupabase();

      const payload: Record<
        string,
        any
      > = {
        content: {
          project_name:
            cleanProjectName,

          members:
            cleanMembers,

          logo_path:
            logoPath,
        },

        student_comment:
          stage1Comment.trim(),
      };

      if (submit) {
        payload.status =
          "submitted";
      }

      const { error } =
        await supabase
          .from("group_stage_work")
          .update(payload)
          .eq(
            "group_id",
            group.id
          )
          .eq("stage_id", 1);

      if (error) throw error;

      setMessage(
        submit
          ? "Etapa 1 enviada al profesor."
          : "Borrador de Etapa 1 guardado."
      );

      await loadStudentData();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la Etapa 1."
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveCanvas(
    submit: boolean
  ) {
    if (!group || !stage2) return;

    if (!stage2Editable) {
      setMessage(
        "La Etapa 2 está bloqueada."
      );
      return;
    }

    const fields = [
      {
        name: "Problema",
        value: problem.trim(),
      },
      {
        name: "Beneficiarios",
        value: beneficiaries.trim(),
      },
      {
        name: "Solución",
        value: solution.trim(),
      },
      {
        name: "Objetivo",
        value: objective.trim(),
      },
      {
        name: "Uso de IA",
        value: aiUse.trim(),
      },
      {
        name: "Limitaciones",
        value: limitations.trim(),
      },
      {
        name: "Tecnologías",
        value: technologies.trim(),
      },
    ];

    if (submit) {
      const missing =
        fields.find(
          (field) => !field.value
        );

      if (missing) {
        setMessage(
          `Falta completar: ${missing.name}.`
        );
        return;
      }

      if (!schemePath) {
        setMessage(
          "Debes subir el esquema del proyecto antes de enviar."
        );
        return;
      }

      if (
        !window.confirm(
          "¿Enviar el Canvas completo al profesor? La Etapa 2 quedará bloqueada mientras se revisa."
        )
      ) {
        return;
      }
    }

    setSaving(true);
    setMessage("");

    try {
      const supabase =
        await getSupabase();

      const payload: Record<
        string,
        any
      > = {
        content: {
          problem: problem.trim(),

          beneficiaries:
            beneficiaries.trim(),

          solution: solution.trim(),

          objective: objective.trim(),

          ai_use: aiUse.trim(),

          limitations:
            limitations.trim(),

          technologies:
            technologies.trim(),

          scheme_path: schemePath,
        },

        student_comment:
          stage2Comment.trim(),
      };

      if (submit) {
        payload.status =
          "submitted";
      }

      const { error } =
        await supabase
          .from("group_stage_work")
          .update(payload)
          .eq(
            "group_id",
            group.id
          )
          .eq("stage_id", 2);

      if (error) throw error;

      setMessage(
        submit
          ? "Etapa 2 enviada al profesor. Quedó bloqueada para revisión."
          : "Borrador del Canvas guardado correctamente."
      );

      await loadStudentData();
    } catch (error) {
      console.error(error);

      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la Etapa 2."
      );
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const supabase =
      await getSupabase();

    await supabase.auth.signOut();

    window.location.replace(
      "/login"
    );
  }

  if (
    !authReady ||
    loading
  ) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg,#f5f7ff,#eef9f7)",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div
          style={{
            textAlign: "center",
          }}
        >
          <strong
            style={{
              display: "block",
              fontSize: 26,
              marginBottom: 8,
            }}
          >
            Atenas IA Lab
          </strong>

          Cargando tu proyecto...
        </div>
      </main>
    );
  }

  if (!group) {
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f8fc",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div>
          {message ||
            "No hay grupo disponible."}
        </div>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <header
        style={{
          minHeight: 72,
          background: "white",
          borderBottom:
            "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: 20,
          padding:
            "12px clamp(18px,5vw,70px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span
            style={{
              width: 42,
              height: 42,
              display: "grid",
              placeItems: "center",
              borderRadius: 13,
              color: "white",
              background:
                "linear-gradient(135deg,#6c56d9,#2388d9)",
            }}
          >
            <Sparkles size={21} />
          </span>

          <div>
            <strong
              style={{
                display: "block",
                fontSize: 17,
              }}
            >
              Atenas IA Lab
            </strong>

            <small
              style={{
                color: "#6b7280",
              }}
            >
              Inteligencia Artificial II
            </small>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <UserRound size={19} />

          <span>{displayName}</span>

          <Button
            variant="outline"
            onClick={logout}
          >
            <LogOut size={17} />
            Salir
          </Button>
        </div>
      </header>

      <div
        style={{
          width: "min(1180px,92%)",
          margin: "0 auto",
          padding: "34px 0 60px",
        }}
      >
        <section
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(280px,1fr))",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <article
            style={{
              background:
                "linear-gradient(135deg,#6250c9,#765fe0)",
              color: "white",
              borderRadius: 26,
              padding: 28,
            }}
          >
            <small
              style={{
                opacity: 0.85,
                fontWeight: 700,
              }}
            >
              GRUPO {group.id}
            </small>

            <h1
              style={{
                margin: "10px 0 8px",
                fontSize: 30,
              }}
            >
              {group.project_name ||
                projectName ||
                "Tu proyecto de IA"}
            </h1>

            <p style={{ margin: 0 }}>
              {group.members ||
                members ||
                "Integrantes por definir"}
            </p>
          </article>

          <article
            style={{
              background: "white",
              borderRadius: 26,
              padding: 28,
            }}
          >
            <small
              style={{
                color: "#6b7280",
              }}
            >
              NOTA ACTUAL
            </small>

            <strong
              style={{
                display: "block",
                fontSize: 30,
                margin: "7px 0 18px",
              }}
            >
              {grade}/20
            </strong>

            <Progress value={progress} />

            <p
              style={{
                color: "#6b7280",
              }}
            >
              Progreso general:{" "}
              <strong
                style={{
                  color: "#111827",
                }}
              >
                {progress}%
              </strong>
            </p>
          </article>
        </section>

        {message && (
          <button
            onClick={() =>
              setMessage("")
            }
            style={{
              width: "100%",
              border: 0,
              borderRadius: 14,
              padding: 14,
              marginBottom: 20,
              textAlign: "left",
              background: "#eef2ff",
              color: "#4338ca",
              cursor: "pointer",
            }}
          >
            {message}
          </button>
        )}

        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: 26,
            marginBottom: 24,
          }}
        >
          <small
            style={{
              color: "#6c56d9",
              fontWeight: 800,
            }}
          >
            CAMINO DEL PROYECTO
          </small>

          <h2>Camino recorrido</h2>

          <p
            style={{
              color: "#6b7280",
            }}
          >
            Cada etapa vale hasta 4 puntos.
          </p>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(170px,1fr))",
              gap: 12,
            }}
          >
            {stages.map((stage) => {
              const work =
                works.find(
                  (item) =>
                    item.stage_id === stage.id
                );

              const status =
                work?.status ?? "locked";

              const info =
                STATUS_DATA[status];

              return (
                <article
                  key={stage.id}
                  style={{
                    border:
                      "1px solid #e5e7eb",
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 24,
                    }}
                  >
                    {info.icon}
                  </div>

                  <small>
                    ETAPA {stage.id}
                  </small>

                  <strong
                    style={{
                      display: "block",
                      margin: "6px 0 9px",
                    }}
                  >
                    {stage.name}
                  </strong>

                  <span
                    style={{
                      display:
                        "inline-block",
                      borderRadius: 999,
                      padding: "5px 9px",
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        info.background,
                      color: info.color,
                    }}
                  >
                    {info.label}
                  </span>

                  <p
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                    }}
                  >
                    {numeric(work?.score)}/4
                    puntos
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        {stage1 && (
          <section
            style={{
              background: "white",
              borderRadius: 24,
              padding: 30,
              marginBottom: 24,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div>
                <small
                  style={{
                    color: "#6c56d9",
                    fontWeight: 800,
                  }}
                >
                  ETAPA 1 · 4 PUNTOS
                </small>

                <h2>
                  Identidad del proyecto
                </h2>

                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  Nombre, integrantes y
                  logo oficial.
                </p>
              </div>

              <span
                style={{
                  height: "fit-content",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    STATUS_DATA[
                      stage1.status
                    ].background,
                  color:
                    STATUS_DATA[
                      stage1.status
                    ].color,
                }}
              >
                {
                  STATUS_DATA[
                    stage1.status
                  ].icon
                }{" "}
                {
                  STATUS_DATA[
                    stage1.status
                  ].label
                }
              </span>
            </div>

            {stage1.teacher_comment && (
              <div
                style={{
                  padding: 15,
                  borderRadius: 14,
                  marginBottom: 18,
                  background: "#f3f4f6",
                }}
              >
                <strong>
                  👨‍🏫 Comentario del profesor
                </strong>

                <p>
                  {stage1.teacher_comment}
                </p>
              </div>
            )}

            <form
              onSubmit={(
                event: FormEvent<HTMLFormElement>
              ) => {
                event.preventDefault();
                saveIdentity(false);
              }}
              style={{
                display: "grid",
                gap: 18,
              }}
            >
              <TextField
                label="Nombre del proyecto"
                value={projectName}
                onChange={setProjectName}
                disabled={
                  !stage1Editable
                }
                placeholder="Ej. PetID AI"
              />

              <TextField
                label="Integrantes"
                value={members}
                onChange={setMembers}
                disabled={
                  !stage1Editable
                }
                placeholder="Nombres de los integrantes"
              />

              <div>
                <strong>
                  Logo del proyecto
                </strong>

                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      width: 90,
                      height: 90,
                      borderRadius: 17,
                      background: "#f3f4f6",
                      display: "grid",
                      placeItems: "center",
                      overflow: "hidden",
                    }}
                  >
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <ImagePlus />
                    )}
                  </div>

                  <label
                    style={{
                      cursor:
                        stage1Editable
                          ? "pointer"
                          : "not-allowed",
                    }}
                  >
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={
                        !stage1Editable ||
                        uploading
                      }
                      onChange={uploadLogo}
                    />

                    <span
                      style={{
                        display:
                          "inline-flex",
                        gap: 7,
                        alignItems:
                          "center",
                        border:
                          "1px solid #d1d5db",
                        borderRadius: 10,
                        padding: "10px 13px",
                      }}
                    >
                      <Upload size={17} />
                      Subir logo
                    </span>
                  </label>
                </div>
              </div>

              <TextAreaField
                label="Comentario para el profesor"
                value={stage1Comment}
                onChange={setStage1Comment}
                disabled={
                  !stage1Editable
                }
                placeholder="Comentario opcional"
                rows={3}
              />

              {stage1Editable ? (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent:
                      "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={
                      saving || uploading
                    }
                  >
                    <FileText size={17} />
                    Guardar borrador
                  </Button>

                  <Button
                    type="button"
                    disabled={
                      saving || uploading
                    }
                    onClick={() =>
                      saveIdentity(true)
                    }
                  >
                    <Send size={17} />
                    Enviar al profesor
                  </Button>
                </div>
              ) : (
                <div
                  style={{
                    background: "#f8fafc",
                    padding: 14,
                    borderRadius: 13,
                  }}
                >
                  {stage1.status ===
                  "approved"
                    ? `✅ Etapa aprobada · ${numeric(
                        stage1.score
                      )}/4 puntos.`
                    : stage1.status ===
                      "submitted"
                    ? "🔒 Etapa enviada. El profesor la está revisando."
                    : "🔒 Etapa bloqueada."}
                </div>
              )}
            </form>
          </section>
        )}

        {stage2 && (
          <section
            style={{
              background: "white",
              borderRadius: 24,
              padding: 30,
              marginBottom: 24,
              opacity:
                stage2.status ===
                "locked"
                  ? 0.72
                  : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div>
                <small
                  style={{
                    color: "#2388d9",
                    fontWeight: 800,
                  }}
                >
                  ETAPA 2 · 4 PUNTOS
                </small>

                <h2>Canvas completo</h2>

                <p
                  style={{
                    color: "#6b7280",
                  }}
                >
                  Explica el problema, la
                  solución y cómo utilizarán
                  inteligencia artificial.
                </p>
              </div>

              <span
                style={{
                  height: "fit-content",
                  borderRadius: 999,
                  padding: "8px 12px",
                  fontSize: 12,
                  fontWeight: 700,
                  background:
                    STATUS_DATA[
                      stage2.status
                    ].background,
                  color:
                    STATUS_DATA[
                      stage2.status
                    ].color,
                }}
              >
                {
                  STATUS_DATA[
                    stage2.status
                  ].icon
                }{" "}
                {
                  STATUS_DATA[
                    stage2.status
                  ].label
                }
              </span>
            </div>

            {stage2.status === "locked" ? (
              <div
                style={{
                  padding: 18,
                  borderRadius: 15,
                  background: "#f3f4f6",
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <Lock />

                <div>
                  <strong>
                    Etapa bloqueada
                  </strong>

                  <small
                    style={{
                      display: "block",
                      marginTop: 4,
                      color: "#6b7280",
                    }}
                  >
                    Primero debe aprobarse
                    la Etapa 1.
                  </small>
                </div>
              </div>
            ) : (
              <>
                {stage2.teacher_comment && (
                  <div
                    style={{
                      padding: 15,
                      borderRadius: 14,
                      marginBottom: 20,
                      background:
                        stage2.status ===
                        "correction_required"
                          ? "#fff1f2"
                          : "#f3f4f6",
                    }}
                  >
                    <strong>
                      👨‍🏫 Comentario del profesor
                    </strong>

                    <p>
                      {stage2.teacher_comment}
                    </p>
                  </div>
                )}

                <form
                  onSubmit={(
                    event: FormEvent<HTMLFormElement>
                  ) => {
                    event.preventDefault();
                    saveCanvas(false);
                  }}
                  style={{
                    display: "grid",
                    gap: 20,
                  }}
                >
                  <TextAreaField
                    label="1. Problema"
                    value={problem}
                    onChange={setProblem}
                    disabled={
                      !stage2Editable
                    }
                    placeholder="¿Qué problema real quieren solucionar?"
                  />

                  <TextAreaField
                    label="2. Beneficiarios"
                    value={beneficiaries}
                    onChange={
                      setBeneficiaries
                    }
                    disabled={
                      !stage2Editable
                    }
                    placeholder="¿Quiénes se beneficiarán de la solución?"
                  />

                  <TextAreaField
                    label="3. Solución propuesta"
                    value={solution}
                    onChange={setSolution}
                    disabled={
                      !stage2Editable
                    }
                    placeholder="¿Qué hará el proyecto para resolver el problema?"
                  />

                  <TextAreaField
                    label="4. Objetivo del proyecto"
                    value={objective}
                    onChange={setObjective}
                    disabled={
                      !stage2Editable
                    }
                    placeholder="¿Cuál es el objetivo principal?"
                  />

                  <TextAreaField
                    label="5. Uso de Inteligencia Artificial"
                    value={aiUse}
                    onChange={setAiUse}
                    disabled={
                      !stage2Editable
                    }
                    placeholder="¿Dónde estará la IA y qué función realizará?"
                  />

                  <TextAreaField
                    label="6. Limitaciones"
                    value={limitations}
                    onChange={
                      setLimitations
                    }
                    disabled={
                      !stage2Editable
                    }
                    placeholder="¿Qué no podrá hacer el proyecto o cuáles son sus límites?"
                  />

                  <TextAreaField
                    label="7. Tecnologías"
                    value={technologies}
                    onChange={
                      setTechnologies
                    }
                    disabled={
                      !stage2Editable
                    }
                    placeholder="Ej. Python, Teachable Machine, HTML, Arduino, Google Drive..."
                  />

                  <div>
                    <strong
                      style={{
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      8. Esquema del proyecto
                    </strong>

                    <div
                      style={{
                        border:
                          "1px dashed #c7c9d4",
                        borderRadius: 17,
                        padding: 18,
                      }}
                    >
                      {schemePath && (
                        <div
                          style={{
                            background:
                              "#ecfdf5",
                            color: "#047857",
                            padding: 12,
                            borderRadius: 12,
                            marginBottom: 12,
                          }}
                        >
                          ✅ Esquema cargado

                          {schemeUrl && (
                            <>
                              {" · "}

                              <a
                                href={schemeUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color:
                                    "#4338ca",
                                  fontWeight: 700,
                                }}
                              >
                                Ver archivo
                              </a>
                            </>
                          )}
                        </div>
                      )}

                      <label
                        style={{
                          cursor:
                            stage2Editable
                              ? "pointer"
                              : "not-allowed",
                        }}
                      >
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          disabled={
                            !stage2Editable ||
                            uploading
                          }
                          onChange={
                            uploadScheme
                          }
                        />

                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: 8,
                            border:
                              "1px solid #d1d5db",
                            borderRadius: 10,
                            padding:
                              "10px 14px",
                          }}
                        >
                          <Upload size={17} />

                          {uploading
                            ? "Subiendo..."
                            : schemePath
                            ? "Cambiar esquema"
                            : "Subir esquema"}
                        </span>
                      </label>

                      <small
                        style={{
                          display: "block",
                          color: "#6b7280",
                          marginTop: 8,
                        }}
                      >
                        PNG, JPG, WebP o PDF ·
                        máximo 10 MB
                      </small>
                    </div>
                  </div>

                  <TextAreaField
                    label="Comentario para el profesor"
                    value={stage2Comment}
                    onChange={
                      setStage2Comment
                    }
                    disabled={
                      !stage2Editable
                    }
                    placeholder="Comentario opcional sobre el Canvas."
                    rows={3}
                  />

                  {stage2Editable ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent:
                          "flex-end",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={
                          saving ||
                          uploading
                        }
                      >
                        <FileText size={17} />
                        Guardar borrador
                      </Button>

                      <Button
                        type="button"
                        disabled={
                          saving ||
                          uploading
                        }
                        onClick={() =>
                          saveCanvas(true)
                        }
                      >
                        <Send size={17} />
                        Enviar Canvas al profesor
                      </Button>
                    </div>
                  ) : (
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 14,
                        padding: 15,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      {stage2.status ===
                      "approved" ? (
                        <CheckCircle2
                          color="#059669"
                        />
                      ) : (
                        <Lock
                          color="#6b7280"
                        />
                      )}

                      <div>
                        <strong>
                          {stage2.status ===
                          "approved"
                            ? `Canvas aprobado · ${numeric(
                                stage2.score
                              )}/4`
                            : "Canvas bloqueado"}
                        </strong>

                        <small
                          style={{
                            display: "block",
                            marginTop: 4,
                            color: "#6b7280",
                          }}
                        >
                          {stage2.status ===
                          "submitted"
                            ? "El profesor está revisando tu Canvas."
                            : stage2.status ===
                              "approved"
                            ? "La Etapa 3 ya está desbloqueada."
                            : "Espera las indicaciones del profesor."}
                        </small>
                      </div>
                    </div>
                  )}
                </form>
              </>
            )}
          </section>
        )}

        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: 26,
          }}
        >
          <h2>Próximas etapas</h2>

          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >
            {stages
              .filter(
                (stage) =>
                  stage.id >= 3
              )
              .map((stage) => {
                const work =
                  works.find(
                    (item) =>
                      item.stage_id ===
                      stage.id
                  );

                const status =
                  work?.status ?? "locked";

                const info =
                  STATUS_DATA[status];

                return (
                  <article
                    key={stage.id}
                    style={{
                      border:
                        "1px solid #e5e7eb",
                      borderRadius: 17,
                      padding: 17,
                      display: "flex",
                      gap: 14,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        display: "grid",
                        placeItems: "center",
                        background:
                          info.background,
                      }}
                    >
                      {status ===
                      "locked" ? (
                        <Lock size={19} />
                      ) : status ===
                        "correction_required" ? (
                        <RefreshCw
                          size={19}
                        />
                      ) : (
                        <ChevronRight
                          size={19}
                        />
                      )}
                    </div>

                    <div
                      style={{
                        flex: 1,
                      }}
                    >
                      <strong>
                        Etapa {stage.id} ·{" "}
                        {stage.name}
                      </strong>

                      <p
                        style={{
                          margin:
                            "4px 0 0",
                          color: "#6b7280",
                          fontSize: 13,
                        }}
                      >
                        {stage.description}
                      </p>
                    </div>

                    <span
                      style={{
                        borderRadius: 999,
                        padding: "6px 10px",
                        fontSize: 11,
                        fontWeight: 700,
                        background:
                          info.background,
                        color: info.color,
                      }}
                    >
                      {info.icon}{" "}
                      {info.label}
                    </span>
                  </article>
                );
              })}
          </div>
        </section>

        {group.completion_approved && (
          <section
            style={{
              marginTop: 24,
              borderRadius: 26,
              padding: 30,
              textAlign: "center",
              background:
                "linear-gradient(135deg,#fff7d6,#f4e7ff)",
            }}
          >
            <div
              style={{
                fontSize: 54,
              }}
            >
              🏆
            </div>

            <h2>
              ¡Proyecto completado!
            </h2>

            <p>
              Alcanzaron el 100 % y el
              profesor aprobó oficialmente
              la culminación.
            </p>

            {group.diploma_code && (
              <small>
                Código de diploma:{" "}
                <strong>
                  {group.diploma_code}
                </strong>
              </small>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
