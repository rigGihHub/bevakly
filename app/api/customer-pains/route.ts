import { NextResponse } from "next/server";
import { deriveCustomerPains } from "@/lib/intelligence/customer-pains";
import { loadHistoricalEvents } from "@/lib/server/history";

export const dynamic = "force-dynamic";

export async function GET(){
  try{
    const history = await loadHistoricalEvents(120);
    if(!history.enabled){
      return NextResponse.json({ pains:[], reason:history.reason });
    }
    return NextResponse.json({ pains:deriveCustomerPains(history.events), reason:null });
  }catch(error){
    return NextResponse.json({ pains:[], reason:error instanceof Error?error.message:"Okänt fel" },{status:500});
  }
}
