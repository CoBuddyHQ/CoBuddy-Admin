'use client';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/api/client';

export function CityPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const query = useQuery({
    queryKey: ['workflow-cities'],
    queryFn: async () =>
      (
        await axios.get<{ data: { id: string; name: { en?: string }; state: string }[] }>(
          '/admin-options/cities',
        )
      ).data.data,
  });
  return (
    <div className="space-y-1">
      <select
        aria-label="City"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border rounded-md px-3 py-2 w-full bg-background"
        disabled={query.isLoading || query.isError}
      >
        <option value="">Select city</option>
        {query.data?.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name.en ?? city.id} · {city.state}
          </option>
        ))}
      </select>
      {query.isError && (
        <button
          type="button"
          className="text-sm text-destructive"
          onClick={() => void query.refetch()}
        >
          Could not load cities. Retry
        </button>
      )}
    </div>
  );
}
