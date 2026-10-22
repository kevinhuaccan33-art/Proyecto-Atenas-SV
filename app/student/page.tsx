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

  const [projectName, setProjectName] =
    useState("");

  const [members, setMembers] =
    useState("");

  const [logoPath, setLogoPath] =
    useState("");

  const [logoPreview, setLogoPreview] =
    useState("");

  const [studentComment, setStudentComment] =
    useState("");


  const stage1 =
    useMemo(
      () =>
        works.find(
          work =>
            work.stage_id === 1
        ) ?? null,
      [works]
    );


  const grade =
    useMemo(
      () =>
        works
          .filter(
            work =>
              work.status === "approved"
          )
          .reduce(
            (total, work) =>
              total +
              numeric(work.score),
            0
          ),
      [works]
    );


  const progress =
    Math.round(
      grade * 5 * 10
    ) / 10;


  const stage1Editable =
    stage1?.status === "editable" ||
    stage1?.status === "correction_required";


  // ============================================================
  // AUTENTICACIÓN
  // ============================================================

  useEffect(() => {

    let mounted = true;


    async function verifyStudent() {

      try {

        const supabase =
          await getSupabase();


        const {
          data: sessionData,
        } =
          await supabase.auth.getSession();


        const user =
          sessionData.session?.user;


        if (!user) {

          window.location.replace(
            "/login"
          );

          return;
        }


        const {
          data: profile,
          error,
        } =
          await supabase
            .from("profiles")
            .select(
              "display_name, role, group_id, active"
            )
            .eq(
              "id",
              user.id
            )
            .single();


        if (
          error ||
          !profile ||
          !profile.active
        ) {

          await supabase.auth.signOut();

          window.location.replace(
            "/login"
          );

          return;
        }


        if (
          profile.role === "admin"
        ) {

          window.location.replace(
            "/"
          );

          return;
        }


        if (
          profile.role !== "student" ||
          !profile.group_id
        ) {

          await supabase.auth.signOut();

          window.location.replace(
            "/login"
          );

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

        console.error(
          "Error verificando estudiante:",
          error
        );

        window.location.replace(
          "/login"
        );

      }

    }


    verifyStudent();


    return () => {

      mounted = false;

    };

  }, []);


  // ============================================================
  // CARGAR DATOS
  // ============================================================

  async function loadStudentData() {

    setLoading(true);

    setMessage("");


    try {

      const supabase =
        await getSupabase();


      const {
        data: userData,
      } =
        await supabase.auth.getUser();


      const user =
        userData.user;


      if (!user) {

        window.location.replace(
          "/login"
        );

        return;
      }


      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from("profiles")
          .select(
            "group_id"
          )
          .eq(
            "id",
            user.id
          )
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
        Number(
          profile.group_id
        );


      const [
        groupResult,
        stagesResult,
        workResult,
      ] =
        await Promise.all([

          supabase
            .from("groups")
            .select(
              `
              id,
              members,
              project_name,
              logo_path,
              active,
              completion_approved,
              diploma_code
              `
            )
            .eq(
              "id",
              groupId
            )
            .maybeSingle(),


          supabase
            .from("stages")
            .select(
              `
              id,
              name,
              description,
              milestone_percent
              `
            )
            .order(
              "id",
              {
                ascending: true,
              }
            ),


          supabase
            .from("group_stage_work")
            .select(
              `
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
              `
            )
            .eq(
              "group_id",
              groupId
            )
            .order(
              "stage_id",
              {
                ascending: true,
              }
            ),

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
        (
          workResult.data ??
          []
        ) as StageWork[];


      setGroup(
        loadedGroup
      );


      setStages(
        (
          stagesResult.data ??
          []
        ) as Stage[]
      );


      setWorks(
        loadedWorks
      );


      const identity =
        loadedWorks.find(
          work =>
            work.stage_id === 1
        );


      const content =
        identity?.content &&
        typeof identity.content === "object"

          ? identity.content

          : {};


      setProjectName(
        String(
          content.project_name ??
          loadedGroup.project_name ??
          ""
        )
      );


      setMembers(
        String(
          content.members ??
          loadedGroup.members ??
          ""
        )
      );


      const currentLogo =
        String(
          content.logo_path ??
          loadedGroup.logo_path ??
          ""
        );


      setLogoPath(
        currentLogo
      );


      setStudentComment(
        identity?.student_comment ??
        ""
      );


      if (currentLogo) {

        const {
          data: signed,
          error: signedError,
        } =
          await supabase.storage
            .from("project-assets")
            .createSignedUrl(
              currentLogo,
              3600
            );


        if (
          !signedError &&
          signed?.signedUrl
        ) {

          setLogoPreview(
            signed.signedUrl
          );

        }

      } else {

        setLogoPreview("");

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

    if (!authReady) {
      return;
    }


    loadStudentData();

  }, [authReady]);


  // ============================================================
  // SUBIR LOGO
  // ============================================================

  async function uploadLogo(
    event: ChangeEvent<HTMLInputElement>
  ) {

    const file =
      event.target.files?.[0];


    if (
      !file ||
      !group
    ) {
      return;
    }


    setMessage("");


    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

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

      const supabase =
        await getSupabase();


      let extension =
        "png";


      if (
        file.type === "image/jpeg"
      ) {
        extension = "jpg";
      }


      if (
        file.type === "image/webp"
      ) {
        extension = "webp";
      }


      const fileName =
        `${crypto.randomUUID()}.${extension}`;


      const path =
        `${group.id}/1/${fileName}`;


      const {
        error,
      } =
        await supabase.storage
          .from("project-assets")
          .upload(
            path,
            file,
            {
              upsert: false,
              contentType:
                file.type,
            }
          );


      if (error) {
        throw error;
      }


      setLogoPath(
        path
      );


      setLogoPreview(
        URL.createObjectURL(
          file
        )
      );


      setMessage(
        "Logo cargado. Recuerda guardar el borrador o enviar la etapa."
      );


    } catch (error) {

      console.error(
        error
      );


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


  // ============================================================
  // GUARDAR ETAPA 1
  // ============================================================

  async function saveIdentity(
    submit: boolean
  ) {

    if (
      !group ||
      !stage1
    ) {
      return;
    }


    if (!stage1Editable) {

      setMessage(
        "Esta etapa está bloqueada."
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


      const payload: Record<string, any> = {

        content: {
          project_name:
            cleanProjectName,

          members:
            cleanMembers,

          logo_path:
            logoPath,
        },

        student_comment:
          studentComment.trim(),

      };


      if (submit) {

        payload.status =
          "submitted";

      }


      const {
        error,
      } =
        await supabase
          .from("group_stage_work")
          .update(
            payload
          )
          .eq(
            "group_id",
            group.id
          )
          .eq(
            "stage_id",
            1
          );


      if (error) {
        throw error;
      }


      setMessage(

        submit

          ? "Etapa 1 enviada al profesor. Ahora quedó bloqueada."

          : "Borrador guardado correctamente."

      );


      await loadStudentData();


    } catch (error) {

      console.error(
        error
      );


      setMessage(

        error instanceof Error

          ? error.message

          : "No se pudo guardar la etapa."

      );


    } finally {

      setSaving(false);

    }

  }


  // ============================================================
  // CERRAR SESIÓN
  // ============================================================

  async function logout() {

    const supabase =
      await getSupabase();


    await supabase.auth.signOut();


    window.location.replace(
      "/login"
    );

  }


  // ============================================================
  // PANTALLA DE VERIFICACIÓN
  // ============================================================

  if (!authReady) {

    return (

      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background:
            "linear-gradient(135deg, #f5f7ff 0%, #eef9f7 100%)",
          fontFamily:
            "Arial, sans-serif",
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

          Verificando acceso...

        </div>

      </main>

    );

  }


  if (loading) {

    return (

      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f7f8fc",
          fontFamily:
            "Arial, sans-serif",
        }}
      >

        Cargando tu proyecto...

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
          padding: 24,
          background: "#f7f8fc",
          fontFamily:
            "Arial, sans-serif",
        }}
      >

        <section
          style={{
            maxWidth: 520,
            background: "white",
            padding: 30,
            borderRadius: 24,
            textAlign: "center",
          }}
        >

          <h1>
            Grupo no disponible
          </h1>

          <p>
            {message ||
              "Consulta con el profesor para habilitar tu grupo."}
          </p>

          <Button
            onClick={logout}
          >

            Cerrar sesión

          </Button>

        </section>

      </main>

    );

  }


  // ============================================================
  // PANEL DEL ESTUDIANTE
  // ============================================================

  return (

    <main
      style={{
        minHeight: "100vh",
        background:
          "#f7f8fc",
        fontFamily:
          "Arial, sans-serif",
      }}
    >

      {/* ===================================================== */}
      {/* HEADER */}
      {/* ===================================================== */}

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
            "12px clamp(18px, 5vw, 70px)",
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#374151",
            }}
          >

            <UserRound size={19} />

            <span>
              {displayName}
            </span>

          </div>


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
          width: "min(1180px, 92%)",
          margin: "0 auto",
          padding:
            "34px 0 60px",
        }}
      >

        {/* =================================================== */}
        {/* BIENVENIDA */}
        {/* =================================================== */}

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
              boxShadow:
                "0 16px 35px rgba(76,63,152,.18)",
            }}
          >

            <small
              style={{
                opacity: 0.84,
                fontWeight: 700,
              }}
            >

              GRUPO {group.id}

            </small>


            <h1
              style={{
                margin:
                  "10px 0 8px",
                fontSize: 30,
              }}
            >

              {
                group.project_name ||
                projectName ||
                "Tu proyecto de IA"
              }

            </h1>


            <p
              style={{
                margin: 0,
                opacity: 0.9,
              }}
            >

              {members ||
                group.members ||
                "Integrantes por definir"}

            </p>

          </article>


          <article
            style={{
              background: "white",
              borderRadius: 26,
              padding: 28,
              boxShadow:
                "0 14px 35px rgba(31,41,55,.07)",
            }}
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
                marginBottom: 14,
              }}
            >

              <div>

                <small
                  style={{
                    color:
                      "#6b7280",
                  }}
                >

                  NOTA ACTUAL

                </small>


                <strong
                  style={{
                    display:
                      "block",
                    fontSize: 28,
                    marginTop: 4,
                  }}
                >

                  {grade}/20

                </strong>

              </div>


              <div
                style={{
                  fontSize: 28,
                }}
              >

                {progress === 100
                  ? "🏆"
                  : "🚀"}

              </div>

            </div>


            <Progress
              value={progress}
            />


            <p
              style={{
                color: "#6b7280",
                marginBottom: 0,
              }}
            >

              Progreso general:{" "}
              <strong
                style={{
                  color:
                    "#1f2937",
                }}
              >

                {progress}%

              </strong>

            </p>

          </article>

        </section>


        {/* =================================================== */}
        {/* MENSAJE */}
        {/* =================================================== */}

        {
          message && (

            <button
              onClick={
                () =>
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

          )
        }


        {/* =================================================== */}
        {/* CAMINO RECORRIDO */}
        {/* =================================================== */}

        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: 26,
            marginBottom: 24,
            boxShadow:
              "0 14px 35px rgba(31,41,55,.06)",
          }}
        >

          <div
            style={{
              marginBottom: 20,
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

            <h2
              style={{
                margin:
                  "7px 0 5px",
              }}
            >

              Camino recorrido

            </h2>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
              }}
            >

              Cada etapa vale hasta
              4 puntos.

            </p>

          </div>


          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(175px,1fr))",
              gap: 12,
            }}
          >

            {
              stages.map(
                stage => {

                  const work =
                    works.find(
                      item =>
                        item.stage_id ===
                        stage.id
                    );


                  const status =
                    work?.status ??
                    "locked";


                  const info =
                    STATUS_DATA[
                      status
                    ];


                  return (

                    <article
                      key={stage.id}
                      style={{
                        border:
                          "1px solid #e5e7eb",
                        borderRadius: 18,
                        padding: 16,
                        minHeight: 145,
                        background:
                          status === "approved"
                            ? "#f0fdf8"
                            : "white",
                      }}
                    >

                      <div
                        style={{
                          fontSize: 24,
                          marginBottom: 9,
                        }}
                      >

                        {info.icon}

                      </div>


                      <small
                        style={{
                          color:
                            "#6b7280",
                        }}
                      >

                        ETAPA {stage.id}

                      </small>


                      <strong
                        style={{
                          display:
                            "block",
                          margin:
                            "5px 0 8px",
                        }}
                      >

                        {stage.name}

                      </strong>


                      <span
                        style={{
                          display:
                            "inline-block",
                          borderRadius: 999,
                          padding:
                            "5px 9px",
                          fontSize: 11,
                          fontWeight: 700,
                          background:
                            info.background,
                          color:
                            info.color,
                        }}
                      >

                        {info.label}

                      </span>


                      <p
                        style={{
                          fontSize: 12,
                          color:
                            "#6b7280",
                          marginBottom: 0,
                        }}
                      >

                        {numeric(
                          work?.score
                        )}/4 puntos

                      </p>

                    </article>

                  );

                }
              )
            }

          </div>

        </section>


        {/* =================================================== */}
        {/* ETAPA 1 */}
        {/* =================================================== */}

        {
          stage1 && (

            <section
              style={{
                background: "white",
                borderRadius: 24,
                padding:
                  "clamp(20px,4vw,32px)",
                marginBottom: 24,
                boxShadow:
                  "0 14px 35px rgba(31,41,55,.06)",
              }}
            >

              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  gap: 18,
                  alignItems:
                    "flex-start",
                  flexWrap: "wrap",
                  marginBottom: 26,
                }}
              >

                <div>

                  <small
                    style={{
                      color:
                        "#6c56d9",
                      fontWeight: 800,
                    }}
                  >

                    ETAPA 1 · 4 PUNTOS

                  </small>


                  <h2
                    style={{
                      margin:
                        "7px 0 6px",
                    }}
                  >

                    Identidad del proyecto

                  </h2>


                  <p
                    style={{
                      margin: 0,
                      color:
                        "#6b7280",
                    }}
                  >

                    Define el nombre,
                    integrantes y logo
                    oficial de tu proyecto.

                  </p>

                </div>


                <span
                  style={{
                    borderRadius: 999,
                    padding:
                      "8px 12px",
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


              {
                stage1.teacher_comment && (

                  <div
                    style={{
                      background:
                        stage1.status ===
                        "correction_required"

                          ? "#fff1f2"

                          : "#f3f4f6",

                      borderRadius: 15,
                      padding: 15,
                      marginBottom: 22,
                    }}
                  >

                    <strong>
                      💬 Comentario del profesor
                    </strong>

                    <p
                      style={{
                        margin:
                          "6px 0 0",
                      }}
                    >

                      {
                        stage1.teacher_comment
                      }

                    </p>

                  </div>

                )
              }


              <form
                onSubmit={
                  (
                    event:
                      FormEvent<HTMLFormElement>
                  ) => {

                    event.preventDefault();

                    saveIdentity(
                      false
                    );

                  }
                }
                style={{
                  display: "grid",
                  gap: 20,
                }}
              >

                <label
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >

                  <strong>
                    Nombre del proyecto
                  </strong>

                  <input
                    value={
                      projectName
                    }
                    disabled={
                      !stage1Editable
                    }
                    onChange={
                      event =>
                        setProjectName(
                          event.target.value
                        )
                    }
                    maxLength={120}
                    placeholder="Ej. PetID AI"
                    style={{
                      minHeight: 46,
                      border:
                        "1px solid #d1d5db",
                      borderRadius: 12,
                      padding:
                        "0 14px",
                      fontSize: 15,
                      background:
                        stage1Editable
                          ? "white"
                          : "#f3f4f6",
                    }}
                  />

                </label>


                <label
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >

                  <strong>
                    Integrantes
                  </strong>

                  <input
                    value={
                      members
                    }
                    disabled={
                      !stage1Editable
                    }
                    onChange={
                      event =>
                        setMembers(
                          event.target.value
                        )
                    }
                    maxLength={500}
                    placeholder="Nombre de los integrantes"
                    style={{
                      minHeight: 46,
                      border:
                        "1px solid #d1d5db",
                      borderRadius: 12,
                      padding:
                        "0 14px",
                      fontSize: 15,
                      background:
                        stage1Editable
                          ? "white"
                          : "#f3f4f6",
                    }}
                  />

                </label>


                <div>

                  <strong
                    style={{
                      display: "block",
                      marginBottom: 8,
                    }}
                  >

                    Logo del proyecto

                  </strong>


                  <div
                    style={{
                      border:
                        "1px dashed #c7c9d4",
                      borderRadius: 18,
                      padding: 20,
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 18,
                      flexWrap: "wrap",
                    }}
                  >

                    <div
                      style={{
                        width: 92,
                        height: 92,
                        borderRadius: 18,
                        background:
                          "#f3f4f6",
                        display: "grid",
                        placeItems:
                          "center",
                        overflow:
                          "hidden",
                      }}
                    >

                      {
                        logoPreview ? (

                          <img
                            src={
                              logoPreview
                            }
                            alt="Logo del proyecto"
                            style={{
                              width:
                                "100%",
                              height:
                                "100%",
                              objectFit:
                                "cover",
                            }}
                          />

                        ) : (

                          <ImagePlus
                            size={30}
                            color="#8b8ea3"
                          />

                        )
                      }

                    </div>


                    <div>

                      <label>

                        <input
                          type="file"
                          hidden
                          disabled={
                            !stage1Editable ||
                            uploading
                          }
                          accept="image/png,image/jpeg,image/webp"
                          onChange={
                            uploadLogo
                          }
                        />

                        <span
                          style={{
                            display:
                              "inline-flex",
                            alignItems:
                              "center",
                            gap: 7,
                            border:
                              "1px solid #d1d5db",
                            borderRadius: 10,
                            padding:
                              "9px 13px",
                            cursor:
                              stage1Editable
                                ? "pointer"
                                : "not-allowed",
                            fontWeight:
                              700,
                          }}
                        >

                          <Upload
                            size={17}
                          />

                          {
                            uploading
                              ? "Subiendo..."
                              : "Subir logo"
                          }

                        </span>

                      </label>


                      <small
                        style={{
                          display:
                            "block",
                          marginTop: 8,
                          color:
                            "#6b7280",
                        }}
                      >

                        PNG, JPG o WebP · máximo 5 MB

                      </small>

                    </div>

                  </div>

                </div>


                <label
                  style={{
                    display: "grid",
                    gap: 7,
                  }}
                >

                  <strong>
                    Comentario para el profesor
                  </strong>

                  <textarea
                    value={
                      studentComment
                    }
                    disabled={
                      !stage1Editable
                    }
                    onChange={
                      event =>
                        setStudentComment(
                          event.target.value
                        )
                    }
                    maxLength={4000}
                    rows={3}
                    placeholder="Opcional: explica algún detalle de tu entrega."
                    style={{
                      border:
                        "1px solid #d1d5db",
                      borderRadius: 12,
                      padding: 14,
                      fontSize: 15,
                      resize:
                        "vertical",
                      background:
                        stage1Editable
                          ? "white"
                          : "#f3f4f6",
                    }}
                  />

                </label>


                {
                  stage1Editable ? (

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

                        <FileText
                          size={17}
                        />

                        {
                          saving
                            ? "Guardando..."
                            : "Guardar borrador"
                        }

                      </Button>


                      <Button
                        type="button"
                        disabled={
                          saving ||
                          uploading
                        }
                        onClick={
                          () =>
                            saveIdentity(
                              true
                            )
                        }
                      >

                        <Send
                          size={17}
                        />

                        Enviar al profesor

                      </Button>

                    </div>

                  ) : (

                    <div
                      style={{
                        background:
                          "#f8fafc",
                        borderRadius: 14,
                        padding: 15,
                        display: "flex",
                        gap: 10,
                        alignItems:
                          "center",
                      }}
                    >

                      {
                        stage1.status ===
                        "approved"

                          ? (
                            <CheckCircle2
                              color="#059669"
                            />
                          )

                          : (
                            <Lock
                              color="#6b7280"
                            />
                          )
                      }


                      <div>

                        <strong>

                          {
                            stage1.status ===
                            "approved"

                              ? `Etapa aprobada · ${numeric(
                                  stage1.score
                                )}/4 puntos`

                              : "Etapa bloqueada"
                          }

                        </strong>


                        <small
                          style={{
                            display:
                              "block",
                            marginTop: 3,
                            color:
                              "#6b7280",
                          }}
                        >

                          {
                            stage1.status ===
                            "submitted"

                              ? "Tu profesor está revisando esta entrega."

                              : stage1.status ===
                                "approved"

                              ? "La Etapa 2 se desbloquea automáticamente."

                              : "Espera las indicaciones del profesor."
                          }

                        </small>

                      </div>

                    </div>

                  )
                }

              </form>

            </section>

          )
        }


        {/* =================================================== */}
        {/* ETAPAS 2–5 */}
        {/* =================================================== */}

        <section
          style={{
            background: "white",
            borderRadius: 24,
            padding: 26,
            boxShadow:
              "0 14px 35px rgba(31,41,55,.06)",
          }}
        >

          <h2
            style={{
              marginTop: 0,
            }}
          >

            Próximas etapas

          </h2>


          <div
            style={{
              display: "grid",
              gap: 12,
            }}
          >

            {
              stages
                .filter(
                  stage =>
                    stage.id > 1
                )
                .map(
                  stage => {

                    const work =
                      works.find(
                        item =>
                          item.stage_id ===
                          stage.id
                      );


                    const status =
                      work?.status ??
                      "locked";


                    const info =
                      STATUS_DATA[
                        status
                      ];


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
                          alignItems:
                            "center",
                        }}
                      >

                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 13,
                            display: "grid",
                            placeItems:
                              "center",
                            background:
                              info.background,
                          }}
                        >

                          {
                            status ===
                            "locked"

                              ? <Lock size={19} />

                              : status ===
                                "correction_required"

                              ? <RefreshCw size={19} />

                              : <ChevronRight size={19} />
                          }

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
                              color:
                                "#6b7280",
                              fontSize:
                                13,
                            }}
                          >

                            {stage.description}

                          </p>

                        </div>


                        <span
                          style={{
                            borderRadius: 999,
                            padding:
                              "6px 10px",
                            fontSize: 11,
                            fontWeight: 700,
                            background:
                              info.background,
                            color:
                              info.color,
                          }}
                        >

                          {info.icon}{" "}
                          {info.label}

                        </span>

                      </article>

                    );

                  }
                )
            }

          </div>

        </section>


        {
          group.completion_approved && (

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

                Alcanzaron el 100 % y el profesor aprobó oficialmente la culminación.

              </p>


              {
                group.diploma_code && (

                  <small>

                    Código de diploma:{" "}
                    <strong>
                      {group.diploma_code}
                    </strong>

                  </small>

                )
              }

            </section>

          )
        }

      </div>

    </main>

  );

}
