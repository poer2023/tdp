import { GET as localizedGet } from "../../[locale]/m/rss.xml/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request, _ctx: { params: { locale: string } }) {
  void req;
  return localizedGet();
}
