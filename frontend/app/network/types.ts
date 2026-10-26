export type NetworkCategory="Culture"|"Community"|"Media"|"Creators";
export type NetworkCandidate={
 id:string;name:string;handle:string;origin:"observed"|"discovered";subtype:string;profileUrl?:string;connection:string;recommended:boolean;
 review?:{status:"pending"|"approved"|"revise"|"rejected";note:string;reviewer:string;at:string};
 category:NetworkCategory;followers:number|null;
 observedPosts:number;rationale:string;role:string;alignment:string;limitation:string;
 evidence:{url:string;label:string;checkedAt?:string;publishedAt?:string|null}[];research:{url:string;label:string;checkedAt?:string;publishedAt?:string|null}[];
 confidence:"Supported"|"Limited";researchNote:string;
};
export type NetworkSnapshot={
 campaign:string;talent:string;sourceRun:string;period:string;retrievedAt:string;researchedAt:string;expiresAt:string;
 sourcePosts:number;sourceAccounts:number;eligibleAccounts:number;
 status:string;gaps:string;methodology:string[];costEstimateUsd:number;budgetUsd:number;
 campaignIdentity:string;revision:string;candidates:NetworkCandidate[];
};
