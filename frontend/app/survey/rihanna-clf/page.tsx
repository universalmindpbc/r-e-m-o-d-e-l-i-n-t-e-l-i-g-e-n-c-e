import Survey from "./Survey";
export const metadata={title:"Music and charitable organisations | Re-Model Research",description:"A short independent research survey.",robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const query=await searchParams;return <Survey preview={query.preview==="1"}/>;}
