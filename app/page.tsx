import { promises as fs } from 'fs';
import path from 'path';
import Dashboard from '@/components/Dashboard';

export const metadata = {
  title: 'Polymarket Insider Investigation',
  description: 'Analyzing trade data for Portugal Presidential Election',
};

export default async function Home() {
  let summary = [];
  try {
    const dataDirectory = path.join(process.cwd(), 'public/data');
    const fileContents = await fs.readFile(path.join(dataDirectory, 'summary.json'), 'utf8');
    summary = JSON.parse(fileContents);
  } catch (err) {
    console.error("Error reading summary.json", err);
    // Return empty or error state
  }

  return (
    <main className="min-h-screen bg-slate-950">
      <Dashboard summary={summary} />
    </main>
  );
}
