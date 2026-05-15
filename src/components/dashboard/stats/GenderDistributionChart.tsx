import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GenderDistributionChartProps {
  maleCount: number;
  femaleCount: number;
}

const COLORS = ['#0088FE', '#FF8042']; // Couleurs pour les hommes et les femmes

export function GenderDistributionChart({ maleCount, femaleCount }: GenderDistributionChartProps) {
  const data = [
    { name: 'Hommes', value: maleCount },
    { name: 'Femmes', value: femaleCount },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par genre</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}