"use client";
import {useWorkspace} from "./WorkspaceProvider";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import {demoDefaults,type DemoValues} from "./synthetic-config";
export type SyntheticSnapshot={settings:DemoValues;version:number;updatedAt:string|null;writable:boolean};
const initial:SyntheticSnapshot={settings:demoDefaults,version:0,updatedAt:null,writable:false};
const SyntheticContext=createContext({snapshot:initial,loading:true,error:"",refresh:async()=>{},apply:(snapshot:SyntheticSnapshot)=>{void snapshot;}});
export function SyntheticProvider({children}:{children:ReactNode}) {
 const {api}=useWorkspace();
 const [snapshot,apply]=useState(initial);const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const refresh=useCallback(async()=>{try{const r=await fetch(api("/api/synthetic"),{cache:"no-store"});const data=await r.json();if(!r.ok)throw new Error(data.error);apply(data);setError("");}catch{setError("Demo figures could not be refreshed. Showing the last available demo values.");}finally{setLoading(false);}},[api]);
 useEffect(()=>{queueMicrotask(()=>{void refresh();});const reload=()=>{void refresh();};window.addEventListener("focus",reload);return()=>window.removeEventListener("focus",reload);},[refresh]);
 return <SyntheticContext.Provider value={{snapshot,loading,error,refresh,apply}}>{children}</SyntheticContext.Provider>;
}
export const useSynthetic=()=>useContext(SyntheticContext);
