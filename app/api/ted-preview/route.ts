import { NextResponse } from "next/server";
import { fetchTedWasteNotices, DEFAULT_TED_WASTE_QUERY } from "@/lib/intelligence/ted";
export const dynamic="force-dynamic";
export async function GET(){
  const result=await fetchTedWasteNotices();
  return NextResponse.json({
    mode:"ted-preview-v0.6",
    defaultQuery:DEFAULT_TED_WASTE_QUERY,
    disclaimer:"Standardfrågan använder TED:s officiella expertsyntax: svensk beställare + CPV-trädet 905* (avfallsrelaterade tjänster). TED_EXPERT_QUERY kan ersätta den vid behov.",
    ...result,
  });
}
