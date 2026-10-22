import { env } from "cloudflare:workers";

type Bindings = {
  SUPABASE_SECRET_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

type StudentAccount = {
  id: string;
  username: string;
  display_name: string;
  group_id: number;
  active: boolean;
};

type GroupRow = {
  id: number;
  members: string | null;
  active: boolean;
};

const SUPABASE_URL =
  "https://ozmkqjhqgakqttrhatfn.supabase.co";

function getSecretKey() {
  const bindings = env as unknown as Bindings;

  const key =
    bindings.SUPABASE_SECRET_KEY ||
    bindings.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error(
      "Falta configurar SUPABASE_SECRET_KEY en Cloudflare."
    );
  }

  return key;
}

function cleanUsername(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function validUsername(username: string) {
  return /^[a-z0-9._-]{3,32}$/.test(username);
}

function validPassword(password: string) {
  return password.length >= 8;
}

function generatePassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

  const values =
    new Uint32Array(8);

  crypto.getRandomValues(values);

  let suffix = "";

  for (const value of values) {
    suffix +=
      alphabet[
        value % alphabet.length
      ];
  }

  return `Atenas#${suffix}`;
}

async function parseError(
  response: Response
) {
  const text =
    await response.text();

  try {
    const data =
      JSON.parse(text);

    return (
      data.msg ||
      data.message ||
      data.error_description ||
      data.error ||
      text
    );
  } catch {
    return (
      text ||
      `Error ${response.status}`
    );
  }
}

/**
 * IMPORTANTE:
 * Las nuevas claves sb_secret_... NO son JWT.
 * Para llamadas administrativas las enviamos como `apikey`.
 * No las enviamos como `Authorization: Bearer sb_secret_...`.
 */
async function adminFetch(
  path: string,
  init: RequestInit = {}
) {
  const secret =
    getSecretKey();

  const headers =
    new Headers(init.headers);

  headers.set(
    "apikey",
    secret
  );

  if (
    init.body &&
    !headers.has("Content-Type")
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );
  }

  const response =
    await fetch(
      `${SUPABASE_URL}${path}`,
      {
        ...init,
        headers,
      }
    );

  if (!response.ok) {
    throw new Error(
      await parseError(response)
    );
  }

  if (
    response.status === 204
  ) {
    return null;
  }

  const text =
    await response.text();

  return text
    ? JSON.parse(text)
    : null;
}

/**
 * Verifica que quien llama al endpoint sea el profesor autenticado.
 * Aquí sí usamos:
 * - apikey: clave secreta del servidor
 * - Authorization: JWT REAL de la sesión del profesor
 */
async function requireProfessor(
  request: Request
) {
  const authorization =
    request.headers.get(
      "Authorization"
    );

  if (
    !authorization?.startsWith(
      "Bearer "
    )
  ) {
    throw new Error(
      "Sesión de profesor no válida."
    );
  }

  const token =
    authorization.slice(7);

  const secret =
    getSecretKey();

  const response =
    await fetch(
      `${SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: secret,
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  if (!response.ok) {
    throw new Error(
      "La sesión del profesor expiró."
    );
  }

  const user =
    (await response.json()) as {
      id?: string;
    };

  if (!user.id) {
    throw new Error(
      "No se pudo identificar al profesor."
    );
  }

  const profiles =
    (await adminFetch(
      `/rest/v1/profiles?id=eq.${encodeURIComponent(
        user.id
      )}&select=role,active`,
      {
        method: "GET",
      }
    )) as Array<{
      role?: string;
      active?: boolean;
    }>;

  const profile =
    profiles?.[0];

  if (
    !profile ||
    profile.role !== "admin" ||
    !profile.active
  ) {
    throw new Error(
      "Solo el profesor administrador puede gestionar usuarios."
    );
  }

  return user.id;
}

async function getAccounts() {
  return (
    (await adminFetch(
      "/rest/v1/profiles?role=eq.student&select=id,username,display_name,group_id,active&order=group_id.asc",
      {
        method: "GET",
      }
    )) as StudentAccount[]
  ) ?? [];
}

async function getGroups() {
  return (
    (await adminFetch(
      "/rest/v1/groups?select=id,members,active&order=id.asc",
      {
        method: "GET",
      }
    )) as GroupRow[]
  ) ?? [];
}

async function createAuthUser(
  email: string,
  password: string,
  username: string,
  groupId: number
) {
  return (await adminFetch(
    "/auth/v1/admin/users",
    {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
          group_id: groupId,
        },
      }),
    }
  )) as {
    id: string;
    email?: string;
  };
}

async function updateAuthPassword(
  userId: string,
  password: string
) {
  return adminFetch(
    `/auth/v1/admin/users/${encodeURIComponent(
      userId
    )}`,
    {
      method: "PUT",
      body: JSON.stringify({
        password,
      }),
    }
  );
}

async function deleteAuthUser(
  userId: string
) {
  try {
    await adminFetch(
      `/auth/v1/admin/users/${encodeURIComponent(
        userId
      )}`,
      {
        method: "DELETE",
      }
    );
  } catch {
    // Solo rollback de mejor esfuerzo.
  }
}

/**
 * Prueba REAL de usuario + contraseña contra Supabase Auth.
 * Si esta llamada falla, no mostramos la contraseña al profesor.
 */
async function verifyPasswordLogin(
  email: string,
  password: string
) {
  const secret =
    getSecretKey();

  const response =
    await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          apikey: secret,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      }
    );

  if (!response.ok) {
    throw new Error(
      `La cuenta fue creada pero Supabase no aceptó el inicio de sesión: ${await parseError(
        response
      )}`
    );
  }

  const result =
    (await response.json()) as {
      access_token?: string;
      user?: {
        id?: string;
      };
    };

  if (
    !result.access_token ||
    !result.user?.id
  ) {
    throw new Error(
      "Supabase no confirmó el acceso con la contraseña generada."
    );
  }

  return result.user.id;
}

async function createStudentAccount({
  group,
  username,
  password,
}: {
  group: GroupRow;
  username: string;
  password: string;
}) {
  if (!validUsername(username)) {
    throw new Error(
      "El usuario debe tener entre 3 y 32 caracteres y usar solo letras, números, punto, guion o guion bajo."
    );
  }

  if (!validPassword(password)) {
    throw new Error(
      "La contraseña debe tener al menos 8 caracteres."
    );
  }

  const email =
    `${username}@atenas.test`;

  const created =
    await createAuthUser(
      email,
      password,
      username,
      group.id
    );

  if (!created?.id) {
    throw new Error(
      "Supabase no devolvió el ID del usuario creado."
    );
  }

  try {
    const displayName =
      group.members?.trim()
        ? `Grupo ${group.id} - ${group.members.trim()}`
        : `Grupo ${group.id}`;

    await adminFetch(
      "/rest/v1/profiles?on_conflict=id",
      {
        method: "POST",
        headers: {
          Prefer:
            "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({
          id: created.id,
          username,
          display_name:
            displayName,
          role: "student",
          group_id: group.id,
          active: true,
        }),
      }
    );

    await adminFetch(
      `/rest/v1/groups?id=eq.${group.id}`,
      {
        method: "PATCH",
        headers: {
          Prefer:
            "return=minimal",
        },
        body: JSON.stringify({
          active: true,
        }),
      }
    );

    const verifiedUserId =
      await verifyPasswordLogin(
        email,
        password
      );

    if (
      verifiedUserId !==
      created.id
    ) {
      throw new Error(
        "La verificación de acceso devolvió un usuario diferente."
      );
    }
  } catch (error) {
    await deleteAuthUser(
      created.id
    );

    throw error;
  }

  return {
    group_id: group.id,
    username,
    password,
  };
}

async function createMissingAccounts() {
  const groups =
    await getGroups();

  const accounts =
    await getAccounts();

  const existingGroups =
    new Set(
      accounts
        .map(
          (account) =>
            Number(
              account.group_id
            )
        )
        .filter(
          Number.isFinite
        )
    );

  // El profesor pidió tener disponibles los 20 grupos.
  await adminFetch(
    "/rest/v1/groups?id=gte.1&id=lte.20",
    {
      method: "PATCH",
      headers: {
        Prefer:
          "return=minimal",
      },
      body: JSON.stringify({
        active: true,
      }),
    }
  );

  // Las cuentas existentes también quedan activas.
  await adminFetch(
    "/rest/v1/profiles?role=eq.student",
    {
      method: "PATCH",
      headers: {
        Prefer:
          "return=minimal",
      },
      body: JSON.stringify({
        active: true,
      }),
    }
  );

  const missing =
    groups.filter(
      (group) =>
        group.id >= 1 &&
        group.id <= 20 &&
        !existingGroups.has(
          group.id
        )
    );

  const credentials: Array<{
    group_id: number;
    username: string;
    password: string;
  }> = [];

  // Secuencial: más lento que paralelo, pero mucho más seguro para Auth.
  for (
    const group of missing
  ) {
    const username =
      `grupo${group.id}`;

    const password =
      generatePassword();

    const credential =
      await createStudentAccount(
        {
          group,
          username,
          password,
        }
      );

    credentials.push(
      credential
    );
  }

  return {
    credentials,
    existing:
      accounts.length,
  };
}

async function resetGroup(
  groupId: number
) {
  const groups =
    (await adminFetch(
      `/rest/v1/groups?id=eq.${groupId}&select=id`,
      {
        method: "GET",
      }
    )) as Array<{
      id: number;
    }>;

  if (!groups?.length) {
    throw new Error(
      `No existe el Grupo ${groupId}.`
    );
  }

  // Borramos las cinco filas completas.
  // Esto evita el trigger que impide reducir notas ya registradas.
  await adminFetch(
    `/rest/v1/group_stage_work?group_id=eq.${groupId}`,
    {
      method: "DELETE",
      headers: {
        Prefer:
          "return=representation",
      },
    }
  );

  // Restauramos la ficha del grupo.
  await adminFetch(
    `/rest/v1/groups?id=eq.${groupId}`,
    {
      method: "PATCH",
      headers: {
        Prefer:
          "return=minimal",
      },
      body: JSON.stringify({
        project_name: null,
        logo_path: null,
        completion_approved:
          false,
        completion_approved_at:
          null,
        diploma_code: null,
        active: true,
      }),
    }
  );

  const freshStages =
    [1, 2, 3, 4, 5].map(
      (stageId) => ({
        group_id: groupId,
        stage_id: stageId,
        status:
          stageId === 1
            ? "editable"
            : "locked",
        content: {},
        evidence_url: null,
        student_comment: "",
        score: 0,
        teacher_comment: "",
        revision: 0,
        submitted_at: null,
        reviewed_at: null,
      })
    );

  await adminFetch(
    "/rest/v1/group_stage_work",
    {
      method: "POST",
      headers: {
        Prefer:
          "return=minimal",
      },
      body: JSON.stringify(
        freshStages
      ),
    }
  );

  // Verificación posterior: si no quedó limpio, reportamos error.
  const verification =
    (await adminFetch(
      `/rest/v1/group_stage_work?group_id=eq.${groupId}&select=stage_id,status,score,content,student_comment,teacher_comment&order=stage_id.asc`,
      {
        method: "GET",
      }
    )) as Array<{
      stage_id: number;
      status: string;
      score: number | string;
      content: Record<string, unknown> | null;
      student_comment: string | null;
      teacher_comment: string | null;
    }>;

  if (
    verification.length !== 5
  ) {
    throw new Error(
      `El reinicio no quedó completo: se encontraron ${verification.length} etapas en vez de 5.`
    );
  }

  for (
    const row of verification
  ) {
    const expectedStatus =
      row.stage_id === 1
        ? "editable"
        : "locked";

    if (
      row.status !==
        expectedStatus ||
      Number(row.score ?? 0) !==
        0
    ) {
      throw new Error(
        `La Etapa ${row.stage_id} no quedó limpia correctamente.`
      );
    }
  }

  return verification;
}

export async function GET(
  request: Request
) {
  try {
    await requireProfessor(
      request
    );

    const accounts =
      await getAccounts();

    return Response.json({
      accounts,
    });
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudieron cargar las cuentas.",
      },
      {
        status: 401,
      }
    );
  }
}

export async function POST(
  request: Request
) {
  try {
    await requireProfessor(
      request
    );

    const body =
      (await request.json()) as Record<
        string,
        any
      >;

    const action =
      String(
        body.action ?? ""
      );

    if (
      action ===
      "bulk_create"
    ) {
      const result =
        await createMissingAccounts();

      return Response.json(
        result
      );
    }

    if (
      action ===
      "create_account"
    ) {
      const groupId =
        Number(
          body.groupId
        );

      if (
        !Number.isInteger(
          groupId
        ) ||
        groupId < 1 ||
        groupId > 20
      ) {
        throw new Error(
          "Grupo inválido."
        );
      }

      const username =
        cleanUsername(
          body.username
        );

      const password =
        String(
          body.password ?? ""
        );

      const groups =
        (await adminFetch(
          `/rest/v1/groups?id=eq.${groupId}&select=id,members,active`,
          {
            method: "GET",
          }
        )) as GroupRow[];

      const group =
        groups?.[0];

      if (!group) {
        throw new Error(
          `No existe el Grupo ${groupId}.`
        );
      }

      const existing =
        (await adminFetch(
          `/rest/v1/profiles?group_id=eq.${groupId}&role=eq.student&select=id`,
          {
            method: "GET",
          }
        )) as Array<{
          id: string;
        }>;

      if (existing?.length) {
        throw new Error(
          `El Grupo ${groupId} ya tiene una cuenta asignada. Usa "Nueva contraseña" si quieres cambiar su acceso.`
        );
      }

      const credential =
        await createStudentAccount(
          {
            group,
            username,
            password,
          }
        );

      return Response.json({
        credential,
        verified: true,
      });
    }

    if (
      action ===
      "reset_password"
    ) {
      const userId =
        String(
          body.userId ?? ""
        );

      if (!userId) {
        throw new Error(
          "Falta el usuario."
        );
      }

      const profiles =
        (await adminFetch(
          `/rest/v1/profiles?id=eq.${encodeURIComponent(
            userId
          )}&role=eq.student&select=id,username,group_id`,
          {
            method: "GET",
          }
        )) as Array<{
          id: string;
          username: string;
          group_id: number;
        }>;

      const profile =
        profiles?.[0];

      if (!profile) {
        throw new Error(
          "No encontramos esa cuenta de estudiante."
        );
      }

      const password =
        generatePassword();

      await updateAuthPassword(
        userId,
        password
      );

      const email =
        `${profile.username}@atenas.test`;

      const verifiedUserId =
        await verifyPasswordLogin(
          email,
          password
        );

      if (
        verifiedUserId !==
        profile.id
      ) {
        throw new Error(
          "La nueva contraseña no pudo verificarse."
        );
      }

      return Response.json({
        credential: {
          group_id:
            Number(
              profile.group_id
            ),
          username:
            profile.username,
          password,
        },
        verified: true,
      });
    }

    if (
      action ===
      "set_account_active"
    ) {
      const userId =
        String(
          body.userId ?? ""
        );

      const active =
        body.active === true;

      if (!userId) {
        throw new Error(
          "Falta el usuario."
        );
      }

      await adminFetch(
        `/rest/v1/profiles?id=eq.${encodeURIComponent(
          userId
        )}&role=eq.student`,
        {
          method: "PATCH",
          headers: {
            Prefer:
              "return=minimal",
          },
          body: JSON.stringify({
            active,
          }),
        }
      );

      return Response.json({
        success: true,
        active,
      });
    }

    if (
      action ===
      "reset_group"
    ) {
      const groupId =
        Number(
          body.groupId
        );

      if (
        !Number.isInteger(
          groupId
        ) ||
        groupId < 1 ||
        groupId > 20
      ) {
        throw new Error(
          "Grupo inválido."
        );
      }

      const stages =
        await resetGroup(
          groupId
        );

      return Response.json({
        success: true,
        stages,
      });
    }

    return Response.json(
      {
        error:
          "Acción de usuario no reconocida.",
      },
      {
        status: 400,
      }
    );
  } catch (error) {
    console.error(
      "Admin users API:",
      error
    );

    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo completar la operación.",
      },
      {
        status: 400,
      }
    );
  }
}
