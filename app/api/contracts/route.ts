import { NextResponse } from 'next/server';
import { loadHistoricalEvents } from '@/lib/server/history';
import { deriveContractWindows } from '@/lib/intelligence/contracts';
export const dynamic='force-dynamic';
export async function GET(){
  const history=await loadHistoricalEvents(365*6);
  return NextResponse.json({historyEnabled:history.enabled,reason:history.reason,disclaimer:'Contract Radar uppskattar framtida bevakningsfönster utifrån observerad historik. Kontrollera alltid avtal, optioner och tilldelningsunderlag.',windows:history.enabled?deriveContractWindows(history.events):[]});
}
