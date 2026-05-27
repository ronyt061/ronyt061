import { listAssets } from "@/lib/repo/assets";
import { AssetsView } from "@/components/AssetsView";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const assets = listAssets();
  return <AssetsView initial={assets} />;
}
