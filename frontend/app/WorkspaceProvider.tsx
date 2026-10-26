"use client";
import {createContext,useCallback,useContext,type ReactNode} from 'react';
import {campaignDefaults,type CampaignSettings} from './campaign-config';
export type WorkspaceId='climate-justice'|'violence';
export const violenceDefaults:CampaignSettings={name:'No More Violence',talent:'Global Electronic Music Industry',agency:'Re-Model Universe',topics:['#NoMoreViolence','domestic violence','violent extremism'],analysisStartDate:'2026-01-01',analysisEndDate:'2026-10-20',announcementDate:'2026-01-01',endDateMeaning:'Synthetic demonstration window; launch date not confirmed'};
const Context=createContext<WorkspaceId>('climate-justice');
export function WorkspaceProvider({id,children}:{id:WorkspaceId;children:ReactNode}){return <Context.Provider value={id}>{children}</Context.Provider>;}
export function useWorkspace(){const id=useContext(Context);const api=useCallback((path:string)=>path+(path.includes('?')?'&':'?')+'workspace='+id,[id]);return {id,synthetic:id==='violence',defaults:id==='violence'?violenceDefaults:campaignDefaults,api};}
