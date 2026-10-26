"use client";
import {useWorkspace} from "./WorkspaceProvider";
import {createContext,useCallback,useContext,useEffect,useState,type ReactNode} from "react";
import {campaignDefaults,type CampaignSettings} from "./campaign-config";
export type CampaignSnapshot={settings:CampaignSettings;version:number;updatedAt:string|null;writable:boolean};
const initial:CampaignSnapshot={settings:campaignDefaults,version:0,updatedAt:null,writable:false};
const CampaignContext=createContext({snapshot:initial,loading:true,error:"",refresh:async()=>{},apply:(snapshot:CampaignSnapshot)=>{void snapshot;}});
export function CampaignProvider({children}:{children:ReactNode}) {
 const {api,defaults}=useWorkspace();
 const [snapshot,apply]=useState({...initial,settings:defaults});const [loading,setLoading]=useState(true);const [error,setError]=useState("");
 const refresh=useCallback(async()=>{try{const r=await fetch(api("/api/campaign"),{cache:"no-store"});const data=await r.json();if(!r.ok)throw new Error(data.error);apply(data);setError("");}catch{setError("Saved settings could not be refreshed. Showing the last available settings.");}finally{setLoading(false);}},[api]);
 useEffect(()=>{queueMicrotask(()=>{void refresh();});const reload=()=>{void refresh();};window.addEventListener("focus",reload);return()=>window.removeEventListener("focus",reload);},[refresh]);
 return <CampaignContext.Provider value={{snapshot,loading,error,refresh,apply}}>{children}</CampaignContext.Provider>;
}
export const useCampaign=()=>useContext(CampaignContext);
