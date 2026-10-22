"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";

import {
  Award,
  Bell,
  ChevronRight,
  Eye,
  Music2,
  FolderKanban,
  Home,
  LayoutGrid,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Upload,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getSupabase } from "@/lib/supabase-browser";

type StageStatus =
  | "locked"
  | "editable"
  | "submitted"
  | "correction_required"
  | "approved"
  | "rejected";

type GroupRow = {
  id: number;
  members: string;
  project_name: string | null;
  logo_path: string | null;
  active: boolean;
  completion_approved: boolean;
  completion_approved_at: string | null;
  diploma_code: string | null;
  updated_at: string;
};

type StageDefinition = {
  id: number;
  name: string;
  description: string;
  milestone_percent: number;
};

type StageWork = {
  group_id: number;
  stage_id: number;
  status: StageStatus;
  score: number | string;
  content: Record<string, any>;
  evidence_url: string | null;
  student_comment: string;
  teacher_comment: string;
  revision: number;
  submitted_at: string | null;
  reviewed_at: string | null;
};

type AtenasGroup = GroupRow & {
  grade: number;
  progress: number;
  pendingReviews: number;
  corrections: number;
  approvedStages: number;
  currentStage: number;
  stageWorks: StageWork[];
};

const CARD_COLORS = [
  { accent: "#6c56d9", soft: "#eeeafd" },
  { accent: "#2388d9", soft: "#e7f4ff" },
  { accent: "#f39a32", soft: "#fff2df" },
  { accent: "#159b7d", soft: "#e7faf5" },
  { accent: "#e05c77", soft: "#fff0f3" },
];

const STATUS_INFO: Record<
  StageStatus,
  { icon: string; label: string }
> = {
  locked: { icon: "🔒", label: "Bloqueada" },
  editable: { icon: "✏️", label: "Editable" },
  submitted: { icon: "🟡", label: "En revisión" },
  correction_required: {
    icon: "🔄",
    label: "Corrección solicitada",
  },
  approved: { icon: "✅", label: "Aprobada" },
  rejected: { icon: "❌", label: "Rechazada" },
};

function numeric(value: number | string | null | undefined) {
  const result = Number(value ?? 0);
  return Number.isFinite(result) ? result : 0;
}

function formatDate(value: string | null) {
  if (!value) return "";

  try {
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "";
  }
}

function buildGroup(
  group: GroupRow,
  allWork: StageWork[]
): AtenasGroup {
  const stageWorks = allWork
    .filter((work) => work.group_id === group.id)
    .sort((a, b) => a.stage_id - b.stage_id);

  const grade = stageWorks
    .filter((work) => work.status === "approved")
    .reduce((total, work) => total + numeric(work.score), 0);

  const pendingReviews = stageWorks.filter(
    (work) => work.status === "submitted"
  ).length;

  const corrections = stageWorks.filter(
    (work) => work.status === "correction_required"
  ).length;

  const approvedStages = stageWorks.filter(
    (work) => work.status === "approved"
  ).length;

  const reachedStages = stageWorks.filter(
    (work) => work.status !== "locked"
  );

  const currentStage = reachedStages.length
    ? Math.max(...reachedStages.map((work) => work.stage_id))
    : 1;

  return {
    ...group,
    grade: Math.round(grade * 100) / 100,
    progress: Math.round(grade * 5 * 10) / 10,
    pendingReviews,
    corrections,
    approvedStages,
    currentStage,
    stageWorks,
  };
}

function Field({
  label,
  value,
}: {
  label: string;
  value: unknown;
}) {
  return (
    <div>
      <strong>{label}:</strong>
      <p style={{ margin: "5px 0 0", whiteSpace: "pre-wrap" }}>
        {String(value ?? "—")}
      </p>
    </div>
  );
}

function GroupCard({
  group,
  stages,
  onOpen,
  onToggleActive,
  changing,
}: {
  group: AtenasGroup;
  stages: StageDefinition[];
  onOpen: () => void;
  onToggleActive: () => void;
  changing: boolean;
}) {
  const colors =
    CARD_COLORS[(group.id - 1) % CARD_COLORS.length];

  const stage = stages.find(
    (item) => item.id === group.currentStage
  );

  let stageLabel = stage?.name ?? "Etapa 1";

  if (!group.active) stageLabel = "Deshabilitado";
  if (group.pendingReviews > 0)
    stageLabel = "Pendiente de revisión";
  if (group.corrections > 0)
    stageLabel = "Corrección solicitada";
  if (group.completion_approved)
    stageLabel = "Proyecto finalizado";

  return (
    <article
      className="project-card"
      style={
        {
          "--accent": colors.accent,
          "--soft": colors.soft,
          opacity: group.active ? 1 : 0.66,
        } as CSSProperties
      }
    >
      <div className="card-head">
        <div className="project-icon">
          {group.completion_approved
            ? "🏆"
            : group.pendingReviews > 0
            ? "🟡"
            : group.active
            ? "🤖"
            : "🔒"}
        </div>
        <span className="stage-pill">{stageLabel}</span>
      </div>

      <div>
        <p className="team-name">Grupo {group.id}</p>
        <h3>
          {group.project_name?.trim() || `Grupo ${group.id}`}
        </h3>
        <p className="members">
          <Users />
          {group.members?.trim() || "Sin integrantes asignados"}
        </p>
      </div>

      <div className="progress-block">
        <div className="progress-label">
          <span>Nota / progreso</span>
          <strong>
            {group.grade}/20 · {group.progress}%
          </strong>
        </div>
        <Progress
          value={group.progress}
          className="project-progress"
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          fontSize: 12,
          color: "#6b7280",
        }}
      >
        <span>✅ {group.approvedStages}/5</span>
        <span>🟡 {group.pendingReviews} revisión</span>
        <span>🔄 {group.corrections} corrección</span>
      </div>

      <div className="card-foot">
        <Button
          type="button"
          variant="outline"
          disabled={changing}
          onClick={(event) => {
            event.stopPropagation();
            onToggleActive();
          }}
        >
          {group.active ? "Deshabilitar" : "Habilitar"}
        </Button>

        <button onClick={onOpen}>
          Ver grupo
          <ChevronRight />
        </button>
      </div>
    </article>
  );
}

export default function HomePage() {
  const [groups, setGroups] = useState<AtenasGroup[]>([]);
  const [stages, setStages] = useState<StageDefinition[]>([]);
  const [activeGroupId, setActiveGroupId] =
    useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("todos");
  const [mobileNav, setMobileNav] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [teacherName, setTeacherName] =
    useState("Profesor Kevin");
  const [loading, setLoading] = useState(true);
  const [changingGroup, setChangingGroup] =
    useState<number | null>(null);
  const [reviewingStage, setReviewingStage] =
    useState<number | null>(null);
  const [reviewScores, setReviewScores] =
    useState<Record<number, string>>({});
  const [reviewComments, setReviewComments] =
    useState<Record<number, string>>({});
  const [notice, setNotice] = useState("");

  const [finalizingGroup, setFinalizingGroup] =
    useState<number | null>(null);

  const [adminView, setAdminView] =
    useState<
      "inicio" | "grupos" | "estudiantes" | "revisiones"
    >("inicio");

  const [uploadingFinalAsset, setUploadingFinalAsset] =
    useState<"diploma" | "music" | null>(null);

  const [assetPreview, setAssetPreview] =
    useState<{
      url: string;
      label: string;
      kind: "image" | "pdf";
    } | null>(null);

  const [previewLoading, setPreviewLoading] =
    useState(false);

  const activeGroup = useMemo(
    () =>
      groups.find((group) => group.id === activeGroupId) ??
      null,
    [groups, activeGroupId]
  );

  useEffect(() => {
    let mounted = true;

    async function verifyAccess() {
      try {
        const supabase = await getSupabase();
        const { data: sessionData } =
          await supabase.auth.getSession();
        const user = sessionData.session?.user;

        if (!user) {
          window.location.replace("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from("profiles")
          .select("display_name, role, active")
          .eq("id", user.id)
          .single();

        if (error || !profile || !profile.active) {
          await supabase.auth.signOut();
          window.location.replace("/login");
          return;
        }

        if (profile.role !== "admin") {
          window.location.replace("/student");
          return;
        }

        if (mounted) {
          setTeacherName(
            profile.display_name || "Profesor Kevin"
          );
          setAuthReady(true);
        }
      } catch (error) {
        console.error(error);
        window.location.replace("/login");
      }
    }

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadDashboard(showSpinner = false) {
    if (showSpinner) setLoading(true);

    try {
      const supabase = await getSupabase();

      const [groupsResult, stagesResult, workResult] =
        await Promise.all([
          supabase
            .from("groups")
            .select(`
              id,
              members,
              project_name,
              logo_path,
              active,
              completion_approved,
              completion_approved_at,
              diploma_code,
              updated_at
            `)
            .order("id", { ascending: true }),

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
              score,
              content,
              evidence_url,
              student_comment,
              teacher_comment,
              revision,
              submitted_at,
              reviewed_at
            `)
            .order("group_id", { ascending: true })
            .order("stage_id", { ascending: true }),
        ]);

      if (groupsResult.error) throw groupsResult.error;
      if (stagesResult.error) throw stagesResult.error;
      if (workResult.error) throw workResult.error;

      const rawGroups =
        (groupsResult.data ?? []) as GroupRow[];
      const rawStages =
        (stagesResult.data ?? []) as StageDefinition[];
      const rawWork =
        (workResult.data ?? []) as StageWork[];

      setStages(rawStages);
      setGroups(
        rawGroups.map((group) => buildGroup(group, rawWork))
      );
    } catch (error) {
      console.error("Error cargando panel:", error);
      setNotice(
        "No se pudieron cargar los datos desde Supabase."
      );
    } finally {
      if (showSpinner) setLoading(false);
    }
  }

  useEffect(() => {
    if (!authReady) return;
    loadDashboard(true);
  }, [authReady]);

  async function toggleGroup(group: AtenasGroup) {
    setChangingGroup(group.id);
    setNotice("");

    try {
      const supabase = await getSupabase();
      const { error } = await supabase
        .from("groups")
        .update({ active: !group.active })
        .eq("id", group.id);

      if (error) throw error;

      setNotice(
        !group.active
          ? `Grupo ${group.id} habilitado.`
          : `Grupo ${group.id} deshabilitado.`
      );

      await loadDashboard(false);
    } catch (error) {
      console.error(error);
      setNotice(
        "No se pudo cambiar el estado del grupo."
      );
    } finally {
      setChangingGroup(null);
    }
  }

  async function openAsset(path: string) {
    try {
      const supabase = await getSupabase();
      const { data, error } = await supabase.storage
        .from("project-assets")
        .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("No se pudo abrir el archivo.");
      }

      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error(error);
      setNotice("No se pudo abrir el archivo.");
    }
  }

  async function reviewStage(
    groupId: number,
    work: StageWork,
    action:
      | "approved"
      | "correction_required"
      | "rejected"
  ) {
    const stageId = work.stage_id;

    const comment = (
      reviewComments[stageId] ??
      work.teacher_comment ??
      ""
    ).trim();

    const rawScore =
      reviewScores[stageId];

    const score =
      rawScore === undefined ||
      rawScore.trim() === ""
        ? Number.NaN
        : Number(rawScore);

    if (
      action === "approved" &&
      (!Number.isFinite(score) || score < 0 || score > 4)
    ) {
      setNotice(
        "Antes de aprobar, escribe la nota de ESTA ETAPA entre 0 y 4 puntos."
      );
      return;
    }

    if (
      (action === "correction_required" ||
        action === "rejected") &&
      !comment
    ) {
      setNotice(
        "Escribe un comentario explicando al estudiante qué debe corregir."
      );
      return;
    }

    let confirmation = "";
    if (action === "approved") {
      confirmation = `¿Aprobar esta etapa con ${score}/4 puntos?`;
    } else if (action === "correction_required") {
      confirmation =
        "¿Solicitar corrección? El estudiante podrá editar nuevamente esta etapa.";
    } else {
      confirmation = "¿Rechazar esta entrega?";
    }

    if (!window.confirm(confirmation)) return;

    setReviewingStage(stageId);
    setNotice("");

    try {
      const supabase = await getSupabase();

      const payload: Record<string, any> = {
        status: action,
        teacher_comment: comment,
      };

      if (action === "approved") payload.score = score;
      if (action === "rejected") payload.score = 0;

      const { error } = await supabase
        .from("group_stage_work")
        .update(payload)
        .eq("group_id", groupId)
        .eq("stage_id", stageId);

      if (error) throw error;

      setNotice(
        action === "approved"
          ? `Etapa ${stageId} aprobada con ${score}/4 puntos.`
          : action === "correction_required"
          ? `Se solicitó corrección en la Etapa ${stageId}.`
          : `Etapa ${stageId} rechazada.`
      );

      setReviewScores((current) => {
        const copy = { ...current };
        delete copy[stageId];
        return copy;
      });

      setReviewComments((current) => {
        const copy = { ...current };
        delete copy[stageId];
        return copy;
      });

      await loadDashboard(false);
    } catch (error) {
      console.error("Error evaluando:", error);
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la evaluación."
      );
    } finally {
      setReviewingStage(null);
    }
  }

  function navigateAdmin(
    view:
      | "inicio"
      | "grupos"
      | "estudiantes"
      | "revisiones"
  ) {
    setAdminView(view);
    setMobileNav(false);

    if (view === "revisiones") {
      setFilter("revision");
    } else if (view === "grupos") {
      setFilter("todos");
    }

    window.setTimeout(() => {
      const id =
        view === "inicio"
          ? "admin-top"
          : view === "estudiantes"
          ? "students-section"
          : "groups-section";

      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  async function adjustApprovedScore(
    groupId: number,
    work: StageWork
  ) {
    const raw =
      reviewScores[work.stage_id] ??
      String(numeric(work.score));

    const score = Number(raw);
    const currentScore = numeric(work.score);

    if (
      !Number.isFinite(score) ||
      score < 0 ||
      score > 4
    ) {
      setNotice(
        "La nota de una etapa debe estar entre 0 y 4."
      );
      return;
    }

    if (score < currentScore) {
      setNotice(
        `La regla actual de la base de datos no permite reducir una nota ya registrada (${currentScore}/4). Sí puedes aumentarla.`
      );
      return;
    }

    setReviewingStage(work.stage_id);
    setNotice("");

    try {
      const supabase = await getSupabase();

      const { error } = await supabase
        .from("group_stage_work")
        .update({ score })
        .eq("group_id", groupId)
        .eq("stage_id", work.stage_id);

      if (error) throw error;

      setNotice(
        `Nota de Etapa ${work.stage_id} actualizada a ${score}/4.`
      );

      await loadDashboard(false);
    } catch (error) {
      console.error(error);
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo actualizar la nota."
      );
    } finally {
      setReviewingStage(null);
    }
  }

  async function uploadFinalAdminAsset(
    event: ChangeEvent<HTMLInputElement>,
    group: AtenasGroup,
    kind: "diploma" | "music"
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    const stage5 = group.stageWorks.find(
      (work) => work.stage_id === 5
    );

    if (!stage5) {
      setNotice(
        "No encontramos la Etapa 5 de este grupo."
      );
      return;
    }

    const diplomaTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/webp",
    ];

    const musicTypes = [
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/x-m4a",
    ];

    const allowed =
      kind === "diploma"
        ? diplomaTypes
        : musicTypes;

    if (
      !allowed.includes(file.type) &&
      !(
        kind === "music" &&
        /\.(mp3|wav|ogg|m4a)$/i.test(file.name)
      )
    ) {
      setNotice(
        kind === "diploma"
          ? "El diploma debe ser PDF, PNG, JPG o WebP."
          : "La música debe ser MP3, WAV, OGG o M4A."
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setNotice(
        "El archivo no puede superar 10 MB."
      );
      return;
    }

    setUploadingFinalAsset(kind);
    setNotice("");

    try {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        (kind === "diploma" ? "pdf" : "mp3");

      const path =
        `${group.id}/5/admin-${kind}-${crypto.randomUUID()}.${extension}`;

      const supabase = await getSupabase();

      const { error: uploadError } =
        await supabase.storage
          .from("project-assets")
          .upload(path, file, {
            upsert: false,
            contentType: file.type,
          });

      if (uploadError) throw uploadError;

      const nextContent = {
        ...(stage5.content ?? {}),
        [kind === "diploma"
          ? "diploma_asset_path"
          : "celebration_music_path"]:
          path,
      };

      const { error: updateError } =
        await supabase
          .from("group_stage_work")
          .update({ content: nextContent })
          .eq("group_id", group.id)
          .eq("stage_id", 5);

      if (updateError) throw updateError;

      setNotice(
        kind === "diploma"
          ? "🎓 Diploma guardado para este grupo."
          : "🎵 Música de celebración guardada para este grupo."
      );

      await loadDashboard(false);
    } catch (error) {
      console.error(error);
      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo guardar el archivo."
      );
    } finally {
      setUploadingFinalAsset(null);
    }
  }

  async function playUploadedMusic(path: string) {
    try {
      const supabase = await getSupabase();

      const { data, error } =
        await supabase.storage
          .from("project-assets")
          .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) {
        throw error ??
          new Error("No se pudo abrir la música.");
      }

      const audio = new Audio(data.signedUrl);
      await audio.play();
      setNotice("🎵 Música de celebración reproducida.");
    } catch (error) {
      console.error(error);
      setNotice(
        "No se pudo reproducir la música guardada."
      );
    }
  }

  async function previewAsset(
    path: string,
    label: string
  ) {
    setPreviewLoading(true);
    setNotice("");

    try {
      const supabase = await getSupabase();

      const { data, error } = await supabase.storage
        .from("project-assets")
        .createSignedUrl(path, 3600);

      if (error || !data?.signedUrl) {
        throw error ?? new Error("No se pudo abrir la vista previa.");
      }

      const cleanPath =
        path.toLowerCase().split("?")[0];

      setAssetPreview({
        url: data.signedUrl,
        label,
        kind: cleanPath.endsWith(".pdf")
          ? "pdf"
          : "image",
      });
    } catch (error) {
      console.error(error);
      setNotice(
        "No se pudo cargar la vista previa del archivo."
      );
    } finally {
      setPreviewLoading(false);
    }
  }

  function playCelebrationMusic() {
    try {
      const AudioContextClass =
        (window as any).AudioContext ||
        (window as any).webkitAudioContext;

      if (!AudioContextClass) {
        setNotice(
          "Este navegador no permite reproducir la celebración."
        );
        return;
      }

      const context = new AudioContextClass();
      const now = context.currentTime;

      const notes = [
        { frequency: 523.25, start: 0, duration: 0.18 },
        { frequency: 659.25, start: 0.2, duration: 0.18 },
        { frequency: 783.99, start: 0.4, duration: 0.22 },
        { frequency: 1046.5, start: 0.66, duration: 0.5 },
      ];

      notes.forEach((note) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();

        oscillator.type = "triangle";
        oscillator.frequency.value = note.frequency;

        gain.gain.setValueAtTime(0.0001, now + note.start);
        gain.gain.exponentialRampToValueAtTime(
          0.16,
          now + note.start + 0.02
        );
        gain.gain.exponentialRampToValueAtTime(
          0.0001,
          now + note.start + note.duration
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(now + note.start);
        oscillator.stop(now + note.start + note.duration + 0.03);
      });

      setNotice("🎵 Celebración reproducida.");
    } catch (error) {
      console.error(error);
      setNotice(
        "No se pudo reproducir la música de celebración."
      );
    }
  }

  async function finalizeProject(group: AtenasGroup) {
    const allApproved =
      group.stageWorks.length === 5 &&
      group.stageWorks.every(
        (work) => work.status === "approved"
      );

    if (!allApproved || Math.abs(group.grade - 20) > 0.001) {
      setNotice(
        "El diploma requiere las cinco etapas aprobadas y una nota final de 20/20."
      );
      return;
    }

    if (
      !window.confirm(
        "¿Emitir ahora el diploma y aprobar oficialmente la culminación del proyecto?"
      )
    ) {
      return;
    }

    setFinalizingGroup(group.id);
    setNotice("");

    try {
      const supabase = await getSupabase();

      const year = new Date().getFullYear();

      const diplomaCode =
        `ATENAS-IA-${year}-${String(group.id).padStart(2, "0")}-${crypto
          .randomUUID()
          .slice(0, 6)
          .toUpperCase()}`;

      const { error } = await supabase
        .from("groups")
        .update({
          completion_approved: true,
          completion_approved_at: new Date().toISOString(),
          diploma_code: diplomaCode,
        })
        .eq("id", group.id);

      if (error) throw error;

      setNotice(
        `🎓 Diploma emitido para el Grupo ${group.id}: ${diplomaCode}`
      );

      await loadDashboard(false);
    } catch (error) {
      console.error("Error emitiendo diploma:", error);

      setNotice(
        error instanceof Error
          ? error.message
          : "No se pudo emitir el diploma."
      );
    } finally {
      setFinalizingGroup(null);
    }
  }

  async function logout() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    window.location.replace("/login");
  }

  const activeGroups = groups.filter((group) => group.active);
  const activeCount = activeGroups.length;
  const pendingTotal = groups.reduce(
    (total, group) => total + group.pendingReviews,
    0
  );
  const averageProgress = activeGroups.length
    ? Math.round(
        activeGroups.reduce(
          (total, group) => total + group.progress,
          0
        ) / activeGroups.length
      )
    : 0;

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return groups.filter((group) => {
      const text = `${group.id} ${group.members} ${
        group.project_name ?? ""
      }`.toLowerCase();

      if (
        normalizedQuery &&
        !text.includes(normalizedQuery)
      ) {
        return false;
      }

      if (filter === "activos") return group.active;

      if (filter === "revision") {
        return (
          group.pendingReviews > 0 ||
          group.corrections > 0
        );
      }

      if (filter === "final") {
        return group.completion_approved;
      }

      return true;
    });
  }, [groups, query, filter]);

  if (!authReady) {
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
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            Atenas IA Lab
          </strong>
          Verificando acceso...
        </div>
      </main>
    );
  }

  function renderSubmission(
    stage: StageDefinition,
    work: StageWork
  ) {
    const c = work.content ?? {};

    if (stage.id === 1) {
      return (
        <div
          style={{
            display: "grid",
            gap: 10,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field label="Nombre" value={c.project_name} />
          <Field label="Integrantes" value={c.members} />
          <div>
            <strong>Logo:</strong>{" "}
            {c.logo_path ? "✅ cargado" : "❌ no cargado"}
          </div>
          {c.logo_path && (
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                openAsset(String(c.logo_path))
              }
            >
              Ver logo
            </Button>
          )}
        </div>
      );
    }

    if (stage.id === 2) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field label="Problema" value={c.problem} />
          <Field
            label="Beneficiarios"
            value={c.beneficiaries}
          />
          <Field label="Solución" value={c.solution} />
          <Field label="Objetivo" value={c.objective} />
          <Field label="Uso de IA" value={c.ai_use} />
          <Field
            label="Limitaciones"
            value={c.limitations}
          />
          <Field
            label="Tecnologías"
            value={c.technologies}
          />

          <div>
            <strong>Esquema / flyer:</strong>{" "}
            {c.scheme_path ? "✅ cargado" : "❌ no cargado"}
          </div>

          {c.scheme_path && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="button"
                variant="outline"
                disabled={previewLoading}
                onClick={() =>
                  previewAsset(
                    String(c.scheme_path),
                    "Esquema / flyer del proyecto"
                  )
                }
              >
                <Eye size={16} />
                Vista previa
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  openAsset(String(c.scheme_path))
                }
              >
                Abrir aparte
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (stage.id === 3) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field
            label="Tipo de recurso"
            value={c.resource_type}
          />
          <Field
            label="Descripción"
            value={c.description}
          />
          <Field
            label="Origen o fuente"
            value={c.source_origin}
          />
          <Field
            label="Organización / clases"
            value={c.organization_classes}
          />
          <Field
            label="Cantidad / tamaño"
            value={c.quantity_size}
          />
          <Field
            label="Método de obtención"
            value={c.collection_method}
          />
          <Field
            label="Preparación / limpieza"
            value={c.preparation}
          />
          <Field
            label="Limitaciones / sesgos"
            value={c.limitations}
          />

          {c.resource_url ? (
            <a
              href={String(c.resource_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Abrir datos / contenido ↗
            </a>
          ) : (
            <div>❌ No se adjuntó enlace al recurso.</div>
          )}
        </div>
      );
    }

    if (stage.id === 4) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field
            label="Tipo de prototipo"
            value={c.prototype_type}
          />
          <Field
            label="Estado actual"
            value={c.current_status}
          />
          <Field
            label="Funciones implementadas"
            value={c.implemented_features}
          />
          <Field
            label="Funcionamiento de la IA"
            value={c.ai_operation}
          />
          <Field
            label="Pasos para probarlo"
            value={c.testing_steps}
          />
          <Field
            label="Trabajo pendiente"
            value={c.pending_work}
          />

          {c.prototype_url && (
            <a
              href={String(c.prototype_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Abrir prototipo ↗
            </a>
          )}

          <div>
            <strong>Evidencia:</strong>{" "}
            {c.evidence_path ? "✅ cargada" : "No adjunta"}
          </div>

          {c.evidence_path && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="button"
                variant="outline"
                disabled={previewLoading}
                onClick={() =>
                  previewAsset(
                    String(c.evidence_path),
                    "Evidencia del prototipo"
                  )
                }
              >
                <Eye size={16} />
                Vista previa
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  openAsset(String(c.evidence_path))
                }
              >
                Abrir aparte
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (stage.id === 5) {
      return (
        <div
          style={{
            display: "grid",
            gap: 12,
            background: "white",
            borderRadius: 12,
            padding: 13,
            marginBottom: 15,
          }}
        >
          <Field
            label="Resumen final"
            value={c.final_summary}
          />

          {c.final_demo_url && (
            <a
              href={String(c.final_demo_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Abrir versión final / demo ↗
            </a>
          )}

          <Field
            label="Pruebas realizadas"
            value={c.tests_performed}
          />
          <Field
            label="Resultados"
            value={c.test_results}
          />
          <Field
            label="Conclusiones"
            value={c.conclusions}
          />

          {c.presentation_url && (
            <a
              href={String(c.presentation_url)}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#4338ca",
                fontWeight: 700,
              }}
            >
              Abrir presentación final ↗
            </a>
          )}

          <div>
            <strong>Evidencia final:</strong>{" "}
            {c.final_evidence_path
              ? "✅ cargada"
              : "No adjunta"}
          </div>

          {c.final_evidence_path && (
            <div
              style={{
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <Button
                type="button"
                variant="outline"
                disabled={previewLoading}
                onClick={() =>
                  previewAsset(
                    String(c.final_evidence_path),
                    "Evidencia final"
                  )
                }
              >
                <Eye size={16} />
                Vista previa
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  openAsset(
                    String(c.final_evidence_path)
                  )
                }
              >
                Abrir aparte
              </Button>
            </div>
          )}
        </div>
      );
    }

    return null;
  }

  return (
    <main className="app-shell">
      <aside
        className={
          mobileNav
            ? "app-sidebar is-open"
            : "app-sidebar"
        }
      >
        <div className="brand">
          <span className="brand-mark">
            <Sparkles />
          </span>
          <div>
            <strong>Atenas IA Lab</strong>
            <small>Inteligencia Artificial II</small>
          </div>
        </div>

        <button
          className="close-nav"
          onClick={() => setMobileNav(false)}
          aria-label="Cerrar menú"
        >
          <X />
        </button>

        <nav>
          <button
            className={
              adminView === "inicio"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigateAdmin("inicio")
            }
          >
            <Home />
            <span>Inicio</span>
          </button>

          <button
            className={
              adminView === "grupos"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigateAdmin("grupos")
            }
          >
            <FolderKanban />
            <span>Grupos</span>
            <span className="nav-count">
              {groups.length}
            </span>
          </button>

          <button
            className={
              adminView === "estudiantes"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigateAdmin("estudiantes")
            }
          >
            <Users />
            <span>Estudiantes</span>
          </button>

          <button
            className={
              adminView === "revisiones"
                ? "nav-item active"
                : "nav-item"
            }
            onClick={() =>
              navigateAdmin("revisiones")
            }
          >
            <ListChecks />
            <span>Revisiones</span>
            {pendingTotal > 0 && (
              <span className="nav-count">
                {pendingTotal}
              </span>
            )}
          </button>
        </nav>

        <div className="sidebar-tip">
          <span>💡</span>
          <strong>Evaluación</strong>
          <p>
            Cada etapa vale hasta 4 puntos. Total: 20.
          </p>
        </div>

        <div className="teacher">
          <div className="teacher-avatar">KP</div>
          <div>
            <strong>{teacherName}</strong>
            <small>Administrador</small>
          </div>
        </div>
      </aside>

      <section className="app-main">
        <header className="topbar">
          <button
            className="menu-button"
            onClick={() => setMobileNav(true)}
            aria-label="Abrir menú"
          >
            <Menu />
          </button>

          <label className="search-box">
            <Search />
            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Buscar grupo, proyecto o estudiante..."
            />
          </label>

          <button
            className="notification"
            aria-label="Notificaciones"
            onClick={() =>
              navigateAdmin("revisiones")
            }
          >
            <Bell />
            {pendingTotal > 0 && <span />}
          </button>

          <Button
            className="primary-action"
            onClick={logout}
          >
            <LogOut />
            Cerrar sesión
          </Button>
        </header>

        <div className="workspace" id="admin-top">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">
                Atenas IA Lab · Panel del profesor
              </p>
              <h1>¡Hola, {teacherName}! 👋</h1>
              <p>
                Revisa, califica y acompaña el avance de cada
                proyecto.
              </p>
            </div>

            <div className="class-chip">
              <span>Inteligencia Artificial II</span>
              <strong>
                {groups.length} grupos · {activeCount} activos
              </strong>
            </div>
          </section>

          {notice && (
            <button
              className="notice"
              onClick={() => setNotice("")}
            >
              {notice}
              <X />
            </button>
          )}

          <section className="summary-grid">
            <article>
              <span className="summary-icon purple">
                <FolderKanban />
              </span>
              <div>
                <small>Grupos activos</small>
                <strong>{activeCount}</strong>
              </div>
              <em>de {groups.length}</em>
            </article>

            <article>
              <span className="summary-icon blue">
                <LayoutGrid />
              </span>
              <div>
                <small>Avance promedio</small>
                <strong>{averageProgress}%</strong>
              </div>
              <em>Calculado por nota</em>
            </article>

            <article>
              <span className="summary-icon orange">
                <ListChecks />
              </span>
              <div>
                <small>Entregas por revisar</small>
                <strong>{pendingTotal}</strong>
              </div>
              <em>Requieren atención</em>
            </article>
          </section>

          {adminView === "estudiantes" && (
            <section
              id="students-section"
              style={{
                background: "white",
                borderRadius: 22,
                padding: 22,
                marginBottom: 24,
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Estudiantes por grupo
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit,minmax(240px,1fr))",
                  gap: 12,
                }}
              >
                {activeGroups.map((group) => (
                  <article
                    key={group.id}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 15,
                      padding: 15,
                    }}
                  >
                    <small
                      style={{
                        color: "#6b7280",
                        fontWeight: 800,
                      }}
                    >
                      GRUPO {group.id}
                    </small>
                    <strong
                      style={{
                        display: "block",
                        margin: "5px 0",
                      }}
                    >
                      {group.members ||
                        "Sin integrantes"}
                    </strong>
                    <span
                      style={{
                        color: "#6b7280",
                        fontSize: 13,
                      }}
                    >
                      {group.project_name ||
                        "Proyecto sin nombre"}
                    </span>
                  </article>
                ))}
              </div>
            </section>
          )}

          <div id="groups-section">
          <Tabs
            value={filter}
            onValueChange={setFilter}
            className="project-tabs"
          >
            <div className="section-heading">
              <div>
                <h2>Grupos del curso</h2>
                <p>
                  Abre un grupo para revisar sus cinco etapas.
                </p>
              </div>

              <TabsList className="filter-tabs">
                <TabsTrigger value="todos">
                  Todos
                </TabsTrigger>
                <TabsTrigger value="activos">
                  Activos
                </TabsTrigger>
                <TabsTrigger value="revision">
                  Revisar
                  {pendingTotal > 0
                    ? ` (${pendingTotal})`
                    : ""}
                </TabsTrigger>
                <TabsTrigger value="final">
                  Finalizados
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>

          {loading ? (
            <div className="empty-state tall">
              Cargando grupos...
            </div>
          ) : (
            <div className="project-grid">
              {visibleGroups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  stages={stages}
                  changing={
                    changingGroup === group.id
                  }
                  onOpen={() =>
                    setActiveGroupId(group.id)
                  }
                  onToggleActive={() =>
                    toggleGroup(group)
                  }
                />
              ))}

              {visibleGroups.length === 0 && (
                <div className="empty-state">
                  No hay grupos en este filtro.
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </section>

      {mobileNav && (
        <button
          className="nav-backdrop"
          onClick={() => setMobileNav(false)}
          aria-label="Cerrar menú"
        />
      )}

      {assetPreview && (
        <div
          onMouseDown={() =>
            setAssetPreview(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 3000,
            background: "rgba(15,23,42,.78)",
            display: "grid",
            placeItems: "center",
            padding: 20,
          }}
        >
          <section
            onMouseDown={(event) =>
              event.stopPropagation()
            }
            style={{
              width: "min(1100px,96vw)",
              height: "min(820px,90vh)",
              background: "white",
              borderRadius: 22,
              padding: 18,
              display: "grid",
              gridTemplateRows: "auto 1fr",
              gap: 12,
              boxShadow:
                "0 30px 80px rgba(15,23,42,.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div>
                <small
                  style={{
                    color: "#6b7280",
                    fontWeight: 700,
                  }}
                >
                  VISTA PREVIA
                </small>
                <strong
                  style={{
                    display: "block",
                    fontSize: 18,
                  }}
                >
                  {assetPreview.label}
                </strong>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                }}
              >
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    window.open(
                      assetPreview.url,
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                >
                  Abrir en pestaña
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAssetPreview(null)
                  }
                >
                  <X size={17} />
                  Cerrar
                </Button>
              </div>
            </div>

            <div
              style={{
                minHeight: 0,
                borderRadius: 16,
                overflow: "hidden",
                background: "#f3f4f6",
                display: "grid",
                placeItems: "center",
              }}
            >
              {assetPreview.kind === "pdf" ? (
                <iframe
                  title={assetPreview.label}
                  src={assetPreview.url}
                  style={{
                    width: "100%",
                    height: "100%",
                    border: 0,
                    background: "white",
                  }}
                />
              ) : (
                <img
                  src={assetPreview.url}
                  alt={assetPreview.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}
            </div>
          </section>
        </div>
      )}

      {activeGroup && (
        <div
          className="detail-overlay"
          onMouseDown={() =>
            setActiveGroupId(null)
          }
        >
          <section
            className="detail-panel"
            role="dialog"
            aria-modal="true"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <button
              className="detail-close"
              onClick={() =>
                setActiveGroupId(null)
              }
            >
              <X />
            </button>

            <div
              className="detail-hero"
              style={
                {
                  "--accent":
                    CARD_COLORS[
                      (activeGroup.id - 1) %
                        CARD_COLORS.length
                    ].accent,
                  "--soft":
                    CARD_COLORS[
                      (activeGroup.id - 1) %
                        CARD_COLORS.length
                    ].soft,
                } as CSSProperties
              }
            >
              <span>
                {activeGroup.pendingReviews > 0
                  ? "🟡"
                  : activeGroup.completion_approved
                  ? "🏆"
                  : "🤖"}
              </span>

              <div>
                <p>Grupo {activeGroup.id}</p>
                <h2>
                  {activeGroup.project_name ||
                    "Proyecto aún sin nombre"}
                </h2>
                <small>
                  {activeGroup.members ||
                    "Integrantes sin definir"}
                </small>
              </div>
            </div>

            <div className="detail-progress">
              <div>
                <span>Nota y progreso</span>
                <strong>
                  {activeGroup.grade}/20 ·{" "}
                  {activeGroup.progress}%
                </strong>
              </div>
              <Progress
                value={activeGroup.progress}
              />
            </div>

            <div className="stage-list">
              {stages.map((stage) => {
                const work =
                  activeGroup.stageWorks.find(
                    (item) =>
                      item.stage_id === stage.id
                  );

                if (!work) return null;

                const info =
                  STATUS_INFO[work.status];

                return (
                  <div
                    key={stage.id}
                    style={{
                      display: "grid",
                      gap: 10,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      className={
                        work.status === "approved"
                          ? "stage-row done"
                          : "stage-row"
                      }
                    >
                      <span>{info.icon}</span>

                      <div style={{ flex: 1 }}>
                        <strong>
                          Etapa {stage.id} · {stage.name}
                        </strong>
                        <small>
                          {info.label} ·{" "}
                          {numeric(work.score)}/4 puntos
                        </small>

                        {work.submitted_at && (
                          <small
                            style={{
                              display: "block",
                              marginTop: 4,
                            }}
                          >
                            Enviado:{" "}
                            {formatDate(
                              work.submitted_at
                            )}
                          </small>
                        )}

                        {work.student_comment && (
                          <div
                            style={{
                              marginTop: 8,
                              padding: 10,
                              background: "#f8fafc",
                              borderRadius: 10,
                              fontSize: 13,
                            }}
                          >
                            <strong>
                              💬 Estudiante:
                            </strong>{" "}
                            {work.student_comment}
                          </div>
                        )}

                        {work.teacher_comment &&
                          work.status !== "submitted" && (
                            <div
                              style={{
                                marginTop: 8,
                                padding: 10,
                                background: "#f3f4f6",
                                borderRadius: 10,
                                fontSize: 13,
                              }}
                            >
                              <strong>
                                👨‍🏫 Profesor:
                              </strong>{" "}
                              {work.teacher_comment}
                            </div>
                          )}
                      </div>
                    </div>

                    {work.status === "approved" && (
                      <div
                        style={{
                          border: "1px solid #d1fae5",
                          background: "#f0fdf4",
                          borderRadius: 14,
                          padding: 13,
                          display: "flex",
                          alignItems: "end",
                          gap: 10,
                          flexWrap: "wrap",
                        }}
                      >
                        <label
                          style={{
                            display: "grid",
                            gap: 5,
                            minWidth: 150,
                          }}
                        >
                          <strong>
                            Ajustar nota /4
                          </strong>

                          <input
                            type="number"
                            min="0"
                            max="4"
                            step="0.1"
                            value={
                              reviewScores[
                                stage.id
                              ] ??
                              String(
                                numeric(
                                  work.score
                                )
                              )
                            }
                            onChange={(event) => {
                              const next =
                                event.target.value;

                              if (
                                next === "" ||
                                (Number(next) >= 0 &&
                                  Number(next) <= 4)
                              ) {
                                setReviewScores(
                                  (current) => ({
                                    ...current,
                                    [stage.id]:
                                      next,
                                  })
                                );
                              }
                            }}
                            style={{
                              minHeight: 42,
                              border:
                                "1px solid #d1d5db",
                              borderRadius: 10,
                              padding: "0 11px",
                              background: "white",
                            }}
                          />
                        </label>

                        <Button
                          type="button"
                          variant="outline"
                          disabled={
                            reviewingStage ===
                            stage.id
                          }
                          onClick={() =>
                            adjustApprovedScore(
                              activeGroup.id,
                              work
                            )
                          }
                        >
                          Guardar nota
                        </Button>

                        <small
                          style={{
                            color: "#047857",
                            paddingBottom: 10,
                          }}
                        >
                          Sirve para corregir notas
                          de etapas ya aprobadas.
                        </small>
                      </div>
                    )}

                    {work.status === "submitted" && (
                      <div
                        style={{
                          border:
                            "1px solid #f2d38c",
                          background: "#fffbeb",
                          borderRadius: 16,
                          padding: 16,
                        }}
                      >
                        <strong
                          style={{
                            display: "block",
                            marginBottom: 5,
                            color: "#92400e",
                          }}
                        >
                          🟡 Entrega esperando revisión
                        </strong>

                        <p
                          style={{
                            fontSize: 13,
                            color: "#6b7280",
                            margin: "0 0 15px",
                          }}
                        >
                          Evalúa esta etapa. Si la apruebas, la
                          siguiente se desbloqueará automáticamente.
                        </p>

                        {renderSubmission(stage, work)}

                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "minmax(120px,160px) 1fr",
                            gap: 12,
                            marginBottom: 12,
                          }}
                        >
                          <label
                            style={{
                              display: "grid",
                              gap: 6,
                            }}
                          >
                            <strong>
                              Nota de esta etapa /4
                            </strong>
                            <input
                              type="number"
                              min="0"
                              max="4"
                              step="0.1"
                              placeholder="0 a 4"
                              value={
                                reviewScores[
                                  stage.id
                                ] ?? ""
                              }
                              onChange={(event) => {
                                const next =
                                  event.target.value;

                                if (
                                  next === "" ||
                                  (Number(next) >= 0 &&
                                    Number(next) <= 4)
                                ) {
                                  setReviewScores(
                                    (current) => ({
                                      ...current,
                                      [stage.id]:
                                        next,
                                    })
                                  );
                                }
                              }}
                              style={{
                                minHeight: 43,
                                border:
                                  "1px solid #d1d5db",
                                borderRadius: 10,
                                padding: "0 11px",
                              }}
                            />
                            <small
                              style={{
                                color: "#6b7280",
                              }}
                            >
                              Total acumulado actual:{" "}
                              {activeGroup.grade}/20
                            </small>
                          </label>

                          <label
                            style={{
                              display: "grid",
                              gap: 6,
                            }}
                          >
                            <strong>Comentario</strong>
                            <textarea
                              rows={3}
                              value={
                                reviewComments[
                                  stage.id
                                ] ??
                                work.teacher_comment ??
                                ""
                              }
                              onChange={(event) =>
                                setReviewComments(
                                  (current) => ({
                                    ...current,
                                    [stage.id]:
                                      event.target.value,
                                  })
                                )
                              }
                              placeholder="Felicitaciones, observaciones o correcciones..."
                              style={{
                                border:
                                  "1px solid #d1d5db",
                                borderRadius: 10,
                                padding: 11,
                                resize: "vertical",
                              }}
                            />
                          </label>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "flex-end",
                            gap: 8,
                            flexWrap: "wrap",
                          }}
                        >
                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              reviewingStage === stage.id
                            }
                            onClick={() =>
                              reviewStage(
                                activeGroup.id,
                                work,
                                "correction_required"
                              )
                            }
                          >
                            🔄 Pedir corrección
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            disabled={
                              reviewingStage === stage.id
                            }
                            onClick={() =>
                              reviewStage(
                                activeGroup.id,
                                work,
                                "rejected"
                              )
                            }
                            style={{
                              color: "#b91c1c",
                            }}
                          >
                            ❌ Rechazar
                          </Button>

                          <Button
                            type="button"
                            disabled={
                              reviewingStage === stage.id
                            }
                            onClick={() =>
                              reviewStage(
                                activeGroup.id,
                                work,
                                "approved"
                              )
                            }
                          >
                            ✅ Aprobar etapa
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {!activeGroup.completion_approved &&
              activeGroup.approvedStages === 5 && (
                <div
                  style={{
                    marginTop: 20,
                    padding: 20,
                    borderRadius: 16,
                    textAlign: "center",
                    background:
                      Math.abs(activeGroup.grade - 20) < 0.001
                        ? "#fff7ed"
                        : "#f8fafc",
                    border:
                      Math.abs(activeGroup.grade - 20) < 0.001
                        ? "1px solid #fed7aa"
                        : "1px solid #e5e7eb",
                  }}
                >
                  <Award size={38} />

                  <h3 style={{ margin: "8px 0" }}>
                    Cierre oficial del proyecto
                  </h3>

                  {(() => {
                    const finalWork =
                      activeGroup.stageWorks.find(
                        (work) =>
                          work.stage_id === 5
                      );

                    const diplomaPath =
                      String(
                        finalWork?.content
                          ?.diploma_asset_path ??
                          ""
                      );

                    const musicPath =
                      String(
                        finalWork?.content
                          ?.celebration_music_path ??
                          ""
                      );

                    return (
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns:
                            "repeat(auto-fit,minmax(220px,1fr))",
                          gap: 12,
                          margin: "16px 0 20px",
                          textAlign: "left",
                        }}
                      >
                        <div
                          style={{
                            border:
                              "1px solid #e5e7eb",
                            borderRadius: 14,
                            padding: 14,
                            background: "white",
                          }}
                        >
                          <strong>
                            🎓 Diploma personalizado
                          </strong>

                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: 13,
                            }}
                          >
                            PDF o imagen, máximo
                            10 MB.
                          </p>

                          <label
                            style={{
                              display:
                                "inline-block",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              hidden
                              type="file"
                              accept="application/pdf,image/png,image/jpeg,image/webp"
                              disabled={
                                uploadingFinalAsset ===
                                "diploma"
                              }
                              onChange={(event) =>
                                uploadFinalAdminAsset(
                                  event,
                                  activeGroup,
                                  "diploma"
                                )
                              }
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
                                padding:
                                  "9px 12px",
                              }}
                            >
                              <Upload
                                size={16}
                              />
                              {uploadingFinalAsset ===
                              "diploma"
                                ? "Subiendo..."
                                : diplomaPath
                                ? "Cambiar diploma"
                                : "Subir diploma"}
                            </span>
                          </label>

                          {diplomaPath && (
                            <Button
                              type="button"
                              variant="outline"
                              style={{
                                marginLeft: 8,
                              }}
                              onClick={() =>
                                previewAsset(
                                  diplomaPath,
                                  "Diploma oficial"
                                )
                              }
                            >
                              <Eye size={16} />
                              Ver
                            </Button>
                          )}
                        </div>

                        <div
                          style={{
                            border:
                              "1px solid #e5e7eb",
                            borderRadius: 14,
                            padding: 14,
                            background: "white",
                          }}
                        >
                          <strong>
                            🎵 Música de celebración
                          </strong>

                          <p
                            style={{
                              color: "#6b7280",
                              fontSize: 13,
                            }}
                          >
                            MP3, WAV, OGG o M4A,
                            máximo 10 MB.
                          </p>

                          <label
                            style={{
                              display:
                                "inline-block",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              hidden
                              type="file"
                              accept="audio/mpeg,audio/wav,audio/ogg,audio/mp4,.mp3,.wav,.ogg,.m4a"
                              disabled={
                                uploadingFinalAsset ===
                                "music"
                              }
                              onChange={(event) =>
                                uploadFinalAdminAsset(
                                  event,
                                  activeGroup,
                                  "music"
                                )
                              }
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
                                padding:
                                  "9px 12px",
                              }}
                            >
                              <Music2
                                size={16}
                              />
                              {uploadingFinalAsset ===
                              "music"
                                ? "Subiendo..."
                                : musicPath
                                ? "Cambiar música"
                                : "Subir música"}
                            </span>
                          </label>

                          {musicPath && (
                            <Button
                              type="button"
                              variant="outline"
                              style={{
                                marginLeft: 8,
                              }}
                              onClick={() =>
                                playUploadedMusic(
                                  musicPath
                                )
                              }
                            >
                              Probar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {Math.abs(activeGroup.grade - 20) < 0.001 ? (
                    <>
                      <p>
                        Las cinco etapas están aprobadas con 20/20.
                        El diploma NO se emite solo: tú decides cuándo
                        hacerlo.
                      </p>

                      <Button
                        type="button"
                        disabled={
                          finalizingGroup === activeGroup.id
                        }
                        onClick={() =>
                          finalizeProject(activeGroup)
                        }
                      >
                        🎓 Emitir diploma final
                      </Button>
                    </>
                  ) : (
                    <p style={{ color: "#6b7280" }}>
                      Las cinco etapas están aprobadas, pero la nota
                      total es {activeGroup.grade}/20. El diploma
                      requiere 20/20.
                    </p>
                  )}
                </div>
              )}

            {activeGroup.completion_approved && (
              <div
                style={{
                  marginTop: 20,
                  padding: 18,
                  borderRadius: 16,
                  textAlign: "center",
                  background: "#ecfdf5",
                  color: "#047857",
                }}
              >
                <div style={{ fontSize: 38 }}>
                  🎓
                </div>

                <strong
                  style={{
                    display: "block",
                    marginTop: 6,
                  }}
                >
                  Proyecto culminado oficialmente
                </strong>

                {activeGroup.diploma_code && (
                  <div style={{ marginTop: 8 }}>
                    Código de diploma:{" "}
                    <strong>
                      {activeGroup.diploma_code}
                    </strong>
                  </div>
                )}

                {(() => {
                  const finalWork =
                    activeGroup.stageWorks.find(
                      (work) =>
                        work.stage_id === 5
                    );

                  const diplomaPath =
                    String(
                      finalWork?.content
                        ?.diploma_asset_path ??
                        ""
                    );

                  const musicPath =
                    String(
                      finalWork?.content
                        ?.celebration_music_path ??
                        ""
                    );

                  return (
                    <div
                      style={{
                        marginTop: 14,
                        display: "flex",
                        justifyContent:
                          "center",
                        gap: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {diplomaPath && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() =>
                            previewAsset(
                              diplomaPath,
                              "Diploma oficial"
                            )
                          }
                        >
                          <Eye size={17} />
                          Ver diploma
                        </Button>
                      )}

                      <Button
                        type="button"
                        onClick={() =>
                          musicPath
                            ? playUploadedMusic(
                                musicPath
                              )
                            : playCelebrationMusic()
                        }
                      >
                        <Music2 size={17} />
                        Reproducir música
                      </Button>
                    </div>
                  );
                })()}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
