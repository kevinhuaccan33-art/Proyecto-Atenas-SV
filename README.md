# Proyecto Atenas SV

Organizador escolar de proyectos tecnológicos y aplicaciones estudiantiles. Permite crear fichas por grupo, registrar etapas y porcentajes de avance, enlazar la aplicación creada por cada equipo y guardar evidencias fotográficas.

## Tecnologías

- React 19 + TypeScript
- Next.js/Vinext
- Cloudflare D1 para proyectos y avances
- Cloudflare R2 para imágenes
- Drizzle para las migraciones de la base de datos

## Desarrollo local

```bash
npm install
npm run dev
```

## Preparación de la base de datos

El esquema está en `db/schema.ts`. Después de modificarlo, genera la migración:

```bash
npm run db:generate
```

## Publicación desde GitHub y Cloudflare

1. Crea un repositorio público llamado `proyecto-atenas-sv`.
2. Sube el contenido de este proyecto a la rama `main`.
3. En Cloudflare, abre **Workers & Pages** y conecta el repositorio como un nuevo Worker. Cloudflare recomienda Workers para aplicaciones nuevas con funciones y almacenamiento.
4. Configura el comando de construcción como `npm run build`.
5. Crea una base D1 y enlázala con el nombre `DB`.
6. Crea un bucket R2 y enlázalo con el nombre `BUCKET`.
7. Publica y verifica la dirección gratuita terminada en `workers.dev`.

## Privacidad

El repositorio puede ser público porque contiene solamente código. Los proyectos, avances e imágenes se guardan en D1 y R2 y no forman parte del repositorio.
