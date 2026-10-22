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
  Database,
  FileText,
  ImagePlus,
  Link as LinkIcon,
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

function numeric(value: number | string | null | undefined) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function editable(work: StageWork | null) {
  return (
    work?.status === "editable" ||
    work?.status === "correction_required"
  );
}

function TextField({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
  type?: string;
}) {
  return (
    <label style={{ display: "grid", gap: 7 }}>
      <strong>{label}</strong>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          minHeight: 46,
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: "0 14px",
          fontSize: 15,
          background: disabled ? "#f3f4f6" : "white",
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
    <label style={{ display: "grid", gap: 7 }}>
      <strong>{label}</strong>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        style={{
          border: "1px solid #d1d5db",
          borderRadius: 12,
          padding: 14,
          fontSize: 15,
          resize: "vertical",
          background: disabled ? "#f3f4f6" : "white",
        }}
      />
    </label>
  );
}

function StatusPill({ status }: { status: StageStatus }) {
  const info = STATUS_DATA[status];
  return (
    <span
      style={{
        height: "fit-content",
        borderRadius: 999,
        padding: "8px 12px",
        fontSize: 12,
        fontWeight: 700,
        background: info.background,
        color: info.color,
      }}
    >
      {info.icon} {info.label}
    </span>
  );
}

function LockedNotice({ previous }: { previous: number }) {
  return (
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
        <strong>Etapa bloqueada</strong>
        <small
          style={{
            display: "block",
            marginTop: 4,
            color: "#6b7280",
          }}
        >
          Primero debe aprobarse la Etapa {previous}.
        </small>
      </div>
    </div>
  );
}

function TeacherComment({ work }: { work: StageWork }) {
  if (!work.teacher_comment) return null;

  return (
    <div
      style={{
        padding: 15,
        borderRadius: 14,
        marginBottom: 20,
        background:
          work.status === "correction_required"
            ? "#fff1f2"
            : "#f3f4f6",
      }}
    >
      <strong>👨‍🏫 Comentario del profesor</strong>
      <p style={{ marginBottom: 0 }}>{work.teacher_comment}</p>
    </div>
  );
}

function FrozenNotice({
  work,
  approvedMessage,
}: {
  work: StageWork;
  approvedMessage: string;
}) {
  return (
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
      {work.status === "approved" ? (
        <CheckCircle2 color="#059669" />
      ) : (
        <Lock color="#6b7280" />
      )}
      <div>
        <strong>
          {work.status === "approved"
            ? `${approvedMessage} · ${numeric(work.score)}/4`
            : "Entrega bloqueada"}
        </strong>
        <small
          style={{
            display: "block",
            marginTop: 4,
            color: "#6b7280",
          }}
        >
          {work.status === "submitted"
            ? "El profesor está revisando esta entrega."
            : work.status === "approved"
            ? "La siguiente etapa está habilitada."
            : "Espera las indicaciones del profesor."}
        </small>
      </div>
    </div>
  );
}

export default function StudentPage() {
  const [authReady, setAuthReady] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [savingStage, setSavingStage] = useState<number | null>(null);
  const [uploadingStage, setUploadingStage] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [displayName, setDisplayName] = useState("Estudiante");
  const [group, setGroup] = useState<GroupData | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [works, setWorks] = useState<StageWork[]>([]);

  // Etapa 1
  const [projectName, setProjectName] = useState("");
  const [members, setMembers] = useState("");
  const [logoPath, setLogoPath] = useState("");
  const [logoPreview, setLogoPreview] = useState("");
  const [stage1Comment, setStage1Comment] = useState("");

  // Etapa 2
  const [problem, setProblem] = useState("");
  const [beneficiaries, setBeneficiaries] = useState("");
  const [solution, setSolution] = useState("");
  const [objective, setObjective] = useState("");
  const [aiUse, setAiUse] = useState("");
  const [limitations, setLimitations] = useState("");
  const [technologies, setTechnologies] = useState("");
  const [schemePath, setSchemePath] = useState("");
  const [schemeUrl, setSchemeUrl] = useState("");
  const [stage2Comment, setStage2Comment] = useState("");

  // Etapa 3
  const [resourceType, setResourceType] = useState("dataset");
  const [dataDescription, setDataDescription] = useState("");
  const [sourceOrigin, setSourceOrigin] = useState("");
  const [organizationClasses, setOrganizationClasses] = useState("");
  const [dataQuantity, setDataQuantity] = useState("");
  const [collectionMethod, setCollectionMethod] = useState("");
  const [dataPreparation, setDataPreparation] = useState("");
  const [dataLimitations, setDataLimitations] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [stage3Comment, setStage3Comment] = useState("");

  // Etapa 4
  const [prototypeType, setPrototypeType] = useState("web_app");
  const [prototypeStatus, setPrototypeStatus] = useState("");
  const [implementedFeatures, setImplementedFeatures] = useState("");
  const [prototypeAiUse, setPrototypeAiUse] = useState("");
  const [testingSteps, setTestingSteps] = useState("");
  const [pendingWork, setPendingWork] = useState("");
  const [prototypeUrl, setPrototypeUrl] = useState("");
  const [prototypeEvidencePath, setPrototypeEvidencePath] = useState("");
  const [prototypeEvidenceUrl, setPrototypeEvidenceUrl] = useState("");
  const [stage4Comment, setStage4Comment] = useState("");

  const stage1 = useMemo(
    () => works.find((work) => work.stage_id === 1) ?? null,
    [works]
  );
  const stage2 = useMemo(
    () => works.find((work) => work.stage_id === 2) ?? null,
    [works]
  );
  const stage3 = useMemo(
    () => works.find((work) => work.stage_id === 3) ?? null,
    [works]
  );
  const stage4 = useMemo(
    () => works.find((work) => work.stage_id === 4) ?? null,
    [works]
  );

  const grade = useMemo(
    () =>
      works
        .filter((work) => work.status === "approved")
        .reduce((total, work) => total + numeric(work.score), 0),
    [works]
  );

  const progress = Math.round(grade * 5 * 10) / 10;

  useEffect(() => {
    let mounted = true;

    async function verifyStudent() {
      try {
        const supabase = await getSupabase();
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          window.location.replace("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("display_name, role, group_id, active")
          .eq("id", user.id)
          .single();

        if (error || !profile || !profile.active) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (profile.role === "admin") {
          window.location.replace("/");
          return;
        }

        if (profile.role !== "student" || !profile.group_id) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (mounted) {
          setDisplayName(profile.display_name || "Estudiante");
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

  async function createFileUrl(path: string) {
    if (!path) return "";

    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.storage
        .from("project-assets")
        .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) return "";
      return data.signedUrl;
    } catch {
      return "";
    }
  }

  async function loadStudentData(showSpinner = false) {
    if (showSpinner) setInitialLoading(true);

    try {
      const supabase = await getSupabase();
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.replace("/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("group_id")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.group_id) {
        throw new Error(
          "No encontramos un grupo asignado a esta cuenta."
        );
      }

      const groupId = Number(profile.group_id);

      const [groupResult, stagesResult, workResult] = await Promise.all([
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
          .order("id", { ascending: true }),

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
          .order("stage_id", { ascending: true }),
      ]);

      if (groupResult.error) throw groupResult.error;
      if (stagesResult.error) throw stagesResult.error;
      if (workResult.error) throw workResult.error;

      if (!groupResult.data) {
        throw new Error(
          "Tu grupo está deshabilitado o todavía no está disponible."
        );
      }

      const loadedGroup = groupResult.data as GroupData;
      const loadedWorks = (workResult.data ?? []) as StageWork[];

      setGroup(loadedGroup);
      setStages((stagesResult.data ?? []) as Stage[]);
      setWorks(loadedWorks);

      const identity = loadedWorks.find((work) => work.stage_id === 1);
      const identityContent =
        identity?.content && typeof identity.content === "object"
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
        String(identityContent.members ?? loadedGroup.members ?? "")
      );

      const currentLogo = String(
        identityContent.logo_path ?? loadedGroup.logo_path ?? ""
      );

      setLogoPath(currentLogo);
      setStage1Comment(identity?.student_comment ?? "");
      setLogoPreview(currentLogo ? await createFileUrl(currentLogo) : "");

      const canvas = loadedWorks.find((work) => work.stage_id === 2);
      const canvasContent =
        canvas?.content && typeof canvas.content === "object"
          ? canvas.content
          : {};

      setProblem(String(canvasContent.problem ?? ""));
      setBeneficiaries(String(canvasContent.beneficiaries ?? ""));
      setSolution(String(canvasContent.solution ?? ""));
      setObjective(String(canvasContent.objective ?? ""));
      setAiUse(String(canvasContent.ai_use ?? ""));
      setLimitations(String(canvasContent.limitations ?? ""));
      setTechnologies(String(canvasContent.technologies ?? ""));

      const currentScheme = String(canvasContent.scheme_path ?? "");
      setSchemePath(currentScheme);
      setStage2Comment(canvas?.student_comment ?? "");
      setSchemeUrl(
        currentScheme ? await createFileUrl(currentScheme) : ""
      );

      const dataStage = loadedWorks.find((work) => work.stage_id === 3);
      const dataContent =
        dataStage?.content && typeof dataStage.content === "object"
          ? dataStage.content
          : {};

      setResourceType(String(dataContent.resource_type ?? "dataset"));
      setDataDescription(String(dataContent.description ?? ""));
      setSourceOrigin(String(dataContent.source_origin ?? ""));
      setOrganizationClasses(
        String(dataContent.organization_classes ?? "")
      );
      setDataQuantity(String(dataContent.quantity_size ?? ""));
      setCollectionMethod(
        String(dataContent.collection_method ?? "")
      );
      setDataPreparation(String(dataContent.preparation ?? ""));
      setDataLimitations(String(dataContent.limitations ?? ""));
      setResourceUrl(String(dataContent.resource_url ?? ""));
      setStage3Comment(dataStage?.student_comment ?? "");

      const prototypeStage = loadedWorks.find(
        (work) => work.stage_id === 4
      );
      const prototypeContent =
        prototypeStage?.content &&
        typeof prototypeStage.content === "object"
          ? prototypeStage.content
          : {};

      setPrototypeType(
        String(prototypeContent.prototype_type ?? "web_app")
      );
      setPrototypeStatus(
        String(prototypeContent.current_status ?? "")
      );
      setImplementedFeatures(
        String(prototypeContent.implemented_features ?? "")
      );
      setPrototypeAiUse(
        String(prototypeContent.ai_operation ?? "")
      );
      setTestingSteps(
        String(prototypeContent.testing_steps ?? "")
      );
      setPendingWork(
        String(prototypeContent.pending_work ?? "")
      );
      setPrototypeUrl(
        String(prototypeContent.prototype_url ?? "")
      );

      const evidencePath = String(
        prototypeContent.evidence_path ?? ""
      );
      setPrototypeEvidencePath(evidencePath);
      setPrototypeEvidenceUrl(
        evidencePath ? await createFileUrl(evidencePath) : ""
      );
      setStage4Comment(prototypeStage?.student_comment ?? "");
    } catch (error) {
      console.error("Error cargando grupo:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo cargar el grupo."
      );
    } finally {
      if (showSpinner) setInitialLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadStudentData(true);
  }, [authReady]);

  async function uploadStageFile(file: File, stageId: number) {
    if (!group) throw new Error("No hay grupo disponible.");

    const extension =
      file.name.split(".").pop()?.toLowerCase() || "file";
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const path = `${group.id}/${stageId}/${fileName}`;

    const supabase = await getSupabase();
    const { error } = await supabase.storage
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
    const file = event.target.files?.[0];
    if (!file || !group) return;

    setMessage("");

    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setMessage("El logo debe ser PNG, JPG o WebP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("El logo no puede superar 5 MB.");
      event.target.value = "";
      return;
    }

    setUploadingStage(1);

    try {
      const path = await uploadStageFile(file, 1);
      setLogoPath(path);
      setLogoPreview(URL.createObjectURL(file));
      setMessage("Logo cargado correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir el logo."
      );
    } finally {
      setUploadingStage(null);
      event.target.value = "";
    }
  }

  async function uploadScheme(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file || !group) return;

    setMessage("");

    const allowed = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];

    if (!allowed.includes(file.type)) {
      setMessage("El esquema debe ser PNG, JPG, WebP o PDF.");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("El archivo no puede superar 10 MB.");
      event.target.value = "";
      return;
    }

    setUploadingStage(2);

    try {
      const path = await uploadStageFile(file, 2);
      setSchemePath(path);

      if (file.type === "application/pdf") {
        setSchemeUrl(await createFileUrl(path));
      } else {
        setSchemeUrl(URL.createObjectURL(file));
      }

      setMessage("Esquema cargado correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir el esquema."
      );
    } finally {
      setUploadingStage(null);
      event.target.value = "";
    }
  }

  async function uploadPrototypeEvidence(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
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
        "La evidencia debe ser PNG, JPG, WebP o PDF."
      );
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage(
        "La evidencia no puede superar 10 MB."
      );
      event.target.value = "";
      return;
    }

    setUploadingStage(4);

    try {
      const path = await uploadStageFile(file, 4);
      setPrototypeEvidencePath(path);

      if (file.type === "application/pdf") {
        setPrototypeEvidenceUrl(await createFileUrl(path));
      } else {
        setPrototypeEvidenceUrl(URL.createObjectURL(file));
      }

      setMessage("Evidencia del prototipo cargada correctamente.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "No se pudo subir la evidencia."
      );
    } finally {
      setUploadingStage(null);
      event.target.value = "";
    }
  }

  async function updateStage(
    stageId: number,
    content: Record<string, any>,
    studentComment: string,
    submit: boolean
  ) {
    if (!group) return;

    setSavingStage(stageId);
    setMessage("");

    try {
      const supabase = await getSupabase();

      const payload: Record<string, any> = {
        content,
        student_comment: studentComment.trim(),
      };

      if (submit) payload.status = "submitted";

      const { error } = await supabase
        .from("group_stage_work")
        .update(payload)
        .eq("group_id", group.id)
        .eq("stage_id", stageId);

      if (error) throw error;

      setMessage(
        submit
          ? `Etapa ${stageId} enviada al profesor. Quedó bloqueada para revisión.`
          : `Borrador de la Etapa ${stageId} guardado correctamente.`
      );

      // Refresca datos sin volver a mostrar la pantalla completa de carga.
      await loadStudentData(false);
    } catch (error) {
      console.error(error);
      setMessage(
        error instanceof Error
          ? error.message
          : `No se pudo guardar la Etapa ${stageId}.`
      );
    } finally {
      setSavingStage(null);
    }
  }

  async function saveIdentity(submit: boolean) {
    if (!stage1 || !editable(stage1)) {
      setMessage("La Etapa 1 está bloqueada.");
      return;
    }

    const cleanName = projectName.trim();
    const cleanMembers = members.trim();

    if (submit && !cleanName) {
      setMessage("Debes escribir el nombre del proyecto.");
      return;
    }

    if (submit && !cleanMembers) {
      setMessage("Debes indicar los integrantes.");
      return;
    }

    if (submit && !logoPath) {
      setMessage("Debes subir el logo antes de enviar.");
      return;
    }

    if (
      submit &&
      !window.confirm(
        "¿Enviar la Etapa 1 al profesor? Quedará bloqueada hasta su revisión."
      )
    ) {
      return;
    }

    await updateStage(
      1,
      {
        project_name: cleanName,
        members: cleanMembers,
        logo_path: logoPath,
      },
      stage1Comment,
      submit
    );
  }

  async function saveCanvas(submit: boolean) {
    if (!stage2 || !editable(stage2)) {
      setMessage("La Etapa 2 está bloqueada.");
      return;
    }

    const fields = [
      ["Problema", problem],
      ["Beneficiarios", beneficiaries],
      ["Solución", solution],
      ["Objetivo", objective],
      ["Uso de IA", aiUse],
      ["Limitaciones", limitations],
      ["Tecnologías", technologies],
    ];

    if (submit) {
      const missing = fields.find(([, value]) => !value.trim());
      if (missing) {
        setMessage(`Falta completar: ${missing[0]}.`);
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
          "¿Enviar el Canvas completo al profesor? Quedará bloqueado mientras se revisa."
        )
      ) {
        return;
      }
    }

    await updateStage(
      2,
      {
        problem: problem.trim(),
        beneficiaries: beneficiaries.trim(),
        solution: solution.trim(),
        objective: objective.trim(),
        ai_use: aiUse.trim(),
        limitations: limitations.trim(),
        technologies: technologies.trim(),
        scheme_path: schemePath,
      },
      stage2Comment,
      submit
    );
  }

  async function saveStage3(submit: boolean) {
    if (!stage3 || !editable(stage3)) {
      setMessage("La Etapa 3 está bloqueada.");
      return;
    }

    const fields = [
      ["Descripción de datos/contenido", dataDescription],
      ["Origen o fuente", sourceOrigin],
      ["Organización, clases o categorías", organizationClasses],
      ["Cantidad o tamaño", dataQuantity],
      ["Método de obtención", collectionMethod],
      ["Preparación o limpieza", dataPreparation],
      ["Limitaciones, sesgos o cuidados", dataLimitations],
    ];

    if (submit) {
      const missing = fields.find(([, value]) => !value.trim());

      if (missing) {
        setMessage(`Falta completar: ${missing[0]}.`);
        return;
      }

      try {
        const parsed = new URL(resourceUrl.trim());
        if (!["https:", "http:"].includes(parsed.protocol)) {
          throw new Error("invalid");
        }
      } catch {
        setMessage(
          "Coloca un enlace válido al dataset, carpeta de Drive o contenido."
        );
        return;
      }

      if (
        !window.confirm(
          "¿Enviar la Etapa 3 al profesor? Quedará bloqueada mientras se revisa."
        )
      ) {
        return;
      }
    }

    await updateStage(
      3,
      {
        resource_type: resourceType,
        description: dataDescription.trim(),
        source_origin: sourceOrigin.trim(),
        organization_classes: organizationClasses.trim(),
        quantity_size: dataQuantity.trim(),
        collection_method: collectionMethod.trim(),
        preparation: dataPreparation.trim(),
        limitations: dataLimitations.trim(),
        resource_url: resourceUrl.trim(),
      },
      stage3Comment,
      submit
    );
  }

  async function saveStage4(submit: boolean) {
    if (!stage4 || !editable(stage4)) {
      setMessage("La Etapa 4 está bloqueada.");
      return;
    }

    const fields = [
      ["Estado actual del prototipo", prototypeStatus],
      ["Funciones implementadas", implementedFeatures],
      ["Funcionamiento de la IA", prototypeAiUse],
      ["Pasos para probarlo", testingSteps],
      ["Trabajo pendiente", pendingWork],
    ];

    if (submit) {
      const missing = fields.find(([, value]) => !value.trim());

      if (missing) {
        setMessage(`Falta completar: ${missing[0]}.`);
        return;
      }

      const cleanPrototypeUrl = prototypeUrl.trim();

      if (cleanPrototypeUrl) {
        try {
          const parsed = new URL(cleanPrototypeUrl);
          if (!["https:", "http:"].includes(parsed.protocol)) {
            throw new Error("invalid");
          }
        } catch {
          setMessage(
            "El enlace del prototipo no es válido."
          );
          return;
        }
      }

      if (!cleanPrototypeUrl && !prototypeEvidencePath) {
        setMessage(
          "Para enviar la Etapa 4 debes colocar un enlace al prototipo o subir una evidencia."
        );
        return;
      }

      if (
        !window.confirm(
          "¿Enviar la Etapa 4 al profesor? Quedará bloqueada mientras se revisa."
        )
      ) {
        return;
      }
    }

    await updateStage(
      4,
      {
        prototype_type: prototypeType,
        current_status: prototypeStatus.trim(),
        implemented_features: implementedFeatures.trim(),
        ai_operation: prototypeAiUse.trim(),
        testing_steps: testingSteps.trim(),
        pending_work: pendingWork.trim(),
        prototype_url: prototypeUrl.trim(),
        evidence_path: prototypeEvidencePath,
      },
      stage4Comment,
      submit
    );
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  if (!authReady || initialLoading) {
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
        <div style={{ textAlign: "center" }}>
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
          padding: 24,
        }}
      >
        <div>{message || "No hay grupo disponible."}</div>
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
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          padding: "12px clamp(18px,5vw,70px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
            <strong style={{ display: "block", fontSize: 17 }}>
              Atenas IA Lab
            </strong>
            <small style={{ color: "#6b7280" }}>
              Inteligencia Artificial II
            </small>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <UserRound size={19} />
          <span>{displayName}</span>
          <Button variant="outline" onClick={logout}>
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
            <small style={{ opacity: 0.85, fontWeight: 700 }}>
              GRUPO {group.id}
            </small>
            <h1 style={{ margin: "10px 0 8px", fontSize: 30 }}>
              {group.project_name ||
                projectName ||
                "Tu proyecto de IA"}
            </h1>
            <p style={{ margin: 0 }}>
              {group.members || members || "Integrantes por definir"}
            </p>
          </article>

          <article
            style={{
              background: "white",
              borderRadius: 26,
              padding: 28,
            }}
          >
            <small style={{ color: "#6b7280" }}>NOTA ACTUAL</small>
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
            <p style={{ color: "#6b7280" }}>
              Progreso general:{" "}
              <strong style={{ color: "#111827" }}>
                {progress}%
              </strong>
            </p>
          </article>
        </section>

        {message && (
          <button
            onClick={() => setMessage("")}
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
          <small style={{ color: "#6c56d9", fontWeight: 800 }}>
            CAMINO DEL PROYECTO
          </small>
          <h2>Camino recorrido</h2>
          <p style={{ color: "#6b7280" }}>
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
                works.find((item) => item.stage_id === stage.id) ??
                null;
              const status: StageStatus = work?.status ?? "locked";
              const info = STATUS_DATA[status];

              return (
                <article
                  key={stage.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 18,
                    padding: 16,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{info.icon}</div>
                  <small>ETAPA {stage.id}</small>
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
                      display: "inline-block",
                      borderRadius: 999,
                      padding: "5px 9px",
                      fontSize: 11,
                      fontWeight: 700,
                      background: info.background,
                      color: info.color,
                    }}
                  >
                    {info.label}
                  </span>
                  <p style={{ fontSize: 12, color: "#6b7280" }}>
                    {numeric(work?.score)}/4 puntos
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
                justifyContent: "space-between",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div>
                <small style={{ color: "#6c56d9", fontWeight: 800 }}>
                  ETAPA 1 · 4 PUNTOS
                </small>
                <h2>Identidad del proyecto</h2>
                <p style={{ color: "#6b7280" }}>
                  Nombre, integrantes y logo oficial.
                </p>
              </div>
              <StatusPill status={stage1.status} />
            </div>

            <TeacherComment work={stage1} />

            <form
              onSubmit={(event: FormEvent<HTMLFormElement>) => {
                event.preventDefault();
                saveIdentity(false);
              }}
              style={{ display: "grid", gap: 18 }}
            >
              <TextField
                label="Nombre del proyecto"
                value={projectName}
                onChange={setProjectName}
                disabled={!editable(stage1)}
                placeholder="Ej. PetID AI"
              />

              <TextField
                label="Integrantes"
                value={members}
                onChange={setMembers}
                disabled={!editable(stage1)}
                placeholder="Nombres de los integrantes"
              />

              <div>
                <strong>Logo del proyecto</strong>
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
                      cursor: editable(stage1)
                        ? "pointer"
                        : "not-allowed",
                    }}
                  >
                    <input
                      hidden
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      disabled={
                        !editable(stage1) || uploadingStage === 1
                      }
                      onChange={uploadLogo}
                    />
                    <span
                      style={{
                        display: "inline-flex",
                        gap: 7,
                        alignItems: "center",
                        border: "1px solid #d1d5db",
                        borderRadius: 10,
                        padding: "10px 13px",
                      }}
                    >
                      <Upload size={17} />
                      {uploadingStage === 1
                        ? "Subiendo..."
                        : "Subir logo"}
                    </span>
                  </label>
                </div>
              </div>

              <TextAreaField
                label="Comentario para el profesor"
                value={stage1Comment}
                onChange={setStage1Comment}
                disabled={!editable(stage1)}
                placeholder="Comentario opcional"
                rows={3}
              />

              {editable(stage1) ? (
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    justifyContent: "flex-end",
                    flexWrap: "wrap",
                  }}
                >
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={
                      savingStage === 1 || uploadingStage === 1
                    }
                  >
                    <FileText size={17} />
                    Guardar borrador
                  </Button>
                  <Button
                    type="button"
                    disabled={
                      savingStage === 1 || uploadingStage === 1
                    }
                    onClick={() => saveIdentity(true)}
                  >
                    <Send size={17} />
                    Enviar al profesor
                  </Button>
                </div>
              ) : (
                <FrozenNotice
                  work={stage1}
                  approvedMessage="Etapa 1 aprobada"
                />
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
              opacity: stage2.status === "locked" ? 0.72 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div>
                <small style={{ color: "#2388d9", fontWeight: 800 }}>
                  ETAPA 2 · 4 PUNTOS
                </small>
                <h2>Canvas completo</h2>
                <p style={{ color: "#6b7280" }}>
                  Explica el problema, la solución y cómo utilizarán
                  inteligencia artificial.
                </p>
              </div>
              <StatusPill status={stage2.status} />
            </div>

            {stage2.status === "locked" ? (
              <LockedNotice previous={1} />
            ) : (
              <>
                <TeacherComment work={stage2} />

                <form
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    saveCanvas(false);
                  }}
                  style={{ display: "grid", gap: 20 }}
                >
                  <TextAreaField
                    label="1. Problema"
                    value={problem}
                    onChange={setProblem}
                    disabled={!editable(stage2)}
                    placeholder="¿Qué problema real quieren solucionar?"
                  />
                  <TextAreaField
                    label="2. Beneficiarios"
                    value={beneficiaries}
                    onChange={setBeneficiaries}
                    disabled={!editable(stage2)}
                    placeholder="¿Quiénes se beneficiarán de la solución?"
                  />
                  <TextAreaField
                    label="3. Solución propuesta"
                    value={solution}
                    onChange={setSolution}
                    disabled={!editable(stage2)}
                    placeholder="¿Qué hará el proyecto para resolver el problema?"
                  />
                  <TextAreaField
                    label="4. Objetivo del proyecto"
                    value={objective}
                    onChange={setObjective}
                    disabled={!editable(stage2)}
                    placeholder="¿Cuál es el objetivo principal?"
                  />
                  <TextAreaField
                    label="5. Uso de Inteligencia Artificial"
                    value={aiUse}
                    onChange={setAiUse}
                    disabled={!editable(stage2)}
                    placeholder="¿Dónde estará la IA y qué función realizará?"
                  />
                  <TextAreaField
                    label="6. Limitaciones"
                    value={limitations}
                    onChange={setLimitations}
                    disabled={!editable(stage2)}
                    placeholder="¿Qué no podrá hacer el proyecto o cuáles son sus límites?"
                  />
                  <TextAreaField
                    label="7. Tecnologías"
                    value={technologies}
                    onChange={setTechnologies}
                    disabled={!editable(stage2)}
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
                        border: "1px dashed #c7c9d4",
                        borderRadius: 17,
                        padding: 18,
                      }}
                    >
                      {schemePath && (
                        <div
                          style={{
                            background: "#ecfdf5",
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
                                  color: "#4338ca",
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
                          cursor: editable(stage2)
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          disabled={
                            !editable(stage2) || uploadingStage === 2
                          }
                          onChange={uploadScheme}
                        />
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            border: "1px solid #d1d5db",
                            borderRadius: 10,
                            padding: "10px 14px",
                          }}
                        >
                          <Upload size={17} />
                          {uploadingStage === 2
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
                        PNG, JPG, WebP o PDF · máximo 10 MB
                      </small>
                    </div>
                  </div>

                  <TextAreaField
                    label="Comentario para el profesor"
                    value={stage2Comment}
                    onChange={setStage2Comment}
                    disabled={!editable(stage2)}
                    placeholder="Comentario opcional sobre el Canvas."
                    rows={3}
                  />

                  {editable(stage2) ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={
                          savingStage === 2 || uploadingStage === 2
                        }
                      >
                        <FileText size={17} />
                        Guardar borrador
                      </Button>
                      <Button
                        type="button"
                        disabled={
                          savingStage === 2 || uploadingStage === 2
                        }
                        onClick={() => saveCanvas(true)}
                      >
                        <Send size={17} />
                        Enviar Canvas al profesor
                      </Button>
                    </div>
                  ) : (
                    <FrozenNotice
                      work={stage2}
                      approvedMessage="Canvas aprobado"
                    />
                  )}
                </form>
              </>
            )}
          </section>
        )}

        {stage3 && (
          <section
            style={{
              background: "white",
              borderRadius: 24,
              padding: 30,
              marginBottom: 24,
              opacity: stage3.status === "locked" ? 0.72 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div>
                <small style={{ color: "#159b7d", fontWeight: 800 }}>
                  ETAPA 3 · 4 PUNTOS
                </small>
                <h2>Datos / dataset / contenido</h2>
                <p style={{ color: "#6b7280" }}>
                  Describe los datos o contenidos usados por el proyecto.
                  Los datasets pesados se mantienen en Drive; aquí se
                  registra su enlace.
                </p>
              </div>
              <StatusPill status={stage3.status} />
            </div>

            {stage3.status === "locked" ? (
              <LockedNotice previous={2} />
            ) : (
              <>
                <TeacherComment work={stage3} />

                <form
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    saveStage3(false);
                  }}
                  style={{ display: "grid", gap: 20 }}
                >
                  <label style={{ display: "grid", gap: 7 }}>
                    <strong>1. Tipo de recurso</strong>
                    <select
                      value={resourceType}
                      disabled={!editable(stage3)}
                      onChange={(event) =>
                        setResourceType(event.target.value)
                      }
                      style={{
                        minHeight: 46,
                        border: "1px solid #d1d5db",
                        borderRadius: 12,
                        padding: "0 14px",
                        fontSize: 15,
                        background: editable(stage3)
                          ? "white"
                          : "#f3f4f6",
                      }}
                    >
                      <option value="dataset">Dataset</option>
                      <option value="contenido">Contenido</option>
                      <option value="mixto">
                        Datos + contenido
                      </option>
                    </select>
                  </label>

                  <TextAreaField
                    label="2. Descripción de los datos o contenidos"
                    value={dataDescription}
                    onChange={setDataDescription}
                    disabled={!editable(stage3)}
                    placeholder="¿Qué contiene el dataset o material y para qué se utilizará?"
                  />

                  <TextAreaField
                    label="3. Origen o fuente"
                    value={sourceOrigin}
                    onChange={setSourceOrigin}
                    disabled={!editable(stage3)}
                    placeholder="¿Los datos fueron creados por el grupo, descargados, recolectados, fotografiados, generados, etc.?"
                  />

                  <TextAreaField
                    label="4. Organización, clases o categorías"
                    value={organizationClasses}
                    onChange={setOrganizationClasses}
                    disabled={!editable(stage3)}
                    placeholder="Ej. gato/perro, reciclable/no reciclable, carpetas, etiquetas..."
                  />

                  <TextField
                    label="5. Cantidad o tamaño aproximado"
                    value={dataQuantity}
                    onChange={setDataQuantity}
                    disabled={!editable(stage3)}
                    placeholder="Ej. 850 imágenes, 2.000 registros, 30 textos..."
                  />

                  <TextAreaField
                    label="6. Método de obtención"
                    value={collectionMethod}
                    onChange={setCollectionMethod}
                    disabled={!editable(stage3)}
                    placeholder="¿Cómo obtuvieron o construyeron estos datos/contenidos?"
                  />

                  <TextAreaField
                    label="7. Preparación, limpieza o selección"
                    value={dataPreparation}
                    onChange={setDataPreparation}
                    disabled={!editable(stage3)}
                    placeholder="¿Qué eliminaron, corrigieron, organizaron, etiquetaron o transformaron?"
                  />

                  <TextAreaField
                    label="8. Limitaciones, sesgos y cuidados"
                    value={dataLimitations}
                    onChange={setDataLimitations}
                    disabled={!editable(stage3)}
                    placeholder="¿Hay privacidad, sesgo, clases desbalanceadas o ejemplos insuficientes?"
                  />

                  <TextField
                    label="9. Enlace al dataset, carpeta o contenido"
                    value={resourceUrl}
                    onChange={setResourceUrl}
                    disabled={!editable(stage3)}
                    type="url"
                    placeholder="https://drive.google.com/... o enlace equivalente"
                  />

                  {resourceUrl && (
                    <a
                      href={resourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#4338ca",
                        fontWeight: 700,
                        width: "fit-content",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <LinkIcon size={16} />
                      Abrir recurso
                    </a>
                  )}

                  <TextAreaField
                    label="Comentario para el profesor"
                    value={stage3Comment}
                    onChange={setStage3Comment}
                    disabled={!editable(stage3)}
                    placeholder="Comentario opcional sobre los datos o contenidos."
                    rows={3}
                  />

                  {editable(stage3) ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={savingStage === 3}
                      >
                        <Database size={17} />
                        Guardar borrador
                      </Button>

                      <Button
                        type="button"
                        disabled={savingStage === 3}
                        onClick={() => saveStage3(true)}
                      >
                        <Send size={17} />
                        Enviar Etapa 3 al profesor
                      </Button>
                    </div>
                  ) : (
                    <FrozenNotice
                      work={stage3}
                      approvedMessage="Etapa 3 aprobada"
                    />
                  )}
                </form>
              </>
            )}
          </section>
        )}

        {stage4 && (
          <section
            style={{
              background: "white",
              borderRadius: 24,
              padding: 30,
              marginBottom: 24,
              opacity: stage4.status === "locked" ? 0.72 : 1,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 15,
                flexWrap: "wrap",
                marginBottom: 24,
              }}
            >
              <div>
                <small style={{ color: "#f39a32", fontWeight: 800 }}>
                  ETAPA 4 · 4 PUNTOS
                </small>
                <h2>Prototipo funcional</h2>
                <p style={{ color: "#6b7280" }}>
                  Demuestra qué ya funciona, cómo interviene la IA y
                  cómo puede probarse el prototipo.
                </p>
              </div>
              <StatusPill status={stage4.status} />
            </div>

            {stage4.status === "locked" ? (
              <LockedNotice previous={3} />
            ) : (
              <>
                <TeacherComment work={stage4} />

                <form
                  onSubmit={(event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    saveStage4(false);
                  }}
                  style={{ display: "grid", gap: 20 }}
                >
                  <label style={{ display: "grid", gap: 7 }}>
                    <strong>1. Tipo de prototipo</strong>
                    <select
                      value={prototypeType}
                      disabled={!editable(stage4)}
                      onChange={(event) =>
                        setPrototypeType(event.target.value)
                      }
                      style={{
                        minHeight: 46,
                        border: "1px solid #d1d5db",
                        borderRadius: 12,
                        padding: "0 14px",
                        fontSize: 15,
                        background: editable(stage4)
                          ? "white"
                          : "#f3f4f6",
                      }}
                    >
                      <option value="web_app">Web / aplicación</option>
                      <option value="mobile">Aplicación móvil</option>
                      <option value="game">Videojuego</option>
                      <option value="physical">
                        Prototipo físico / electrónico
                      </option>
                      <option value="model">
                        Modelo de IA / demostración
                      </option>
                      <option value="other">Otro</option>
                    </select>
                  </label>

                  <TextAreaField
                    label="2. Estado actual del prototipo"
                    value={prototypeStatus}
                    onChange={setPrototypeStatus}
                    disabled={!editable(stage4)}
                    placeholder="¿Qué parte del proyecto ya funciona actualmente?"
                  />

                  <TextAreaField
                    label="3. Funciones implementadas"
                    value={implementedFeatures}
                    onChange={setImplementedFeatures}
                    disabled={!editable(stage4)}
                    placeholder="Enumera las funciones que ya están operativas."
                  />

                  <TextAreaField
                    label="4. ¿Cómo está funcionando la IA?"
                    value={prototypeAiUse}
                    onChange={setPrototypeAiUse}
                    disabled={!editable(stage4)}
                    placeholder="Explica qué recibe la IA, qué procesa y qué resultado entrega."
                  />

                  <TextAreaField
                    label="5. Pasos para probar el prototipo"
                    value={testingSteps}
                    onChange={setTestingSteps}
                    disabled={!editable(stage4)}
                    placeholder="Indica paso a paso qué debe hacer el profesor para probarlo."
                  />

                  <TextAreaField
                    label="6. ¿Qué falta por completar?"
                    value={pendingWork}
                    onChange={setPendingWork}
                    disabled={!editable(stage4)}
                    placeholder="Funciones pendientes, errores conocidos o mejoras antes de la versión final."
                  />

                  <TextField
                    label="7. Enlace al prototipo o demostración"
                    value={prototypeUrl}
                    onChange={setPrototypeUrl}
                    disabled={!editable(stage4)}
                    type="url"
                    placeholder="https://... (opcional si subes evidencia)"
                  />

                  {prototypeUrl && (
                    <a
                      href={prototypeUrl}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: "#4338ca",
                        fontWeight: 700,
                        width: "fit-content",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <LinkIcon size={16} />
                      Abrir prototipo
                    </a>
                  )}

                  <div>
                    <strong
                      style={{
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      8. Evidencia del prototipo
                    </strong>

                    <div
                      style={{
                        border: "1px dashed #c7c9d4",
                        borderRadius: 17,
                        padding: 18,
                      }}
                    >
                      {prototypeEvidencePath && (
                        <div
                          style={{
                            background: "#ecfdf5",
                            color: "#047857",
                            padding: 12,
                            borderRadius: 12,
                            marginBottom: 12,
                          }}
                        >
                          ✅ Evidencia cargada
                          {prototypeEvidenceUrl && (
                            <>
                              {" · "}
                              <a
                                href={prototypeEvidenceUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "#4338ca",
                                  fontWeight: 700,
                                }}
                              >
                                Ver evidencia
                              </a>
                            </>
                          )}
                        </div>
                      )}

                      <label
                        style={{
                          cursor: editable(stage4)
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        <input
                          hidden
                          type="file"
                          accept="image/png,image/jpeg,image/webp,application/pdf"
                          disabled={
                            !editable(stage4) || uploadingStage === 4
                          }
                          onChange={uploadPrototypeEvidence}
                        />

                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            border: "1px solid #d1d5db",
                            borderRadius: 10,
                            padding: "10px 14px",
                          }}
                        >
                          <Upload size={17} />
                          {uploadingStage === 4
                            ? "Subiendo..."
                            : prototypeEvidencePath
                            ? "Cambiar evidencia"
                            : "Subir evidencia"}
                        </span>
                      </label>

                      <small
                        style={{
                          display: "block",
                          color: "#6b7280",
                          marginTop: 8,
                        }}
                      >
                        Captura, imagen o PDF · máximo 10 MB.
                        Para enviar necesitas un enlace o una evidencia.
                      </small>
                    </div>
                  </div>

                  <TextAreaField
                    label="Comentario para el profesor"
                    value={stage4Comment}
                    onChange={setStage4Comment}
                    disabled={!editable(stage4)}
                    placeholder="Comentario opcional sobre el prototipo."
                    rows={3}
                  />

                  {editable(stage4) ? (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <Button
                        type="submit"
                        variant="outline"
                        disabled={
                          savingStage === 4 || uploadingStage === 4
                        }
                      >
                        <FileText size={17} />
                        Guardar borrador
                      </Button>

                      <Button
                        type="button"
                        disabled={
                          savingStage === 4 || uploadingStage === 4
                        }
                        onClick={() => saveStage4(true)}
                      >
                        <Send size={17} />
                        Enviar Etapa 4 al profesor
                      </Button>
                    </div>
                  ) : (
                    <FrozenNotice
                      work={stage4}
                      approvedMessage="Etapa 4 aprobada"
                    />
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

          <div style={{ display: "grid", gap: 12 }}>
            {stages
              .filter((stage) => stage.id >= 5)
              .map((stage) => {
                const work =
                  works.find((item) => item.stage_id === stage.id) ??
                  null;
                const status: StageStatus = work?.status ?? "locked";
                const info = STATUS_DATA[status];

                return (
                  <article
                    key={stage.id}
                    style={{
                      border: "1px solid #e5e7eb",
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
                        background: info.background,
                      }}
                    >
                      {status === "locked" ? (
                        <Lock size={19} />
                      ) : status === "correction_required" ? (
                        <RefreshCw size={19} />
                      ) : (
                        <ChevronRight size={19} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong>
                        Etapa {stage.id} · {stage.name}
                      </strong>
                      <p
                        style={{
                          margin: "4px 0 0",
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
                        background: info.background,
                        color: info.color,
                      }}
                    >
                      {info.icon} {info.label}
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
            <div style={{ fontSize: 54 }}>🏆</div>
            <h2>¡Proyecto completado!</h2>
            <p>
              Alcanzaron el 100 % y el profesor aprobó oficialmente
              la culminación.
            </p>
            {group.diploma_code && (
              <small>
                Código de diploma:{" "}
                <strong>{group.diploma_code}</strong>
              </small>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
