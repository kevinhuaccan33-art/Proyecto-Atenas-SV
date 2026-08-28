"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, FolderKanban, Home, ImagePlus, LayoutGrid, Lightbulb, ListChecks, Menu, Plus, Search, Sparkles, Users, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type Project = { id:number|string; title:string; team:string; members:string[]; progress:number; accent:string; soft:string; stage:string; update?:string; updatedAt?:string; icon:string; summary?:string; appUrl?:string; evidenceCount?:number; steps:{label:string;done:boolean;note?:string}[] };

const sampleProjects: Project[] = [
  { id:1,title:"EcoAlerta",team:"Guardianes Verdes",members:["Valeria","Mateo"],progress:78,accent:"#6c56d9",soft:"#eeeafd",stage:"Prototipo",update:"Hoy, 10:30",icon:"🌱",steps:[{label:"Problema",done:true},{label:"Beneficiarios",done:true},{label:"Solución",done:true},{label:"Prototipo",done:true},{label:"Producto final",done:false}] },
  { id:2,title:"AquaBot",team:"TecnoOcéano",members:["Lucía","Diego"],progress:62,accent:"#2388d9",soft:"#e7f4ff",stage:"Diseño",update:"Ayer, 16:15",icon:"💧",steps:[{label:"Problema",done:true},{label:"Beneficiarios",done:true},{label:"Solución",done:true},{label:"Prototipo",done:false},{label:"Producto final",done:false}] },
  { id:3,title:"AprendeYa",team:"Mentes Creativas",members:["Sofía","Renato"],progress:45,accent:"#f39a32",soft:"#fff2df",stage:"Idea y solución",update:"26 ago., 14:20",icon:"🧠",steps:[{label:"Problema",done:true},{label:"Beneficiarios",done:true},{label:"Solución",done:false},{label:"Prototipo",done:false},{label:"Producto final",done:false}] },
];

function ProjectCard({project,onOpen}:{project:Project;onOpen:()=>void}) {
  return <article className="project-card" style={{"--accent":project.accent,"--soft":project.soft} as React.CSSProperties}>
    <div className="card-head"><div className="project-icon">{project.icon}</div><span className="stage-pill">{project.stage}</span></div>
    <div><p className="team-name">{project.team}</p><h3>{project.title}</h3><p className="members"><Users /> {project.members.join(" · ")}</p></div>
    <div className="progress-block"><div className="progress-label"><span>Avance general</span><strong>{project.progress}%</strong></div><Progress value={project.progress} className="project-progress" /></div>
    <div className="card-foot"><span>{project.update?`Actualizado ${project.update}`:"Ficha del proyecto"}</span><button onClick={onOpen} aria-label={`Ver proyecto ${project.title}`}>Ver proyecto <ChevronRight /></button></div>
  </article>;
}

export default function HomePage() {
  const [projects,setProjects]=useState<Project[]>(sampleProjects);
  const [activeProject,setActiveProject]=useState<Project|null>(null);
  const [query,setQuery]=useState("");
  const [mobileNav,setMobileNav]=useState(false);
  const [createOpen,setCreateOpen]=useState(false);
  const [updateOpen,setUpdateOpen]=useState(false);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  const fileInput=useRef<HTMLInputElement>(null);

  useEffect(()=>{fetch("/api/projects").then(response=>response.ok?response.json():Promise.reject()).then(data=>{if(data.projects?.length)setProjects(data.projects)}).catch(()=>undefined)},[]);
  const visibleProjects=useMemo(()=>projects.filter(p=>`${p.title} ${p.team} ${p.members.join(" ")}`.toLowerCase().includes(query.toLowerCase())),[query]);

  async function createProject(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); setSaving(true); setNotice("");
    const form=new FormData(event.currentTarget);
    const payload={title:String(form.get("title")||""),team:String(form.get("team")||""),members:String(form.get("members")||"").split(","),summary:String(form.get("summary")||""),appUrl:String(form.get("appUrl")||""),icon:String(form.get("icon")||"💡")};
    try{const response=await fetch("/api/projects",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok)throw new Error(data.error);setProjects(current=>[data.project,...current.filter(project=>!sampleProjects.some(sample=>sample.id===project.id))]);setCreateOpen(false);setNotice("Proyecto creado correctamente.");}
    catch(error){setNotice(error instanceof Error?error.message:"No se pudo crear el proyecto.")}finally{setSaving(false)}
  }

  async function registerUpdate(event:FormEvent<HTMLFormElement>){
    event.preventDefault(); if(!activeProject)return; setSaving(true); setNotice("");
    const form=new FormData(event.currentTarget);const progress=Number(form.get("progress"));
    try{const response=await fetch(`/api/projects/${activeProject.id}/updates`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:form.get("title"),detail:form.get("detail"),stage:form.get("stage"),progress})});const data=await response.json();if(!response.ok)throw new Error(data.error);setProjects(current=>current.map(project=>project.id===activeProject.id?{...project,progress,stage:String(form.get("stage"))}:project));setActiveProject(current=>current?{...current,progress,stage:String(form.get("stage"))}:current);setUpdateOpen(false);setNotice("Avance registrado.");}
    catch(error){setNotice(error instanceof Error?error.message:"No se pudo registrar el avance.")}finally{setSaving(false)}
  }

  async function uploadEvidence(file:File){
    if(!activeProject)return; setSaving(true); setNotice("");const form=new FormData();form.append("file",file);
    try{const response=await fetch(`/api/projects/${activeProject.id}/evidence`,{method:"POST",body:form});const data=await response.json();if(!response.ok)throw new Error(data.error);setActiveProject(current=>current?{...current,evidenceCount:(current.evidenceCount??0)+1}:current);setNotice("Imagen guardada como evidencia.");}
    catch(error){setNotice(error instanceof Error?error.message:"No se pudo subir la imagen.")}finally{setSaving(false);if(fileInput.current)fileInput.current.value=""}
  }
  return <main className="app-shell">
    <aside className={mobileNav?"app-sidebar is-open":"app-sidebar"}>
      <div className="brand"><span className="brand-mark"><Sparkles /></span><div><strong>Proyecto Atenas SV</strong><small>Innovación estudiantil</small></div></div>
      <button className="close-nav" onClick={()=>setMobileNav(false)} aria-label="Cerrar menú"><X /></button>
      <nav aria-label="Navegación principal">
        <button className="nav-item active"><Home /><span>Inicio</span></button>
        <button className="nav-item"><FolderKanban /><span>Proyectos</span><span className="nav-count">6</span></button>
        <button className="nav-item"><Users /><span>Estudiantes</span></button>
        <button className="nav-item"><ImagePlus /><span>Galería</span></button>
      </nav>
      <div className="sidebar-tip"><span><Lightbulb /></span><strong>Próximo paso</strong><p>Revisar los prototipos antes del viernes.</p></div>
      <div className="teacher"><div className="teacher-avatar">KP</div><div><strong>Profesor Kevin</strong><small>Administrador</small></div></div>
    </aside>
    <section className="app-main">
      <header className="topbar">
        <button className="menu-button" onClick={()=>setMobileNav(true)} aria-label="Abrir menú"><Menu /></button>
        <label className="search-box"><Search /><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar proyecto o estudiante..." /></label>
        <button className="notification" aria-label="Notificaciones"><Bell /><span /></button>
        <Button className="primary-action" onClick={()=>setCreateOpen(true)}><Plus /> Nuevo proyecto</Button>
      </header>
      <div className="workspace">
        <section className="welcome-row"><div><p className="eyebrow">Proyecto Atenas SV · Panel general</p><h1>¡Hola, profesor Kevin! <span>👋</span></h1><p>Organiza los programas de tus estudiantes y acompaña cada nuevo avance.</p></div><div className="class-chip"><span>Proyectos tecnológicos</span><strong>{projects.length} proyectos · {projects.reduce((total,project)=>total+project.members.length,0)} estudiantes</strong></div></section>
        {notice&&<button className="notice" onClick={()=>setNotice("")} aria-label="Cerrar mensaje">{notice}<X /></button>}
        <section className="summary-grid" aria-label="Resumen del aula">
          <article><span className="summary-icon purple"><FolderKanban /></span><div><small>Proyectos activos</small><strong>{projects.length}</strong></div><em>Todos en marcha</em></article>
          <article><span className="summary-icon blue"><LayoutGrid /></span><div><small>Avance promedio</small><strong>{Math.round(projects.reduce((total,project)=>total+project.progress,0)/Math.max(projects.length,1))}%</strong></div><em>Actualizado</em></article>
          <article><span className="summary-icon orange"><ListChecks /></span><div><small>Avances por revisar</small><strong>4</strong></div><em>Requieren atención</em></article>
        </section>
        <Tabs defaultValue="todos" className="project-tabs">
          <div className="section-heading"><div><h2>Proyectos del aula</h2><p>Selecciona un grupo para ver sus etapas y evidencias.</p></div><TabsList className="filter-tabs"><TabsTrigger value="todos">Todos</TabsTrigger><TabsTrigger value="avance">En avance</TabsTrigger><TabsTrigger value="final">Finalizados</TabsTrigger></TabsList></div>
          <TabsContent value="todos"><div className="project-grid">{visibleProjects.map(p=><ProjectCard key={p.id} project={p} onOpen={()=>setActiveProject(p)} />)}{visibleProjects.length===0&&<div className="empty-state">No encontramos un proyecto con ese nombre.</div>}<button className="add-card" onClick={()=>setCreateOpen(true)}><span><Plus /></span><strong>Agregar nuevo proyecto</strong><small>Crea la ficha de otro grupo</small></button></div></TabsContent>
          <TabsContent value="avance"><div className="project-grid">{projects.map(p=><ProjectCard key={p.id} project={p} onOpen={()=>setActiveProject(p)} />)}</div></TabsContent>
          <TabsContent value="final"><div className="empty-state tall">Todavía no hay proyectos finalizados. ¡Cada avance los acerca a la meta!</div></TabsContent>
        </Tabs>
      </div>
    </section>
    {mobileNav&&<button className="nav-backdrop" aria-label="Cerrar menú" onClick={()=>setMobileNav(false)} />}
    {activeProject&&<div className="detail-overlay" role="presentation" onMouseDown={()=>setActiveProject(null)}><section className="detail-panel" role="dialog" aria-modal="true" aria-label={`Detalle de ${activeProject.title}`} onMouseDown={e=>e.stopPropagation()}>
      <button className="detail-close" onClick={()=>setActiveProject(null)} aria-label="Cerrar"><X /></button>
      <div className="detail-hero" style={{"--accent":activeProject.accent,"--soft":activeProject.soft} as React.CSSProperties}><span>{activeProject.icon}</span><div><p>{activeProject.team}</p><h2>{activeProject.title}</h2><small>{activeProject.members.join(" y ")}</small></div></div>
      <div className="detail-progress"><div><span>Progreso del proyecto</span><strong>{activeProject.progress}%</strong></div><Progress value={activeProject.progress} /></div>
      <div className="stage-list">{activeProject.steps.map((step,index)=><div className={step.done?"stage-row done":"stage-row"} key={step.label}><span>{step.done?"✓":index+1}</span><div><strong>{step.label}</strong><small>{step.done?"Etapa completada":"Pendiente por desarrollar"}</small></div></div>)}</div>
      <div className="evidence-box"><div><ImagePlus /><span><strong>Evidencias del grupo ({activeProject.evidenceCount??0})</strong><small>JPG, PNG o WebP · máximo 5 MB</small></span></div><Button variant="outline" disabled={saving} onClick={()=>fileInput.current?.click()}>Subir imágenes</Button><input ref={fileInput} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={event=>event.target.files?.[0]&&uploadEvidence(event.target.files[0])}/></div>
      {activeProject.appUrl&&<a className="app-link" href={activeProject.appUrl} target="_blank" rel="noreferrer">Abrir aplicación del grupo <ChevronRight /></a>}
      <Button className="detail-action" onClick={()=>setUpdateOpen(true)}><Plus /> Registrar nuevo avance</Button>
    </section></div>}

    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Nuevo proyecto</DialogTitle><DialogDescription>Crea la ficha del grupo y luego podrás registrar sus avances.</DialogDescription></DialogHeader><form onSubmit={createProject} className="project-form">
      <label>Nombre del proyecto<input name="title" required placeholder="Ej. EcoAlerta" /></label><label>Nombre del grupo<input name="team" required placeholder="Ej. Guardianes Verdes" /></label><label>Integrantes<input name="members" placeholder="Valeria, Mateo" /><small>Separados por comas</small></label><div className="form-row"><label>Ícono<input name="icon" defaultValue="💡" /></label><label>Enlace de la aplicación<input name="appUrl" type="url" placeholder="https://..." /></label></div><label>Descripción<textarea name="summary" rows={3} placeholder="¿Qué problema busca solucionar?" /></label><Button disabled={saving} type="submit">{saving?"Guardando...":"Crear proyecto"}</Button>
    </form></DialogContent></Dialog>

    <Dialog open={updateOpen} onOpenChange={setUpdateOpen}><DialogContent className="form-dialog"><DialogHeader><DialogTitle>Registrar avance</DialogTitle><DialogDescription>Actualiza el proceso de {activeProject?.title}.</DialogDescription></DialogHeader><form onSubmit={registerUpdate} className="project-form">
      <label>Título del avance<input name="title" required placeholder="Ej. Terminamos el primer prototipo" /></label><label>Detalle<textarea name="detail" rows={3} placeholder="Describe brevemente qué realizó el grupo" /></label><label>Etapa actual<select name="stage" defaultValue={activeProject?.stage}><option>Idea</option><option>Investigación</option><option>Diseño</option><option>Prototipo</option><option>Pruebas</option><option>Producto final</option></select></label><label>Porcentaje de avance<input name="progress" type="number" min="0" max="100" defaultValue={activeProject?.progress} required /></label><Button disabled={saving} type="submit">{saving?"Guardando...":"Guardar avance"}</Button>
    </form></DialogContent></Dialog>
  </main>;
}
