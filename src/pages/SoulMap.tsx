import { SoulMap } from '../components/map/SoulMap';

export default function SoulMapPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Géolocalisation</h1>
      <SoulMap />
    </div>
  );
}